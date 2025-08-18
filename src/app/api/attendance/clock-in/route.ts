import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { uploadImage } from '@/lib/cloudinary';
import { requireEmployee } from '@/lib/auth';
import { rateLimit } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const limited = rateLimit(request, 10, 60_000);
    if (limited) return limited;
    // Require employee auth
    const auth = await requireEmployee(request);
    if ('response' in auth) return auth.response;
    await connectDB();
    
    const formData = await request.formData();
    // Derive identity from session, ignore client-sent IDs
    const employeeId = auth.employee.employeeId;
    const employeeName = auth.employee.name;
    const clockInImage = formData.get('clockInImage') as File;
    
    if (!employeeId || !employeeName || !clockInImage) {
      return NextResponse.json(
        { error: 'Employee ID, name, and clock in image are required' },
        { status: 400 }
      );
    }

    // Check if already clocked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'You have already clocked in today' },
        { status: 400 }
      );
    }

    // Convert image to buffer
    const bytes = await clockInImage.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload to Cloudinary
    const imageUrl = await uploadImage(buffer, 'attendance');

    // Create attendance record
    const attendance = new Attendance({
      employeeId,
      employeeName,
      date: today,
      clockInTime: new Date(),
      clockInImage: imageUrl,
      status: 'present'
    });

    await attendance.save();

    return NextResponse.json({
      message: 'Clock in successful',
      attendance: {
        id: attendance._id,
        employeeId: attendance.employeeId,
        employeeName: attendance.employeeName,
        date: attendance.date,
        clockInTime: attendance.clockInTime,
        clockInImage: attendance.clockInImage
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Clock in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
