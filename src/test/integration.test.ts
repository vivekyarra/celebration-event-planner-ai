import { describe, it, expect } from 'vitest';
import {
  createDefaultEventPlan,
  calculateBudgetBreakdown,
  generateRunOfShow,
  generateMenu,
  generateInvitations,
  generateInitialGuests,
  queryEventCopilot,
} from '../services/plannerGenerator';
import { EventType, RSVPStatus } from '../types';

describe('Comprehensive CelebriteAI Integration Tests', () => {
  it('1. createDefaultEventPlan() creates a plan with all required fields', () => {
    const plan = createDefaultEventPlan();

    expect(plan.id).toBeDefined();
    expect(plan.title).toBeTruthy();
    expect(plan.eventType).toBe('wedding');
    expect(plan.eventDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(plan.startTime).toBeTruthy();
    expect(plan.endTime).toBeTruthy();
    expect(plan.guestCount).toBeGreaterThan(0);
    expect(plan.totalBudget).toBeGreaterThan(0);
    expect(plan.currency).toBe('USD');
    expect(['indoor', 'outdoor', 'hybrid', 'virtual']).toContain(plan.venueType);
    expect(plan.theme).toBeTruthy();
    expect(Array.isArray(plan.dietaryPreferences)).toBe(true);
    expect(plan.dietaryPreferences.length).toBeGreaterThan(0);
    expect(Array.isArray(plan.budgetBreakdown)).toBe(true);
    expect(Array.isArray(plan.timeline)).toBe(true);
    expect(Array.isArray(plan.vendors)).toBe(true);
    expect(Array.isArray(plan.guests)).toBe(true);
    expect(plan.themePalette).toBeDefined();
    expect(Array.isArray(plan.invitations)).toBe(true);
    expect(Array.isArray(plan.menu)).toBe(true);
  });

  it('2. calculateBudgetBreakdown for all 5 event types returns valid categories', () => {
    const eventTypes: EventType[] = ['wedding', 'corporate', 'birthday', 'hackathon', 'anniversary'];
    const testBudget = 50000;

    for (const type of eventTypes) {
      const breakdown = calculateBudgetBreakdown(type, testBudget);
      expect(breakdown.length).toBeGreaterThanOrEqual(4);

      // Verify each category has essential structure
      for (const cat of breakdown) {
        expect(cat.id).toBeTruthy();
        expect(cat.name).toBeTruthy();
        expect(cat.percentage).toBeGreaterThan(0);
        expect(cat.allocatedAmount).toBeGreaterThan(0);
        expect(cat.recommendations.length).toBeGreaterThan(0);
      }

      const totalPercentage = breakdown.reduce((sum, cat) => sum + cat.percentage, 0);
      expect(totalPercentage).toBeGreaterThanOrEqual(98);
      expect(totalPercentage).toBeLessThanOrEqual(102);
    }
  });

  it('3. generateRunOfShow for wedding and hackathon has correct first phase (setup)', () => {
    const weddingTimeline = generateRunOfShow('wedding', '16:00');
    expect(weddingTimeline.length).toBeGreaterThan(0);
    expect(weddingTimeline[0].phase).toBe('setup');

    const hackathonTimeline = generateRunOfShow('hackathon', '09:00');
    expect(hackathonTimeline.length).toBeGreaterThan(0);
    expect(hackathonTimeline[0].phase).toBe('setup');
  });

  it('4. generateMenu returns items for all 4 courses (starters, mains, desserts, beverages)', () => {
    const menu = generateMenu('anniversary', ['Vegetarian', 'Gluten-Free']);
    const coursesFound = new Set(menu.map((m) => m.course));

    expect(coursesFound.has('starters')).toBe(true);
    expect(coursesFound.has('mains')).toBe(true);
    expect(coursesFound.has('desserts')).toBe(true);
    expect(coursesFound.has('beverages')).toBe(true);
  });

  it('5. generateInvitations returns all 4 styles (elegant, playful, formal, poetic)', () => {
    const invites = generateInvitations('Emerald Gala', 'corporate', '2026-12-15', 'indoor');
    const styles = invites.map((i) => i.style);

    expect(styles).toContain('elegant');
    expect(styles).toContain('playful');
    expect(styles).toContain('formal');
    expect(styles).toContain('poetic');
    expect(invites.length).toBe(4);
  });

  it('6. generateInitialGuests returns guests with valid RSVPStatus', () => {
    const validStatuses: RSVPStatus[] = ['confirmed', 'pending', 'declined'];
    const guests = generateInitialGuests(50);

    expect(guests.length).toBeGreaterThan(0);
    for (const guest of guests) {
      expect(guest.id).toBeTruthy();
      expect(guest.name).toBeTruthy();
      expect(guest.email).toContain('@');
      expect(validStatuses).toContain(guest.rsvpStatus);
      expect(typeof guest.plusOnes).toBe('number');
    }
  });

  it('7. queryEventCopilot returns theme-related content for theme queries', async () => {
    const plan = createDefaultEventPlan();
    const response = await queryEventCopilot('Can you give me theme and decor color ideas?', plan);

    expect(response).toContain('Theme & Styling');
    expect(response.toLowerCase()).toContain('palette');
  });

  it('8. queryEventCopilot returns entertainment advice for entertainment queries', async () => {
    const plan = createDefaultEventPlan();
    const response = await queryEventCopilot('What entertainment games and music should we book?', plan);

    expect(response).toContain('Entertainment & Engagement');
    expect(response).toContain('Icebreaker');
  });

  it('9. Budget breakdown total allocated amounts are correct and match budget', () => {
    const budget = 36000;
    const breakdown = calculateBudgetBreakdown('wedding', budget);
    const sum = breakdown.reduce((acc, cat) => acc + cat.allocatedAmount, 0);

    // Sum should equal budget within standard rounding margins
    expect(Math.abs(sum - budget)).toBeLessThanOrEqual(5);
  });

  it('10. Guest count in default plan matches guests array length hint', () => {
    const plan = createDefaultEventPlan();
    // generateInitialGuests creates up to 8 sample records
    expect(plan.guests.length).toBe(Math.min(plan.guestCount, 8));
  });

  it('11. queryEventCopilot handles venue selection advice', async () => {
    const plan = createDefaultEventPlan();
    const response = await queryEventCopilot('How do I select the best venue location?', plan);

    expect(response).toContain('Venue Selection & Layout');
    expect(response).toContain('Capacity & Flow');
  });

  it('12. queryEventCopilot handles speech and toast guidance', async () => {
    const plan = createDefaultEventPlan();
    const response = await queryEventCopilot('Help me write a speech and wedding toast', plan);

    expect(response).toContain('Master Speech & Toast');
    expect(response).toContain('Golden 3-Minute Rule');
  });

  it('13. queryEventCopilot handles invitation advice', async () => {
    const plan = createDefaultEventPlan();
    const response = await queryEventCopilot('What should we include on the invitation card?', plan);

    expect(response).toContain('Invitation & Stationery');
    expect(response).toContain('Dispatch Timeline');
  });

  it('14. queryEventCopilot handles vendor negotiation tips', async () => {
    const plan = createDefaultEventPlan();
    const response = await queryEventCopilot('Tips for hiring photographer and vendor suppliers?', plan);

    expect(response).toContain('Vendor Contracting & Negotiation');
    expect(response).toContain('Package Bundling');
  });
});
