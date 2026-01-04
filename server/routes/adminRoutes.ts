import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Stats is accessible by any authenticated user for now, moving it to separate route or keeping strict admin?
// Original app.get('/api/stats') was authenticated but not isAdmin.
// So we will separate stats if we want to be strict, or just import it in generic router.
// For now, let's keep generic stats separate from strict admin routes.

// Strict Admin Routes
router.get('/users', authenticate, isAdmin, adminController.getUsers);
router.patch('/users/:id', authenticate, isAdmin, adminController.updateUser);

export default router;
