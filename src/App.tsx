import type { ReactNode } from 'react';
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Drawer } from './components/Drawer';
import { Toasts } from './components/Toasts';
import { ActionRequiredPage } from './pages/ActionRequired';
import { AddPackagePage } from './pages/AddPackage';
import { AddressesPage } from './pages/Addresses';
import { HelpPage } from './pages/Help';
import { HistoryPage } from './pages/History';
import { NotificationsPage } from './pages/Notifications';
import { PackageDetailPage } from './pages/PackageDetail';
import { PackagesPage } from './pages/Packages';
import { PasteTextPage } from './pages/PasteText';
import { SettingsPage } from './pages/Settings';
import { SourcesPage } from './pages/Sources';
import { WelcomePage } from './pages/Welcome';
import { StoreProvider, useStore } from './store/store';
import { UIProvider } from './store/ui';

/** First-time visitors land on the marketing screen. */
function RequireOnboarding({ children }: { children: ReactNode }) {
  const { onboarded } = useStore();
  return onboarded ? <>{children}</> : <Navigate to="/welcome" replace />;
}

function Shell() {
  return (
    <div className="app-shell">
      <Drawer />
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route
          path="/"
          element={
            <RequireOnboarding>
              <PackagesPage />
            </RequireOnboarding>
          }
        />
        <Route path="/package/:id" element={<PackageDetailPage />} />
        <Route path="/add" element={<AddPackagePage />} />
        <Route path="/paste" element={<PasteTextPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/action-required" element={<ActionRequiredPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/addresses" element={<AddressesPage />} />
        <Route path="/sources" element={<SourcesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toasts />
    </div>
  );
}

/**
 * Hosting without server-side rewrites (a single static file, a file:// page)
 * can't serve /package/123, so those builds route through the URL hash.
 */
const Router = import.meta.env.VITE_HASH_ROUTER ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <StoreProvider>
        <UIProvider>
          <Shell />
        </UIProvider>
      </StoreProvider>
    </Router>
  );
}
