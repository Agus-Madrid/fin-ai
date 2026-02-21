import { Module } from '@nestjs/common';
import { AI_CLIENT } from './ai.client';
import { AiService } from './ai.service';
import { NullAiClient } from './null-ai.client';

@Module({
  providers: [
    AiService,
    {
      provide: AI_CLIENT,
      useClass: NullAiClient,
    },
  ],
  exports: [AiService],
})
export class AiModule {}
