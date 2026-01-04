import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    WAMessage,
    downloadMediaMessage,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';
import * as path from 'path';
import * as fs from 'fs';
import P from 'pino';

@Injectable()
export class WhatsAppService implements OnModuleDestroy {
    private readonly logger = new Logger(WhatsAppService.name);
    private sockets = new Map<number, any>();
    private qrCodes = new Map<number, string>();
    private connectionStatus = new Map<number, boolean>();
    private sessionPath = path.join(process.cwd(), 'sessions');

    constructor(
        private prisma: PrismaService,
        private aiService: AiService,
    ) {
        if (!fs.existsSync(this.sessionPath)) {
            fs.mkdirSync(this.sessionPath, { recursive: true });
        }
    }

    async startSession(userId: number) {
        if (this.sockets.has(userId) && this.connectionStatus.get(userId)) {
            return { status: 'already_connected' };
        }

        const userSessionPath = path.join(this.sessionPath, `user_${userId}`);
        const { state, saveCreds } = await useMultiFileAuthState(userSessionPath);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: P({ level: 'silent' }),
            browser: ["Al-Khatib SaaS", "Chrome", "1.0.0"],
        });

        this.sockets.set(userId, sock);

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                this.qrCodes.set(userId, qr);
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                this.connectionStatus.set(userId, false);
                if (shouldReconnect) {
                    this.startSession(userId);
                } else {
                    this.qrCodes.delete(userId);
                    this.sockets.delete(userId);
                    fs.rmSync(userSessionPath, { recursive: true, force: true });
                }
            } else if (connection === 'open') {
                this.connectionStatus.set(userId, true);
                this.qrCodes.delete(userId);
                this.logger.log(`WhatsApp connected for user ${userId}`);
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type === 'notify') {
                for (const msg of messages) {
                    if (!msg.key.fromMe) {
                        await this.handleMessage(userId, msg);
                    }
                }
            }
        });

        return { status: 'initializing' };
    }

    async getStatus(userId: number) {
        return {
            connected: this.connectionStatus.get(userId) || false,
            qrCode: this.qrCodes.get(userId) || null,
        };
    }

    async logout(userId: number) {
        const sock = this.sockets.get(userId);
        if (sock) {
            await sock.logout();
            this.sockets.delete(userId);
            this.connectionStatus.delete(userId);
            this.qrCodes.delete(userId);
            const userSessionPath = path.join(this.sessionPath, `user_${userId}`);
            if (fs.existsSync(userSessionPath)) {
                fs.rmSync(userSessionPath, { recursive: true, force: true });
            }
        }
    }

    private async handleMessage(userId: number, msg: WAMessage) {
        const sock = this.sockets.get(userId);
        if (!sock) return;

        const from = msg.key.remoteJid;
        if (!from) return;

        const messageContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        if (!messageContent) return;

        this.logger.log(`Message from ${from}: ${messageContent}`);

        // Basic logic for saving to DB and AI response
        // (This is a simplified version of the original handleIncomingMessage)

        // 1. Save or Update Chat
        let chat = await this.prisma.whatsAppChat.findUnique({ where: { phone: from } });
        if (!chat) {
            chat = await this.prisma.whatsAppChat.create({
                data: {
                    phone: from,
                    name: msg.pushName || 'New Contact',
                    lastMessage: messageContent,
                    lastMessageTime: new Date().toISOString(),
                    unreadCount: 1,
                },
            });
        } else {
            chat = await this.prisma.whatsAppChat.update({
                where: { id: chat.id },
                data: {
                    lastMessage: messageContent,
                    lastMessageTime: new Date().toISOString(),
                    unreadCount: { increment: 1 },
                },
            });
        }

        // 2. Save Message
        await this.prisma.whatsAppMessage.create({
            data: {
                chatId: chat.id,
                fromMe: false,
                content: messageContent,
                timestamp: new Date(),
                status: 'received',
            },
        });

        // 3. AI Reply
        const aiResponse = await this.aiService.getAIResponse(userId, messageContent, from);
        if (aiResponse) {
            await sock.sendMessage(from, { text: aiResponse });

            // Save outgoing message
            await this.prisma.whatsAppMessage.create({
                data: {
                    chatId: chat.id,
                    fromMe: true,
                    content: aiResponse,
                    timestamp: new Date(),
                    status: 'sent',
                },
            });
        }
    }

    onModuleDestroy() {
        for (const [userId, sock] of this.sockets) {
            sock.end();
        }
    }
}
