import express from 'express';
import * as whatsappController from '../controllers/whatsappController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

router.get('/status', whatsappController.getStatus);
router.post('/connect', whatsappController.connect);
router.post('/disconnect', whatsappController.disconnect);
router.get('/chats', whatsappController.getChats);
router.get('/chats/:id/messages', whatsappController.getMessages);
router.post('/send', whatsappController.send);
router.patch('/chats/:id/read', whatsappController.markRead);

// Templates
router.get('/templates', whatsappController.getTemplates);
router.post('/templates', whatsappController.createTemplate);
router.put('/templates/:id', whatsappController.updateTemplate);
router.delete('/templates/:id', whatsappController.deleteTemplate);

// Analytics & Settings
router.get('/analytics', whatsappController.getAnalytics);
router.get('/settings', whatsappController.getSettings);
router.post('/settings', whatsappController.updateSettings);

// Tags
router.get('/tags', whatsappController.getTags);
router.get('/contacts/:phone/tags', whatsappController.getContactTags);
router.post('/contacts/:phone/tags', whatsappController.addContactTag);
router.delete('/contacts/:phone/tags/:tagId', whatsappController.removeContactTag);

// Upload
router.post('/upload', upload.single('file'), whatsappController.uploadFile);

export default router;
