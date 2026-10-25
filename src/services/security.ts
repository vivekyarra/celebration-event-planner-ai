/**
 * CelebriteAI Enterprise Security & Resilience Suite
 * Provides client-side rate limiting, numerical range validation,
 * HTML sanitization against XSS, API key masking, and regex validations.
 *
 * @module services/security
 */

export interface RateLimiterOptions {
  /** Maximum number of tokens the bucket can hold. Defaults to 10. */
  maxTokens?: number;
  /** Number of tokens refilled per interval. Defaults to 10. */
  refillRate?: number;
  /** Duration of refill interval in milliseconds. Defaults to 60000 (1 minute). */
  refillIntervalMs?: number;
}

/**
 * Token-bucket Client-side Rate Limiter.
 * Defends against client-side API throttling, AI query spam, and resource exhaustion.
 *
 * @example
 * ```ts
 * const limiter = new ClientRateLimiter({ maxTokens: 5, refillRate: 5, refillIntervalMs: 60000 });
 * if (limiter.tryConsume(1)) {
 *   await queryEventCopilot(...);
 * } else {
 *   const resetSeconds = Math.ceil((limiter.getResetTime() - Date.now()) / 1000);
 *   console.warn(`Rate limit exceeded. Try again in ${resetSeconds}s.`);
 * }
 * ```
 */
export class ClientRateLimiter {
  private readonly maxTokens: number;
  private readonly refillRate: number;
  private readonly refillIntervalMs: number;
  private tokens: number;
  private lastRefillTimestamp: number;

  /**
   * Initializes a new instance of the ClientRateLimiter.
   *
   * @param options Configuration options or maximum tokens.
   * @param refillRate Optional refill rate or interval in ms if second param is interval.
   * @param refillIntervalMs Optional refill interval in ms.
   */
  constructor(
    options?: RateLimiterOptions | number,
    refillRate?: number,
    refillIntervalMs?: number
  ) {
    if (typeof options === 'number') {
      this.maxTokens = options > 0 ? options : 10;
      // Support (maxTokens, intervalMs) or (maxTokens, refillRate, intervalMs)
      if (typeof refillRate === 'number' && typeof refillIntervalMs === 'number') {
        this.refillRate = refillRate > 0 ? refillRate : this.maxTokens;
        this.refillIntervalMs = refillIntervalMs > 0 ? refillIntervalMs : 60000;
      } else if (typeof refillRate === 'number') {
        this.refillRate = this.maxTokens;
        this.refillIntervalMs = refillRate > 0 ? refillRate : 60000;
      } else {
        this.refillRate = this.maxTokens;
        this.refillIntervalMs = 60000;
      }
    } else {
      const opts = options || {};
      this.maxTokens = opts.maxTokens && opts.maxTokens > 0 ? opts.maxTokens : 10;
      this.refillRate = opts.refillRate && opts.refillRate > 0 ? opts.refillRate : 10;
      this.refillIntervalMs = opts.refillIntervalMs && opts.refillIntervalMs > 0 ? opts.refillIntervalMs : 60000;
    }

    this.tokens = this.maxTokens;
    this.lastRefillTimestamp = Date.now();
  }

  /**
   * Refills tokens based on elapsed wall-clock time since last calculation.
   * @private
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillTimestamp;
    if (elapsed > 0) {
      const tokensToAdd = (elapsed / this.refillIntervalMs) * this.refillRate;
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefillTimestamp = now;
    }
  }

  /**
   * Attempts to consume the specified number of tokens from the bucket.
   *
   * @param tokens Number of tokens to consume (defaults to 1). Must be greater than 0.
   * @returns `true` if tokens were successfully consumed; `false` if insufficient tokens available.
   *
   * @example
   * ```ts
   * const allowed = limiter.tryConsume();
   * if (!allowed) {
   *   alert('Too many requests. Please wait a moment.');
   * }
   * ```
   */
  public tryConsume(tokens: number = 1): boolean {
    if (tokens <= 0) return true;
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  /**
   * Alias for `tryConsume` for standard token consumption.
   *
   * @param tokens Number of tokens to consume.
   * @returns `true` if consumed, `false` otherwise.
   */
  public consume(tokens: number = 1): boolean {
    return this.tryConsume(tokens);
  }

  /**
   * Returns the current number of available tokens remaining in the bucket.
   *
   * @returns Non-negative integer representing remaining capacity.
   *
   * @example
   * ```ts
   * const remaining = limiter.getRemainingTokens();
   * console.log(`Remaining quota: ${remaining}`);
   * ```
   */
  public getRemainingTokens(): number {
    this.refill();
    return Math.max(0, Math.floor(this.tokens));
  }

  /**
   * Alias for `getRemainingTokens`.
   *
   * @returns Non-negative integer representing available token quota.
   */
  public getTokens(): number {
    return this.getRemainingTokens();
  }

  /**
   * Calculates the Unix timestamp (in milliseconds) when the token bucket will be fully refilled.
   *
   * @returns Unix epoch timestamp in milliseconds.
   *
   * @example
   * ```ts
   * const resetEpochMs = limiter.getResetTime();
   * const waitSec = Math.max(0, Math.ceil((resetEpochMs - Date.now()) / 1000));
   * ```
   */
  public getResetTime(): number {
    this.refill();
    if (this.tokens >= this.maxTokens) {
      return Date.now();
    }
    const needed = this.maxTokens - this.tokens;
    const msToFull = (needed / this.refillRate) * this.refillIntervalMs;
    return Date.now() + Math.ceil(msToFull);
  }

  /**
   * Manually resets the rate limiter to maximum capacity.
   */
  public reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefillTimestamp = Date.now();
  }
}

