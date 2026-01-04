import { Controller, Post, Get, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ExtractorService } from './extractor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('extractor')
@UseGuards(JwtAuthGuard)
export class ExtractorController {
    constructor(private readonly extractorService: ExtractorService) {}

    @Post('facebook')
    startFacebookExtraction(
        @Request() req, 
        @Body('url') url: string, 
        @Body('limit') limit: number
    ) {
        return this.extractorService.extractFromFacebook(req.user.id, url, limit);
    }

    @Get('tasks')
    getTasks(@Request() req) {
        return this.extractorService.getExtractionTasks(req.user.id);
    }
}
