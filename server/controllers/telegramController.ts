import { Request, Response } from 'express';
import { initializeTelegramService, startTelegramBot, stopTelegramBot, getTelegramStatus } from '../telegram/index.js';

export const getStatus = (req: Request, res: Response) => {
    res.json(getTelegramStatus());
};

export const start = async (req: Request, res: Response) => {
    const { token } = req.body;
    try {
        await startTelegramBot(token);
        res.json({ success: true, message: 'Telegram bot started' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const stop = async (req: Request, res: Response) => {
    try {
        await stopTelegramBot();
        res.json({ success: true, message: 'Telegram bot stopped' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
