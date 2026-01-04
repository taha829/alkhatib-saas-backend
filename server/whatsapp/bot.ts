import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    WAMessage,
    proto,
    downloadMediaMessage
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import P from 'pino';
import db from '../database.js';
import { getAIResponse, generateVoice } from './ai.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = process.env.USER_DATA_PATH
    ? path.join(process.env.USER_DATA_PATH, 'uploads')
    : path.join(__dirname, '../../uploads');

const logger = P({ level: 'info' });

let sock: ReturnType<typeof makeWASocket> | null = null;
let isConnected = false;
let qrCodeData: string | null = null;

// Simple logger for production debugging
export function logService(message: string) {
    console.log(message);
    try {
        const logDir = process.env.USER_DATA_PATH || path.join(__dirname, '../../');
        const logPath = path.join(logDir, 'service.log');
        fs.appendFileSync(logPath, `${new Date().toISOString()} - ${message}\n`);
    } catch (e) {
        // ignore
    }
}

let lastStartTime = 0;

let isStarting = false;

export async function startWhatsAppBot() {
    // Prevent multiple simultaneous starts
    if (isStarting) {
        console.log('[WhatsApp] Bot is already in the process of starting. Skipping.');
        return;
    }

    const now = Date.now();
    if (isConnected && sock && (now - lastStartTime < 5000)) {
        console.log('[WhatsApp] Bot is already connected and stable. Skipping.');
        return;
    }

    isStarting = true;
    lastStartTime = now;

    const authPath = process.env.USER_DATA_PATH
        ? path.join(process.env.USER_DATA_PATH, 'auth_info_baileys')
        : path.join(__dirname, '../../auth_info_baileys');

    // Ensure auth directory exists
    if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, { recursive: true });
    }

    logService(`[WhatsApp] Starting bot with auth at: ${authPath}`);
    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger,
        browser: ["Windows", "Chrome", "11.0.0"], // More standard browser ID
        syncFullHistory: false, // Reduce initial load to avoid stream errors
        connectTimeoutMs: 60000,
        retryRequestDelayMs: 5000,
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrCodeData = qr;
            logService('[WhatsApp] 📸 QR Code generated. Scan it to connect.');
        }

        logService(`[WhatsApp] Connection update: ${connection || 'status change'} ${update.lastDisconnect?.error || ''}`);

        if (connection === 'close') {
            const statusCode = Number((lastDisconnect?.error as Boom)?.output?.statusCode);
            const isConflict = statusCode === 440;
            const isLoggedOut = statusCode === (DisconnectReason.loggedOut as any);
            // 515 is a common stream error that requires a restart
            const isStreamError = statusCode === 515;
            const shouldReconnect = (!isLoggedOut && !isConflict) || isStreamError;

            console.log(`[WhatsApp] Connection closed. Status: ${statusCode}. Should Reconnect: ${shouldReconnect}`);

            // Reset flags allowing a fresh attempt
            isConnected = false;
            isStarting = false;

            if (isConflict) {
                console.warn('[WhatsApp] ⚠️ Connection Conflict (440).');
                setTimeout(() => startWhatsAppBot(), 15000);
            } else if (shouldReconnect) {
                const delay = isStreamError ? 1000 : 3000;
                setTimeout(() => startWhatsAppBot(), delay);
            } else {
                qrCodeData = null;
                if (isLoggedOut || statusCode === 401 || isStreamError) {
                    console.log(`[WhatsApp] ⚠️ Session issue (Status: ${statusCode}). Potential clearing...`);
                    // If stream error persists, it might be due to corrupted session files
                    if (isLoggedOut || statusCode === 401) {
                        if (fs.existsSync(authPath)) {
                            try {
                                const backupPath = `${authPath}_backup_${Date.now()}`;
                                fs.renameSync(authPath, backupPath);
                                console.log(`[WhatsApp] Session folder moved to: ${backupPath}`);
                            } catch (e) {
                                console.error('[WhatsApp] Failed to move session folder:', e);
                                fs.rmSync(authPath, { recursive: true, force: true });
                            }
                        }
                    }
                    setTimeout(() => startWhatsAppBot(), 2000);
                }
            }
        }
        else if (connection === 'open') {
            isConnected = true;
            qrCodeData = null;
            console.log('[WhatsApp] ✅ Connected successfully!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        console.log(`[WhatsApp] 📥 Incoming Event: ${type} | Count: ${messages.length}`);

        for (const message of messages) {
            console.log(`[WhatsApp] 📨 Raw Message ID: ${message.key.id} | From: ${message.key.remoteJid} | type: ${type}`);
            await handleIncomingMessage(message);
        }
    });

    // Verbose logging for other events to verify life
    sock.ev.on('presence.update', (json) => console.log('[WhatsApp] 👤 Presence update:', json));
    sock.ev.on('chats.upsert', (chats) => console.log('[WhatsApp] 📂 Chats upsert:', chats.length));
    sock.ev.on('contacts.upsert', (contacts) => console.log('[WhatsApp] 👥 Contacts upsert:', contacts.length));

    // Heartbeat to prove the process is alive
    setInterval(() => {
        if (isConnected) {
            logService('[WhatsApp] ❤️ Heartbeat: Connection is OPEN');
        } else {
            logService('[WhatsApp] 💔 Heartbeat: Connection is CLOSED');
        }
    }, 60000); // Every minute
}

