import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as googleTTS from 'google-tts-api';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly uploadsDir = path.join(process.cwd(), 'uploads');

    constructor(private prisma: PrismaService) {
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
    }

    async getAIResponse(userId: number, userMessage: string, phone?: string, audioFilePath?: string): Promise<string | null> {
        try {
            // 1. Check if AI is enabled
            const settings = await this.prisma.setting.findMany({
                where: { key: { in: ['ai_enabled', 'ai_api_key', 'ai_system_instruction'] } },
            });

            const aiEnabled = settings.find(s => s.key === 'ai_enabled')?.value === '1';
            const apiKey = settings.find(s => s.key === 'ai_api_key')?.value?.trim();
            const systemInstructionBase = settings.find(s => s.key === 'ai_system_instruction')?.value || "أنت مساعد ذكي ومفيد.";

            if (!aiEnabled || !apiKey) {
                return null;
            }

            // 2. Prepare context
            const services = await this.prisma.service.findMany({ where: { isActive: true } });
            const servicesContext = services.length > 0
                ? `\n📌 خدماتنا:\n${services.map(s => `- ${s.name}: ${s.description}`).join('\n')}`
                : "";

            // 3. Prepare History
            let historyStr = "";
            if (phone) {
                const chat = await this.prisma.whatsAppChat.findUnique({ where: { phone } });
                if (chat) {
                    const history = await this.prisma.whatsAppMessage.findMany({
                        where: { chatId: chat.id },
                        orderBy: { timestamp: 'desc' },
                        take: 6,
                    });
                    historyStr = history.reverse().map(h => `${h.fromMe ? 'Assistant' : 'User'}: ${h.content}`).join('\n');
                }
            }

            const systemInstruction = `${systemInstructionBase}${servicesContext}
      
📌 **PROCOTOL FOR ACTIONS:**
- If user wants to book: \`[[APPOINTMENT: YYYY-MM-DD | HH:MM | Customer Name | Notes]]\`
- Dates in future.
- Format strictly.
- Ask if details missing.

رد الآن باحترافية.`;

            const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
            for (const model of models) {
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

                    const parts: any[] = [];
                    if (audioFilePath && fs.existsSync(audioFilePath)) {
                        const audioData = fs.readFileSync(audioFilePath).toString('base64');
                        parts.push({ inlineData: { mimeType: "audio/ogg", data: audioData } });
                        parts.push({ text: "افهم هذه البصمة الصوتية ورد عليها بالعربية." });
                    }

                    const todayDate = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
                    parts.push({ text: `تاريخ اليوم: ${todayDate}\n${historyStr ? 'سياق:\n' + historyStr + '\n' : ''}الرسالة: ${userMessage || '(بصمة)'}` });

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts }],
                            system_instruction: { parts: [{ text: systemInstruction }] },
                            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
                        })
                    });

                    const data: any = await response.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) return text.trim();
                } catch (e) {
                    this.logger.error(`Error with model ${model}: ${e.message}`);
                }
            }

            return null;
        } catch (err) {
            this.logger.error(`AI Fatal Error: ${err.message}`);
            return null;
        }
    }

    async generateVoice(text: string, lang: string = 'ar'): Promise<string | null> {
        try {
            if (!text) return null;
            const results = await googleTTS.getAllAudioBase64(text, { lang, slow: false, host: 'https://translate.google.com' });
            const finalBuffer = Buffer.concat(results.map(r => Buffer.from(r.base64, 'base64')));
            const filename = `voice_${crypto.randomBytes(4).toString('hex')}.mp3`;
            fs.writeFileSync(path.join(this.uploadsDir, filename), finalBuffer);
            return filename;
        } catch (e) {
            this.logger.error(`TTS Error: ${e.message}`);
            return null;
        }
    }
}
