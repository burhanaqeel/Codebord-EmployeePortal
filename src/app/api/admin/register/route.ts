import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // This endpoint is ONLY for creating admins by the first (super) admin.
    // The initial admin account MUST be created via /api/admin/first-time-setup.
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;
    const creator = await Admin.findById(auth.admin._id);
    if (!creator || !(creator as any).isSuperAdmin) {
      return NextResponse.json({ error: 'Only the first admin can create new admins' }, { status: 403 });
    }

    const { name, email, password, confirmPassword } = await request.json();

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin with this email already exists' },
        { status: 409 }
      );
    }

    // Create new admin (never super admin here)
    const admin = new Admin({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      isSuperAdmin: false,
      status: 'active'
    });

    await admin.save();

    // Return admin data without password
    const adminData = admin.toJSON();

    return NextResponse.json(
      { 
        message: 'Admin registered successfully',
        admin: adminData
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Admin registration error:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
