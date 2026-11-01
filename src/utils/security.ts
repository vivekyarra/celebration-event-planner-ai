/**
 * Security, Schema Validation & Rate Limiting Engine
 * Protects against XSS, injection attacks, prototype pollution, and malformed inputs.
 */

import { EventPlan, EventType } from '../types';

export const VALID_EVENT_TYPES: readonly EventType[] = [
  'wedding',
  'birthday',
  'corporate',
  'anniversary',
  'hackathon',
  'baby_shower',
  'festive_gala',
  'milestone',
] as const;

export interface ValidationResult {
  isValid: boolean;
  valid: boolean; // Alias for backward/forward compatibility
  errors: string[];
}

/**
 * Safe currency formatter resilient to NaN, Infinity, zero, and negative values.
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    return `${currency} 0`;
  }
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  return isNegative ? `-${currency} ${formatted}` : `${currency} ${formatted}`;
}

/**
 * Detects prototype pollution payloads in JSON strings or object keys.
 */
export function detectPrototypePollution(input: unknown): boolean {
  if (!input || typeof input !== 'object') return false;

  try {
    const rawKeys = Object.getOwnPropertyNames(input);
    if (rawKeys.includes('__proto__') || rawKeys.includes('constructor') || rawKeys.includes('prototype')) {
      return true;
    }

    const str = JSON.stringify(input);
    if (str && (str.includes('"__proto__"') || str.includes('"constructor"') || str.includes('"prototype"'))) {
      return true;
    }
  } catch {
    return false;
  }

  // Deep inspection
  for (const key of Object.keys(input as Record<string, unknown>)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return true;
    }
    const val = (input as Record<string, unknown>)[key];
    if (typeof val === 'object' && val !== null) {
      if (detectPrototypePollution(val)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Strips dangerous prototype keys to defend against prototype pollution attacks.
 */
export function preventPrototypePollution<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => preventPrototypePollution(item)) as unknown as T;
  }

  const cleanObj: Record<string, unknown> = Object.create(null);
  const dangerousKeys = new Set(['__proto__', 'constructor', 'prototype']);

  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (dangerousKeys.has(key)) {
      continue;
    }
    const val = (obj as Record<string, unknown>)[key];
    cleanObj[key] = typeof val === 'object' && val !== null ? preventPrototypePollution(val) : val;
  }

  return cleanObj as T;
}

/**
 * Validates an EventPlan schema against strict integrity rules.
 */
export function validateEventPlan(plan: unknown): ValidationResult {
  const errors: string[] = [];

  if (!plan || typeof plan !== 'object') {
    return {
      isValid: false,
      valid: false,
      errors: ['Event plan payload must be a non-null object.'],
    };
  }

  // Prototype pollution check
  if (detectPrototypePollution(plan)) {
    errors.push('Prototype pollution payload detected in plan structure.');
  }

  const p = plan as Partial<EventPlan> & Record<string, unknown>;

  // Required: id
  if (!p.id || typeof p.id !== 'string' || p.id.trim() === '') {
    errors.push('Event plan requires a non-empty string "id".');
  }

  // Required: title
  if (!p.title || typeof p.title !== 'string' || p.title.trim() === '') {
    errors.push('Event plan requires a non-empty string "title".');
  }

  // Required: eventType
  if (!p.eventType || !VALID_EVENT_TYPES.includes(p.eventType as EventType)) {
    errors.push(
      `Invalid eventType "${p.eventType}". Must be one of: ${VALID_EVENT_TYPES.join(', ')}.`
    );
  }

  // Numeric checks: guestCount
  if (
    typeof p.guestCount !== 'number' ||
    isNaN(p.guestCount) ||
    !isFinite(p.guestCount) ||
    p.guestCount <= 0
  ) {
    errors.push('guestCount must be a positive finite number greater than 0.');
  }

  // Numeric checks: totalBudget
  if (
    typeof p.totalBudget !== 'number' ||
    isNaN(p.totalBudget) ||
    !isFinite(p.totalBudget) ||
    p.totalBudget < 0
  ) {
    errors.push('totalBudget must be a non-negative finite number (>= 0).');
  }

  // Array validations
  if (p.budgetBreakdown && !Array.isArray(p.budgetBreakdown)) {
    errors.push('budgetBreakdown must be an array of category items.');
  }

  if (p.timeline && !Array.isArray(p.timeline)) {
    errors.push('timeline must be an array of timeline items.');
  }

  if (p.guests && !Array.isArray(p.guests)) {
    errors.push('guests must be an array of guest items.');
  }

  const isValid = errors.length === 0;
  return {
    isValid,
    valid: isValid,
    errors,
  };
}

/*
 * Core sanitization, validation and rate-limiting primitives have a single
 * implementation in services/security; they are re-exported here so existing
 * `utils/security` and `utils/schemaValidator` imports keep working.
 */
export {
  sanitizeHtml,
  stripHtml,
  validateCurrencyAmount,
  validateNumericRange,
  validateEmail,
  maskApiKey,
  RateLimiter,
  ClientRateLimiter,
  createRateLimiter,
  HEX_COLOR_REGEX,
  isValidHexColor,
  calculateRelativeLuminance,
  calculateContrastRatio,
  isWcagCompliant,
  sanitizeUrl,
  isSafeUrl,
  getAccessibleName,
  exportPlanToJson,
} from '../services/security';
export type { NumericRangeResult, RateLimiterOptions } from '../services/security';
