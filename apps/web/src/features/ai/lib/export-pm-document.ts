import type { AssistantResponse, CreateTaskInput, UserStory } from '@work-pilot/shared';

export function formatUserStoryDescription(us: UserStory): string {
  return [
    `En tant que ${us.asA}, je veux ${us.iWant}, afin de ${us.soThat}.`,
    '',
    "Critères d'acceptation :",
    ...us.acceptanceCriteria.map((ca, i) => `${i + 1}. ${ca}`),
  ].join('\n');
}

/** Convertit un document PM en tâches WorkPilot (User Stories prioritaires). */
export function buildTasksFromPmDocument(doc: AssistantResponse): CreateTaskInput[] {
  if (doc.userStories?.length) {
    return doc.userStories.map((us) => ({
      title: `${us.id} — ${us.title}`,
      description: formatUserStoryDescription(us),
      priority: us.priority ?? 'MEDIUM',
    }));
  }

  if (doc.suggestedTasks?.length) {
    return doc.suggestedTasks.map((task) => ({
      title: task.title,
      description: task.description,
      priority: task.priority ?? 'MEDIUM',
    }));
  }

  return [];
}

export function buildProjectDescription(doc: AssistantResponse): string {
  const parts: string[] = [];

  if (doc.executiveSummary) {
    parts.push(doc.executiveSummary);
  }

  if (doc.risks?.length) {
    parts.push('');
    parts.push('Registre des risques (référence PM) :');
    for (const risk of doc.risks) {
      parts.push(
        `${risk.id} — ${risk.description} (P: ${risk.probability}, I: ${risk.impact}). Mitigation : ${risk.mitigation}`,
      );
    }
  }

  if (parts.length === 0) {
    return doc.reply.slice(0, 2000);
  }

  return parts.join('\n').slice(0, 4000);
}
