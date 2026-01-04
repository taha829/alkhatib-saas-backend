import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
    constructor(private contactsService: ContactsService) { }

    @Get()
    async findAll(@Request() req) {
        return this.contactsService.findAll(req.user.id);
    }

    @Post('sync')
    async sync(@Request() req) {
        return this.contactsService.syncFromWhatsApp(req.user.id);
    }

    @Patch(':id')
    async updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body('status') status: string,
        @Request() req,
    ) {
        return this.contactsService.updateStatus(id, req.user.id, status);
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.contactsService.delete(id, req.user.id);
    }
}
