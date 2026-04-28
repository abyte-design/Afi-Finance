import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Mail, CheckCircle2 } from 'lucide-react';
import { Logo } from '../shared/Logo';

export function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex justify-center" style={{ background: '#06050F' }}>
      <div
        className="w-full flex flex-col"
        style={{
          maxWidth: '430px',
          minHeight: '100vh',
          background: '#0A091C',
          backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.1) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #FF4D8D, #7C3AED)' }} />

        <div className="flex flex-col w-full px-6 pt-8 pb-10">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 mb-8"
            style={{ color: '#7A78A0', fontSize: '12px', fontFamily: 'system-ui' }}
          >
            <ChevronLeft size={16} />
            Back to Login
          </button>

          <div className="flex flex-col items-center mb-10">
            <Logo size="lg" />
            <h1
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '10px',
                color: '#E2E0FF',
                marginTop: '20px',
                letterSpacing: '0.05em',
                textAlign: 'center',
              }}
            >
              RESET PASSWORD
            </h1>
            <p style={{ color: '#7A78A0', fontSize: '12px', fontFamily: 'system-ui', marginTop: '8px', textAlign: 'center' }}>
              We'll send a reset link to your email
            </p>
          </div>

          {sent ? (
            <div
              className="w-full rounded-sm p-8 flex flex-col items-center gap-4"
              style={{
                background: '#13112E',
                border: '1px solid #00E57E40',
                boxShadow: '0 0 30px rgba(0,229,126,0.1)',
              }}
            >
              <CheckCircle2 size={48} color="#00E57E" />
              <h2
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '10px',
                  color: '#00E57E',
                  textAlign: 'center',
                }}
              >
                CHECK YOUR EMAIL
              </h2>
              <p style={{ color: '#7A78A0', fontSize: '12px', fontFamily: 'system-ui', textAlign: 'center' }}>
                If <strong style={{ color: '#E2E0FF' }}>{email}</strong> is registered, you'll receive reset instructions shortly.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 px-6 py-3 rounded-sm"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                  border: '1px solid rgba(139,92,246,0.5)',
                  color: '#fff',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '9px',
                  boxShadow: '0 0 15px rgba(124,58,237,0.3)',
                }}
              >
                BACK TO LOGIN
              </button>
            </div>
          ) : (
            <div
              className="w-full rounded-sm p-5"
              style={{
                background: '#13112E',
                border: '1px solid #2D2A6E',
                boxShadow: '0 0 30px rgba(124,58,237,0.1)',
              }}
            >
              <form onSubmit={handleReset} className="flex flex-col gap-4">
                <div>
                  <label style={{ color: '#7A78A0', fontSize: '10px', fontFamily: "'Press Start 2P', monospace", display: 'block', marginBottom: '8px' }}>
                    EMAIL ADDRESS
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="player@afi.app"
                      className="w-full outline-none"
                      style={{
                        background: '#0E0C2A',
                        border: '1px solid #2D2A6E',
                        borderRadius: '2px',
                        padding: '12px 14px 12px 42px',
                        color: '#E2E0FF',
                        fontSize: '14px',
                        fontFamily: 'system-ui',
                      }}
                      onFocus={e => e.target.style.borderColor = '#7C3AED'}
                      onBlur={e => e.target.style.borderColor = '#2D2A6E'}
                    />
                    <Mail size={16} color="#4A4870" className="absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-4 rounded-sm transition-all active:scale-98 mt-2"
                  style={{
                    background: (!email || loading) ? '#1E1B4B' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                    border: '1px solid rgba(139,92,246,0.4)',
                    boxShadow: email ? '0 0 20px rgba(124,58,237,0.3)' : 'none',
                    color: email ? '#fff' : '#4A4870',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '10px',
                    cursor: !email || loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'SENDING...' : 'SEND RESET LINK'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}