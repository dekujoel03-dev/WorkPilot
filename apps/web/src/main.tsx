import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders, AppRoutes } from '@/app/router';
import '@/styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  </StrictMode>,
);