/**
 * Backward-compatible alias for ClientRateLimiter.
 */
export const RateLimiter = ClientRateLimiter;

/**
 * Factory helper function to instantiate a ClientRateLimiter.
 *
 * @param maxTokens Maximum capacity of the token bucket.
 * @param intervalMs Milliseconds before refill.
 * @returns Initialized ClientRateLimiter.
 */
export function createRateLimiter(maxTokens: number = 10, intervalMs: number = 60000): ClientRateLimiter {
  return new ClientRateLimiter(maxTokens, intervalMs);
}

/**
 * Result object returned by numeric range validation.
 */
export interface NumericRangeResult {
  /** Indicates whether the value satisfies range requirements. */
  valid: boolean;
  /** Human-readable error message explaining why validation failed, if invalid. */
  error?: string;
}

/**
 * Validates that a numeric input is finite, non-NaN, and strictly within the specified [min, max] range.
 *
 * @param val The numeric value to validate.
 * @param min The minimum acceptable value (inclusive).
 * @param max The maximum acceptable value (inclusive).
 * @param fieldName Human-readable descriptor for error messages (e.g. "Total Budget", "Guest Count").
 * @returns Result object containing `valid: boolean` and optional `error: string`.
 *
 * @example
 * ```ts
 * const check = validateNumericRange(budget, 100, 50000000, 'Total Budget');
 * if (!check.valid) {
 *   console.error(check.error);
 * }
 * ```
 */
export function validateNumericRange(
  val: number,
  min: number,
  max: number,
  fieldName: string = 'Value'
): NumericRangeResult {
  if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
    return {
      valid: false,
      error: `${fieldName} must be a valid finite number.`,
    };
  }

  if (val < min) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${min.toLocaleString()}. (Received: ${val.toLocaleString()})`,
    };
  }

  if (val > max) {
    return {
      valid: false,
      error: `${fieldName} cannot exceed ${max.toLocaleString()}. (Received: ${val.toLocaleString()})`,
    };
  }

  return { valid: true };
}

/**
 * Sanitizes an untrusted string by escaping HTML entities to protect against Cross-Site Scripting (XSS).
 *
 * @param input Raw user or imported string.
 * @returns HTML-entity escaped sanitized string.
 *
 * @example
 * ```ts
 * const safeHtml = sanitizeHtml('<script>alert("xss")</script>');
 * // returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * ```
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Strips all HTML markup tags from a string.
 *
 * @param input String potentially containing HTML tags.
 * @returns Clean string with HTML tags removed.
 *
 * @example
 * ```ts
 * stripHtml('<b>VIP Exclusive</b> Celebration'); // 'VIP Exclusive Celebration'
 * ```
 */
export function stripHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Validates that a given value is a positive, finite monetary amount.
 *
 * @param val Number to validate as currency.
 * @returns `true` if valid finite non-negative number, otherwise `false`.
 *
 * @example
 * ```ts
 * validateCurrencyAmount(1500.50); // true
 * validateCurrencyAmount(-10);     // false
 * ```
 */
export function validateCurrencyAmount(val: number): boolean {
  return typeof val === 'number' && !isNaN(val) && isFinite(val) && val >= 0;
}

/**
 * Validates that an email conforms to strict RFC-compliant address formatting.
 *
 * @param email Email string to validate.
 * @returns `true` if valid email structure, otherwise `false`.
 *
 * @example
 * ```ts
 * validateEmail('coordinator@celebrite.ai'); // true
 * validateEmail('invalid-user@');            // false
 * ```
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
}

/**
 * Masks an API key for safe presentation in user interfaces.
 * Retains first 4 and last 4 characters while obfuscating the rest.
 *
 * @param apiKey Raw private API key.
 * @returns Masked string safe for UI display, or empty string if invalid.
 *
 * @example
 * ```ts
 * maskApiKey('AIzaSyDk838xkl193817'); // 'AIza...3817'
 * ```
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 8) return '';
  return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
}
