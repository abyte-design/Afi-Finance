import { useState } from 'react';
import { Download, Smartphone, X, Share, Plus, CheckCircle2, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Logo } from './Logo';

interface InstallAppButtonProps {
  /** 'full' = wide button with label, 'compact' = small pill */
  variant?: 'full' | 'compact';
}

function IOSInstructionsModal({ onClose }: { onClose: () => void }) {
  const steps = [
    {
      icon: <Share size={20} color="#00FFD1" />,
      label: 'Tap the Share button',
      sub: 'The box with an arrow at the bottom of Safari',
    },
    {
      icon: <Plus size={20} color="#8B5CF6" />,
      label: 'Tap "Add to Home Screen"',
      sub: 'Scroll down in the share sheet to find it',
    },
    {
      icon: <CheckCircle2 size={20} color="#00E57E" />,
      label: 'Tap "Add" to confirm',
      sub: 'AFI will appear on your home screen',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(6,5,15,0.88)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl"
        style={{
          background: '#0A091C',
          border: '1px solid #2D2A6E',
          borderBottom: 'none',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.7)',
          maxWidth: '430px',
          margin: '0 auto',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: '#2D2A6E' }} />
        </div>

        <div className="px-6 pb-10 pt-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <div>
                <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color: '#E2E0FF' }}>
                  INSTALL AFI
                </h3>
                <p style={{ color: '#7A78A0', fontSize: '12px', fontFamily: 'system-ui', marginTop: '2px' }}>
                  Add to your home screen
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-sm flex items-center justify-center"
              style={{ background: '#13112E', border: '1px solid #2D2A6E' }}
            >
              <X size={14} color="#7A78A0" />
            </button>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-3 mb-6">
            {steps.map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-sm"
                style={{ background: '#13112E', border: '1px solid #1E1B4B' }}
              >
                <div
                  className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0"
                  style={{ background: '#0A091C', border: '1px solid #2D2A6E' }}
                >
                  {step.icon}
                </div>
                <div className="flex-1">
                  <p style={{ color: '#E2E0FF', fontSize: '13px', fontFamily: 'system-ui', fontWeight: 600 }}>
                    {step.label}
                  </p>
                  <p style={{ color: '#4A4870', fontSize: '11px', fontFamily: 'system-ui', marginTop: '2px' }}>
                    {step.sub}
                  </p>
                </div>
                <div
                  className="w-6 h-6 rounded-sm flex items-center justify-center flex-shrink-0"
                  style={{ background: '#1E1B4B', border: '1px solid #2D2A6E' }}
                >
                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#4A4870' }}>
                    {i + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div
            className="rounded-sm p-3 flex items-center gap-3"
            style={{ background: 'rgba(0,255,209,0.05)', border: '1px solid rgba(0,255,209,0.2)' }}
          >
            <Smartphone size={16} color="#00FFD1" className="flex-shrink-0" />
            <p style={{ color: '#7A78A0', fontSize: '11px', fontFamily: 'system-ui', lineHeight: 1.5 }}>
              Works offline after install · No App Store needed · Full-screen experience
            </p>
          </div>

          {/* Safe area */}
          <div style={{ height: 'env(safe-area-inset-bottom, 8px)', minHeight: '8px' }} />
        </div>
      </div>
    </>
  );
}

export function InstallAppButton({ variant = 'full' }: InstallAppButtonProps) {
  const { status, platform, canInstall, isStandalone, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  const handleClick = async () => {
    if (platform === 'ios') {
      setShowIOSModal(true);
      return;
    }
    await install();
    if (status === 'installed') setJustInstalled(true);
  };

  // Already running as installed PWA
  if (isStandalone) {
    if (variant === 'compact') return null;
    return (
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-sm"
        style={{ background: 'rgba(0,229,126,0.08)', border: '1px solid rgba(0,229,126,0.25)' }}
      >
        <CheckCircle2 size={16} color="#00E57E" />
        <span style={{ color: '#00E57E', fontSize: '11px', fontFamily: 'system-ui' }}>
          App installed — running natively
        </span>
      </div>
    );
  }

  // Just confirmed installed
  if (justInstalled) {
    if (variant === 'compact') return null;
    return (
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-sm"
        style={{ background: 'rgba(0,229,126,0.08)', border: '1px solid rgba(0,229,126,0.25)' }}
      >
        <CheckCircle2 size={16} color="#00E57E" />
        <span style={{ color: '#00E57E', fontSize: '11px', fontFamily: 'system-ui' }}>
          AFI installed successfully!
        </span>
      </div>
    );
  }

  // iOS — always show (manual instructions)
  const showButton = platform === 'ios' || canInstall;

  if (!showButton) {
    // Desktop/Android where prompt hasn't fired yet — show a greyed hint
    if (variant === 'compact') return null;
    return (
      <div
        className="flex items-center gap-3 px-4 py-3.5 rounded-sm"
        style={{ background: '#13112E', border: '1px solid #1E1B4B', opacity: 0.5 }}
      >
        <ExternalLink size={16} color="#4A4870" />
        <div className="flex-1">
          <p style={{ color: '#4A4870', fontSize: '12px', fontFamily: 'system-ui' }}>
            Install App — open in Chrome to install
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={handleClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm active:scale-95 transition-transform"
          style={{
            background: 'rgba(0,255,209,0.1)',
            border: '1px solid rgba(0,255,209,0.3)',
            boxShadow: '0 0 10px rgba(0,255,209,0.08)',
          }}
        >
          <Download size={12} color="#00FFD1" />
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#00FFD1' }}>
            INSTALL
          </span>
        </button>
        {showIOSModal && <IOSInstructionsModal onClose={() => setShowIOSModal(false)} />}
      </>
    );
  }

  // Full variant
  return (
    <>
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-3 px-4 py-4 rounded-sm transition-all active:scale-98 group"
        style={{
          background: 'linear-gradient(135deg, rgba(0,255,209,0.08), rgba(124,58,237,0.08))',
          border: '1px solid rgba(0,255,209,0.25)',
          boxShadow: '0 0 20px rgba(0,255,209,0.06)',
        }}
      >
        {/* Animated icon */}
        <div
          className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            background: 'linear-gradient(135deg, #0D2B26, #1A3D36)',
            border: '1px solid rgba(0,255,209,0.3)',
            boxShadow: '0 0 12px rgba(0,255,209,0.15)',
          }}
        >
          {platform === 'ios'
            ? <Share size={18} color="#00FFD1" />
            : <Download size={18} color="#00FFD1" />
          }
        </div>

        <div className="flex-1 text-left">
          <p style={{ color: '#E2E0FF', fontSize: '13px', fontFamily: 'system-ui', fontWeight: 600 }}>
            {platform === 'ios' ? 'Add to Home Screen' : 'Install AFI App'}
          </p>
          <p style={{ color: '#4A4870', fontSize: '11px', fontFamily: 'system-ui', marginTop: '1px' }}>
            {platform === 'ios'
              ? 'Works offline · No App Store needed'
              : 'Install for the full native experience'}
          </p>
        </div>

        {/* Pixel badge */}
        <div
          className="px-2 py-1 rounded-sm flex-shrink-0"
          style={{ background: 'rgba(0,255,209,0.12)', border: '1px solid rgba(0,255,209,0.25)' }}
        >
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#00FFD1' }}>
            FREE
          </span>
        </div>
      </button>

      {showIOSModal && <IOSInstructionsModal onClose={() => setShowIOSModal(false)} />}
    </>
  );
}