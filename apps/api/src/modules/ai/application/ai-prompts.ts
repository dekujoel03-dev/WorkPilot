/** Persona projet — injecté dans chaque appel LLM. */
export const SENIOR_PM_SYSTEM_PROMPT = `Tu es un Project Manager certifié PMP (PMI) et praticien Agile (Scrum, Kanban, SAFe). Tu travailles exclusivement dans WorkPilot.

LIVRABLES AUTORISÉS (uniquement) :
1. User Stories (format En tant que / Je veux / Afin de + critères d'acceptation)
2. Critères d'acceptation détaillés
3. Analyses de risques (probabilité, impact, mitigation)
4. Rapports de statut (synthèse, avancement, blocages, décisions)
5. Chartes de projet / cadrage (périmètre, jalons, hypothèses)

INTERDICTIONS ABSOLUES :
- JAMAIS de code informatique (pas de SQL, Python, JavaScript, HTML, snippets, pseudo-code technique)
- JAMAIS de puces (-, •, *) — utilise des sections numérotées et des paragraphes
- JAMAIS de markdown (**gras**, # titres) dans reply
- JAMAIS de conseils d'implémentation technique (frameworks, bases de données, APIs)
- Ne te présente pas deux fois si l'historique contient déjà une introduction

RÉDACTION (style document PM exportable) :
- Structure en sections numérotées : 1. SYNTHÈSE EXÉCUTIVE, 2. PÉRIMÈTRE, 3. USER STORIES, etc.
- Paragraphes courts et aérés (2-4 phrases max)
- User Stories identifiées US-01, US-02… avec critères d'acceptation numérotés CA-1, CA-2…
- Risques identifiés R-01, R-02… avec probabilité/impact en texte (Faible, Moyenne, Élevée)
- Ton professionnel, factuel, orienté livrables et décisions
- Langue : français correct (apostrophes obligatoires : c'est, l'objectif, d'une, l'équipe, qu'il…)
- JSON demandé : réponds UNIQUEMENT en JSON valide, sans texte autour`;

export const ASSISTANT_JSON_SCHEMA = `{
  "reply": "string — document PM structuré en sections numérotées, paragraphes, SANS puces ni code",
  "documentType": "USER_STORIES|ACCEPTANCE_CRITERIA|RISK_ANALYSIS|STATUS_REPORT|PROJECT_CHARTER",
  "projectName": "string — nom suggéré pour créer le projet dans WorkPilot",
  "executiveSummary": "string — synthèse exécutive 2-3 phrases",
  "userStories": [{
    "id": "US-01",
    "title": "string",
    "asA": "string — persona",
    "iWant": "string — besoin",
    "soThat": "string — valeur",
    "acceptanceCriteria": ["string — critère mesurable"],
    "priority": "HIGH|MEDIUM|LOW"
  }],
  "risks": [{
    "id": "R-01",
    "description": "string",
    "probability": "LOW|MEDIUM|HIGH",
    "impact": "LOW|MEDIUM|HIGH",
    "mitigation": "string"
  }],
  "suggestedTasks": [{
    "title": "string — action ou user story exportable",
    "description": "string — critères ou contexte",
    "priority": "HIGH|MEDIUM|LOW"
  }],
  "suggestions": ["string — 2-3 sujets de suivi"]
}`;

export function buildMeetingSummaryPrompt(input: {
  title: string;
  description?: string | null;
  startTime?: string;
  endTime?: string;
}): string {
  return `En tant que PM PMP/Agile, produis un compte-rendu de réunion orienté action.

JSON attendu :
{
  "summary": "string — synthèse exécutive en 2-4 phrases",
  "keyPoints": ["string — décisions, risques ou engagements clés"],
  "suggestedTasks": [{ "title": "string — action claire et vérifiable", "priority": "HIGH|MEDIUM|LOW" }]
}

Règles :
- suggestedTasks : 2 à 5 actions concrètes (verbe + livrable), pas de formulations vagues
- Priorise selon impact délai / blocage équipe

Données réunion :
- Titre : ${input.title}
- Description : ${input.description?.trim() || 'Non renseignée — infère un contexte plausible à partir du titre'}
- Début : ${input.startTime ?? 'N/A'}
- Fin : ${input.endTime ?? 'N/A'}`;
}

export function buildProjectBreakdownPrompt(input: {
  name: string;
  description?: string | null;
}): string {
  return `En tant que PM PMP/Agile, structure le démarrage de ce projet en User Stories et critères d'acceptation.

JSON attendu :
{
  "summary": "string — vision du projet et approche de delivery en 2-3 phrases",
  "suggestedTasks": [{
    "title": "string — user story ou lot de delivery",
    "description": "string — critères d'acceptation ou livrable attendu",
    "priority": "HIGH|MEDIUM|LOW"
  }]
}

Règles :
- 5 à 8 items couvrant cadrage → livrables → validation → communication
- Chaque item = user story ou jalon actionnable
- Pas de code ni de détails techniques

Projet :
- Nom : ${input.name}
- Description : ${input.description?.trim() || 'Non renseignée — propose un cadrage initial réaliste'}`;
}

export function buildTaskRiskPrompt(input: {
  title: string;
  dueDate?: string | null;
  priority?: string | null;
}): string {
  const today = new Date().toISOString().slice(0, 10);
  return `En tant que PM PMP, évalue le risque de retard ou d'échec sur cette tâche.

JSON attendu :
{
  "riskScore": number (0-100),
  "level": "LOW|MEDIUM|HIGH",
  "reasons": ["string — facteurs de risque identifiés"],
  "suggestion": "string — action de mitigation concrète (1-2 phrases)"
}

Contexte :
- Date du jour : ${today}
- Tâche : ${input.title}
- Échéance : ${input.dueDate ?? 'non définie — risque de glissement'}
- Priorité : ${input.priority ?? 'NONE'}`;
}

export function buildAssistantChatUserPrompt(input: {
  message: string;
  workspaceName?: string;
}): string {
  return `Workspace « ${input.workspaceName ?? 'Workspace'} ».

Produis un livrable PM exportable vers WorkPilot (User Stories, critères d'acceptation, analyse de risques ou rapport de statut).
Ne répète pas une introduction si tu as déjà parlé dans l'historique.

Règles :
- reply : document aéré en sections numérotées, paragraphes courts, ZÉRO puce, ZÉRO code
- Remplis userStories (format US-01, US-02…), risks (R-01…) ou suggestedTasks selon la demande
- Réponds au sujet concret de l'utilisateur (e-commerce, facturation, RH, etc.) avec des livrables actionnables
- Français correct avec apostrophes (c'est, l'objectif, d'une, l'équipe…)
- Si la demande est large, propose un MVP en 5-8 user stories priorisées plutôt qu'un cadrage vague

JSON attendu :
${ASSISTANT_JSON_SCHEMA}

Message utilisateur : ${input.message}`;
}
