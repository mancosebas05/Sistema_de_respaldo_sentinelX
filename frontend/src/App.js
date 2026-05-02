import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PoliciesPage from './pages/PoliciesPage';
import BackupsPage from './pages/BackupsPage';
import RestorePage from './pages/RestorePage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import AuditPage from './pages/AuditPage';
import ConfigPage from './pages/ConfigPage';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuth, hasPermission } = useAuth();
  if (!isAuth) return <Navigate to="/login" replace />;
  if (roles && !hasPermission(roles)) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  const { isAuth } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuth ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/" element={<Navigate to={isAuth ? "/dashboard" : "/login"} />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/politicas" element={<ProtectedRoute roles={['admin','ti','operativo','directivo']}><PoliciesPage /></ProtectedRoute>} />
        <Route path="/respaldos" element={<ProtectedRoute roles={['admin','ti','operativo','directivo']}><BackupsPage /></ProtectedRoute>} />
        <Route path="/restaurar" element={<ProtectedRoute roles={['admin','ti']}><RestorePage /></ProtectedRoute>} />
        <Route path="/usuarios" element={<ProtectedRoute roles={['admin','directivo']}><UsersPage /></ProtectedRoute>} />
        <Route path="/reportes" element={<ProtectedRoute roles={['admin','ti','directivo']}><ReportsPage /></ProtectedRoute>} />
        <Route path="/auditoria" element={<ProtectedRoute roles={['admin','ti']}><AuditPage /></ProtectedRoute>} />
        <Route path="/configuracion" element={<ProtectedRoute roles={['admin']}><ConfigPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
