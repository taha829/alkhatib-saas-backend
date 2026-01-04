import express from 'express';
import { getContacts, updateContactStatus, deleteContact, updateContactStatusLegacy, syncPatientsFromChats } from '../controllers/contactController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All contact routes require authentication
router.use(authenticate);

router.get('/', getContacts);
router.post('/sync', syncPatientsFromChats);
router.patch('/:id', updateContactStatus);
router.delete('/:id', deleteContact);

// Legacy/Duplicate routes handling (if frontend uses them) changes
router.put('/:id/status', updateContactStatusLegacy);

export default router;
