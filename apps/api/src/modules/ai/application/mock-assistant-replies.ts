import type {
  AssistantMessage,
  AssistantResponse,
  RiskItem,
  UserStory,
} from '@work-pilot/shared';

function alreadyIntroduced(history?: AssistantMessage[]): boolean {
  return (history ?? []).some(
    (m) =>
      m.role === 'assistant' &&
      (m.content.includes('Project Manager') ||
        m.content.includes('PMP') ||
        m.content.includes('copilote')),
  );
}

function detectBillingIntent(msg: string): boolean {
  return msg.includes('factur') || msg.includes('billing') || msg.includes('devis');
}

function detectAppCreationIntent(msg: string): boolean {
  return (
    msg.includes('appli') ||
    msg.includes('application') ||
    msg.includes('logiciel') ||
    msg.includes('e-commerce') ||
    msg.includes('ecommerce') ||
    msg.includes('mvp') ||
    msg.includes('creation') ||
    msg.includes('creer') ||
    msg.includes('gestion')
  );
}

function detectFormatFeedback(msg: string): boolean {
  return (
    msg.includes('touffu') ||
    msg.includes('dense') ||
    msg.includes('reformule') ||
    msg.includes('simplif') ||
    msg.includes('lisible') ||
    msg.includes('aere')
  );
}

const BILLING_USER_STORIES: UserStory[] = [
  {
    id: 'US-01',
    title: 'Gestion des clients',
    asA: 'utilisateur métier',
    iWant: 'créer et maintenir une fiche client avec contacts et conditions de paiement',
    soThat: 'je centralise les informations avant toute facturation',
    acceptanceCriteria: [
      'Création client avec raison sociale, adresse et contact principal',
      'Modification et archivage sans perte d historique',
      'Conditions de paiement par défaut appliquées aux nouvelles factures',
    ],
    priority: 'HIGH',
  },
  {
    id: 'US-02',
    title: 'Émission de factures',
    asA: 'gestionnaire administratif',
    iWant: 'transformer un devis validé en facture numérotée avec lignes et TVA',
    soThat: 'je respecte les obligations légales et accélère la facturation',
    acceptanceCriteria: [
      'Numérotation séquentielle sans doublon',
      'Calcul automatique HT, TVA et TTC par ligne',
      'Export PDF avec mentions obligatoires',
    ],
    priority: 'HIGH',
  },
  {
    id: 'US-03',
    title: 'Suivi des paiements et relances',
    asA: 'responsable recouvrement',
    iWant: 'visualiser les factures impayées et déclencher des relances',
    soThat: 'je réduise le délai moyen de paiement',
    acceptanceCriteria: [
      'Statuts : brouillon, envoyée, payée, en retard',
      'Relance automatique configurable à J+7 et J+15',
      'Tableau de bord des encours par client',
    ],
    priority: 'MEDIUM',
  },
];

const BILLING_RISKS: RiskItem[] = [
  {
    id: 'R-01',
    description: 'Non-conformité numérotation et mentions légales',
    probability: 'MEDIUM',
    impact: 'HIGH',
    mitigation:
      'Valider le modèle de facture avec un expert-comptable avant le premier envoi client.',
  },
  {
    id: 'R-02',
    description: 'Complexité multi-TVA ou multi-devises non cadrée',
    probability: 'MEDIUM',
    impact: 'MEDIUM',
    mitigation: 'Limiter le MVP au périmètre France, mono-devise, puis itérer.',
  },
];

