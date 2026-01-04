import db from '../database.js';

console.log('--- RECENT WHATSAPP MESSAGES ---');
const messages = db.prepare(`
    SELECT m.*, c.phone, c.name 
    FROM whatsapp_messages m
    JOIN whatsapp_chats c ON m.chat_id = c.id
    ORDER BY m.timestamp DESC LIMIT 5
`).all();
console.table(messages);

console.log('\n--- RECENT WHATSAPP LOGS ---');
const logs = db.prepare(`
    SELECT * FROM whatsapp_logs 
    ORDER BY id DESC LIMIT 10
`).all();
console.table(logs);

process.exit(0);
