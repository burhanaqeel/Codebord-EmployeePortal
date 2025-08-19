import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { requireAdmin } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;
    
    const { id } = await params;
    
    // Connect to MongoDB
    await connectDB();

    // Check if admin exists
    const admin = await Admin.findById(id);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Prevent self-deletion always
    if (admin._id.toString() === auth.admin._id?.toString()) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Only super admin can delete admins
    const requester = await Admin.findById(auth.admin._id);
    if (!requester || !(requester as any).isSuperAdmin) {
      return NextResponse.json({ error: 'Only the first admin can delete admins' }, { status: 403 });
    }

    // The first admin account itself cannot be deleted
    if ((admin as any).isSuperAdmin) {
      return NextResponse.json({ error: 'The first admin account cannot be deleted' }, { status: 403 });
    }

    // Delete admin
    const deletedAdmin = await Admin.findByIdAndDelete(id);

    if (!deletedAdmin) {
      return NextResponse.json(
        { error: 'Failed to delete admin' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Admin deleted successfully',
        deletedAdmin: {
          _id: deletedAdmin._id,
          name: deletedAdmin.name,
          email: deletedAdmin.email
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Admin deletion error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