async function handleIncomingMessage(message: WAMessage) {
    try {
        const from = message.key.remoteJid;
        console.log(`[WhatsApp] 🔎 Analyzing message from: ${from}`);

        let messageContent =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            message.message?.videoMessage?.caption ||
            '';

        let audioPath: string | undefined = undefined;

        // Handle Audio Messages (Voice Notes)
        if (message.message?.audioMessage) {
            console.log(`[WhatsApp] 🎤 Audio message detected from ${from}`);
            const buffer = await downloadMediaMessage(
                message,
                'buffer',
                {},
                {
                    logger,
                    reuploadRequest: sock!.updateMediaMessage
                }
            ) as Buffer;

            const filename = `incoming_voice_${Date.now()}.ogg`;
            audioPath = path.join(UPLOADS_DIR, filename);
            fs.writeFileSync(audioPath, buffer);
            console.log(`[WhatsApp] Audio saved to ${audioPath}`);

            if (!messageContent) messageContent = "(ضبط رسالة صوتية)";
        }

        if (!from || (!messageContent && !audioPath)) {
            return;
        }

        if (message.key.fromMe) {
            console.log(`[WhatsApp] Ignoring message from myself (${from})`);
            return;
        }

        const phone = from; // Handle as full JID (@s.whatsapp.net or @lid)
        const name = message.pushName || 'Unknown';

        console.log(`[WhatsApp] 🚀 NEW MESSAGE RECEIVED: [${name}] (${phone}): "${messageContent}"`);

        // Save chat
        let chat = db.prepare('SELECT * FROM whatsapp_chats WHERE phone = ?').get(phone) as any;

        if (!chat) {
            db.prepare(`
        INSERT INTO whatsapp_chats (phone, name, last_message, last_message_time, unread_count)
        VALUES (?, ?, ?, ?, 1)
      `).run(phone, name, messageContent, new Date().toISOString());

            chat = db.prepare('SELECT * FROM whatsapp_chats WHERE phone = ?').get(phone) as any;
        } else {
            db.prepare(`
        UPDATE whatsapp_chats 
        SET last_message = ?, last_message_time = ?, unread_count = unread_count + 1, name = ?
        WHERE id = ?
      `).run(messageContent, new Date().toISOString(), name, chat.id);
        }

        // Save message
        db.prepare(`
      INSERT INTO whatsapp_messages (chat_id, message_id, from_me, content, timestamp)
      VALUES (?, ?, 0, ?, ?)
    `).run(chat.id, message.key.id, messageContent, new Date().toISOString());

        // Check for auto-reply
        await checkAutoReply(phone, messageContent, audioPath);

        console.log(`[WhatsApp] Finished handling message from ${phone}`);

    } catch (error) {
        console.error('[WhatsApp] Error handling message:', error);
    }
}

function normalizeArabic(text: string): string {
    return text
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[^\w\s\u0621-\u064A]/g, '') // Remove punctuation and symbols
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

