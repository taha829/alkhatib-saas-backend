import db from '../database.js';
import { sendMessage } from '../whatsapp/bot.js';

export async function startReminderService() {
    console.log('[ReminderService] 🕒 Service started (checking every minute)');

    // Check every minute
    setInterval(async () => {
        try {
            const now = new Date();

            // We want appointments that are exactly between 55 and 65 minutes from now
            // and haven't received a reminder yet.
            const targetTimeStart = new Date(now.getTime() + 55 * 60 * 1000).toISOString();
            const targetTimeEnd = new Date(now.getTime() + 65 * 60 * 1000).toISOString();

            const pendingReminders = db.prepare(`
                SELECT a.*, c.name as contact_name
                FROM appointments a
                LEFT JOIN contacts c ON a.phone = c.phone
                WHERE a.appointment_date BETWEEN ? AND ? 
                AND a.reminder_sent = 0
                AND a.status = 'scheduled'
            `).all(targetTimeStart, targetTimeEnd) as any[];

            if (pendingReminders.length > 0) {
                console.log(`[ReminderService] Found ${pendingReminders.length} pending reminders`);
            }

            for (const apt of pendingReminders) {
                const name = apt.contact_name || apt.customer_name || 'عميلنا العزيز';
                const time = new Date(apt.appointment_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

                const message = `🔔 *تذكير بموعدك* 🔔\n\nأهلاً بك سيد/ة ${name}.\n\nنود تذكيرك بموعدك القادم اليوم في تمام الساعة *${time}*.\n\nيسعدنا جداً حضورك في الموعد المحدد. إذا كنت ترغب في تأجيل أو إلغاء الموعد، يرجى إعلامنا بذلك.\n\nشكراً لك! ✨🏥`;

                try {
                    await sendMessage(apt.phone, message);

                    // Mark as sent
                    db.prepare('UPDATE appointments SET reminder_sent = 1 WHERE id = ?').run(apt.id);
                    console.log(`[ReminderService] ✅ Reminder sent to ${apt.phone} for appointment ${apt.id}`);
                } catch (err: any) {
                    console.error(`[ReminderService] ❌ Failed to send reminder to ${apt.phone}:`, err.message);
                }
            }
        } catch (error: any) {
            console.error('[ReminderService] Error in check loop:', error.message);
        }
    }, 60000); // 1 minute
}
