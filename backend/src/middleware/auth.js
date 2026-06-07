import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import prisma from '../config/db.js';
import { ApiError } from './error.js';

// Verify JWT and attach the user to req.user. Hard requirement.
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Authentication required');

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, role: true, clubName: true, avatarUrl: true },
    });
    if (!user) throw new ApiError(401, 'User no longer exists');

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

// Soft auth: attach user if a valid token is present, otherwise continue anonymously.
export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, role: true, clubName: true, avatarUrl: true },
    });
    if (user) req.user = user;
  } catch {
    /* ignore -> anonymous */
  }
  next();
}

// Role-based access control. Usage: requireRole('ADMIN', 'PHOTOGRAPHER')
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}