async function checkAutoReply(phone: string, messageContent: string, audioPath?: string) {
    const templates = db.prepare(`
    SELECT * FROM auto_reply_templates 
    WHERE is_active = 1 
    ORDER BY priority ASC
  `).all() as any[];

    const normContent = normalizeArabic(messageContent);
    // Log to DB for persistent debugging
    db.prepare(`
        INSERT INTO whatsapp_logs (type, phone, content)
        VALUES ('debug-check', ?, ?)
    `).run(phone, `Checking: "${messageContent}" | Norm: "${normContent}" | Templates: ${templates.length}`);

    console.log(`[WhatsApp] 🤖 Checking Auto-Reply for: "${messageContent}" (Phone: ${phone})`);

    let matched = false;
    for (const template of templates) {
        const trigger = normalizeArabic(template.trigger);

        if (normContent.includes(trigger)) {
            console.log(`[WhatsApp] ✅ Matched Template: "${template.trigger}"`);
            await sendMessage(phone, template.response);

            // Log for analytics
            db.prepare(`
                INSERT INTO whatsapp_logs (type, trigger_id, phone, content)
                VALUES ('auto-reply', ?, ?, ?)
            `).run(template.id, phone, template.response);

            matched = true;
            break;
        }
    }

    // AI Fallback if no template matched
    if (!matched) {
        console.log(`[WhatsApp] 🧐 No template matched. Triggering AI Fallback...`);
        let aiResponse = await getAIResponse(messageContent, phone, audioPath);
        console.log(`[WhatsApp] 🧠 AI Response received: ${aiResponse ? "YES" : "NO (NULL)"}`);
        if (aiResponse) {
            console.log(`[WhatsApp] AI Generated response: "${aiResponse.substring(0, 50)}..."`);
            // --- Auto-Tagging Logic ---
            const tagRegex = /\[\[TAGS:\s*(.+?)\]\]/;
            const tagMatch = aiResponse.match(tagRegex);

            if (tagMatch) {
                const tagNames = tagMatch[1].split(',').map(t => t.trim());
                for (const tagName of tagNames) {
                    const tag = db.prepare('SELECT id FROM customer_tags WHERE name = ?').get(tagName) as { id: number } | undefined;
                    if (tag) {
                        db.prepare('INSERT OR IGNORE INTO customer_tag_map (phone, tag_id) VALUES (?, ?)').run(phone, tag.id);
                        console.log(`[AI Auto-Tag] Applied tag "${tagName}" to ${phone}`);
                    }
                }
                // Clean response from tags
                aiResponse = aiResponse.replace(tagRegex, '').trim();
            }

            // --- Appointment Extraction Logic ---
            // Format: [[APPOINTMENT: 2024-05-20 | 10:00 AM | John Doe | Discussing Project]]
            const apptRegex = /\[\[APPOINTMENT:\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\]\]/;
            const apptMatch = aiResponse.match(apptRegex);

            if (apptMatch) {
                const [_, dateStr, timeStr, customerName, notes] = apptMatch;
                try {
                    // 1. Normalize Date
                    const cleanDate = dateStr.trim();
                    const cleanTime = timeStr.trim();
                    const fullDateStr = `${cleanDate}T${cleanTime}:00`; // Try ISO format first

                    let appointmentDate = new Date(fullDateStr);
                    // Fallback for non-ISO
                    if (isNaN(appointmentDate.getTime())) {
                        appointmentDate = new Date(`${cleanDate} ${cleanTime}`);
                    }

                    if (isNaN(appointmentDate.getTime())) {
                        throw new Error(`Invalid Date Format: ${cleanDate} ${cleanTime}`);
                    }

                    // 2. Conflict Detection
                    // Check +30 mins window
                    const existing = db.prepare(`
                        SELECT id FROM appointments 
                        WHERE appointment_date = ? 
                           OR (appointment_date BETWEEN datetime(?, '-29 minutes') AND datetime(?, '+29 minutes'))
                    `).get(appointmentDate.toISOString(), appointmentDate.toISOString(), appointmentDate.toISOString());

                    if (existing) {
                        console.log(`[AI Appointment] ⚠️ Conflict detected for ${appointmentDate.toISOString()}`);

                        // OVERWRITE the AI's optimistic response with a refusal
                        aiResponse = `عذراً، هذا الموعد (${cleanDate} الساعة ${cleanTime}) محجوز مسبقاً. ❌\n\nيرجى اختيار وقت آخر.`;
                    } else {
                        // 3. Find Patient (Contact) ID if exists
                        const contact = db.prepare('SELECT id FROM contacts WHERE phone = ?').get(phone) as { id: number } | undefined;

                        // 4. Insert Appointment
                        db.prepare(`
                            INSERT INTO appointments (patient_id, phone, customer_name, appointment_date, notes, status, appointment_type)
                            VALUES (?, ?, ?, ?, ?, 'scheduled', 'consultation')
                        `).run(contact ? contact.id : null, phone, customerName.trim(), appointmentDate.toISOString(), notes.trim());

                        console.log(`[AI Appointment] ✅ Success! Saved for ${customerName} (ID: ${contact?.id || 'New'}) on ${appointmentDate.toISOString()}`);

                        // Notify admin via socket/events could go here

                        // Clean response from tags
                        aiResponse = aiResponse.replace(apptRegex, '').trim();
                        aiResponse += "\n\n✅ تم تأكيد الحجز في النظام.";
                    }
                } catch (err: any) {
                    console.error('[AI Appointment] Failed to save:', err.message);
                    aiResponse = aiResponse.replace(apptRegex, '').trim();
                    aiResponse += "\n\n(عذراً، حدث خطأ تقني في حفظ الموعد، يرجى التواصل هاتفياً).";
                }
            }
            // ------------------------------------
            // Check for voice enabled
            const voiceEnabled = db.prepare("SELECT value FROM settings WHERE key = 'ai_voice_enabled'").get() as { value: string } | undefined;
            const voiceLang = db.prepare("SELECT value FROM settings WHERE key = 'ai_voice_language'").get() as { value: string } | undefined;

            if (voiceEnabled?.value === '1') {
                const audioFilename = await generateVoice(aiResponse, voiceLang?.value || 'ar');
                if (audioFilename) {
                    const audioPath = path.join(UPLOADS_DIR, audioFilename);
                    await sendMessage(phone, aiResponse, { mediaUrl: audioPath, mediaType: 'audio' });

                    return;
                }
            }

            // Log for analytics
            db.prepare(`
                INSERT INTO whatsapp_logs (type, phone, content)
                VALUES ('ai-reply', ?, ?)
            `).run(phone, aiResponse);

            await sendMessage(phone, aiResponse);
        } else {
            console.log(`[WhatsApp] AI failed to respond for ${phone}. Sending fallback.`);
            await sendMessage(phone, "عذراً، المساعد الذكي مشغول حالياً. يمكنك تكرار طلبك بعد قليل أو التواصل مع الإدارة مباشرة. 🙏");
        }
    }
}

