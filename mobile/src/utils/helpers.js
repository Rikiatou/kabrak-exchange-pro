import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatCurrency = (amount, currencyCode = '') => {
  const num = parseFloat(amount || 0);
  const formatted = Number.isInteger(num)
    ? num.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
    : num.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  return currencyCode ? `${formatted} ${currencyCode}` : formatted;
};

export const parseCleanNumber = (str) => {
  if (!str) return 0;
  // Remove spaces and non-breaking spaces (thousand separators)
  // Replace comma used as decimal separator, keep dot
  const cleaned = String(str).replace(/[\s\u00A0]/g, '').replace(/,/g, '.');
  // If multiple dots, only keep last as decimal (e.g. 170.100.000 → 170100000)
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parseFloat(parts.join(''));
  }
  return parseFloat(cleaned) || 0;
};

export const formatDate = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr });
};

export const formatRelative = (date) => {
  if (!date) return '-';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
};

export const getStatusConfig = (status) => {
  switch (status) {
    case 'paid':
      return { label: 'Soldé', color: '#2e7d32', bg: '#e8f5e9', icon: 'check-circle' };
    case 'partial':
      return { label: 'Partiel', color: '#f57c00', bg: '#fff3e0', icon: 'clock-outline' };
    default:
      return { label: 'Non payé', color: '#c62828', bg: '#ffebee', icon: 'alert-circle' };
  }
};

export const getSeverityConfig = (severity) => {
  switch (severity) {
    case 'critical':
      return { color: '#c62828', bg: '#ffebee', icon: 'alert-circle' };
    case 'warning':
      return { color: '#f57c00', bg: '#fff3e0', icon: 'alert' };
    default:
      return { color: '#0277bd', bg: '#e1f5fe', icon: 'information' };
  }
};

export const truncate = (str, n = 30) => {
  if (!str) return '';
  return str.length > n ? str.substring(0, n) + '...' : str;
};

export const getInitials = (name = '') => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const calculateProfit = (amountFrom, amountTo, buyRate, sellRate) => {
  return (parseFloat(sellRate) - parseFloat(buyRate)) * parseFloat(amountFrom);
};
