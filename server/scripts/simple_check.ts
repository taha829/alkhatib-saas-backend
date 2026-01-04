import Database from 'better-sqlite3';
const db = new Database('f:/al-khatib-for-marketing-softwear/data.db');

console.log('--- APPOINTMENTS FOR JAN 5 ---');
const appts = db.prepare("SELECT * FROM appointments WHERE appointment_date LIKE '%2026-01-05%'").all();
console.table(appts);

console.log('\n--- LAST 5 MESSAGES ---');
const msgs = db.prepare("SELECT content FROM whatsapp_messages ORDER BY id DESC LIMIT 5").all();
msgs.forEach(m => console.log('MSG:', m.content));

process.exit(0);
