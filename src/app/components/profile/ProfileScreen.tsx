import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Globe, Moon, Shield, Fingerprint, Cloud,
  LogOut, ChevronRight, CheckCircle2, Wallet,
  Camera, Loader2, X, Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { UserProfile } from '../../lib/types';
import { getInitials, CURRENCY_SYMBOLS } from '../../lib/utils';
import { Logo } from '../shared/Logo';
import { useCurrency } from '../../context/CurrencyContext';
import { InstallAppButton } from '../shared/InstallAppButton';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { BottomSheet } from '../shared/BottomSheet';

const CURRENCIES: { code: string; name: string; flag: string }[] = [
  { code: 'IDR', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  { code: 'USD', name: 'US Dollar',         flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro',              flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound',     flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen',      flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar',   flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CHF', name: 'Swiss Franc',       flag: '🇨🇭' },
  { code: 'INR', name: 'Indian Rupee',      flag: '🇮🇳' },
  { code: 'BRL', name: 'Brazilian Real',    flag: '🇧🇷' },
  { code: 'SGD', name: 'Singapore Dollar',  flag: '🇸🇬' },
  { code: 'MYR', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  { code: 'THB', name: 'Thai Baht',         flag: '🇹🇭' },
  { code: 'PHP', name: 'Philippine Peso',   flag: '🇵🇭' },
  { code: 'VND', name: 'Vietnamese Dong',   flag: '🇻🇳' },
  { code: 'KRW', name: 'South Korean Won',  flag: '🇰🇷' },
  { code: 'CNY', name: 'Chinese Yuan',      flag: '🇨🇳' },
  { code: 'SAR', name: 'Saudi Riyal',       flag: '🇸🇦' },
  { code: 'AED', name: 'UAE Dirham',        flag: '🇦🇪' },
];

// Add extra symbols for new currencies
const ALL_CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'CA$', AUD: 'A$',
  CHF: 'Fr', INR: '₹', BRL: 'R$', IDR: 'Rp', SGD: 'S$', MYR: 'RM',
  THB: '฿', PHP: '₱', VND: '₫', KRW: '₩', CNY: '¥', SAR: '﷼', AED: 'د.إ',
};

function SettingRow({ icon, label, value, onClick, danger }: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  const inner = (
    <>
      <div className="flex-shrink-0">{icon}</div>
      <span style={{ flex: 1, textAlign: 'left', color: danger ? '#FF4D8D' : '#E2E0FF', fontSize: '13px', fontFamily: 'system-ui' }}>
        {label}
      </span>
      {value && <div className="flex items-center gap-1">{value}</div>}
      {onClick && !danger && <ChevronRight size={16} color="#4A4870" />}
    </>
  );

  const sharedStyle: React.CSSProperties = {
    borderBottom: '1px solid #1E1B4B',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '14px 16px',
  };

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="transition-all active:opacity-70"
        style={sharedStyle}
      >
        {inner}
      </button>
    );
  }

  return (
    <div style={sharedStyle}>
      {inner}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 rounded-sm transition-all"
      style={{
        width: '44px',
        height: '24px',
        background: checked ? '#7C3AED' : '#2D2A6E',
        border: checked ? '1px solid rgba(139,92,246,0.5)' : '1px solid #2D2A6E',
        boxShadow: checked ? '0 0 10px rgba(124,58,237,0.4)' : 'none',
      }}
    >
      <div
        className="absolute top-0.5 rounded-sm transition-all duration-300"
        style={{
          width: '20px',
          height: '20px',
          background: checked ? '#E2E0FF' : '#4A4870',
          left: checked ? '22px' : '2px',
        }}
      />
    </button>
  );
}

