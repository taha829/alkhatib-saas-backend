import express from 'express';
import { login, register, getProfile, updateProfile, updateAvatar } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Profile Routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/profile/avatar', authenticate, upload.single('avatar'), updateAvatar);

export default router;
