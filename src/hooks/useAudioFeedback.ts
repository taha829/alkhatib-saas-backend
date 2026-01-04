import { useCallback, useRef, useEffect } from 'react';

interface AudioSettings {
    enabled: boolean;
    volume: number;
}

const DEFAULT_SETTINGS: AudioSettings = {
    enabled: true,
    volume: 0.5,
};

export function useAudioFeedback() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const settingsRef = useRef<AudioSettings>(DEFAULT_SETTINGS);

    // تحميل الإعدادات من localStorage
    useEffect(() => {
        const saved = localStorage.getItem('audioSettings');
        if (saved) {
            try {
                settingsRef.current = JSON.parse(saved);
            } catch (e) {
                console.warn('[Audio] Failed to parse settings');
            }
        }
    }, []);

    const playSound = useCallback(() => {
        if (!settingsRef.current.enabled) return;

        // صوت واحد فقط لجميع الإشعارات
        const audioPath = '/sounds/notification.mp3';

        // إيقاف الصوت السابق إن وجد
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        // تشغيل الصوت الجديد
        audioRef.current = new Audio(audioPath);
        audioRef.current.volume = settingsRef.current.volume;
        audioRef.current.play().catch(err => {
            console.warn('[Audio] Failed to play:', err);
        });
    }, []);

    const updateSettings = useCallback((settings: Partial<AudioSettings>) => {
        settingsRef.current = { ...settingsRef.current, ...settings };
        localStorage.setItem('audioSettings', JSON.stringify(settingsRef.current));
    }, []);

    const getSettings = useCallback(() => settingsRef.current, []);

    return { playSound, updateSettings, getSettings };
}
