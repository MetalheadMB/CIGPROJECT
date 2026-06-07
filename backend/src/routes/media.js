import { Router } from 'express';
import {
  uploadMedia,
  listMedia,
  getMedia,
  deleteMedia,
  downloadMedia,
} from '../controllers/mediaController.js';
import {
  toggleLike,
  toggleFavorite,
  myFavorites,
  addComment,
  deleteComment,
  tagUser,
  createShare,
} from '../controllers/socialController.js';
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth.js';
import { bulkUpload } from '../middleware/upload.js';

const router = Router();

// Feed + favorites
router.get('/', optionalAuth, listMedia);
router.get('/favorites/mine', requireAuth, myFavorites);

// Upload (bulk) — photographers/admins/members can upload
router.post(
  '/upload',
  requireAuth,
  requireRole('ADMIN', 'PHOTOGRAPHER', 'CLUB_MEMBER'),
  bulkUpload,
  uploadMedia
);

// Single media
router.get('/:id', optionalAuth, getMedia);
router.delete('/:id', requireAuth, deleteMedia);
router.get('/:id/download', optionalAuth, downloadMedia);

// Social interactions
router.post('/:id/like', requireAuth, toggleLike);
router.post('/:id/favorite', requireAuth, toggleFavorite);
router.post('/:id/comments', requireAuth, addComment);
router.delete('/:id/comments/:commentId', requireAuth, deleteComment);
router.post('/:id/tag-user', requireAuth, tagUser);
router.post('/:id/share', requireAuth, createShare);

export default router;
