import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { requireAdmin } from '@/lib/auth';
import crypto from 'crypto';

// POST /api/admin/maintenance/rehash-employee-passwords
// Admin-only: audits employee passwords and hashes any that are stored in plaintext
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;
    await connectDB();

    const employees = await Employee.find({}, { password: 1, employeeId: 1, email: 1, name: 1 });

    let audited = 0;
    let rotated = 0;
    const affected: Array<{ employeeId: string; email: string; temporaryPassword: string }> = [];

    for (const emp of employees) {
      audited++;
      const pwd: unknown = (emp as any).password;
      const isHashed = typeof pwd === 'string' && pwd.startsWith('$2');
      if (!isHashed) {
        // Rotate to a new temporary password and save (pre-save hook will hash)
        const temporaryPassword = crypto.randomBytes(9).toString('base64'); // ~12 chars
        emp.password = temporaryPassword;
        await emp.save();
        rotated++;
        affected.push({ employeeId: emp.employeeId, email: emp.email, temporaryPassword });
      }
    }

    return NextResponse.json({
      message: 'Employee password audit completed; plaintext passwords rotated',
      audited,
      rotated,
      affected,
    });
  } catch (error: any) {
    console.error('Password audit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


