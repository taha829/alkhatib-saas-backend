import { Module } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { AiService } from './ai.service';

@Module({
  providers: [WhatsAppService, AiService],
  controllers: [WhatsAppController],
  exports: [WhatsAppService],
})
export class WhatsAppModule { }
