import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    
    if ('response' in auth) {
      console.log('Admin verification failed - auth response:', auth.response);
      return NextResponse.json(
        { isAuthenticated: false, admin: null },
        { status: 401 }
      );
    }

    const admin = auth.admin;
    console.log('Admin verification successful - admin data:', {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      profileImage: admin.profileImage ? 'Has image' : 'No image',
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt
    });
    
    return NextResponse.json({
      isAuthenticated: true,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        profileImage: admin.profileImage,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Admin verification error:', error);
    
    return NextResponse.json(
      { isAuthenticated: false, admin: null },
      { status: 401 }
    );
  }
}
