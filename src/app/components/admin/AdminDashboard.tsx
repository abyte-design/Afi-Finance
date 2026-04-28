import React, { useState, useCallback, useEffect } from 'react';
import { Shield, RefreshCw, Trash2, Users, Database, AlertTriangle, CheckCircle, LogOut, ChevronRight, Download, XCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { ConfirmDialog } from '../shared/ConfirmDialog';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-8bfb3e73`;
const ADMIN_PASS = 'afi-admin-2026';

// ── Alif's real transactions from GoPay export (April 2026) ─────────────────
// Internal wallet transfers (Kantong Utama ↔ Buat Jajan ↔ Accomodation ↔ Shopping card)
// are excluded — only real income & expense events are included.
const ALIF_TRANSACTIONS = [
  // ── INCOME ──────────────────────────────────────────────────────────────────
  { type: 'income', amount: 15700000, title: 'A Alif Lakipadada Norman', category: 'Salary',     date: '2026-04-03', notes: 'Uang masuk dari A Alif Lakipadada Norman' },
  { type: 'income', amount:   255000, title: 'Abyte Studio',             category: 'Freelance',  date: '2026-04-02', notes: 'Refund / pembayaran dari Abyte Studio' },
  { type: 'income', amount:  1700000, title: 'Geraldo Mamengko',         category: 'Other',      date: '2026-04-01', notes: 'Uang masuk dari Geraldo Mamengko' },
  { type: 'income', amount:  6500000, title: 'Mahatir Muhammad',         category: 'Other',      date: '2026-04-11', notes: 'Uang masuk dari Mahatir Muhammad' },
  { type: 'income', amount:  1495200, title: 'Dana Masuk Investasi',     category: 'Investment', date: '2026-04-09', notes: 'Return investasi / dana masuk' },
  { type: 'income', amount:    50000, title: 'Revian Kalaznikov',        category: 'Other',      date: '2026-04-15', notes: 'Uang masuk dari Revian Kalaznikov' },
  { type: 'income', amount:    50000, title: 'Dewa Putu Wahyu Adi Putra A', category: 'Other',  date: '2026-04-15', notes: 'Uang masuk dari Dewa Putu Wahyu Adi Putra A' },
  { type: 'income', amount:    50000, title: 'Putu Gede Pujayana',       category: 'Other',      date: '2026-04-15', notes: 'Uang masuk dari Putu Gede Pujayana' },
  { type: 'income', amount:   225000, title: 'Mahatir Muhammad',         category: 'Other',      date: '2026-04-16', notes: 'Uang masuk dari Mahatir Muhammad' },
  // ── EXPENSE ─────────────────────────────────────────────────────────────────
  { type: 'expense', amount:  1105000, title: 'Envi Bagus Aditya',          category: 'Other',         date: '2026-04-01', notes: 'Uang keluar ke Envi Bagus Aditya' },
  { type: 'expense', amount:    79900, title: 'Vegas Jimbaran',             category: 'Food',          date: '2026-04-01', notes: 'Belanja / makan di Vegas Jimbaran' },
  { type: 'expense', amount:   100000, title: 'A Alif Lakipadada Norman',   category: 'Other',         date: '2026-04-03', notes: 'Top up / transfer ke A Alif Lakipadada Norman' },
  { type: 'expense', amount:   100000, title: 'A Alif Lakipadada Norman',   category: 'Other',         date: '2026-04-03', notes: 'Top up / transfer ke A Alif Lakipadada Norman' },
  { type: 'expense', amount:    58000, title: 'Lilis Angrewy Megawati O',   category: 'Other',         date: '2026-04-03', notes: 'Uang keluar ke Lilis Angrewy Megawati O' },
  { type: 'expense', amount:   250000, title: 'A Alif Lakipadada Norman',   category: 'Other',         date: '2026-04-04', notes: 'Top up / transfer ke A Alif Lakipadada Norman' },
  { type: 'expense', amount:   500000, title: 'A Alif Lakipadada Norman',   category: 'Other',         date: '2026-04-04', notes: 'Top up / transfer ke A Alif Lakipadada Norman' },
  { type: 'expense', amount:    95900, title: 'Volken',                     category: 'Entertainment', date: '2026-04-04', notes: 'Belanja di Volken' },
  { type: 'expense', amount:   139000, title: 'Toys Bar & Longue Ho',       category: 'Entertainment', date: '2026-04-04', notes: 'Belanja di Toys Bar & Longue Ho' },
  { type: 'expense', amount:   238000, title: 'SGG Beach Walk',             category: 'Shopping',      date: '2026-04-04', notes: 'Belanja di SGG Beach Walk' },
  { type: 'expense', amount:   225000, title: 'J.CO Donuts & Coffee Side',  category: 'Food',          date: '2026-04-05', notes: 'Belanja di J.CO Donuts & Coffee Side' },
  { type: 'expense', amount:    31900, title: 'PT Tokopedia',               category: 'Shopping',      date: '2026-04-05', notes: 'Belanja di Tokopedia' },
  { type: 'expense', amount:    24000, title: 'Transaksi GoPay Tabungan',   category: 'Bills',         date: '2026-04-06', notes: 'Uang keluar transaksi GoPay' },
  { type: 'expense', amount:  6500000, title: 'Mahatir Muhammad',           category: 'Other',         date: '2026-04-06', notes: 'Uang keluar ke Mahatir Muhammad' },
  { type: 'expense', amount:   400000, title: 'Ratu Meilinda Sumanda S',    category: 'Other',         date: '2026-04-07', notes: 'Uang keluar ke Ratu Meilinda Sumanda S' },
  { type: 'expense', amount:  1545600, title: 'Pembelian Saham',            category: 'Other',         date: '2026-04-08', notes: 'Pembelian saham / investasi' },
  { type: 'expense', amount:   114000, title: 'ESB Restaurant Technology',  category: 'Food',          date: '2026-04-09', notes: 'Makan di ESB Restaurant Technology' },
  { type: 'expense', amount:   160000, title: 'PT Tokopedia',               category: 'Shopping',      date: '2026-04-09', notes: 'Belanja di Tokopedia' },
  { type: 'expense', amount:   193300, title: 'PT Tokopedia',               category: 'Shopping',      date: '2026-04-09', notes: 'Belanja di Tokopedia' },
  { type: 'expense', amount:   500000, title: 'A Alif Lakipadada Norman',   category: 'Other',         date: '2026-04-10', notes: 'Top up / transfer ke A Alif Lakipadada Norman' },
  { type: 'expense', amount:   200000, title: 'A Alif Lakipadada Norman',   category: 'Other',         date: '2026-04-12', notes: 'Uang keluar ke A Alif Lakipadada Norman' },
  { type: 'expense', amount:    70000, title: 'Yoi Laundry GG',             category: 'Health',        date: '2026-04-12', notes: 'Laundry di Yoi Laundry GG' },
  { type: 'expense', amount:    37000, title: 'Nataraka',                   category: 'Food',          date: '2026-04-13', notes: 'Belanja di Nataraka' },
  { type: 'expense', amount:   111000, title: 'Nataraka',                   category: 'Food',          date: '2026-04-13', notes: 'Belanja di Nataraka' },
  { type: 'expense', amount:  2250000, title: 'Piah Sopiah',                category: 'Other',         date: '2026-04-13', notes: 'Uang keluar ke Piah Sopiah' },
  { type: 'expense', amount:   500000, title: 'A Alif Lakipadada Norman',   category: 'Other',         date: '2026-04-14', notes: 'Top up / transfer ke A Alif Lakipadada Norman' },
  { type: 'expense', amount:   150000, title: 'Indira Salsabila',           category: 'Other',         date: '2026-04-15', notes: 'Top up ke Indira Salsabila' },
  { type: 'expense', amount:   355898, title: 'Upwork MemberDubli',         category: 'Bills',         date: '2026-04-15', notes: 'Subscription Upwork / MemberDubli' },
  { type: 'expense', amount:   115000, title: 'Kang Abuy Coffee & Eatery',  category: 'Food',          date: '2026-04-16', notes: 'Makan di Kang Abuy Coffee & Eatery' },
  { type: 'expense', amount:   400000, title: 'Indira Salsabila',           category: 'Other',         date: '2026-04-17', notes: 'Uang keluar ke Indira Salsabila' },
  { type: 'expense', amount:  2492733, title: 'Pembelian Saham',            category: 'Other',         date: '2026-04-17', notes: 'Pembelian saham / investasi' },
  { type: 'expense', amount:   500000, title: 'A Alif Lakipadada Norman',   category: 'Other',         date: '2026-04-19', notes: 'Top up / transfer ke A Alif Lakipadada Norman' },
  { type: 'expense', amount:   357260, title: 'Figma Subscription',         category: 'Bills',         date: '2026-04-20', notes: 'Langganan Figma' },
  { type: 'expense', amount:   357260, title: 'Claude.AI Subscription',     category: 'Bills',         date: '2026-04-20', notes: 'Langganan Claude.AI' },
  { type: 'expense', amount:   125000, title: 'Indira Salsabila',           category: 'Other',         date: '2026-04-20', notes: 'Uang keluar ke Indira Salsabila' },
  { type: 'expense', amount:   400000, title: 'Ratu Meilinda Sumanda S',    category: 'Other',         date: '2026-04-20', notes: 'Uang keluar ke Ratu Meilinda Sumanda S' },
  { type: 'expense', amount:     5000, title: 'Biaya Kekurangan Saldo',     category: 'Bills',         date: '2026-04-20', notes: 'Biaya dari kekurangan saldo' },
  { type: 'expense', amount:     5000, title: 'Biaya Kekurangan Saldo',     category: 'Bills',         date: '2026-04-20', notes: 'Biaya dari kekurangan saldo' },
  { type: 'expense', amount:     5000, title: 'Biaya Kekurangan Saldo',     category: 'Bills',         date: '2026-04-20', notes: 'Biaya dari kekurangan saldo' },
  { type: 'expense', amount:     5000, title: 'Biaya Kekurangan Saldo',     category: 'Bills',         date: '2026-04-20', notes: 'Biaya dari kekurangan saldo' },
  { type: 'expense', amount:     5000, title: 'Biaya Kekurangan Saldo',     category: 'Bills',         date: '2026-04-20', notes: 'Biaya dari kekurangan saldo' },
  { type: 'expense', amount:     5000, title: 'Biaya Kekurangan Saldo',     category: 'Bills',         date: '2026-04-20', notes: 'Biaya dari kekurangan saldo' },
  { type: 'expense', amount:    12000, title: 'Transaksi GoPay Tabungan',   category: 'Bills',         date: '2026-04-20', notes: 'Uang keluar transaksi GoPay' },
  { type: 'expense', amount:    60000, title: 'Yoi Laundry GG',             category: 'Health',        date: '2026-04-22', notes: 'Laundry di Yoi Laundry GG' },
];

function adminFetch(path: string, opts: RequestInit = {}) {
  return fetch(BASE + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${publicAnonKey}`,
      ...(opts.headers as Record<string, string> ?? {}),
    },
  });
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  currency: string;
  createdAt: string;
  lastSignIn: string | null;
  transactionCount: number;
}

