import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    getPipelines, createPipeline, deletePipeline,
    getStages, createStage, updateStageOrder, deleteStage,
    updateContactStage, updateDealDetails
} from '../controllers/crmController.js';

const router = express.Router();

router.use(authenticate);

// Pipelines
router.get('/pipelines', getPipelines);
router.post('/pipelines', createPipeline);
router.delete('/pipelines/:id', deletePipeline);

// Stages
router.get('/pipelines/:pipelineId/stages', getStages);
router.post('/pipelines/:pipelineId/stages', createStage);
router.put('/stages/reorder', updateStageOrder);
router.delete('/stages/:id', deleteStage);

// Deals (Kanban Moves)
router.post('/contacts/move', updateContactStage);
router.put('/contacts/:id/deal', updateDealDetails);

export default router;
