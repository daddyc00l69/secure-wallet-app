import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { Dashboard } from './components/Dashboard';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import { DataManagement } from './components/Settings/DataManagement';
import { ProfilePage } from './components/Profile/ProfilePage';
import { SecurityPage } from './components/Settings/SecurityPage';
import { HelpPage } from './components/Support/HelpPage';
import { LockScreen } from './components/Security/LockScreen';
import { ForgotPasswordPage } from './components/Auth/ForgotPasswordPage';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { ManagerDashboard } from './components/Manager/ManagerDashboard';
import { ManagerSetupPage } from './components/Auth/ManagerSetupPage';

// Protected Route Component
const RequireAuth = ({ children, role }: { children: React.ReactElement, role?: 'admin' | 'manager' }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user?.role !== role) {
    // If user tries to access admin/manager but is not authorized, redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
};

import { useIdleTimer } from './hooks/useIdleTimer';

function App() {
  const { isAppLocked, isAuthenticated, lockApp } = useAuth();

  // Auto-lock after 30 seconds of inactivity
  useIdleTimer(30000, lockApp, isAuthenticated && !isAppLocked);

  return (
    <>
      {isAuthenticated && isAppLocked && <LockScreen />}
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/manager-setup" element={<ManagerSetupPage />} />

        {/* User Routes */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <DataManagement />
            </RequireAuth>
          }
        />
        <Route
          path="/settings/security"
          element={
            <RequireAuth>
              <SecurityPage />
            </RequireAuth>
          }
        />
        <Route
          path="/support"
          element={
            <RequireAuth>
              <HelpPage />
            </RequireAuth>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <RequireAuth role="admin">
              <AdminDashboard />
            </RequireAuth>
          }
        />

        {/* Manager Routes */}
        <Route
          path="/manager"
          element={
            <RequireAuth role="manager">
              <ManagerDashboard />
            </RequireAuth>
          }
        />

      </Routes>
    </>
  );
}

export default App;
