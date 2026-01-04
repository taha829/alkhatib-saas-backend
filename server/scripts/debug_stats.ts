
import db from '../database.js';

const today = new Date().toISOString().split('T')[0];
console.log(`[DEBUG] JS Date ISO: ${new Date().toISOString()}`);
console.log(`[DEBUG] Calculated 'today': ${today}`);

console.log('--- Querying Appointments ---');
const all = db.prepare('SELECT id, appointment_date, status, DATE(appointment_date) as date_part FROM appointments').all();
console.table(all);

console.log('--- Running Stats Queries ---');
const todayTotal = db.prepare(`SELECT COUNT(*) as count FROM appointments WHERE DATE(appointment_date) = DATE(?)`).get(today) as any;
const todayCompleted = db.prepare(`SELECT COUNT(*) as count FROM appointments WHERE DATE(appointment_date) = DATE(?) AND status = 'completed'`).get(today) as any;
const todayWaiting = db.prepare(`SELECT COUNT(*) as count FROM appointments WHERE DATE(appointment_date) = DATE(?) AND status IN ('scheduled', 'confirmed')`).get(today) as any;

console.log('Stats Results:');
console.log(`Today Total: ${todayTotal?.count}`);
console.log(`Today Completed: ${todayCompleted?.count}`);
console.log(`Today Waiting: ${todayWaiting?.count}`);
