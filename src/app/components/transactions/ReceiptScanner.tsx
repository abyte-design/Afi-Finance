import { useState, useRef, useCallback } from 'react';
import {
  Camera, Upload, X, Scan, CheckCircle2, AlertTriangle,
  ChevronRight, ArrowUpRight, ArrowDownRight, RefreshCw,
  UtensilsCrossed, ShoppingBag, Car, Zap, Gamepad2, Heart,
  Plane, BookOpen, Briefcase, Code2, TrendingUp, Gift, Circle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { CATEGORY_COLORS } from '../../lib/utils';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-8bfb3e73`;

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  UtensilsCrossed, ShoppingBag, Car, Zap, Gamepad2, Heart,
  Plane, BookOpen, Briefcase, Code2, TrendingUp, Gift, Circle,
};
const CATEGORY_ICONS: Record<string, string> = {
  Food: 'UtensilsCrossed', Shopping: 'ShoppingBag', Transport: 'Car',
  Bills: 'Zap', Entertainment: 'Gamepad2', Health: 'Heart',
  Travel: 'Plane', Education: 'BookOpen', Salary: 'Briefcase',
  Freelance: 'Code2', Investment: 'TrendingUp', Gift: 'Gift', Other: 'Circle',
};

export interface ScannedTransaction {
  type: 'income' | 'expense';
  amount: number;
  title: string;
  category: string;
  date: string;
  notes: string;
  currency?: string;
}

interface ReceiptScannerProps {
  onSelect: (txn: ScannedTransaction) => void;
  onClose: () => void;
}

type ScanState = 'idle' | 'uploading' | 'scanning' | 'results' | 'error';

// Compress image to JPEG and return base64
async function compressImage(file: File, maxDim = 1200, quality = 0.82): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
        else { width = Math.round(width * maxDim / height); height = maxDim; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType: 'image/jpeg' });
    };
    img.onerror = reject;
    img.src = url;
  });
}

function formatAmount(amount: number, currency?: string): string {
  const cur = currency ?? 'IDR';
  const integerCurrencies = ['IDR', 'VND', 'KRW', 'JPY'];
  if (integerCurrencies.includes(cur)) {
    return new Intl.NumberFormat('id-ID').format(Math.round(amount));
  }
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function getCurrencySymbol(currency?: string): string {
  const map: Record<string, string> = {
    IDR: 'Rp', USD: '$', EUR: '€', GBP: '£', JPY: '¥',
    SGD: 'S$', MYR: 'RM', VND: '₫', KRW: '₩', AUD: 'A$',
  };
  return map[currency ?? 'IDR'] ?? (currency ?? '');
}

// Animated scan line component
function ScanLine() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-sm pointer-events-none">
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #00FFD1, transparent)',
          boxShadow: '0 0 12px #00FFD1, 0 0 24px #00FFD180',
          animation: 'scanline 2s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes scanline {
          0% { top: 10%; opacity: 1; }
          50% { top: 85%; opacity: 0.8; }
          100% { top: 10%; opacity: 1; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function TransactionCard({
  txn,
  index,
  onSelect,
}: {
  txn: ScannedTransaction;
  index: number;
  onSelect: () => void;
}) {
  const isIncome = txn.type === 'income';
  const color = isIncome ? '#00E57E' : '#FF4D8D';
  const catColor = CATEGORY_COLORS[txn.category] ?? '#7A78A0';
  const iconKey = CATEGORY_ICONS[txn.category] ?? 'Circle';
  const Icon = ICON_MAP[iconKey] ?? Circle;

  return (
    <div
      onClick={onSelect}
      className="rounded-sm p-4 cursor-pointer active:scale-98 transition-transform"
      style={{
        background: '#13112E',
        border: `1px solid ${color}30`,
        animation: `slide-up 0.3s ease ${index * 0.06}s both`,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Category icon */}
        <div
          className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0"
          style={{ background: `${catColor}18`, border: `1px solid ${catColor}40` }}
        >
          <Icon size={18} color={catColor} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p style={{ color: '#E2E0FF', fontSize: '13px', fontFamily: 'system-ui', fontWeight: 600 }} className="truncate">
            {txn.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="px-1.5 py-0.5 rounded-sm"
              style={{ background: `${catColor}20`, color: catColor, fontSize: '10px', fontFamily: 'system-ui' }}
            >
              {txn.category}
            </span>
            <span style={{ color: '#4A4870', fontSize: '10px', fontFamily: 'system-ui' }}>
              {txn.date}
            </span>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div
            className="w-5 h-5 rounded-sm flex items-center justify-center"
            style={{ background: `${color}20` }}
          >
            {isIncome
              ? <ArrowUpRight size={12} color={color} />
              : <ArrowDownRight size={12} color={color} />
            }
          </div>
          <div className="text-right">
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color, lineHeight: 1 }}>
              {getCurrencySymbol(txn.currency)}{formatAmount(txn.amount, txn.currency)}
            </p>
          </div>
        </div>

        <ChevronRight size={14} color="#4A4870" />
      </div>
      {txn.notes && (
        <p style={{ color: '#4A4870', fontSize: '11px', fontFamily: 'system-ui', marginTop: '6px', paddingLeft: '52px' }} className="truncate">
          {txn.notes}
        </p>
      )}
    </div>
  );
}

export function ReceiptScanner({ onSelect, onClose }: ReceiptScannerProps) {
  const { accessToken, user } = useAuth();
  const userName = user?.user_metadata?.name ?? '';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [results, setResults] = useState<ScannedTransaction[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (JPG, PNG, WEBP, etc.)');
      setScanState('error');
      return;
    }

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setScanState('uploading');

    try {
      setScanState('scanning');
      const { base64, mimeType } = await compressImage(file);

      const res = await fetch(`${BASE}/scan-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-User-Token': accessToken ?? '',
        },
        body: JSON.stringify({ base64, mimeType, userName: userName ?? '' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Scan failed');

      const txns = (data.transactions ?? []) as ScannedTransaction[];
      if (txns.length === 0) {
        setErrorMsg('No transactions detected in this image. Try a clearer screenshot.');
        setScanState('error');
        return;
      }

      setResults(txns);
      setScanState('results');
    } catch (e: any) {
      console.error('Scan error:', e);
      setErrorMsg(e.message ?? 'Failed to scan image. Please try again.');
      setScanState('error');
    }
  }, [accessToken, userName]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const reset = () => {
    setScanState('idle');
    setPreviewUrl(null);
    setResults([]);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(6,5,15,0.85)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl flex flex-col"
        style={{
          background: '#0A091C',
          border: '1px solid #2D2A6E',
          borderBottom: 'none',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
          maxHeight: '90vh',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#2D2A6E' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid #1E1B4B' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-sm flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #0D2B26, #00FFD120)',
                border: '1px solid #00FFD140',
              }}
            >
              <Scan size={16} color="#00FFD1" />
            </div>
            <div>
              <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#E2E0FF' }}>
                SCAN RECEIPT
              </h2>
              <p style={{ color: '#4A4870', fontSize: '11px', fontFamily: 'system-ui' }}>
                AI-powered transaction detection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-sm flex items-center justify-center"
            style={{ background: '#13112E', border: '1px solid #2D2A6E' }}
          >
            <X size={16} color="#7A78A0" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ overscrollBehavior: 'contain' }}>

          {/* IDLE: Upload zone */}
          {scanState === 'idle' && (
            <div className="flex flex-col gap-4">
              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className="rounded-sm flex flex-col items-center justify-center gap-3 py-10 transition-all"
                style={{
                  border: `2px dashed ${dragOver ? '#00FFD1' : '#2D2A6E'}`,
                  background: dragOver ? 'rgba(0,255,209,0.04)' : '#13112E',
                  boxShadow: dragOver ? '0 0 20px rgba(0,255,209,0.1)' : 'none',
                }}
              >
                <div
                  className="w-16 h-16 rounded-sm flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #0D2B26, #1A3D36)',
                    border: '1px solid #00FFD130',
                  }}
                >
                  <Scan size={28} color="#00FFD1" style={{ filter: 'drop-shadow(0 0 8px #00FFD180)' }} />
                </div>
                <div className="text-center">
                  <p style={{ color: '#E2E0FF', fontSize: '14px', fontFamily: 'system-ui', fontWeight: 600 }}>
                    Drop your screenshot here
                  </p>
                  <p style={{ color: '#4A4870', fontSize: '12px', fontFamily: 'system-ui', marginTop: '4px' }}>
                    Bank statement, receipt, e-wallet history...
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 py-5 rounded-sm active:scale-95 transition-transform"
                  style={{
                    background: '#13112E',
                    border: '1px solid #2D2A6E',
                  }}
                >
                  <Camera size={22} color="#8B5CF6" />
                  <span style={{ color: '#E2E0FF', fontSize: '12px', fontFamily: 'system-ui', fontWeight: 600 }}>
                    Take Photo
                  </span>
                  <span style={{ color: '#4A4870', fontSize: '10px', fontFamily: 'system-ui' }}>
                    Use camera
                  </span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 py-5 rounded-sm active:scale-95 transition-transform"
                  style={{
                    background: '#13112E',
                    border: '1px solid #2D2A6E',
                  }}
                >
                  <Upload size={22} color="#00FFD1" />
                  <span style={{ color: '#E2E0FF', fontSize: '12px', fontFamily: 'system-ui', fontWeight: 600 }}>
                    Upload Image
                  </span>
                  <span style={{ color: '#4A4870', fontSize: '10px', fontFamily: 'system-ui' }}>
                    From gallery
                  </span>
                </button>
              </div>

              <p style={{ color: '#2D2A6E', fontSize: '11px', fontFamily: 'system-ui', textAlign: 'center' }}>
                Supports JPG, PNG, WEBP — works with any financial screenshot
              </p>
            </div>
          )}

          {/* SCANNING STATE */}
          {(scanState === 'uploading' || scanState === 'scanning') && (
            <div className="flex flex-col gap-4">
              {/* Preview with scan overlay */}
              {previewUrl && (
                <div className="relative rounded-sm overflow-hidden" style={{ border: '1px solid #00FFD130' }}>
                  <img
                    src={previewUrl}
                    alt="Scanning"
                    className="w-full object-cover"
                    style={{ maxHeight: '240px', objectPosition: 'top', filter: 'brightness(0.7)' }}
                  />
                  <ScanLine />
                  {/* Corner brackets */}
                  {[
                    { top: '8px', left: '8px', borderTop: '2px solid #00FFD1', borderLeft: '2px solid #00FFD1' },
                    { top: '8px', right: '8px', borderTop: '2px solid #00FFD1', borderRight: '2px solid #00FFD1' },
                    { bottom: '8px', left: '8px', borderBottom: '2px solid #00FFD1', borderLeft: '2px solid #00FFD1' },
                    { bottom: '8px', right: '8px', borderBottom: '2px solid #00FFD1', borderRight: '2px solid #00FFD1' },
                  ].map((style, i) => (
                    <div
                      key={i}
                      className="absolute w-5 h-5"
                      style={{ ...style, boxSizing: 'border-box' }}
                    />
                  ))}
                </div>
              )}

              {/* Status */}
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex items-center gap-3">
                  <RefreshCw size={18} color="#00FFD1" className="animate-spin" />
                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#00FFD1' }}>
                    {scanState === 'uploading' ? 'PROCESSING...' : 'READING IMAGE...'}
                  </span>
                </div>
                <p style={{ color: '#4A4870', fontSize: '12px', fontFamily: 'system-ui' }}>
                  {scanState === 'uploading'
                    ? 'Compressing and uploading your image'
                    : 'AI is scanning for transactions...'}
                </p>

                {/* Progress dots */}
                <div className="flex gap-2 mt-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: '#00FFD1',
                        animation: `pulse-glow 1.2s ease ${i * 0.3}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {scanState === 'error' && (
            <div className="flex flex-col gap-4">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Upload"
                  className="w-full rounded-sm object-cover"
                  style={{ maxHeight: '200px', objectPosition: 'top', opacity: 0.5, border: '1px solid #FF4D8D30' }}
                />
              )}
              <div
                className="rounded-sm p-4 flex items-start gap-3"
                style={{ background: '#2D1A1A', border: '1px solid #FF4D8D40' }}
              >
                <AlertTriangle size={18} color="#FF4D8D" className="flex-shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: '#FF4D8D', fontSize: '12px', fontFamily: "'Press Start 2P', monospace", marginBottom: '6px' }}>
                    SCAN FAILED
                  </p>
                  <p style={{ color: '#7A78A0', fontSize: '13px', fontFamily: 'system-ui', lineHeight: 1.5 }}>
                    {errorMsg}
                  </p>
                </div>
              </div>
              <button
                onClick={reset}
                className="w-full py-3 rounded-sm flex items-center justify-center gap-2"
                style={{
                  background: '#1E1B4B',
                  border: '1px solid #2D2A6E',
                  color: '#E2E0FF',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={14} />
                TRY AGAIN
              </button>
            </div>
          )}

          {/* RESULTS STATE */}
          {scanState === 'results' && (
            <div className="flex flex-col gap-3">
              {/* Preview thumbnail */}
              {previewUrl && (
                <div className="flex items-center gap-3">
                  <img
                    src={previewUrl}
                    alt="Scanned"
                    className="rounded-sm object-cover flex-shrink-0"
                    style={{ width: '56px', height: '56px', objectPosition: 'top', border: '1px solid #00FFD130' }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 size={14} color="#00FFD1" />
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#00FFD1' }}>
                        SCAN COMPLETE
                      </span>
                    </div>
                    <p style={{ color: '#7A78A0', fontSize: '12px', fontFamily: 'system-ui' }}>
                      Found <strong style={{ color: '#E2E0FF' }}>{results.length}</strong> transaction{results.length !== 1 ? 's' : ''} — tap one to import
                    </p>
                  </div>
                  <button
                    onClick={reset}
                    className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
                    style={{ background: '#13112E', border: '1px solid #2D2A6E' }}
                  >
                    <RefreshCw size={13} color="#7A78A0" />
                  </button>
                </div>
              )}

              <div style={{ height: '1px', background: '#1E1B4B' }} />

              {/* Transaction cards */}
              <div className="flex flex-col gap-2">
                {results.map((txn, i) => (
                  <TransactionCard
                    key={i}
                    txn={txn}
                    index={i}
                    onSelect={() => onSelect(txn)}
                  />
                ))}
              </div>

              <p style={{ color: '#2D2A6E', fontSize: '11px', fontFamily: 'system-ui', textAlign: 'center', marginTop: '4px' }}>
                Tap a transaction to pre-fill the form · Review before saving
              </p>
            </div>
          )}
        </div>

        {/* Bottom safe area */}
        <div className="flex-shrink-0" style={{ height: 'env(safe-area-inset-bottom, 16px)', minHeight: '16px' }} />
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}