import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { isSafeFilename } from '@/lib/security';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const auth = await getAuthContext(request);
    if ('response' in auth) return auth.response;
    const { filename } = await params;
    if (!isSafeFilename(filename)) return new NextResponse('Bad request', { status: 400 });

    await connectDB();
    const emp = await Employee.findOne({ profileImage: { $regex: filename + '$' } });
    if (!emp || !emp.profileImage) return new NextResponse('Not found', { status: 404 });
    return NextResponse.redirect(String(emp.profileImage), { status: 302 });
  } catch (e) {
    return new NextResponse('Server error', { status: 500 });
  }
}


