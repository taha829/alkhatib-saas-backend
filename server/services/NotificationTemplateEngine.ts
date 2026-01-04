import { NotificationTemplate } from '../domain/NotificationEvent.js';

export class NotificationTemplateEngine {
    private templates: Map<string, NotificationTemplate>;

    constructor() {
        this.templates = new Map();
        this.loadTemplates();
    }

    render(templateId: string, data: Record<string, any> = {}): NotificationTemplate {
        const template = this.templates.get(templateId);
        if (!template) {
            console.warn(`[TemplateEngine] Template not found: ${templateId}`);
            return {
                title: 'إشعار',
                message: 'لديك إشعار جديد',
            };
        }

        return {
            title: this.interpolate(template.title, data),
            message: this.interpolate(template.message, data),
        };
    }

    private interpolate(text: string, data: Record<string, any>): string {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key]?.toString() || match;
        });
    }

    private loadTemplates(): void {
        // قوالب المواعيد
        this.templates.set('APPOINTMENT_CREATED_TEMPLATE', {
            title: 'موعد جديد',
            message: 'تم حجز موعد للمريض {{patientName}} في {{appointmentDate}}',
        });

        this.templates.set('APPOINTMENT_CONFIRMED_TEMPLATE', {
            title: 'تأكيد الموعد',
            message: 'تم تأكيد موعد {{patientName}}',
        });

        this.templates.set('APPOINTMENT_CANCELLED_TEMPLATE', {
            title: 'إلغاء موعد',
            message: 'تم إلغاء موعد {{patientName}}',
        });

        this.templates.set('APPOINTMENT_REMINDER_TEMPLATE', {
            title: 'تذكير بالموعد',
            message: 'مرحباً {{patientName}}، لديك موعد في عيادة {{clinicName}} الساعة {{appointmentTime}}',
        });

        this.templates.set('APPOINTMENT_COMPLETED_TEMPLATE', {
            title: 'اكتمال الموعد',
            message: 'تم إكمال موعد {{patientName}} بنجاح',
        });

        // قوالب المرضى
        this.templates.set('NEW_PATIENT_TEMPLATE', {
            title: 'مريض جديد',
            message: 'تم تسجيل مريض جديد: {{patientName}}',
        });

        this.templates.set('PATIENT_SYNCED_TEMPLATE', {
            title: 'مزامنة المرضى',
            message: 'تم مزامنة {{count}} مريض من واتساب',
        });

        // قوالب الرسائل
        this.templates.set('NEW_MESSAGE_TEMPLATE', {
            title: 'رسالة جديدة',
            message: 'رسالة جديدة من {{senderName}}',
        });

        // قوالب النظام
        this.templates.set('SUCCESS_TEMPLATE', {
            title: 'نجح',
            message: '{{action}} بنجاح ✅',
        });

        this.templates.set('ERROR_TEMPLATE', {
            title: 'خطأ',
            message: 'فشل {{action}}. يرجى المحاولة مرة أخرى.',
        });

        this.templates.set('WARNING_TEMPLATE', {
            title: 'تحذير',
            message: '{{message}}',
        });

        this.templates.set('INFO_TEMPLATE', {
            title: 'معلومة',
            message: '{{message}}',
        });
    }

    // إضافة قالب جديد
    addTemplate(id: string, template: NotificationTemplate): void {
        this.templates.set(id, template);
    }

    // الحصول على جميع القوالب
    getAllTemplates(): Map<string, NotificationTemplate> {
        return this.templates;
    }
}
