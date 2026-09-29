import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { CurrencyProvider } from './contexts/CurrencyContext.js';
import { MainLayout } from './components/layout/MainLayout.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import { Role } from './types/index.js';

// Route-based Code Splitting (Lazy-loaded chunks for optimal bundle size)
const LoginPage = lazy(() => import('./pages/auth/LoginPage.js').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage.js').then((m) => ({ default: m.DashboardPage })));
const MachinesPage = lazy(() => import('./pages/machines/MachinesPage.js').then((m) => ({ default: m.MachinesPage })));
const ClientsPage = lazy(() => import('./pages/clients/ClientsPage.js').then((m) => ({ default: m.ClientsPage })));
const MaintenancePage = lazy(() => import('./pages/maintenance/MaintenancePage.js').then((m) => ({ default: m.MaintenancePage })));
const InventoryPage = lazy(() => import('./pages/inventory/InventoryPage.js').then((m) => ({ default: m.InventoryPage })));
const QuotesPage = lazy(() => import('./pages/quotes/QuotesPage.js').then((m) => ({ default: m.QuotesPage })));
const InvoicesPage = lazy(() => import('./pages/invoices/InvoicesPage.js').then((m) => ({ default: m.InvoicesPage })));
const ContractsPage = lazy(() => import('./pages/contracts/ContractsPage.js').then((m) => ({ default: m.ContractsPage })));
const CRMPipelinePage = lazy(() => import('./pages/crm/CRMPipelinePage.js').then((m) => ({ default: m.CRMPipelinePage })));
const AuditPage = lazy(() => import('./pages/audit/AuditPage.js').then((m) => ({ default: m.AuditPage })));
const UsersPage = lazy(() => import('./pages/users/UsersPage.js').then((m) => ({ default: m.UsersPage })));
const AuditsPage = lazy(() => import('./pages/audits/AuditsPage.js').then((m) => ({ default: m.AuditsPage })));
const TcoCalculatorPage = lazy(() => import('./pages/audits/TcoCalculatorPage.js').then((m) => ({ default: m.TcoCalculatorPage })));
const OrdersPage = lazy(() => import('./pages/orders/OrdersPage.js').then((m) => ({ default: m.OrdersPage })));
const CompetitorsPage = lazy(() => import('./pages/competitors/CompetitorsPage.js').then((m) => ({ default: m.CompetitorsPage })));
const Machine360Page = lazy(() => import('./pages/fleet360/Machine360Page.js').then((m) => ({ default: m.Machine360Page })));
const Customer360Page = lazy(() => import('./pages/fleet360/Customer360Page.js').then((m) => ({ default: m.Customer360Page })));
const PlanningPage = lazy(() => import('./pages/planning/PlanningPage.js').then((m) => ({ default: m.PlanningPage })));
const SuppliersPage = lazy(() => import('./pages/purchasing/SuppliersPage.js').then((m) => ({ default: m.SuppliersPage })));
const AiCopilotPage = lazy(() => import('./pages/ai/AiCopilotPage.js').then((m) => ({ default: m.AiCopilotPage })));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage.js').then((m) => ({ default: m.SettingsPage })));

const PageLoader: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-slate-500">
    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
      Chargement du module...
    </span>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold tracking-wider">CHARGEMENT DE NEXORA INDUSTRIAL OS...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const RoleRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: Role[];
  fallbackPath?: string;
}> = ({ children, allowedRoles, fallbackPath = '/' }) => {
  const { hasRole, user } = useAuth();

  if (allowedRoles && !hasRole(...allowedRoles)) {
    if (user?.role === 'TECHNICIEN_SAV') {
      return <Navigate to="/maintenance" replace />;
    }
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

const DashboardIndexRoute: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'TECHNICIEN_SAV') {
    return <Navigate to="/maintenance" replace />;
  }
  return <DashboardPage />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  {/* Index Dashboard */}
                  <Route index element={<DashboardIndexRoute />} />

                  {/* AI Industrial Copilot (All authenticated users) */}
                  <Route path="ai-assistant" element={<AiCopilotPage />} />

                  {/* Machines */}
                  <Route
                    path="machines"
                    element={
                      <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMMERCIAL', 'RESPONSABLE_SAV', 'TECHNICIEN_SAV', 'MAGASINIER']}>
                        <MachinesPage />
                      </RoleRoute>
                    }
                  />
                  <Route path="machines/:id/360" element={<Machine360Page />} />

                  {/* Clients */}
                  <Route
                    path="clients"
                    element={
                      <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMMERCIAL', 'RESPONSABLE_SAV', 'COMPTABILITE']}>
                        <ClientsPage />
                      </RoleRoute>
                    }
                  />
                  <Route path="clients/:id/360" element={<Customer360Page />} />

                  {/* Audits & TCO */}
                  <Route
                    path="audits"
                    element={
                      <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMMERCIAL']}>
                        <AuditsPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="tco"
                    element={
                      <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMMERCIAL']}>
                        <TcoCalculatorPage />
                      </RoleRoute>
                    }
                  />

                  {/* Quotes */}
                  <Route
                    path="quotes"
                    element={
                      <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMMERCIAL', 'COMPTABILITE']}>
                        <QuotesPage />
                      </RoleRoute>
                    }
                  />

                  {/* Orders */}
                  <Route
                    path="orders"
                    element={
                      <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMMERCIAL', 'COMPTABILITE', 'MAGASINIER']}>
                        <OrdersPage />
                      </RoleRoute>
                    }
                  />

                  {/* Invoices */}
                  <Route
                    path="invoices"
                    element={
                      <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMPTABILITE']}>
                        <InvoicesPage />
                      </RoleRoute>
                    }
                  />

                  {/* Maintenance & SAV */}
                  <Route
                    path="maintenance"
                    element={
                      <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'RESPONSABLE_SAV', 'TECHNICIEN_SAV']}>
                        <MaintenancePage />
                      </RoleRoute>
                    }
                  />

                  {/* Planning */}
                  <Route
                    path="planning"
                    element={
                      <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'RESPONSABLE_SAV', 'TECHNICIEN_SAV']}>
                        <PlanningPage />
                      </RoleRoute>
                    }
                  />

                  {/* Inventory */}
                  <Route
                    path="inventory"
                    element={
                      <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'RESPONSABLE_SAV', 'TECHNICIEN_SAV', 'MAGASINIER']}>
                        <InventoryPage />
                      </RoleRoute>
                    }
                  />

                  {/* Purchasing & Suppliers */}
                  <Route
                    path="purchasing"
                    element={
                      <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'MAGASINIER', 'COMPTABILITE']}>
                        <SuppliersPage />
                      </RoleRoute>
                    }
                  />

                  {/* Contracts */}
                  <Route
                    path="contracts"
                    element={
                      <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMMERCIAL', 'RESPONSABLE_SAV', 'COMPTABILITE']}>
                        <ContractsPage />
                      </RoleRoute>
                    }
                  />

                  {/* Competitors & CRM */}
                  <Route
                    path="competitors"
                    element={
                      <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMMERCIAL']}>
                        <CompetitorsPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="crm"
                    element={
                      <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMMERCIAL']}>
                        <CRMPipelinePage />
                      </RoleRoute>
                    }
                  />

                  {/* Users & Audit */}
                  <Route
                    path="users"
                    element={
                      <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                        <UsersPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="audit"
                    element={
                      <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                        <AuditPage />
                      </RoleRoute>
                    }
                  />

                  {/* Company Settings & Document Layout Studio */}
                  <Route
                    path="settings"
                    element={
                      <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMPTABILITE']}>
                        <SettingsPage />
                      </RoleRoute>
                    }
                  />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
