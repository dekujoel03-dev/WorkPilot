/**
 * Seed complet WorkPilot — users, workspace, projets, tâches, collaboration, IA…
 *
 * Usage: pnpm db:seed  (ou pnpm db:demo pour setup + seed)
 * Mot de passe des comptes démo: Test1234!
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'Test1234!';

const DEMO_USERS = [
  { email: 'admin@workpilot.test', firstName: 'Alice', lastName: 'Admin', role: 'ADMIN' },
  { email: 'member@workpilot.test', firstName: 'Marc', lastName: 'Member', role: 'MEMBER' },
  { email: 'guest@workpilot.test', firstName: 'Léa', lastName: 'Guest', role: 'GUEST' },
];

const PROJECTS = [
  {
    name: 'Refonte site web',
    description: 'Modernisation du site vitrine et tunnel de conversion',
    color: '#6366F1',
    health: 'ON_TRACK',
    archived: false,
  },
  {
    name: 'Application mobile',
    description: 'MVP iOS/Android pour les clients premium',
    color: '#22C55E',
    health: 'AT_RISK',
    archived: false,
  },
  {
    name: 'Campagne marketing Q3',
    description: 'Lancement produit, contenus et campagnes paid',
    color: '#F59E0B',
    health: 'ON_TRACK',
    archived: false,
  },
  {
    name: 'Migration infrastructure',
    description: 'Passage PostgreSQL + CI/CD automatisé',
    color: '#EF4444',
    health: 'OFF_TRACK',
    archived: false,
  },
  {
    name: 'Onboarding clients',
    description: 'Parcours d\'accueil et documentation self-service',
    color: '#8B5CF6',
    health: 'ON_TRACK',
    archived: false,
  },
  {
    name: 'Projet archivé — Sprint 0',
    description: 'Ancien projet clôturé pour tests archivage',
    color: '#71717A',
    health: 'ON_TRACK',
    archived: true,
  },
];

const DEFAULT_LISTS = ['À faire', 'En cours', 'Terminé'];

const TAGS = [
  { name: 'urgent', color: '#EF4444' },
  { name: 'design', color: '#8B5CF6' },
  { name: 'backend', color: '#6366F1' },
];

const LABELS = [
  { name: 'v1.0', color: '#22C55E' },
  { name: 'bug', color: '#F59E0B' },
  { name: 'client', color: '#3B82F6' },
];

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function ensureUser({ email, firstName, lastName }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  let authProviderId = null;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const admin = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: DEMO_PASSWORD,
        email_confirm: true,
      });
      if (error && !error.message.toLowerCase().includes('already')) {
        console.warn(`Supabase user ${email}:`, error.message);
      } else {
        authProviderId = data.user?.id ?? null;
        if (!authProviderId) {
          const { data: listData } = await admin.auth.admin.listUsers();
          authProviderId =
            listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ??
            null;
        }
      }
    } catch (err) {
      console.warn('Supabase seed skipped:', err.message);
    }
  }

  return prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      authProviderId,
      passwordHash: authProviderId ? null : await hashPassword(DEMO_PASSWORD),
      emailVerified: true,
    },
  });
}

async function ensureWorkspaceMember(workspaceId, userId, role) {
  return prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId, userId } },
    create: { workspaceId, userId, role },
    update: { role },
  });
}

async function recalcProgress(projectId) {
  const lists = await prisma.projectList.findMany({
    where: { projectId },
    orderBy: { position: 'asc' },
    select: { id: true },
  });
  const lastListId = lists.at(-1)?.id;
  const [total, done] = await Promise.all([
    prisma.task.count({ where: { projectId, parentId: null } }),
    prisma.task.count({
      where: {
        projectId,
        parentId: null,
        OR: [
          { status: { isDone: true } },
          ...(lastListId ? [{ listId: lastListId }] : []),
        ],
      },
    }),
  ]);
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  await prisma.project.update({ where: { id: projectId }, data: { progress } });
  return progress;
}

async function enrichProject(project, { workspaceId, ownerId, admin, member, guest, tags, labels, statuses }) {
  const tasks = await prisma.task.findMany({
    where: { projectId: project.id, parentId: null },
    orderBy: { position: 'asc' },
  });
  if (tasks.length === 0) return false;

  const commentCount = await prisma.comment.count({
    where: { taskId: { in: tasks.map((t) => t.id) } },
  });
  if (commentCount > 0) return false;

  if (!project.archived) {
    let sprint = await prisma.sprint.findFirst({ where: { projectId: project.id } });
    if (!sprint) {
      sprint = await prisma.sprint.create({
        data: {
          projectId: project.id,
          name: 'Sprint 1',
          goal: 'Livrer le MVP',
          startDate: daysFromNow(-7),
          endDate: daysFromNow(7),
          status: 'ACTIVE',
        },
      });
    }
    if (sprint && tasks[1] && !tasks[1].sprintId) {
      await prisma.task.update({ where: { id: tasks[1].id }, data: { sprintId: sprint.id } });
    }
  }

  if (tasks[0] && member) {
    await prisma.taskAssignee.upsert({
      where: { taskId_userId: { taskId: tasks[0].id, userId: member.id } },
      create: { taskId: tasks[0].id, userId: member.id },
      update: {},
    });
    await prisma.taskWatcher.upsert({
      where: { taskId_userId: { taskId: tasks[0].id, userId: ownerId } },
      create: { taskId: tasks[0].id, userId: ownerId },
      update: {},
    });
  }

  if (tasks[2]) {
    const existingChecklist = await prisma.checklistItem.count({ where: { taskId: tasks[2].id } });
    if (existingChecklist === 0) {
      const checklistItems = [
        { title: 'Valider wireframes', completed: false },
        { title: 'Review design system', completed: true },
        { title: 'Export assets', completed: false },
      ];
      for (const [pos, item] of checklistItems.entries()) {
        await prisma.checklistItem.create({
          data: { taskId: tasks[2].id, title: item.title, completed: item.completed, position: pos },
        });
      }
    }
  }

  if (tasks[0]) {
    await prisma.taskTag.upsert({
      where: { taskId_tagId: { taskId: tasks[0].id, tagId: tags[0].id } },
      create: { taskId: tasks[0].id, tagId: tags[0].id },
      update: {},
    });
    await prisma.taskLabel.upsert({
      where: { taskId_labelId: { taskId: tasks[0].id, labelId: labels[0].id } },
      create: { taskId: tasks[0].id, labelId: labels[0].id },
      update: {},
    });
  }

  if (tasks[1]) {
    await prisma.comment.createMany({
      data: [
        {
          taskId: tasks[1].id,
          userId: admin.id,
          content: 'Specs validées côté produit. On peut avancer sur le dev.',
        },
        {
          taskId: tasks[1].id,
          userId: member.id,
          content: 'J\'ai une question sur l\'API auth — on en parle en standup ?',
        },
      ],
    });
  }

  const docExists = await prisma.document.findFirst({ where: { projectId: project.id } });
  if (!docExists) {
    await prisma.document.create({
      data: {
        projectId: project.id,
        title: 'Cahier des charges',
        content: {
          type: 'doc',
          blocks: [{ type: 'paragraph', text: `Documentation de démo pour ${project.name}` }],
        },
      },
    });
  }

  await prisma.activity.createMany({
    data: [
      {
        workspaceId,
        userId: ownerId,
        entityType: 'PROJECT',
        entityId: project.id,
        action: 'CREATED',
        metadata: { name: project.name },
      },
      {
        workspaceId,
        userId: admin.id,
        entityType: 'TASK',
        entityId: tasks[0].id,
        action: 'ASSIGNED',
        metadata: { assignee: member.email },
      },
    ],
  });

  // Priorités & échéances sur tâches existantes basiques
  const priorities = ['HIGH', 'MEDIUM', 'HIGH', 'MEDIUM', 'LOW', 'NONE'];
  const dueDaysList = [2, 5, -1, 3, 7, null];
  for (let i = 0; i < Math.min(tasks.length, priorities.length); i++) {
    await prisma.task.update({
      where: { id: tasks[i].id },
      data: {
        priority: priorities[i],
        dueDate: dueDaysList[i] != null ? daysFromNow(dueDaysList[i]) : null,
        description: tasks[i].description ?? `Tâche de démo pour ${project.name}`,
        estimatedTime: 60 + i * 30,
      },
    });
  }

  await recalcProgress(project.id);
  return true;
}

async function ensureDemoWorkspace() {
  const existing = await prisma.workspaceMember.findFirst({
    where: { role: 'OWNER' },
    include: { workspace: true, user: true },
    orderBy: { joinedAt: 'asc' },
  });
  if (existing) return existing;

  const owner = await ensureUser({
    email: 'admin@workpilot.test',
    firstName: 'Alice',
    lastName: 'Admin',
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: 'WorkPilot Demo',
      slug: 'workpilot-demo',
      members: { create: { userId: owner.id, role: 'OWNER' } },
      statuses: {
        createMany: {
          data: [
            { name: 'À faire', color: '#71717A', position: 0, isDone: false },
            { name: 'En cours', color: '#6366F1', position: 1, isDone: false },
            { name: 'Terminé', color: '#22C55E', position: 2, isDone: true },
          ],
        },
      },
    },
  });

  await prisma.reminderPreference.upsert({
    where: { userId: owner.id },
    create: { userId: owner.id, dailyBriefTime: '08:00', maxDailyHours: 8 },
    update: {},
  });

  console.log('🏢 Workspace démo créé: WorkPilot Demo');

  return prisma.workspaceMember.findFirstOrThrow({
    where: { workspaceId: workspace.id, userId: owner.id },
    include: { workspace: true, user: true },
  });
}

async function main() {
  const ownerMember = await ensureDemoWorkspace();

  const { workspaceId, userId: ownerId, workspace, user: owner } = ownerMember;
  console.log(`\n🌱 Seed complet — ${workspace.name}`);
  console.log(`   Owner: ${owner.email}\n`);

  // ─── Utilisateurs & membres ─────────────────────────────────────────────
  const demoUsers = [{ email: owner.email, firstName: owner.firstName, lastName: owner.lastName, role: 'OWNER', id: ownerId }];

  for (const spec of DEMO_USERS) {
    const u = await ensureUser(spec);
    if (u.id === ownerId) {
      await ensureWorkspaceMember(workspaceId, u.id, 'OWNER');
      continue;
    }
    await ensureWorkspaceMember(workspaceId, u.id, spec.role);
    demoUsers.push({ ...spec, id: u.id });
    console.log(`👤 ${spec.role.padEnd(6)} ${spec.email}`);
  }

  if (ownerId) {
    console.log(`👤 ${'OWNER'.padEnd(6)} ${owner.email}`);
  }

  const admin = demoUsers.find((u) => u.role === 'ADMIN') ?? demoUsers.find((u) => u.role === 'OWNER');
  const member = demoUsers.find((u) => u.role === 'MEMBER');
  const guest = demoUsers.find((u) => u.role === 'GUEST');

  await prisma.reminderPreference.upsert({
    where: { userId: ownerId },
    create: { userId: ownerId, dailyBriefTime: '08:00', maxDailyHours: 8 },
    update: {},
  });

  // ─── Statuts ────────────────────────────────────────────────────────────
  let statuses = await prisma.taskStatus.findMany({
    where: { workspaceId },
    orderBy: { position: 'asc' },
  });
  if (statuses.length === 0) {
    statuses = await Promise.all(
      [
        { name: 'À faire', color: '#71717A', position: 0, isDone: false },
        { name: 'En cours', color: '#6366F1', position: 1, isDone: false },
        { name: 'Terminé', color: '#22C55E', position: 2, isDone: true },
      ].map((s) => prisma.taskStatus.create({ data: { workspaceId, ...s } })),
    );
  }

  // ─── Tags & labels ───────────────────────────────────────────────────────
  const tags = [];
  for (const t of TAGS) {
    const tag = await prisma.tag.upsert({
      where: { workspaceId_name: { workspaceId, name: t.name } },
      create: { workspaceId, ...t },
      update: { color: t.color },
    });
    tags.push(tag);
  }

  const labels = [];
  for (const l of LABELS) {
    const label = await prisma.label.upsert({
      where: { workspaceId_name: { workspaceId, name: l.name } },
      create: { workspaceId, ...l },
      update: { color: l.color },
    });
    labels.push(label);
  }
  console.log(`🏷  ${tags.length} tags, ${labels.length} labels`);

  // ─── Équipe ─────────────────────────────────────────────────────────────
  let team = await prisma.team.findFirst({ where: { workspaceId, name: 'Équipe Produit' } });
  if (!team) {
    team = await prisma.team.create({
      data: {
        workspaceId,
        name: 'Équipe Produit',
        description: 'Design, dev et marketing',
        color: '#6366F1',
      },
    });
  }
  for (const u of [ownerId, admin.id, member.id]) {
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: team.id, userId: u } },
      create: { teamId: team.id, userId: u },
      update: {},
    });
  }
  console.log(`👥 Équipe: ${team.name}`);

  // ─── Webhook démo ───────────────────────────────────────────────────────
  const webhookUrl = 'https://webhook.site/demo-work-pilot';
  const existingHook = await prisma.webhook.findFirst({
    where: { workspaceId, url: webhookUrl },
  });
  if (!existingHook) {
    await prisma.webhook.create({
      data: {
        workspaceId,
        url: webhookUrl,
        secret: randomBytes(24).toString('hex'),
        events: 'project.created,task.updated',
        active: false,
      },
    });
    console.log('🔗 Webhook démo (inactif)');
  }

  // ─── Invitation en attente ──────────────────────────────────────────────
  const pendingEmail = 'nouveau.collegue@workpilot.test';
  const existingInvite = await prisma.workspaceInvite.findFirst({
    where: { workspaceId, email: pendingEmail, acceptedAt: null },
  });
  if (!existingInvite) {
    await prisma.workspaceInvite.create({
      data: {
        workspaceId,
        email: pendingEmail,
        role: 'MEMBER',
        token: randomBytes(32).toString('hex'),
        invitedById: ownerId,
        expiresAt: daysFromNow(14),
      },
    });
    console.log(`✉️  Invitation pending: ${pendingEmail}`);
  }

  // ─── Projets ────────────────────────────────────────────────────────────
  const sampleTasks = [
    { title: 'Définir le périmètre', listIdx: 0, priority: 'HIGH', dueDays: 2 },
    { title: 'Rédiger les specs', listIdx: 0, priority: 'MEDIUM', dueDays: 5 },
    { title: 'Maquettes UI', listIdx: 1, priority: 'HIGH', dueDays: -1 },
    { title: 'Revue équipe', listIdx: 1, priority: 'MEDIUM', dueDays: 3 },
    { title: 'Tests QA', listIdx: 1, priority: 'LOW', dueDays: 7 },
    { title: 'Déploiement staging', listIdx: 2, priority: 'NONE', dueDays: null },
  ];

  let firstProjectId = null;

  for (const spec of PROJECTS) {
    let project = await prisma.project.findFirst({
      where: { workspaceId, name: spec.name },
    });

    if (!project) {
      project = await prisma.$transaction(async (tx) => {
        const p = await tx.project.create({
          data: {
            workspaceId,
            teamId: spec.archived ? null : team.id,
            name: spec.name,
            description: spec.description,
            color: spec.color,
            health: spec.health,
            archived: spec.archived,
            startDate: daysFromNow(-30),
            endDate: spec.archived ? daysFromNow(-1) : daysFromNow(60),
          },
        });

        const lists = await Promise.all(
          DEFAULT_LISTS.map((name, position) =>
            tx.projectList.create({ data: { projectId: p.id, name, position } }),
          ),
        );

        for (let i = 0; i < sampleTasks.length; i++) {
          const t = sampleTasks[i];
          const list = lists[t.listIdx];
          const status = statuses[Math.min(t.listIdx, statuses.length - 1)];
          await tx.task.create({
            data: {
              workspaceId,
              projectId: p.id,
              listId: list.id,
              statusId: status.id,
              title: t.title,
              priority: t.priority,
              position: i,
              dueDate: t.dueDays != null ? daysFromNow(t.dueDays) : null,
              estimatedTime: 60 + i * 30,
              completedAt: t.listIdx === 2 ? daysFromNow(-2) : null,
            },
          });
        }

        return p;
      });
      console.log(`✅ Créé: ${spec.name}`);
    }

    const enrichCtx = { workspaceId, ownerId, admin, member, guest, tags, labels, statuses };
    const enriched = await enrichProject(project, enrichCtx);
    if (project && enriched) console.log(`🔄 Enrichi: ${spec.name}`);
    else if (project) console.log(`⏭  ${spec.name}`);

    if (!firstProjectId && !project.archived) firstProjectId = project.id;
  }

  // ─── Partage projet (guest) ─────────────────────────────────────────────
  if (firstProjectId && guest) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: firstProjectId, userId: guest.id } },
      create: {
        projectId: firstProjectId,
        userId: guest.id,
        role: 'VIEWER',
        addedById: ownerId,
      },
      update: {},
    });
  }

  // ─── Notifications ──────────────────────────────────────────────────────
  const notifCount = await prisma.notification.count({ where: { userId: ownerId } });
  if (notifCount < 3) {
    await prisma.notification.createMany({
      data: [
        {
          userId: ownerId,
          type: 'DAILY_BRIEF',
          title: 'Votre Daily Brief est prêt',
          body: '3 tâches critiques, 1 réunion aujourd\'hui',
          data: { date: new Date().toISOString() },
          read: false,
        },
        {
          userId: ownerId,
          type: 'TASK_DUE',
          title: 'Échéance proche',
          body: 'Maquettes UI — demain',
          data: {},
          read: false,
        },
        {
          userId: ownerId,
          type: 'COMMENT_ADDED',
          title: 'Nouveau commentaire',
          body: 'Marc a commenté une tâche',
          data: {},
          read: true,
        },
        {
          userId: member.id,
          type: 'TASK_ASSIGNED',
          title: 'Tâche assignée',
          body: 'Définir le périmètre vous a été assignée',
          data: {},
          read: false,
        },
      ],
    });
    console.log('🔔 Notifications créées');
  }

  // ─── Réunions ───────────────────────────────────────────────────────────
  const meetingCount = await prisma.meeting.count({ where: { workspaceId } });
  if (meetingCount === 0) {
    await prisma.meeting.createMany({
      data: [
        {
          workspaceId,
          title: 'Standup équipe',
          description: 'Point quotidien 15 min',
          startTime: daysFromNow(0),
          endTime: new Date(daysFromNow(0).getTime() + 30 * 60 * 1000),
          location: 'Google Meet',
        },
        {
          workspaceId,
          title: 'Revue sprint',
          description: 'Démo + rétrospective',
          startTime: daysFromNow(3),
          endTime: new Date(daysFromNow(3).getTime() + 60 * 60 * 1000),
          location: 'Salle A',
        },
        {
          workspaceId,
          title: 'Sync client Acme',
          startTime: daysFromNow(-2),
          endTime: new Date(daysFromNow(-2).getTime() + 45 * 60 * 1000),
        },
      ],
    });
    console.log('📅 3 réunions');
  }

  // ─── Rappels ────────────────────────────────────────────────────────────
  const firstTask = await prisma.task.findFirst({
    where: { workspaceId, parentId: null },
    orderBy: { createdAt: 'asc' },
  });
  if (firstTask) {
    const reminderExists = await prisma.reminder.findFirst({
      where: { taskId: firstTask.id, userId: ownerId },
    });
    if (!reminderExists) {
      await prisma.reminder.create({
        data: {
          taskId: firstTask.id,
          userId: ownerId,
          scheduledAt: daysFromNow(1),
          status: 'PENDING',
          suggestion: 'Commencer tôt demain matin',
          channels: { inApp: true, email: false },
        },
      });
      console.log('⏰ Rappel smart créé');
    }
  }

  // ─── Focus session ──────────────────────────────────────────────────────
  const focusExists = await prisma.focusSession.findFirst({ where: { userId: ownerId } });
  if (!focusExists && firstTask) {
    await prisma.focusSession.create({
      data: {
        userId: ownerId,
        taskId: firstTask.id,
        startedAt: daysFromNow(-1),
        endedAt: new Date(daysFromNow(-1).getTime() + 25 * 60 * 1000),
      },
    });
    console.log('🎯 Session focus historique');
  }

  // ─── Jobs IA ────────────────────────────────────────────────────────────
  const aiExists = await prisma.aIJob.findFirst({ where: { workspaceId } });
  if (!aiExists && firstProjectId) {
    await prisma.aIJob.createMany({
      data: [
        {
          workspaceId,
          type: 'PROJECT_BREAKDOWN',
          status: 'COMPLETED',
          input: { name: 'Refonte site web', auto: true },
          output: {
            summary: 'Découpage en 5 tâches clés pour le lancement',
            suggestedTasks: [
              { title: 'Audit UX existant', priority: 'HIGH' },
              { title: 'Design system v2', priority: 'MEDIUM' },
            ],
          },
          entityType: 'PROJECT',
          entityId: firstProjectId,
          completedAt: daysFromNow(-1),
        },
        {
          workspaceId,
          type: 'ASSISTANT',
          status: 'COMPLETED',
          input: { message: 'Quelles sont mes priorités du jour ?' },
          output: {
            reply: 'Concentrez-vous sur les maquettes UI et la revue équipe.',
            suggestions: ['Lancer un Focus Mode', 'Consulter le Daily Brief'],
          },
          completedAt: daysFromNow(0),
        },
      ],
    });
    console.log('✨ Jobs IA démo');
  }

  console.log('\n══════════════════════════════════════════');
  console.log('Seed terminé !');
  console.log(`Workspace: ${workspace.name}`);
  console.log(`Owner:     ${owner.email} (votre compte)`);
  console.log('Comptes démo (mot de passe: Test1234!):');
  for (const u of DEMO_USERS) {
    console.log(`  ${u.role.padEnd(6)} ${u.email}`);
  }
  console.log('Invitation pending: nouveau.collegue@workpilot.test');
  console.log('══════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
