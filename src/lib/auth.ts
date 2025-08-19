import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Admin, { IAdmin } from '@/models/Admin';
import Employee, { IEmployee } from '@/models/Employee';

export interface AdminJwtPayload {
  adminId: string;
  email: string;
  name: string;
  tokenVersion?: number;
}

const ADMIN_COOKIE_NAME = 'admin_token';
const EMPLOYEE_COOKIE_NAME = 'employee_token';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

export function signAdminJwt(payload: AdminJwtPayload, expiresIn: string = '2h'): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn } as any);
}

export function setAdminAuthCookie(response: NextResponse, token: string, maxAgeSeconds: number = 60 * 60 * 2): void {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: maxAgeSeconds
  });
}

export function clearAdminAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0
  });
}

export function getAdminTokenFromRequest(request: NextRequest): string | null {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
  return cookie?.value || null;
}

export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as AdminJwtPayload;
    if (!payload || !payload.adminId) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function requireAdmin(request: NextRequest): Promise<{ admin: IAdmin } | { response: NextResponse }> {
  try {
    const token = getAdminTokenFromRequest(request);
    if (!token) {
      return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    const payload = verifyAdminToken(token);
    if (!payload) {
      return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    await (await import('@/lib/mongodb')).default();
    const admin = await Admin.findById(payload.adminId);
    if (!admin) {
      return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    return { admin };
  } catch (error) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
}

// Employee auth
export interface EmployeeJwtPayload {
  employeeId: string;
  email: string;
  name: string;
  tokenVersion?: number;
}

export function signEmployeeJwt(payload: EmployeeJwtPayload, expiresIn: string = '8h'): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn } as any);
}

export function setEmployeeAuthCookie(response: NextResponse, token: string, maxAgeSeconds: number = 60 * 60 * 8): void {
  response.cookies.set({
    name: EMPLOYEE_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: maxAgeSeconds
  });
}

export function clearEmployeeAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: EMPLOYEE_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0
  });
}

export function getEmployeeTokenFromRequest(request: NextRequest): string | null {
  const cookie = request.cookies.get(EMPLOYEE_COOKIE_NAME);
  return cookie?.value || null;
}

export function verifyEmployeeToken(token: string): EmployeeJwtPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as EmployeeJwtPayload;
    if (!payload || !payload.employeeId) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function requireEmployee(request: NextRequest): Promise<{ employee: IEmployee } | { response: NextResponse }> {
  try {
    const token = getEmployeeTokenFromRequest(request);
    if (!token) {
      return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    const payload = verifyEmployeeToken(token);
    if (!payload) {
      return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    await (await import('@/lib/mongodb')).default();
    const employee = await Employee.findOne({ employeeId: payload.employeeId });
    if (!employee) {
      return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    // Invalidate sessions when tokenVersion mismatches (e.g., after password/email change)
    const dbTokenVersion = (employee as any).tokenVersion || 0;
    const tokenTokenVersion = payload.tokenVersion || 0;
    if (tokenTokenVersion !== dbTokenVersion) {
      return { response: NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 }) };
    }
    return { employee };
  } catch (error) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
}

export async function getAuthContext(request: NextRequest): Promise<
  | { admin: IAdmin; employee?: undefined }
  | { employee: IEmployee; admin?: undefined }
  | { response: NextResponse }
> {
  const adminToken = getAdminTokenFromRequest(request);
  if (adminToken) {
    const payload = verifyAdminToken(adminToken);
    if (payload) {
      await (await import('@/lib/mongodb')).default();
      const admin = await Admin.findById(payload.adminId);
      if (admin) return { admin };
    }
  }
  const employeeToken = getEmployeeTokenFromRequest(request);
  if (employeeToken) {
    const payload = verifyEmployeeToken(employeeToken);
    if (payload) {
      await (await import('@/lib/mongodb')).default();
      const employee = await Employee.findOne({ employeeId: payload.employeeId });
      if (employee) {
        const dbTokenVersion = (employee as any).tokenVersion || 0;
        const tokenTokenVersion = payload.tokenVersion || 0;
        if (tokenTokenVersion === dbTokenVersion) {
          return { employee };
        }
      }
    }
  }
  return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
}


