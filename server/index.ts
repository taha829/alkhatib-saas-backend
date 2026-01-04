import dotenv from 'dotenv';
dotenv.config(); // Must be called before other imports that use env vars

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

// Middleware
import { UPLOADS_DIR } from './middleware/upload.js';
import { checkTrial } from './middleware/trial.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import miscRoutes from './routes/miscRoutes.js';
import crmRoutes from './routes/crmRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import healthRoutes from './routes/health.js';

// Services
import { startWhatsAppBot, logService } from './whatsapp/bot.js';
import { startReminderService } from './services/reminderService.js';
import db from './database.js';



const app = express();
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Global Middleware ---
app.use((req, res, next) => {
  logService(`[HTTP Request] ${req.method} ${req.url}`);
  next();
});
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/api/', apiLimiter);

// Static Files
app.use('/uploads', express.static(UPLOADS_DIR));

// Trial Check (Global except for whitelisted paths inside the middleware)
app.use(checkTrial);

// --- Routes ---
app.use('/api/health', healthRoutes); // Health check endpoint (must be before other routes)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/whatsapp/services', serviceRoutes); // Keep legacy path
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api', miscRoutes); // Mounts /stats, /posts

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Global Error Handler (Must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  logService(`🚀 Server ready on port ${PORT} - Logging to service.log`);

  // Background Services (Disabled for manual control in SaaS mode)
  // startWhatsAppBot().catch(err => console.error('[WhatsApp] Failed to start:', err));
  // startReminderService().catch(err => console.error('[Reminder] Failed to start:', err));
});
