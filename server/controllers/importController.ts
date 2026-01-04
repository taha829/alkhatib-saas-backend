import { Request, Response } from 'express';
import db from '../database.js';
import { scrapeUrl } from '../scraper.js';
import { searchGoogle } from '../search_engine.js';

export const scrapeContacts = async (req: any, res: Response) => {
    try {
        const { url, platform } = req.body;

        // Check subscription (Individual user expiry)
        const user: any = db.prepare('SELECT expiry_date FROM users WHERE id = ?').get(req.user.id);
        if (new Date(user.expiry_date) < new Date()) {
            return res.status(403).json({ error: 'Subscription expired', isSubscriptionExpired: true });
        }

        const result = await scrapeUrl(url);

        // Logic to save contacts
        const phones: string[] = [];
        let savedCount = 0;

        if (result.contacts && result.contacts.length > 0) {
            console.log(`[Import] Found ${result.contacts.length} structured contacts.`);
            const insertStmt = db.prepare(`
            INSERT INTO contacts (user_id, name, phone, platform, email, job_title, profile_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

            for (const c of result.contacts) {
                let exists;
                if (c.profile_url) {
                    exists = db.prepare('SELECT id FROM contacts WHERE user_id = ? AND profile_url = ?').get(req.user.id, c.profile_url);
                } else if (c.phone) {
                    exists = db.prepare('SELECT id FROM contacts WHERE user_id = ? AND phone = ?').get(req.user.id, c.phone);
                }

                if (!exists) {
                    try {
                        insertStmt.run(
                            req.user.id,
                            c.name || 'Unknown',
                            c.phone || '',
                            result.platform || 'Unknown',
                            c.email || '',
                            '',
                            c.profile_url || '',
                            new Date().toISOString()
                        );
                        if (c.phone) phones.push(c.phone);
                        savedCount++;
                    } catch (e) {
                        console.error('Error saving contact:', e);
                    }
                }
            }
        }

        // Fallback logic could go here if needed, but existing code prefers structured if found.
        // Keeping it simple as per original refactor request to just move code.

        res.json({ success: true, phones, count: phones.length > 0 ? phones.length : savedCount, message: `Saved ${savedCount} new contacts` });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const parseLeads = async (req: any, res: Response) => {
    try {
        const { text, platform } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required' });

        console.log('[Text Parse] Received text length:', text.length);

        const blocks = text.split(/(?:\r?\n){2,}|الاتجاهات|Directions/g);
        const validContacts: any[] = [];
        let savedCount = 0;

        for (const block of blocks) {
            if (!block.trim()) continue;

            const phoneMatch = block.match(/(?:00962|962|\+962|0)?7[7895]\d{7,8}|(?:00962|962|\+962|0)?7\s[7895]\d{3}\s\d{4}/);

            if (phoneMatch) {
                let phone = phoneMatch[0].replace(/\s/g, '');
                if (phone.startsWith('07')) {
                    phone = phone.replace('07', '9627');
                }

                const lines = block.split(/\r?\n/).map((l: string) => l.trim()).filter((l: string) => l);
                let name = 'Unknown';

                for (const line of lines) {
                    if (!line.match(/\d{5,}/) && !line.includes('4.') && !line.includes('5.') && line.length > 3) {
                        name = line;
                        break;
                    }
                }

                validContacts.push({ name, phone });

                const exists = db.prepare('SELECT id FROM contacts WHERE user_id = ? AND phone = ?').get(req.user.id, phone);
                if (!exists) {
                    db.prepare('INSERT INTO contacts (user_id, name, phone, platform, created_at, status) VALUES (?, ?, ?, ?, ?, ?)')
                        .run(req.user.id, name, phone, platform || 'Manual Import', new Date().toISOString(), 'new');
                    savedCount++;
                }
            }
        }

        res.json({ success: true, count: savedCount, totalFound: validContacts.length, contacts: validContacts });

    } catch (error: any) {
        console.error('[Text Parse] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const searchLeads = async (req: any, res: Response) => {
    try {
        const { keyword, location, platform } = req.body;

        const user: any = db.prepare('SELECT expiry_date FROM users WHERE id = ?').get(req.user.id);
        if (new Date(user.expiry_date) < new Date()) {
            return res.status(403).json({ error: 'Subscription expired' });
        }

        const results = await searchGoogle(keyword, location, platform);
        res.json({ success: true, results });
    } catch (error: any) {
        console.error('[Leads API] Error:', error);
        res.status(500).json({ error: 'Search failed. Please try again later.' });
    }
};
