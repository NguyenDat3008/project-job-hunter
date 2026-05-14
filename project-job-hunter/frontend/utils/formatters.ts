// Format utilities
import { format, formatDistance } from 'date-fns';
import { vi } from 'date-fns/locale';

export const formatCurrency = (
  amount: number,
  currency: string = 'VND'
): string => {
  const formatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  });
  return formatter.format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

export const formatDate = (date: string | Date, formatStr: string = 'dd/MM/yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatStr, { locale: vi });
  } catch (error) {
    return '';
  }
};

export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistance(dateObj, new Date(), {
      addSuffix: true,
      locale: vi,
    });
  } catch (error) {
    return '';
  }
};

export const formatDuration = (startDate: string | Date, endDate: string | Date): string => {
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    
    if (months === 0) return 'Dưới 1 tháng';
    if (months === 1) return '1 tháng';
    if (months < 12) return `${months} tháng`;
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (remainingMonths === 0) {
      return years === 1 ? '1 năm' : `${years} năm`;
    }
    return `${years} năm ${remainingMonths} tháng`;
  } catch (error) {
    return '';
  }
};

export const abbreviateNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const capitalizeWords = (str: string): string => {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const truncateText = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

export default {
  formatCurrency,
  formatNumber,
  formatDate,
  formatRelativeTime,
  formatDuration,
  abbreviateNumber,
  capitalizeWords,
  truncateText,
};