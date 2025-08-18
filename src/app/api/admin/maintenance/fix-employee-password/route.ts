import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { requireAdmin } from '@/lib/auth';
import { rateLimit } from '@/lib/security';
import crypto from 'crypto';

// POST /api/admin/maintenance/fix-employee-password
// Body: { employeeIds: string[], newPassword?: string }
// Admin-only: sets a new password (default '00000000' if provided; otherwise random) for specific employeeIds
export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, 3, 10_000);
    if (limited) return limited;
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;
    await connectDB();

    const { employeeIds, newPassword } = await request.json();
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json({ error: 'employeeIds array is required' }, { status: 400 });
    }

    const results: Array<{ employeeId: string; status: 'updated' | 'not_found'; passwordIssued?: string }> = [];

    for (const id of employeeIds) {
      if (typeof id !== 'string' || id.trim() === '') continue;
      const employee = await Employee.findOne({ employeeId: id.trim().toUpperCase() });
      if (!employee) {
        results.push({ employeeId: id, status: 'not_found' });
        continue;
      }
      const assigned = typeof newPassword === 'string' && newPassword.length > 0
        ? newPassword
        : crypto.randomBytes(9).toString('base64');
      (employee as any).password = assigned;
      (employee as any).tokenVersion = ((employee as any).tokenVersion || 0) + 1;
      await employee.save();
      results.push({ employeeId: id, status: 'updated', passwordIssued: assigned });
    }

    return NextResponse.json({ message: 'Password fix completed', results });
  } catch (error: any) {
    console.error('Fix employee password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


