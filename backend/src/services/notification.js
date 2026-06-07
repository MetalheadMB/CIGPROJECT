import prisma from '../config/db.js';
import { emitToUser } from '../socket.js';

/**
 * Persist a notification and push it to the recipient in real time.
 * No-op when the recipient is also the actor (don't notify yourself).
 */
export async function notify({ recipientId, actorId, type, message, mediaId }) {
  if (!recipientId || recipientId === actorId) return null;

  const notification = await prisma.notification.create({
    data: { recipientId, actorId, type, message, mediaId },
    include: {
      actor: { select: { id: true, name: true, avatarUrl: true } },
      media: { select: { id: true, thumbnailUrl: true, url: true } },
    },
  });

  emitToUser(recipientId, 'notification', notification);
  return notification;
}
