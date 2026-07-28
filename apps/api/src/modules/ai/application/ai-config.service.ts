import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolveAiProvider } from './resolve-ai-provider';

@Injectable()
export class AiConfigService {
  constructor(private readonly config: ConfigService) {}

  getStatus() {
    const provider = resolveAiProvider(this.config);

    if (provider === 'openai') {
      const model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
      return {
        data: {
          provider,
          model,
          available: true,
          label: `OpenAI (${model})`,
        },
      };
    }

    if (provider === 'ollama') {
      const model = this.config.get<string>('OLLAMA_MODEL', 'llama3.2');
      return {
        data: {
          provider,
          model,
          available: true,
          label: `PM certifié PMP/Agile · Ollama (${model})`,
        },
      };
    }

    return {
      data: {
        provider,
        model: null,
        available: true,
        label: 'Mode démo (mock)',
      },
    };
  }
}
