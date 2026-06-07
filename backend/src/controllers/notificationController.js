import prisma from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';

// GET /api/notifications
export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { recipientId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      actor: { select: { id: true, name: true, avatarUrl: true } },
      media: { select: { id: true, thumbnailUrl: true, url: true } },
    },
  });
  const unread = await prisma.notification.count({
    where: { recipientId: req.user.id, read: false },
  });
  res.json({ notifications, unread });
});

// POST /api/notifications/read  { ids?: string[] }  (omit ids -> mark all read)
export const markRead = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  await prisma.notification.updateMany({
    where: {
      recipientId: req.user.id,
      ...(Array.isArray(ids) && ids.length ? { id: { in: ids } } : {}),
    },
    data: { read: true },
  });
  res.json({ success: true });
});
