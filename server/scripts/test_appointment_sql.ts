import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../data.db');

const db = new Database(dbPath);

console.log("--- Testing getTodayAppointments SQL ---");
const today = new Date().toISOString().split('T')[0];

try {
    const query = `
      SELECT 
        a.*,
        c.name as patient_name,
        c.phone,
        c.medical_notes,
        u.name as doctor_name
      FROM appointments a
      LEFT JOIN contacts c ON a.patient_id = c.id
      LEFT JOIN users u ON a.doctor_id = u.id
      WHERE DATE(a.appointment_date) = DATE(?)
      ORDER BY a.appointment_date ASC
    `;
    const data = db.prepare(query).all(today);
    console.log("Success! Count:", data.length);
} catch (e: any) {
    console.error("❌ SQL Error:", e.message);
}

console.log("\n--- Testing getAppointments SQL (All) ---");
try {
    const query = `
      SELECT 
        a.*,
        c.name as patient_name,
        c.phone,
        u.name as doctor_name
      FROM appointments a
      LEFT JOIN contacts c ON a.patient_id = c.id
      LEFT JOIN users u ON a.doctor_id = u.id
      ORDER BY a.appointment_date ASC
    `;
    const data = db.prepare(query).all();
    console.log("Success! Count:", data.length);
} catch (e: any) {
    console.error("❌ SQL Error:", e.message);
}

db.close();
