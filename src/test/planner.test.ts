import { describe, it, expect } from 'vitest';
import {
  calculateBudgetBreakdown,
  generateRunOfShow,
  generateCuratedTheme,
  generateMenu,
  generateInvitations,
  queryEventCopilot,
  createDefaultEventPlan,
} from '../services/plannerGenerator';

describe('Planner Generator Service', () => {
  it('calculates budget breakdown accurately with 100% total allocation for wedding', () => {
    const budget = 20000;
    const breakdown = calculateBudgetBreakdown('wedding', budget);

    expect(breakdown.length).toBeGreaterThan(4);
    const totalAllocated = breakdown.reduce((sum, item) => sum + item.allocatedAmount, 0);
    expect(totalAllocated).toBeCloseTo(budget, -2);

    const venue = breakdown.find((b) => b.name.includes('Venue'));
    expect(venue).toBeDefined();
    expect(venue?.percentage).toBe(35);
  });

  it('calculates hackathon/corporate budget with heavy tech & energy station allocations', () => {
    const budget = 15000;
    const breakdown = calculateBudgetBreakdown('hackathon', budget);
    const techCategory = breakdown.find((b) => b.name.includes('Audio-Visual & Tech'));
    expect(techCategory).toBeDefined();
    expect(techCategory?.percentage).toBe(20);
  });

  it('generates chronological run of show milestones', () => {
    const timeline = generateRunOfShow('wedding', '16:00');
    expect(timeline.length).toBeGreaterThanOrEqual(6);
    expect(timeline[0].phase).toBe('setup');
    expect(timeline.some((t) => t.phase === 'ceremony')).toBe(true);
    expect(timeline.some((t) => t.phase === 'dining')).toBe(true);
  });

  it('generates curated theme palette with valid hex colors and style guidelines', () => {
    const theme = generateCuratedTheme('wedding');
    expect(theme.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(theme.curatedMusicPlaylists.length).toBeGreaterThan(0);
    expect(theme.lightingStyle).toBeTruthy();
  });

  it('generates multi-course culinary menu with dietary awareness', () => {
    const menu = generateMenu('birthday', ['Vegetarian', 'Vegan', 'Gluten-Free']);
    expect(menu.length).toBeGreaterThanOrEqual(4);
    const starter = menu.find((m) => m.course === 'starters');
    expect(starter).toBeDefined();
    expect(starter?.dietaryTags.length).toBeGreaterThan(0);
  });

  it('creates multi-tone invitations', () => {
    const invites = generateInvitations('Gala Night', 'corporate', '2026-11-20', 'indoor');
    expect(invites.length).toBe(4);
    const styles = invites.map((i) => i.style);
    expect(styles).toContain('elegant');
    expect(styles).toContain('playful');
    expect(styles).toContain('formal');
    expect(styles).toContain('poetic');
  });

  it('provides intelligent contextual responses from Event Copilot heuristic engine', async () => {
    const defaultPlan = createDefaultEventPlan();

    // Budget optimization query
    const budgetAnswer = await queryEventCopilot('How do I reduce costs?', defaultPlan);
    expect(budgetAnswer).toContain('Budget Optimization Strategy');

    // Run of show query
    const timelineAnswer = await queryEventCopilot('What is the timeline schedule advice?', defaultPlan);
    expect(timelineAnswer).toContain('Run-of-Show Advice');

    // Weather contingency query
    const weatherAnswer = await queryEventCopilot('What if it rains during the outdoor ceremony?', defaultPlan);
    expect(weatherAnswer).toContain('Contingency & Weather Defense Plan');
  });
});
