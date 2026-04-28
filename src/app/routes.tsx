import { createBrowserRouter, Outlet, Navigate } from 'react-router';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/shared/Layout';
import { LoginScreen } from './components/auth/LoginScreen';
import { RegisterScreen } from './components/auth/RegisterScreen';
import { ForgotPasswordScreen } from './components/auth/ForgotPasswordScreen';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { AddTransactionScreen } from './components/transactions/AddTransactionScreen';
import { HistoryScreen } from './components/transactions/HistoryScreen';
import { AnalyticsScreen } from './components/analytics/AnalyticsScreen';
import { ProfileScreen } from './components/profile/ProfileScreen';
import { AdminDashboard } from './components/admin/AdminDashboard';

function PublicRoute() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A091C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '20px', color: '#8B5CF6', textShadow: '0 0 20px rgba(139,92,246,0.9)' }}>
        AFI
      </span>
    </div>
  );
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Outlet />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        Component: PublicRoute,
        children: [
          { path: 'login', Component: LoginScreen },
          { path: 'register', Component: RegisterScreen },
          { path: 'forgot-password', Component: ForgotPasswordScreen },
        ],
      },
      {
        Component: Layout,
        children: [
          { path: 'dashboard', Component: DashboardScreen },
          { path: 'add', Component: AddTransactionScreen },
          { path: 'history', Component: HistoryScreen },
          { path: 'analytics', Component: AnalyticsScreen },
          { path: 'profile', Component: ProfileScreen },
        ],
      },
      // Admin route — outside Layout, has its own auth (password prompt)
      { path: 'admin', Component: AdminDashboard },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);