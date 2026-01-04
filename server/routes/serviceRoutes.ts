import express from 'express';
import * as serviceController from '../controllers/serviceController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', serviceController.getServices);
router.post('/', serviceController.createService);
router.delete('/:id', serviceController.deleteService);

export default router;
