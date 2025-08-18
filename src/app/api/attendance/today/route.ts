import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
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
    const employeeId = auth.employee.employeeId;
    
    // Check today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAttendance = await Attendance.findOne({
      employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!todayAttendance) {
      return NextResponse.json({
        message: 'No attendance record for today',
        hasClockedIn: false,
        hasClockedOut: false,
        canClockIn: true,
        canClockOut: false
      });
    }

    return NextResponse.json({
      message: 'Today\'s attendance retrieved successfully',
      hasClockedIn: true,
      hasClockedOut: !!todayAttendance.clockOutTime,
      canClockIn: false,
      canClockOut: !todayAttendance.clockOutTime,
      attendance: {
        id: todayAttendance._id,
        clockInTime: todayAttendance.clockInTime,
        clockOutTime: todayAttendance.clockOutTime,
        totalHours: todayAttendance.totalHours
      }
    });

  } catch (error: any) {
    console.error('Today\'s attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
