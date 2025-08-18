import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { requireEmployee } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEmployee(request);
    if ('response' in auth) return auth.response;
    await connectDB();

    const employee = await Employee.findOne({ employeeId: auth.employee.employeeId });
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employeeData = employee.toJSON();
    return NextResponse.json({ employee: employeeData }, { status: 200 });
  } catch (error: any) {
    console.error('Get current employee error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


