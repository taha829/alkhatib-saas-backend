import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../data.db');

const db = new Database(dbPath);

const settings = [
    { key: 'ai_enabled', value: '1' },
    { key: 'ai_api_key', value: 'AIzaSyAZ67aSxanawpYSraQ8IwAgoP9vOQkzxx0' },
    { key: 'ai_system_instruction', value: 'أنت مساعد ذكي ومفيد لعيادة طبية. اسم العيادة "عيادتي". مهمتك هي مساعدة المرضى في الاستفسار عن المواعيد والخدمات والرد على أسئلتهم بمهنية ولطف.' },
    { key: 'ai_voice_enabled', value: '0' },
    { key: 'ai_voice_language', value: 'ar' },
    { key: 'trial_days', value: '7' }
];

try {
    const insert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

    db.transaction(() => {
        for (const s of settings) {
            insert.run(s.key, s.value);
        }
    })();

    console.log('[RESTORE] AI Settings and API Key restored successfully!');
} catch (error) {
    console.error('[RESTORE] Error restoring settings:', error);
} finally {
    db.close();
}
