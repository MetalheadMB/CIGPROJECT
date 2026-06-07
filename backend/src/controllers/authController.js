import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import env from '../config/env.js';
import { asyncHandler, ApiError } from '../middleware/error.js';

const PUBLIC_USER = {
  id: true,
  email: true,
  name: true,
  role: true,
  clubName: true,
  avatarUrl: true,
  createdAt: true,
};

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

const VALID_ROLES = ['ADMIN', 'PHOTOGRAPHER', 'CLUB_MEMBER', 'VIEWER'];

export const register = asyncHandler(async (req, res) => {
  const { email, password, name, role, clubName } = req.body;
  if (!email || !password || !name) {
    throw new ApiError(400, 'name, email and password are required');
  }
  if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  // First user becomes ADMIN; otherwise use requested role (defaults to VIEWER).
  const count = await prisma.user.count();
  let assignedRole = VALID_ROLES.includes(role) ? role : 'VIEWER';
  if (count === 0) assignedRole = 'ADMIN';

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), password: hash, name, role: assignedRole, clubName },
    select: PUBLIC_USER,
  });

  res.status(201).json({ user, token: signToken(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'email and password are required');

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw new ApiError(401, 'Invalid credentials');

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new ApiError(401, 'Invalid credentials');

  const { password: _pw, faceDescriptor: _fd, ...safe } = user;
  res.json({ user: safe, token: signToken(user) });
});

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { ...PUBLIC_USER, faceDescriptor: true },
  });
  res.json({ user: { ...user, hasFaceProfile: (user.faceDescriptor?.length || 0) > 0 } });
});

// Update profile basics + optionally store the reference selfie descriptor.
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, clubName, avatarUrl, faceDescriptor } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (clubName !== undefined) data.clubName = clubName;
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
  if (Array.isArray(faceDescriptor)) data.faceDescriptor = faceDescriptor;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: { ...PUBLIC_USER, faceDescriptor: true },
  });
  res.json({ user: { ...user, hasFaceProfile: (user.faceDescriptor?.length || 0) > 0 } });
});
