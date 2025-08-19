import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { uploadImage, extractPublicIdFromUrl, deleteImage } from '@/lib/cloudinary';
import { requireAdmin } from '@/lib/auth';
import { sendEmployeeEmailUpdatedNotification } from '@/lib/email';

export async function PUT(request: NextRequest) {
  try {
    // Require admin
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;
    // Connect to MongoDB
    await connectDB();

    const formData = await request.formData();
    
    // Extract form fields
    const _id = formData.get('_id') as string;
    const employeeId = formData.get('employeeId') as string;
    const name = formData.get('name') as string;
    const email = (formData.get('email') as string) || '';
    const dob = formData.get('dob') as string;
    const dateOfJoining = formData.get('dateOfJoining') as string;
    const permanentAddress = formData.get('permanentAddress') as string;
    const designation = formData.get('designation') as string;
    const department = formData.get('department') as string;
    const roles = JSON.parse(formData.get('roles') as string);
    const salary = formData.get('salary') as string;
    const status = formData.get('status') as string;
    
    // Get files
    const idCardFront = formData.get('idCardFront') as File | null;
    const idCardBack = formData.get('idCardBack') as File | null;
    const offerLetter = formData.get('offerLetter') as File | null;
    const profileImage = formData.get('profileImage') as File | null;

    // Validation
    if (!_id || !employeeId || !name || !dob || !dateOfJoining || !permanentAddress || !designation || !department || !salary || !status) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Find the employee to update
    const existingEmployee = await Employee.findById(_id);
    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Handle email change: if provided and different, ensure uniqueness and bump tokenVersion
    let willEmailChange = false;
    let newEmailNormalized: string | null = null;
    if (email && typeof email === 'string' && email.trim().toLowerCase() !== existingEmployee.email.toLowerCase()) {
      const normalized = email.trim().toLowerCase();
      // check unique
      const emailExists = await Employee.findOne({ email: normalized, _id: { $ne: _id } });
      if (emailExists) {
        return NextResponse.json(
          { error: 'Another employee already uses this email address' },
          { status: 409 }
        );
      }
      willEmailChange = true;
      newEmailNormalized = normalized;
    }

    // Check if employee ID is being changed and if it conflicts with another employee
    if (employeeId !== existingEmployee.employeeId) {
      const conflictingEmployee = await Employee.findOne({ 
        employeeId: employeeId,
        _id: { $ne: _id } // Exclude current employee
      });
      
      if (conflictingEmployee) {
        return NextResponse.json(
          { error: 'Employee ID already exists' },
          { status: 409 }
        );
      }
    }

    // Process file uploads if new files are provided
    let idCardFrontPath = existingEmployee.idCardFront;
    let idCardBackPath = existingEmployee.idCardBack;
    let offerLetterPath = existingEmployee.offerLetter;
    let profileImagePath = (existingEmployee as any).profileImage;

    if (idCardFront) {
      const bytes = await idCardFront.arrayBuffer();
      const buffer = Buffer.from(bytes);
      // delete old if cloudinary
      const oldPublicId = extractPublicIdFromUrl(String(idCardFrontPath));
      if (oldPublicId) { try { await deleteImage(oldPublicId); } catch {} }
      idCardFrontPath = await uploadImage(buffer, 'id-cards');
    }

    if (idCardBack) {
      const bytes = await idCardBack.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const oldPublicId = extractPublicIdFromUrl(String(idCardBackPath));
      if (oldPublicId) { try { await deleteImage(oldPublicId); } catch {} }
      idCardBackPath = await uploadImage(buffer, 'id-cards');
    }

    if (offerLetter) {
      const bytes = await offerLetter.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const oldPublicId = extractPublicIdFromUrl(String(offerLetterPath));
      if (oldPublicId) { try { await deleteImage(oldPublicId); } catch {} }
      offerLetterPath = await uploadImage(buffer, 'offer-letters');
    }

    if (profileImage) {
      const bytes = await profileImage.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const oldPublicId = extractPublicIdFromUrl(String(profileImagePath));
      if (oldPublicId) { try { await deleteImage(oldPublicId); } catch {} }
      profileImagePath = await uploadImage(buffer, 'profiles');
    }

    // Update employee
    // Build update object
    const updateDoc: any = {
      employeeId,
      name: name.trim(),
      dob: new Date(dob),
      dateOfJoining: new Date(dateOfJoining),
      permanentAddress: permanentAddress.trim(),
      designation: designation.trim(),
      department: department.trim(),
      roles: Array.isArray(roles) ? roles : [],
      salary: parseFloat(salary),
      status: status.trim(),
      idCardFront: idCardFrontPath,
      idCardBack: idCardBackPath,
      offerLetter: offerLetterPath,
      profileImage: profileImagePath,
    };
    if (willEmailChange && newEmailNormalized) {
      updateDoc.email = newEmailNormalized;
      updateDoc.tokenVersion = ((existingEmployee as any).tokenVersion || 0) + 1; // force logout
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      _id,
      updateDoc,
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return NextResponse.json(
        { error: 'Failed to update employee' },
        { status: 500 }
      );
    }

    // On email change, notify the new email and inform about logout
    if (updatedEmployee && willEmailChange && newEmailNormalized) {
      try {
        await sendEmployeeEmailUpdatedNotification({
          employeeId: updatedEmployee.employeeId,
          name: updatedEmployee.name,
          oldEmail: existingEmployee.email,
          newEmail: newEmailNormalized,
        });
      } catch (notifyError) {
        console.error('Failed to send employee email update notification:', notifyError);
      }
    }

    // Return updated employee data without password
    const employeeData = updatedEmployee.toJSON();

    return NextResponse.json(
      {
        message: 'Employee updated successfully',
        employee: employeeData
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Employee update error:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
