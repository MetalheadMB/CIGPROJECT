import { Router } from 'express';
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  createAlbum,
  listCategories,
} from '../controllers/eventController.js';
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, listEvents);
router.get('/categories', listCategories);
router.get('/:id', optionalAuth, getEvent);

// Creating/managing events is limited to organizers.
router.post('/', requireAuth, requireRole('ADMIN', 'PHOTOGRAPHER'), createEvent);
router.patch('/:id', requireAuth, requireRole('ADMIN', 'PHOTOGRAPHER'), updateEvent);
router.delete('/:id', requireAuth, requireRole('ADMIN', 'PHOTOGRAPHER'), deleteEvent);
router.post('/:id/albums', requireAuth, requireRole('ADMIN', 'PHOTOGRAPHER'), createAlbum);

export default router;
