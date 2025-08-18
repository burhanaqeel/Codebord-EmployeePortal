import { NextRequest, NextResponse } from 'next/server';
import { requireEmployee } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { uploadImage, deleteImage } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/employees/profile-image
// Body: form-data { profileImage: File }
export async function POST(request: NextRequest) {
  try {
    const auth = await requireEmployee(request);
    if ('response' in auth) return auth.response;
    await connectDB();

    const formData = await request.formData();
    const file = formData.get('profileImage') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'profileImage file is required' }, { status: 400 });
    }

    // Validate file type
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.png') && !lower.endsWith('.jpg') && !lower.endsWith('.jpeg') && !lower.endsWith('.webp')) {
      return NextResponse.json({ error: 'Only PNG, JPG, or WEBP images are allowed' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const imageUrl = await uploadImage(buffer, 'profiles');

    // Update employee document with Cloudinary URL
    const employee = await Employee.findOneAndUpdate(
      { employeeId: auth.employee.employeeId },
      { profileImage: imageUrl },
      { new: true }
    );

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Profile image updated', 
      profileImage: employee.profileImage, 
      url: employee.profileImage 
    });
  } catch (error: any) {
    console.error('Upload profile image error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}


