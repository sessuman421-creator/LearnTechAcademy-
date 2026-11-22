import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db, type DbUserRow } from './db.ts';

export const ADMIN_EMAIL = 'sessuman421@gmail.com';
export const SESSION_COOKIE_NAME = 'learntech_session';

const EPHEMERAL_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

function getSessionSecret(): string {
  const envSecret = process.env.SESSION_SECRET?.trim();
  return envSecret && envSecret.length >= 16 ? envSecret : EPHEMERAL_FALLBACK_SECRET;
}

export interface SessionTokenPayload {
  sub: number;
  email: string;
  role: 'admin' | 'student';
}

export function signSessionToken(payload: SessionTokenPayload): string {
  return jwt.sign(payload, getSessionSecret(), { expiresIn: '7d' });
}

export function verifySessionToken(token: string): SessionTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getSessionSecret()) as unknown as SessionTokenPayload;
    if (!decoded || typeof decoded.sub !== 'number') return null;
    return decoded;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        result[key] = decodeURIComponent(val);
      } catch {
        result[key] = val;
      }
    }
  }
  return result;
}

export function setSessionCookie(req: Request, res: Response, token: string) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const maxAgeSec = 7 * 24 * 60 * 60;
  if (isHttps) {
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSec}; HttpOnly; Secure; SameSite=None; Partitioned`
    );
  } else {
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSec}; HttpOnly; SameSite=Lax`
    );
  }
}

export function clearSessionCookie(req: Request, res: Response) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  if (isHttps) {
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None; Partitioned`
    );
  } else {
    res.setHeader('Set-Cookie', `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
  }
}

export function extractAuthenticatedUser(req: Request): DbUserRow | null {
  const authHeader = req.headers.authorization;
  let rawToken = '';
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    rawToken = authHeader.slice(7).trim();
  }
  if (!rawToken) {
    const cookies = parseCookies(req.headers.cookie);
    rawToken = cookies[SESSION_COOKIE_NAME] || '';
  }
  if (!rawToken) return null;
  const payload = verifySessionToken(rawToken);
  if (!payload) return null;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub) as DbUserRow | undefined;
  return user ?? null;
}

export function verifyCsrfProtection(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  const requestedWith = req.headers['x-requested-with'];
  if (requestedWith === 'LearnTech') {
    return next();
  }
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === String(host)) {
        return next();
      }
    } catch {
      // fall through to reject
    }
  }
  return res.status(403).json({ error: 'Cross-site request validation failed.' });
}

export interface AuthenticatedRequest extends Request {
  authUser?: DbUserRow;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = extractAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  req.authUser = user;
  return next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = extractAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (user.email.toLowerCase() !== ADMIN_EMAIL || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access restricted to authorized administrator.' });
  }
  req.authUser = user;
  return next();
}
