import db from '../database.js';
import { startTelegramBot, stopTelegramBot, getTelegramStatus } from './bot.js';

export async function initializeTelegramService() {
    try {
        console.log('[Telegram Service] Initializing...');

        // Check if token exists in DB
        const setting = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get() as { value: string } | undefined;

        if (setting && setting.value) {
            console.log('[Telegram Service] Found token, starting bot...');
            await startTelegramBot(setting.value);
        } else {
            console.log('[Telegram Service] No token found. Bot not started.');
        }

    } catch (error) {
        console.error('[Telegram Service] Initialization error:', error);
    }
}

export {
    startTelegramBot,
    stopTelegramBot,
    getTelegramStatus
};
