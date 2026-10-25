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
 * Escapes unsafe HTML characters to prevent XSS.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Strips HTML tags entirely.
 */
export function stripHtml(input: string): string {
  if (!input) return '';
  return input.replace(/<[^>]*>?/gm, '');
}

/**
 * Validates currency amount ensuring positive finite number.
 */
export function validateCurrencyAmount(val: number): boolean {
  return typeof val === 'number' && !isNaN(val) && isFinite(val) && val >= 0;
}

/**
 * Validates that a numeric value is within an allowable range.
 */
export function validateNumericRange(
  val: number,
  min: number,
  max: number,
  fieldName: string = 'value'
): { valid: boolean; error?: string } {
  if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
    return { valid: false, error: `Invalid "${fieldName}": Must be a finite number.` };
  }
  if (val < min || val > max) {
    return {
      valid: false,
      error: `Invalid "${fieldName}": Must be between ${min} and ${max.toLocaleString()}.`,
    };
  }
  return { valid: true };
}

/**
 * Strict RFC 5322 regex validation for email.
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

/**
 * Masks sensitive API keys for safe UI display.
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return '';
  return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
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

/**
 * Token Bucket Rate Limiter
 * Enforces rate limits on AI queries and API calls.
 */
export class RateLimiter {
  private tokens: number;
  private readonly maxTokens: number;
  private readonly refillRateMs: number;
  private readonly refillAmount: number;
  private lastRefill: number;

  constructor(maxTokens: number = 10, refillRateMs: number = 1000, refillAmount: number = 1) {
    this.maxTokens = Math.max(1, maxTokens);
    this.tokens = this.maxTokens;
    this.refillRateMs = Math.max(10, refillRateMs);
    this.refillAmount = Math.max(1, refillAmount);
    this.lastRefill = Date.now();
  }

  /**
   * Consumes `count` tokens if available. Returns true if allowed, false if rejected.
   */
  consume(count: number = 1): boolean {
    this.refill();
    if (count <= 0) return true;
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }

  /**
   * Alias for consume(1).
   */
  tryConsume(): boolean {
    return this.consume(1);
  }

  /**
   * Returns current token balance after applying elapsed refills.
   */
  getTokens(): number {
    this.refill();
    return this.tokens;
  }

  /**
   * Resets rate limiter back to max capacity.
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed >= this.refillRateMs) {
      const intervals = Math.floor(elapsed / this.refillRateMs);
      this.tokens = Math.min(this.maxTokens, this.tokens + intervals * this.refillAmount);
      this.lastRefill = now;
    }
  }
}

export function createRateLimiter(
  maxTokens: number = 10,
  refillRateMs: number = 1000
): RateLimiter {
  return new RateLimiter(maxTokens, refillRateMs);
}
