import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { api } from '../../lib/api';
import { Transaction } from '../../lib/types';
import {
  formatCurrency,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getCurrencyConfig,
  sanitizeAmountInput,
} from '../../lib/utils';
import { TransactionRow } from '../shared/TransactionRow';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { BottomSheet } from '../shared/BottomSheet';

const ALL_CATEGORIES = [
  ...new Set([
    ...INCOME_CATEGORIES.map((c) => c.id),
    ...EXPENSE_CATEGORIES.map((c) => c.id),
  ]),
];

// ── Edit Modal ────────────────────────────────────────────────────────────────

interface EditModalProps {
  transaction: Transaction;
  onSave: (t: Transaction) => void;
  onClose: () => void;
  currency: string;
}

function EditModal({ transaction, onSave, onClose, currency }: EditModalProps) {
  const [title, setTitle] = useState(transaction.title);
  const [amount, setAmount] = useState(() => {
    const cfg = getCurrencyConfig(currency);
    if (cfg.isInteger) {
      return sanitizeAmountInput(String(Math.round(transaction.amount)), currency);
    }
    return String(transaction.amount);
  });
  const [category, setCategory] = useState(transaction.category);
  const [date, setDate] = useState(transaction.date);
  const [notes, setNotes] = useState(transaction.notes ?? '');

  const currencyConfig = getCurrencyConfig(currency);

  const inputStyle: React.CSSProperties = {
    background: '#0E0C2A',
    border: '1px solid #2D2A6E',
    borderRadius: '2px',
    padding: '10px 12px',
    color: '#E2E0FF',
    fontSize: '13px',
    fontFamily: 'system-ui',
    width: '100%',
    outline: 'none',
  };

  const handleAmountChange = (val: string) => {
    setAmount(sanitizeAmountInput(val, currency));
  };

  const handleSave = () => {
    const rawAmount = currencyConfig.isInteger
      ? parseInt(amount.replace(/\./g, ''), 10)
      : parseFloat(amount.replace(',', '.'));

    onSave({
      ...transaction,
      title,
      amount: isNaN(rawAmount) ? 0 : rawAmount,
      category,
      date,
      notes,
    });
  };

  return (
    <BottomSheet
      isOpen={true}
      title="EDIT TRANSACTION"
      onClose={onClose}
      footer={
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-sm"
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
            border: '1px solid rgba(139,92,246,0.5)',
            color: '#fff',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '10px',
            boxShadow: '0 0 15px rgba(124,58,237,0.3)',
            cursor: 'pointer',
          }}
        >
          SAVE CHANGES
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Title */}
        <div>
          <label
            style={{
              color: '#7A78A0',
              fontSize: '9px',
              fontFamily: "'Press Start 2P', monospace",
              display: 'block',
              marginBottom: '6px',
            }}
          >
            TITLE
          </label>
          <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        {/* Amount */}
        <div>
          <label
            style={{
              color: '#7A78A0',
              fontSize: '9px',
              fontFamily: "'Press Start 2P', monospace",
              display: 'block',
              marginBottom: '6px',
            }}
          >
            AMOUNT ({currencyConfig.symbol})
          </label>
          <input
            type="text"
            inputMode={currencyConfig.inputMode}
            style={inputStyle}
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder={currencyConfig.placeholder}
          />
          {currencyConfig.isInteger && (
            <span
              style={{
                color: '#4A4870',
                fontSize: '10px',
                fontFamily: 'system-ui',
                marginTop: '4px',
                display: 'block',
              }}
            >
              Whole numbers only
            </span>
          )}
        </div>

        {/* Category */}
        <div>
          <label
            style={{
              color: '#7A78A0',
              fontSize: '9px',
              fontFamily: "'Press Start 2P', monospace",
              display: 'block',
              marginBottom: '6px',
            }}
          >
            CATEGORY
          </label>
          <select
            style={{ ...inputStyle, colorScheme: 'dark' } as React.CSSProperties}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label
            style={{
              color: '#7A78A0',
              fontSize: '9px',
              fontFamily: "'Press Start 2P', monospace",
              display: 'block',
              marginBottom: '6px',
            }}
          >
            DATE
          </label>
          <input
            type="date"
            style={{ ...inputStyle, colorScheme: 'dark' } as React.CSSProperties}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label
            style={{
              color: '#7A78A0',
              fontSize: '9px',
              fontFamily: "'Press Start 2P', monospace",
              display: 'block',
              marginBottom: '6px',
            }}
          >
            NOTES
          </label>
          <textarea
            style={{ ...inputStyle, resize: 'none' } as React.CSSProperties}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
      </div>
    </BottomSheet>
  );
}

// ── History Screen ────────────────────────────────────────────────────────────

