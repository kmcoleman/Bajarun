/**
 * Shared formatting utilities for the Baja Run webapp
 */

/**
 * Format phone number as user types: (555) 123-4567
 */
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) {
    return digits.length > 0 ? `(${digits}` : '';
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
}

/**
 * Format phone number for display (already complete number): (555) 123-4567
 * Handles 10-digit and 11-digit (with leading 1) numbers
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone; // Return original if can't format
}

/**
 * Format years riding experience for display
 */
export function formatYearsRiding(value: string): string {
  const map: Record<string, string> = {
    less1: 'Less than 1 year',
    '1to5': '1-5 years',
    '5to10': '5-10 years',
    '10plus': '10+ years',
  };
  return map[value] || value;
}

/**
 * Format off-road experience level for display
 */
export function formatOffRoadExperience(value: string): string {
  const map: Record<string, string> = {
    none: 'No off-road experience',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };
  return map[value] || value;
}

/**
 * Format Baja experience for display
 */
export function formatBajaExperience(value: string): string {
  const map: Record<string, string> = {
    no: 'First time',
    once: 'Once before',
    twice: 'Twice before',
    many: 'Many times',
  };
  return map[value] || value;
}

/**
 * Format repair experience for display
 */
export function formatRepairExperience(value: string): string {
  const map: Record<string, string> = {
    none: 'None',
    basic: 'Basic',
    comfortable: 'Comfortable',
    macgyver: 'MacGyver level',
  };
  return map[value] || value;
}

/**
 * Format Spanish proficiency level for display
 */
export function formatSpanishLevel(value: string): string {
  const map: Record<string, string> = {
    none: 'None',
    basic: 'Basic',
    conversational: 'Conversational',
    fluent: 'Fluent',
  };
  return map[value] || value;
}

/**
 * Format accommodation preference for display
 */
export function formatAccommodationPreference(value: string): string {
  const map: Record<string, string> = {
    camping: 'Prefer camping',
    hotels: 'Prefer hotels',
    either: 'Either is fine',
  };
  return map[value] || value;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for display (e.g., "Mar 19, 2026")
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  return d.toLocaleDateString('en-US', options || defaultOptions);
}

/**
 * Format date with time for display (e.g., "Mar 19, 2026 at 3:45 PM")
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format relative time (e.g., "2 hours ago", "Yesterday", "3 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return formatDate(d);
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Get initials from a name (e.g., "John Doe" → "JD")
 */
export function getInitials(name: string, maxChars: number = 2): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, maxChars);
}

/**
 * Format file size for display (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
