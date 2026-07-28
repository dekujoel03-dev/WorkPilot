import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/features/landing/pages/landing-page';
import { LoginPage } from '@/features/auth/pages/login-page';
import { RegisterPage } from '@/features/auth/pages/register-page';
import { AppLayout } from '@/app/layouts/app-layout';
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page';
import { ProjectsPage } from '@/features/projects/pages/projects-page';
import { ProjectDetailPage } from '@/features/projects/pages/project-detail-page';
import { CalendarPage } from '@/features/calendar/pages/calendar-page';
import { AssistantPage } from '@/features/ai/pages/assistant-page';
import { TeamPage } from '@/features/team/pages/team-page';
import { InvitePage } from '@/features/team/pages/invite-page';
import { SettingsPage } from '@/features/settings/pages/settings-page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

import { Toaster } from '@/components/ui/toaster';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/invite/:token" element={<InvitePage />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
