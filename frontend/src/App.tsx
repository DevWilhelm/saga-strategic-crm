import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
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
              <Route
                path="/accounts"
                element={
                  <PlaceholderPage
                    title="Accounts"
                    description="Target companies, portfolio registries, and corporate profiles."
                  />
                }
              />
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
