import { Telegraf, Context } from 'telegraf';
import db from '../database.js';
import { getTelegramAIResponse } from './ai.js';

let bot: Telegraf | null = null;
let isRunning = false;
let botUsername = '';

export async function startTelegramBot(token: string) {
    if (isRunning) {
        console.log('[Telegram] Bot is already running.');
        return;
    }

    try {
        console.log('[Telegram] Starting bot...');
        bot = new Telegraf(token);

        // Get bot info
        const botInfo = await bot.telegram.getMe();
        botUsername = botInfo.username;
        console.log(`[Telegram] Bot started as @${botUsername}`);

        // Save/Update Token in DB
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('telegram_bot_token', ?)").run(token);

        setupHandlers(bot);

        bot.launch().catch(err => {
            console.error('[Telegram] Launch error:', err);
            isRunning = false;
        });

        isRunning = true;

        // Update status in DB if we had a dedicated status table,
        // but for now we rely on memory or the existing settings table if needed.

    } catch (error) {
        console.error('[Telegram] Failed to start bot:', error);
        isRunning = false;
        throw error;
    }
}

export async function stopTelegramBot() {
    if (bot && isRunning) {
        console.log('[Telegram] Stopping bot...');
        bot.stop('SIGINT');
        bot = null;
        isRunning = false;
    }
}

export function getTelegramStatus() {
    return {
        isRunning,
        username: botUsername
    };
}

function setupHandlers(bot: Telegraf) {
    // Start Command
    bot.command('start', async (ctx) => {
        try {
            const chat = ctx.chat;
            const from = ctx.from;

            console.log(`[Telegram] New user: ${from.first_name} (${chat.id})`);

            // Save/Update Chat
            const existingChat = db.prepare('SELECT id FROM telegram_chats WHERE chat_id = ?').get(chat.id) as any;

            if (!existingChat) {
                db.prepare(`
                    INSERT INTO telegram_chats (chat_id, username, first_name, status)
                    VALUES (?, ?, ?, 'active')
                `).run(chat.id, from.username, from.first_name);
            } else {
                // Update info in case they changed it
                db.prepare(`
                    UPDATE telegram_chats 
                    SET username = ?, first_name = ?, status = 'active'
                    WHERE chat_id = ?
                `).run(from.username, from.first_name, chat.id);
            }

            await ctx.reply(`مرحباً بك يا ${from.first_name} 👋\nأنا مساعدك الذكي من شركة الخطيب. كيف يمكنني مساعدتك اليوم؟`);
        } catch (error) {
            console.error('[Telegram] Start command error:', error);
        }
    });

    // Text Messages
    bot.on('text', async (ctx) => {
        try {
            const chatId = ctx.chat.id;
            const messageText = ctx.message.text;
            const messageId = ctx.message.message_id;

            console.log(`[Telegram] Msg from ${chatId}: ${messageText}`);

            // Ensure chat exists
            let chatEntry = db.prepare('SELECT id FROM telegram_chats WHERE chat_id = ?').get(chatId) as any;
            if (!chatEntry) {
                // Create if not exists (handling edge case where start wasn't used)
                const res = db.prepare(`
                    INSERT INTO telegram_chats (chat_id, username, first_name, status)
                    VALUES (?, ?, ?, 'active')
                `).run(chatId, ctx.from.username, ctx.from.first_name);
                chatEntry = { id: res.lastInsertRowid };
            }

            // Save Incoming Message
            db.prepare(`
                INSERT INTO telegram_messages (chat_id, message_id, from_me, content, type)
                VALUES (?, ?, 0, ?, 'text')
            `).run(chatEntry.id, messageId, messageText);

            // Update Last Message in Chat
            db.prepare(`
                UPDATE telegram_chats 
                SET last_message = ?, unread_count = unread_count + 1
                WHERE id = ?
            `).run(messageText, chatEntry.id);

            // AI Processing
            ctx.sendChatAction('typing');

            // Get AI Response
            const aiReply = await getTelegramAIResponse(messageText, chatId, ctx.from.username);

            if (aiReply) {
                // Send Reply
                const sentMsg = await ctx.reply(aiReply);

                // Save Outgoing Message (Bot Reply)
                db.prepare(`
                    INSERT INTO telegram_messages (chat_id, message_id, from_me, content, type)
                    VALUES (?, ?, 1, ?, 'text')
                `).run(chatEntry.id, sentMsg.message_id, aiReply);
            }

        } catch (error) {
            console.error('[Telegram] Message handler error:', error);
        }
    });

    // Error Handling
    bot.catch((err: any, ctx: Context) => {
        console.error(`[Telegram] Error for ${ctx.updateType}`, err);
    });
}
