/**
 * Shared validation utilities for the Baja Run webapp
 */

/**
 * Validate email address format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (US format with at least 10 digits)
 */
export function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10;
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate that a string is not empty (after trimming whitespace)
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Validate minimum length
 */
export function hasMinLength(value: string, minLength: number): boolean {
  return value.length >= minLength;
}

/**
 * Validate maximum length
 */
export function hasMaxLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength;
}

/**
 * Validate that a value is within a numeric range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate a zip code (US format)
 */
export function validateZipCode(zipCode: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
}

/**
 * Validate that a date is in the future
 */
export function isFutureDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d > new Date();
}

/**
 * Validate that a date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

/**
 * Validate file type by extension or mime type
 */
export function isValidFileType(
  fileName: string,
  allowedTypes: string[],
  mimeType?: string
): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const normalizedAllowed = allowedTypes.map((t) => t.toLowerCase().replace('.', ''));

  if (normalizedAllowed.includes(extension)) return true;
  if (mimeType && normalizedAllowed.some((t) => mimeType.includes(t))) return true;

  return false;
}

/**
 * Validate file size (in bytes)
 */
export function isValidFileSize(size: number, maxSizeBytes: number): boolean {
  return size <= maxSizeBytes;
}

/**
 * Common validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate registration form data
 */
export function validateRegistrationForm(data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  emergencyName?: string;
  emergencyPhone?: string;
}): ValidationResult {
  const errors: string[] = [];

  if (!data.firstName?.trim()) {
    errors.push('First name is required');
  }

  if (!data.lastName?.trim()) {
    errors.push('Last name is required');
  }

  if (!data.email?.trim()) {
    errors.push('Email is required');
  } else if (!validateEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.phone?.trim()) {
    errors.push('Phone number is required');
  } else if (!validatePhone(data.phone)) {
    errors.push('Phone number must have at least 10 digits');
  }

  if (!data.emergencyName?.trim()) {
    errors.push('Emergency contact name is required');
  }

  if (!data.emergencyPhone?.trim()) {
    errors.push('Emergency contact phone is required');
  } else if (!validatePhone(data.emergencyPhone)) {
    errors.push('Emergency contact phone must have at least 10 digits');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
