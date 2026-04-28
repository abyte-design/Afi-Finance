import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Zap, Trophy, Target, Share2, Download, X, Instagram } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Transaction } from '../../lib/types';
import { formatCurrency, formatCurrencyCompact, getLast12Months, CHART_COLORS, CATEGORY_COLORS, computeMonthlyStats } from '../../lib/utils';
import { useCurrency } from '../../context/CurrencyContext';

const CustomBarTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1E1B4B', border: '1px solid #2D2A6E', borderRadius: '2px', padding: '8px 12px' }}>
      <p style={{ color: '#7A78A0', fontSize: '10px', marginBottom: '4px' }}>{label}</p>
      <p style={{ color: '#00E57E', fontSize: '10px' }}>+{formatCurrency(payload[0]?.value || 0, currency)}</p>
      <p style={{ color: '#FF4D8D', fontSize: '10px' }}>-{formatCurrency(payload[1]?.value || 0, currency)}</p>
    </div>
  );
};

const CustomPieTooltip = ({ active, payload, currency }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1E1B4B', border: '1px solid #2D2A6E', borderRadius: '2px', padding: '8px 12px' }}>
      <p style={{ color: '#E2E0FF', fontSize: '11px' }}>{payload[0].name}</p>
      <p style={{ color: payload[0].fill, fontSize: '11px' }}>{formatCurrency(payload[0].value, currency)}</p>
    </div>
  );
};

