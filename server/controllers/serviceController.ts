import { Request, Response } from 'express';
import db from '../database.js';

export const getServices = (req: Request, res: Response) => {
    const services = db.prepare('SELECT * FROM services ORDER BY category ASC, name ASC').all();
    res.json(services);
};

export const createService = (req: Request, res: Response) => {
    const { name, description, price, category } = req.body;
    const result = db.prepare(`
    INSERT INTO services (name, description, price, category)
    VALUES (?, ?, ?, ?)
  `).run(name, description, price, category);
    res.json({ success: true, id: result.lastInsertRowid });
};

export const deleteService = (req: Request, res: Response) => {
    db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    res.json({ success: true });
};
