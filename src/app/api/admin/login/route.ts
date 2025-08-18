import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import jwt from 'jsonwebtoken';
import { signAdminJwt, setAdminAuthCookie } from '@/lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();

    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token and set HttpOnly cookie
    const token = signAdminJwt({
      adminId: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      tokenVersion: (admin as any).tokenVersion || 0,
    }, '2h');

    const res = NextResponse.json({ 
      message: 'Login successful', 
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        profileImage: admin.profileImage,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }, 
      token 
    }, { status: 200 });
    setAdminAuthCookie(res, token);
    return res;

  } catch (error: any) {
    console.error('Admin login error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
