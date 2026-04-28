import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, ChevronLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../shared/Logo';
import { InstallAppButton } from '../shared/InstallAppButton';

export function RegisterScreen() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirm) { setError('All fields required'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      await signUp(email, password, name);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: '#0E0C2A',
    border: '1px solid #2D2A6E',
    borderRadius: '2px',
    padding: '12px 14px',
    color: '#E2E0FF',
    fontSize: '14px',
    fontFamily: 'system-ui',
    width: '100%',
    outline: 'none',
  };

  return (
    <div className="min-h-screen flex justify-center" style={{ background: '#06050F' }}>
      <div
        className="w-full flex flex-col"
        style={{
          maxWidth: '430px',
          minHeight: '100vh',
          background: '#0A091C',
          backgroundImage: 'radial-gradient(circle, rgba(0,255,209,0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <div
          className="h-1 w-full"
          style={{ background: 'linear-gradient(90deg, #00FFD1, #7C3AED, #FF4D8D)' }}
        />

        <div className="flex flex-col w-full px-6 pt-8 pb-10">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 mb-8"
            style={{ color: '#7A78A0', fontSize: '12px', fontFamily: 'system-ui' }}
          >
            <ChevronLeft size={16} />
            Back to Login
          </button>

          <div className="flex flex-col items-center mb-8">
            <Logo size="lg" />
            <h1
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '12px',
                color: '#E2E0FF',
                marginTop: '20px',
                letterSpacing: '0.05em',
              }}
            >
              CREATE ACCOUNT
            </h1>
            <p style={{ color: '#7A78A0', fontSize: '12px', fontFamily: 'system-ui', marginTop: '8px' }}>
              Start your financial journey
            </p>
          </div>

          <div
            className="w-full rounded-sm p-5"
            style={{
              background: '#13112E',
              border: '1px solid #2D2A6E',
              boxShadow: '0 0 30px rgba(0,255,209,0.08)',
            }}
          >
            {error && (
              <div
                className="mb-4 p-3 rounded-sm"
                style={{ background: '#2D1A1A', border: '1px solid #FF4D8D40', color: '#FF4D8D', fontSize: '12px', fontFamily: 'system-ui' }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div>
                <label style={{ color: '#7A78A0', fontSize: '10px', fontFamily: "'Press Start 2P', monospace", display: 'block', marginBottom: '8px' }}>
                  PLAYER NAME
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#00FFD1'}
                  onBlur={e => e.target.style.borderColor = '#2D2A6E'}
                />
              </div>

              <div>
                <label style={{ color: '#7A78A0', fontSize: '10px', fontFamily: "'Press Start 2P', monospace", display: 'block', marginBottom: '8px' }}>
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="player@afi.app"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#00FFD1'}
                  onBlur={e => e.target.style.borderColor = '#2D2A6E'}
                />
              </div>

              <div>
                <label style={{ color: '#7A78A0', fontSize: '10px', fontFamily: "'Press Start 2P', monospace", display: 'block', marginBottom: '8px' }}>
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    style={{ ...inputStyle, paddingRight: '48px' }}
                    onFocus={e => e.target.style.borderColor = '#00FFD1'}
                    onBlur={e => e.target.style.borderColor = '#2D2A6E'}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPw ? <EyeOff size={18} color="#4A4870" /> : <Eye size={18} color="#4A4870" />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ color: '#7A78A0', fontSize: '10px', fontFamily: "'Press Start 2P', monospace", display: 'block', marginBottom: '8px' }}>
                  CONFIRM PASSWORD
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#00FFD1'}
                  onBlur={e => e.target.style.borderColor = '#2D2A6E'}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-sm transition-all active:scale-98 flex items-center justify-center gap-2 mt-2"
                style={{
                  background: loading ? '#134E4A' : 'linear-gradient(135deg, #00FFD1, #00A896)',
                  border: '1px solid rgba(0,255,209,0.4)',
                  boxShadow: '0 0 20px rgba(0,255,209,0.3)',
                  color: '#0A091C',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'CREATING...' : <><Sparkles size={14} /> START JOURNEY</>}
              </button>
            </form>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            <span style={{ color: '#4A4870', fontSize: '12px', fontFamily: 'system-ui' }}>Already playing?</span>
            <button
              onClick={() => navigate('/login')}
              style={{ color: '#8B5CF6', fontSize: '12px', fontFamily: "'Press Start 2P', monospace" }}
            >
              LOGIN
            </button>
          </div>

          {/* Install App */}
          <div className="mt-5 w-full">
            <InstallAppButton variant="full" />
          </div>
        </div>
      </div>
    </div>
  );
}