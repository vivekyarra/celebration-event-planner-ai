import { describe, it, expect } from 'vitest';
import { sanitizeHtml, validateCurrencyAmount, validateEmail, maskApiKey } from '../utils/security';

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
});
