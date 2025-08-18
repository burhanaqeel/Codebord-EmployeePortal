import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Require admin
    // @ts-ignore NextRequest compatible type
    const auth = await requireAdmin(request as any);
    if ('response' in auth) return auth.response as any;
    // Connect to MongoDB
    await connectDB();

    // Find the last employee to get the highest employee ID
    const lastEmployee = await Employee.findOne({}, { employeeId: 1 })
      .sort({ employeeId: -1 })
      .limit(1);

    let nextId = 'CBE-1001'; // Default starting ID

    if (lastEmployee) {
      // Extract the number from the last employee ID
      const lastNumber = parseInt(lastEmployee.employeeId.replace('CBE-', ''));
      const nextNumber = lastNumber + 1;
      nextId = `CBE-${nextNumber}`;
    }

    return NextResponse.json(
      { nextId },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error generating next employee ID:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
