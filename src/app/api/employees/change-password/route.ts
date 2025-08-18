import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { requireEmployee } from '@/lib/auth';
import { rateLimit } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, 5, 60_000);
    if (limited) return limited;
    const auth = await requireEmployee(request);
    if ('response' in auth) return auth.response;
    await connectDB();

    const { currentPassword, newPassword } = await request.json();

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Find employee by session identity
    const employee = await Employee.findOne({ employeeId: auth.employee.employeeId });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check if employee is active
    if (employee.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is inactive. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, employee.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Set plain new password and let the model pre-save hook hash it; bump token version
    employee.password = newPassword;
    (employee as any).tokenVersion = ((employee as any).tokenVersion || 0) + 1;
    await employee.save();

    return NextResponse.json({
      message: 'Password changed successfully'
    });

  } catch (error: any) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'An error occurred while changing password' },
      { status: 500 }
    );
  }
}
