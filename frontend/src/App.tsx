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
import { NotFoundPage } from './pages/NotFoundPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { FilterProvider } from './features/dashboard/context/FilterContext';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { CategoryListPage } from './features/categories/pages/CategoryListPage';
import { SubCategoryListPage } from './features/sub-categories/pages/SubCategoryListPage';

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
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route
                  path="/dashboard"
                  element={
                    <PermissionRoute action="dashboard.view">
                      <FilterProvider>
                        <DashboardPage />
                      </FilterProvider>
                    </PermissionRoute>
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
                  path="/settings/categories"
                  element={
                    <PermissionRoute action="lookup.manage">
                      <CategoryListPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/settings/sub-categories"
                  element={
                    <PermissionRoute action="lookup.manage">
                      <SubCategoryListPage />
                    </PermissionRoute>
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
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
