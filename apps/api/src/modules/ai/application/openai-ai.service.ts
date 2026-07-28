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
import { SENIOR_PM_SYSTEM_PROMPT, buildAssistantChatUserPrompt } from './ai-prompts';

@Injectable()
export class OpenAIService implements IAIService {
  private readonly logger = new Logger(OpenAIService.name);

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
      `Résume cette réunion en JSON avec les clés: summary (string), keyPoints (string[]), suggestedTasks (array de {title, priority?}).
Titre: ${input.title}
Description: ${input.description ?? 'N/A'}
Début: ${input.startTime ?? 'N/A'}
Fin: ${input.endTime ?? 'N/A'}`,
    );
  }

  async breakdownProject(input: {
    name: string;
    description?: string | null;
  }): Promise<ProjectBreakdownOutput> {
    return this.withFallback(
      () => this.mock.breakdownProject(input),
      `Découpe ce projet en tâches initiales. JSON: summary (string), suggestedTasks (array de {title, description?, priority?}).
Projet: ${input.name}
Description: ${input.description ?? 'N/A'}
Réponds en français.`,
    );
  }

  async assessTaskRisk(input: {
    title: string;
    dueDate?: string | null;
    priority?: string | null;
  }): Promise<TaskRiskOutput> {
    return this.withFallback(
      () => this.mock.assessTaskRisk(input),
      `Analyse le risque de retard. JSON: riskScore (0-100), level (LOW|MEDIUM|HIGH), reasons (string[]), suggestion (string).
Tâche: ${input.title}
Échéance: ${input.dueDate ?? 'non définie'}
Priorité: ${input.priority ?? 'NONE'}`,
    );
  }

  async chat(input: {
    message: string;
    history?: AssistantMessage[];
    workspaceName?: string;
  }): Promise<AssistantResponse> {
    return this.withFallback(
      () => this.mock.chat(input),
      buildAssistantChatUserPrompt(input),
      true,
    );
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
      return { reply: content, suggestions: [] } as T;
    } catch (err) {
      this.logger.warn(
        `OpenAI indisponible, fallback mock: ${err instanceof Error ? err.message : err}`,
      );
      return fallback();
    }
  }

  private async requestCompletion(prompt: string, json: boolean): Promise<string> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY manquant');
    }

    const model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: SENIOR_PM_SYSTEM_PROMPT,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Réponse OpenAI vide');
    return content;
  }
}