function AvatarUpload({ initials, avatarUrl, onUpload }: {
  initials: string;
  avatarUrl?: string;
  onUpload: (base64: string, mimeType: string) => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl || null);
  const [error, setError] = useState('');

  // Update preview if avatarUrl changes externally
  useEffect(() => {
    if (avatarUrl) setPreviewUrl(avatarUrl);
  }, [avatarUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    setError('');
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      // Show local preview immediately
      setPreviewUrl(dataUrl);
      const base64 = dataUrl.split(',')[1];
      try {
        await onUpload(base64, file.type);
      } catch (err: any) {
        setError('Upload failed. Try again.');
        console.error('Avatar upload error:', err);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative flex flex-col items-center">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="relative group"
        style={{ cursor: uploading ? 'wait' : 'pointer' }}
      >
        {/* Avatar container */}
        <div
          className="w-24 h-24 rounded-sm flex items-center justify-center overflow-hidden"
          style={{
            background: previewUrl ? 'transparent' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
            border: '2px solid rgba(139,92,246,0.6)',
            boxShadow: '0 0 30px rgba(124,58,237,0.4)',
          }}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '24px', color: '#fff' }}>
              {initials}
            </span>
          )}

          {/* Upload overlay */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: 'rgba(10,9,28,0.75)',
              borderRadius: '1px',
            }}
          >
            {uploading ? (
              <Loader2 size={24} color="#00FFD1" className="animate-spin" />
            ) : (
              <>
                <Camera size={20} color="#00FFD1" />
                <span style={{ color: '#00FFD1', fontSize: '8px', fontFamily: "'Press Start 2P', monospace", marginTop: '4px' }}>
                  EDIT
                </span>
              </>
            )}
          </div>
        </div>

        {/* Camera badge */}
        <div
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-sm flex items-center justify-center"
          style={{
            background: uploading ? '#1E1B4B' : 'linear-gradient(135deg, #00FFD1, #00A896)',
            border: '2px solid #0A091C',
          }}
        >
          {uploading ? (
            <Loader2 size={12} color="#7A78A0" className="animate-spin" />
          ) : (
            <Camera size={12} color="#0A091C" />
          )}
        </div>
      </button>

      {error && (
        <p style={{ color: '#FF4D8D', fontSize: '10px', fontFamily: 'system-ui', marginTop: '8px' }}>{error}</p>
      )}

      {uploading && (
        <p style={{ color: '#00FFD1', fontSize: '10px', fontFamily: 'system-ui', marginTop: '8px' }}>
          Uploading...
        </p>
      )}
    </div>
  );
}

