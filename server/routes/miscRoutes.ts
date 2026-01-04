import express, { Request, Response } from 'express';
import db from '../database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper for stats
const getStats = (req: any, res: Response) => {
    const contactsCount: any = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE user_id = ?').get(req.user.id);
    const groupsCount: any = db.prepare('SELECT COUNT(*) as count FROM groups WHERE user_id = ?').get(req.user.id);
    res.json({ contacts: contactsCount.count, groups: groupsCount.count });
};

// Start Posts Controller Logic (kept simple here as it's small)
const getPosts = (req: any, res: Response) => {
    const posts = db.prepare(`
    SELECT p.*, g.name as group_name, g.platform 
    FROM posts p 
    LEFT JOIN groups g ON p.group_id = g.id 
    WHERE g.user_id = ? 
    ORDER BY p.created_at DESC
  `).all(req.user.id);
    res.json(posts);
};

router.get('/stats', authenticate, getStats);
router.get('/posts', authenticate, getPosts);

export default router;
