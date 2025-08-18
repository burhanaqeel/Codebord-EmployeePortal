import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { uploadImage } from '@/lib/cloudinary';
import { requireAdmin } from '@/lib/auth';
import { sendEmployeeCredentials, generateRandomPassword } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Require admin
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;
    // Connect to MongoDB
    await connectDB();

    const formData = await request.formData();
    
    // Extract form fields
    const employeeId = formData.get('employeeId') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const dob = formData.get('dob') as string;
    const dateOfJoining = formData.get('dateOfJoining') as string;
    const permanentAddress = formData.get('permanentAddress') as string;
    const designation = formData.get('designation') as string;
    const department = formData.get('department') as string;
    const roles = JSON.parse(formData.get('roles') as string);
    const salary = formData.get('salary') as string;
    
    // Get files
    const idCardFront = formData.get('idCardFront') as File | null;
    const idCardBack = formData.get('idCardBack') as File | null;
    const offerLetter = formData.get('offerLetter') as File | null;
    const profileImage = formData.get('profileImage') as File | null;

    // Debug logging
    console.log('Received files:', {
      idCardFront: idCardFront ? { name: idCardFront.name, type: idCardFront.type, size: idCardFront.size } : null,
      idCardBack: idCardBack ? { name: idCardBack.name, type: idCardBack.type, size: idCardBack.size } : null,
      offerLetter: offerLetter ? { name: offerLetter.name, type: offerLetter.type, size: offerLetter.size } : null,
      profileImage: profileImage ? { name: profileImage.name, type: profileImage.type, size: profileImage.size } : null
    });

    // Validation
    if (!employeeId || !name || !email || !dob || !dateOfJoining || !permanentAddress || !designation || !department || !salary) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Check if employee with same email or employee ID already exists
    const existingEmployee = await Employee.findOne({
      $or: [
        { email: email.toLowerCase() },
        { employeeId: employeeId }
      ]
    });

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Employee with this email or employee ID already exists' },
        { status: 409 }
      );
    }

    // Process file uploads - upload to Cloudinary
    let idCardFrontPath: string | null = null;
    let idCardBackPath: string | null = null;
    let offerLetterPath: string | null = null;
    let profileImagePath: string | null = null;

    if (idCardFront && idCardFront instanceof File && idCardFront.size > 0) {
      try {
        // Convert File to Buffer and upload
        const bytes = await idCardFront.arrayBuffer();
        const buffer = Buffer.from(bytes);
        idCardFrontPath = await uploadImage(buffer, 'id-cards');
        console.log('Saved idCardFront:', idCardFrontPath);
      } catch (error) {
        console.error('Error saving idCardFront:', error);
        return NextResponse.json(
          { error: 'Failed to save ID card front image' },
          { status: 500 }
        );
      }
    }

    if (idCardBack && idCardBack instanceof File && idCardBack.size > 0) {
      try {
        // Convert File to Buffer and upload
        const bytes = await idCardBack.arrayBuffer();
        const buffer = Buffer.from(bytes);
        idCardBackPath = await uploadImage(buffer, 'id-cards');
        console.log('Saved idCardBack:', idCardBackPath);
      } catch (error) {
        console.error('Error saving idCardBack:', error);
        return NextResponse.json(
          { error: 'Failed to save ID card back image' },
          { status: 500 }
        );
      }
    }

    if (offerLetter && offerLetter instanceof File && offerLetter.size > 0) {
      try {
        // Convert File to Buffer and upload
        const bytes = await offerLetter.arrayBuffer();
        const buffer = Buffer.from(bytes);
        offerLetterPath = await uploadImage(buffer, 'offer-letters');
        console.log('Saved offerLetter:', offerLetterPath);
      } catch (error) {
        console.error('Error saving offerLetter:', error);
        return NextResponse.json(
          { error: 'Failed to save offer letter' },
          { status: 500 }
        );
      }
    }

    if (profileImage && profileImage instanceof File && profileImage.size > 0) {
      try {
        const bytes = await profileImage.arrayBuffer();
        const buffer = Buffer.from(bytes);
        profileImagePath = await uploadImage(buffer, 'profiles');
        console.log('Saved profileImage:', profileImagePath);
      } catch (error) {
        console.error('Error saving profileImage:', error);
        return NextResponse.json(
          { error: 'Failed to save profile image' },
          { status: 500 }
        );
      }
    }

    // Generate random password
    const generatedPassword = generateRandomPassword(12);

    // Create new employee
    const employeeData = {
      employeeId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: generatedPassword, // Generated random password
      dob: new Date(dob),
      dateOfJoining: new Date(dateOfJoining),
      permanentAddress: permanentAddress.trim(),
      designation: designation.trim(),
      department: department.trim(),
      roles: Array.isArray(roles) ? roles : [],
      salary: parseFloat(salary),
      status: 'active', // Default status as active
      idCardFront: idCardFrontPath,
      idCardBack: idCardBackPath,
      offerLetter: offerLetterPath,
      profileImage: profileImagePath
    };

    const employee = new Employee(employeeData);
    await employee.save();

    // Send email with credentials
    try {
      await sendEmployeeCredentials({
        employeeId: employee.employeeId,
        email: employee.email,
        name: employee.name,
        password: generatedPassword
      });
    } catch (emailError) {
      console.error('Failed to send credentials email:', emailError);
      // Don't fail the employee creation if email fails
      // You might want to log this for admin notification
    }

    // Return employee data without password
    const employeeResponse = employee.toJSON();

    return NextResponse.json(
      {
        message: 'Employee account created successfully! Login credentials have been sent to the employee\'s email address.',
        employee: employeeResponse
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Employee creation error:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Employee with this email or employee ID already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
