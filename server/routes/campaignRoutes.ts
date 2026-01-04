import express from 'express';
import { createCampaign, getCampaigns, getCampaignById, updateCampaignAction } from '../controllers/campaignController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createCampaign);
router.get('/', getCampaigns);
router.get('/:id', getCampaignById);
router.post('/:id/action', updateCampaignAction);

export default router;
