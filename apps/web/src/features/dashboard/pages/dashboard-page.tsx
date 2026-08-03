import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DailyBriefCard } from '@/features/intelligence/components/daily-brief-card';
import { SmartRemindersCard } from '@/features/intelligence/components/smart-reminders-card';
import { useDashboardStats } from '../hooks/use-dashboard';
import { ActivityFeed } from '../components/activity-feed';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { formatTimeGreeting } from '@/lib/greeting';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const stats = statsData?.data;

  const widgets = stats
    ? [
        { icon: FolderKanban, label: 'Projets actifs', value: String(stats.activeProjects), tone: 'text-accent' },
        { icon: TrendingUp, label: 'Progression moyenne', value: `${stats.avgProgress}%`, tone: 'text-success' },
        { icon: CheckCircle2, label: 'Tâches terminées', value: `${stats.completedTasks}/${stats.totalTasks}`, tone: 'text-success' },
        { icon: AlertTriangle, label: 'En retard', value: String(stats.overdueTasks), tone: 'text-destructive', alert: stats.overdueTasks > 0 },
      ]
    : [];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display">
            {formatTimeGreeting(user?.firstName)} 
          </h1>
          <p className="text-sm text-muted mt-1">Voici votre journée en un coup d'œil</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link to="/app/projects">
            <Button variant="secondary" size="sm">
              Projets
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </motion.div>

      <DailyBriefCard />
      <SmartRemindersCard />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading &&
          [1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-[var(--radius-xl)]" />
          ))}
        {!statsLoading &&
          widgets.map((widget, i) => (
            <motion.div
              key={widget.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
            >
              <Card className={cn('hover:shadow-[var(--shadow-md)] transition-shadow', widget.alert && 'border-destructive/30')}>
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted uppercase tracking-wide">{widget.label}</p>
                      <p className="text-3xl font-bold mt-2 tabular-nums font-display">{widget.value}</p>
                    </div>
                    <div className={cn('p-2.5 rounded-[var(--radius-lg)] bg-surface-sunken', widget.tone)}>
                      <widget.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
      </div>

      <ActivityFeed />
    </div>
  );
}
