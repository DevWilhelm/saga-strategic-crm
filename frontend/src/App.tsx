import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AccountListPage } from './features/accounts/pages/AccountListPage';
import { AccountDetailPage } from './features/accounts/pages/AccountDetailPage';
import { AccountFormPage } from './features/accounts/pages/AccountFormPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { PermissionRoute } from './components/common/PermissionRoute';
import { UserListPage } from './features/users/pages/UserListPage';
import { UserFormPage } from './features/users/pages/UserFormPage';
import { ProfilePage } from './features/users/pages/ProfilePage';
import { ContactListPage } from './features/contacts/pages/ContactListPage';
import { ContactDetailPage } from './features/contacts/pages/ContactDetailPage';
import { ContactFormPage } from './features/contacts/pages/ContactFormPage';
import { NotFoundPage } from './pages/NotFoundPage';

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
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
              {/* Contacts Module Routes */}
              <Route path="/contacts" element={<ContactListPage />} />
              <Route path="/contacts/new" element={<ContactFormPage />} />
              <Route path="/contacts/:id" element={<ContactDetailPage />} />
              <Route path="/contacts/:id/edit" element={<ContactFormPage />} />
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
                path="/users"
                element={
                  <PermissionRoute action="user.manage">
                    <UserListPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/users/new"
                element={
                  <PermissionRoute action="user.manage">
                    <UserFormPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/users/:id/edit"
                element={
                  <PermissionRoute action="user.manage">
                    <UserFormPage />
                  </PermissionRoute>
                }
              />
              <Route path="/profile" element={<ProfilePage />} />
              <Route
                path="/follow-ups"
                element={
                  <PlaceholderPage
                    title="Follow-ups"
                    description="Action items, scheduled partner calls, and follow-up deadlines."
                  />
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
