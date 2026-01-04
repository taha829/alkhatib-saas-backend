import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../data.db');

const db = new Database(dbPath);

const newApiKey = 'AIzaSyCFjKwuDtseAdRl5RSlFcsfMormMBdZBGA';

try {
    db.transaction(() => {
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run('ai_api_key', newApiKey);
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run('ai_enabled', '1');
    })();
    console.log('[UPDATE] New API Key applied and AI enabled successfully!');
} catch (error) {
    console.error('[UPDATE] Error updating API Key:', error);
} finally {
    db.close();
}
