import { Module } from '@nestjs/common';
import { AIJobsService } from './application/ai-jobs.service';
import { AiOrchestratorService } from './application/ai-orchestrator.service';
import { MockAIService } from './application/mock-ai.service';
import { OpenAIService } from './application/openai-ai.service';
import { OllamaAIService } from './application/ollama-ai.service';
import { AiConfigService } from './application/ai-config.service';
import { resolveAiProvider } from './application/resolve-ai-provider';
import { AI_SERVICE } from './application/ports/ai-service.port';
import { AIController } from './presentation/ai.controller';
import { WebSocketModule } from '../../infrastructure/websocket/websocket.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [WebSocketModule],
  controllers: [AIController],
  providers: [
    AIJobsService,
    AiOrchestratorService,
    MockAIService,
    OpenAIService,
    OllamaAIService,
    AiConfigService,
    {
      provide: AI_SERVICE,
      useFactory: (
        config: ConfigService,
        mock: MockAIService,
        openai: OpenAIService,
        ollama: OllamaAIService,
      ) => {
        const provider = resolveAiProvider(config);
        if (provider === 'openai') return openai;
        if (provider === 'ollama') return ollama;
        return mock;
      },
      inject: [ConfigService, MockAIService, OpenAIService, OllamaAIService],
    },
  ],
  exports: [AIJobsService, AiOrchestratorService, AiConfigService],
})
export class AiModule {}
