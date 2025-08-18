import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { requireAdmin } from '@/lib/auth';
import { uploadImage, deleteImage } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;
    
    // Connect to MongoDB
    await connectDB();

    const formData = await request.formData();
    const file = formData.get('profileImage') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Profile image file is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.png') && !lower.endsWith('.jpg') && !lower.endsWith('.jpeg') && !lower.endsWith('.webp')) {
      return NextResponse.json(
        { error: 'Only PNG, JPG, JPEG, or WEBP images are allowed' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const imageUrl = await uploadImage(buffer, 'admin-profiles');

    // Update admin profile image with Cloudinary URL
    const updatedAdmin = await Admin.findByIdAndUpdate(
      auth.admin._id,
      { profileImage: imageUrl },
      { new: true, select: '-password' }
    );

    if (!updatedAdmin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Profile image updated successfully',
      admin: {
        _id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        profileImage: updatedAdmin.profileImage,
        createdAt: updatedAdmin.createdAt,
        updatedAt: updatedAdmin.updatedAt
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Profile image update error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;
    
    // Connect to MongoDB
    await connectDB();

    // Get current admin to find profile image
    const currentAdmin = await Admin.findById(auth.admin._id);
    if (currentAdmin?.profileImage) {
      try {
        // Extract public ID from Cloudinary URL for deletion
        const urlParts = currentAdmin.profileImage.split('/');
        const publicId = urlParts[urlParts.length - 1].split('.')[0];
        const folder = 'admin-profiles';
        await deleteImage(`${folder}/${publicId}`);
      } catch (error) {
        console.log('Profile image not found or already removed');
      }
    }

    // Remove admin profile image from database
    const updatedAdmin = await Admin.findByIdAndUpdate(
      auth.admin._id,
      { profileImage: null },
      { new: true, select: '-password' }
    );

    if (!updatedAdmin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Profile image removed successfully',
      admin: {
        _id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        profileImage: updatedAdmin.profileImage,
        createdAt: updatedAdmin.createdAt,
        updatedAt: updatedAdmin.updatedAt
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Profile image removal error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