export function HistoryScreen() {
  const { accessToken } = useAuth();
  const { currency } = useCurrency();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) {
      loadData();
    }
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    setLoading(true);
    try {
      const data = await api.transactions.getAll(accessToken!);
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('History load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.transactions.delete(accessToken!, deleteId);
      setTransactions((prev) => prev.filter((t) => t.id !== deleteId));
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleteId(null);
    }
  };

  const handleSave = async (updated: Transaction) => {
    try {
      const res = await api.transactions.update(accessToken!, updated.id, updated);
      setTransactions((prev) =>
        prev.map((t) => (t.id === updated.id ? res.transaction : t))
      );
      setEditTx(null);
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const changeMonth = (dir: -1 | 1) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setSelectedMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const monthLabel = new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchMonth = t.date.startsWith(selectedMonth);
      const matchFilter = filter === 'all' || t.type === filter;
      const matchSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      return matchMonth && matchFilter && matchSearch;
    });
  }, [transactions, selectedMonth, filter, search]);

  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#0A091C' }}>
      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-4" style={{ borderBottom: '1px solid #2D2A6E' }}>
        <h1
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '12px',
            color: '#E2E0FF',
            marginBottom: '16px',
          }}
        >
          HISTORY
        </h1>

        {/* Search */}
        <div
          className="flex items-center gap-3 px-3 py-3 rounded-sm mb-3"
          style={{ background: '#13112E', border: '1px solid #2D2A6E' }}
        >
          <Search size={16} color="#4A4870" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{ color: '#E2E0FF', fontSize: '13px', fontFamily: 'system-ui' }}
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X size={14} color="#4A4870" />
            </button>
          )}
        </div>

        {/* Month navigator */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-sm"
            style={{ background: '#13112E', border: '1px solid #2D2A6E' }}
          >
            <ChevronLeft size={16} color="#7A78A0" />
          </button>
          <span
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '9px',
              color: '#8B5CF6',
            }}
          >
            {monthLabel.toUpperCase()}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 rounded-sm"
            style={{ background: '#13112E', border: '1px solid #2D2A6E' }}
          >
            <ChevronRight size={16} color="#7A78A0" />
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {(['all', 'income', 'expense'] as const).map((f) => {
            const active = filter === f;
            const color =
              f === 'income' ? '#00E57E' : f === 'expense' ? '#FF4D8D' : '#8B5CF6';
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-sm transition-all"
                style={{
                  background: active ? `${color}20` : '#13112E',
                  border: active ? `1px solid ${color}` : '1px solid #2D2A6E',
                  color: active ? color : '#4A4870',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '8px',
                  boxShadow: active ? `0 0 8px ${color}30` : 'none',
                  cursor: 'pointer',
                }}
              >
                {f.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Monthly summary ── */}
      <div
        className="flex gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid #2D2A6E' }}
      >
        <div
          className="flex-1 flex flex-col items-center py-2 rounded-sm"
          style={{
            background: 'rgba(0,229,126,0.08)',
            border: '1px solid rgba(0,229,126,0.2)',
          }}
        >
          <span style={{ color: '#4A4870', fontSize: '9px', fontFamily: 'system-ui' }}>
            Income
          </span>
          <span
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '9px',
              color: '#00E57E',
              marginTop: '4px',
            }}
          >
            {formatCurrency(totalIncome, currency)}
          </span>
        </div>
        <div
          className="flex-1 flex flex-col items-center py-2 rounded-sm"
          style={{
            background: 'rgba(255,77,141,0.08)',
            border: '1px solid rgba(255,77,141,0.2)',
          }}
        >
          <span style={{ color: '#4A4870', fontSize: '9px', fontFamily: 'system-ui' }}>
            Expenses
          </span>
          <span
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '9px',
              color: '#FF4D8D',
              marginTop: '4px',
            }}
          >
            {formatCurrency(totalExpense, currency)}
          </span>
        </div>
        <div
          className="flex-1 flex flex-col items-center py-2 rounded-sm"
          style={{
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}
        >
          <span style={{ color: '#4A4870', fontSize: '9px', fontFamily: 'system-ui' }}>
            Net
          </span>
          <span
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '9px',
              color: totalIncome - totalExpense >= 0 ? '#00E57E' : '#FF4D8D',
              marginTop: '4px',
            }}
          >
            {formatCurrency(totalIncome - totalExpense, currency)}
          </span>
        </div>
      </div>

      {/* ── Transaction list ── */}
      <div className="flex-1 px-4 py-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-sm animate-pulse mb-2"
              style={{ background: '#13112E' }}
            />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '9px',
                color: '#4A4870',
              }}
            >
              NO TRANSACTIONS
            </p>
            <p
              style={{
                color: '#4A4870',
                fontSize: '12px',
                fontFamily: 'system-ui',
                marginTop: '8px',
              }}
            >
              {search ? 'No results found' : 'Nothing recorded this month'}
            </p>
            <button
              onClick={() => navigate('/add')}
              className="mt-6 px-4 py-2 rounded-sm"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                border: '1px solid rgba(139,92,246,0.5)',
                color: '#fff',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '8px',
                boxShadow: '0 0 15px rgba(124,58,237,0.3)',
                cursor: 'pointer',
              }}
            >
              + ADD TRANSACTION
            </button>
          </div>
        ) : (
          filtered.map((t) => (
            <TransactionRow
              key={t.id}
              transaction={t}
              currency={currency}
              showActions
              onEdit={setEditTx}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* ── Edit modal ── */}
      {editTx && (
        <EditModal
          transaction={editTx}
          onSave={handleSave}
          onClose={() => setEditTx(null)}
          currency={currency}
        />
      )}

      {/* ── Delete confirm dialog ── */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmLabel="DELETE"
        cancelLabel="CANCEL"
        variant="danger"
        icon="delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
