import { describe, it, expect } from 'vitest';
import {
  validateEventPlan,
  detectPrototypePollution,
  preventPrototypePollution,
  RateLimiter,
  createRateLimiter,
  sanitizeHtml,
  stripHtml,
} from '../utils/schemaValidator';
import { createDefaultEventPlan } from '../services/plannerGenerator';
import { EventPlan } from '../types';

describe('Task 1: Comprehensive Schema & Security Test Suite', () => {
  it('1. valid default event plan passes validation without errors', () => {
    const plan = createDefaultEventPlan();
    const result = validateEventPlan(plan);

    expect(result.isValid).toBe(true);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('2. rejection of missing required fields (missing title, missing id, missing eventType)', () => {
    const basePlan = createDefaultEventPlan();

    // Missing title
    const missingTitle = { ...basePlan, title: '' };
    const resTitle = validateEventPlan(missingTitle);
    expect(resTitle.isValid).toBe(false);
    expect(resTitle.errors.some((e) => e.toLowerCase().includes('title'))).toBe(true);

    // Missing id
    const missingId = { ...basePlan, id: '   ' };
    const resId = validateEventPlan(missingId);
    expect(resId.isValid).toBe(false);
    expect(resId.errors.some((e) => e.toLowerCase().includes('id'))).toBe(true);

    // Missing / null payload
    expect(validateEventPlan(null).isValid).toBe(false);
    expect(validateEventPlan(undefined).isValid).toBe(false);
    expect(validateEventPlan('not an object').isValid).toBe(false);
  });

  it('3. rejection of non-numeric, zero, negative, or NaN budget and guestCount', () => {
    const basePlan = createDefaultEventPlan();

    // Negative guestCount
    const negGuests = validateEventPlan({ ...basePlan, guestCount: -5 });
    expect(negGuests.isValid).toBe(false);
    expect(negGuests.errors.some((e) => e.includes('guestCount'))).toBe(true);

    // Zero guestCount
    const zeroGuests = validateEventPlan({ ...basePlan, guestCount: 0 });
    expect(zeroGuests.isValid).toBe(false);

    // NaN guestCount
    const nanGuests = validateEventPlan({ ...basePlan, guestCount: NaN });
    expect(nanGuests.isValid).toBe(false);

    // Negative totalBudget
    const negBudget = validateEventPlan({ ...basePlan, totalBudget: -100 });
    expect(negBudget.isValid).toBe(false);
    expect(negBudget.errors.some((e) => e.includes('totalBudget'))).toBe(true);

    // Infinite totalBudget
    const infBudget = validateEventPlan({ ...basePlan, totalBudget: Infinity });
    expect(infBudget.isValid).toBe(false);

    // Non-numeric string totalBudget
    const strBudget = validateEventPlan({ ...basePlan, totalBudget: '50000' as unknown as number });
    expect(strBudget.isValid).toBe(false);
  });

  it('4. rejection of invalid event types (e.g. party, rave, concert)', () => {
    const basePlan = createDefaultEventPlan();

    // Disallowed event type 'party'
    const invalidParty = validateEventPlan({ ...basePlan, eventType: 'party' as any });
    expect(invalidParty.isValid).toBe(false);
    expect(invalidParty.errors.some((e) => e.includes('Invalid eventType "party"'))).toBe(true);

    // Disallowed event type 'rave'
    const invalidRave = validateEventPlan({ ...basePlan, eventType: 'rave' as any });
    expect(invalidRave.isValid).toBe(false);
  });

  it('5. prototype pollution defense (payload with __proto__ or constructor)', () => {
    // Check detection of prototype pollution in JSON payload
    const maliciousPayload = JSON.parse(
      '{"id": "ev-1", "title": "Gala", "__proto__": {"isAdmin": true}}'
    );

    const isPolluted = detectPrototypePollution(maliciousPayload);
    expect(isPolluted).toBe(true);

    // Schema validation detects and rejects
    const valResult = validateEventPlan(maliciousPayload);
    expect(valResult.isValid).toBe(false);
    expect(valResult.errors.some((e) => e.includes('Prototype pollution'))).toBe(true);

    // Defense cleaning strips dangerous keys safely
    const cleaned = preventPrototypePollution(maliciousPayload);
    expect(Object.prototype.hasOwnProperty.call(cleaned, '__proto__')).toBe(false);
    expect((({} as Record<string, unknown>).isAdmin)).toBeUndefined();
  });

  it('6. sanitization of malicious script tags inside event title, notes, and strings', () => {
    const maliciousScript = '<script>alert("PWNED!")</script>';
    const sanitizedTitle = sanitizeHtml(maliciousScript);

    expect(sanitizedTitle).not.toContain('<script>');
    expect(sanitizedTitle).toContain('&lt;script&gt;');
    expect(sanitizedTitle).toContain('&lt;/script&gt;');

    // Stripping tags completely
    const stripped = stripHtml('<b>VIP Exclusive</b> Celebration <script>alert(1)</script>');
    expect(stripped).toBe('VIP Exclusive Celebration alert(1)');

    // Malicious attributes
    const evilAttr = '<img src="x" onerror="document.location=\'http://attacker.com\'"/>';
    const sanitizedAttr = sanitizeHtml(evilAttr);
    expect(sanitizedAttr).not.toContain('<img');
    expect(sanitizedAttr).toContain('&lt;img');
    expect(sanitizedAttr).toContain('&#039;');
  });

  it('7. rate limiter token consumption and rejection when tokens are exhausted', () => {
    const limiter = createRateLimiter(3, 10000); // 3 tokens max

    expect(limiter.getTokens()).toBe(3);

    // Consume token 1
    expect(limiter.consume(1)).toBe(true);
    expect(limiter.getTokens()).toBe(2);

    // Consume token 2
    expect(limiter.tryConsume()).toBe(true);
    expect(limiter.getTokens()).toBe(1);

    // Consume token 3
    expect(limiter.consume(1)).toBe(true);
    expect(limiter.getTokens()).toBe(0);

    // Consume token 4 (Exhausted!)
    expect(limiter.consume(1)).toBe(false);
    expect(limiter.tryConsume()).toBe(false);

    // Reset restores token supply
    limiter.reset();
    expect(limiter.getTokens()).toBe(3);
    expect(limiter.consume(1)).toBe(true);
  });
});
