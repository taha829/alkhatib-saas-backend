import { Request, Response } from 'express';
import db from '../database.js';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { UPLOADS_DIR } from '../middleware/upload.js';
import { sendMessage } from '../whatsapp/bot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all appointments
export const getAppointments = (req: Request, res: Response) => {
    try {
        const { date, status, doctor_id } = req.query;

        let query = `
      SELECT 
        a.*,
        COALESCE(a.customer_name, c.name) as patient_name,
        COALESCE(c.phone, a.phone) as phone,
        u.name as doctor_name
      FROM appointments a
      LEFT JOIN contacts c ON a.patient_id = c.id
      LEFT JOIN users u ON a.doctor_id = u.id
      WHERE 1=1
    `;

        const params: any[] = [];

        if (date) {
            query += ` AND DATE(a.appointment_date) = DATE(?)`;
            params.push(date);
        }

        if (status) {
            query += ` AND a.status = ? `;
            params.push(status);
        }

        if (doctor_id) {
            query += ` AND a.doctor_id = ? `;
            params.push(doctor_id);
        }

        const { date_from, date_to } = req.query;
        if (date_from) {
            query += ` AND a.appointment_date >= ? `;
            params.push(date_from);
        }
        if (date_to) {
            query += ` AND a.appointment_date <= ? `;
            params.push(date_to);
        }

        query += ` ORDER BY a.appointment_date ASC`;

        const appointments = db.prepare(query).all(...params);
        res.json(appointments);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Get today's appointments
export const getTodayAppointments = (req: Request, res: Response) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const appointments = db.prepare(`
      SELECT 
        a.*,
        COALESCE(a.customer_name, c.name) as patient_name,
        COALESCE(c.phone, a.phone) as phone,
        c.medical_notes,
        u.name as doctor_name
      FROM appointments a
      LEFT JOIN contacts c ON a.patient_id = c.id
      LEFT JOIN users u ON a.doctor_id = u.id
      WHERE DATE(a.appointment_date) = DATE(?)
      ORDER BY a.appointment_date ASC
    `).all(today);

        res.json(appointments);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Get appointment by ID
export const getAppointmentById = (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const appointment = db.prepare(`
      SELECT 
        a.*,
        COALESCE(a.customer_name, c.name) as patient_name,
        COALESCE(c.phone, a.phone) as phone,
        c.email,
        c.medical_notes,
        c.blood_type,
        c.allergies,
        c.chronic_diseases,
        u.name as doctor_name
      FROM appointments a
      LEFT JOIN contacts c ON a.patient_id = c.id
      LEFT JOIN users u ON a.doctor_id = u.id
      WHERE a.id = ?
    `).get(id);

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.json(appointment);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Create new appointment
export const createAppointment = (req: Request, res: Response) => {
    try {
        const {
            patient_id,
            doctor_id,
            phone,
            customer_name,
            appointment_date,
            duration = 30,
            appointment_type = 'consultation',
            status = 'scheduled',
            notes
        } = req.body;

        if (!phone || !appointment_date) {
            return res.status(400).json({ error: 'Phone and appointment date are required' });
        }

        const result = db.prepare(`
      INSERT INTO appointments(
                patient_id, doctor_id, phone, customer_name,
                appointment_date, duration, appointment_type, status, notes
            ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
            patient_id || null,
            doctor_id || null,
            phone,
            customer_name || null,
            appointment_date,
            duration,
            appointment_type,
            status,
            notes || null
        );

        const newAppointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json(newAppointment);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Update appointment
export const updateAppointment = (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            patient_id,
            doctor_id,
            phone,
            customer_name,
            appointment_date,
            duration,
            appointment_type,
            status,
            notes
        } = req.body;

        const updates: string[] = [];
        const params: any[] = [];

        if (patient_id !== undefined) {
            updates.push('patient_id = ?');
            params.push(patient_id);
        }
        if (doctor_id !== undefined) {
            updates.push('doctor_id = ?');
            params.push(doctor_id);
        }
        if (phone) {
            updates.push('phone = ?');
            params.push(phone);
        }
        if (customer_name !== undefined) {
            updates.push('customer_name = ?');
            params.push(customer_name);
        }
        if (appointment_date) {
            updates.push('appointment_date = ?');
            params.push(appointment_date);
        }
        if (duration !== undefined) {
            updates.push('duration = ?');
            params.push(duration);
        }
        if (appointment_type) {
            updates.push('appointment_type = ?');
            params.push(appointment_type);
        }
        if (status) {
            updates.push('status = ?');
            params.push(status);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            params.push(notes);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        if (updates.length === 1) { // Only updated_at
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(id);

        db.prepare(`
      UPDATE appointments 
      SET ${updates.join(', ')}
      WHERE id = ?
            `).run(...params);

        const updatedAppointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);

        if (!updatedAppointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.json(updatedAppointment);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Update appointment status
export const updateAppointmentStatus = (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        db.prepare(`
      UPDATE appointments 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
            `).run(status, id);

        const updatedAppointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);

        if (!updatedAppointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.json(updatedAppointment);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Delete appointment
export const deleteAppointment = (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        db.prepare('DELETE FROM appointments WHERE id = ?').run(id);

        res.json({ message: 'Appointment deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Get appointments statistics
export const getAppointmentsStats = (req: Request, res: Response) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Basic Counts
        const basicStats = {
            today_total: (db.prepare(`SELECT COUNT(*) as count FROM appointments WHERE DATE(appointment_date) = DATE(?)`).get(today) as any)?.count || 0,
            today_completed: (db.prepare(`SELECT COUNT(*) as count FROM appointments WHERE DATE(appointment_date) = DATE(?) AND status = 'completed'`).get(today) as any)?.count || 0,
            today_waiting: (db.prepare(`SELECT COUNT(*) as count FROM appointments WHERE DATE(appointment_date) = DATE(?) AND status IN ('scheduled', 'confirmed')`).get(today) as any)?.count || 0,
            this_month: (db.prepare(`SELECT COUNT(*) as count FROM appointments WHERE strftime('%Y-%m', appointment_date) = strftime('%Y-%m', ?)`).get(today) as any)?.count || 0,
            total_patients: (db.prepare(`SELECT COUNT(*) as count FROM contacts`).get() as any)?.count || 0
        };

        // 2. Status Distribution (for Pie Chart)
        const statusDistribution = db.prepare(`
            SELECT status as name, COUNT(*) as value 
            FROM appointments 
            GROUP BY status
            `).all();

        // 3. Last 7 Days Distribution (for Bar/Area Chart)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];

            const count = (db.prepare(`
                SELECT COUNT(*) as count 
                FROM appointments 
                WHERE DATE(appointment_date) = DATE(?)
            `).get(dateString) as any)?.count || 0;

            last7Days.push({
                date: dateString,
                visits: count
            });
        }

        // 4. Appointment Type Distribution
        const typeDistribution = db.prepare(`
            SELECT appointment_type as name, COUNT(*) as value 
            FROM appointments 
            GROUP BY appointment_type
            `).all();

        res.json({
            ...basicStats,
            statusDistribution,
            last7Days,
            typeDistribution
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// --- Medical Records (Prescriptions & Billing) ---

// Save medical record (called when completing appointment)
export const saveMedicalRecord = (req: Request, res: Response) => {
    try {
        const { id } = req.params; // appointment_id
        const {
            patient_id,
            diagnosis,
            treatment,
            fee_amount,
            fee_details
        } = req.body;

        // 1. Check if appointment exists
        const appointment = db.prepare('SELECT status FROM appointments WHERE id = ?').get(id);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // 2. Transaction to update status and save record
        const transaction = db.transaction(() => {
            // Update appointment status to completed
            db.prepare(`
                UPDATE appointments 
                SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `).run(id);

            // Insert or update medical record
            const existingRecord = db.prepare('SELECT id FROM medical_records WHERE appointment_id = ?').get(id) as any;

            if (existingRecord) {
                db.prepare(`
                    UPDATE medical_records 
                    SET diagnosis = ?, treatment = ?, fee_amount = ?, fee_details = ?
            WHERE appointment_id = ?
                `).run(diagnosis, treatment, fee_amount, fee_details, id);
                return existingRecord.id;
            } else {
                const result = db.prepare(`
                    INSERT INTO medical_records(appointment_id, patient_id, diagnosis, treatment, fee_amount, fee_details)
        VALUES(?, ?, ?, ?, ?, ?)
            `).run(id, patient_id || null, diagnosis, treatment, fee_amount, fee_details);
                return result.lastInsertRowid;
            }
        });

        const recordId = transaction();

        res.status(200).json({
            message: 'Medical record saved and appointment completed',
            recordId
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Get medical record for an appointment
export const getMedicalRecord = (req: Request, res: Response) => {
    try {
        const { id } = req.params; // appointment_id
        const record = db.prepare('SELECT * FROM medical_records WHERE appointment_id = ?').get(id);

        if (!record) {
            return res.status(404).json({ error: 'Medical record not found' });
        }

        res.json(record);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Helper to find Chrome/Edge on Windows
const findBrowserPath = () => {
    const paths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    return null;
};

// Generate Prescription PDF
export const generatePrescriptionPDF = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // appointment_id

        // 1. Fetch all necessary data
        const appointment = db.prepare(`
            SELECT a.*, c.name as patient_name, c.phone, c.age_range
            FROM appointments a 
            LEFT JOIN contacts c ON a.patient_id = c.id
            WHERE a.id = ?
            `).get(id) as any;

        if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

        const medicalRecord = db.prepare('SELECT * FROM medical_records WHERE appointment_id = ?').get(id) as any;

        const settings = db.prepare("SELECT key, value FROM settings WHERE key IN ('clinic_name', 'clinic_description', 'clinic_logo')").all() as any[];
        const clinicInfo: any = {};
        settings.forEach(s => clinicInfo[s.key] = s.value);

        // 2. Build professional HTML Template
        const logoPath = clinicInfo.clinic_logo ? (clinicInfo.clinic_logo.startsWith('http') ? clinicInfo.clinic_logo : `http://localhost:3001${clinicInfo.clinic_logo}`) : '';

        const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
                body { font-family: 'Tajawal', sans-serif; margin: 0; padding: 40px; color: #333; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; }
                .clinic-info h1 { margin: 0; color: #f97316; font-size: 28px; }
                .clinic-info p { margin: 5px 0 0; color: #666; }
                .logo { max-width: 120px; max-height: 120px; object-fit: contain; }
                .patient-box { background: #fdf2f8; border: 1px solid #f9a8d4; border-radius: 8px; padding: 15px; margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .patient-box span { font-weight: bold; color: #be185d; }
                .section { margin-bottom: 30px; }
                .section h3 { border-right: 4px solid #f97316; padding-right: 12px; color: #f97316; margin-bottom: 15px; }
                .content { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; min-height: 100px; white-space: pre-wrap; line-height: 1.6; }
                .billing-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                .billing-table th { background: #f97316; color: white; padding: 10px; text-align: right; }
                .billing-table td { padding: 10px; border: 1px solid #eee; }
                .footer { margin-top: 50px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; color: #999; font-size: 12px; }
                .date { text-align: left; color: #888; margin-top: -10px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="clinic-info">
                    <h1>${clinicInfo.clinic_name || 'عيادتي'}</h1>
                    <p>${clinicInfo.clinic_description || ''}</p>
                </div>
                ${logoPath ? `<img src="${logoPath}" class="logo" />` : ''}
            </div>

            <div class="date">تاريخ الزيارة: ${new Date(appointment.appointment_date).toLocaleDateString('ar-EG')}</div>

            <div class="patient-box">
                <div><span>المريض:</span> ${appointment.patient_name || appointment.customer_name || 'غير معروف'}</div>
                <div><span>الهاتف:</span> ${appointment.phone || ''}</div>
                <div><span>العمر/الفئة:</span> ${appointment.age_range || '-'}</div>
                <div><span>رقم الموعد:</span> #${appointment.id}</div>
            </div>

            <div class="section">
                <h3>التشخيص وتقرير الحالة:</h3>
                <div class="content">${medicalRecord?.diagnosis || 'لا يوجد تشخيص مسجل'}</div>
            </div>

            <div class="section">
                <h3>العلاج والوصفة الطبية:</h3>
                <div class="content">${medicalRecord?.treatment || 'لا يوجد علاج مسجل'}</div>Section
            </div>

            ${medicalRecord?.fee_amount > 0 ? `
            <div class="section">
                <h3>تفاصيل الفاتورة:</h3>
                <table class="billing-table">
                    <thead>
                        <tr>
                            <th>الوصف</th>
                            <th>المبلغ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${medicalRecord.fee_details || 'رسوم الكشفية والخدمات'}</td>
                            <td>${medicalRecord.fee_amount} دينار</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            ` : ''}

            <div class="section">
                <h3>ملاحظات هامة:</h3>
                <div class="content" style="background: #fff8f1; border-color: #ffedd5; font-size: 13px;">
                    <p>• هذا الملخص صادر إلكترونيًا من نظام إدارة العيادة.</p>
                    <p>• ✔️ ليس تشخيصًا آليًا</p>
                    <p>• ✔️ ليس بديلاً عن الاستشارة الطبية</p>
                </div>
            </div>

            <div class="footer">
                <div style="margin-top: 10px; font-size: 10px; opacity: 0.7;">تم إنشاء هذه الوثيقة إلكترونياً بواسطة نظام عيادتي لإدارة العيادات الطبية.</div>
            </div>
        </body>
        </html>
        `;

        // 3. Launch PDF Generation
        const browserPath = findBrowserPath();
        console.log(`[PDF] Using browser path: ${browserPath || 'default'}`);

        if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: browserPath || undefined,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' }); // Changed from networkidle0 for speed/stability

        const fileName = `prescription_${id}_${Date.now()}.pdf`;
        const filePath = path.join(UPLOADS_DIR, fileName);

        await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        await browser.close();

        // 4. Return the file path or URL
        const fileUrl = `/uploads/${fileName}`;
        res.json({ url: fileUrl, fileName });

    } catch (error: any) {
        console.error('[PDF Export] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Send Prescription via WhatsApp
export const sendPrescriptionViaWhatsApp = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { url, phone } = req.body;

        if (!url || !phone) {
            return res.status(400).json({ error: 'URL and Phone are required' });
        }

        const absolutePath = path.join(UPLOADS_DIR, path.basename(url));

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ error: 'PDF file not found' });
        }

        await sendMessage(phone, "تحية طيبة، مرفق لجانبكم الوصفة الطبية وتفاصيل الزيارة. نتمنى لكم دوام الصحة والعافية. 🙏✨", {
            mediaUrl: absolutePath,
            mediaType: 'document'
        });

        res.json({ success: true, message: 'Prescription sent via WhatsApp' });
    } catch (error: any) {
        console.error('[WhatsApp Export] Error:', error);
        res.status(500).json({ error: error.message });
    }
};
