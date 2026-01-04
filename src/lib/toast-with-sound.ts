import { toast } from 'sonner';

// صوت واحد فقط لجميع الإشعارات
const playNotificationSound = () => {
    const audioSettings = localStorage.getItem('audioSettings');
    const settings = audioSettings ? JSON.parse(audioSettings) : { enabled: true, volume: 0.5 };

    if (!settings.enabled) return;

    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = settings.volume;
    audio.play().catch(() => { });
};

// Toast مبسط مع لونين فقط وشريط تقدم
export const toastWithSound = {
    // نجاح - أخضر
    success: (message: string, description?: string) => {
        playNotificationSound();
        toast.success(message, {
            description,
            duration: 3000,
            className: 'toast-success',
            style: {
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            },
        });
    },

    // خطأ - أحمر
    error: (message: string, description?: string) => {
        playNotificationSound();
        toast.error(message, {
            description,
            duration: 4000,
            className: 'toast-error',
            style: {
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            },
        });
    },

    // معلومة - نفس لون النجاح
    info: (message: string, description?: string) => {
        playNotificationSound();
        toast(message, {
            description,
            duration: 3000,
            className: 'toast-info',
            style: {
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            },
        });
    },
};

// تصدير toast العادي أيضاً
export { toast };
