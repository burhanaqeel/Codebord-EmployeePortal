import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { isSafeFilename } from '@/lib/security';
import Attendance from '@/models/Attendance';
import connectDB from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Require authenticated admin or employee
    const auth = await getAuthContext(request);
    if ('response' in auth) return auth.response;
    const { filename } = await params;
    if (!isSafeFilename(filename)) {
      return new NextResponse('Invalid filename', { status: 400 });
    }
    
    // Ensure ownership: admin allowed; employee must own the record
    await connectDB();
    const record = await Attendance.findOne({
      $or: [
        { clockInImage: { $regex: filename + '$' } },
        { clockOutImage: { $regex: filename + '$' } },
      ],
    });
    if (!record) {
      return new NextResponse('Image not found', { status: 404 });
    }
    if (!('admin' in auth) && ('employee' in auth)) {
      if (auth.employee.employeeId !== record.employeeId) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
    // If the record has a Cloudinary URL saved, redirect to it.
    const imageUrl = (record.clockInImage && record.clockInImage.endsWith('/' + filename))
      ? record.clockInImage
      : (record.clockOutImage && record.clockOutImage.endsWith('/' + filename))
        ? record.clockOutImage
        : null;
    if (imageUrl) {
      return NextResponse.redirect(imageUrl, { status: 302 });
    }
    // If not a Cloudinary URL (legacy local path), deny in serverless env
    return new NextResponse('Image not available', { status: 404 });
  } catch (error) {
    console.error('Error serving attendance image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
