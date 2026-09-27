import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { CurrencyProvider } from './contexts/CurrencyContext.js';
import { MainLayout } from './components/layout/MainLayout.js';
import { Role } from './types/index.js';

// Pages
import { LoginPage } from './pages/auth/LoginPage.js';
import { DashboardPage } from './pages/dashboard/DashboardPage.js';
import { MachinesPage } from './pages/machines/MachinesPage.js';
import { ClientsPage } from './pages/clients/ClientsPage.js';
import { MaintenancePage } from './pages/maintenance/MaintenancePage.js';
import { InventoryPage } from './pages/inventory/InventoryPage.js';
import { QuotesPage } from './pages/quotes/QuotesPage.js';
import { InvoicesPage } from './pages/invoices/InvoicesPage.js';
import { ContractsPage } from './pages/contracts/ContractsPage.js';
import { CRMPipelinePage } from './pages/crm/CRMPipelinePage.js';
import { AuditPage } from './pages/audit/AuditPage.js';
import { UsersPage } from './pages/users/UsersPage.js';
import { AuditsPage } from './pages/audits/AuditsPage.js';
import { TcoCalculatorPage } from './pages/audits/TcoCalculatorPage.js';
import { OrdersPage } from './pages/orders/OrdersPage.js';
import { CompetitorsPage } from './pages/competitors/CompetitorsPage.js';
import { Machine360Page } from './pages/fleet360/Machine360Page.js';
import { Customer360Page } from './pages/fleet360/Customer360Page.js';
import { PlanningPage } from './pages/planning/PlanningPage.js';
import { SuppliersPage } from './pages/purchasing/SuppliersPage.js';
import { AiCopilotPage } from './pages/ai/AiCopilotPage.js';
import { SettingsPage } from './pages/settings/SettingsPage.js';

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
          <span className="font-semibold tracking-wider">CHARGEMENT DE VIDEOJET MAROC...</span>
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
          </BrowserRouter>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
