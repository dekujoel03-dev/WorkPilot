import { ConfigService } from '@nestjs/config';
import { readEnvSecret } from './read-env-secret';

export type AiProvider = 'mistral' | 'ollama' | 'openai' | 'mock';

export function resolveAiProvider(config: ConfigService): AiProvider {
  const provider = config.get<string>('AI_PROVIDER', 'mistral');

  if (provider === 'openai' && readEnvSecret(config.get<string>('OPENAI_API_KEY'))) {
    return 'openai';
  }

  if (provider === 'mistral' && readEnvSecret(config.get<string>('MISTRAL_API_KEY'))) {
    return 'mistral';
  }

  if (provider === 'ollama') {
    return 'ollama';
  }

  if (provider === 'mock') {
    return 'mock';
  }

  if (readEnvSecret(config.get<string>('MISTRAL_API_KEY'))) {
    return 'mistral';
  }

  return 'mock';
}
