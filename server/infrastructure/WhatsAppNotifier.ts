import { NotificationPayload } from '../domain/NotificationEvent.js';
import { sendMessage } from '../whatsapp/bot.js';

export class WhatsAppNotifier {
    static async send(payload: NotificationPayload): Promise<void> {
        try {
            if (!payload.metadata?.phone) {
                console.warn('[WhatsAppNotifier] ⚠️ No phone number provided');
                return;
            }

            const phone = payload.metadata.phone;
            const message = payload.message;

            await sendMessage(phone, message);
            console.log(`[WhatsAppNotifier] ✅ Message sent to ${phone}`);
        } catch (error) {
            console.error('[WhatsAppNotifier] ❌ Error:', error);
            throw error;
        }
    }

    static async sendBulk(phones: string[], message: string): Promise<void> {
        const promises = phones.map(phone =>
            sendMessage(phone, message).catch(err => {
                console.error(`[WhatsAppNotifier] Failed to send to ${phone}:`, err);
            })
        );

        await Promise.allSettled(promises);
        console.log(`[WhatsAppNotifier] ✅ Bulk messages sent to ${phones.length} recipients`);
    }
}
