import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PasswordResetRequest from '@/models/PasswordResetRequest';
import Employee from '@/models/Employee';
import { requireAdmin } from '@/lib/auth';
import { sendPasswordResetCredentials, generateRandomPassword } from '@/lib/email';

// GET /api/admin/password-requests?status=pending|approved|rejected (default: pending)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || 'pending') as 'pending' | 'approved' | 'rejected';
    const requests = await PasswordResetRequest.find({ status }).sort({ createdAt: -1 });
    const count = await PasswordResetRequest.countDocuments({ status: 'pending' });
    return NextResponse.json({ requests, pendingCount: count });
  } catch (error: any) {
    console.error('List reset requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/password-requests  { requestId, action: 'approve' | 'reject' }
// Approve issues a one-time temporary password and marks request approved
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;
    await connectDB();
    const { requestId, action } = await request.json();
    if (!requestId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'requestId and valid action are required' }, { status: 400 });
    }

    const reqDoc = await PasswordResetRequest.findById(requestId);
    if (!reqDoc) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (reqDoc.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending requests can be updated' }, { status: 400 });
    }

    if (action === 'reject') {
      reqDoc.status = 'rejected';
      await reqDoc.save();
      return NextResponse.json({ message: 'Request rejected', request: reqDoc });
    }

    // Approve -> generate new random password and send email
    const employee = await Employee.findOne({ employeeId: reqDoc.employeeId });
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found for this request' }, { status: 404 });
    }

    // Generate new random password
    const newPassword = generateRandomPassword(12);
    employee.password = newPassword;
    (employee as any).tokenVersion = ((employee as any).tokenVersion || 0) + 1;
    await employee.save();

    // Send email with new credentials
    try {
      await sendPasswordResetCredentials({
        employeeId: employee.employeeId,
        email: employee.email,
        name: employee.name,
        newPassword: newPassword
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't fail the approval if email fails
      // You might want to log this for admin notification
    }

    reqDoc.status = 'approved';
    await reqDoc.save();

    return NextResponse.json({ 
      message: 'Password reset approved. New password has been sent to the employee\'s email address.', 
      request: reqDoc 
    });
  } catch (error: any) {
    console.error('Update reset request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


