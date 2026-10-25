import { describe, it, expect } from 'vitest';
import {
  calculateBudgetBreakdown,
  generateRunOfShow,
  generateInitialGuests,
  generateMenu,
  generateInvitations,
  createDefaultEventPlan,
} from '../services/plannerGenerator';
import { validateEventPlan } from '../utils/schemaValidator';
import { ClientRateLimiter } from '../services/security';
import { parseTimeToMinutes } from '../hooks/useTimelineManager';
import { EventType } from '../types';

describe('Task 3: Extreme Fuzzing & Invariant Stress Tests', () => {
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

  // Test 1: Fuzzing calculateBudgetBreakdown
  it('1. fuzz calculateBudgetBreakdown with float inaccuracies, tiny fractions (0.00001), and Number.MAX_SAFE_INTEGER', () => {
    const extremeBudgets = [
      0.00001,
      0.0000001,
      0.3333333333333333,
      1.0000000000001,
      12345.67891011,
      Number.MAX_SAFE_INTEGER / 1000,
      1e9,
    ];

    allEventTypes.forEach((type) => {
      extremeBudgets.forEach((budget) => {
        const breakdown = calculateBudgetBreakdown(type, budget);
        expect(Array.isArray(breakdown)).toBe(true);
        expect(breakdown.length).toBeGreaterThan(0);

        breakdown.forEach((cat) => {
          expect(Number.isNaN(cat.allocatedAmount)).toBe(false);
          expect(Number.isFinite(cat.allocatedAmount)).toBe(true);
          expect(Number.isNaN(cat.spentAmount)).toBe(false);
          expect(Number.isFinite(cat.spentAmount)).toBe(true);
          expect(Number.isNaN(cat.percentage)).toBe(false);
          expect(Number.isFinite(cat.percentage)).toBe(true);
          expect(cat.name).toBeTruthy();
          expect(cat.recommendations.length).toBeGreaterThan(0);
        });
      });
    });
  });

  // Test 2: Fuzzing generateRunOfShow
  it('2. fuzz generateRunOfShow with custom duration inputs, ensuring chronological sequence is never corrupted', () => {
    const fuzzedStartTimes = [
      '14:00',
      '15:30',
      '16:00',
      '17:00',
      '18:30',
      'garbage_time',
      '99:99',
      '-04:00',
      '',
    ];

    allEventTypes.forEach((eventType) => {
      fuzzedStartTimes.forEach((timeStr) => {
        const runOfShow = generateRunOfShow(eventType, timeStr);
        expect(Array.isArray(runOfShow)).toBe(true);
        expect(runOfShow.length).toBeGreaterThanOrEqual(6);

        // Every milestone must have structural validity
        runOfShow.forEach((item) => {
          expect(item.id).toBeTruthy();
          expect(item.time).toBeTruthy();
          expect(item.phase).toBeTruthy();
          expect(item.title).toBeTruthy();
          expect(item.leadCoordinator).toBeTruthy();
          expect(typeof item.isCompleted).toBe('boolean');

          // Time string must be parseable
          const minutes = parseTimeToMinutes(item.time);
          expect(minutes).toBeGreaterThanOrEqual(0);
          expect(minutes).toBeLessThan(1440);
        });

        // When standard afternoon start time is provided (e.g. 14:00 or 15:30), sequence must be strictly ascending
        if (timeStr === '14:00' || timeStr === '15:30') {
          for (let i = 1; i < runOfShow.length; i++) {
            const prevMin = parseTimeToMinutes(runOfShow[i - 1].time);
            const currMin = parseTimeToMinutes(runOfShow[i].time);
            expect(currMin).toBeGreaterThan(prevMin);
          }
        }
      });
    });
  });

  // Test 3: Invariant check - Total percentage in wedding budget breakdown
  it('3. invariant check: total percentage in wedding budget breakdown always equals 100%', () => {
    const testBudgets = [
      500,
      1000,
      25000,
      73491,
      100000,
      5000000,
      9999999,
      0.5,
    ];

    testBudgets.forEach((budget) => {
      const weddingBreakdown = calculateBudgetBreakdown('wedding', budget);
      const sumPercentage = weddingBreakdown.reduce((sum, c) => sum + c.percentage, 0);
      expect(sumPercentage).toBe(100);
    });
  });

  // Test 4: Invariant check - generateInitialGuests
  it('4. invariant check: in generateInitialGuests, every guest has a valid non-empty name, email matching regex, and tableNumber >= 1 or null', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const guestCounts = [1, 2, 5, 8, 20, 100, 250];

    guestCounts.forEach((count) => {
      const guests = generateInitialGuests(count);
      expect(guests.length).toBeGreaterThan(0);
      expect(guests.length).toBeLessThanOrEqual(count);

      guests.forEach((guest) => {
        expect(guest.id).toBeTruthy();
        expect(typeof guest.name).toBe('string');
        expect(guest.name.trim().length).toBeGreaterThan(0);

        expect(typeof guest.email).toBe('string');
        expect(guest.email).toMatch(emailRegex);

        if (guest.tableNumber !== null) {
          expect(typeof guest.tableNumber).toBe('number');
          expect(guest.tableNumber).toBeGreaterThanOrEqual(1);
        }

        expect(['confirmed', 'pending', 'declined']).toContain(guest.rsvpStatus);
        expect(guest.plusOnes).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // Test 5: Invariant check - generateMenu
  it('5. invariant check: in generateMenu, every course has at least one item, and all dietaryTags are non-empty strings', () => {
    const dietaryVariations = [
      [],
      ['Vegetarian'],
      ['Vegan'],
      ['Gluten-Free', 'Nut-Free'],
      ['Halal', 'Kosher', 'Dairy-Free', 'Pescatarian'],
    ];

    const expectedCourses = ['starters', 'mains', 'desserts', 'beverages'] as const;

    allEventTypes.forEach((type) => {
      dietaryVariations.forEach((dietary) => {
        const menu = generateMenu(type, dietary);
        expect(menu.length).toBeGreaterThanOrEqual(4);

        // Every course must be represented
        expectedCourses.forEach((course) => {
          const courseItems = menu.filter((m) => m.course === course);
          expect(courseItems.length).toBeGreaterThanOrEqual(1);
        });

        // All dietary tags must be non-empty strings
        menu.forEach((item) => {
          expect(item.name.trim().length).toBeGreaterThan(0);
          expect(item.description.trim().length).toBeGreaterThan(0);
          expect(Array.isArray(item.dietaryTags)).toBe(true);
          item.dietaryTags.forEach((tag) => {
            expect(typeof tag).toBe('string');
            expect(tag.trim().length).toBeGreaterThan(0);
          });
        });
      });
    });
  });

  // Test 6: Invariant check - generateInvitations
  it('6. invariant check: in generateInvitations, all 4 styles are generated, non-empty, and contain the event title', () => {
    const titles = [
      'Maya & Arjun Wedding',
      'Quantum AI Launch 2026',
      'Grand Gala 50th Milestone',
      'Acme Summer Hackathon',
    ];
    const expectedStyles = ['elegant', 'playful', 'formal', 'poetic'];

    titles.forEach((title) => {
      const drafts = generateInvitations(title, 'wedding', '2026-11-20', 'indoor');
      expect(drafts).toHaveLength(4);

      const generatedStyles = drafts.map((d) => d.style);
      expect(generatedStyles).toEqual(expect.arrayContaining(expectedStyles));

      drafts.forEach((draft) => {
        expect(draft.headline.trim().length).toBeGreaterThan(0);
        expect(draft.body.trim().length).toBeGreaterThan(0);
        expect(draft.callToAction.trim().length).toBeGreaterThan(0);
        // Headline must include the event title
        expect(draft.headline).toContain(title);
      });
    });
  });

  // Test 7: Fuzzing validateEventPlan with circular object graphs
  it('7. fuzz validateEventPlan with circular object graphs without infinite recursion or stack overflow', () => {
    const circularObj: Record<string, unknown> = {
      id: 'event-circular',
      title: 'Circular Reference Test',
      totalBudget: 25000,
      guestCount: 100,
    };
    circularObj.selfReference = circularObj;
    circularObj.nested = { backToParent: circularObj };

    expect(() => {
      const result = validateEventPlan(circularObj);
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
    }).not.toThrow();

    // With a default event plan modified to have circularity
    const plan = createDefaultEventPlan();
    (plan as unknown as Record<string, unknown>).circularLoop = plan;

    expect(() => {
      const result = validateEventPlan(plan);
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
    }).not.toThrow();
  });

  // Test 8: Fuzzing validateEventPlan with null prototypes
  it('8. fuzz validateEventPlan with null prototypes and Object.create(null)', () => {
    const nullProto = Object.create(null);
    nullProto.id = 'event-null-proto';
    nullProto.title = 'Null Prototype Event';
    nullProto.eventType = 'corporate';
    nullProto.totalBudget = 15000;
    nullProto.guestCount = 80;
    nullProto.eventDate = '2026-12-01';

    expect(() => {
      const result = validateEventPlan(nullProto);
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
      expect(result.isValid).toBe(true);
    }).not.toThrow();
  });

  // Test 9: Fuzzing validateEventPlan with deeply nested objects
  it('9. fuzz validateEventPlan with deeply nested objects (60+ levels)', () => {
    const deepObj: Record<string, unknown> = {
      id: 'event-deep',
      title: 'Deeply Nested Payload',
      totalBudget: 50000,
      guestCount: 150,
      eventDate: '2026-12-15',
    };

    let pointer = deepObj;
    for (let depth = 0; depth < 60; depth++) {
      const child: Record<string, unknown> = { level: depth };
      pointer.child = child;
      pointer = child;
    }

    expect(() => {
      const result = validateEventPlan(deepObj);
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
    }).not.toThrow();
  });

  // Test 10: Fuzzing validateEventPlan with arrays containing 10,000 items
  it('10. fuzz validateEventPlan with arrays containing 10,000 items', () => {
    const basePlan = createDefaultEventPlan();
    const largeTimeline = Array.from({ length: 10000 }, (_, i) => ({
      id: `timeline-item-${i}`,
      time: '18:00',
      phase: 'ceremony' as const,
      title: `Milestone ${i}`,
      description: 'Auto-generated stress milestone',
      leadCoordinator: 'Stress Tester',
      isCompleted: false,
    }));

    const hugePlan = {
      ...basePlan,
      timeline: largeTimeline,
    };

    const result = validateEventPlan(hugePlan);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedPlan?.timeline).toHaveLength(10000);
  });

  // Test 11: Stress testing ClientRateLimiter with concurrent token consumption
  it('11. stress testing ClientRateLimiter with rapid concurrent token consumption across multiple asynchronous threads', async () => {
    const MAX_CAPACITY = 50;
    const limiter = new ClientRateLimiter({
      maxTokens: MAX_CAPACITY,
      refillRate: MAX_CAPACITY,
      refillIntervalMs: 60000, // 1 minute
    });

    // Launch 100 concurrent asynchronous consumer promises
    const concurrentConsumers = Array.from({ length: 100 }, () =>
      Promise.resolve().then(() => limiter.tryConsume(1))
    );

    const outcomes = await Promise.all(concurrentConsumers);
    const approvedCount = outcomes.filter((res) => res === true).length;
    const throttledCount = outcomes.filter((res) => res === false).length;

    // Exactly 50 should be approved, and exactly 50 should be throttled
    expect(approvedCount).toBe(MAX_CAPACITY);
    expect(throttledCount).toBe(50);
    expect(limiter.getRemainingTokens()).toBe(0);
    expect(limiter.tryConsume(1)).toBe(false);
  });

  // Test 12: Stress testing ClientRateLimiter refill precision and boundary clamping
  it('12. stress testing ClientRateLimiter token replenishment precision and boundary clamping', () => {
    const limiter = new ClientRateLimiter({
      maxTokens: 20,
      refillRate: 20,
      refillIntervalMs: 60000,
    });

    // Initial state
    expect(limiter.getRemainingTokens()).toBe(20);

    // Consume all 20 tokens
    expect(limiter.tryConsume(20)).toBe(true);
    expect(limiter.getRemainingTokens()).toBe(0);

    // Cannot consume positive tokens when bucket is exhausted
    expect(limiter.tryConsume(1)).toBe(false);
    expect(limiter.tryConsume(5)).toBe(false);

    // Cannot consume more than maximum capacity even when full
    const smallLimiter = new ClientRateLimiter({ maxTokens: 5, refillRate: 5, refillIntervalMs: 60000 });
    expect(smallLimiter.tryConsume(10)).toBe(false);
    expect(smallLimiter.getRemainingTokens()).toBe(5);
  });
});
