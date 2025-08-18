import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { requireAdmin } from '@/lib/auth';

// GET /api/employees/list?page=1&limit=25&search=term
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '25', 10), 1), 100);
    const search = (searchParams.get('search') || '').trim();

    const query: Record<string, any> = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (search.includes('@')) {
        query.email = { $regex: `^${escaped}$`, $options: 'i' };
      } else {
        query.employeeId = { $regex: `^${escaped}$`, $options: 'i' };
      }
    }

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query, {
      employeeId: 1,
      name: 1,
      email: 1,
      designation: 1,
      department: 1,
      status: 1,
      createdAt: 1,
      profileImage: 1,
      idCardFront: 1,
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      page,
      limit,
      total,
      employees,
    });
  } catch (error: any) {
    console.error('List employees error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


