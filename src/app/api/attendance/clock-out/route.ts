import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { uploadImage } from '@/lib/cloudinary';
import { requireEmployee } from '@/lib/auth';
import { rateLimit } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, 10, 60_000);
    if (limited) return limited;
    const auth = await requireEmployee(request);
    if ('response' in auth) return auth.response;
    await connectDB();
    
    const formData = await request.formData();
    const employeeId = auth.employee.employeeId;
    const clockOutImage = formData.get('clockOutImage') as File;
    
    if (!employeeId || !clockOutImage) {
      return NextResponse.json(
        { error: 'Employee ID and clock out image are required' },
        { status: 400 }
      );
    }

    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance) {
      return NextResponse.json(
        { error: 'No clock in record found for today' },
        { status: 400 }
      );
    }

    if (attendance.clockOutTime) {
      return NextResponse.json(
        { error: 'You have already clocked out today' },
        { status: 400 }
      );
    }

    // Upload the clock out image to Cloudinary
    const bytes = await clockOutImage.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const imagePath = await uploadImage(buffer, 'attendance');

    // Update attendance record with clock out
    attendance.clockOutTime = new Date();
    attendance.clockOutImage = imagePath;
    
    // Calculate total hours
    const diffMs = attendance.clockOutTime.getTime() - attendance.clockInTime.getTime();
    attendance.totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    await attendance.save();

    return NextResponse.json({
      message: 'Clock out successful',
      attendance: {
        id: attendance._id,
        employeeId: attendance.employeeId,
        employeeName: attendance.employeeName,
        date: attendance.date,
        clockInTime: attendance.clockInTime,
        clockOutTime: attendance.clockOutTime,
        clockInImage: attendance.clockInImage,
        clockOutImage: attendance.clockOutImage,
        totalHours: attendance.totalHours
      }
    });

  } catch (error: any) {
    console.error('Clock out error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
