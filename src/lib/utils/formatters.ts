// Date and Currency Formatting Utilities for Invoice System

import { DateOption } from '../services/invoices/types';

// Currency formatting
export const formatCurrency = (
  amount: number, 
  currency: string = 'USD', 
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format amount from cents to currency string
export const formatAmountFromCents = (
  amountInCents: number, 
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return formatCurrency(amountInCents / 100, currency, locale);
};

// Parse currency string to number (removes currency symbols and formatting)
export const parseCurrencyToNumber = (currencyString: string): number => {
  return parseFloat(currencyString.replace(/[^0-9.-]+/g, ''));
};

// Date formatting functions
export const formatDate = (
  date: Date, 
  options?: Intl.DateTimeFormatOptions,
  locale: string = 'en-US'
): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(date);
};

// Format date for table display (shorter format)
export const formatDateShort = (date: Date, locale: string = 'en-US'): string => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }, locale);
};

// Format date for form inputs (YYYY-MM-DD)
export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Parse date from input format
export const parseDateFromInput = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00');
};

// Calculate days difference between dates
export const calculateDaysDifference = (startDate: Date, endDate: Date): number => {
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

// Calculate days overdue (negative means not due yet)
export const calculateDaysOverdue = (dueDate: Date, referenceDate: Date = new Date()): number => {
  return calculateDaysDifference(dueDate, referenceDate);
};

// Check if invoice is overdue
export const isInvoiceOverdue = (dueDate: Date, referenceDate: Date = new Date()): boolean => {
  return calculateDaysOverdue(dueDate, referenceDate) > 0;
};

// Get relative time string (e.g., "3 days ago", "in 5 days")
export const getRelativeTimeString = (date: Date, referenceDate: Date = new Date()): string => {
  const daysDiff = calculateDaysDifference(referenceDate, date);
  
  if (daysDiff === 0) {
    return 'Today';
  } else if (daysDiff === 1) {
    return 'Tomorrow';
  } else if (daysDiff === -1) {
    return 'Yesterday';
  } else if (daysDiff > 0) {
    return `In ${daysDiff} days`;
  } else {
    return `${Math.abs(daysDiff)} days ago`;
  }
};

// Generate month/year options for filter dropdown
export const generateDateOptions = (yearRange: number = 2): DateOption[] => {
  const options: DateOption[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate options for current year and previous years
  for (let yearOffset = 0; yearOffset >= -yearRange; yearOffset--) {
    const year = currentYear + yearOffset;
    
    // For current year, only include past and current month
    const endMonth = yearOffset === 0 ? currentMonth : 11;
    
    for (let month = endMonth; month >= 0; month--) {
      options.push({
        label: `${months[month]} ${year}`,
        value: {
          month: months[month].toLowerCase(),
          year: year.toString()
        }
      });
    }
  }

  return options;
};

// Get date range for a specific month/year
export const getDateRangeForMonth = (month: string, year: string): { startDate: Date; endDate: Date } => {
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  
  const monthIndex = months.indexOf(month.toLowerCase());
  const yearNum = parseInt(year);
  
  const startDate = new Date(yearNum, monthIndex, 1);
  const endDate = new Date(yearNum, monthIndex + 1, 0); // Last day of month
  
  return { startDate, endDate };
};

// Format invoice status with proper capitalization
export const formatInvoiceStatus = (status: 'paid' | 'unpaid' | 'draft'): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Get status color for badges
export const getStatusColor = (status: 'paid' | 'unpaid' | 'draft'): string => {
  switch (status) {
    case 'paid':
      return 'success'; // Green
    case 'unpaid':
      return 'error';   // Red
    case 'draft':
      return 'light';   // Gray
    default:
      return 'light';
  }
};

// Format large numbers with appropriate suffixes (K, M, B)
export const formatLargeNumber = (num: number, decimals: number = 1): string => {
  if (num === 0) return '0';
  
  const k = 1000;
  const sizes = ['', 'K', 'M', 'B', 'T'];
  
  const i = Math.floor(Math.log(Math.abs(num)) / Math.log(k));
  
  if (i === 0) return num.toString();
  
  return parseFloat((num / Math.pow(k, i)).toFixed(decimals)) + sizes[i];
};

// Debounce function for search inputs
export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Generate invoice ID
export const generateInvoiceId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `#${timestamp}${random}`;
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Format percentage
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

// Calculate percentage
export const calculatePercentage = (part: number, total: number): number => {
  if (total === 0) return 0;
  return (part / total) * 100;
};

// Sort array by multiple criteria
export const multiSort = <T>(
  array: T[],
  sortKeys: Array<{
    key: keyof T;
    direction: 'asc' | 'desc';
  }>
): T[] => {
  return [...array].sort((a, b) => {
    for (const { key, direction } of sortKeys) {
      const aVal = a[key];
      const bVal = b[key];
      
      let result = 0;
      
      if (aVal === undefined && bVal === undefined) {
        result = 0;
      } else if (aVal === undefined) {
        result = 1;
      } else if (bVal === undefined) {
        result = -1;
      } else if (aVal !== null && bVal !== null && aVal < bVal) {
        result = -1;
      } else if (aVal !== null && bVal !== null && aVal > bVal) {
        result = 1;
      }
      
      if (result !== 0) {
        return direction === 'desc' ? -result : result;
      }
    }
    
    return 0;
  });
};

// Deep clone object (for immutable state updates)
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
};

// Safe number parsing with fallback
export const safeParseNumber = (value: string | number, fallback: number = 0): number => {
  if (typeof value === 'number') return isNaN(value) ? fallback : value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// Get initials from name
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

const formattersUtils = {
  formatCurrency,
  formatAmountFromCents,
  parseCurrencyToNumber,
  formatDate,
  formatDateShort,
  formatDateForInput,
  parseDateFromInput,
  calculateDaysDifference,
  calculateDaysOverdue,
  isInvoiceOverdue,
  getRelativeTimeString,
  generateDateOptions,
  getDateRangeForMonth,
  formatInvoiceStatus,
  getStatusColor,
  formatLargeNumber,
  debounce,
  generateInvoiceId,
  validateEmail,
  formatPercentage,
  calculatePercentage,
  multiSort,
  deepClone,
  safeParseNumber,
  truncateText,
  getInitials
};

export default formattersUtils;