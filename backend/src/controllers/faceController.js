import prisma from '../config/db.js';
import ai from '../services/ai/index.js';
import { asyncHandler, ApiError } from '../middleware/error.js';

const PRIVATE_ROLES = ['ADMIN', 'PHOTOGRAPHER', 'CLUB_MEMBER'];
const canSeePrivate = (user) => !!user && PRIVATE_ROLES.includes(user.role);

/**
 * POST /api/face/match   { descriptor: number[128] }
 * Find all photos containing the given face. The descriptor is computed on the
 * client from a reference selfie with face-api.js.
 */
export const matchFaces = asyncHandler(async (req, res) => {
  const { descriptor } = req.body;
  if (!Array.isArray(descriptor) || descriptor.length === 0) {
    throw new ApiError(400, 'A face descriptor array is required');
  }

  const matches = await ai.matchFaces(descriptor);
  if (!matches.length) return res.json({ media: [] });

  const ids = matches.map((m) => m.mediaId);
  const distanceById = Object.fromEntries(matches.map((m) => [m.mediaId, m.distance]));

  const where = { id: { in: ids } };
  if (!canSeePrivate(req.user)) where.visibility = 'PUBLIC';

  const media = await prisma.media.findMany({
    where,
    include: {
      uploadedBy: { select: { id: true, name: true } },
      event: { select: { id: true, name: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  // Preserve match order (closest first) and expose a confidence score.
  const ordered = media
    .map((m) => ({
      ...m,
      likeCount: m._count.likes,
      commentCount: m._count.comments,
      matchDistance: distanceById[m.id],
      matchConfidence: Math.max(0, Math.round((1 - distanceById[m.id]) * 100)),
    }))
    .sort((a, b) => a.matchDistance - b.matchDistance);

  res.json({ media: ordered });
});

/**
 * POST /api/face/match-me  -> uses the stored reference-selfie descriptor on the
 * authenticated user's profile ("My Photos" personalized section).
 */
export const matchMyFace = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { faceDescriptor: true },
  });
  if (!user?.faceDescriptor?.length) {
    throw new ApiError(400, 'No reference selfie on file. Upload one in your profile first.');
  }
  req.body.descriptor = user.faceDescriptor;
  return matchFaces(req, res);
});