type Toast = { id: number; msg: string; type: 'success' | 'error' };

export function AdminDashboard() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('afi_admin_auth') === '1');
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState('');

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmRemoveSeed, setConfirmRemoveSeed] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (msg: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/admin/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load users');
      setUsers(data.users ?? []);
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) fetchUsers();
  }, [authed, fetchUsers]);

  const handleLogin = () => {
    if (passInput === ADMIN_PASS) {
      sessionStorage.setItem('afi_admin_auth', '1');
      setAuthed(true);
      setPassError('');
    } else {
      setPassError('Incorrect password. Try again.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('afi_admin_auth');
    setAuthed(false);
    setUsers([]);
  };

  const deleteUser = async (id: string) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      const res = await adminFetch(`/admin/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Delete failed');
      addToast('User deleted successfully.', 'success');
      setUsers(u => u.filter(x => x.id !== id));
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const clearAll = async () => {
    setClearing(true);
    setConfirmClear(false);
    try {
      const res = await adminFetch('/admin/clear-all', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Clear failed');
      // Also clear the one-time flag so DbCleaner won't block future resets
      localStorage.removeItem('afi_db_cleared_v1');
      addToast(`Cleared ${data.cleared?.authUsers ?? 0} users, ${data.cleared?.transactions ?? 0} transactions.`, 'success');
      setUsers([]);
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setClearing(false);
    }
  };

  const seedAlifTransactions = async () => {
    setSeeding(true);
    try {
      const res = await adminFetch('/admin/seed-transactions', {
        method: 'POST',
        body: JSON.stringify({
          email: 'info.aliflkpd@gmail.com',
          transactions: ALIF_TRANSACTIONS,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Seed failed');
      addToast(`✓ Inserted ${data.inserted} transactions for info.aliflkpd@gmail.com`, 'success');
      await fetchUsers();
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setSeeding(false);
    }
  };

  const removeSeedTransactions = async () => {
    setRemoving(true);
    try {
      const res = await adminFetch('/admin/remove-seed', {
        method: 'DELETE',
        body: JSON.stringify({ email: 'info.aliflkpd@gmail.com' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Remove seed failed');
      addToast(`✓ Removed ${data.deleted} seeded transactions from info.aliflkpd@gmail.com`, 'success');
      await fetchUsers();
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setRemoving(false);
    }
  };

  const fmt = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // ── LOGIN SCREEN ─────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#06050F' }}
      >
        <div
          className="w-full max-w-sm rounded-sm p-8"
          style={{
            background: '#0A091C',
            border: '1px solid #2D2A6E',
            boxShadow: '0 0 40px rgba(124,58,237,0.2)',
          }}
        >
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-16 h-16 rounded-sm flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, #1E1B4B, #2D1B69)',
                border: '2px solid #7C3AED',
                boxShadow: '0 0 20px rgba(124,58,237,0.4)',
              }}
            >
              <Shield size={28} color="#8B5CF6" />
            </div>
            <h1
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '11px',
                color: '#E2E0FF',
                letterSpacing: '0.05em',
                textAlign: 'center',
              }}
            >
              AFI ADMIN
            </h1>
            <p style={{ color: '#4A4870', fontSize: '12px', fontFamily: 'system-ui', marginTop: '6px' }}>
              Restricted access
            </p>
          </div>

          {passError && (
            <div
              className="mb-4 p-3 rounded-sm text-sm"
              style={{ background: '#2D1A1A', border: '1px solid #FF4D8D40', color: '#FF4D8D', fontFamily: 'system-ui' }}
            >
              {passError}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <label style={{ color: '#7A78A0', fontSize: '10px', fontFamily: "'Press Start 2P', monospace" }}>
              ADMIN PASSWORD
            </label>
            <input
              type="password"
              value={passInput}
              onChange={e => setPassInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Enter password"
              className="w-full outline-none"
              style={{
                background: '#0E0C2A',
                border: '1px solid #2D2A6E',
                borderRadius: '2px',
                padding: '12px 14px',
                color: '#E2E0FF',
                fontSize: '14px',
                fontFamily: 'system-ui',
              }}
            />
            <button
              onClick={handleLogin}
              className="w-full py-3 rounded-sm flex items-center justify-center gap-2 mt-1"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                border: '1px solid rgba(139,92,246,0.4)',
                color: '#fff',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              <ChevronRight size={14} />
              ENTER
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ADMIN PANEL ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#06050F' }}>
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2" style={{ maxWidth: '320px' }}>
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-2 px-4 py-3 rounded-sm"
            style={{
              background: t.type === 'success' ? '#0D2B1F' : '#2D1A1A',
              border: `1px solid ${t.type === 'success' ? '#00FFD140' : '#FF4D8D40'}`,
              color: t.type === 'success' ? '#00FFD1' : '#FF4D8D',
              fontSize: '12px',
              fontFamily: 'system-ui',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            {t.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            {t.msg}
          </div>
        ))}
      </div>

      {/* Confirm: Delete user */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div
            className="rounded-sm p-6 mx-4"
            style={{
              background: '#13112E',
              border: '1px solid #FF4D8D60',
              maxWidth: '340px',
              width: '100%',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} color="#FF4D8D" />
              <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#FF4D8D' }}>
                DELETE USER?
              </h3>
            </div>
            <p style={{ color: '#7A78A0', fontSize: '13px', fontFamily: 'system-ui', marginBottom: '20px', lineHeight: 1.6 }}>
              This will permanently delete the user's account, profile, and all their transactions. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 rounded-sm"
                style={{ background: '#1E1B4B', border: '1px solid #2D2A6E', color: '#7A78A0', fontFamily: 'system-ui', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(confirmDeleteId)}
                className="flex-1 py-2 rounded-sm"
                style={{ background: '#3D0A1A', border: '1px solid #FF4D8D60', color: '#FF4D8D', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', cursor: 'pointer' }}
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm: Clear all */}
      {confirmClear && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div
            className="rounded-sm p-6 mx-4"
            style={{
              background: '#13112E',
              border: '1px solid #FF4D8D60',
              maxWidth: '360px',
              width: '100%',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} color="#FF4D8D" />
              <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#FF4D8D' }}>
                NUKE ALL DATA?
              </h3>
            </div>
            <p style={{ color: '#7A78A0', fontSize: '13px', fontFamily: 'system-ui', marginBottom: '20px', lineHeight: 1.6 }}>
              This will delete <strong style={{ color: '#E2E0FF' }}>every user account, profile, and transaction</strong> in the database. Completely irreversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 py-2 rounded-sm"
                style={{ background: '#1E1B4B', border: '1px solid #2D2A6E', color: '#7A78A0', fontFamily: 'system-ui', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={clearAll}
                className="flex-1 py-2 rounded-sm"
                style={{ background: '#3D0A1A', border: '1px solid #FF4D8D60', color: '#FF4D8D', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', cursor: 'pointer' }}
              >
                NUKE ALL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm: Remove seed */}
      <ConfirmDialog
        open={confirmRemoveSeed}
        title="REMOVE SEED?"
        message={`This will delete all ${ALIF_TRANSACTIONS.length} seeded transactions from info.aliflkpd@gmail.com. The account itself stays intact.`}
        confirmLabel="REMOVE SEED"
        cancelLabel="CANCEL"
        variant="warning"
        icon="delete"
        onConfirm={() => { setConfirmRemoveSeed(false); removeSeedTransactions(); }}
        onCancel={() => setConfirmRemoveSeed(false)}
      />

      {/* Header */}
      <div
        className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between"
        style={{
          background: '#0A091C',
          borderBottom: '1px solid #2D2A6E',
          boxShadow: '0 2px 20px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-sm flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1E1B4B, #2D1B69)', border: '1px solid #7C3AED' }}
          >
            <Shield size={16} color="#8B5CF6" />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color: '#E2E0FF' }}>
              AFI ADMIN
            </h1>
            <p style={{ color: '#4A4870', fontSize: '11px', fontFamily: 'system-ui' }}>
              Database Management
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-sm"
          style={{ background: '#1E1B4B', border: '1px solid #2D2A6E', color: '#7A78A0', fontFamily: 'system-ui', fontSize: '12px', cursor: 'pointer' }}
        >
          <LogOut size={13} />
          Logout
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-3">
          <div
            className="rounded-sm p-4"
            style={{ background: '#13112E', border: '1px solid #2D2A6E' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} color="#8B5CF6" />
              <span style={{ color: '#7A78A0', fontSize: '10px', fontFamily: "'Press Start 2P', monospace" }}>USERS</span>
            </div>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '20px', color: '#E2E0FF' }}>
              {loading ? '…' : users.length}
            </p>
          </div>
          <div
            className="rounded-sm p-4"
            style={{ background: '#13112E', border: '1px solid #2D2A6E' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Database size={14} color="#00FFD1" />
              <span style={{ color: '#7A78A0', fontSize: '10px', fontFamily: "'Press Start 2P', monospace" }}>TXN TOTAL</span>
            </div>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '20px', color: '#E2E0FF' }}>
              {loading ? '…' : users.reduce((s, u) => s + u.transactionCount, 0)}
            </p>
          </div>
          <div
            className="col-span-2 sm:col-span-1 rounded-sm p-4 flex items-center justify-between"
            style={{ background: '#13112E', border: '1px solid #2D2A6E' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#00FFD1', boxShadow: '0 0 6px #00FFD1' }} />
              <span style={{ color: '#00FFD1', fontSize: '11px', fontFamily: 'system-ui' }}>Server online</span>
            </div>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1 rounded-sm"
              style={{
                background: '#1E1B4B',
                border: '1px solid #2D2A6E',
                color: '#7A78A0',
                fontSize: '11px',
                fontFamily: 'system-ui',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div
          className="rounded-sm p-4 mb-6 flex items-center justify-between gap-4"
          style={{ background: '#1A0A0E', border: '1px solid #FF4D8D30' }}
        >
          <div>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#FF4D8D', marginBottom: '4px' }}>
              DANGER ZONE
            </p>
            <p style={{ color: '#7A78A0', fontSize: '12px', fontFamily: 'system-ui' }}>
              Delete all users, profiles, and transactions from the database.
            </p>
          </div>
          <button
            onClick={() => setConfirmClear(true)}
            disabled={clearing || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-sm whitespace-nowrap flex-shrink-0"
            style={{
              background: '#3D0A1A',
              border: '1px solid #FF4D8D60',
              color: '#FF4D8D',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '9px',
              cursor: clearing ? 'not-allowed' : 'pointer',
              opacity: clearing ? 0.6 : 1,
            }}
          >
            {clearing ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
            {clearing ? 'CLEARING...' : 'NUKE ALL'}
          </button>
        </div>

        {/* Seed zone */}
        <div
          className="rounded-sm p-4 mb-6 flex items-center justify-between gap-4"
          style={{ background: '#0A1A14', border: '1px solid #00FFD130' }}
        >
          <div>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#00FFD1', marginBottom: '4px' }}>
              SEED DATA
            </p>
            <p style={{ color: '#7A78A0', fontSize: '12px', fontFamily: 'system-ui' }}>
              Import <strong style={{ color: '#E2E0FF' }}>{ALIF_TRANSACTIONS.length} transactions</strong> from GoPay export into{' '}
              <strong style={{ color: '#E2E0FF' }}>info.aliflkpd@gmail.com</strong>
            </p>
          </div>
          <button
            onClick={seedAlifTransactions}
            disabled={seeding || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-sm whitespace-nowrap flex-shrink-0"
            style={{
              background: '#0D3024',
              border: '1px solid #00FFD160',
              color: '#00FFD1',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '9px',
              cursor: seeding ? 'not-allowed' : 'pointer',
              opacity: seeding ? 0.6 : 1,
            }}
          >
            {seeding ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Download size={12} />
            )}
            {seeding ? 'SEEDING...' : 'SEED NOW'}
          </button>
        </div>

        {/* Remove seed zone */}
        <div
          className="rounded-sm p-4 mb-6 flex items-center justify-between gap-4"
          style={{ background: '#0A1A14', border: '1px solid #00FFD130' }}
        >
          <div>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#00FFD1', marginBottom: '4px' }}>
              REMOVE SEED DATA
            </p>
            <p style={{ color: '#7A78A0', fontSize: '12px', fontFamily: 'system-ui' }}>
              Remove <strong style={{ color: '#E2E0FF' }}>{ALIF_TRANSACTIONS.length} transactions</strong> from{' '}
              <strong style={{ color: '#E2E0FF' }}>info.aliflkpd@gmail.com</strong>
            </p>
          </div>
          <button
            onClick={() => setConfirmRemoveSeed(true)}
            disabled={removing || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-sm whitespace-nowrap flex-shrink-0"
            style={{
              background: '#0D3024',
              border: '1px solid #00FFD160',
              color: '#00FFD1',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '9px',
              cursor: removing ? 'not-allowed' : 'pointer',
              opacity: removing ? 0.6 : 1,
            }}
          >
            {removing ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <XCircle size={12} />
            )}
            {removing ? 'REMOVING...' : 'REMOVE SEED'}
          </button>
        </div>

        {/* Users table */}
        <div
          className="rounded-sm overflow-hidden"
          style={{ background: '#13112E', border: '1px solid #2D2A6E' }}
        >
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid #2D2A6E' }}
          >
            <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#E2E0FF' }}>
              USER ACCOUNTS
            </h2>
            <span style={{ color: '#4A4870', fontSize: '12px', fontFamily: 'system-ui' }}>
              {users.length} record{users.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw size={20} color="#8B5CF6" className="animate-spin" />
                <span style={{ color: '#4A4870', fontSize: '12px', fontFamily: 'system-ui' }}>Loading users...</span>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Users size={32} color="#2D2A6E" />
              <p style={{ color: '#4A4870', fontSize: '13px', fontFamily: 'system-ui' }}>No users found</p>
              <p style={{ color: '#2D2A6E', fontSize: '11px', fontFamily: 'system-ui' }}>The database is empty</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1E1B4B' }}>
                    {['NAME / EMAIL', 'CURRENCY', 'TRANSACTIONS', 'REGISTERED', 'LAST LOGIN', ''].map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left"
                        style={{
                          color: '#4A4870',
                          fontSize: '9px',
                          fontFamily: "'Press Start 2P', monospace",
                          fontWeight: 'normal',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: idx < users.length - 1 ? '1px solid #1A1836' : 'none',
                        background: deletingId === u.id ? 'rgba(255,77,141,0.05)' : 'transparent',
                      }}
                    >
                      <td className="px-4 py-4">
                        <p style={{ color: '#E2E0FF', fontSize: '13px', fontFamily: 'system-ui', fontWeight: 600 }}>
                          {u.name || '—'}
                        </p>
                        <p style={{ color: '#4A4870', fontSize: '11px', fontFamily: 'system-ui', marginTop: '2px' }}>
                          {u.email as string}
                        </p>
                        <p style={{ color: '#2D2A6E', fontSize: '10px', fontFamily: 'monospace', marginTop: '2px' }}>
                          {u.id.slice(0, 8)}…
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className="px-2 py-1 rounded-sm"
                          style={{
                            background: '#1E1B4B',
                            border: '1px solid #2D2A6E',
                            color: '#8B5CF6',
                            fontSize: '10px',
                            fontFamily: "'Press Start 2P', monospace",
                          }}
                        >
                          {u.currency}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          style={{
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: '14px',
                            color: u.transactionCount > 0 ? '#00FFD1' : '#4A4870',
                          }}
                        >
                          {u.transactionCount}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span style={{ color: '#7A78A0', fontSize: '11px', fontFamily: 'system-ui', whiteSpace: 'nowrap' }}>
                          {fmt(u.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span style={{ color: '#7A78A0', fontSize: '11px', fontFamily: 'system-ui', whiteSpace: 'nowrap' }}>
                          {fmt(u.lastSignIn)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setConfirmDeleteId(u.id)}
                          disabled={!!deletingId}
                          className="flex items-center gap-1 px-3 py-2 rounded-sm transition-all"
                          style={{
                            background: '#2D1A1A',
                            border: '1px solid #FF4D8D40',
                            color: '#FF4D8D',
                            fontSize: '11px',
                            fontFamily: 'system-ui',
                            cursor: deletingId ? 'not-allowed' : 'pointer',
                            opacity: deletingId === u.id ? 0.5 : 1,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {deletingId === u.id ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p
          className="text-center mt-6"
          style={{ color: '#2D2A6E', fontSize: '10px', fontFamily: 'system-ui' }}
        >
          AFI Admin · Changes are permanent and irreversible
        </p>
      </div>
    </div>
  );
}