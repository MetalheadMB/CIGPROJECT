import prisma from '../config/db.js';
import { asyncHandler, ApiError } from '../middleware/error.js';

const PUBLIC_USER = { id: true, name: true, email: true, role: true, clubName: true, avatarUrl: true };

// GET /api/users?q=  -> for tagging friends / admin management
export const listUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const users = await prisma.user.findMany({
    where: q
      ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] }
      : {},
    select: PUBLIC_USER,
    orderBy: { name: 'asc' },
    take: 50,
  });
  res.json({ users });
});

// PATCH /api/users/:id/role  { role }   (ADMIN only)
export const updateRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const valid = ['ADMIN', 'PHOTOGRAPHER', 'CLUB_MEMBER', 'VIEWER'];
  if (!valid.includes(role)) throw new ApiError(400, 'Invalid role');
  if (req.params.id === req.user.id) throw new ApiError(400, 'You cannot change your own role');

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
    select: PUBLIC_USER,
  });
  res.json({ user });
});

// GET /api/users/stats  -> analytics dashboard (ADMIN)
export const stats = asyncHandler(async (req, res) => {
  const [users, events, media, likes, comments, images, videos] = await Promise.all([
    prisma.user.count(),
    prisma.event.count(),
    prisma.media.count(),
    prisma.like.count(),
    prisma.comment.count(),
    prisma.media.count({ where: { type: 'IMAGE' } }),
    prisma.media.count({ where: { type: 'VIDEO' } }),
  ]);

  const topTags = await prisma.tag.findMany({
    include: { _count: { select: { media: true } } },
    orderBy: { media: { _count: 'desc' } },
    take: 10,
  });

  const roleGroups = await prisma.user.groupBy({ by: ['role'], _count: true });

  res.json({
    totals: { users, events, media, images, videos, likes, comments },
    topTags: topTags.map((t) => ({ name: t.name, count: t._count.media })),
    roles: roleGroups.map((r) => ({ role: r.role, count: r._count })),
  });
});
