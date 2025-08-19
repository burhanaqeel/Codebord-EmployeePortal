import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import jwt from 'jsonwebtoken';
import { setEmployeeAuthCookie, signEmployeeJwt } from '@/lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();

    const { identifier, password } = await request.json();

    // Validation
    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Employee ID/Email and password are required' },
        { status: 400 }
      );
    }

    // Normalize identifier to avoid whitespace/case issues
    const normalized = String(identifier).trim();
    
    // Find employee by email (case-insensitive exact) or employee ID (case-insensitive exact)
    let employee = await Employee.findOne({
      $or: [
        { email: normalized.toLowerCase() },
        { employeeId: normalized.toUpperCase() }
      ]
    });

    // Fallback: strict case-insensitive equality using regex, in case of legacy casing issues
    if (!employee) {
      const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const emailRegex = new RegExp('^' + escape(normalized) + '$', 'i');
      const idRegex = new RegExp('^' + escape(normalized) + '$', 'i');
      employee = await Employee.findOne({
        $or: [
          { email: emailRegex },
          { employeeId: idRegex }
        ]
      });
    }

    if (!employee) {
      return NextResponse.json(
        { error: 'Invalid employee ID/email or password' },
        { status: 401 }
      );
    }

    // Check password with fallback for legacy plaintext-stored passwords
    let isPasswordValid = await employee.comparePassword(password);
    if (!isPasswordValid) {
      const stored = (employee as any).password;
      const looksHashed = typeof stored === 'string' && stored.startsWith('$2');
      if (!looksHashed && typeof stored === 'string' && stored === password) {
        // Seamless migration: rehash and save
        (employee as any).password = password;
        await employee.save();
        isPasswordValid = true;
      }
    }
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid employee ID/email or password' }, { status: 401 });
    }

    // Check if employee is active
    if (employee.status !== 'active') {
      return NextResponse.json(
        { error: 'Your account is currently inactive. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // Return success and set cookie. Client will fetch full profile via /api/employees/me
    const token = signEmployeeJwt({ employeeId: employee.employeeId, email: employee.email, name: employee.name, tokenVersion: (employee as any).tokenVersion || 0 }, '8h');
    const res = NextResponse.json({ message: 'Login successful' });
    setEmployeeAuthCookie(res, token);
    return res;

  } catch (error: any) {
    console.error('Employee login error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
