import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEventWizard } from '../hooks/useEventWizard';

describe('Task 2: Event Wizard Hook & Form Lifecycle Tests', () => {
  // 1. Initial state matches sensible defaults (wedding/corporate event template)
  it('1. initializes with sensible defaults matching wedding or corporate templates', () => {
    // Default wedding initialization
    const { result: weddingResult } = renderHook(() => useEventWizard());
    expect(weddingResult.current.eventType).toBe('wedding');
    expect(weddingResult.current.title).toContain('Wedding');
    expect(weddingResult.current.guestCount).toBe(150);
    expect(weddingResult.current.totalBudget).toBe(30000);
    expect(weddingResult.current.venueType).toBe('indoor');
    expect(weddingResult.current.themeVibe).toContain('Botanical');
    expect(weddingResult.current.fieldErrors).toEqual({});
    expect(weddingResult.current.validationErrors).toEqual([]);
    expect(weddingResult.current.isValid).toBe(true);

    // Explicit corporate template initialization
    const { result: corpResult } = renderHook(() =>
      useEventWizard({ defaultTemplate: 'corporate' })
    );
    expect(corpResult.current.eventType).toBe('corporate');
    expect(corpResult.current.title).toContain('Innovation Summit');
    expect(corpResult.current.guestCount).toBe(200);
    expect(corpResult.current.totalBudget).toBe(45000);
    expect(corpResult.current.venueType).toBe('hybrid');
  });

  // 2. Validating title: rejects empty, whitespace-only, or > 200 characters
  it('2. validates title boundary conditions: rejects empty, whitespace-only, and > 200 chars', () => {
    const { result } = renderHook(() => useEventWizard());

    // Empty string
    act(() => {
      result.current.setTitle('');
    });
    let val = result.current.validate();
    expect(val.isValid).toBe(false);
    expect(val.fieldErrors.title).toBe('Celebration / Event Name is required.');

    // Whitespace only
    act(() => {
      result.current.setTitle('    ');
    });
    val = result.current.validate();
    expect(val.isValid).toBe(false);
    expect(val.fieldErrors.title).toBe('Celebration / Event Name is required.');

    // > 200 characters
    act(() => {
      result.current.setTitle('A'.repeat(201));
    });
    val = result.current.validate();
    expect(val.isValid).toBe(false);
    expect(val.fieldErrors.title).toBe('Celebration / Event Name cannot exceed 200 characters.');

    // Valid title boundary (200 characters)
    act(() => {
      result.current.setTitle('A'.repeat(200));
    });
    val = result.current.validate();
    expect(val.fieldErrors.title).toBeUndefined();
  });

  // 3. Validating guestCount: rejects < 5 or > 5000
  it('3. validates guestCount boundaries: rejects < 5 or > 5,000 attendees', () => {
    const { result } = renderHook(() => useEventWizard());

    // Below lower boundary (4 guests)
    act(() => {
      result.current.setGuestCount(4);
    });
    let val = result.current.validate();
    expect(val.isValid).toBe(false);
    expect(val.fieldErrors.guestCount).toBe('Target guests must be between 5 and 5,000 attendees.');

    // Negative count (-10)
    act(() => {
      result.current.setGuestCount(-10);
    });
    val = result.current.validate();
    expect(val.isValid).toBe(false);

    // Above upper boundary (5001 guests)
    act(() => {
      result.current.setGuestCount(5001);
    });
    val = result.current.validate();
    expect(val.isValid).toBe(false);
    expect(val.fieldErrors.guestCount).toBe('Target guests must be between 5 and 5,000 attendees.');

    // Valid boundary extremes: 5 and 5000
    act(() => {
      result.current.setGuestCount(5);
    });
    expect(result.current.validate().fieldErrors.guestCount).toBeUndefined();

    act(() => {
      result.current.setGuestCount(5000);
    });
    expect(result.current.validate().fieldErrors.guestCount).toBeUndefined();
  });

  // 4. Validating totalBudget: rejects < 100 or > 10,000,000
  it('4. validates totalBudget boundaries: rejects < 100 or > 10,000,000', () => {
    const { result } = renderHook(() => useEventWizard());

    // Below lower boundary ($99)
    act(() => {
      result.current.setTotalBudget(99);
    });
    let val = result.current.validate();
    expect(val.isValid).toBe(false);
    expect(val.fieldErrors.totalBudget).toBe('Total budget must be between 100 and 10,000,000.');

    // Above upper boundary ($10,000,001)
    act(() => {
      result.current.setTotalBudget(10000001);
    });
    val = result.current.validate();
    expect(val.isValid).toBe(false);
    expect(val.fieldErrors.totalBudget).toBe('Total budget must be between 100 and 10,000,000.');

    // Valid lower boundary ($100) and upper boundary ($10,000,000)
    act(() => {
      result.current.setTotalBudget(100);
    });
    expect(result.current.validate().fieldErrors.totalBudget).toBeUndefined();

    act(() => {
      result.current.setTotalBudget(10000000);
    });
    expect(result.current.validate().fieldErrors.totalBudget).toBeUndefined();
  });

  // 5. Field error mapping sets aria-invalid state and clears on change
  it('5. sets isFieldInvalid / fieldErrors on submission and clears on subsequent change', () => {
    const { result } = renderHook(() => useEventWizard());

    act(() => {
      result.current.setTitle('');
      result.current.setGuestCount(2);
      result.current.setTotalBudget(50);
    });

    act(() => {
      const plan = result.current.handleSubmit();
      expect(plan).toBeNull();
    });

    // All 3 fields have errors and indicate invalid for aria-invalid mapping
    expect(result.current.isFieldInvalid('title')).toBe(true);
    expect(result.current.isFieldInvalid('guestCount')).toBe(true);
    expect(result.current.isFieldInvalid('totalBudget')).toBe(true);
    expect(result.current.validationErrors).toHaveLength(3);

    // Changing title clears title error
    act(() => {
      result.current.setTitle('Galactic Hackathon 2026');
    });
    expect(result.current.isFieldInvalid('title')).toBe(false);
    expect(result.current.fieldErrors.title).toBeUndefined();

    // Changing guestCount clears guestCount error
    act(() => {
      result.current.setGuestCount(100);
    });
    expect(result.current.isFieldInvalid('guestCount')).toBe(false);
    expect(result.current.fieldErrors.guestCount).toBeUndefined();

    // Changing totalBudget clears totalBudget error
    act(() => {
      result.current.setTotalBudget(12000);
    });
    expect(result.current.isFieldInvalid('totalBudget')).toBe(false);
    expect(result.current.fieldErrors.totalBudget).toBeUndefined();
  });

  // 6. Successful handleSubmit() returns a fully populated, valid EventPlan object
  it('6. returns fully populated EventPlan with budgetBreakdown, timeline, vendors, guests, themePalette, invitations, and menu', () => {
    const { result } = renderHook(() => useEventWizard({ defaultTemplate: 'wedding' }));

    let generatedPlan = null;
    act(() => {
      generatedPlan = result.current.handleSubmit();
    });

    expect(generatedPlan).not.toBeNull();
    if (!generatedPlan) return;

    // Check plan core identifiers
    expect(generatedPlan.id).toMatch(/^event-\d+/);
    expect(generatedPlan.eventType).toBe('wedding');
    expect(generatedPlan.guestCount).toBe(150);
    expect(generatedPlan.totalBudget).toBe(30000);
    expect(generatedPlan.currency).toBe('USD');

    // Check all 7 child domain collections
    expect(Array.isArray(generatedPlan.budgetBreakdown)).toBe(true);
    expect(generatedPlan.budgetBreakdown.length).toBeGreaterThan(0);

    expect(Array.isArray(generatedPlan.timeline)).toBe(true);
    expect(generatedPlan.timeline.length).toBeGreaterThan(0);

    expect(Array.isArray(generatedPlan.vendors)).toBe(true);
    expect(generatedPlan.vendors.length).toBeGreaterThan(0);

    expect(Array.isArray(generatedPlan.guests)).toBe(true);
    expect(generatedPlan.guests.length).toBe(Math.min(150, 8));

    expect(generatedPlan.themePalette).toBeDefined();
    expect(generatedPlan.themePalette.primary).toMatch(/^#[0-9a-fA-F]{6}$/);

    expect(Array.isArray(generatedPlan.invitations)).toBe(true);
    expect(generatedPlan.invitations.length).toBeGreaterThan(0);

    expect(Array.isArray(generatedPlan.menu)).toBe(true);
    expect(generatedPlan.menu.length).toBeGreaterThan(0);
  });

  // 7. Failed handleSubmit() populates validationErrors array and returns null
  it('7. populates validationErrors array and returns null upon failed submission', () => {
    const { result } = renderHook(() => useEventWizard());

    act(() => {
      result.current.setTitle('');
      result.current.setGuestCount(9999);
      result.current.setTotalBudget(10);
    });

    let returnedPlan = null;
    act(() => {
      returnedPlan = result.current.handleSubmit();
    });

    expect(returnedPlan).toBeNull();
    expect(result.current.validationErrors.length).toBe(3);
    expect(result.current.validationErrors).toContain('Celebration / Event Name is required.');
    expect(result.current.validationErrors).toContain(
      'Target guests must be between 5 and 5,000 attendees.'
    );
    expect(result.current.validationErrors).toContain(
      'Total budget must be between 100 and 10,000,000.'
    );
  });

  // 8. Changing eventType dynamically re-seeds default recommendations
  it('8. dynamically re-seeds default recommendations when eventType changes', () => {
    const { result } = renderHook(() => useEventWizard({ defaultTemplate: 'wedding' }));

    expect(result.current.eventType).toBe('wedding');
    expect(result.current.guestCount).toBe(150);
    expect(result.current.totalBudget).toBe(30000);

    // Switch to hackathon
    act(() => {
      result.current.setEventType('hackathon');
    });

    expect(result.current.eventType).toBe('hackathon');
    expect(result.current.title).toContain('Hackathon');
    expect(result.current.guestCount).toBe(120);
    expect(result.current.totalBudget).toBe(15000);
    expect(result.current.themeVibe).toContain('Cyberpunk');
    expect(result.current.dietaryInput).toContain('High-Protein');

    // Switch to birthday
    act(() => {
      result.current.setEventType('birthday');
    });

    expect(result.current.eventType).toBe('birthday');
    expect(result.current.title).toContain('Birthday');
    expect(result.current.guestCount).toBe(50);
    expect(result.current.totalBudget).toBe(6000);
    expect(result.current.venueType).toBe('rooftop');

    // Switch to anniversary
    act(() => {
      result.current.setEventType('anniversary');
    });

    expect(result.current.eventType).toBe('anniversary');
    expect(result.current.title).toContain('Anniversary');
    expect(result.current.guestCount).toBe(80);
    expect(result.current.totalBudget).toBe(18000);
  });

  // 9. Load presets function loads configuration accurately
  it('9. loadPreset loads preconfigured templates and resets validation errors', () => {
    const { result } = renderHook(() => useEventWizard());

    act(() => {
      result.current.setTitle('');
    });
    act(() => {
      result.current.handleSubmit();
    });
    expect(result.current.validationErrors.length).toBeGreaterThan(0);

    act(() => {
      result.current.loadPreset('corporate');
    });

    expect(result.current.eventType).toBe('corporate');
    expect(result.current.title).toContain('Summit');
    expect(result.current.validationErrors).toEqual([]);
    expect(result.current.fieldErrors).toEqual({});
  });

  // 10. resetDefaults restores current eventType defaults
  it('10. resetDefaults restores canonical domain defaults', () => {
    const { result } = renderHook(() => useEventWizard({ defaultTemplate: 'wedding' }));

    act(() => {
      result.current.setTitle('Temporary Modified Title');
      result.current.setGuestCount(88);
      result.current.setTotalBudget(99999);
    });

    expect(result.current.title).toBe('Temporary Modified Title');
    expect(result.current.guestCount).toBe(88);

    act(() => {
      result.current.resetDefaults();
    });

    expect(result.current.title).toContain('Wedding');
    expect(result.current.guestCount).toBe(150);
    expect(result.current.totalBudget).toBe(30000);
  });
});
