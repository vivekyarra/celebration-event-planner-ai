import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  validateCurrencyAmount,
  validateEmail,
  maskApiKey,
  validateNumericRange,
  ClientRateLimiter,
} from '../services/security';

describe('Security & Input Validation Engine', () => {
  it('sanitizes malicious XSS scripts from user inputs', () => {
    const malicious = '<script>alert("hack")</script>';
    const cleaned = sanitizeHtml(malicious);
    expect(cleaned).not.toContain('<script>');
    expect(cleaned).toContain('&lt;script&gt;');
  });

  it('escapes quotes and double quotes to prevent attribute injection', () => {
    const evilAttr = '"><img src=x onerror=alert(1)>';
    const cleaned = sanitizeHtml(evilAttr);
    expect(cleaned).not.toContain('">');
    expect(cleaned).toContain('&quot;&gt;');
  });

  it('validates currency amounts correctly', () => {
    expect(validateCurrencyAmount(1500)).toBe(true);
    expect(validateCurrencyAmount(0)).toBe(true);
    expect(validateCurrencyAmount(-50)).toBe(false);
    expect(validateCurrencyAmount(NaN)).toBe(false);
  });

  it('validates email formats with strict regex', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('user@domain')).toBe(false);
  });

  it('masks API keys responsibly for UI display', () => {
    const key = 'AIzaSyFakeKey123456789Secret';
    const masked = maskApiKey(key);
    expect(masked).toBe('AIza...cret');
    expect(masked).not.toContain('123456789Secret');
  });

  describe('validateNumericRange', () => {
    it('accepts numbers within boundary inclusive', () => {
      const res = validateNumericRange(500, 100, 1000, 'Budget');
      expect(res.valid).toBe(true);
      expect(res.error).toBeUndefined();

      expect(validateNumericRange(100, 100, 1000, 'MinBoundary').valid).toBe(true);
      expect(validateNumericRange(1000, 100, 1000, 'MaxBoundary').valid).toBe(true);
    });

    it('rejects numbers strictly outside boundaries', () => {
      const below = validateNumericRange(50, 100, 1000, 'Budget');
      expect(below.valid).toBe(false);
      expect(below.error).toContain('must be at least 100');

      const above = validateNumericRange(1500, 100, 1000, 'Budget');
      expect(above.valid).toBe(false);
      expect(above.error).toContain('cannot exceed 1,000');
    });

    it('rejects NaN, Infinity, and non-number types', () => {
      expect(validateNumericRange(NaN, 0, 100).valid).toBe(false);
      expect(validateNumericRange(Infinity, 0, 100).valid).toBe(false);
      expect(validateNumericRange(('100' as unknown) as number, 0, 100).valid).toBe(false);
    });
  });

  describe('ClientRateLimiter Token Bucket', () => {
    it('allows tokens within maximum capacity', () => {
      const limiter = new ClientRateLimiter({ maxTokens: 3, refillRate: 3, refillIntervalMs: 60000 });
      expect(limiter.getRemainingTokens()).toBe(3);
      expect(limiter.tryConsume(1)).toBe(true);
      expect(limiter.getRemainingTokens()).toBe(2);
      expect(limiter.tryConsume(2)).toBe(true);
      expect(limiter.getRemainingTokens()).toBe(0);
    });

    it('blocks calls when tokens are depleted', () => {
      const limiter = new ClientRateLimiter({ maxTokens: 2, refillRate: 2, refillIntervalMs: 60000 });
      expect(limiter.tryConsume(2)).toBe(true);
      expect(limiter.tryConsume(1)).toBe(false);
      expect(limiter.getRemainingTokens()).toBe(0);
    });

    it('calculates future reset time when depleted', () => {
      const limiter = new ClientRateLimiter({ maxTokens: 5, refillRate: 5, refillIntervalMs: 60000 });
      limiter.tryConsume(5);
      const resetTime = limiter.getResetTime();
      expect(resetTime).toBeGreaterThan(Date.now());
      expect(resetTime - Date.now()).toBeLessThanOrEqual(60000);
    });

    it('allows manual reset to maximum capacity', () => {
      const limiter = new ClientRateLimiter({ maxTokens: 4, refillRate: 4, refillIntervalMs: 60000 });
      limiter.tryConsume(4);
      expect(limiter.getRemainingTokens()).toBe(0);
      limiter.reset();
      expect(limiter.getRemainingTokens()).toBe(4);
      expect(limiter.tryConsume(1)).toBe(true);
    });
  });
});
