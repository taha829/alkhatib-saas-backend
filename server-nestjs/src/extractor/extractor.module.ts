import { Module } from '@nestjs/common';
import { ExtractorService } from './extractor.service';
import { ExtractorController } from './extractor.controller';

@Module({
    controllers: [ExtractorController],
    providers: [ExtractorService],
    exports: [ExtractorService],
})
export class ExtractorModule {}
