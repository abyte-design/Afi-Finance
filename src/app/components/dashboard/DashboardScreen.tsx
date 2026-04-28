import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowUpRight, ArrowDownRight, Plus, ChevronRight,
  Wallet, Target, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Transaction } from '../../lib/types';
import { formatCurrency, formatCurrencyCompact, getInitials, getGreeting, computeMonthlyStats, getLast12Months } from '../../lib/utils';
import { TransactionRow } from '../shared/TransactionRow';
import { useCurrency } from '../../context/CurrencyContext';
// recharts intentionally NOT imported — replaced with a custom SVG chart
// to eliminate the "duplicate key" React warning from recharts 2.x internals.

function StatCard({ label, value, icon, color, currency }: { label: string; value: number; icon: React.ReactNode; color: string; currency: string }) {
  const compact = formatCurrencyCompact(value, currency);
  return (
    <div
      className="flex-1 p-4 rounded-sm min-w-0 overflow-hidden"
      style={{
        background: '#13112E',
        border: `1px solid ${color}30`,
        boxShadow: `0 0 15px ${color}15`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span style={{ color: '#7A78A0', fontSize: '9px', fontFamily: "'Press Start 2P', monospace" }}>{label}</span>
        {icon}
      </div>
      <p
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '11px',
          color,
          lineHeight: 1.4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={formatCurrency(value, currency)}
      >
        {compact}
      </p>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#1E1B4B', border: '1px solid #2D2A6E', borderRadius: '2px', padding: '8px 12px' }}>
        <p style={{ color: '#7A78A0', fontSize: '10px', marginBottom: '4px' }}>{label}</p>
        <p style={{ color: '#00E57E', fontSize: '10px' }}>+{formatCurrency(payload[0]?.value || 0, currency)}</p>
        <p style={{ color: '#FF4D8D', fontSize: '10px' }}>-{formatCurrency(payload[1]?.value || 0, currency)}</p>
      </div>
    );
  }
  return null;
};

export function DashboardScreen() {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Player';
  const initials = getInitials(name);
  const greeting = getGreeting();

  useEffect(() => {
    if (accessToken) loadData();
  }, [accessToken]);

  const loadData = async () => {
    try {
      const data = await api.transactions.getAll(accessToken!);
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const { totalBalance, monthlyIncome, monthlyExpenses, savingsRate } = computeMonthlyStats(transactions);
  const budgetProgress = monthlyIncome > 0 ? Math.min((monthlyExpenses / monthlyIncome) * 100, 100) : 0;
  const recentTransactions = transactions.slice(0, 5);

  // Chart data
  const chartData = getLast12Months().map(({ year, month, label }) => {
    const monthTxns = transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getMonth() === month && d.getFullYear() === year;
    });
    return {
      label,
      income: monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expenses: monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  });

  const SkeletonCard = () => (
    <div className="h-24 rounded-sm animate-pulse" style={{ background: '#13112E', border: '1px solid #2D2A6E' }} />
  );

  return (
    <div className="flex flex-col min-h-full p-4 gap-4" style={{ background: '#0A091C' }}>
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div>
          <p style={{ color: '#4A4870', fontSize: '11px', fontFamily: 'system-ui' }}>{greeting},</p>
          <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '13px', color: '#E2E0FF', marginTop: '4px' }}>
            {name.split(' ')[0].toUpperCase()}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-sm flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
              border: '1px solid rgba(139,92,246,0.5)',
              boxShadow: '0 0 10px rgba(124,58,237,0.4)',
            }}
          >
            <span style={{ fontFamily: "'Press Start 2P', monospace", color: '#fff', fontSize: '10px' }}>
              {initials}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <>
          <SkeletonCard />
          <div className="grid grid-cols-2 gap-3"><SkeletonCard /><SkeletonCard /></div>
        </>
      ) : (
        <>
          {/* Balance Card */}
          <div
            className="relative rounded-sm p-5 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #2D1B69 0%, #1E1B4B 50%, #13112E 100%)',
              border: '1px solid #7C3AED',
              boxShadow: '0 0 40px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Scanline effect */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 4px)',
            }} />
            {/* Decorative corner */}
            <div className="absolute top-0 right-0 w-24 h-24 opacity-10" style={{
              background: 'radial-gradient(circle at top right, #00FFD1, transparent)',
            }} />

            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Wallet size={14} color="#8B5CF6" />
                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#8B5CF6' }}>
                    TOTAL BALANCE
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-sm" style={{ background: 'rgba(0,229,126,0.1)', border: '1px solid rgba(0,229,126,0.3)' }}>
                  <TrendingUp size={10} color="#00E57E" />
                  <span style={{ color: '#00E57E', fontSize: '9px', fontFamily: 'system-ui' }}>
                    {savingsRate >= 0 ? '+' : ''}{savingsRate.toFixed(0)}%
                  </span>
                </div>
              </div>

              <p style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '26px',
                color: '#fff',
                margin: '12px 0',
                textShadow: '0 0 20px rgba(139,92,246,0.6)',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
                title={formatCurrency(totalBalance, currency)}
              >
                {formatCurrencyCompact(totalBalance, currency)}
              </p>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2" style={{ background: '#00FFD1', boxShadow: '0 0 6px #00FFD1' }} />
                <span style={{ color: '#7A78A0', fontSize: '10px', fontFamily: 'system-ui', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  This month: {formatCurrencyCompact(monthlyIncome - monthlyExpenses, currency)} net
                </span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="INCOME"
              value={monthlyIncome}
              icon={<ArrowUpRight size={16} color="#00E57E" />}
              color="#00E57E"
              currency={currency}
            />
            <StatCard
              label="EXPENSES"
              value={monthlyExpenses}
              icon={<ArrowDownRight size={16} color="#FF4D8D" />}
              color="#FF4D8D"
              currency={currency}
            />
          </div>

          {/* Budget Progress */}
          <div
            className="p-4 rounded-sm"
            style={{ background: '#13112E', border: '1px solid #2D2A6E' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={14} color="#8B5CF6" />
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#7A78A0' }}>
                  MONTHLY BUDGET
                </span>
              </div>
              <span style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '9px',
                color: budgetProgress > 85 ? '#FF4D8D' : '#8B5CF6',
              }}>
                {budgetProgress.toFixed(0)}%
              </span>
            </div>
            <div className="rounded-sm overflow-hidden" style={{ height: '10px', background: '#0E0C2A', border: '1px solid #2D2A6E' }}>
              <div
                className="h-full transition-all duration-700 rounded-sm"
                style={{
                  width: `${budgetProgress}%`,
                  background: budgetProgress > 85
                    ? 'linear-gradient(90deg, #FF4D8D, #FF6B6B)'
                    : 'linear-gradient(90deg, #7C3AED, #00FFD1)',
                  boxShadow: `0 0 10px ${budgetProgress > 85 ? '#FF4D8D' : '#7C3AED'}`,
                }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span style={{ color: '#4A4870', fontSize: '10px', fontFamily: 'system-ui' }}>
                {formatCurrencyCompact(monthlyExpenses, currency)} spent
              </span>
              <span style={{ color: '#4A4870', fontSize: '10px', fontFamily: 'system-ui' }}>
                {formatCurrencyCompact(Math.max(monthlyIncome - monthlyExpenses, 0), currency)} left
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/add?type=income')}
              className="flex items-center justify-center gap-2 py-3 rounded-sm transition-all active:scale-95"
              style={{
                background: 'rgba(0,229,126,0.1)',
                border: '1px solid rgba(0,229,126,0.4)',
                boxShadow: '0 0 10px rgba(0,229,126,0.1)',
              }}
            >
              <Plus size={16} color="#00E57E" />
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#00E57E' }}>
                ADD INCOME
              </span>
            </button>
            <button
              onClick={() => navigate('/add?type=expense')}
              className="flex items-center justify-center gap-2 py-3 rounded-sm transition-all active:scale-95"
              style={{
                background: 'rgba(255,77,141,0.1)',
                border: '1px solid rgba(255,77,141,0.4)',
                boxShadow: '0 0 10px rgba(255,77,141,0.1)',
              }}
            >
              <Plus size={16} color="#FF4D8D" />
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#FF4D8D' }}>
                ADD EXPENSE
              </span>
            </button>
          </div>

          {/* Mini Chart */}
          <div className="p-4 rounded-sm" style={{ background: '#13112E', border: '1px solid #2D2A6E' }}>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#7A78A0', display: 'block', marginBottom: '12px' }}>
              CASH FLOW — LAST 12 MONTHS
            </span>
            <div className="flex gap-4 mb-3">
              <div className="flex items-center gap-1">
                <div style={{ width: 8, height: 8, background: '#00E57E', borderRadius: 1 }} />
                <span style={{ color: '#7A78A0', fontSize: '9px', fontFamily: 'system-ui' }}>Income</span>
              </div>
              <div className="flex items-center gap-1">
                <div style={{ width: 8, height: 8, background: '#FF4D8D', borderRadius: 1 }} />
                <span style={{ color: '#7A78A0', fontSize: '9px', fontFamily: 'system-ui' }}>Expenses</span>
              </div>
            </div>
            <CashFlowSVG data={chartData} currency={currency} />
          </div>

          {/* Recent Transactions */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#E2E0FF' }}>
                RECENT ACTIVITY
              </span>
              <button
                onClick={() => navigate('/history')}
                className="flex items-center gap-1"
                style={{ color: '#8B5CF6', fontSize: '10px', fontFamily: 'system-ui' }}
              >
                SEE ALL <ChevronRight size={14} />
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div
                className="flex flex-col items-center py-10 rounded-sm"
                style={{ background: '#13112E', border: '1px solid #2D2A6E' }}
              >
                <div className="text-4xl mb-3">🎮</div>
                <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#4A4870' }}>NO TRANSACTIONS</p>
                <p style={{ color: '#4A4870', fontSize: '11px', fontFamily: 'system-ui', marginTop: '8px' }}>Add your first transaction!</p>
                <button
                  onClick={() => navigate('/add')}
                  className="mt-4 px-4 py-2 rounded-sm"
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                    border: '1px solid rgba(139,92,246,0.5)',
                    color: '#fff',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8px',
                    boxShadow: '0 0 15px rgba(124,58,237,0.3)',
                  }}
                >
                  + ADD NOW
                </button>
              </div>
            ) : (
              recentTransactions.map(t => (
                <TransactionRow key={t.id} transaction={t} currency={currency} />
              ))
            )}
          </div>
        </>
      )}

      {/* Bottom padding */}
      <div className="h-4" />
    </div>
  );
}

