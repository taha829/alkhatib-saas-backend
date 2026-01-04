import db from './server/database.js';

console.log('--- SEARCHING FOR RAHMA IN APPOINTMENTS ---');
const appointments = db.prepare("SELECT * FROM appointments WHERE customer_name LIKE '%رحمة%'").all();
console.table(appointments);

console.log('\n--- RECENT AI REPLIES TO RAHMA ---');
const messages = db.prepare(`
    SELECT m.*, c.phone, c.name 
    FROM whatsapp_messages m
    JOIN whatsapp_chats c ON m.chat_id = c.id
    WHERE (c.name LIKE '%رحمة%' OR c.phone LIKE '%رحمة%')
    ORDER BY m.timestamp DESC LIMIT 10
`).all();
console.table(messages);

console.log('\n--- ALL RECENT APPOINTMENTS ---');
const recentAppts = db.prepare("SELECT * FROM appointments ORDER BY id DESC LIMIT 5").all();
console.table(recentAppts);

process.exit(0);
