import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { requireAdmin } from '@/lib/auth';
import { isSafeFilename, isAllowedExtension } from '@/lib/security';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Attendance from '@/models/Attendance';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Admin only
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;
    // Await the params as required in Next.js 15
    const { filename } = await params;
    if (!isSafeFilename(filename)) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }
    
    // Decode the filename from URL
    const decodedFilename = decodeURIComponent(filename);
    
    // Check if this is a test request (for development)
    const url = new URL(request.url);
    const isTest = url.searchParams.get('test') === 'true';
    
    if (isTest) {
      // Return a test response for development
      return NextResponse.json(
        {
          message: 'Document download test successful',
          filename: decodedFilename,
          status: 'available',
          note: 'This is a test response. In production, implement actual file serving logic.'
        },
        { status: 200 }
      );
    }
    
    // Check if the file path looks like a valid document path
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.txt'];
    const fileExtension = path.extname(decodedFilename).toLowerCase();
    
    if (!isAllowedExtension(decodedFilename, validExtensions)) {
      return NextResponse.json(
        { 
          error: 'Invalid file type',
          message: 'Only PDF, image, and document files are allowed'
        },
        { status: 400 }
      );
    }
    
    // For Cloudinary-based storage, we now store full URLs in MongoDB fields.
    // Attempt to resolve the decoded filename to an existing employee doc field or attendance image URL
    await connectDB();
    const candidates: string[] = [];
    const maybeEmployees = await Employee.find({
      $or: [
        { idCardFront: { $regex: decodedFilename + '$' } },
        { idCardBack: { $regex: decodedFilename + '$' } },
        { offerLetter: { $regex: decodedFilename + '$' } },
        { profileImage: { $regex: decodedFilename + '$' } },
      ]
    }).limit(5);
    for (const e of maybeEmployees) {
      [e.idCardFront, e.idCardBack, e.offerLetter, (e as any).profileImage].forEach((u) => {
        if (typeof u === 'string' && u.endsWith('/' + decodedFilename)) candidates.push(u);
      });
    }
    if (candidates.length === 0) {
      const maybeAttendance = await Attendance.find({
        $or: [
          { clockInImage: { $regex: decodedFilename + '$' } },
          { clockOutImage: { $regex: decodedFilename + '$' } }
        ]
      }).limit(5);
      for (const a of maybeAttendance) {
        [a.clockInImage, a.clockOutImage].forEach((u) => {
          if (typeof u === 'string' && u.endsWith('/' + decodedFilename)) candidates.push(u);
        });
      }
    }

    if (candidates.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Redirect to the first matching Cloudinary URL
    const cloudinaryUrl = candidates[0];
    return NextResponse.redirect(cloudinaryUrl, { status: 302 });

  } catch (error: any) {
    console.error('Document download error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An error occurred while processing the download request'
      },
      { status: 500 }
    );
  }
}

// Helper function to determine content type based on file extension
function getContentType(fileExtension: string): string {
  switch (fileExtension.toLowerCase()) {
    case '.pdf':
      return 'application/pdf';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.doc':
      return 'application/msword';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
}
