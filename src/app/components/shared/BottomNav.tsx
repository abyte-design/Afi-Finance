import { useNavigate, useLocation } from 'react-router';
import { Home, Clock, Plus, BarChart2, User } from 'lucide-react';

const tabs = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/history', icon: Clock, label: 'History' },
  { path: '/add', icon: Plus, label: 'Add', isCenter: true },
  { path: '/analytics', icon: BarChart2, label: 'Stats' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      style={{
        background: '#0E0C2A',
        borderTop: '1px solid #2D2A6E',
        boxShadow: '0 -4px 30px rgba(124,58,237,0.15)',
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
        zIndex: 50,
      }}
      className="flex justify-around items-center h-16 px-2"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;

        if (tab.isCenter) {
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex items-center justify-center -mt-6 rounded-full w-14 h-14 transition-all active:scale-90"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                boxShadow: '0 0 20px rgba(124,58,237,0.7), 0 4px 15px rgba(0,0,0,0.4)',
                border: '2px solid rgba(139,92,246,0.5)',
              }}
            >
              <Icon size={24} color="#fff" strokeWidth={2.5} />
            </button>
          );
        }

        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex flex-col items-center gap-1 flex-1 py-1 transition-all active:scale-95"
          >
            <Icon
              size={20}
              color={isActive ? '#00FFD1' : '#4A4870'}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span
              style={{
                fontFamily: isActive ? "'Press Start 2P', monospace" : 'system-ui',
                fontSize: isActive ? '7px' : '10px',
                color: isActive ? '#00FFD1' : '#4A4870',
                textShadow: isActive ? '0 0 8px rgba(0,255,209,0.6)' : 'none',
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}