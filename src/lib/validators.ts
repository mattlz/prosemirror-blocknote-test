/**
 * Validation functions and schemas
 */

import { VALIDATION_RULES } from './constants';

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 */
export function isValidPassword(password: string): boolean {
  return password.length >= VALIDATION_RULES.MIN_PASSWORD_LENGTH &&
         password.length <= VALIDATION_RULES.MAX_PASSWORD_LENGTH;
}

/**
 * Validates document title
 */
export function isValidTitle(title: string): boolean {
  return title.length >= VALIDATION_RULES.MIN_TITLE_LENGTH &&
         title.length <= VALIDATION_RULES.MAX_TITLE_LENGTH;
}

/**
 * Validates user input for potential XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Validates that a string is not empty after trimming
 */
export function isNonEmptyString(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates that a value is a valid ID (non-empty string)
 */
export function isValidId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0;
}