function InsightCard({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-sm"
      style={{ background: `${color}10`, border: `1px solid ${color}30` }}
    >
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <p style={{ color: '#E2E0FF', fontSize: '12px', fontFamily: 'system-ui', lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}

// --- Instagram Share Card Generator ---
function generateShareCard(
  monthlyIncome: number,
  monthlyExpenses: number,
  savingsRate: number,
  topCategory: { name: string; value: number } | undefined,
  userName: string,
  currency: string
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    // Instagram Stories: 1080x1920
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d')!;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
    bgGrad.addColorStop(0, '#0A091C');
    bgGrad.addColorStop(0.5, '#13112E');
    bgGrad.addColorStop(1, '#0A091C');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Pixel grid dots
    ctx.fillStyle = 'rgba(124,58,237,0.08)';
    for (let x = 0; x < 1080; x += 40) {
      for (let y = 0; y < 1920; y += 40) {
        ctx.fillRect(x, y, 3, 3);
      }
    }

    // Top accent line
    const topGrad = ctx.createLinearGradient(0, 0, 1080, 0);
    topGrad.addColorStop(0, '#7C3AED');
    topGrad.addColorStop(0.5, '#00FFD1');
    topGrad.addColorStop(1, '#FF4D8D');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, 1080, 8);

    // Purple glow circle (top)
    const glowGrad = ctx.createRadialGradient(540, 200, 0, 540, 200, 400);
    glowGrad.addColorStop(0, 'rgba(124,58,237,0.25)');
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, 1080, 600);

    // AFI Logo
    ctx.textAlign = 'center';
    ctx.font = 'bold 72px monospace';
    ctx.fillStyle = '#8B5CF6';
    ctx.shadowColor = '#7C3AED';
    ctx.shadowBlur = 40;
    ctx.fillText('AFI', 540, 200);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = '32px sans-serif';
    ctx.fillStyle = '#7A78A0';
    ctx.fillText('MY FINANCIAL SNAPSHOT', 540, 260);

    // Divider
    ctx.fillStyle = '#2D2A6E';
    ctx.fillRect(80, 300, 920, 2);

    // Month label
    const now = new Date();
    const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    ctx.font = '36px monospace';
    ctx.fillStyle = '#4A4870';
    ctx.fillText(monthLabel, 540, 370);

    // Helper: draw card
    const drawCard = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = '#13112E';
      ctx.strokeStyle = color + '50';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.fill();
      ctx.stroke();
      // glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    // Income card
    drawCard(80, 420, 440, 260, '#00E57E');
    ctx.textAlign = 'center';
    ctx.font = '28px monospace';
    ctx.fillStyle = '#7A78A0';
    ctx.fillText('INCOME', 300, 490);
    ctx.font = 'bold 52px monospace';
    ctx.fillStyle = '#00E57E';
    ctx.shadowColor = '#00E57E';
    ctx.shadowBlur = 20;
    ctx.fillText(formatCurrencyCompact(monthlyIncome, currency), 300, 570);
    ctx.shadowBlur = 0;
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#4A4870';
    ctx.fillText('this month', 300, 620);

    // Expenses card
    drawCard(560, 420, 440, 260, '#FF4D8D');
    ctx.font = '28px monospace';
    ctx.fillStyle = '#7A78A0';
    ctx.fillText('EXPENSES', 780, 490);
    ctx.font = 'bold 52px monospace';
    ctx.fillStyle = '#FF4D8D';
    ctx.shadowColor = '#FF4D8D';
    ctx.shadowBlur = 20;
    ctx.fillText(formatCurrencyCompact(monthlyExpenses, currency), 780, 570);
    ctx.shadowBlur = 0;
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#4A4870';
    ctx.fillText('this month', 780, 620);

    // Net savings card
    const net = monthlyIncome - monthlyExpenses;
    const netColor = net >= 0 ? '#00E57E' : '#FF4D8D';
    drawCard(80, 710, 920, 220, '#8B5CF6');
    ctx.textAlign = 'center';
    ctx.font = '28px monospace';
    ctx.fillStyle = '#7A78A0';
    ctx.fillText('NET SAVINGS', 540, 780);
    ctx.font = 'bold 72px monospace';
    ctx.fillStyle = netColor;
    ctx.shadowColor = netColor;
    ctx.shadowBlur = 30;
    ctx.fillText(formatCurrencyCompact(Math.abs(net), currency), 540, 880);
    ctx.shadowBlur = 0;

    // Savings rate bar
    drawCard(80, 960, 920, 180, '#7C3AED');
    ctx.textAlign = 'left';
    ctx.font = '28px monospace';
    ctx.fillStyle = '#7A78A0';
    ctx.fillText('SAVINGS RATE', 120, 1020);
    ctx.textAlign = 'right';
    ctx.font = 'bold 36px monospace';
    const rateColor = savingsRate >= 20 ? '#00E57E' : savingsRate >= 0 ? '#F59E0B' : '#FF4D8D';
    ctx.fillStyle = rateColor;
    ctx.fillText(`${savingsRate.toFixed(1)}%`, 960, 1020);

    // Progress bar background
    ctx.fillStyle = '#0E0C2A';
    ctx.fillRect(120, 1050, 840, 20);
    // Progress bar fill
    const pct = Math.max(0, Math.min(savingsRate, 100)) / 100;
    const barGrad = ctx.createLinearGradient(120, 0, 120 + 840 * pct, 0);
    barGrad.addColorStop(0, '#7C3AED');
    barGrad.addColorStop(1, '#00FFD1');
    ctx.fillStyle = barGrad;
    ctx.fillRect(120, 1050, 840 * pct, 20);

    // Top category
    if (topCategory) {
      drawCard(80, 1170, 920, 160, '#F59E0B');
      ctx.textAlign = 'left';
      ctx.font = '26px monospace';
      ctx.fillStyle = '#7A78A0';
      ctx.fillText('TOP CATEGORY', 120, 1230);
      ctx.font = 'bold 40px monospace';
      ctx.fillStyle = '#F59E0B';
      ctx.fillText(topCategory.name, 120, 1290);
      ctx.textAlign = 'right';
      ctx.font = 'bold 40px monospace';
      ctx.fillStyle = '#E2E0FF';
      ctx.fillText(formatCurrencyCompact(topCategory.value, currency), 960, 1290);
    }

    // Achievement badges
    const badges: { emoji: string; label: string; color: string }[] = [];
    if (savingsRate >= 20) badges.push({ emoji: '🏆', label: 'SUPER SAVER', color: '#F59E0B' });
    if (net > 0) badges.push({ emoji: '✨', label: 'IN THE GREEN', color: '#00E57E' });
    if (savingsRate >= 30) badges.push({ emoji: '💎', label: 'FINANCE BOSS', color: '#00FFD1' });

    if (badges.length > 0) {
      let bx = 80;
      badges.slice(0, 3).forEach((badge) => {
        const bw = 280;
        drawCard(bx, 1360, bw, 100, badge.color);
        ctx.textAlign = 'center';
        ctx.font = '36px sans-serif';
        ctx.fillStyle = '#E2E0FF';
        ctx.fillText(badge.emoji, bx + bw / 2, 1410);
        ctx.font = '18px monospace';
        ctx.fillStyle = badge.color;
        ctx.fillText(badge.label, bx + bw / 2, 1445);
        bx += bw + 20;
      });
    }

    // User name
    ctx.textAlign = 'center';
    ctx.font = '36px monospace';
    ctx.fillStyle = '#8B5CF6';
    ctx.shadowColor = '#7C3AED';
    ctx.shadowBlur = 15;
    ctx.fillText(`@${userName}`, 540, 1560);
    ctx.shadowBlur = 0;

    // Bottom tag
    ctx.font = '28px monospace';
    ctx.fillStyle = '#2D2A6E';
    ctx.fillText('Track your finances with AFI', 540, 1650);

    // Pixel decorations
    const pixelColors = ['#7C3AED', '#00FFD1', '#FF4D8D', '#F59E0B', '#00E57E'];
    for (let i = 0; i < 20; i++) {
      const px = 80 + (i % 5) * 184;
      const py = 1720 + Math.floor(i / 5) * 40;
      ctx.fillStyle = pixelColors[i % 5];
      ctx.shadowColor = pixelColors[i % 5];
      ctx.shadowBlur = 8;
      ctx.fillRect(px, py, 12, 12);
    }
    ctx.shadowBlur = 0;

    // Bottom accent line
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 1912, 1080, 8);

    resolve(canvas.toDataURL('image/png'));
  });
}

