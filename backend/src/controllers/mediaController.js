import { nanoid } from 'nanoid';
import prisma from '../config/db.js';
import storage from '../services/storage/index.js';
import { optimizeImage, watermarkImage } from '../services/image.js';
import { asyncHandler, ApiError } from '../middleware/error.js';

// Members who may view PRIVATE media. Viewers + anonymous see public only.
const PRIVATE_ROLES = ['ADMIN', 'PHOTOGRAPHER', 'CLUB_MEMBER'];
const canSeePrivate = (user) => !!user && PRIVATE_ROLES.includes(user.role);

function visibilityFilter(user) {
  return canSeePrivate(user) ? {} : { visibility: 'PUBLIC' };
}

// Shape a media row for the client, adding liked/favorited flags for the viewer.
function decorate(media, userId) {
  const liked = userId ? media.likes?.some((l) => l.userId === userId) : false;
  const favorited = userId ? media.favorites?.some((f) => f.userId === userId) : false;
  const { likes, favorites, ...rest } = media;
  return {
    ...rest,
    tags: media.tags?.map((t) => ({ name: t.tag.name, confidence: t.confidence })) || [],
    likeCount: media._count?.likes ?? 0,
    commentCount: media._count?.comments ?? 0,
    liked,
    favorited,
  };
}

const mediaInclude = {
  uploadedBy: { select: { id: true, name: true, avatarUrl: true } },
  event: { select: { id: true, name: true, clubName: true } },
  tags: { include: { tag: true } },
  _count: { select: { likes: true, comments: true } },
};

/**
 * POST /api/media/upload  (multipart)
 * fields: eventId, albumId?, visibility?, caption?
 * files:  files[]  (aligned with `meta`)
 * meta:   JSON string -> [{ caption?, tags:[{name,confidence}], faces:[{descriptor, box}] }, ...]
 *         (tags + face descriptors are computed client-side with TF.js / face-api.js)
 */
export const uploadMedia = asyncHandler(async (req, res) => {
  const { eventId, albumId, visibility } = req.body;
  if (!eventId) throw new ApiError(400, 'eventId is required');
  if (!req.files?.length) throw new ApiError(400, 'No files uploaded');

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new ApiError(404, 'Event not found');

  let meta = [];
  try {
    meta = req.body.meta ? JSON.parse(req.body.meta) : [];
  } catch {
    meta = [];
  }

  const vis = visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
  const created = [];

  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];
    const m = meta[i] || {};
    const isImage = file.mimetype.startsWith('image/');
    const key = `${eventId}/${nanoid(12)}`;

    let url;
    let thumbnailUrl = null;
    let width = null;
    let height = null;
    let storageKey;

    if (isImage) {
      const { optimized, thumbnail, width: w, height: h } = await optimizeImage(file.buffer);
      const main = await storage.save(optimized, `${key}.jpg`, 'image/jpeg');
      const thumb = await storage.save(thumbnail, `${key}_thumb.jpg`, 'image/jpeg');
      url = main.url;
      storageKey = main.key;
      thumbnailUrl = thumb.url;
      width = w;
      height = h;
    } else {
      const ext = (file.originalname.split('.').pop() || 'mp4').toLowerCase();
      const saved = await storage.save(file.buffer, `${key}.${ext}`, file.mimetype);
      url = saved.url;
      storageKey = saved.key;
    }

    const media = await prisma.media.create({
      data: {
        type: isImage ? 'IMAGE' : 'VIDEO',
        url,
        thumbnailUrl,
        storageKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        width,
        height,
        caption: m.caption || req.body.caption || null,
        visibility: vis,
        eventId,
        albumId: albumId || null,
        uploadedById: req.user.id,
      },
    });

    // Smart tags (client-computed via MobileNet)
    if (Array.isArray(m.tags) && m.tags.length) {
      for (const t of m.tags) {
        if (!t?.name) continue;
        const name = String(t.name).toLowerCase().trim();
        const tag = await prisma.tag.upsert({
          where: { name },
          update: {},
          create: { name },
        });
        await prisma.mediaTag.upsert({
          where: { mediaId_tagId: { mediaId: media.id, tagId: tag.id } },
          update: { confidence: t.confidence ?? 1 },
          create: { mediaId: media.id, tagId: tag.id, confidence: t.confidence ?? 1, source: 'ai' },
        });
      }
    }

    // Face descriptors (client-computed via face-api.js) for personalized discovery
    if (Array.isArray(m.faces) && m.faces.length) {
      await prisma.faceDescriptor.createMany({
        data: m.faces
          .filter((f) => Array.isArray(f.descriptor) && f.descriptor.length)
          .map((f) => ({ mediaId: media.id, descriptor: f.descriptor, boundingBox: f.box || null })),
      });
    }

    created.push(media.id);
  }

  const result = await prisma.media.findMany({
    where: { id: { in: created } },
    include: mediaInclude,
  });
  res.status(201).json({ media: result.map((m) => decorate(m, req.user.id)) });
});

