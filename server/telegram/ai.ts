import { GoogleGenerativeAI } from "@google/generative-ai";
import db from "../database.js";
import axios from 'axios';
import * as googleTTS from 'google-tts-api';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

export async function getTelegramAIResponse(userMessage: string, chatId?: number, username?: string): Promise<string | null> {
    const log = (msg: string) => {
        console.log(`[Telegram AI] ${msg}`);
    };

    try {
        log(`Generating response for: "${userMessage}" (ChatID: ${chatId})`);

        // Fetch conversation history
        let historyStr = "";
        if (chatId) {
            const chat = db.prepare('SELECT id FROM telegram_chats WHERE chat_id = ?').get(chatId) as { id: number } | undefined;
            if (chat) {
                const history = db.prepare(`
                    SELECT from_me, content FROM telegram_messages 
                    WHERE chat_id = ? 
                    ORDER BY timestamp DESC LIMIT 10
                `).all(chat.id) as { from_me: number, content: string }[];

                // Reverse to get chronological order
                historyStr = history.reverse().map(h => `${h.from_me ? 'Assistant' : 'User'}: ${h.content}`).join('\n');
            }
        }

        // Fetch AI settings (Shared with WhatsApp for now, or we can add specific ones)
        const aiEnabledRes = db.prepare("SELECT value FROM settings WHERE key = 'ai_enabled'").get() as { value: string } | undefined;
        const aiEnabled = aiEnabledRes?.value === '1';

        if (!aiEnabled) {
            log("AI is disabled in settings.");
            return null;
        }

        const apiKeyRes = db.prepare("SELECT value FROM settings WHERE key = 'ai_api_key'").get() as { value: string } | undefined;
        const apiKey = apiKeyRes?.value;

        if (!apiKey) {
            log("Gemini API Key is missing.");
            return null;
        }

        const systemInstructionRes = db.prepare("SELECT value FROM settings WHERE key = 'ai_system_instruction'").get() as { value: string } | undefined;
        let systemInstruction = systemInstructionRes?.value || "أنت مساعد ذكي.";

        // Fetch available tags (Shared)
        const availableTags = db.prepare("SELECT name FROM customer_tags").all() as { name: string }[];
        if (availableTags.length > 0) {
            const tagList = availableTags.map(t => t.name).join(', ');
            systemInstruction += `\n\nنظام تصنيف العملاء:
بناءً على المحادثة، إذا وجدت أن العميل يستحق تصنيفاً معيناً، أضف السطر التالي في نهاية ردك:
[[TAGS: اسم_الوسم]]
الوسوم المتاحة حالياً هي: [${tagList}]`;
        }

        // Fetch services (Shared)
        const services = db.prepare("SELECT name, description, price FROM services WHERE is_active = 1").all() as { name: string, description: string, price: string }[];
        if (services.length > 0) {
            const serviceList = services.map(s => `- ${s.name}: ${s.description} (${s.price || 'حسب الاتفاق'})`).join('\n');
            systemInstruction += `\n\nقائمة الخدمات والأسعار:\n${serviceList}`;
        }

        const tryModel = async (version: string, model: string) => {
            const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;

            const parts: any[] = [];

            const cleanInstruction = `
${systemInstruction}

تعليمات هامة للرد على تيلجرام:
1. أجب باختصار وودية.
2. لا تستخدم مقدمات رسمية جداً.
3. التنسيق: استخدم الرموز التعبيرية (Emojis) بشكل مناسب.

${historyStr ? 'سياق المحادثة السابقة:\n' + historyStr + '\n\n' : ''}
`;
            parts.push({ text: cleanInstruction });
            parts.push({ text: `رسالة العميل: ${userMessage}\nردك المباشر:` });

            const body = {
                contents: [{ parts: parts }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 800,
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

            // Cleanup
            text = text.replace(/^(Assistant:|رد:|المساعد:|بوت:)\s*/i, "");
            return text.trim();
        };

        const versions = ['v1', 'v1beta'];
        const models = ['gemini-1.5-flash', 'gemini-pro'];

        for (const v of versions) {
            for (const m of models) {
                try {
                    const text = await tryModel(v, m);
                    if (text) return text;
                } catch (e) {
                    // continue
                }
            }
        }

        return null;
    } catch (error: any) {
        log(`Fatal Error: ${error.message}`);
        return null;
    }
}
