/**
 * Utility functions for formatting data
 */

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'Mai';
  
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  try {
    return new Date(dateString).toLocaleDateString('it-IT', defaultOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Data non valida';
  }
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatPrice = (amount, currency = 'EUR') => {
  try {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  } catch (error) {
    console.error('Error formatting price:', error);
    return `${amount} ${currency}`;
  }
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Adesso';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minuti fa`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ore fa`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} giorni fa`;
    
    return formatDate(dateString, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return formatDate(dateString);
  }
};

export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};