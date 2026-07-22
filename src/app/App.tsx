import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { AppShell } from '../components/layout/AppShell';
import { AppProviders } from './providers';

const GuidancePage = lazy(() => import('../pages/GuidancePage'));
const DesignPage = lazy(() => import('../pages/DesignPage'));
const TopographyPage = lazy(() => import('../pages/TopographyPage'));
const StatusPage = lazy(() => import('../pages/StatusPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));

function Loading() {
  return (
    <div className="grid h-full place-items-center bg-slate-100 text-sm font-bold text-pama-navy">
      LOADING PAMASENSE MODULE…
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<GuidancePage />} />
                <Route path="design" element={<DesignPage />} />
                <Route path="topography" element={<TopographyPage />} />
                <Route path="status" element={<StatusPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppProviders>
    </ErrorBoundary>
  );
}
