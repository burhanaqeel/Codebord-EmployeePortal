import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { requireAdmin } from '@/lib/auth';

// One-time maintenance endpoint to ensure the FIRST created admin is marked as super admin
// Safety rules:
// - Requires any logged-in admin
// - Does nothing (409) if a super admin already exists
// - Promotes the earliest created admin (by createdAt) to super admin

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;

    await connectDB();

    const existingSuper = await Admin.findOne({ isSuperAdmin: true });
    if (existingSuper) {
      return NextResponse.json(
        { message: 'A super admin already exists', superAdmin: { _id: existingSuper._id, email: existingSuper.email } },
        { status: 409 }
      );
    }

    const firstAdmin = await Admin.findOne({}).sort({ createdAt: 1 });
    if (!firstAdmin) {
      return NextResponse.json({ error: 'No admins found in database' }, { status: 404 });
    }

    (firstAdmin as any).isSuperAdmin = true;
    await firstAdmin.save();

    return NextResponse.json({
      message: 'Promoted earliest admin to super admin',
      superAdmin: {
        _id: firstAdmin._id,
        name: firstAdmin.name,
        email: firstAdmin.email,
        createdAt: firstAdmin.createdAt,
      }
    }, { status: 200 });
  } catch (error) {
    console.error('ensure-super-admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


