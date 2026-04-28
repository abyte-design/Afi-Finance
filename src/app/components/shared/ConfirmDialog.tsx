import { useEffect, useRef } from 'react';
import { AlertTriangle, LogOut, Trash2, HelpCircle } from 'lucide-react';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
  /** Optional Lucide icon override — defaults based on variant */
  icon?: 'delete' | 'logout' | 'warning' | 'info';
}

const variantConfig = {
  danger: {
    iconBg: 'rgba(255,77,141,0.12)',
    iconBorder: 'rgba(255,77,141,0.35)',
    iconColor: '#FF4D8D',
    confirmBg: 'linear-gradient(135deg, #C0104A, #8B0030)',
    confirmBorder: 'rgba(255,77,141,0.4)',
    confirmShadow: '0 0 20px rgba(255,77,141,0.25)',
    confirmColor: '#fff',
  },
  warning: {
    iconBg: 'rgba(245,158,11,0.12)',
    iconBorder: 'rgba(245,158,11,0.35)',
    iconColor: '#F59E0B',
    confirmBg: 'linear-gradient(135deg, #B45309, #92400E)',
    confirmBorder: 'rgba(245,158,11,0.4)',
    confirmShadow: '0 0 20px rgba(245,158,11,0.2)',
    confirmColor: '#fff',
  },
  info: {
    iconBg: 'rgba(139,92,246,0.12)',
    iconBorder: 'rgba(139,92,246,0.35)',
    iconColor: '#8B5CF6',
    confirmBg: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
    confirmBorder: 'rgba(139,92,246,0.5)',
    confirmShadow: '0 0 20px rgba(124,58,237,0.35)',
    confirmColor: '#fff',
  },
};

function DialogIcon({ icon, color }: { icon: ConfirmDialogProps['icon']; color: string }) {
  const size = 26;
  switch (icon) {
    case 'delete':   return <Trash2 size={size} color={color} />;
    case 'logout':   return <LogOut size={size} color={color} />;
    case 'warning':  return <AlertTriangle size={size} color={color} />;
    default:         return <HelpCircle size={size} color={color} />;
  }
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  variant = 'danger',
  onConfirm,
  onCancel,
  icon,
}: ConfirmDialogProps) {
  const cfg = variantConfig[variant];
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  // Derive icon if not provided
  const resolvedIcon = icon ?? (variant === 'danger' ? 'delete' : variant === 'warning' ? 'warning' : 'info');

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      style={{ background: 'rgba(4,3,14,0.82)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
    >
      {/* Dialog card */}
      <div
        className="w-full flex flex-col items-center"
        style={{
          maxWidth: '340px',
          background: '#100E28',
          border: '1px solid #2D2A6E',
          borderRadius: '8px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
          overflow: 'hidden',
          animation: 'dialogIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        {/* Top accent line */}
        <div
          className="w-full h-0.5"
          style={{ background: `linear-gradient(90deg, transparent, ${cfg.iconColor}, transparent)` }}
        />

        <div className="flex flex-col items-center px-7 pt-8 pb-7 gap-5 w-full">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-sm flex items-center justify-center flex-shrink-0"
            style={{
              background: cfg.iconBg,
              border: `1px solid ${cfg.iconBorder}`,
              boxShadow: `0 0 24px ${cfg.iconBg}`,
            }}
          >
            <DialogIcon icon={resolvedIcon} color={cfg.iconColor} />
          </div>

          {/* Text */}
          <div className="flex flex-col items-center gap-2 text-center">
            <h3
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '11px',
                color: '#E2E0FF',
                letterSpacing: '0.04em',
                lineHeight: 1.6,
              }}
            >
              {title}
            </h3>
            <p
              style={{
                color: '#7A78A0',
                fontSize: '13px',
                fontFamily: 'system-ui',
                lineHeight: 1.55,
              }}
            >
              {message}
            </p>
          </div>

          {/* Pixel divider */}
          <div className="w-full flex gap-1 justify-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 4,
                  height: 4,
                  background: i % 2 === 0 ? cfg.iconColor : '#1E1B4B',
                  opacity: 0.5,
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3 w-full">
            {/* Confirm (destructive/primary action) */}
            <button
              onClick={onConfirm}
              className="w-full py-3.5 rounded-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: cfg.confirmBg,
                border: `1px solid ${cfg.confirmBorder}`,
                boxShadow: cfg.confirmShadow,
                color: cfg.confirmColor,
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '9px',
                letterSpacing: '0.08em',
                cursor: 'pointer',
              }}
            >
              {confirmLabel}
            </button>

            {/* Cancel (ghost) */}
            <button
              onClick={onCancel}
              className="w-full py-3.5 rounded-sm flex items-center justify-center transition-all active:scale-95"
              style={{
                background: 'transparent',
                border: '1px solid #2D2A6E',
                color: '#7A78A0',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '9px',
                letterSpacing: '0.08em',
                cursor: 'pointer',
              }}
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dialogIn {
          from { opacity: 0; transform: scale(0.88) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
