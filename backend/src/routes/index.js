import { Router } from 'express';
import auth from './auth.js';
import events from './events.js';
import media from './media.js';
import search from './search.js';
import face from './face.js';
import notifications from './notifications.js';
import users from './users.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

router.use('/auth', auth);
router.use('/events', events);
router.use('/media', media);
router.use('/search', search);
router.use('/face', face);
router.use('/notifications', notifications);
router.use('/users', users);

export default router;
