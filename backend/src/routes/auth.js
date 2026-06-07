import { Router } from 'express';
import { register, login, me, updateProfile } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.patch('/profile', requireAuth, updateProfile);

export default router;