/**
 * GET /api/media  -> paginated feed (infinite scroll)
 * query: eventId?, albumId?, type?, cursor?, limit?, sort=new|popular
 */
export const listMedia = asyncHandler(async (req, res) => {
  const { eventId, albumId, type, cursor, sort = 'new' } = req.query;
  const limit = Math.min(parseInt(req.query.limit || '24', 10), 60);

  const where = { ...visibilityFilter(req.user) };
  if (eventId) where.eventId = eventId;
  if (albumId) where.albumId = albumId;
  if (type) where.type = type.toUpperCase();

  const orderBy =
    sort === 'popular' ? [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }] : { createdAt: 'desc' };

  const items = await prisma.media.findMany({
    where,
    orderBy,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      ...mediaInclude,
      likes: req.user ? { where: { userId: req.user.id }, select: { userId: true } } : false,
      favorites: req.user ? { where: { userId: req.user.id }, select: { userId: true } } : false,
    },
  });

  let nextCursor = null;
  if (items.length > limit) nextCursor = items.pop().id;

  res.json({ media: items.map((m) => decorate(m, req.user?.id)), nextCursor });
});

export const getMedia = asyncHandler(async (req, res) => {
  const media = await prisma.media.findUnique({
    where: { id: req.params.id },
    include: {
      ...mediaInclude,
      album: { select: { id: true, name: true } },
      userTags: { include: { taggedUser: { select: { id: true, name: true, avatarUrl: true } } } },
      comments: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
      likes: req.user ? { where: { userId: req.user.id }, select: { userId: true } } : false,
      favorites: req.user ? { where: { userId: req.user.id }, select: { userId: true } } : false,
    },
  });
  if (!media) throw new ApiError(404, 'Media not found');
  if (media.visibility === 'PRIVATE' && !canSeePrivate(req.user)) {
    throw new ApiError(403, 'This media is private');
  }
  res.json({ media: { ...decorate(media, req.user?.id), comments: media.comments, userTags: media.userTags } });
});

export const deleteMedia = asyncHandler(async (req, res) => {
  const media = await prisma.media.findUnique({ where: { id: req.params.id } });
  if (!media) throw new ApiError(404, 'Media not found');
  if (media.uploadedById !== req.user.id && req.user.role !== 'ADMIN') {
    throw new ApiError(403, 'Only the uploader or an admin can delete this media');
  }
  if (media.storageKey) {
    await storage.delete(media.storageKey).catch(() => {});
    if (media.thumbnailUrl) await storage.delete(`${media.storageKey.replace('.jpg', '')}_thumb.jpg`).catch(() => {});
  }
  await prisma.media.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

/**
 * GET /api/media/:id/download  -> returns a watermarked image (auto watermark on download).
 * Watermark text is built dynamically from club name / event name / user role.
 */
export const downloadMedia = asyncHandler(async (req, res) => {
  const media = await prisma.media.findUnique({
    where: { id: req.params.id },
    include: { event: { select: { name: true, clubName: true } } },
  });
  if (!media) throw new ApiError(404, 'Media not found');
  if (media.visibility === 'PRIVATE' && !canSeePrivate(req.user)) {
    throw new ApiError(403, 'This media is private');
  }
  if (!media.storageKey) throw new ApiError(400, 'Original file unavailable');

  const buffer = await storage.read(media.storageKey);

  if (media.type === 'IMAGE') {
    const wm = await watermarkImage(buffer, {
      clubName: media.event?.clubName || 'CIG',
      eventName: media.event?.name,
      role: req.user?.role || 'GUEST',
    });
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${media.id}.jpg"`);
    return res.send(wm);
  }

  res.setHeader('Content-Type', media.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${media.originalName || media.id}"`);
  res.send(buffer);
});
