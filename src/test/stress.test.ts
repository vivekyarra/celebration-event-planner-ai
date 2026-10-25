import { describe, it, expect } from 'vitest';
import {
  calculateBudgetBreakdown,
  generateRunOfShow,
  generateCuratedTheme,
  generateMenu,
  generateInvitations,
  queryEventCopilot,
  createDefaultEventPlan,
  generateVendors,
  generateInitialGuests,
} from '../services/plannerGenerator';
import { EventType, TimelinePhase } from '../types';
import {
  sanitizeHtml,
  validateCurrencyAmount,
  validateEmail,
  maskApiKey,
} from '../utils/security';

describe('CelebriteAI Planner Generator Stress & Integrity Test Suite', () => {
  const allEventTypes: EventType[] = [
    'wedding',
    'birthday',
    'corporate',
    'anniversary',
    'hackathon',
    'baby_shower',
    'festive_gala',
    'milestone',
  ];

  // Test 1: calculateBudgetBreakdown for ALL event types returns non-zero values
  it('calculateBudgetBreakdown for ALL event types returns non-zero values', () => {
    allEventTypes.forEach((type) => {
      const breakdown = calculateBudgetBreakdown(type, 50000);
      expect(breakdown.length).toBeGreaterThan(0);
      breakdown.forEach((cat) => {
        expect(cat.allocatedAmount).toBeGreaterThan(0);
        expect(cat.percentage).toBeGreaterThan(0);
        expect(cat.name).toBeTruthy();
        expect(cat.recommendations.length).toBeGreaterThan(0);
      });
    });
  });

  // Test 2: budget percentages always sum to 100 for wedding
  it('budget percentages always sum to 100 for wedding', () => {
    const weddingBudget = calculateBudgetBreakdown('wedding', 30000);
    const sum = weddingBudget.reduce((acc, cat) => acc + cat.percentage, 0);
    expect(sum).toBe(100);
  });

  // Test 3: generateRunOfShow always returns items with valid phases
  it('generateRunOfShow always returns items with valid phases', () => {
    const validPhases: TimelinePhase[] = [
      'setup',
      'arrival',
      'ceremony',
      'dining',
      'entertainment',
      'winddown',
    ];
    allEventTypes.forEach((type) => {
      const timeline = generateRunOfShow(type, '16:00');
      expect(timeline.length).toBeGreaterThan(0);
      timeline.forEach((item) => {
        expect(validPhases).toContain(item.phase);
        expect(item.time).toBeTruthy();
        expect(item.title).toBeTruthy();
        expect(item.leadCoordinator).toBeTruthy();
      });
    });
  });

  // Test 4: generateCuratedTheme always returns hex colors matching /^#[0-9a-fA-F]{6}$/
  it('generateCuratedTheme always returns hex colors matching /^#[0-9a-fA-F]{6}$/', () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    allEventTypes.forEach((type) => {
      const theme = generateCuratedTheme(type);
      expect(theme.primary).toMatch(hexRegex);
      expect(theme.secondary).toMatch(hexRegex);
      expect(theme.accent).toMatch(hexRegex);
      expect(theme.curatedMusicPlaylists.length).toBeGreaterThan(0);
    });

    const customTheme = generateCuratedTheme('wedding', 'cyberpunk neon');
    expect(customTheme.primary).toMatch(hexRegex);
    expect(customTheme.secondary).toMatch(hexRegex);
    expect(customTheme.accent).toMatch(hexRegex);
  });

  // Test 5: generateMenu never returns empty arrays
  it('generateMenu never returns empty arrays', () => {
    allEventTypes.forEach((type) => {
      const menuStandard = generateMenu(type, ['Standard']);
      const menuVegan = generateMenu(type, ['Vegan', 'Gluten-Free', 'Nut-Free']);
      expect(menuStandard.length).toBeGreaterThan(0);
      expect(menuVegan.length).toBeGreaterThan(0);

      // Verify each menu item has required properties
      menuStandard.forEach((item) => {
        expect(item.name).toBeTruthy();
        expect(item.course).toBeTruthy();
        expect(item.dietaryTags.length).toBeGreaterThan(0);
      });
    });
  });

  // Test 6: generateInvitations headline always contains the event title
  it('generateInvitations headline always contains the event title', () => {
    const title = "Sophia & Alex's Celestial Jubilee";
    const invitations = generateInvitations(title, 'wedding', '2026-12-25', 'indoor');
    expect(invitations.length).toBeGreaterThan(0);
    invitations.forEach((inv) => {
      expect(inv.headline).toContain(title);
      expect(inv.body).toBeTruthy();
      expect(inv.callToAction).toBeTruthy();
    });
  });

  // Test 7: queryEventCopilot returns non-empty string for ALL 9 query domains
  it('queryEventCopilot returns non-empty string for ALL 9 query domains', async () => {
    const defaultPlan = createDefaultEventPlan();
    const domains = [
      'budget',
      'timeline',
      'theme',
      'entertainment',
      'venue',
      'speech',
      'invitation',
      'vendor',
      'rain',
    ];

    for (const domain of domains) {
      const response = await queryEventCopilot(`Tell me about ${domain}`, defaultPlan);
      expect(response).toBeTruthy();
      expect(typeof response).toBe('string');
      expect(response.trim().length).toBeGreaterThan(20);
    }
  });

  // Test 8: createDefaultEventPlan has consistent internal data
  it('createDefaultEventPlan has consistent internal data', () => {
    const plan = createDefaultEventPlan();
    expect(plan.id).toBeTruthy();
    expect(plan.title).toBeTruthy();
    expect(plan.guestCount).toBe(120);
    expect(plan.guests.length).toBeGreaterThan(0);
    expect(plan.totalBudget).toBe(25000);
    expect(plan.budgetBreakdown.length).toBeGreaterThan(0);
    expect(plan.timeline.length).toBeGreaterThan(0);
    expect(plan.vendors.length).toBeGreaterThan(0);
    expect(plan.themePalette).toBeDefined();
    expect(plan.invitations.length).toBeGreaterThan(0);
    expect(plan.menu.length).toBeGreaterThan(0);
  });

  // Test 9: sanitizeHtml strips all HTML tags
  it('sanitizeHtml strips all HTML tags: input "<b>bold</b>" should not contain "<b>"', () => {
    const input = '<b>bold</b>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('<b>');
    expect(output).not.toContain('</b>');
    expect(output).toBe('&lt;b&gt;bold&lt;/b&gt;');

    const maliciousScript = '<script>alert("xss")</script>';
    const cleanedScript = sanitizeHtml(maliciousScript);
    expect(cleanedScript).not.toContain('<script>');
  });

  // Test 10: validateCurrencyAmount rejects Infinity
  it('validateCurrencyAmount rejects Infinity', () => {
    expect(validateCurrencyAmount(Infinity)).toBe(false);
    expect(validateCurrencyAmount(-Infinity)).toBe(false);
    expect(validateCurrencyAmount(NaN)).toBe(false);
    expect(validateCurrencyAmount(-100)).toBe(false);
    expect(validateCurrencyAmount(5000)).toBe(true);
    expect(validateCurrencyAmount(0)).toBe(true);
  });

  // Test 11: validateEmail rejects empty string
  it('validateEmail rejects empty string', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('planner@celebrite.ai')).toBe(true);
  });

  // Test 12: maskApiKey with key shorter than 8 returns empty string
  it('maskApiKey with key shorter than 8 returns empty string', () => {
    expect(maskApiKey('')).toBe('');
    expect(maskApiKey('abc')).toBe('');
    expect(maskApiKey('1234567')).toBe('');
    expect(maskApiKey('AIzaSyD-1234567890abcdef')).toBe('AIza...cdef');
  });

  // Test 13: generateVendors always returns at least 3 vendors
  it('generateVendors always returns at least 3 vendors', () => {
    allEventTypes.forEach((type) => {
      const vendors = generateVendors(type, 20000);
      expect(vendors.length).toBeGreaterThanOrEqual(3);
    });
  });

  // Test 14: generateInitialGuests returns guests with tableNumber as number or null
  it('generateInitialGuests returns guests with tableNumber as number or null', () => {
    const guests = generateInitialGuests(50);
    expect(guests.length).toBeGreaterThan(0);
    guests.forEach((guest) => {
      const isValidTable = typeof guest.tableNumber === 'number' || guest.tableNumber === null;
      expect(isValidTable).toBe(true);
      expect(['confirmed', 'pending', 'declined']).toContain(guest.rsvpStatus);
    });
  });

  // Test 15: all generated vendors have estimatedCost > 0
  it('all generated vendors have estimatedCost > 0', () => {
    allEventTypes.forEach((type) => {
      const vendors = generateVendors(type, 35000);
      vendors.forEach((vendor) => {
        expect(vendor.estimatedCost).toBeGreaterThan(0);
        expect(vendor.companyName).toBeTruthy();
        expect(vendor.category).toBeTruthy();
        expect(vendor.contactPerson).toBeTruthy();
      });
    });
  });

  // Extra Test 16: calculateBudgetBreakdown handles large and small budgets gracefully
  it('calculateBudgetBreakdown handles extreme budgets gracefully', () => {
    const micro = calculateBudgetBreakdown('birthday', 100);
    expect(micro.length).toBeGreaterThan(0);
    const mega = calculateBudgetBreakdown('corporate', 10000000);
    expect(mega.length).toBeGreaterThan(0);
    mega.forEach((cat) => {
      expect(cat.allocatedAmount).toBeGreaterThan(0);
    });
  });

  // Extra Test 17: generateInitialGuests bounds guest count properly
  it('generateInitialGuests bounds guest count properly', () => {
    const emptyGuests = generateInitialGuests(0);
    expect(emptyGuests.length).toBe(0);
    const largeGuests = generateInitialGuests(5000);
    expect(largeGuests.length).toBeLessThanOrEqual(8);
  });
});
