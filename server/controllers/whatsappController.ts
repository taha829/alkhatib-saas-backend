import { Request, Response } from 'express';
import db from '../database.js';
import { startWhatsAppBot, sendMessage, getConnectionStatus, disconnectWhatsApp, logService } from '../whatsapp/bot.js';

export const getStatus = (req: Request, res: Response) => {
    const status = getConnectionStatus();
    logService(`[WhatsApp API] Status requested. Connected: ${status.connected}, QR present: ${!!status.qrCode}`);
    res.json(status);
};

export const connect = async (req: Request, res: Response) => {
    try {
        await startWhatsAppBot();
        res.json({ success: true, message: 'WhatsApp bot starting...' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const disconnect = async (req: Request, res: Response) => {
    try {
        await disconnectWhatsApp();
        res.json({ success: true, message: 'WhatsApp disconnected' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getChats = (req: Request, res: Response) => {
    const chats = db.prepare(`
    SELECT * FROM whatsapp_chats 
    WHERE status = 'active'
    ORDER BY last_message_time DESC
  `).all();
    res.json(chats);
};

export const getMessages = (req: Request, res: Response) => {
    const messages = db.prepare(`
    SELECT * FROM whatsapp_messages 
    WHERE chat_id = ?
    ORDER BY timestamp ASC
  `).all(req.params.id);
    res.json(messages);
};

export const send = async (req: Request, res: Response) => {
    const { phone, message, mediaUrl, mediaType } = req.body;
    console.log(`[API] Outgoing message request to: ${phone}`);
    try {
        await sendMessage(phone, message, { mediaUrl, mediaType });
        res.json({ success: true });
    } catch (error: any) {
        console.error(`[API] Failed to send message to ${phone}:`, error.message);
        res.status(500).json({ error: error.message });
    }
};

export const markRead = (req: Request, res: Response) => {
    db.prepare('UPDATE whatsapp_chats SET unread_count = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
};

// Templates
export const getTemplates = (req: Request, res: Response) => {
    const templates = db.prepare('SELECT * FROM auto_reply_templates ORDER BY priority ASC').all();
    res.json(templates);
};

export const createTemplate = (req: Request, res: Response) => {
    const { trigger, response, priority } = req.body;
    const result = db.prepare(`
    INSERT INTO auto_reply_templates (trigger, response, priority)
    VALUES (?, ?, ?)
  `).run(trigger, response, priority || 0);
    res.json({ success: true, id: result.lastInsertRowid });
};

export const updateTemplate = (req: Request, res: Response) => {
    const { trigger, response, is_active, priority } = req.body;
    db.prepare(`
    UPDATE auto_reply_templates 
    SET trigger = ?, response = ?, is_active = ?, priority = ?
    WHERE id = ?
  `).run(trigger, response, is_active ? 1 : 0, priority, req.params.id);
    res.json({ success: true });
};

export const deleteTemplate = (req: Request, res: Response) => {
    db.prepare('DELETE FROM auto_reply_templates WHERE id = ?').run(req.params.id);
    res.json({ success: true });
};

// Analytics & Settings
export const getAnalytics = (req: Request, res: Response) => {
    const stats = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM whatsapp_logs WHERE type = 'auto-reply') as auto_replies,
      (SELECT COUNT(*) FROM whatsapp_messages WHERE from_me = 0) as incoming_messages,
      (SELECT COUNT(*) FROM whatsapp_messages WHERE from_me = 1) as outgoing_messages
  `).get();

    const topTriggers = db.prepare(`
    SELECT t.trigger, COUNT(l.id) as count
    FROM auto_reply_templates t
    JOIN whatsapp_logs l ON t.id = l.trigger_id
    GROUP BY t.id
    ORDER BY count DESC
    LIMIT 5
  `).all();

    res.json({ stats, topTriggers });
};

export const getSettings = (req: Request, res: Response) => {
    const settings = db.prepare('SELECT * FROM settings').all();
    const config: any = {};
    settings.forEach((s: any) => config[s.key] = s.value);
    res.json(config);
};

export const updateSettings = (req: Request, res: Response) => {
    const settings = req.body;
    console.log('[API] Updating settings:', JSON.stringify(settings, null, 2));

    try {
        const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

        db.transaction(() => {
            Object.entries(settings).forEach(([key, value]) => {
                if (typeof value !== 'undefined') {
                    stmt.run(key, String(value));
                }
            });
        })();

        res.json({ success: true });
    } catch (error: any) {
        console.error('[API] Error updating settings:', error.message);
        res.status(500).json({ error: error.message || 'فشل تحديث الإعدادات في قاعدة البيانات' });
    }
};

// CRM Tags (Specific to WhatsApp context in UI mostly)
export const getTags = (req: Request, res: Response) => {
    const tags = db.prepare('SELECT * FROM customer_tags').all();
    res.json(tags);
};

export const getContactTags = (req: Request, res: Response) => {
    const tags = db.prepare(`
      SELECT t.* FROM customer_tags t
      JOIN customer_tag_map m ON t.id = m.tag_id
      WHERE m.phone = ?
    `).all(req.params.phone);
    res.json(tags);
};

export const addContactTag = (req: Request, res: Response) => {
    const { tagId } = req.body;
    try {
        db.prepare('INSERT OR IGNORE INTO customer_tag_map (phone, tag_id) VALUES (?, ?)').run(req.params.phone, tagId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const removeContactTag = (req: Request, res: Response) => {
    db.prepare('DELETE FROM customer_tag_map WHERE phone = ? AND tag_id = ?').run(req.params.phone, req.params.tagId);
    res.json({ success: true });
};

// Upload
export const uploadFile = (req: any, res: Response) => {
    console.log('[Upload] Received file upload request');
    if (!req.file) {
        console.error('[Upload] No file found in request');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`[Upload] File saved: ${req.file.filename}, size: ${req.file.size}`);
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
        url: fileUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype
    });
};
