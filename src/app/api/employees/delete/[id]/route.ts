import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Attendance from '@/models/Attendance';
import PasswordResetRequest from '@/models/PasswordResetRequest';
import { requireAdmin } from '@/lib/auth';
import { extractPublicIdFromUrl, deleteImage } from '@/lib/cloudinary';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;
    // Connect to MongoDB
    await connectDB();

    const { id } = await params;

    // Validate employee ID
    if (!id) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Store employee details for deletion confirmation
    const employeeId = employee.employeeId;
    const employeeEmail = employee.email;

    // Get all attendance records for this employee to delete associated image files
    const attendanceRecords = await Attendance.find({ employeeId: employeeId });
    
    // Delete attendance image files (from Cloudinary if URLs)
    let deletedImageFiles = 0;
    for (const record of attendanceRecords) {
      try {
        // Delete clock-in image
        if (record.clockInImage) {
          const pub = extractPublicIdFromUrl(record.clockInImage);
          if (pub) { await deleteImage(pub); deletedImageFiles++; }
        }
        // Delete clock-out image
        if (record.clockOutImage) {
          const pub = extractPublicIdFromUrl(record.clockOutImage);
          if (pub) { await deleteImage(pub); deletedImageFiles++; }
        }
      } catch (fileError) {
        // Log file deletion errors but continue with the process
        console.warn(`Failed to delete image file for employee ${employeeId}:`, fileError);
      }
    }

    // Delete all attendance records for this employee
    const attendanceDeleteResult = await Attendance.deleteMany({ 
      employeeId: employeeId 
    });

    // Delete all password reset requests for this employee
    const passwordResetDeleteResult = await PasswordResetRequest.deleteMany({ 
      employeeId: employeeId 
    });

    // Delete employee profile and document files (Cloudinary URLs)
    let deletedEmployeeFiles = 0;
    try {
      // Delete profile image
      if (employee.profileImage) {
        const pub = extractPublicIdFromUrl(employee.profileImage as any);
        if (pub) { await deleteImage(pub); deletedEmployeeFiles++; }
      }
      
      // Delete ID card front
      if (employee.idCardFront) {
        const pub = extractPublicIdFromUrl(employee.idCardFront as any);
        if (pub) { await deleteImage(pub); deletedEmployeeFiles++; }
      }
      
      // Delete ID card back
      if (employee.idCardBack) {
        const pub = extractPublicIdFromUrl(employee.idCardBack as any);
        if (pub) { await deleteImage(pub); deletedEmployeeFiles++; }
      }
      
      // Delete offer letter
      if (employee.offerLetter) {
        const pub = extractPublicIdFromUrl(employee.offerLetter as any);
        if (pub) { await deleteImage(pub); deletedEmployeeFiles++; }
      }
    } catch (fileError) {
      // Log file deletion errors but continue with the process
      console.warn(`Failed to delete employee files for ${employeeId}:`, fileError);
    }

    // Delete the employee
    const deletedEmployee = await Employee.findByIdAndDelete(id);

    if (!deletedEmployee) {
      return NextResponse.json(
        { error: 'Failed to delete employee' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Employee and all associated data deleted successfully',
        deletedEmployee: {
          employeeId: deletedEmployee.employeeId,
          name: deletedEmployee.name,
          email: deletedEmployee.email
        },
        deletionSummary: {
          attendanceRecordsDeleted: attendanceDeleteResult.deletedCount,
          passwordResetRequestsDeleted: passwordResetDeleteResult.deletedCount,
          attendanceImageFilesDeleted: deletedImageFiles,
          employeeDocumentFilesDeleted: deletedEmployeeFiles
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Employee deletion error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
