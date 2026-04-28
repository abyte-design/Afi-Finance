import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, Shield, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../shared/Logo';
import { InstallAppButton } from '../shared/InstallAppButton';

export function LoginScreen() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      await signIn(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex justify-center"
      style={{ background: '#06050F' }}
    >
      <div
        className="w-full flex flex-col items-center"
        style={{
          maxWidth: '430px',
          minHeight: '100vh',
          background: '#0A091C',
          backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.12) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Decorative top glow */}
        <div
          className="absolute top-0 left-0 right-0 h-1 max-w-[430px]"
          style={{ background: 'linear-gradient(90deg, #7C3AED, #00FFD1, #7C3AED)' }}
        />

        <div className="flex flex-col items-center w-full px-6 pt-16 pb-10">
          {/* Logo area */}
          <div className="flex flex-col items-center mb-10">
            <Logo size="lg" />
            <h1
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '11px',
                color: '#E2E0FF',
                letterSpacing: '0.1em',
                marginBottom: '8px',
                marginTop: '20px',
              }}
            >
              SIGN IN
            </h1>
            <div className="flex items-center gap-2">
              <Shield size={11} color="#00FFD1" />
              <p style={{ color: '#7A78A0', fontSize: '11px', fontFamily: 'system-ui' }}>
                Your data is synced safely
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div
            className="w-full rounded-sm p-5"
            style={{
              background: '#13112E',
              border: '1px solid #2D2A6E',
              boxShadow: '0 0 30px rgba(124,58,237,0.15)',
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

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label style={{ color: '#7A78A0', fontSize: '10px', fontFamily: "'Press Start 2P', monospace", display: 'block', marginBottom: '8px' }}>
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="player@afi.app"
                  className="w-full outline-none transition-all"
                  style={{
                    background: '#0E0C2A',
                    border: '1px solid #2D2A6E',
                    borderRadius: '2px',
                    padding: '12px 14px',
                    color: '#E2E0FF',
                    fontSize: '14px',
                    fontFamily: 'system-ui',
                  }}
                  onFocus={e => e.target.style.borderColor = '#7C3AED'}
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
                    placeholder="••••••••"
                    className="w-full outline-none transition-all pr-12"
                    style={{
                      background: '#0E0C2A',
                      border: '1px solid #2D2A6E',
                      borderRadius: '2px',
                      padding: '12px 14px',
                      color: '#E2E0FF',
                      fontSize: '14px',
                      fontFamily: 'system-ui',
                    }}
                    onFocus={e => e.target.style.borderColor = '#7C3AED'}
                    onBlur={e => e.target.style.borderColor = '#2D2A6E'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPw ? <EyeOff size={18} color="#4A4870" /> : <Eye size={18} color="#4A4870" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                style={{ color: '#8B5CF6', fontSize: '11px', fontFamily: 'system-ui', textAlign: 'right' }}
              >
                Forgot Password?
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-sm transition-all active:scale-98 flex items-center justify-center gap-2"
                style={{
                  background: loading ? '#4C3BCF' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                  border: '1px solid rgba(139,92,246,0.5)',
                  boxShadow: '0 0 20px rgba(124,58,237,0.4)',
                  color: '#fff',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <span style={{ animation: 'pulse 1s infinite' }}>LOADING...</span>
                ) : (
                  <>
                    <Zap size={14} />
                    CONTINUE JOURNEY
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Register link */}
          <div className="mt-6 flex items-center gap-2">
            <span style={{ color: '#4A4870', fontSize: '12px', fontFamily: 'system-ui' }}>
              New player?
            </span>
            <button
              onClick={() => navigate('/register')}
              style={{
                color: '#00FFD1',
                fontSize: '12px',
                fontFamily: "'Press Start 2P', monospace",
                textShadow: '0 0 8px rgba(0,255,209,0.5)',
              }}
            >
              CREATE ACCOUNT
            </button>
          </div>

          {/* Install App */}
          <div className="mt-5 w-full">
            <InstallAppButton variant="full" />
          </div>

          {/* Pixel decorations */}
          <div className="mt-10 flex gap-3">
            {['#7C3AED', '#00FFD1', '#FF4D8D', '#F59E0B'].map((c, i) => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  background: c,
                  boxShadow: `0 0 8px ${c}`,
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}