export async function sendMessage(phone: string, message: string, options?: { mediaUrl?: string, mediaType?: 'image' | 'video' | 'document' | 'audio' }) {
    if (!sock || !isConnected) {
        throw new Error('WhatsApp not connected');
    }

    // Construct JID: 
    // 1. If it already contains @ (like @lid or @g.us), use it as is
    // 2. Otherwise, treat as raw phone: sanitize and append @s.whatsapp.net
    let jid = phone;
    if (!phone.includes('@')) {
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('07')) {
            cleanPhone = '962' + cleanPhone.substring(1);
        }
        jid = `${cleanPhone}@s.whatsapp.net`;
    }

    console.log(`[WhatsApp] 📤 Sending message via JID: ${jid} (Original Input: ${phone})`);

    try {
        let messagePayload: any = { text: message };

        if (options?.mediaUrl) {
            console.log(`[WhatsApp] 📦 Sending Media: ${options.mediaType} | Path: ${options.mediaUrl}`);
            const mediaSource = options.mediaUrl.startsWith('http') ? { url: options.mediaUrl } : fs.readFileSync(options.mediaUrl);
            const fileName = options.mediaUrl.split(/[/\\]/).pop() || 'document';

            if (options.mediaType === 'image') {
                messagePayload = { image: mediaSource, caption: message };
            } else if (options.mediaType === 'video') {
                messagePayload = { video: mediaSource, caption: message };
            } else if (options.mediaType === 'document') {
                messagePayload = {
                    document: mediaSource,
                    caption: message,
                    fileName: fileName,
                    mimetype: 'application/pdf'
                };
            } else if (options.mediaType === 'audio') {
                messagePayload = {
                    audio: mediaSource,
                    mimetype: 'audio/mpeg',
                    ptt: true
                };
            }
        }

        await sock.sendMessage(jid, messagePayload);

        // Save sent message
        // Fix: Use the JID directly if stored as such, or valid phone lookup
        const lookupPhone = jid;
        let chat = db.prepare('SELECT * FROM whatsapp_chats WHERE phone = ?').get(lookupPhone) as any;

        // If not found, try without suffix
        if (!chat) {
            chat = db.prepare('SELECT * FROM whatsapp_chats WHERE phone = ?').get(lookupPhone.replace('@s.whatsapp.net', '')) as any;
        }

        if (chat) {
            db.prepare(`
        INSERT INTO whatsapp_messages(chat_id, from_me, content, timestamp, status)
            VALUES(?, 1, ?, ?, 'sent')
                `).run(chat.id, options?.mediaUrl ? `[Media: ${options.mediaType}]${message} ` : message, new Date().toISOString());

            db.prepare(`
        UPDATE whatsapp_chats 
        SET last_message = ?, last_message_time = ?
                WHERE id = ?
                    `).run(options?.mediaUrl ? `[Media: ${options.mediaType}]${message} ` : message, new Date().toISOString(), chat.id);
        }

        return { success: true };
    } catch (error) {
        console.error('[WhatsApp] Error sending message:', error);
        throw error;
    }
}

export function getConnectionStatus() {
    return {
        connected: isConnected,
        qrCode: qrCodeData
    };
}

export async function disconnectWhatsApp() {
    if (sock) {
        await sock.logout();
        sock = null;
        isConnected = false;
        qrCodeData = null;
    }
}
