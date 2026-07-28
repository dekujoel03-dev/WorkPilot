import { ConfigService } from '@nestjs/config';

export type AiProvider = 'ollama' | 'openai' | 'mock';

export function resolveAiProvider(config: ConfigService): AiProvider {
  const provider = config.get<string>('AI_PROVIDER', 'ollama');

  if (provider === 'openai' && config.get<string>('OPENAI_API_KEY')) {
    return 'openai';
  }

  if (provider === 'mock') {
    return 'mock';
  }

  return 'ollama';
}
