import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Plan, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
    constructor(private prisma: PrismaService) {}

    async getPlans(): Promise<Plan[]> {
        return this.prisma.plan.findMany({
            orderBy: { price: 'asc' },
        });
    }

    async getUserSubscription(userId: number) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                subscriptionStatus: true,
                plan: true,
                expiryDate: true,
            },
        });
    }

    // This will be expanded with Stripe integration
    async createCheckoutSession(userId: number, planId: number) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const plan = await this.prisma.plan.findUnique({ where: { id: planId } });

        if (!user || !plan) {
            throw new Error('User or Plan not found');
        }

        // Placeholder for Stripe logic
        // return { url: 'https://checkout.stripe.com/...' };
        
        // For now, simulate a free upgrade or direct activation for testing
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                planId: plan.id,
                subscriptionStatus: SubscriptionStatus.ACTIVE,
            }
        });

        return { success: true, message: `Plan ${plan.name} activated` };
    }
}