function buildBillingDocument(): AssistantResponse {
  const reply = [
    '1. SYNTHÈSE EXÉCUTIVE',
    '',
    'Ce document cadrage décrit le MVP d une application de facturation pour un lancement en 4 à 6 semaines. Le périmètre couvre clients, émission de factures, suivi des paiements et export comptable.',
    '',
    '2. PÉRIMÈTRE MVP',
    '',
    'Le lot initial inclut la gestion client, le cycle devis-facture, le suivi des statuts de paiement et l export PDF. Les intégrations bancaires et la comptabilité avancée sont hors périmètre de la première release.',
    '',
    '3. USER STORIES PRIORITAIRES',
    '',
    'US-01 — Gestion des clients',
    'En tant qu utilisateur métier, je veux créer et maintenir une fiche client afin de centraliser les informations avant toute facturation.',
    'Critères d acceptation : CA-1 création avec raison sociale et contact. CA-2 archivage sans perte d historique. CA-3 conditions de paiement par défaut.',
    '',
    'US-02 — Émission de factures',
    'En tant que gestionnaire administratif, je veux transformer un devis en facture numérotée afin de respecter les obligations légales.',
    'Critères d acceptation : CA-1 numérotation séquentielle. CA-2 calcul HT/TVA/TTC. CA-3 export PDF conforme.',
    '',
    'US-03 — Suivi des paiements',
    'En tant que responsable recouvrement, je veux visualiser les impayés et relancer afin de réduire le délai de paiement.',
    '',
    '4. ANALYSE DES RISQUES',
    '',
    'R-01 — Non-conformité légale. Probabilité moyenne, impact élevé. Mitigation : validation comptable du modèle de facture.',
    'R-02 — Multi-TVA non cadrée. Probabilité moyenne, impact moyen. Mitigation : MVP France mono-devise.',
    '',
    '5. PROCHAINES ÉTAPES',
    '',
    'Confirmer le segment cible (B2B ou B2C), le pays de facturation et l équipe disponible. Puis créer le projet dans WorkPilot et importer les user stories ci-dessous.',
  ].join('\n');

  return {
    reply,
    documentType: 'PROJECT_CHARTER',
    projectName: 'Application de facturation',
    executiveSummary:
      'MVP facturation en 4-6 semaines : clients, émission de factures, suivi paiements et export PDF.',
    userStories: BILLING_USER_STORIES,
    risks: BILLING_RISKS,
    suggestedTasks: BILLING_USER_STORIES.map((us) => ({
      title: `${us.id} — ${us.title}`,
      description: `En tant que ${us.asA}, je veux ${us.iWant}, afin de ${us.soThat}.`,
      priority: us.priority ?? 'MEDIUM',
    })),
    suggestions: ['Affiner les critères d acceptation', 'Analyser les risques conformité', 'Planifier le sprint 1'],
  };
}

function buildSimplifiedFromHistory(history?: AssistantMessage[]): AssistantResponse {
  const lastAssistant = [...(history ?? [])].reverse().find((m) => m.role === 'assistant');
  const topic = lastAssistant?.content.includes('facturation')
    ? 'Application de facturation'
    : 'Projet en cours';

  const reply = [
    '1. SYNTHÈSE EXÉCUTIVE',
    '',
    `Version simplifiée du document « ${topic} ». Chaque section est réduite à l essentiel pour faciliter la lecture et l export.`,
    '',
    '2. USER STORIES (3 priorités)',
    '',
    'US-01 — Gestion clients : créer et maintenir les fiches clients.',
    'US-02 — Facturation : émettre des factures numérotées conformes.',
    'US-03 — Recouvrement : suivre les impayés et relancer.',
    '',
    '3. RISQUE PRINCIPAL',
    '',
    'R-01 — Conformité légale des factures. Mitigation : validation comptable avant envoi.',
    '',
    '4. DÉCISION ATTENDUE',
    '',
    'Validez ce périmètre MVP ou indiquez une fonctionnalité à ajouter ou retirer.',
  ].join('\n');

  return {
    reply,
    documentType: 'USER_STORIES',
    projectName: topic,
    executiveSummary: 'Version allégée du cadrage projet, prête à exporter.',
    userStories: BILLING_USER_STORIES,
    suggestedTasks: BILLING_USER_STORIES.map((us) => ({
      title: `${us.id} — ${us.title}`,
      description: us.acceptanceCriteria.join(' '),
      priority: us.priority ?? 'MEDIUM',
    })),
    suggestions: ['Exporter vers un projet', 'Détailler US-02', 'Ajouter une analyse de risques'],
  };
}

