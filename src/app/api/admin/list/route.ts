import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;
    
    // Connect to MongoDB
    await connectDB();

    // Fetch all admins (excluding password field)
    const admins = await Admin.find({}, '-password').sort({ createdAt: -1 });

    return NextResponse.json({
      currentAdminId: auth.admin._id?.toString?.() || String(auth.admin._id),
      admins: admins.map(admin => ({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        profileImage: admin.profileImage,
        isSuperAdmin: (admin as any).isSuperAdmin || false,
        status: (admin as any).status || 'active',
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }))
    }, { status: 200 });

  } catch (error: any) {
    console.error('Admin list error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
