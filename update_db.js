const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join('C:\\Users\\TOSHIBA\\AppData\\Roaming\\Electron', 'data.db');
const db = new Database(dbPath);
console.log('Using database at:', dbPath);

try {
    // 1. Update Global Settings
    console.log('Updating Settings...');

    const instructionalPrompt = `أنت سكرتير ذكي ومساعد للدكتور طه الخطيب في العيادة.

معلومات العيادة:
- الموقع: عمان، شارع الجامعة.
- ساعات العمل: من السبت إلى الخميس، من الساعة 10 صباحاً حتى 8 مساءً.
- قيمة الكشفية: 25 دينار.
- التأمين: نقبل معظم شركات التأمين المحلية (مثل نقابة المهندسين، المعلمين، والمؤسسات المشتركة).
- النتائج: تظهر خلال 24-48 ساعة.

مهمتك:
- تنظيم المواعيد.
- الإجابة على استفسارات المرضى بلباقة.
- استخدام "نحن" أو "العيادة" عند الحديث.

بروتوكول حجز المواعيد:
عندما يطلب المريض حجز موعد، استخرج البيانات وأضفها في نهاية ردك بالتنسيق التالي حصراً (بدون أي نص إضافي في نفس السطر):
[[APPOINTMENT: YYYY-MM-DD | HH:MM | اسم المريض | ملاحظات]]

مثال:
[[APPOINTMENT: 2026-02-20 | 10:30 AM | محمد احمد | كشف مستعجل]]

يجب أن يكون ردك مهنياً، ودوداً، ومختصراً.`;

    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('ai_system_instruction', ?)").run(instructionalPrompt);
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('clinic_name', ?)").run('عيادة الدكتور طه الخطيب');
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('clinic_description', ?)").run('نظام إدارة العيادة الطبي');

    console.log('✅ Settings Updated.');

    // 2. Update Auto-Replies
    console.log('Updating Auto-Replies...');

    const templates = [
        { trigger: 'السعر', response: 'قيمة الكشفية في عيادة الدكتور طه الخطيب هي 25 دينار شاملة الاستشارة.' },
        { trigger: 'الكشفية', response: 'قيمة الكشفية 25 دينار.' },
        { trigger: 'الموقع', response: 'موقعنا: عمان - شارع الجامعة. نتشرف بزيارتكم!' },
        { trigger: 'العنوان', response: 'عمان، شارع الجامعة.' },
        { trigger: 'ساعات العمل', response: 'نحن متاحون من السبت إلى الخميس، من الساعة 10:00 صباحاً وحتى 8:00 مساءً.' },
        { trigger: 'الدوام', response: 'الدوام يومياً من 10 صباحاً لـ 8 مساءً (عدا الجمعة).' },
        { trigger: 'التأمين', response: 'نعم، تقبل العيادة معظم شركات التأمين (نقابة المهندسين، المعلمين، وغيرها). يرجى إحضار البطاقة.' },
        { trigger: 'النتائج', response: 'نتائج الفحوصات تظهر عادة خلال 24-48 ساعة، وسنتواصل معك فور صدورها.' },
        { trigger: 'طوارئ', response: 'للحالات الطارئة جداً، يرجى التوجه لأقرب مستشفى. العيادة تعمل بنظام المواعيد.' }
    ];

    const insertStmt = db.prepare('INSERT OR REPLACE INTO auto_reply_templates (trigger, response, priority) VALUES (?, ?, ?)');
    // Delete old conflicting ones first if trigger matches
    const deleteStmt = db.prepare('DELETE FROM auto_reply_templates WHERE trigger = ?');

    templates.forEach(t => {
        deleteStmt.run(t.trigger);
        insertStmt.run(t.trigger, t.response, 20); // High priority
    });

    console.log('✅ Auto-Replies Updated.');
    console.log('DONE. Please restart the backend.');

} catch (error) {
    console.error('❌ Error updating database:', error);
}
