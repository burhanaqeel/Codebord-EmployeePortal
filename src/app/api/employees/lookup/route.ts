import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { rateLimit } from '@/lib/security';

// GET /api/employees/lookup?identifier=EMP-ID-or-email
// Public: returns minimal profile info to confirm the target before sending a reset request
export async function GET(request: NextRequest) {
  try {
    const limited = rateLimit(request, 5, 60_000);
    if (limited) return limited;
    await connectDB();

    const { searchParams } = new URL(request.url);
    const identifier = (searchParams.get('identifier') || '').trim();
    if (!identifier) {
      return NextResponse.json({ error: 'Identifier is required' }, { status: 400 });
    }

    const query = identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { employeeId: identifier.toUpperCase() };

    const employee = await Employee.findOne(query, {
      employeeId: 1,
      name: 1,
      profileImage: 1,
      _id: 0,
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ employee });
  } catch (error: any) {
    console.error('Employee lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


