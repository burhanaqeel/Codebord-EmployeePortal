import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { requireAdmin } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;

    await connectDB();

    const { id } = await params;
    const { status } = await request.json();

    if (!status || (status !== 'active' && status !== 'inactive')) {
      return NextResponse.json({ error: 'Status must be active or inactive' }, { status: 400 });
    }

    const requester = await Admin.findById(auth.admin._id);
    if (!requester || !(requester as any).isSuperAdmin) {
      return NextResponse.json({ error: 'Only the first admin can change admin statuses' }, { status: 403 });
    }

    // Prevent changing own status
    if (auth.admin._id?.toString() === id) {
      return NextResponse.json({ error: 'You cannot change your own status' }, { status: 400 });
    }

    const target = await Admin.findById(id);
    if (!target) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Prevent changing the super admin account status
    if ((target as any).isSuperAdmin) {
      return NextResponse.json({ error: 'The first admin status cannot be changed' }, { status: 403 });
    }

    (target as any).status = status;
    await target.save();

    return NextResponse.json({
      message: 'Admin status updated successfully',
      admin: {
        _id: target._id,
        name: target.name,
        email: target.email,
        profileImage: target.profileImage,
        isSuperAdmin: (target as any).isSuperAdmin || false,
        status: (target as any).status || 'active',
        createdAt: target.createdAt,
        updatedAt: target.updatedAt
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Admin status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


