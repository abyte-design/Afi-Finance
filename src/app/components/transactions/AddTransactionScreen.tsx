import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  ChevronLeft, CheckCircle2, Scan,
  UtensilsCrossed, ShoppingBag, Car, Zap, Gamepad2, Heart,
  Plane, BookOpen, Briefcase, Code2, TrendingUp, Gift, Circle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { api } from '../../lib/api';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, today, getCurrencyConfig, sanitizeAmountInput } from '../../lib/utils';
import { ReceiptScanner, ScannedTransaction } from './ReceiptScanner';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  UtensilsCrossed, ShoppingBag, Car, Zap, Gamepad2, Heart,
  Plane, BookOpen, Briefcase, Code2, TrendingUp, Gift, Circle,
};

export function AddTransactionScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { accessToken } = useAuth();
  const { currency } = useCurrency();

  const initialType = (searchParams.get('type') as 'income' | 'expense') || 'expense';
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const accentColor = type === 'income' ? '#00E57E' : '#FF4D8D';
  const currencyConfig = getCurrencyConfig(currency);

  // Dynamically shrink font as the number grows so it always fits
  const amountFontSize = (() => {
    const len = amount.length;
    if (len <= 9)  return '28px';
    if (len <= 12) return '22px';
    if (len <= 15) return '17px';
    return '13px';
  })();

  const handleAmountChange = (val: string) => {
    setAmount(sanitizeAmountInput(val, currency));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // For integer currencies the display value has dot separators (e.g. 13.800.000)
    // Strip all dots first, then parse
    const rawAmount = currencyConfig.isInteger
      ? parseInt(amount.replace(/\./g, ''), 10)
      : parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(rawAmount) || rawAmount <= 0) { setError('Enter a valid amount'); return; }
    if (!title.trim()) { setError('Enter a title'); return; }
    if (!category) { setError('Select a category'); return; }
    setLoading(true); setError('');
    try {
      await api.transactions.create(accessToken!, { type, amount: rawAmount, title: title.trim(), category, date, notes });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleScanResult = (txn: ScannedTransaction) => {
    setShowScanner(false);
    setType(txn.type);
    setCategory(txn.category);
    setTitle(txn.title);
    setDate(txn.date || today());
    setNotes(txn.notes || '');
    // Format amount using the currency in context (user's chosen currency)
    const currCfg = getCurrencyConfig(currency);
    if (currCfg.isInteger) {
      const rounded = Math.round(txn.amount);
      setAmount(sanitizeAmountInput(String(rounded), currency));
    } else {
      setAmount(String(txn.amount));
    }
  };

  if (success) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-8" style={{ background: '#0A091C' }}>
        <CheckCircle2 size={64} color={accentColor} style={{ filter: `drop-shadow(0 0 20px ${accentColor})` }} />
        <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '12px', color: accentColor, marginTop: '24px', textAlign: 'center' }}>
          SAVED!
        </h2>
        <p style={{ color: '#7A78A0', fontSize: '13px', fontFamily: 'system-ui', marginTop: '8px' }}>
          Transaction recorded successfully
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#0A091C' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-4"
        style={{ borderBottom: '1px solid #2D2A6E' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-sm"
          style={{ background: '#13112E', border: '1px solid #2D2A6E' }}
        >
          <ChevronLeft size={18} color="#7A78A0" />
        </button>
        <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color: '#E2E0FF' }} className="flex-1">
          ADD TRANSACTION
        </h1>
        {/* Scan button */}
        <button
          onClick={() => setShowScanner(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-sm active:scale-95 transition-transform"
          style={{
            background: 'linear-gradient(135deg, #0D2B26, #1A3D36)',
            border: '1px solid #00FFD150',
            boxShadow: '0 0 10px rgba(0,255,209,0.1)',
          }}
        >
          <Scan size={15} color="#00FFD1" />
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#00FFD1' }}>
            SCAN
          </span>
        </button>
      </div>

      {/* Type Toggle */}
      <div className="px-4 pt-5">
        <div
          className="flex rounded-sm overflow-hidden"
          style={{ background: '#13112E', border: '1px solid #2D2A6E', padding: '3px' }}
        >
          {(['income', 'expense'] as const).map((t) => {
            const active = type === t;
            const color = t === 'income' ? '#00E57E' : '#FF4D8D';
            return (
              <button
                key={t}
                onClick={() => { setType(t); setCategory(''); }}
                className="flex-1 py-3 rounded-sm transition-all flex items-center justify-center gap-2"
                style={{
                  background: active ? `${color}18` : 'transparent',
                  border: active ? `1px solid ${color}50` : '1px solid transparent',
                  boxShadow: active ? `0 0 10px ${color}20` : 'none',
                }}
              >
                <span style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '9px',
                  color: active ? color : '#4A4870',
                  textShadow: active ? `0 0 8px ${color}80` : 'none',
                }}>
                  {t === 'income' ? '▲ INCOME' : '▼ EXPENSE'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 pt-6 pb-10">
        {/* Amount */}
        <div
          className="flex flex-col items-center py-6 rounded-sm"
          style={{
            background: '#13112E',
            border: `1px solid ${accentColor}30`,
            boxShadow: `0 0 20px ${accentColor}10`,
          }}
        >
          <span style={{ color: '#4A4870', fontSize: '11px', fontFamily: "'Press Start 2P', monospace", marginBottom: '8px' }}>
            AMOUNT
          </span>
          {/* Scrollable row so very long numbers slide left-to-right */}
          <div
            className="flex items-center w-full px-4"
            style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
          >
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: amountFontSize, color: accentColor, flexShrink: 0 }}>
              {currencyConfig.symbol}
            </span>
            <input
              type="text"
              inputMode={currencyConfig.inputMode}
              value={amount}
              onChange={e => handleAmountChange(e.target.value)}
              placeholder={currencyConfig.placeholder}
              className="outline-none text-center bg-transparent flex-1 min-w-0"
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: amountFontSize,
                color: amount ? accentColor : '#2D2A6E',
                textShadow: amount ? `0 0 15px ${accentColor}60` : 'none',
                transition: 'font-size 0.15s ease',
              }}
            />
          </div>
          {currencyConfig.isInteger && (
            <span style={{ color: '#4A4870', fontSize: '9px', fontFamily: 'system-ui', marginTop: '6px' }}>
              whole numbers only (no decimals)
            </span>
          )}
        </div>

        {/* Title */}
        <div>
          <label style={{ color: '#7A78A0', fontSize: '9px', fontFamily: "'Press Start 2P', monospace", display: 'block', marginBottom: '8px' }}>
            TITLE
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Monthly salary, Coffee..."
            className="w-full outline-none"
            style={{
              background: '#13112E',
              border: '1px solid #2D2A6E',
              borderRadius: '2px',
              padding: '12px 14px',
              color: '#E2E0FF',
              fontSize: '14px',
              fontFamily: 'system-ui',
            }}
            onFocus={e => e.target.style.borderColor = accentColor}
            onBlur={e => e.target.style.borderColor = '#2D2A6E'}
          />
        </div>

        {/* Category */}
        <div>
          <label style={{ color: '#7A78A0', fontSize: '9px', fontFamily: "'Press Start 2P', monospace", display: 'block', marginBottom: '10px' }}>
            CATEGORY
          </label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => {
              const Icon = ICON_MAP[cat.icon] || Circle;
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-sm transition-all active:scale-95"
                  style={{
                    background: active ? `${cat.color}20` : '#13112E',
                    border: active ? `1px solid ${cat.color}` : '1px solid #2D2A6E',
                    boxShadow: active ? `0 0 10px ${cat.color}30` : 'none',
                  }}
                >
                  <Icon size={18} color={active ? cat.color : '#4A4870'} />
                  <span style={{
                    fontSize: '8px',
                    color: active ? cat.color : '#4A4870',
                    fontFamily: 'system-ui',
                    fontWeight: 600,
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date */}
        <div>
          <label style={{ color: '#7A78A0', fontSize: '9px', fontFamily: "'Press Start 2P', monospace", display: 'block', marginBottom: '8px' }}>
            DATE
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full outline-none"
            style={{
              background: '#13112E',
              border: '1px solid #2D2A6E',
              borderRadius: '2px',
              padding: '12px 14px',
              color: '#E2E0FF',
              fontSize: '14px',
              fontFamily: 'system-ui',
              colorScheme: 'dark',
            }}
          />
        </div>

        {/* Notes */}
        <div>
          <label style={{ color: '#7A78A0', fontSize: '9px', fontFamily: "'Press Start 2P', monospace", display: 'block', marginBottom: '8px' }}>
            NOTES (OPTIONAL)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            className="w-full outline-none resize-none"
            style={{
              background: '#13112E',
              border: '1px solid #2D2A6E',
              borderRadius: '2px',
              padding: '12px 14px',
              color: '#E2E0FF',
              fontSize: '14px',
              fontFamily: 'system-ui',
            }}
            onFocus={e => e.target.style.borderColor = accentColor}
            onBlur={e => e.target.style.borderColor = '#2D2A6E'}
          />
        </div>

        {error && (
          <p style={{ color: '#FF4D8D', fontSize: '11px', fontFamily: 'system-ui', textAlign: 'center' }}>{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-sm transition-all active:scale-98 flex items-center justify-center gap-2"
          style={{
            background: loading ? '#1E1B4B' : `linear-gradient(135deg, ${type === 'income' ? '#00A896, #00E57E' : '#C62A6B, #FF4D8D'})`,
            border: `1px solid ${accentColor}50`,
            boxShadow: `0 0 20px ${accentColor}30`,
            color: type === 'income' ? '#0A091C' : '#fff',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '10px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'SAVING...' : `SAVE ${type === 'income' ? 'INCOME' : 'EXPENSE'}`}
        </button>
      </form>

      {/* Receipt Scanner Modal */}
      {showScanner && (
        <ReceiptScanner
          onSelect={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}