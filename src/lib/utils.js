import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Format bytes to human readable format
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Format number with commas
export function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

// Format date
export function formatDate(date, formatStr = 'yyyy-MM-dd HH:mm:ss') {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

// Format relative time
export function formatRelativeTime(date) {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

// Validate IP address
export function isValidIP(ip) {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// Validate MAC address
export function isValidMAC(mac) {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
}

// Generate random color for charts
export function generateColor(index) {
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
    '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'
  ];
  return colors[index % colors.length];
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// Deep clone object
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Check if user has permission
export function hasPermission(user, requiredRole) {
  if (!user) return false;
  
  const roleHierarchy = {
    'viewer': 1,
    'user': 2,
    'admin': 3
  };
  
  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;
  
  return userLevel >= requiredLevel;
}

// Download file
export function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Copy to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (err) {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

// Get application icon
export function getApplicationIcon(appName) {
  const iconMap = {
    'HTTP': '🌐',
    'HTTPS': '🔒',
    'DNS': '🔍',
    'FTP': '📁',
    'SSH': '🔑',
    'Telnet': '💻',
    'SMTP': '📧',
    'POP3': '📬',
    'IMAP': '📮',
    'YouTube': '📺',
    'Netflix': '🎬',
    'Facebook': '📘',
    'Twitter': '🐦',
    'Instagram': '📷',
    'WhatsApp': '💬',
    'Skype': '📞',
    'Zoom': '🎥',
    'BitTorrent': '⬇️',
    'Unknown': '❓'
  };
  
  return iconMap[appName] || iconMap['Unknown'];
}

// Get protocol color
export function getProtocolColor(protocol) {
  const colorMap = {
    'HTTP': '#4CAF50',
    'HTTPS': '#2196F3',
    'DNS': '#FF9800',
    'FTP': '#9C27B0',
    'SSH': '#F44336',
    'TCP': '#607D8B',
    'UDP': '#795548',
    'ICMP': '#E91E63'
  };
  
  return colorMap[protocol] || '#9E9E9E';
}

