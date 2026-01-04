import express from 'express';
import { scrapeContacts, parseLeads, searchLeads } from '../controllers/importController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/scrape', scrapeContacts);
router.post('/leads/parse', parseLeads);
router.post('/leads/search', searchLeads);

export default router;
