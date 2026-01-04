import db from './server/database.js';

console.log('--- AI SETTINGS DIAGNOSTIC ---');
const settings = db.prepare("SELECT * FROM settings").all();
settings.forEach(s => {
    if (s.key.includes('ai_')) {
        let val = s.value;
        if (s.key === 'ai_api_key' && val) val = val.substring(0, 4) + '...' + val.substring(val.length - 4);
        console.log(`${s.key}: ${val}`);
    }
});

const templates = db.prepare("SELECT COUNT(*) as count FROM auto_reply_templates WHERE is_active = 1").get();
console.log('Active Templates:', templates.count);

process.exit(0);
