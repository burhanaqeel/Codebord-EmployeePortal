import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import PasswordResetRequest from '@/models/PasswordResetRequest';

// POST /api/employees/reset-password
// Creates a password reset request (pending) for an employee identified by employeeId or email
export async function POST(request: NextRequest) {
  try {
    // Rate limit this endpoint to mitigate abuse
    const { rateLimit } = await import('@/lib/security');
    const limited = rateLimit(request as any, 3, 60_000);
    if (limited) return limited;
    await connectDB();

    const { identifier } = await request.json();
    if (!identifier) {
      return NextResponse.json({ error: 'Employee ID or Email is required' }, { status: 400 });
    }

    // Resolve employee by email or employeeId
    const query = identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { employeeId: identifier.toUpperCase() };

    const employee = await Employee.findOne(query);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Prevent duplicate pending requests
    const existingPending = await PasswordResetRequest.findOne({ employeeId: employee.employeeId, status: 'pending' });
    if (existingPending) {
      return NextResponse.json({ error: 'A pending request already exists for this employee' }, { status: 409 });
    }

    const reqDoc = await PasswordResetRequest.create({
      employeeId: employee.employeeId,
      email: employee.email,
      name: employee.name,
      department: employee.department,
      designation: employee.designation,
      status: 'pending',
    });

    return NextResponse.json({ message: 'Password reset request created', request: reqDoc }, { status: 201 });
  } catch (error: any) {
    console.error('Create reset request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


