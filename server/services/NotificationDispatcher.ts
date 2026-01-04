import { NotificationPayload, NotificationChannel } from '../domain/NotificationEvent.js';
import { InAppNotifier } from '../infrastructure/InAppNotifier.js';
import { WhatsAppNotifier } from '../infrastructure/WhatsAppNotifier.js';
import { AudioNotifier } from '../infrastructure/AudioNotifier.js';

export class NotificationDispatcher {
    /**
     * توزيع الإشعار على جميع القنوات
     */
    async dispatch(payload: NotificationPayload): Promise<void> {
        const promises = payload.channels.map(channel =>
            this.dispatchToChannel(channel, payload)
        );

        await Promise.allSettled(promises);
    }

    /**
     * إرسال لقناة واحدة
     */
    private async dispatchToChannel(
        channel: NotificationChannel,
        payload: NotificationPayload
    ): Promise<void> {
        try {
            switch (channel) {
                case NotificationChannel.IN_APP:
                    await InAppNotifier.send(payload);
                    break;

                case NotificationChannel.WHATSAPP:
                    await WhatsAppNotifier.send(payload);
                    break;

                case NotificationChannel.AUDIO:
                    await AudioNotifier.play(payload.audioType!);
                    break;

                default:
                    console.warn(`[Dispatcher] ⚠️ Unknown channel: ${channel}`);
            }
        } catch (error) {
            console.error(`[Dispatcher] ❌ Error in ${channel}:`, error);
        }
    }
}
