import { Router } from 'express';
import { search, popularTags } from '../controllers/searchController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, search);
router.get('/tags', popularTags);

export default router;
