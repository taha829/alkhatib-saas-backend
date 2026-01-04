import db from "../database.js";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, "../../uploads");

/**
 * Simplified AI Response Logic using manual fetch
 * This avoids SDK overhead and handles 404/Quota errors more gracefully
 */
export async function getAIResponse(userMessage: string, phone?: string, audioFilePath?: string): Promise<string | null> {
    const log = (msg: string) => console.log(`[AI] ${msg}`);

    try {
        log(`Generating response for: "${userMessage || 'Voice'}" (Phone: ${phone || 'Unknown'})`);

        // 1. Check if AI is enabled
        const aiEnabledRes = db.prepare("SELECT value FROM settings WHERE key = 'ai_enabled'").get() as { value: string } | undefined;
        if (aiEnabledRes?.value !== '1') {
            log("AI is disabled.");
            return null;
        }

        // 2. Get API Key
        const apiKeyRes = db.prepare("SELECT value FROM settings WHERE key = 'ai_api_key'").get() as { value: string } | undefined;
        let apiKey = apiKeyRes?.value?.trim();
        if (!apiKey) {
            log("❌ Gemini API Key is missing.");
            return null;
        }
        log(`Using Key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)} (Length: ${apiKey.length})`);

        // 3. Prepare History
        let historyStr = "";
        if (phone) {
            const chat = db.prepare('SELECT id FROM whatsapp_chats WHERE phone = ?').get(phone) as { id: number } | undefined;
            if (chat) {
                const history = db.prepare(`
                    SELECT from_me, content FROM whatsapp_messages 
                    WHERE chat_id = ? 
                    ORDER BY timestamp DESC LIMIT 6
                `).all(chat.id) as { from_me: number, content: string }[];
                historyStr = history.reverse().map(h => `${h.from_me ? 'Assistant' : 'User'}: ${h.content}`).join('\n');
            }
        }

        // 4. Build System Instruction
        const systemInstructionRes = db.prepare("SELECT value FROM settings WHERE key = 'ai_system_instruction'").get() as { value: string } | undefined;
        const userIdentity = systemInstructionRes?.value || "أنت مساعد ذكي ومفيد.";
        const services = db.prepare("SELECT name, description FROM services WHERE is_active = 1").all() as { name: string, description: string }[];
        let servicesContext = services.length > 0 ? `\n📌 خدماتنا:\n${services.map(s => `- ${s.name}: ${s.description}`).join('\n')}` : "";
        const systemInstruction = `${userIdentity}${servicesContext}
        
📌 **PROCOTOL FOR ACTIONS (IMPORTANT):**
- If the user explicitly asks to book an appointment, YOU MUST output a special tag at the end of your response:
  \`[[APPOINTMENT: YYYY-MM-DD | HH:MM | Customer Name | Notes]]\`
- Dates must be in the future.
- Format strictly: YYYY-MM-DD (e.g. 2025-05-20).
- Time strictly: HH:MM AM/PM or 24h (e.g. 10:30 AM).
- If details are missing, ASK the user for them instead of inventing them.
- Example: "Sure, I have booked that for you. [[APPOINTMENT: 2025-01-20 | 14:30 | ${phone || 'Unknown'} | General Consultation]]"

رد الآن باحترافية وبدون تكرار.`;

        // 5. Try Robust Fetch with CONFIRMED available models
        const versions = ['v1beta', 'v1'];
        // Using names confirmed by ListModels API
        const models = ['gemini-2.0-flash', 'gemini-flash-latest', 'gemini-pro-latest', 'gemini-1.5-flash'];

        for (const v of versions) {
            for (const model of models) {
                try {
                    log(`>>> Trying ${model} (${v})...`);
                    const url = `https://generativelanguage.googleapis.com/${v}/models/${model}:generateContent?key=${apiKey}`;

                    const parts: any[] = [];
                    if (audioFilePath && fs.existsSync(audioFilePath)) {
                        log("Adding audio...");
                        const audioData = fs.readFileSync(audioFilePath).toString('base64');
                        parts.push({ inlineData: { mimeType: "audio/ogg", data: audioData } });
                        parts.push({ text: "افهم هذه البصمة الصوتية ورد عليها بالعربية." });
                    }

                    const todayDate = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
                    const prompt = `تاريخ اليوم: ${todayDate}\n${historyStr ? 'سياق:\n' + historyStr + '\n' : ''}الرسالة: ${userMessage || '(بصمة)'}`;
                    parts.push({ text: prompt });

                    const body: any = {
                        contents: [{ parts }],
                        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
                    };

                    // Only use system_instruction on v1beta as it's more stable there
                    if (v === 'v1beta') {
                        body.system_instruction = { parts: [{ text: systemInstruction }] };
                    } else {
                        // On v1, prepend system instruction to the prompt context
                        body.contents[0].parts.unshift({ text: `System Instruction: ${systemInstruction}\n\n` });
                    }

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });

                    const data: any = await response.json();

                    if (!response.ok) {
                        const err = data.error?.message || response.statusText;
                        if (response.status === 429) {
                            log(`⚠️ Quota exceeded for ${model} (${v}).`);
                        } else {
                            log(`❌ ${model} (${v}): ${err}`);
                            console.log(`[AI RAW ERROR] ${JSON.stringify(data)}`);
                        }
                        continue;
                    }

                    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    if (!text) continue;

                    log(`✅ Success with ${model} on ${v}!`);
                    return text.trim();

                } catch (e: any) {
                    log(`Err ${model}: ${e.message}`);
                }
            }
        }

        log("!!! All models failed. This is likely a permanent Quota Exceeded error for this API Key.");
        return "عذراً، المساعد الذكي وصل للحد الأقصى من الاستخدام اليومي المجاني من شركة جوجل. يرجى المحاولة غداً أو تزويدنا بمفتاح API جديد. 🙏";

    } catch (err: any) {
        console.error(`[AI Fatal Error] ${err.message}`);
        console.error(err.stack);
        return null;
    }
}

/** TTS Utility */
import * as googleTTS from 'google-tts-api';
export async function generateVoice(text: string, lang: string = 'ar'): Promise<string | null> {
    try {
        if (!text) return null;
        const results = await googleTTS.getAllAudioBase64(text, { lang, slow: false, host: 'https://translate.google.com' });
        const finalBuffer = Buffer.concat(results.map(r => Buffer.from(r.base64, 'base64')));
        const filename = `voice_${crypto.randomBytes(4).toString('hex')}.mp3`;
        if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        fs.writeFileSync(path.join(UPLOADS_DIR, filename), finalBuffer);
        return filename;
    } catch (e) {
        console.error("[AI Voice] Error:", e);
        return null;
    }
}