/** Pure-SVG grouped bar chart — zero recharts, zero duplicate-key warnings. */
function CashFlowSVG({ data, currency }: { data: Array<{ label: string; income: number; expenses: number }>; currency: string }) {
  const CHART_H = 72;
  const LABEL_H = 14;
  const SVG_H = CHART_H + LABEL_H;
  const BAR_W = 7;
  const GAP = 2;        // gap between the two bars in one group
  const GROUP_GAP = 8;  // gap between groups
  const GROUP_W = BAR_W * 2 + GAP;
  const PADDING = 8;
  const totalW = data.length * (GROUP_W + GROUP_GAP) - GROUP_GAP + PADDING * 2;

  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expenses]), 1);

  const [tooltip, setTooltip] = useState<{ x: number; y: number; income: number; expenses: number; label: string } | null>(null);

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${totalW} ${SVG_H}`}
        style={{ width: '100%', height: '86px', display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setTooltip(null)}
      >
        {data.map((d, i) => {
          const x = PADDING + i * (GROUP_W + GROUP_GAP);
          const incH = Math.max((d.income / maxVal) * CHART_H, d.income > 0 ? 2 : 0);
          const expH = Math.max((d.expenses / maxVal) * CHART_H, d.expenses > 0 ? 2 : 0);
          const cx = x + GROUP_W / 2;

          return (
            <g
              key={d.label}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setTooltip({ x: cx, y: CHART_H - Math.max(incH, expH) - 4, income: d.income, expenses: d.expenses, label: d.label })}
            >
              {/* Income bar */}
              <rect
                x={x}
                y={CHART_H - incH}
                width={BAR_W}
                height={incH || 1}
                fill="#00E57E"
                rx={1}
                opacity={0.9}
              />
              {/* Expense bar */}
              <rect
                x={x + BAR_W + GAP}
                y={CHART_H - expH}
                width={BAR_W}
                height={expH || 1}
                fill="#FF4D8D"
                rx={1}
                opacity={0.9}
              />
              {/* Month label */}
              <text
                x={cx}
                y={SVG_H}
                textAnchor="middle"
                fill="#4A4870"
                fontSize={7}
                fontFamily="system-ui"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: `${(tooltip.x / totalW) * 100}%`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            background: '#1E1B4B',
            border: '1px solid #2D2A6E',
            borderRadius: '2px',
            padding: '6px 10px',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          <p style={{ color: '#7A78A0', fontSize: '9px', marginBottom: '3px' }}>{tooltip.label}</p>
          <p style={{ color: '#00E57E', fontSize: '9px' }}>+{formatCurrency(tooltip.income, currency)}</p>
          <p style={{ color: '#FF4D8D', fontSize: '9px' }}>-{formatCurrency(tooltip.expenses, currency)}</p>
        </div>
      )}
    </div>
  );
}