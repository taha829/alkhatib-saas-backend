import { Request, Response } from 'express';
import db from '../database.js';

export const createCampaign = (req: Request, res: Response) => {
    const { name, message, platform, recipients } = req.body;

    if (!recipients || recipients.length === 0) {
        return res.status(400).json({ error: 'No recipients provided' });
    }

    try {
        const result = db.prepare('INSERT INTO campaigns (name, message, platform, total_recipients, status) VALUES (?, ?, ?, ?, ?)')
            .run(name, message, platform, recipients.length, 'running');

        const campaignId = result.lastInsertRowid;

        const insertRecipient = db.prepare('INSERT INTO campaign_recipients (campaign_id, phone, name) VALUES (?, ?, ?)');
        const insertMany = db.transaction((recipientsList) => {
            for (const r of recipientsList) insertRecipient.run(campaignId, r.phone, r.name || 'Unknown');
        });
        insertMany(recipients);

        res.json({ success: true, campaignId });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCampaigns = (req: Request, res: Response) => {
    const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all();
    res.json(campaigns);
};

export const getCampaignById = (req: Request, res: Response) => {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    res.json(campaign);
};

export const updateCampaignAction = (req: Request, res: Response) => {
    const { action } = req.body; // 'pause' | 'resume'
    const status = action === 'pause' ? 'paused' : 'running';
    db.prepare('UPDATE campaigns SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
};
