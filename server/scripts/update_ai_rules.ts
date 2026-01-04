import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../data.db');

const db = new Database(dbPath);

const instruction = `
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
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run('ai_system_instruction', instruction);
    console.log('[UPDATE] AI System Instruction updated with booking rules!');
} catch (error) {
    console.error('[UPDATE] Error updating instruction:', error);
} finally {
    db.close();
}
