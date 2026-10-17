import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AccountListPage } from './features/accounts/pages/AccountListPage';
import { AccountDetailPage } from './features/accounts/pages/AccountDetailPage';
import { AccountFormPage } from './features/accounts/pages/AccountFormPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Navigate to="/accounts" replace />} />
              <Route
                path="/dashboard"
                element={
                  <PlaceholderPage
                    title="Dashboard"
                    description="Executive overview and analytics (under development in feature/fe-login-dashboard)."
                  />
                }
              />
              {/* Accounts Module Routes */}
              <Route path="/accounts" element={<AccountListPage />} />
              <Route path="/accounts/new" element={<AccountFormPage />} />
              <Route path="/accounts/:id" element={<AccountDetailPage />} />
              <Route path="/accounts/:id/edit" element={<AccountFormPage />} />
              <Route
                path="/contacts"
                element={
                  <PlaceholderPage
                    title="Contacts"
                    description="Key decision-makers, senior leadership, and stakeholder relationships."
                  />
                }
              />
              <Route
                path="/pipeline"
                element={
                  <PlaceholderPage
                    title="Pipeline"
                    description="Deal flow progression, stage probability, and advisory transaction lifecycle."
                  />
                }
              />
              <Route
                path="/follow-ups"
                element={
                  <PlaceholderPage
                    title="Follow-ups"
                    description="Action items, scheduled partner calls, and follow-up deadlines."
                  />
                }
              />
              <Route path="*" element={<Navigate to="/accounts" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
