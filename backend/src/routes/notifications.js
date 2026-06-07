import { Router } from 'express';
import { listNotifications, markRead } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listNotifications);
router.post('/read', requireAuth, markRead);

export default router;
