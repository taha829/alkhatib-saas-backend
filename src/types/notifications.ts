export interface Notification {
    id: number;
    user_id: number | null;
    type: string;
    title: string;
    message: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    is_read: number;
    patient_id: number | null;
    appointment_id: number | null;
    metadata: string | null;
    created_at: string;
    read_at: string | null;
}

export enum NotificationEventType {
    APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
    APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
    APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
    APPOINTMENT_REMINDER_24H = 'APPOINTMENT_REMINDER_24H',
    APPOINTMENT_REMINDER_1H = 'APPOINTMENT_REMINDER_1H',
    APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
    APPOINTMENT_NO_SHOW = 'APPOINTMENT_NO_SHOW',
    NEW_PATIENT_REGISTERED = 'NEW_PATIENT_REGISTERED',
    PATIENT_UPDATED = 'PATIENT_UPDATED',
    PATIENT_SYNCED = 'PATIENT_SYNCED',
    NEW_WHATSAPP_MESSAGE = 'NEW_WHATSAPP_MESSAGE',
    MESSAGE_SENT = 'MESSAGE_SENT',
    MESSAGE_FAILED = 'MESSAGE_FAILED',
    SYSTEM_ERROR = 'SYSTEM_ERROR',
    SYSTEM_SUCCESS = 'SYSTEM_SUCCESS',
    SYSTEM_WARNING = 'SYSTEM_WARNING',
    SYSTEM_INFO = 'SYSTEM_INFO',
    TRIAL_EXPIRING = 'TRIAL_EXPIRING',
    TRIAL_EXPIRED = 'TRIAL_EXPIRED',
}
