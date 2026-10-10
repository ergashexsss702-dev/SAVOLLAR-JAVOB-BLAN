import crypto from 'crypto';
import { db } from '../db/store.ts';
import { UserSession } from '../../shared/types.ts';

const SESSION_SECRET = process.env.SESSION_SECRET || 'savollarni-javobi-bilan-session-secret-2026';
const ADMIN_KEY = process.env.ADMIN_KEY || 'admin_savollar_2026';
const ALLOW_DEMO_CODE = process.env.ALLOW_DEMO_CODE === 'true' || process.env.NODE_ENV !== 'production';

// In-memory rate limiting map: ip -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(ip: string, maxAttempts = 15, windowMs = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxAttempts - entry.count };
}

export function generateSessionToken(session: UserSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): UserSession | null {
  try {
    if (!token || !token.includes('.')) return null;
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('base64url');

    // Constant-time comparison
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const json = Buffer.from(payload, 'base64url').toString('utf-8');
    const session: UserSession = JSON.parse(json);

    if (Date.now() > session.expiresAt) {
      return null; // Expired
    }

    return session;
  } catch {
    return null;
  }
}

export function normalizePhone(rawPhone: string): { isValid: boolean; normalized: string } {
  const cleaned = rawPhone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    // e.g. 901234567
    return { isValid: true, normalized: `+998${cleaned}` };
  }
  if (cleaned.length === 12 && cleaned.startsWith('998')) {
    // e.g. 998901234567
    return { isValid: true, normalized: `+${cleaned}` };
  }
  return { isValid: false, normalized: rawPhone };
}

export function validateAccessCode(code: string): { success: boolean; message: string; role?: 'student' | 'admin' } {
  const trimmed = (code || '').trim();

  // 1. Check if it's admin master key
  if (trimmed === ADMIN_KEY) {
    return { success: true, message: 'Administrator sifatida muvaffaqiyatli kirdingiz', role: 'admin' };
  }

  // 2. Demo code check
  if (trimmed === '07080717') {
    if (!ALLOW_DEMO_CODE) {
      return { success: false, message: 'Sinov (demo) kodi ushbu muhitda o\'chirilgan. Iltimos rasmiy kod oling.' };
    }
    return { success: true, message: 'Sinov kodi muvaffaqiyatli qabul qilindi', role: 'student' };
  }

  // 3. Database stored access codes
  const found = db.findAccessCode(trimmed);
  if (!found) {
    return { success: false, message: 'Kiritilgan kirish kodi noto\'g\'ri yoki mavjud emas.' };
  }

  if (found.usedCount >= found.maxUses) {
    return { success: false, message: 'Ushbu kirish kodidan foydalanish chegarasi tugagan.' };
  }

  if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
    return { success: false, message: 'Ushbu kirish kodining amal qilish muddati o\'tgan.' };
  }

  // Increment usage
  db.incrementCodeUsage(trimmed);
  return { success: true, message: 'Kirish kodi muvaffaqiyatli tasdiqlandi', role: 'student' };
}
