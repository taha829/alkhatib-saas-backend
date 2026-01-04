import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) {}

    @Get('plans')
    getPlans() {
        return this.subscriptionsService.getPlans();
    }

    @UseGuards(JwtAuthGuard)
    @Get('my')
    getMySubscription(@Request() req) {
        return this.subscriptionsService.getUserSubscription(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('checkout')
    checkout(@Request() req, @Body('planId') planId: number) {
        return this.subscriptionsService.createCheckoutSession(req.user.id, planId);
    }
}
