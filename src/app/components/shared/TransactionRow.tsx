import React from 'react';
import {
  UtensilsCrossed, ShoppingBag, Car, Zap, Gamepad2, Heart,
  Plane, BookOpen, Briefcase, Code2, TrendingUp, Gift, Circle,
  ArrowUpRight, ArrowDownRight, Pencil, Trash2,
} from 'lucide-react';
import { Transaction } from '../../lib/types';
import { formatCurrency, formatCurrencyCompact, formatDateShort, CATEGORY_COLORS } from '../../lib/utils';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  UtensilsCrossed, ShoppingBag, Car, Zap, Gamepad2, Heart,
  Plane, BookOpen, Briefcase, Code2, TrendingUp, Gift, Circle,
};

const CATEGORY_ICONS: Record<string, string> = {
  Food: 'UtensilsCrossed', Shopping: 'ShoppingBag', Transport: 'Car',
  Bills: 'Zap', Entertainment: 'Gamepad2', Health: 'Heart',
  Travel: 'Plane', Education: 'BookOpen', Salary: 'Briefcase',
  Freelance: 'Code2', Investment: 'TrendingUp', Gift: 'Gift',
  Other: 'Circle',
};

interface TransactionRowProps {
  transaction: Transaction;
  onEdit?: (t: Transaction) => void;
  onDelete?: (id: string) => void;
  currency?: string;
  showActions?: boolean;
}

export function TransactionRow({ transaction: t, onEdit, onDelete, currency = 'USD', showActions = false }: TransactionRowProps) {
  const iconKey = CATEGORY_ICONS[t.category] || 'Circle';
  const Icon = ICON_MAP[iconKey] || Circle;
  const catColor = CATEGORY_COLORS[t.category] || '#7A78A0';
  const isIncome = t.type === 'income';

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-sm transition-all active:scale-98"
      style={{
        background: '#13112E',
        border: '1px solid #2D2A6E',
        marginBottom: '8px',
      }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-sm flex-shrink-0"
        style={{
          width: '40px',
          height: '40px',
          background: `${catColor}18`,
          border: `1px solid ${catColor}40`,
        }}
      >
        <Icon size={18} color={catColor} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="truncate"
          style={{ color: '#E2E0FF', fontSize: '13px', fontWeight: 600 }}
        >
          {t.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            style={{
              fontSize: '10px',
              color: catColor,
              fontFamily: 'system-ui',
            }}
          >
            {t.category}
          </span>
          <span style={{ color: '#4A4870', fontSize: '10px' }}>·</span>
          <span style={{ color: '#4A4870', fontSize: '10px' }}>{formatDateShort(t.date)}</span>
        </div>
      </div>

      {/* Amount */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right">
          <div className="flex items-center justify-end gap-1">
            {isIncome ? (
              <ArrowUpRight size={12} color="#00E57E" />
            ) : (
              <ArrowDownRight size={12} color="#FF4D8D" />
            )}
            <span
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '10px',
                color: isIncome ? '#00E57E' : '#FF4D8D',
                maxWidth: '90px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
              title={`${isIncome ? '+' : '-'}${formatCurrency(t.amount, currency)}`}
            >
              {isIncome ? '+' : '-'}{formatCurrencyCompact(t.amount, currency)}
            </span>
          </div>
        </div>

        {showActions && (
          <div className="flex items-center gap-1 ml-2">
            {onEdit && (
              <button
                onClick={() => onEdit(t)}
                className="p-1.5 rounded-sm transition-all active:scale-90"
                style={{ background: '#1E1B4B', border: '1px solid #4C3BCF' }}
              >
                <Pencil size={12} color="#8B5CF6" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(t.id)}
                className="p-1.5 rounded-sm transition-all active:scale-90"
                style={{ background: '#2D1A1A', border: '1px solid #7F1D1D' }}
              >
                <Trash2 size={12} color="#FF4D8D" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}