import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { isSafeFilename } from '@/lib/security';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;
    
    const { filename } = await params;
    if (!isSafeFilename(filename)) return new NextResponse('Bad request', { status: 400 });

    await connectDB();
    const admin = await Admin.findOne({ profileImage: { $regex: filename + '$' } });
    if (!admin || !admin.profileImage) return new NextResponse('Not found', { status: 404 });
    return NextResponse.redirect(String(admin.profileImage), { status: 302 });
  } catch (e) {
    return new NextResponse('Server error', { status: 500 });
  }
}
