import { Module } from '@nestjs/common';
import { AiModule } from '../../core/ai/ai.module';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';

@Module({
  imports: [AiModule],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class IngestionModule {}
