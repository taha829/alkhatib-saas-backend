import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Contact, Prisma } from '@prisma/client';

@Injectable()
export class ContactsService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: number): Promise<any[]> {
        // Note: We are using $queryRaw for the complex SQL query from the original Express controller
        // or we can try to translate it to Prisma Fluent API.
        // Let's use Prisma to get the basic data first, then we can optimize with Raw if needed.

        return this.prisma.contact.findMany({
            where: { userId },
            include: {
                appointment: {
                    orderBy: { appointmentDate: 'desc' },
                    take: 1,
                },
                tags: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateStatus(id: number, userId: number, status: string): Promise<Contact> {
        return this.prisma.contact.update({
            where: { id, userId },
            data: { status },
        });
    }

    async delete(id: number, userId: number): Promise<Contact> {
        return this.prisma.contact.delete({
            where: { id, userId },
        });
    }

    async syncFromWhatsApp(userId: number): Promise<{ synced: number }> {
        const chats = await this.prisma.whatsAppChat.findMany({
            select: { phone: true, name: true },
        });

        let syncCount = 0;
        for (const chat of chats) {
            try {
                await this.prisma.contact.upsert({
                    where: {
                        userId_phone: {
                            userId,
                            phone: chat.phone,
                        },
                    },
                    update: {}, // Don't update if exists
                    create: {
                        userId,
                        phone: chat.phone,
                        name: chat.name || 'مريض جديد',
                        platform: 'whatsapp',
                        status: 'active',
                    },
                });
                syncCount++;
            } catch (e) {
                // Skip if error (e.g. duplicate in same transaction)
            }
        }

        return { synced: syncCount };
    }
}
