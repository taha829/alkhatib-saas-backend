import { NotificationEventType, NotificationChannel, NotificationPriority, AudioFeedbackType } from './NotificationEvent.js';

export interface NotificationRule {
    event: NotificationEventType;
    channels: NotificationChannel[];
    priority: NotificationPriority;
    audioType: AudioFeedbackType;
    template: string;
    isEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_RULES: NotificationRule[] = [
    // أحداث المواعيد
    {
        event: NotificationEventType.APPOINTMENT_CREATED,
        channels: [NotificationChannel.IN_APP, NotificationChannel.AUDIO],
        priority: NotificationPriority.MEDIUM,
        audioType: AudioFeedbackType.SUCCESS,
        template: 'APPOINTMENT_CREATED_TEMPLATE',
        isEnabled: true,
    },
    {
        event: NotificationEventType.APPOINTMENT_CONFIRMED,
        channels: [NotificationChannel.IN_APP, NotificationChannel.AUDIO],
        priority: NotificationPriority.MEDIUM,
        audioType: AudioFeedbackType.SUCCESS,
        template: 'APPOINTMENT_CONFIRMED_TEMPLATE',
        isEnabled: true,
    },
    {
        event: NotificationEventType.APPOINTMENT_CANCELLED,
        channels: [NotificationChannel.IN_APP, NotificationChannel.AUDIO],
        priority: NotificationPriority.MEDIUM,
        audioType: AudioFeedbackType.WARNING,
        template: 'APPOINTMENT_CANCELLED_TEMPLATE',
        isEnabled: true,
    },
    {
        event: NotificationEventType.APPOINTMENT_REMINDER_1H,
        channels: [NotificationChannel.IN_APP, NotificationChannel.WHATSAPP, NotificationChannel.AUDIO],
        priority: NotificationPriority.HIGH,
        audioType: AudioFeedbackType.REMINDER,
        template: 'APPOINTMENT_REMINDER_TEMPLATE',
        isEnabled: true,
    },
    {
        event: NotificationEventType.APPOINTMENT_COMPLETED,
        channels: [NotificationChannel.IN_APP, NotificationChannel.AUDIO],
        priority: NotificationPriority.MEDIUM,
        audioType: AudioFeedbackType.SUCCESS,
        template: 'APPOINTMENT_COMPLETED_TEMPLATE',
        isEnabled: true,
    },

    // أحداث المرضى
    {
        event: NotificationEventType.NEW_PATIENT_REGISTERED,
        channels: [NotificationChannel.IN_APP, NotificationChannel.AUDIO],
        priority: NotificationPriority.MEDIUM,
        audioType: AudioFeedbackType.SUCCESS,
        template: 'NEW_PATIENT_TEMPLATE',
        isEnabled: true,
    },
    {
        event: NotificationEventType.PATIENT_SYNCED,
        channels: [NotificationChannel.IN_APP, NotificationChannel.AUDIO],
        priority: NotificationPriority.LOW,
        audioType: AudioFeedbackType.INFO,
        template: 'PATIENT_SYNCED_TEMPLATE',
        isEnabled: true,
    },

    // أحداث الرسائل
    {
        event: NotificationEventType.NEW_WHATSAPP_MESSAGE,
        channels: [NotificationChannel.IN_APP, NotificationChannel.AUDIO],
        priority: NotificationPriority.HIGH,
        audioType: AudioFeedbackType.NEW_MESSAGE,
        template: 'NEW_MESSAGE_TEMPLATE',
        isEnabled: true,
    },

    // أحداث النظام
    {
        event: NotificationEventType.SYSTEM_SUCCESS,
        channels: [NotificationChannel.AUDIO],
        priority: NotificationPriority.LOW,
        audioType: AudioFeedbackType.SUCCESS,
        template: 'SUCCESS_TEMPLATE',
        isEnabled: true,
    },
    {
        event: NotificationEventType.SYSTEM_ERROR,
        channels: [NotificationChannel.AUDIO],
        priority: NotificationPriority.HIGH,
        audioType: AudioFeedbackType.ERROR,
        template: 'ERROR_TEMPLATE',
        isEnabled: true,
    },
    {
        event: NotificationEventType.SYSTEM_WARNING,
        channels: [NotificationChannel.AUDIO],
        priority: NotificationPriority.MEDIUM,
        audioType: AudioFeedbackType.WARNING,
        template: 'WARNING_TEMPLATE',
        isEnabled: true,
    },
    {
        event: NotificationEventType.SYSTEM_INFO,
        channels: [NotificationChannel.AUDIO],
        priority: NotificationPriority.LOW,
        audioType: AudioFeedbackType.INFO,
        template: 'INFO_TEMPLATE',
        isEnabled: true,
    },
];
