import prisma from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';

const PRIVATE_ROLES = ['ADMIN', 'PHOTOGRAPHER', 'CLUB_MEMBER'];
const canSeePrivate = (user) => !!user && PRIVATE_ROLES.includes(user.role);

/**
 * GET /api/search
 * Advanced search by: event name, tag, uploader name, and upload date range.
 * query: q (free text -> caption/event/tag), tag, event, user, from, to, sort
 */
export const search = asyncHandler(async (req, res) => {
  const { q, tag, event, user, from, to, sort = 'new' } = req.query;

  const and = [];
  if (!canSeePrivate(req.user)) and.push({ visibility: 'PUBLIC' });

  if (q) {
    and.push({
      OR: [
        { caption: { contains: q, mode: 'insensitive' } },
        { event: { name: { contains: q, mode: 'insensitive' } } },
        { tags: { some: { tag: { name: { contains: q, mode: 'insensitive' } } } } },
        { uploadedBy: { name: { contains: q, mode: 'insensitive' } } },
      ],
    });
  }
  if (tag) and.push({ tags: { some: { tag: { name: { equals: tag.toLowerCase() } } } } });
  if (event) and.push({ event: { name: { contains: event, mode: 'insensitive' } } });
  if (user) and.push({ uploadedBy: { name: { contains: user, mode: 'insensitive' } } });
  if (from || to) {
    and.push({
      createdAt: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
      },
    });
  }

  const orderBy =
    sort === 'popular' ? [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }] : { createdAt: 'desc' };

  const media = await prisma.media.findMany({
    where: and.length ? { AND: and } : {},
    orderBy,
    take: 60,
    include: {
      uploadedBy: { select: { id: true, name: true, avatarUrl: true } },
      event: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  res.json({
    media: media.map((m) => ({
      ...m,
      tags: m.tags.map((t) => ({ name: t.tag.name, confidence: t.confidence })),
      likeCount: m._count.likes,
      commentCount: m._count.comments,
    })),
  });
});

// GET /api/search/tags  -> popular tags (for tag cloud / suggestions)
export const popularTags = asyncHandler(async (req, res) => {
  const tags = await prisma.tag.findMany({
    include: { _count: { select: { media: true } } },
    orderBy: { media: { _count: 'desc' } },
    take: 40,
  });
  res.json({ tags: tags.map((t) => ({ name: t.name, count: t._count.media })) });
});
