import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../data.db');

const db = new Database(dbPath);

const today = new Date().toISOString().split('T')[0];
console.log('Today:', today);

const appointments = db.prepare(`
    SELECT * FROM appointments 
`).all();

console.log('--- Today Appointments ---');
console.log(JSON.stringify(appointments, null, 2));

const stats = {
    today_total: db.prepare(`SELECT COUNT(*) as count FROM appointments WHERE DATE(appointment_date) = DATE(?)`).get(today).count,
    today_completed: db.prepare(`SELECT COUNT(*) as count FROM appointments WHERE DATE(appointment_date) = DATE(?) AND status = 'completed'`).get(today).count,
    total_appointments: db.prepare(`SELECT COUNT(*) as count FROM appointments`).get().count,
    total_contacts: db.prepare(`SELECT COUNT(*) as count FROM contacts`).get().count
};

console.log('\n--- Stats ---');
console.log(JSON.stringify(stats, null, 2));

db.close();
