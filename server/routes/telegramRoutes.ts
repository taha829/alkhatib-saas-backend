import express from 'express';
import * as telegramController from '../controllers/telegramController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/status', telegramController.getStatus);
router.post('/start', telegramController.start);
router.post('/stop', telegramController.stop);

export default router;
