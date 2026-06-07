import { Router } from 'express';
import { listUsers, updateRole, stats } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listUsers);
router.get('/stats', requireAuth, requireRole('ADMIN'), stats);
router.patch('/:id/role', requireAuth, requireRole('ADMIN'), updateRole);

export default router;
