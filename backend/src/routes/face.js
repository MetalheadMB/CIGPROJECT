import { Router } from 'express';
import { matchFaces, matchMyFace } from '../controllers/faceController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Match against an ad-hoc selfie descriptor
router.post('/match', optionalAuth, matchFaces);
// Match against the stored profile selfie ("My Photos")
router.post('/match-me', requireAuth, matchMyFace);

export default router;
