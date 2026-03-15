import { Module } from '@nestjs/common';
import { AI_CLIENT } from './ai.client';
import { AiService } from './ai.service';
import { GoogleAiStudioClient } from './google-ai-studio.client';
import { NullAiClient } from './null-ai.client';

function createAiClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';

  if (!apiKey) {
    return new NullAiClient();
  }

  return new GoogleAiStudioClient({
    apiKey,
    model,
  });
}

@Module({
  providers: [
    AiService,
    {
      provide: AI_CLIENT,
      useFactory: createAiClient,
    },
  ],
  exports: [AiService],
})
export class AiModule {}
