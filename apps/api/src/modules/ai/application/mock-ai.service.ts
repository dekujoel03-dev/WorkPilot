import { Injectable } from '@nestjs/common';
import type {
  MeetingSummaryOutput,
  ProjectBreakdownOutput,
  TaskRiskOutput,
  AssistantResponse,
  AssistantMessage,
} from '@work-pilot/shared';
import type { IAIService } from './ports/ai-service.port';
import { buildConcreteAssistantReply } from './mock-assistant-replies';

@Injectable()
export class MockAIService implements IAIService {
  async summarizeMeeting(input: {
    title: string;
    description?: string | null;
    startTime?: string;
    endTime?: string;
  }): Promise<MeetingSummaryOutput> {
    const desc = input.description?.trim();
    return {
      summary: `Résumé simulé de « ${input.title} ». ${desc ? `Points discutés : ${desc.slice(0, 120)}.` : 'Réunion productive avec décisions clés identifiées.'}`,
      keyPoints: [
        'Objectifs de la réunion confirmés',
        'Prochaines étapes assignées',
        desc ? 'Contexte documenté dans la description' : 'Suivi planifié',
      ],
      suggestedTasks: [
        { title: `Suivi — ${input.title}`, priority: 'MEDIUM' },
        { title: "Envoyer le compte-rendu à l'équipe", priority: 'LOW' },
      ],
    };
  }

  async breakdownProject(input: {
    name: string;
    description?: string | null;
  }): Promise<ProjectBreakdownOutput> {
    const base = input.name.trim();
    return {
      summary: `Plan de démarrage généré pour « ${base} » avec 5 tâches initiales.`,
      suggestedTasks: [
        {
          title: `Définir le périmètre — ${base}`,
          priority: 'HIGH',
          description: 'Clarifier objectifs et livrables',
        },
        { title: 'Identifier les parties prenantes', priority: 'MEDIUM' },
        { title: 'Créer la roadmap v1', priority: 'HIGH' },
        { title: "Configurer l'environnement / outils", priority: 'MEDIUM' },
        {
          title: "Première revue d'avancement",
          priority: 'LOW',
          description: 'Point équipe après setup',
        },
      ],
    };
  }

  async assessTaskRisk(input: {
    title: string;
    dueDate?: string | null;
    priority?: string | null;
  }): Promise<TaskRiskOutput> {
    const overdue = input.dueDate && new Date(input.dueDate) < new Date();
    const highPriority =
      input.priority === 'HIGH' || input.priority === 'URGENT';
    let score = 20;
    const reasons: string[] = [];

    if (overdue) {
      score += 50;
      reasons.push('Échéance dépassée');
    }
    if (highPriority) {
      score += 20;
      reasons.push('Priorité élevée');
    }
    if (!input.dueDate) {
      score += 10;
      reasons.push('Aucune date limite définie');
    }

    score = Math.min(100, score);
    const level = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';

    return {
      riskScore: score,
      level,
      reasons: reasons.length ? reasons : ['Charge normale estimée'],
      suggestion:
        level === 'HIGH'
          ? `Prioriser « ${input.title} » ou décaler avec l'équipe.`
          : 'Continuer le suivi habituel.',
    };
  }

  async chat(input: {
    message: string;
    history?: AssistantMessage[];
    workspaceName?: string;
  }): Promise<AssistantResponse> {
    return buildConcreteAssistantReply(input);
  }
}
