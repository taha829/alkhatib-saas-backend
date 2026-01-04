import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data.db');

console.log(`[CLEANUP] Opening database at: ${dbPath}`);
const db = new Database(dbPath);

// Disable foreign keys to allow clearing everything
db.pragma('foreign_keys = OFF');

const tablesToClear = [
    'appointments',
    'contacts',
    'whatsapp_chats',
    'whatsapp_messages',
    'whatsapp_logs',
    'telegram_chats',
    'telegram_messages',
    'campaigns',
    'campaign_recipients',
    'groups',
    'posts',
    'contact_groups',
    'customer_tag_map',
    'customer_tags'
];

try {
    db.transaction(() => {
        for (const table of tablesToClear) {
            console.log(`[CLEANUP] Clearing table: ${table}`);
            db.prepare(`DELETE FROM ${table}`).run();
            // Reset autoincrement
            db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table);
        }
    })();
    console.log('[CLEANUP] Database cleared successfully!');
} catch (error) {
    console.error('[CLEANUP] Error clearing database:', error);
} finally {
    db.close();
}
