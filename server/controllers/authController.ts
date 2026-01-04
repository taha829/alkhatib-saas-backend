import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'social-sync-super-secret-key';

export const register = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7); // 7 days trial

        const result = db.prepare('INSERT INTO users (email, password, expiry_date) VALUES (?, ?, ?)')
            .run(email, hashedPassword, expiryDate.toISOString());

        res.json({ success: true, userId: result.lastInsertRowid });
    } catch (err: any) {
        res.status(400).json({ error: 'Email already exists' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status === 'blocked') return res.status(403).json({ error: 'Account blocked' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, expiry_date: user.expiry_date, name: user.name, avatar: user.avatar } });
};

export const getProfile = (req: Request, res: Response) => {
    const user: any = db.prepare('SELECT id, email, role, name, avatar, expiry_date, created_at FROM users WHERE id = ?').get((req as any).user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
};

export const updateProfile = (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const userId = (req as any).user.id;

    try {
        if (name) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, userId);
        if (email) db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, userId);
        if (password) {
            const hashedPassword = bcrypt.hashSync(password, 10);
            db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, userId);
        }

        // Return updated user
        const updatedUser: any = db.prepare('SELECT id, email, role, name, avatar, expiry_date FROM users WHERE id = ?').get(userId);
        res.json({ success: true, user: updatedUser });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateAvatar = (req: any, res: Response) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const avatarUrl = `/uploads/${req.file.filename}`;
    db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatarUrl, req.user.id);

    res.json({ success: true, avatar: avatarUrl });
};
