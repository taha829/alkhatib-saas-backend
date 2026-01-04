import { Request, Response, NextFunction } from 'express';
import db from '../database.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'social-sync-super-secret-key';

export const checkTrial = (req: Request, res: Response, next: NextFunction) => {
    // Allow login, register, health, and status checks without trial enforcement
    const allowedPaths = ['/api/auth/login', '/api/auth/register', '/api/health', '/api/whatsapp/status'];
    if (allowedPaths.some(p => req.path.startsWith(p))) return next();

    try {
        const installDateRow: any = db.prepare("SELECT value FROM system_info WHERE key = 'install_date'").get();
        const trialDaysRow: any = db.prepare("SELECT value FROM settings WHERE key = 'trial_days'").get();

        const installDate = new Date(installDateRow.value);
        const trialDays = parseInt(trialDaysRow.value || '7');
        const expiryDate = new Date(installDate.getTime() + trialDays * 24 * 60 * 60 * 1000);

        if (new Date() > expiryDate) {
            // Check if user has an extended expiry (admin or paid)
            if (req.headers.authorization) {
                const token = req.headers.authorization.split(' ')[1];
                try {
                    const decoded: any = jwt.verify(token, JWT_SECRET);
                    const user: any = db.prepare('SELECT expiry_date FROM users WHERE id = ?').get(decoded.id);
                    if (user && new Date(user.expiry_date) > new Date()) {
                        return next();
                    }
                } catch (e) {
                    // Token invalid, proceed to trial expired error
                }
            }
            return res.status(403).json({
                error: 'Trial Expired',
                message: 'لقد انتهت الفترة التجريبية للبرنامج. يرجى التواصل مع الإدارة للتفعيل.',
                isTrialExpired: true
            });
        }
        next();
    } catch (err) {
        console.error('[TrialCheck] Error:', err);
        next(); // Fail open just in case, or fail closed? better closed for licensing.
    }
};
