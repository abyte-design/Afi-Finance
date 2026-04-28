import { Transaction } from './types';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'CA$', AUD: 'A$',
  CHF: 'Fr', INR: '₹', BRL: 'R$', IDR: 'Rp', SGD: 'S$', MYR: 'RM',
  THB: '฿', PHP: '₱', VND: '₫', KRW: '₩', CNY: '¥', SAR: '﷼', AED: 'د.إ',
};

// Currencies that use no decimal places
const INTEGER_CURRENCIES = ['IDR', 'JPY', 'VND', 'KRW'];

export interface CurrencyConfig {
  symbol: string;
  isInteger: boolean;
  placeholder: string;
  inputMode: 'numeric' | 'decimal';
}

export function getCurrencyConfig(currency: string): CurrencyConfig {
  const isInteger = INTEGER_CURRENCIES.includes(currency);
  return {
    symbol: CURRENCY_SYMBOLS[currency] || currency,
    isInteger,
    placeholder: isInteger ? '0' : '0.00',
    inputMode: isInteger ? 'numeric' : 'decimal',
  };
}

/**
 * Sanitize a raw input string for the given currency.
 * IDR/JPY/VND/KRW → integers only with dot-thousand separators (e.g. 13.800.000).
 * Others → accept both '.' and ',' as decimal separator (normalize to '.'),
 *           allow up to 2 decimal places.
 */
export function sanitizeAmountInput(val: string, currency: string): string {
  const { isInteger } = getCurrencyConfig(currency);
  if (isInteger) {
    // Strip everything that isn't a digit
    const digits = val.replace(/[^0-9]/g, '');
    if (!digits) return '';
    // Remove leading zeros, then format with dot thousand-separators (id-ID locale)
    const num = parseInt(digits, 10);
    return num.toLocaleString('id-ID');
  }
  // Normalize comma → dot  (European/Android keyboard sends comma)
  const normalized = val.replace(/,/g, '.');
  // Strip anything that isn't a digit or a dot
  const cleaned = normalized.replace(/[^0-9.]/g, '');
  // Only allow a single decimal point
  const dotIdx = cleaned.indexOf('.');
  if (dotIdx === -1) return cleaned;
  const integer = cleaned.slice(0, dotIdx);
  const decimal = cleaned.slice(dotIdx + 1).replace(/\./g, '').slice(0, 2);
  return integer + '.' + decimal;
}

export function formatCurrency(amount: number, currency = 'IDR'): string {
  const isInteger = INTEGER_CURRENCIES.includes(currency);
  // Use locale appropriate to currency
  const localeMap: Record<string, string> = {
    IDR: 'id-ID', VND: 'vi-VN', KRW: 'ko-KR', JPY: 'ja-JP',
    THB: 'th-TH', CNY: 'zh-CN', MYR: 'ms-MY', PHP: 'fil-PH',
  };
  const locale = localeMap[currency] || 'en-US';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: isInteger ? 0 : 2,
      maximumFractionDigits: isInteger ? 0 : 2,
    }).format(amount);
  } catch {
    // Fallback for unsupported currencies
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: isInteger ? 0 : 2,
      maximumFractionDigits: isInteger ? 0 : 2,
    }).format(amount);
    return `${symbol}${formatted}`;
  }
}

/**
 * Compact format for tight UI spaces (e.g. 3-col cards).
 * Always returns symbol + abbreviated number: "Rp 1,2M", "$4.5K", etc.
 */
export function formatCurrencyCompact(amount: number, currency = 'IDR'): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  let num: string;
  if (abs >= 1_000_000_000) {
    num = (abs / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1) + 'B';
  } else if (abs >= 1_000_000) {
    num = (abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1) + 'M';
  } else if (abs >= 1_000) {
    num = (abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1) + 'K';
  } else {
    num = abs.toString();
  }
  return `${sign}${symbol}${num}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getMonthYear(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function isCurrentMonth(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Welcome';
  return 'Good Evening';
}

export const EXPENSE_CATEGORIES = [
  { id: 'Food', label: 'Food', icon: 'UtensilsCrossed', color: '#F59E0B' },
  { id: 'Shopping', label: 'Shopping', icon: 'ShoppingBag', color: '#FF4D8D' },
  { id: 'Transport', label: 'Transport', icon: 'Car', color: '#60A5FA' },
  { id: 'Bills', label: 'Bills', icon: 'Zap', color: '#F97316' },
  { id: 'Entertainment', label: 'Entertainment', icon: 'Gamepad2', color: '#A78BFA' },
  { id: 'Health', label: 'Health', icon: 'Heart', color: '#00E57E' },
  { id: 'Travel', label: 'Travel', icon: 'Plane', color: '#00FFD1' },
  { id: 'Education', label: 'Education', icon: 'BookOpen', color: '#7C3AED' },
  { id: 'Other', label: 'Other', icon: 'Circle', color: '#7A78A0' },
];

export const INCOME_CATEGORIES = [
  { id: 'Salary', label: 'Salary', icon: 'Briefcase', color: '#00E57E' },
  { id: 'Freelance', label: 'Freelance', icon: 'Code2', color: '#00FFD1' },
  { id: 'Investment', label: 'Investment', icon: 'TrendingUp', color: '#F59E0B' },
  { id: 'Gift', label: 'Gift', icon: 'Gift', color: '#FF4D8D' },
  { id: 'Other', label: 'Other', icon: 'Circle', color: '#7A78A0' },
];

export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#F59E0B', Shopping: '#FF4D8D', Transport: '#60A5FA',
  Bills: '#F97316', Entertainment: '#A78BFA', Health: '#00E57E',
  Travel: '#00FFD1', Education: '#7C3AED', Salary: '#00E57E',
  Freelance: '#00FFD1', Investment: '#F59E0B', Gift: '#FF4D8D',
  Other: '#7A78A0',
};

export const CHART_COLORS = ['#7C3AED', '#00FFD1', '#FF4D8D', '#F59E0B', '#00E57E', '#60A5FA', '#F97316', '#A78BFA'];

export function computeMonthlyStats(transactions: Transaction[]) {
  const now = new Date();
  const monthly = transactions.filter(t => isCurrentMonth(t.date));
  const totalBalance = transactions.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0);
  const monthlyIncome = monthly.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = monthly.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
  return { totalBalance, monthlyIncome, monthlyExpenses, savingsRate };
}

export function getLast6Months() {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });
}

export function getLast12Months() {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (11 - i));
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}