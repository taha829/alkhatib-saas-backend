import { Controller, Get, Post, Delete, UseGuards, Request } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsAppController {
    constructor(private whatsappService: WhatsAppService) { }

    @Get('status')
    async getStatus(@Request() req) {
        return this.whatsappService.getStatus(req.user.id);
    }

    @Post('connect')
    async connect(@Request() req) {
        return this.whatsappService.startSession(req.user.id);
    }

    @Delete('logout')
    async logout(@Request() req) {
        return this.whatsappService.logout(req.user.id);
    }
}
