import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  MeetingSummaryOutput,
  ProjectBreakdownOutput,
  TaskRiskOutput,
  AssistantResponse,
  AssistantMessage,
} from '@work-pilot/shared';
import type { IAIService } from './ports/ai-service.port';
import { MockAIService } from './mock-ai.service';
import { readEnvSecret } from './read-env-secret';
import {
  SENIOR_PM_SYSTEM_PROMPT,
  buildAssistantChatUserPrompt,
  buildMeetingSummaryPrompt,
  buildProjectBreakdownPrompt,
  buildTaskRiskPrompt,
} from './ai-prompts';

@Injectable()
export class MistralAIService implements IAIService {
  private readonly logger = new Logger(MistralAIService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly mock: MockAIService,
  ) {}

  async summarizeMeeting(input: {
    title: string;
    description?: string | null;
    startTime?: string;
    endTime?: string;
  }): Promise<MeetingSummaryOutput> {
    return this.withFallback(
      () => this.mock.summarizeMeeting(input),
      buildMeetingSummaryPrompt(input),
    );
  }

  async breakdownProject(input: {
    name: string;
    description?: string | null;
  }): Promise<ProjectBreakdownOutput> {
    return this.withFallback(
      () => this.mock.breakdownProject(input),
      buildProjectBreakdownPrompt(input),
    );
  }

  async assessTaskRisk(input: {
    title: string;
    dueDate?: string | null;
    priority?: string | null;
  }): Promise<TaskRiskOutput> {
    return this.withFallback(
      () => this.mock.assessTaskRisk(input),
      buildTaskRiskPrompt(input),
    );
  }

  async chat(input: {
    message: string;
    history?: AssistantMessage[];
    workspaceName?: string;
  }): Promise<AssistantResponse> {
    try {
      const content = await this.requestCompletion(
        buildAssistantChatUserPrompt(input),
        true,
        input.history,
      );
      return JSON.parse(content) as AssistantResponse;
    } catch (err) {
      this.logger.warn(
        `Mistral indisponible, fallback mock: ${err instanceof Error ? err.message : err}`,
      );
      return this.mock.chat(input);
    }
  }

  private async withFallback<T>(
    fallback: () => Promise<T>,
    prompt: string,
    json = true,
  ): Promise<T> {
    try {
      const content = await this.requestCompletion(prompt, json);
      if (json) {
        return JSON.parse(content) as T;
      }
      try {
        return JSON.parse(content) as T;
      } catch {
        return { reply: content, suggestions: [] } as T;
      }
    } catch (err) {
      this.logger.warn(
        `Mistral indisponible, fallback mock: ${err instanceof Error ? err.message : err}`,
      );
      return fallback();
    }
  }

  private async requestCompletion(
    prompt: string,
    json: boolean,
    history?: AssistantMessage[],
  ): Promise<string> {
    const apiKey = readEnvSecret(this.config.get<string>('MISTRAL_API_KEY'));
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY manquant');
    }

    const model = this.config.get<string>('MISTRAL_MODEL', 'mistral-small-latest');
    const historyMessages = (history ?? []).slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SENIOR_PM_SYSTEM_PROMPT },
          ...historyMessages,
          { role: 'user', content: prompt },
        ],
        temperature: 0.35,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Mistral ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Réponse Mistral vide');
    return content;
  }
}
