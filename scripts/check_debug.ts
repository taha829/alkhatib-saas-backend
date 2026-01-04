
import db from '../server/database';

console.log('--- DEBUG REPORT ---');

// Check Settings
const settings = db.prepare('SELECT * FROM settings').all();
console.log('Settings:', settings);

// Check recent logs
const logs = db.prepare('SELECT * FROM whatsapp_logs ORDER BY id DESC LIMIT 5').all();
console.log('Recent Logs:', logs);

// Check if API key is valid (mock check)
const apiKey = settings.find((s: any) => s.key === 'ai_api_key');
if (!apiKey || !apiKey.value) {
    console.error('CRITICAL: AI API Key is MISSING!');
} else {
    console.log('API Key is present (length: ' + apiKey.value.length + ')');
}
