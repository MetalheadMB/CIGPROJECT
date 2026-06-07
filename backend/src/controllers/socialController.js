import { nanoid } from 'nanoid';
import prisma from '../config/db.js';
import { asyncHandler, ApiError } from '../middleware/error.js';
import { notify } from '../services/notification.js';

async function getMediaOrThrow(id) {
  const media = await prisma.media.findUnique({
    where: { id },
    select: { id: true, uploadedById: true },
  });
  if (!media) throw new ApiError(404, 'Media not found');
  return media;
}

// POST /api/media/:id/like  (toggle)
export const toggleLike = asyncHandler(async (req, res) => {
  const media = await getMediaOrThrow(req.params.id);
  const existing = await prisma.like.findUnique({
    where: { userId_mediaId: { userId: req.user.id, mediaId: media.id } },
  });

  if (existing) {
    await prisma.like.delete({
      where: { userId_mediaId: { userId: req.user.id, mediaId: media.id } },
    });
  } else {
    await prisma.like.create({ data: { userId: req.user.id, mediaId: media.id } });
    await notify({
      recipientId: media.uploadedById,
      actorId: req.user.id,
      type: 'LIKE',
      message: `${req.user.name} liked your photo`,
      mediaId: media.id,
    });
  }

  const likeCount = await prisma.like.count({ where: { mediaId: media.id } });
  res.json({ liked: !existing, likeCount });
});

// POST /api/media/:id/favorite  (toggle)
export const toggleFavorite = asyncHandler(async (req, res) => {
  const media = await getMediaOrThrow(req.params.id);
  const existing = await prisma.favorite.findUnique({
    where: { userId_mediaId: { userId: req.user.id, mediaId: media.id } },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { userId_mediaId: { userId: req.user.id, mediaId: media.id } },
    });
  } else {
    await prisma.favorite.create({ data: { userId: req.user.id, mediaId: media.id } });
  }
  res.json({ favorited: !existing });
});

// GET /api/media/favorites/mine
export const myFavorites = asyncHandler(async (req, res) => {
  const favs = await prisma.favorite.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      media: {
        include: {
          uploadedBy: { select: { id: true, name: true } },
          event: { select: { id: true, name: true } },
          _count: { select: { likes: true, comments: true } },
        },
      },
    },
  });
  res.json({
    media: favs.map((f) => ({
      ...f.media,
      likeCount: f.media._count.likes,
      commentCount: f.media._count.comments,
      favorited: true,
    })),
  });
});

// POST /api/media/:id/comments  { text }
export const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) throw new ApiError(400, 'Comment text is required');
  const media = await getMediaOrThrow(req.params.id);

  const comment = await prisma.comment.create({
    data: { text: text.trim(), mediaId: media.id, userId: req.user.id },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  await notify({
    recipientId: media.uploadedById,
    actorId: req.user.id,
    type: 'COMMENT',
    message: `${req.user.name} commented on your upload`,
    mediaId: media.id,
  });

  res.status(201).json({ comment });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } });
  if (!comment) throw new ApiError(404, 'Comment not found');
  if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new ApiError(403, 'Not allowed');
  }
  await prisma.comment.delete({ where: { id: req.params.commentId } });
  res.json({ success: true });
});

// POST /api/media/:id/tag-user  { userId }   (tag friends/users)
export const tagUser = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) throw new ApiError(400, 'userId is required');
  const media = await getMediaOrThrow(req.params.id);

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
  if (!target) throw new ApiError(404, 'User to tag not found');

  const tag = await prisma.mediaUserTag.upsert({
    where: { mediaId_taggedUserId: { mediaId: media.id, taggedUserId: userId } },
    update: {},
    create: { mediaId: media.id, taggedUserId: userId, taggedById: req.user.id },
    include: { taggedUser: { select: { id: true, name: true, avatarUrl: true } } },
  });

  await notify({
    recipientId: userId,
    actorId: req.user.id,
    type: 'TAG',
    message: `${req.user.name} tagged you in a photo`,
    mediaId: media.id,
  });

  res.status(201).json({ tag });
});

// POST /api/media/:id/share  -> returns a shareable token/link (also usable for QR)
export const createShare = asyncHandler(async (req, res) => {
  const media = await getMediaOrThrow(req.params.id);
  const token = nanoid(10);
  await prisma.share.create({
    data: { token, mediaId: media.id, createdById: req.user.id },
  });
  res.status(201).json({ token, url: `/m/${media.id}?s=${token}` });
});
