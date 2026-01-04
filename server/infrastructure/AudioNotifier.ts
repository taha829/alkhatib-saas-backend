export enum AudioFeedbackType {
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR',
    WARNING = 'WARNING',
    INFO = 'INFO',
    REMINDER = 'REMINDER',
    NEW_MESSAGE = 'NEW_MESSAGE',
    APPOINTMENT = 'APPOINTMENT',
}

export class AudioNotifier {
    private static audioMap: Record<AudioFeedbackType, string> = {
        [AudioFeedbackType.SUCCESS]: '/sounds/success.mp3',
        [AudioFeedbackType.ERROR]: '/sounds/error.mp3',
        [AudioFeedbackType.WARNING]: '/sounds/warning.mp3',
        [AudioFeedbackType.INFO]: '/sounds/info.mp3',
        [AudioFeedbackType.REMINDER]: '/sounds/reminder.mp3',
        [AudioFeedbackType.NEW_MESSAGE]: '/sounds/message.mp3',
        [AudioFeedbackType.APPOINTMENT]: '/sounds/appointment.mp3',
    };

    static async play(type: AudioFeedbackType): Promise<void> {
        // هذه الدالة للتوثيق فقط - التنفيذ الفعلي في الـ Frontend
        console.log(`[AudioNotifier] 🔊 Play: ${type}`);
    }

    static getAudioPath(type: AudioFeedbackType): string {
        return this.audioMap[type];
    }

    static getAllAudioPaths(): Record<AudioFeedbackType, string> {
        return { ...this.audioMap };
    }
}
