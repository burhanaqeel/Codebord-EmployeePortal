import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';
import { requireEmployee } from '@/lib/auth';
import { rateLimit } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const limited = rateLimit(request, 30, 60_000);
    if (limited) return limited;
    const auth = await requireEmployee(request);
    if ('response' in auth) return auth.response;
    await connectDB();

    const { searchParams } = new URL(request.url);

    // Accept either a single identifier (employeeId or email),
    // or explicit employeeId/email params for flexibility/back-compat
    const identifier = searchParams.get('identifier');
    const employeeIdParam = auth.employee.employeeId;
    const emailParam = searchParams.get('email');
    const allParam = searchParams.get('all');

    // Resolve employeeId to query Attendance with
    let employeeIdToQuery: string | null = null;

    if (identifier && typeof identifier === 'string') {
      if (identifier.includes('@')) {
        const emp = await Employee.findOne({ email: identifier.toLowerCase() });
        if (!emp) {
          return NextResponse.json(
            { error: 'Employee not found for provided email' },
            { status: 404 }
          );
        }
        employeeIdToQuery = emp.employeeId;
      } else {
        employeeIdToQuery = identifier.toUpperCase();
      }
    } else if (emailParam && typeof emailParam === 'string') {
      const emp = await Employee.findOne({ email: emailParam.toLowerCase() });
      if (!emp) {
        return NextResponse.json(
          { error: 'Employee not found for provided email' },
          { status: 404 }
        );
      }
      employeeIdToQuery = emp.employeeId;
    } else if (employeeIdParam) {
      employeeIdToQuery = employeeIdParam.toUpperCase();
    }

    // employeeIdToQuery is always present from session

    // Build query
    const query: Record<string, any> = { employeeId: employeeIdToQuery };

    // If all=true is provided, return full history; otherwise default last 30 days
    const isAll = allParam === 'true';
    if (!isAll) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.date = { $gte: thirtyDaysAgo };
    }

    const attendanceDocs = await Attendance.find(query).sort({ date: -1 });

    // Enhance with convenient image URLs for the UI
    const attendanceHistory = attendanceDocs.map((doc) => {
      const plain = doc.toObject();
      const makeUrl = (p?: string | null) => {
        if (!p) return null;
        // if already a full URL (Cloudinary), return as is
        if (p.startsWith('http')) return p;
        const parts = p.split('/');
        const filename = parts[parts.length - 1];
        return filename ? `/api/attendance/images/${filename}` : null;
      };
      return {
        _id: plain._id,
        employeeId: plain.employeeId,
        employeeName: plain.employeeName,
        date: plain.date,
        clockInTime: plain.clockInTime,
        clockOutTime: plain.clockOutTime,
        clockInImage: plain.clockInImage,
        clockOutImage: plain.clockOutImage,
        totalHours: plain.totalHours,
        status: plain.status,
        clockInImageUrl: makeUrl(plain.clockInImage),
        clockOutImageUrl: makeUrl(plain.clockOutImage),
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
      };
    });

    return NextResponse.json({
      message: 'Attendance history retrieved successfully',
      count: attendanceHistory.length,
      attendanceHistory,
    });
  } catch (error: any) {
    console.error('Attendance history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
