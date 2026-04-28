import { Outlet, Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { BottomNav } from './BottomNav';

function Spinner() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: '#0A091C' }}
    >
      <div
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '20px',
          color: '#8B5CF6',
          textShadow: '0 0 20px rgba(139,92,246,0.9)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      >
        AFI
      </div>
      <p style={{ color: '#4A4870', fontSize: '11px', marginTop: '16px', fontFamily: 'system-ui' }}>
        Loading...
      </p>
    </div>
  );
}

export function Layout() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div
      className="min-h-screen flex justify-center"
      style={{ background: '#06050F' }}
    >
      <div
        className="w-full max-w-md relative flex flex-col sm:max-w-full"
        style={{ minHeight: '100vh', background: '#0A091C' }}
      >
        <main className="flex-1 overflow-y-auto pb-20">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