interface ShareModalProps {
  imageDataUrl: string;
  onClose: () => void;
  userName: string;
}

function ShareModal({ imageDataUrl, onClose, userName }: ShareModalProps) {
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleNativeShare = async () => {
    setSharing(true);
    try {
      const res = await fetch(imageDataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'afi-analytics.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My AFI Financial Snapshot',
          text: `Check out my financial stats on AFI! 💜 #AFI #PersonalFinance #FinTech`,
        });
      } else {
        handleDownload();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') handleDownload();
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageDataUrl;
    a.download = `afi-snapshot-${new Date().toISOString().split('T')[0]}.png`;
    a.click();
  };

  const handleInstagramStories = () => {
    // Download first, then open Instagram
    handleDownload();
    setTimeout(() => {
      // Try Instagram deep link (works on mobile)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = 'instagram://camera';
      } else {
        window.open('https://www.instagram.com/', '_blank');
      }
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(6,5,15,0.92)' }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-2xl flex flex-col"
        style={{
          maxWidth: '430px',
          background: '#13112E',
          border: '1px solid #2D2A6E',
          borderBottom: 'none',
          maxHeight: '90vh',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: '40px', height: '4px', background: '#2D2A6E', borderRadius: '2px' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #2D2A6E' }}>
          <div>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#E2E0FF' }}>
              SHARE STATS
            </span>
            <p style={{ color: '#4A4870', fontSize: '11px', fontFamily: 'system-ui', marginTop: '4px' }}>
              Flex your finances 💜
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-sm" style={{ background: '#0E0C2A', border: '1px solid #2D2A6E' }}>
            <X size={18} color="#7A78A0" />
          </button>
        </div>

        {/* Preview */}
        <div className="px-5 py-4 overflow-y-auto flex-1">
          <div
            className="rounded-sm overflow-hidden mb-4"
            style={{ border: '1px solid #2D2A6E', boxShadow: '0 0 20px rgba(124,58,237,0.2)' }}
          >
            <img src={imageDataUrl} alt="Share preview" style={{ width: '100%', display: 'block' }} />
          </div>

          {/* Caption hint */}
          <div
            className="p-3 rounded-sm mb-4"
            style={{ background: '#0E0C2A', border: '1px solid #2D2A6E' }}
          >
            <p style={{ color: '#4A4870', fontSize: '10px', fontFamily: 'system-ui', marginBottom: '4px' }}>Suggested caption:</p>
            <p style={{ color: '#7A78A0', fontSize: '12px', fontFamily: 'system-ui', lineHeight: 1.5 }}>
              Just checked my finances on AFI 🎮💜 Staying on top of my money game! #AFI #PersonalFinance #FinanceGoals #MoneyMindset
            </p>
          </div>

          {/* Share buttons */}
          <div className="flex flex-col gap-3 pb-6">
            {/* Instagram Stories */}
            <button
              onClick={handleInstagramStories}
              className="w-full py-4 rounded-sm flex items-center justify-center gap-3 transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)',
                border: 'none',
                boxShadow: '0 0 20px rgba(225,48,108,0.4)',
              }}
            >
              <Instagram size={20} color="#fff" />
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#fff' }}>
                INSTAGRAM STORIES
              </span>
            </button>

            {/* Native Share */}
            <button
              onClick={handleNativeShare}
              disabled={sharing}
              className="w-full py-4 rounded-sm flex items-center justify-center gap-3 transition-all active:scale-95"
              style={{
                background: sharing ? '#1E1B4B' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                border: '1px solid rgba(139,92,246,0.5)',
                boxShadow: '0 0 15px rgba(124,58,237,0.3)',
              }}
            >
              <Share2 size={20} color="#fff" />
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#fff' }}>
                {sharing ? 'SHARING...' : 'SHARE IMAGE'}
              </span>
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="w-full py-4 rounded-sm flex items-center justify-center gap-3 transition-all active:scale-95"
              style={{
                background: 'rgba(0,255,209,0.08)',
                border: '1px solid rgba(0,255,209,0.3)',
              }}
            >
              <Download size={20} color="#00FFD1" />
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#00FFD1' }}>
                DOWNLOAD PNG
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsScreen() {
  const { accessToken, user } = useAuth();
  const { currency } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'player';

  useEffect(() => {
    if (accessToken) loadData();
  }, [accessToken]);

  const loadData = async () => {
    try {
      const data = await api.transactions.getAll(accessToken!);
      setTransactions(data.transactions || []);
    } catch (err) { console.error('Analytics load error:', err); }
    finally { setLoading(false); }
  };

  const { monthlyIncome, monthlyExpenses, savingsRate } = computeMonthlyStats(transactions);

  const chartData = useMemo(() => getLast12Months().map(({ year, month, label }) => {
    const monthTxns = transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getMonth() === month && d.getFullYear() === year;
    });
    return {
      label,
      income: monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expenses: monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  }), [transactions]);

  const categoryData = useMemo(() => {
    const now = new Date();
    const cats: Record<string, number> = {};
    transactions
      .filter(t => {
        const d = new Date(t.date + 'T00:00:00');
        return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .forEach(t => { cats[t.category] = (cats[t.category] || 0) + t.amount; });
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const prevMonthData = useMemo(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    const pm = transactions.filter(t => {
      const td = new Date(t.date + 'T00:00:00');
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    const pmExpenses = pm.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { pmExpenses };
  }, [transactions]);

  const expenseChange = prevMonthData.pmExpenses > 0
    ? ((monthlyExpenses - prevMonthData.pmExpenses) / prevMonthData.pmExpenses) * 100 : 0;

  const topCategory = categoryData[0];

  const insights = [
    topCategory && {
      icon: <Target size={16} color="#8B5CF6" />,
      text: `${topCategory.name} is your top expense this month at ${formatCurrency(topCategory.value, currency)}.`,
      color: '#8B5CF6',
    },
    expenseChange !== 0 && {
      icon: expenseChange > 0 ? <TrendingUp size={16} color="#FF4D8D" /> : <TrendingDown size={16} color="#00E57E" />,
      text: `You spent ${Math.abs(expenseChange).toFixed(0)}% ${expenseChange > 0 ? 'more' : 'less'} than last month.`,
      color: expenseChange > 0 ? '#FF4D8D' : '#00E57E',
    },
    savingsRate > 0 && {
      icon: <Trophy size={16} color="#F59E0B" />,
      text: `You're saving ${savingsRate.toFixed(0)}% of your income this month. Keep it up!`,
      color: '#F59E0B',
    },
    monthlyIncome > 0 && monthlyExpenses < monthlyIncome && {
      icon: <Zap size={16} color="#00FFD1" />,
      text: `Net this month: ${formatCurrency(monthlyIncome - monthlyExpenses, currency)}. You're in the green!`,
      color: '#00FFD1',
    },
  ].filter(Boolean) as { icon: React.ReactNode; text: string; color: string }[];

  const handleShare = async () => {
    setGenerating(true);
    try {
      const dataUrl = await generateShareCard(monthlyIncome, monthlyExpenses, savingsRate, topCategory, userName, currency);
      setShareImageUrl(dataUrl);
    } catch (err) {
      console.error('Share card generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const Skeleton = () => (
    <div className="h-32 rounded-sm animate-pulse" style={{ background: '#13112E' }} />
  );

  return (
    <div className="flex flex-col min-h-full p-4 gap-5" style={{ background: '#0A091C' }}>
      <div className="pt-2 flex items-start justify-between">
        <div>
          <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '12px', color: '#E2E0FF' }}>
            ANALYTICS
          </h1>
          <p style={{ color: '#4A4870', fontSize: '11px', fontFamily: 'system-ui', marginTop: '6px' }}>
            Current month overview
          </p>
        </div>

        {/* Instagram Share button */}
        <button
          onClick={handleShare}
          disabled={generating || transactions.length === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-sm transition-all active:scale-95"
          style={{
            background: generating ? '#1E1B4B' : 'linear-gradient(135deg, #833AB4, #E1306C)',
            border: 'none',
            boxShadow: transactions.length > 0 ? '0 0 15px rgba(225,48,108,0.4)' : 'none',
            opacity: transactions.length === 0 ? 0.4 : 1,
            cursor: transactions.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {generating ? (
            <span style={{ color: '#7A78A0', fontSize: '9px', fontFamily: "'Press Start 2P', monospace" }}>...</span>
          ) : (
            <>
              <Instagram size={14} color="#fff" />
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#fff' }}>
                SHARE
              </span>
            </>
          )}
        </button>
      </div>

      {loading ? (
        <><Skeleton /><Skeleton /><Skeleton /></>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'INCOME', value: monthlyIncome, color: '#00E57E' },
              { label: 'SPENT', value: monthlyExpenses, color: '#FF4D8D' },
              { label: 'SAVED', value: Math.max(monthlyIncome - monthlyExpenses, 0), color: '#8B5CF6' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="p-3 rounded-sm flex flex-col gap-1 min-w-0 overflow-hidden"
                style={{ background: '#13112E', border: `1px solid ${color}25`, boxShadow: `0 0 10px ${color}10` }}
              >
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#7A78A0' }}>{label}</span>
                <span
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '9px',
                    color,
                    lineHeight: 1.4,
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={formatCurrency(value, currency)}
                >
                  {formatCurrencyCompact(value, currency)}
                </span>
              </div>
            ))}
          </div>

          {/* Savings Rate */}
          <div className="p-4 rounded-sm" style={{ background: '#13112E', border: '1px solid #2D2A6E' }}>
            <div className="flex justify-between items-center mb-3">
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#7A78A0' }}>SAVINGS RATE</span>
              <span style={{
                fontFamily: "'Press Start 2P', monospace", fontSize: '12px',
                color: savingsRate >= 20 ? '#00E57E' : savingsRate >= 0 ? '#F59E0B' : '#FF4D8D',
                textShadow: `0 0 10px ${savingsRate >= 20 ? '#00E57E' : savingsRate >= 0 ? '#F59E0B' : '#FF4D8D'}60`,
              }}>
                {savingsRate.toFixed(1)}%
              </span>
            </div>
            <div className="rounded-sm overflow-hidden" style={{ height: '10px', background: '#0E0C2A', border: '1px solid #2D2A6E' }}>
              <div
                className="h-full transition-all duration-700"
                style={{
                  width: `${Math.max(0, Math.min(savingsRate, 100))}%`,
                  background: savingsRate >= 20 ? 'linear-gradient(90deg, #00A896, #00E57E)' : savingsRate >= 0 ? 'linear-gradient(90deg, #B45309, #F59E0B)' : 'linear-gradient(90deg, #C62A6B, #FF4D8D)',
                  boxShadow: `0 0 8px ${savingsRate >= 20 ? '#00E57E' : '#F59E0B'}`,
                }}
              />
            </div>
            <p style={{ color: '#4A4870', fontSize: '10px', fontFamily: 'system-ui', marginTop: '6px' }}>
              {savingsRate >= 20 ? '🏆 Excellent savings!' : savingsRate >= 10 ? '📈 Good progress!' : savingsRate > 0 ? '💡 Try to save more' : '⚠️ Spending exceeds income'}
            </p>
          </div>

          {/* Monthly Bar Chart */}
          <div className="p-4 rounded-sm" style={{ background: '#13112E', border: '1px solid #2D2A6E' }}>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#7A78A0', display: 'block', marginBottom: '16px' }}>
              INCOME vs EXPENSES — 1 YEAR
            </span>
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div style={{ width: '10px', height: '10px', background: '#00E57E', boxShadow: '0 0 5px #00E57E' }} />
                <span style={{ color: '#7A78A0', fontSize: '10px', fontFamily: 'system-ui' }}>Income</span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ width: '10px', height: '10px', background: '#FF4D8D', boxShadow: '0 0 5px #FF4D8D' }} />
                <span style={{ color: '#7A78A0', fontSize: '10px', fontFamily: 'system-ui' }}>Expenses</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barGap={3} barCategoryGap="25%" id="afi-analytics-chart">
                <XAxis key="xaxis" dataKey="label" tick={{ fill: '#4A4870', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip key="tooltip" content={<CustomBarTooltip currency={currency} />} cursor={{ fill: 'rgba(124,58,237,0.05)' }} />
                <Bar key="bar-income" name="Income" dataKey="income" fill="#00E57E" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                <Bar key="bar-expenses" name="Expenses" dataKey="expenses" fill="#FF4D8D" radius={[2, 2, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Donut */}
          {categoryData.length > 0 && (
            <div className="p-4 rounded-sm" style={{ background: '#13112E', border: '1px solid #2D2A6E' }}>
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#7A78A0', display: 'block', marginBottom: '16px' }}>
                SPENDING BY CATEGORY
              </span>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {categoryData.map((entry, i) => (
                      <Cell
                        key={`cell-${entry.name}-${i}`}
                        fill={CATEGORY_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip currency={currency} />} />
                  <Legend
                    formatter={(value) => <span style={{ color: '#7A78A0', fontSize: '10px', fontFamily: 'system-ui' }}>{value}</span>}
                    iconSize={8}
                    iconType="square"
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex flex-col gap-2 mt-3">
                {categoryData.slice(0, 5).map((cat, i) => {
                  const total = categoryData.reduce((s, c) => s + c.value, 0);
                  const pct = total > 0 ? (cat.value / total) * 100 : 0;
                  const color = CATEGORY_COLORS[cat.name] || CHART_COLORS[i % CHART_COLORS.length];
                  return (
                    <div key={cat.name}>
                      <div className="flex justify-between mb-1">
                        <span style={{ color: '#E2E0FF', fontSize: '11px', fontFamily: 'system-ui' }}>{cat.name}</span>
                        <div className="flex gap-2">
                          <span style={{ color: '#7A78A0', fontSize: '11px', fontFamily: 'system-ui' }}>{pct.toFixed(0)}%</span>
                          <span style={{ color, fontSize: '11px', fontFamily: 'system-ui', fontWeight: 600 }}>{formatCurrency(cat.value, currency)}</span>
                        </div>
                      </div>
                      <div style={{ height: '4px', background: '#0E0C2A', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color, boxShadow: `0 0 4px ${color}` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Smart Insights */}
          {insights.length > 0 && (
            <div>
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#7A78A0', display: 'block', marginBottom: '12px' }}>
                SMART INSIGHTS
              </span>
              <div className="flex flex-col gap-3">
                {insights.map((ins, i) => (
                  <InsightCard key={i} {...ins} />
                ))}
              </div>
            </div>
          )}

          {transactions.length === 0 && (
            <div className="flex flex-col items-center py-16">
              <div className="text-5xl mb-4">📊</div>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#4A4870', textAlign: 'center' }}>
                NO DATA YET
              </p>
              <p style={{ color: '#4A4870', fontSize: '12px', fontFamily: 'system-ui', marginTop: '8px', textAlign: 'center' }}>
                Start adding transactions to see your analytics
              </p>
            </div>
          )}

          {/* Instagram share CTA at bottom */}
          {transactions.length > 0 && (
            <button
              onClick={handleShare}
              disabled={generating}
              className="w-full py-4 rounded-sm flex items-center justify-center gap-3 transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #F77737 100%)',
                border: 'none',
                boxShadow: '0 0 25px rgba(225,48,108,0.35)',
              }}
            >
              <Instagram size={18} color="#fff" />
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#fff' }}>
                {generating ? 'GENERATING...' : 'SHARE ON INSTAGRAM'}
              </span>
            </button>
          )}
        </>
      )}

      <div className="h-4" />

      {/* Share Modal */}
      {shareImageUrl && (
        <ShareModal
          imageDataUrl={shareImageUrl}
          onClose={() => setShareImageUrl(null)}
          userName={userName}
        />
      )}
    </div>
  );
}