export function ProfileScreen() {
  const { user, accessToken, signOut } = useAuth();
  const navigate = useNavigate();
  const { updateCurrency } = useCurrency();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [currencySearch, setCurrencySearch] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const name = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Player';
  const email = profile?.email || user?.email || '';
  const initials = getInitials(name);

  useEffect(() => {
    if (accessToken) loadProfile();
  }, [accessToken]);

  const loadProfile = async () => {
    try {
      const data = await api.profile.get(accessToken!);
      setProfile(data.profile);
      // Sync saved currency to global context on load
      if (data.profile?.currency) updateCurrency(data.profile.currency);
    } catch (err: any) {
      console.warn('Profile load error (using local fallback):', err?.message || err);
      // Graceful fallback — build a local profile from auth session so the UI still renders
      setProfile({
        userId: user?.id || '',
        name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Player',
        email: user?.email || '',
        currency: 'IDR',
        biometricEnabled: false,
        cloudSyncEnabled: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const currentProfile = profile || {
      userId: user?.id || '',
      name: name,
      email: email,
      currency: 'IDR',
      biometricEnabled: false,
      cloudSyncEnabled: true,
    };
    const updated = { ...currentProfile, ...updates };
    setProfile(updated as UserProfile);
    if (updates.currency) updateCurrency(updates.currency);
    try {
      await api.profile.update(accessToken!, updates);
      setSuccessMsg('Saved!');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err) {
      console.error('Profile update error:', err);
      setSuccessMsg('Save failed');
      setTimeout(() => setSuccessMsg(''), 2000);
    }
  };

  const handleAvatarUpload = async (base64: string, mimeType: string) => {
    const data = await api.avatar.upload(accessToken!, base64, mimeType);
    if (data.avatarUrl) {
      setProfile(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
      setSuccessMsg('Photo updated!');
      setTimeout(() => setSuccessMsg(''), 2000);
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  const currencyLabel = profile?.currency || 'IDR';
  const activeCurrencyInfo = CURRENCIES.find(c => c.code === currencyLabel);

  const filteredCurrencies = currencySearch.trim()
    ? CURRENCIES.filter(c =>
        c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
        c.name.toLowerCase().includes(currencySearch.toLowerCase())
      )
    : CURRENCIES;

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#0A091C' }}>
      {/* Header */}
      <div
        className="relative px-4 pt-8 pb-6 flex flex-col items-center overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #1E1B4B 0%, #13112E 60%, #0A091C 100%)',
          borderBottom: '1px solid #2D2A6E',
        }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2), transparent 70%)' }}
        />

        <AvatarUpload
          initials={initials}
          avatarUrl={profile?.avatarUrl}
          onUpload={handleAvatarUpload}
        />

        <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '13px', color: '#E2E0FF', marginTop: '16px' }}>
          {name.toUpperCase()}
        </h2>
        <p style={{ color: '#7A78A0', fontSize: '12px', fontFamily: 'system-ui', marginTop: '6px' }}>
          {email}
        </p>

        <div
          className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-sm"
          style={{ background: 'rgba(0,255,209,0.1)', border: '1px solid rgba(0,255,209,0.3)' }}
        >
          <div style={{ width: '6px', height: '6px', background: '#00FFD1', boxShadow: '0 0 6px #00FFD1', borderRadius: '1px' }} />
          <span style={{ color: '#00FFD1', fontSize: '10px', fontFamily: "'Press Start 2P', monospace" }}>
            ACTIVE PLAYER
          </span>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 mt-3" style={{ color: '#00E57E', fontSize: '11px', fontFamily: 'system-ui' }}>
            <CheckCircle2 size={14} />
            {successMsg}
          </div>
        )}

        <p style={{ color: '#4A4870', fontSize: '10px', fontFamily: 'system-ui', marginTop: '8px' }}>
          Tap avatar to change photo
        </p>
      </div>

      {loading ? (
        <div className="p-4 flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 rounded-sm animate-pulse" style={{ background: '#13112E' }} />
          ))}
        </div>
      ) : (
        <>
          {/* Preferences */}
          <div className="mt-4">
            <div className="px-4 mb-2">
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#4A4870' }}>
                PREFERENCES
              </span>
            </div>
            <div style={{ background: '#13112E', border: '1px solid #2D2A6E' }}>
              <SettingRow
                icon={<Globe size={18} color="#8B5CF6" />}
                label="Currency"
                value={
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '16px' }}>{activeCurrencyInfo?.flag || '🌐'}</span>
                    <div className="flex flex-col items-end">
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#8B5CF6' }}>
                        {currencyLabel}
                      </span>
                      <span style={{ color: '#4A4870', fontSize: '10px', fontFamily: 'system-ui' }}>
                        {ALL_CURRENCY_SYMBOLS[currencyLabel] || currencyLabel}
                      </span>
                    </div>
                  </div>
                }
                onClick={() => { setCurrencySearch(''); setShowCurrencyPicker(true); }}
              />
              <SettingRow
                icon={<Moon size={18} color="#8B5CF6" />}
                label="Dark Mode"
                value={<Toggle checked={true} onChange={() => {}} />}
              />
              <SettingRow
                icon={<Wallet size={18} color="#8B5CF6" />}
                label="Account Type"
                value={<span style={{ color: '#4A4870', fontSize: '12px', fontFamily: 'system-ui' }}>Personal</span>}
              />
            </div>
          </div>

          {/* Security */}
          <div className="mt-4">
            <div className="px-4 mb-2">
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#4A4870' }}>
                SECURITY
              </span>
            </div>
            <div style={{ background: '#13112E', border: '1px solid #2D2A6E' }}>
              <SettingRow
                icon={<Shield size={18} color="#00FFD1" />}
                label="Change Password"
                onClick={() => {}}
              />
              <SettingRow
                icon={<Fingerprint size={18} color="#00FFD1" />}
                label="Biometric Login"
                value={
                  <Toggle
                    checked={profile?.biometricEnabled || false}
                    onChange={v => updateProfile({ biometricEnabled: v })}
                  />
                }
              />
            </div>
          </div>

          {/* Sync */}
          <div className="mt-4">
            <div className="px-4 mb-2">
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#4A4870' }}>
                CLOUD SYNC
              </span>
            </div>
            <div style={{ background: '#13112E', border: '1px solid #2D2A6E' }}>
              <SettingRow
                icon={<Cloud size={18} color="#00E57E" />}
                label="Cloud Sync"
                value={
                  <Toggle
                    checked={profile?.cloudSyncEnabled !== false}
                    onChange={v => updateProfile({ cloudSyncEnabled: v })}
                  />
                }
              />
              <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid #1E1B4B' }}>
                <CheckCircle2 size={18} color="#00E57E" />
                <div>
                  <p style={{ color: '#E2E0FF', fontSize: '12px', fontFamily: 'system-ui' }}>Supabase Connected</p>
                  <p style={{ color: '#4A4870', fontSize: '11px', fontFamily: 'system-ui' }}>Your data is securely synced</p>
                </div>
                <div style={{ marginLeft: 'auto', width: '8px', height: '8px', background: '#00E57E', boxShadow: '0 0 6px #00E57E' }} />
              </div>
            </div>
          </div>

          {/* About */}
          <div className="mt-4">
            <div className="px-4 mb-2">
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#4A4870' }}>
                ABOUT
              </span>
            </div>
            <div style={{ background: '#13112E', border: '1px solid #2D2A6E' }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1E1B4B' }}>
                <div className="flex items-center gap-3">
                  <Logo size="xs" />
                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#8B5CF6' }}>
                    AFI
                  </span>
                </div>
                <span style={{ color: '#4A4870', fontSize: '11px', fontFamily: 'system-ui' }}>v1.0.0</span>
              </div>
              <div className="px-4 py-3">
                <InstallAppButton variant="full" />
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="mt-4 mb-6 px-4">
            <button
              onClick={handleLogout}
              className="w-full py-4 rounded-sm flex items-center justify-center gap-3 transition-all active:scale-98"
              style={{
                background: 'rgba(255,77,141,0.08)',
                border: '1px solid rgba(255,77,141,0.3)',
                boxShadow: '0 0 10px rgba(255,77,141,0.05)',
              }}
            >
              <LogOut size={18} color="#FF4D8D" />
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#FF4D8D' }}>
                LOGOUT
              </span>
            </button>
          </div>
        </>
      )}

      {/* Currency Picker Modal — scrollable bottom sheet */}
      <BottomSheet
        isOpen={showCurrencyPicker}
        title="SELECT CURRENCY"
        onClose={() => setShowCurrencyPicker(false)}
      >
        {/* Search */}
        <div className="mb-4">
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-sm"
            style={{ background: '#0E0C2A', border: '1px solid #2D2A6E' }}
          >
            <Globe size={14} color="#4A4870" />
            <input
              type="text"
              placeholder="Search currency..."
              value={currencySearch}
              onChange={e => setCurrencySearch(e.target.value)}
              className="flex-1 bg-transparent outline-none"
              style={{ color: '#E2E0FF', fontSize: '13px', fontFamily: 'system-ui' }}
              autoFocus
            />
            {currencySearch && (
              <button onClick={() => setCurrencySearch('')}>
                <X size={12} color="#4A4870" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable list */}
        {filteredCurrencies.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <p style={{ color: '#4A4870', fontSize: '12px', fontFamily: 'system-ui' }}>No currencies found</p>
          </div>
        ) : (
          filteredCurrencies.map(c => {
            const active = currencyLabel === c.code;
            const symbol = ALL_CURRENCY_SYMBOLS[c.code] || c.code;
            return (
              <button
                key={c.code}
                onClick={() => { updateProfile({ currency: c.code }); setShowCurrencyPicker(false); }}
                className="w-full flex items-center gap-4 px-4 py-4 transition-all active:opacity-70"
                style={{
                  borderBottom: '1px solid #1A1838',
                  background: active ? 'rgba(124,58,237,0.12)' : 'transparent',
                  borderLeft: active ? '3px solid #7C3AED' : '3px solid transparent',
                }}
              >
                {/* Flag */}
                <span style={{ fontSize: '24px', lineHeight: 1, flexShrink: 0 }}>{c.flag}</span>

                {/* Name + Code */}
                <div className="flex-1 text-left">
                  <p style={{
                    color: active ? '#E2E0FF' : '#C4C2E0',
                    fontSize: '13px',
                    fontFamily: 'system-ui',
                    fontWeight: active ? 600 : 400,
                  }}>
                    {c.name}
                  </p>
                  <p style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8px',
                    color: active ? '#8B5CF6' : '#4A4870',
                    marginTop: '2px',
                  }}>
                    {c.code}
                  </p>
                </div>

                {/* Symbol */}
                <span style={{
                  color: active ? '#8B5CF6' : '#4A4870',
                  fontSize: '14px',
                  fontFamily: 'system-ui',
                  fontWeight: 600,
                  minWidth: '32px',
                  textAlign: 'right',
                }}>
                  {symbol}
                </span>

                {/* Check */}
                {active && (
                  <div
                    className="flex items-center justify-center rounded-sm flex-shrink-0"
                    style={{
                      width: '22px', height: '22px',
                      background: 'rgba(124,58,237,0.25)',
                      border: '1px solid #7C3AED',
                      boxShadow: '0 0 8px rgba(124,58,237,0.4)',
                    }}
                  >
                    <Check size={12} color="#8B5CF6" />
                  </div>
                )}
              </button>
            );
          })
        )}
      </BottomSheet>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <ConfirmDialog
          open={showLogoutConfirm}
          title="LOGOUT"
          message="Are you sure you want to logout from your account?"
          confirmLabel="LOGOUT"
          cancelLabel="STAY"
          variant="danger"
          icon="logout"
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
}