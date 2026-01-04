import express from 'express';
import {
    getAppointments,
    getTodayAppointments,
    getAppointmentById,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    getAppointmentsStats,
    saveMedicalRecord,
    getMedicalRecord,
    generatePrescriptionPDF,
    sendPrescriptionViaWhatsApp
} from '../controllers/appointmentController.js';

import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get appointments with optional filters
router.get('/', getAppointments);

// Get today's appointments
router.get('/today', getTodayAppointments);

// Get appointments statistics
router.get('/stats', getAppointmentsStats);

// Get specific appointment
router.get('/:id', getAppointmentById);

// Create new appointment
router.post('/', createAppointment);

// Update appointment
router.put('/:id', updateAppointment);

// Medical Records (Prescription & Billing)
router.get('/:id/medical-record', getMedicalRecord);
router.post('/:id/medical-record', saveMedicalRecord);
router.get('/:id/generate-prescription', generatePrescriptionPDF);
router.post('/:id/send-prescription', sendPrescriptionViaWhatsApp);

// Update appointment status only
router.patch('/:id/status', updateAppointmentStatus);

// Delete appointment
router.delete('/:id', deleteAppointment);

export default router;
