import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter per IP+route
const ipRouteHits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(request: NextRequest, limit: number, windowMs: number): NextResponse | null { 
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const url = new URL(request.url);
  const key = `${ip}:${url.pathname}`;
  const now = Date.now();
  const record = ipRouteHits.get(key);
  if (!record || now > record.resetAt) {
    ipRouteHits.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }
  record.count += 1;
  ipRouteHits.set(key, record);
  return null;
}

export function isSafeFilename(name: string): boolean {
  if (!name) return false;
  if (name.includes('..') || name.includes('/') || name.includes('\\')) return false;
  return /^[A-Za-z0-9._-]+$/.test(name);
}

export function isAllowedExtension(filename: string, allowed: string[]): boolean {
  const lower = filename.toLowerCase();
  return allowed.some((ext) => lower.endsWith(ext));
}


