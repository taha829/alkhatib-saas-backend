export enum NotificationEventType {
    // أحداث المواعيد
    APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
    APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
    APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
    APPOINTMENT_REMINDER_24H = 'APPOINTMENT_REMINDER_24H',
    APPOINTMENT_REMINDER_1H = 'APPOINTMENT_REMINDER_1H',
    APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
    APPOINTMENT_NO_SHOW = 'APPOINTMENT_NO_SHOW',

    // أحداث المرضى
    NEW_PATIENT_REGISTERED = 'NEW_PATIENT_REGISTERED',
    PATIENT_UPDATED = 'PATIENT_UPDATED',
    PATIENT_SYNCED = 'PATIENT_SYNCED',

    // أحداث الرسائل
    NEW_WHATSAPP_MESSAGE = 'NEW_WHATSAPP_MESSAGE',
    MESSAGE_SENT = 'MESSAGE_SENT',
    MESSAGE_FAILED = 'MESSAGE_FAILED',

    // أحداث النظام
    SYSTEM_ERROR = 'SYSTEM_ERROR',
    SYSTEM_SUCCESS = 'SYSTEM_SUCCESS',
    SYSTEM_WARNING = 'SYSTEM_WARNING',
    SYSTEM_INFO = 'SYSTEM_INFO',
    TRIAL_EXPIRING = 'TRIAL_EXPIRING',
    TRIAL_EXPIRED = 'TRIAL_EXPIRED',
}

export enum NotificationChannel {
    IN_APP = 'IN_APP',
    WHATSAPP = 'WHATSAPP',
    AUDIO = 'AUDIO',
}

export enum NotificationPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

export enum AudioFeedbackType {
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR',
    WARNING = 'WARNING',
    INFO = 'INFO',
    REMINDER = 'REMINDER',
    NEW_MESSAGE = 'NEW_MESSAGE',
    APPOINTMENT = 'APPOINTMENT',
}

export interface NotificationPayload {
    id?: string;
    event: NotificationEventType;
    title: string;
    message: string;
    channels: NotificationChannel[];
    priority: NotificationPriority;

    // البيانات المرتبطة
    patientId?: number;
    appointmentId?: number;
    userId?: number;

    // التوقيت
    scheduledAt?: Date;
    createdAt: Date;

    // الصوت
    audioType?: AudioFeedbackType;

    // البيانات الإضافية
    metadata?: Record<string, any>;
}

export interface NotificationTemplate {
    title: string;
    message: string;
}
