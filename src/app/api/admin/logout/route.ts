import { NextRequest, NextResponse } from 'next/server';
import { clearAdminAuthCookie } from '@/lib/auth';

export async function POST(_request: NextRequest) {
  const res = NextResponse.json({ message: 'Logged out' });
  clearAdminAuthCookie(res);
  return res;
}


