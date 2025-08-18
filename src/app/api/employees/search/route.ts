import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Require admin and connect to DB
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;
    // Connect to MongoDB
    await connectDB();

    const { searchParams } = new URL(request.url);
    
    // Extract search parameters
    const employeeId = searchParams.get('employeeId');
    const email = searchParams.get('email');

    // Build query object - only search by employeeId or email
    const query: any = {};

    if (employeeId) {
      // Exact match for employee ID (case-insensitive)
      query.employeeId = { $regex: `^${employeeId}$`, $options: 'i' };
    }

    if (email) {
      // Exact match for email (case-insensitive)
      query.email = { $regex: `^${email}$`, $options: 'i' };
    }

    // If no search criteria provided, return error
    if (!employeeId && !email) {
      return NextResponse.json(
        { error: 'Employee ID or Email is required for search' },
        { status: 400 }
      );
    }

    // Find employee with exact match
    const employees = await Employee.find(query)
      .sort({ createdAt: -1 })
      .limit(1); // Only return one result since we're searching by unique fields

    return NextResponse.json(
      { 
        employees,
        count: employees.length,
        message: employees.length > 0 ? 'Employee found successfully' : 'No employee found'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Employee search error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
