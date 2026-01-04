import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../data.db');
const envPath = path.join(__dirname, '../../.env');

dotenv.config({ path: envPath });

const db = new Database(dbPath);
const apiKey = process.env.VITE_GEMINI_API_KEY;

const systemInstruction = `
أنت المساعد الذكي لعيادة "الخطيب الطبية".
مهمتك هي مساعدة المرضى في الاستفسار عن المواعيد والخدمات والرد على أسئلتهم بمهنية.

قواعد هامة جداً:
1. عند تأكيد موعد مع المريض، يجب عليك كتابة هذا الوسم في نهاية رسالتك بالضبط (بدون أي تغيير في الصيغة):
[[APPOINTMENT: YYYY-MM-DD | HH:MM | اسم المريض | ملاحظات]]
مثال: [[APPOINTMENT: 2026-01-05 | 15:00 | محمد أحمد | استشارة باطنية]]

2. يمكنك إضافة وسوم للمريض لتصنيفه حسب حالته:
[[TAGS: جديد, متابعة, عاجل]]

3. المواعيد المتاحة: من السبت للخميس (9 ص - 5 م).
4. كن ودوداً ومحترفاً جداً.
5. إذا طلب المريض إلغاء موعد، أخبره أنه تم الإلغاء ووجهه لحجز موعد جديد إذا رغب.
`;

try {
    if (!apiKey) throw new Error('API Key not found in .env');

    db.transaction(() => {
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run('ai_api_key', apiKey);
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run('ai_enabled', '1');
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run('ai_system_instruction', systemInstruction);
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run('ai_voice_enabled', '0');
    })();

    console.log('[SUCCESS] Database synchronized with .env and AI is READY!');
} catch (error: any) {
    console.error('[ERROR]', error.message);
} finally {
    db.close();
}
