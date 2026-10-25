import { describe, it, expect } from 'vitest';
import {
  calculateBudgetBreakdown,
  generateCuratedTheme,
  generateMenu,
  queryEventCopilot,
  createDefaultEventPlan,
} from '../services/plannerGenerator';
import { formatCurrency } from '../utils/security';
import { EventType } from '../types';

describe('Task 2: Fuzzing & Boundary Stress Tests', () => {
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

  it('1. fuzz calculateBudgetBreakdown with 0, 1, 999999999, float numbers, and extreme values', () => {
    const testBudgets = [
      0,
      1,
      0.05,
      12.34567,
      999999999,
      10000000000,
      Number.MAX_SAFE_INTEGER / 1000,
    ];

    allEventTypes.forEach((type) => {
      testBudgets.forEach((budget) => {
        const breakdown = calculateBudgetBreakdown(type, budget);
        expect(Array.isArray(breakdown)).toBe(true);
        expect(breakdown.length).toBeGreaterThan(0);

        let totalAllocated = 0;
        let totalPct = 0;

        breakdown.forEach((cat) => {
          expect(Number.isFinite(cat.allocatedAmount)).toBe(true);
          expect(Number.isNaN(cat.allocatedAmount)).toBe(false);
          expect(Number.isFinite(cat.spentAmount)).toBe(true);
          expect(Number.isFinite(cat.percentage)).toBe(true);
          expect(cat.name).toBeTruthy();
          expect(cat.recommendations.length).toBeGreaterThan(0);

          totalAllocated += cat.allocatedAmount;
          totalPct += cat.percentage;
        });

        expect(Number.isFinite(totalAllocated)).toBe(true);
        expect(totalPct).toBeGreaterThanOrEqual(98); // rounding might yield 99 or 100
        expect(totalPct).toBeLessThanOrEqual(102);
      });
    });
  });

  it('2. fuzz generateCuratedTheme across multiple event types and custom prompt keywords', () => {
    const promptKeywords = [
      'cyberpunk',
      'CyberPunk Matrix Neon',
      'vintage 1920s gatsby',
      'minimalist scandinavian',
      'rustic autumn boho',
      'royal luxury velvet gold',
      '<script>alert("theme")</script>',
      '🎨 🎆 🥂 ✨ 🌟',
      'A'.repeat(500), // extreme length prompt
      '',
    ];

    allEventTypes.forEach((eventType) => {
      promptKeywords.forEach((keyword) => {
        const theme = generateCuratedTheme(eventType, keyword);

        expect(theme).toBeDefined();
        expect(theme.name).toBeTruthy();
        expect(theme.primary).toMatch(/^#[0-9a-fA-F]{3,8}$/);
        expect(theme.secondary).toMatch(/^#[0-9a-fA-F]{3,8}$/);
        expect(theme.accent).toMatch(/^#[0-9a-fA-F]{3,8}$/);
        expect(theme.background).toBeTruthy();
        expect(theme.vibeDescription).toBeTruthy();
        expect(theme.lightingStyle).toBeTruthy();
        expect(theme.recommendedDressCode).toBeTruthy();
        expect(theme.curatedMusicPlaylists.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  it('3. fuzz generateMenu ensuring dietary tag integrity across varied dietary restrictions', () => {
    const dietaryCombinations = [
      [],
      ['Vegan'],
      ['Vegetarian', 'Gluten-Free'],
      ['Vegan', 'Halal', 'Kosher', 'Nut-Free', 'Dairy-Free'],
      ['Keto', 'Paleo', 'Sugar-Free', 'High-Protein', 'Pescatarian'],
      ['UNKNOWN_DIET', '"><img src=x onerror=1>'],
    ];

    allEventTypes.forEach((eventType) => {
      dietaryCombinations.forEach((diets) => {
        const menu = generateMenu(eventType, diets);
        expect(menu.length).toBeGreaterThanOrEqual(4);

        const courses = new Set(menu.map((m) => m.course));
        expect(courses.has('starters')).toBe(true);
        expect(courses.has('mains')).toBe(true);
        expect(courses.has('desserts')).toBe(true);
        expect(courses.has('beverages')).toBe(true);

        menu.forEach((item) => {
          expect(item.id).toBeTruthy();
          expect(item.name).toBeTruthy();
          expect(item.description).toBeTruthy();
          expect(Array.isArray(item.dietaryTags)).toBe(true);
          expect(item.dietaryTags.length).toBeGreaterThan(0);
          expect(item.recommendedQuantity).toBeTruthy();
        });

        // If Vegan was explicitly requested, verify Vegan items are tagged
        if (diets.includes('Vegan')) {
          const hasVeganTag = menu.some((item) =>
            item.dietaryTags.some((tag) => tag.toLowerCase().includes('vegan'))
          );
          expect(hasVeganTag).toBe(true);
        }
      });
    });
  });

  it('4. fuzz queryEventCopilot with special characters, unicode, emojis, and rapid successive queries', async () => {
    const defaultPlan = createDefaultEventPlan();

    const fuzzQueries = [
      '<script>alert("xss")</script>',
      'DROP TABLE celebrations; --',
      '🎉 How do we handle wedding entertainment? 🎶 💃',
      '💰 Can we cut 20% off catering budget?',
      '🌸 What is the recommended theme and dress code?',
      '🌧️ What if it rains during the cocktail hour?',
      'こんにちは！イベントのタイムラインを教えてください',
      'Dossier de planification de gala pour 500 invités',
      '   \n\t  ', // Whitespace only
      'a'.repeat(300), // Extra long query
    ];

    // Rapid successive queries handled concurrently
    const responses = await Promise.all(
      fuzzQueries.map((q) => queryEventCopilot(q, defaultPlan))
    );

    expect(responses.length).toBe(fuzzQueries.length);
    responses.forEach((resp) => {
      expect(typeof resp).toBe('string');
      expect(resp.length).toBeGreaterThan(10);
      expect(resp).not.toContain('undefined');
    });
  });

  it('5. fuzz formatCurrency with negative, zero, and extreme values', () => {
    // Zero
    expect(formatCurrency(0)).toBe('USD 0');
    expect(formatCurrency(0, 'EUR')).toBe('EUR 0');

    // Negative numbers
    expect(formatCurrency(-150)).toBe('-USD 150');
    expect(formatCurrency(-500000, '$')).toBe('-$ 500,000');

    // Extreme positive values
    expect(formatCurrency(999999999)).toBe('USD 999,999,999');
    expect(formatCurrency(1234567890123)).toBe('USD 1,234,567,890,123');

    // Floats & decimals
    expect(formatCurrency(1234.56)).toBe('USD 1,234.56');
    expect(formatCurrency(0.99)).toBe('USD 0.99');

    // Defensive NaN and Infinity protection
    expect(formatCurrency(NaN)).toBe('USD 0');
    expect(formatCurrency(Infinity)).toBe('USD 0');
    expect(formatCurrency(-Infinity)).toBe('USD 0');
    expect(formatCurrency('invalid' as unknown as number)).toBe('USD 0');
  });
});