export function buildConcreteAssistantReply(input: {
  message: string;
  history?: AssistantMessage[];
  workspaceName?: string;
}): AssistantResponse {
  const msg = input.message.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  const ws = input.workspaceName ?? 'votre workspace';
  const introduced = alreadyIntroduced(input.history);

  if (detectFormatFeedback(msg)) {
    return buildSimplifiedFromHistory(input.history);
  }

  if (msg.includes('role') || msg.includes('qui es-tu') || msg.includes('ton role')) {
    return {
      reply: [
        '1. RÔLE',
        '',
        `Project Manager certifié PMP et praticien Agile au sein de WorkPilot pour ${ws}.`,
        '',
        '2. LIVRABLES PRODUITS',
        '',
        'User Stories avec critères d acceptation, analyses de risques, rapports de statut et chartes de projet. Aucun code informatique.',
        '',
        '3. PROCHAINE ÉTAPE',
        '',
        'Décrivez votre initiative (objectif, délai, contraintes) pour recevoir un document exportable.',
      ].join('\n'),
      documentType: 'STATUS_REPORT',
      suggestions: ['Cadrage application de facturation', 'User stories MVP', 'Analyse des risques'],
    };
  }

  if (detectBillingIntent(msg) || (detectAppCreationIntent(msg) && msg.includes('factur'))) {
    return buildBillingDocument();
  }

  if (detectAppCreationIntent(msg)) {
    return {
      reply: [
        '1. SYNTHÈSE EXÉCUTIVE',
        '',
        'Document de cadrage pour le lancement d une application. Approche Agile en 2 à 4 sprints avec MVP centré sur la valeur utilisateur.',
        '',
        '2. PHASE DE CADRAGE (3 jours)',
        '',
        'Formaliser le problème utilisateur, définir 3 fonctionnalités Must en MoSCoW et valider contraintes délai, budget et équipe.',
        '',
        '3. USER STORIES INITIALES',
        '',
        'US-01 — Discovery : en tant que PM, je veux valider le persona et le parcours cœur afin de sécuriser le périmètre MVP.',
        'US-02 — Backlog : en tant qu équipe, je veux un backlog priorisé de 10 à 15 stories afin de planifier le sprint 1.',
        'US-03 — Pilote : en tant que sponsor, je veux un prototype testable par 3 à 5 utilisateurs afin de valider la proposition de valeur.',
        '',
        '4. JALONS',
        '',
        'J1 fin de semaine 1 : backlog validé. J2 fin de sprint 2 : parcours cœur fonctionnel. J3 fin de sprint 3 : pilote utilisateur.',
        '',
        '5. PROCHAINE ÉTAPE',
        '',
        'Précisez le domaine métier (ex. facturation, RH, e-commerce) pour recevoir des user stories détaillées.',
      ].join('\n'),
      documentType: 'PROJECT_CHARTER',
      projectName: 'Nouvelle application',
      executiveSummary: 'Cadrage Agile pour lancement application avec MVP en 2-4 sprints.',
      userStories: [
        {
          id: 'US-01',
          title: 'Discovery et cadrage',
          asA: 'chef de projet',
          iWant: 'valider persona et parcours cœur',
          soThat: 'le périmètre MVP soit sécurisé',
          acceptanceCriteria: ['Persona documenté', 'Parcours cœur validé en atelier', 'MoSCoW signé'],
          priority: 'HIGH',
        },
        {
          id: 'US-02',
          title: 'Backlog priorisé',
          asA: 'Product Owner',
          iWant: 'un backlog de 10-15 user stories',
          soThat: 'le sprint 1 soit planifiable',
          acceptanceCriteria: ['Stories estimées', 'Priorités Must/Should définies', 'Dépendances identifiées'],
          priority: 'HIGH',
        },
      ],
      suggestedTasks: [
        { title: 'US-01 — Discovery et cadrage', priority: 'HIGH' },
        { title: 'US-02 — Backlog priorisé', priority: 'HIGH' },
        { title: 'Atelier MVP avec stakeholders', priority: 'MEDIUM' },
      ],
      suggestions: ['Application de facturation', 'Critères d acceptation détaillés', 'Analyse des risques'],
    };
  }

  const topic = input.message.trim();
  if (introduced) {
    return {
      reply: [
        '1. ANALYSE',
        '',
        `Demande reçue : « ${topic} ». Voici un premier plan actionnable.`,
        '',
        '2. RECOMMANDATION',
        '',
        'Formaliser l\'objectif mesurable, identifier 3 à 5 livrables intermédiaires et assigner un responsable par livrable avant de lancer l\'exécution.',
        '',
        '3. PROCHAINE ÉTAPE',
        '',
        'Indiquez le délai cible et la taille d\'équipe pour affiner les besoins et le plan de delivery.',
      ].join('\n'),
      documentType: 'STATUS_REPORT',
      suggestions: ['User stories MVP', 'Analyse des risques', 'Exporter vers un projet'],
    };
  }

  return {
    reply: [
      '1. ACCUEIL',
      '',
      `Project Manager PMP/Agile — workspace ${ws}.`,
      '',
      '2. VOTRE DEMANDE',
      '',
      `Sujet : « ${topic} ».`,
      '',
      '3. PROCHAINE ÉTAPE',
      '',
      'Précisez l objectif métier, l échéance et les contraintes principales. Je produirai un document structuré (user stories, risques ou rapport de statut) exportable vers WorkPilot.',
    ].join('\n'),
    documentType: 'STATUS_REPORT',
    suggestions: ['Application de facturation', 'User stories MVP', 'Analyse des risques'],
  };
}
