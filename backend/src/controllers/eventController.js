import prisma from '../config/db.js';
import { asyncHandler, ApiError } from '../middleware/error.js';

// GET /api/events?sort=name|date|category&order=asc|desc&category=&q=
export const listEvents = asyncHandler(async (req, res) => {
  const { sort = 'date', order = 'desc', category, q } = req.query;

  const sortMap = { name: 'name', date: 'date', category: 'category', created: 'createdAt' };
  const orderBy = { [sortMap[sort] || 'date']: order === 'asc' ? 'asc' : 'desc' };

  // Anonymous users only see public events.
  const where = {};
  if (!req.user) where.visibility = 'PUBLIC';
  if (category) where.category = category;
  if (q) where.name = { contains: q, mode: 'insensitive' };

  const events = await prisma.event.findMany({
    where,
    orderBy,
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { media: true, albums: true } },
    },
  });
  res.json({ events });
});

export const getEvent = asyncHandler(async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: {
      createdBy: { select: { id: true, name: true, avatarUrl: true } },
      albums: { include: { _count: { select: { media: true } } }, orderBy: { createdAt: 'asc' } },
      _count: { select: { media: true } },
    },
  });
  if (!event) throw new ApiError(404, 'Event not found');
  if (event.visibility === 'PRIVATE' && !req.user) {
    throw new ApiError(403, 'This event is private. Please sign in.');
  }
  res.json({ event });
});

export const createEvent = asyncHandler(async (req, res) => {
  const { name, description, category, clubName, date, coverUrl, visibility } = req.body;
  if (!name) throw new ApiError(400, 'Event name is required');

  const event = await prisma.event.create({
    data: {
      name,
      description,
      category,
      clubName: clubName || req.user.clubName,
      date: date ? new Date(date) : null,
      coverUrl,
      visibility: visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
      createdById: req.user.id,
    },
  });
  res.status(201).json({ event });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) throw new ApiError(404, 'Event not found');
  if (event.createdById !== req.user.id && req.user.role !== 'ADMIN') {
    throw new ApiError(403, 'Only the creator or an admin can edit this event');
  }
  const { name, description, category, clubName, date, coverUrl, visibility } = req.body;
  const updated = await prisma.event.update({
    where: { id: req.params.id },
    data: {
      name,
      description,
      category,
      clubName,
      date: date ? new Date(date) : undefined,
      coverUrl,
      visibility,
    },
  });
  res.json({ event: updated });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) throw new ApiError(404, 'Event not found');
  if (event.createdById !== req.user.id && req.user.role !== 'ADMIN') {
    throw new ApiError(403, 'Only the creator or an admin can delete this event');
  }
  await prisma.event.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// ---- Albums ----

export const createAlbum = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) throw new ApiError(404, 'Event not found');
  if (!name) throw new ApiError(400, 'Album name is required');

  const album = await prisma.album.create({
    data: { name, description, eventId: event.id, createdById: req.user.id },
  });
  res.status(201).json({ album });
});

// Distinct list of categories (for filters / sort UI)
export const listCategories = asyncHandler(async (req, res) => {
  const rows = await prisma.event.findMany({
    where: { category: { not: null } },
    distinct: ['category'],
    select: { category: true },
  });
  res.json({ categories: rows.map((r) => r.category).filter(Boolean) });
});
