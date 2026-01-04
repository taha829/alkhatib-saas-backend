import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Calculate trial expiry (7 days from now)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        return this.prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
                subscriptionStatus: SubscriptionStatus.TRIAL,
                expiryDate: expiryDate,
                // We'll set the planId to 1 (assuming 1 is the default Free/Trial plan) 
                // In a real app, we'd fetch the default plan by name
            },
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
            include: { plan: true }
        });
    }

    async findById(id: number): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { plan: true }
        });

        // Auto-expire check
        if (user && user.expiryDate && new Date() > user.expiryDate && user.subscriptionStatus !== SubscriptionStatus.CANCELED) {
            // If trial/plan expired, downgrade status
            // But we don't save it here to avoid side-effects in GET requests, 
            // usually done via cron or middleware. For now, we return the status as is 
            // but the frontend/guards should check expiry.

            // Optional: Auto-update to PAST_DUE if we want strict enforcement on read
            /*
            if (user.subscriptionStatus === SubscriptionStatus.TRIAL || user.subscriptionStatus === SubscriptionStatus.ACTIVE) {
                 await this.prisma.user.update({
                     where: { id: user.id },
                     data: { subscriptionStatus: SubscriptionStatus.PAST_DUE }
                 });
                 user.subscriptionStatus = SubscriptionStatus.PAST_DUE;
            }
            */
        }

        return user;
    }
}
