import { Request, Response } from 'express';
import db from '../database.js';

export const getUsers = (req: Request, res: Response) => {
    const users = db.prepare('SELECT id, email, role, status, expiry_date, created_at FROM users').all();
    res.json(users);
};

export const updateUser = (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, expiry_date } = req.body;

    if (status) db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id);
    if (expiry_date) db.prepare('UPDATE users SET expiry_date = ? WHERE id = ?').run(expiry_date, id);

    res.json({ success: true });
};

export const getStats = (req: any, res: Response) => {
    const contactsCount: any = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE user_id = ?').get(req.user.id);
    const groupsCount: any = db.prepare('SELECT COUNT(*) as count FROM groups WHERE user_id = ?').get(req.user.id);
    res.json({ contacts: contactsCount.count, groups: groupsCount.count });
};
