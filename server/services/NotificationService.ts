import { NotificationPayload, NotificationEventType } from '../domain/NotificationEvent.js';
import { NotificationDispatcher } from './NotificationDispatcher.js';
import { NotificationRuleEngine } from './NotificationRuleEngine.js';
import { NotificationTemplateEngine } from './NotificationTemplateEngine.js';

export class NotificationService {
    private dispatcher: NotificationDispatcher;
    private ruleEngine: NotificationRuleEngine;
    private templateEngine: NotificationTemplateEngine;

    constructor() {
        this.dispatcher = new NotificationDispatcher();
        this.ruleEngine = new NotificationRuleEngine();
        this.templateEngine = new NotificationTemplateEngine();
    }

    /**
     * إرسال إشعار فوري
     */
    async notify(payload: NotificationPayload): Promise<void> {
        try {
            // 1. تطبيق القواعد
            const rule = this.ruleEngine.getRule(payload.event);
            if (!rule.isEnabled) {
                console.log(`[NotificationService] ⏭️ Event disabled: ${payload.event}`);
                return;
            }

            // 2. توليد المحتوى من القالب (إذا لم يكن موجوداً)
            if (!payload.title || !payload.message) {
                const content = this.templateEngine.render(rule.template, payload.metadata);
                payload.title = payload.title || content.title;
                payload.message = payload.message || content.message;
            }

            // 3. دمج البيانات من القواعد
            const enrichedPayload: NotificationPayload = {
                ...payload,
                channels: payload.channels || rule.channels,
                priority: payload.priority || rule.priority,
                audioType: payload.audioType || rule.audioType,
                createdAt: payload.createdAt || new Date(),
            };

            // 4. إرسال عبر القنوات
            await this.dispatcher.dispatch(enrichedPayload);

            console.log(`[NotificationService] ✅ Sent: ${payload.event} - ${payload.title}`);
        } catch (error) {
            console.error('[NotificationService] ❌ Error:', error);
            throw error;
        }
    }

    /**
     * إرسال إشعار بسيط (للاستخدام السريع)
     */
    async notifySimple(
        event: NotificationEventType,
        metadata?: Record<string, any>
    ): Promise<void> {
        await this.notify({
            event,
            title: '',
            message: '',
            channels: [],
            priority: 'MEDIUM' as any,
            metadata,
            createdAt: new Date(),
        });
    }

    /**
     * إرسال إشعار نجاح
     */
    async notifySuccess(action: string): Promise<void> {
        await this.notify({
            event: NotificationEventType.SYSTEM_SUCCESS,
            title: 'نجح',
            message: `${action} بنجاح ✅`,
            channels: [],
            priority: 'LOW' as any,
            metadata: { action },
            createdAt: new Date(),
        });
    }

    /**
     * إرسال إشعار خطأ
     */
    async notifyError(action: string): Promise<void> {
        await this.notify({
            event: NotificationEventType.SYSTEM_ERROR,
            title: 'خطأ',
            message: `فشل ${action}. يرجى المحاولة مرة أخرى.`,
            channels: [],
            priority: 'HIGH' as any,
            metadata: { action },
            createdAt: new Date(),
        });
    }

    /**
     * إرسال إشعار تحذير
     */
    async notifyWarning(message: string): Promise<void> {
        await this.notify({
            event: NotificationEventType.SYSTEM_WARNING,
            title: 'تحذير',
            message,
            channels: [],
            priority: 'MEDIUM' as any,
            metadata: { message },
            createdAt: new Date(),
        });
    }

    /**
     * إرسال إشعار معلومة
     */
    async notifyInfo(message: string): Promise<void> {
        await this.notify({
            event: NotificationEventType.SYSTEM_INFO,
            title: 'معلومة',
            message,
            channels: [],
            priority: 'LOW' as any,
            metadata: { message },
            createdAt: new Date(),
        });
    }
}

// Singleton instance
export const notificationService = new NotificationService();
