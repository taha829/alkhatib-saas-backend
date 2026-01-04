import { Request, Response } from 'express';
import db from '../database.js';

// --- Pipelines ---
export const getPipelines = (req: Request, res: Response) => {
    try {
        const pipelines = db.prepare('SELECT * FROM pipelines ORDER BY id').all();
        res.json(pipelines);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createPipeline = (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const result = db.prepare('INSERT INTO pipelines (name) VALUES (?)').run(name);
        // Add default stages for new pipeline? For now, empty or basic.
        // Let's add basic generic stages
        const pipelineId = result.lastInsertRowid;
        const defaultStages = ['Stage 1', 'Stage 2', 'Stage 3'];
        const insertStage = db.prepare('INSERT INTO stages (pipeline_id, name, position, color) VALUES (?, ?, ?, ?)');
        defaultStages.forEach((s, idx) => insertStage.run(pipelineId, s, idx + 1, '#cbd5e1'));

        res.json({ id: pipelineId, name, success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deletePipeline = (req: Request, res: Response) => {
    try {
        db.prepare('DELETE FROM pipelines WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// --- Stages ---
export const getStages = (req: Request, res: Response) => {
    try {
        const { pipelineId } = req.params;
        const stages = db.prepare('SELECT * FROM stages WHERE pipeline_id = ? ORDER BY position ASC').all(pipelineId);
        res.json(stages);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createStage = (req: Request, res: Response) => {
    try {
        const { pipelineId } = req.params;
        const { name, color, position } = req.body;
        db.prepare('INSERT INTO stages (pipeline_id, name, color, position) VALUES (?, ?, ?, ?)').run(pipelineId, name, color, position);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateStageOrder = (req: Request, res: Response) => {
    try {
        const { stages } = req.body; // Array of { id, position }
        const update = db.prepare('UPDATE stages SET position = ? WHERE id = ?');
        const transaction = db.transaction((items) => {
            for (const item of items) update.run(item.position, item.id);
        });
        transaction(stages);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteStage = (req: Request, res: Response) => {
    try {
        // Option: Move contacts to another stage? For now, just delete (contacts become stageless or we warn)
        // Better: Set contacts stage_id to null
        db.prepare('UPDATE contacts SET stage_id = NULL WHERE stage_id = ?').run(req.params.id);
        db.prepare('DELETE FROM stages WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// --- Deals / Kanban ---
export const updateContactStage = (req: Request, res: Response) => {
    try {
        const { contactId, stageId, pipelineId } = req.body;
        const update = db.prepare('UPDATE contacts SET stage_id = ?, pipeline_id = ? WHERE id = ?');
        update.run(stageId, pipelineId, contactId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateDealDetails = (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { deal_value, priority, probability, expected_close_date } = req.body;
        const update = db.prepare(`
            UPDATE contacts 
            SET deal_value = ?, priority = ?, probability = ?, expected_close_date = ? 
            WHERE id = ?
        `);
        update.run(deal_value, priority, probability, expected_close_date, id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
