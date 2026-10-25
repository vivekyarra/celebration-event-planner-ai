/**
 * CelebriteAI Runtime Schema Validator & Safe Import Engine
 * Zero-dependency, type-safe runtime validator for EventPlan schemas.
 * Defends against Prototype Pollution, XSS payloads, out-of-range metrics, and malformed structures.
 *
 * @module utils/schemaValidator
 */

import {
  EventPlan,
  EventType,
  VenueType,
  TimelinePhase,
  RSVPStatus,
  TimelineItem,
  Guest,
  BudgetCategory,
  MenuItem,
  VendorItem,
  ThemePalette,
  InvitationDraft,
} from '../types';
export * from './security';
import { sanitizeHtml, validateNumericRange } from './security';

/**
 * Result returned by EventPlan runtime schema validation.
 */
export interface ValidationResult {
  /** True if the data passed all validation rules without fatal errors. */
  isValid: boolean;
  /** Backward-compatible alias for isValid. */
  valid: boolean;
  /** List of human-readable validation error messages. */
  errors: string[];
  /** Deeply sanitized and normalized EventPlan object (only present when isValid is true). */
  sanitizedPlan?: EventPlan;
}

const VALID_EVENT_TYPES: readonly EventType[] = [
  'wedding',
  'birthday',
  'corporate',
  'anniversary',
  'hackathon',
  'baby_shower',
  'festive_gala',
  'milestone',
] as const;

const VALID_VENUE_TYPES: readonly VenueType[] = [
  'indoor',
  'outdoor',
  'hybrid',
  'beach',
  'rooftop',
  'virtual',
] as const;

const VALID_TIMELINE_PHASES: readonly TimelinePhase[] = [
  'setup',
  'arrival',
  'ceremony',
  'dining',
  'entertainment',
  'winddown',
] as const;

const VALID_RSVP_STATUSES: readonly RSVPStatus[] = [
  'confirmed',
  'declined',
  'pending',
] as const;

const VALID_MENU_COURSES = ['starters', 'mains', 'desserts', 'beverages'] as const;

const FORBIDDEN_POLLUTION_KEYS = ['__proto__', 'constructor', 'prototype'] as const;

/**
 * Recursively inspects an object graph to detect and prevent Prototype Pollution attacks.
 *
 * @param obj The target object to scan.
 * @param seen Set of visited objects to avoid circular reference loops.
 * @returns Array of error messages describing any prototype pollution attempts.
 */
function scanForPrototypePollution(obj: unknown, seen = new WeakSet<object>()): string[] {
  const errors: string[] = [];
  if (!obj || typeof obj !== 'object') return errors;

  if (seen.has(obj)) return errors;
  seen.add(obj);

  // Check prototype legitimacy
  const proto = Object.getPrototypeOf(obj);
  if (proto !== null && proto !== Object.prototype && proto !== Array.prototype) {
    errors.push('Prototype pollution detected: Unexpected prototype inheritance chain.');
  }

  // Check own property names and symbols
  const ownProps = Object.getOwnPropertyNames(obj);
  for (const prop of ownProps) {
    if (FORBIDDEN_POLLUTION_KEYS.includes(prop as typeof FORBIDDEN_POLLUTION_KEYS[number])) {
      errors.push(`Prototype pollution detected: forbidden key "${prop}" found.`);
    }
  }

  // Recurse into own enumerable properties
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_POLLUTION_KEYS.includes(key as typeof FORBIDDEN_POLLUTION_KEYS[number])) {
      errors.push(`Prototype pollution detected: forbidden property key "${key}" found.`);
      continue;
    }
    const val = (obj as Record<string, unknown>)[key];
    if (val && typeof val === 'object') {
      errors.push(...scanForPrototypePollution(val, seen));
    }
  }

  return errors;
}

/**
 * Detects whether an object or graph exhibits prototype pollution vectors.
 *
 * @param obj Unknown value to inspect.
 * @returns `true` if prototype pollution detected, otherwise `false`.
 */
export function detectPrototypePollution(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  return scanForPrototypePollution(obj).length > 0;
}

/**
 * Strips dangerous prototype pollution keys and creates an isolated clean copy.
 *
 * @param obj Untrusted source object.
 * @returns Sanitized clone free of prototype pollution keys.
 */
export function preventPrototypePollution<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return (obj.map((item) => preventPrototypePollution(item)) as unknown) as T;
  }

  const clean: Record<string, unknown> = {};
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (FORBIDDEN_POLLUTION_KEYS.includes(key as typeof FORBIDDEN_POLLUTION_KEYS[number])) {
      continue;
    }
    const val = (obj as Record<string, unknown>)[key];
    clean[key] = typeof val === 'object' && val !== null ? preventPrototypePollution(val) : val;
  }
  return clean as T;
}

/**
 * Validates whether a given string is a valid ISO date or ISO date-time string.
 *
 * @param dateStr String representation of a date.
 * @returns `true` if parseable into a valid calendar date, otherwise `false`.
 */
function isValidIsoDate(dateStr: unknown): boolean {
  if (typeof dateStr !== 'string' || !dateStr.trim()) return false;
  const isoPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
  if (!isoPattern.test(dateStr.trim())) return false;
  const parsed = Date.parse(dateStr);
  return !isNaN(parsed);
}

/**
 * Validates, normalizes, and sanitizes an untrusted EventPlan object or JSON string.
 * Enforces zero prototype pollution, strict field constraints, numerical bounds,
 * and valid enum states.
 *
 * @param data Untrusted imported plan object or JSON string.
 * @returns ValidationResult with `isValid: boolean`, `valid: boolean`, `errors: string[]`, and optional `sanitizedPlan`.
 *
 * @example
 * ```ts
 * const result = validateEventPlan(importedJson);
 * if (result.isValid && result.sanitizedPlan) {
 *   setPlan(result.sanitizedPlan);
 * } else {
 *   console.error('Import validation failed:', result.errors);
 * }
 * ```
 */
export function validateEventPlan(data: unknown): ValidationResult {
  const errors: string[] = [];

  // Parse if JSON string was passed
  let raw: unknown = data;
  if (typeof data === 'string') {
    if (/"(?:__proto__|constructor|prototype)"\s*:/i.test(data)) {
      return {
        isValid: false,
        valid: false,
        errors: ['Prototype pollution detected: forbidden key in JSON payload.'],
      };
    }
    try {
      raw = JSON.parse(data);
    } catch {
      return {
        isValid: false,
        valid: false,
        errors: ['Invalid JSON: Unable to parse input payload.'],
      };
    }
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      isValid: false,
      valid: false,
      errors: ['Invalid EventPlan payload: Expected a JSON object.'],
    };
  }

  // Scan entire object graph for Prototype Pollution
  const pollutionErrors = scanForPrototypePollution(raw);
  if (pollutionErrors.length > 0) {
    return {
      isValid: false,
      valid: false,
      errors: Array.from(new Set(pollutionErrors)),
    };
  }

  const record = raw as Record<string, unknown>;

  // 1. ID Validation
  const rawId = record.id;
  if (typeof rawId !== 'string' || !rawId.trim()) {
    errors.push('Missing or invalid "id": Expected a non-empty string identifier.');
  }
  const cleanId = typeof rawId === 'string' ? sanitizeHtml(rawId.trim()) : `event-${Date.now()}`;

  // 2. Title Validation (1-200 chars)
  const rawTitle = record.title;
  if (typeof rawTitle !== 'string' || rawTitle.trim().length === 0) {
    errors.push('Missing or invalid "title": Expected a string with 1 to 200 characters.');
  } else if (rawTitle.trim().length > 200) {
    errors.push('Invalid "title": Exceeds maximum length of 200 characters.');
  }
  const cleanTitle = typeof rawTitle === 'string' ? sanitizeHtml(rawTitle.trim().substring(0, 200)) : '';

  // 3. EventType Validation
  const rawEventType = record.eventType;
  if (!VALID_EVENT_TYPES.includes(rawEventType as EventType)) {
    errors.push(
      `Invalid eventType "${String(rawEventType)}". Must be one of: ${VALID_EVENT_TYPES.join(', ')}.`
    );
  }
  const cleanEventType: EventType = VALID_EVENT_TYPES.includes(rawEventType as EventType)
    ? (rawEventType as EventType)
    : 'corporate';

  // 4. Total Budget Validation (> 0 and <= 50,000,000)
  if (typeof record.totalBudget !== 'number') {
    errors.push('Invalid "totalBudget": Must be a numeric value.');
  }
  const rawBudget = Number(record.totalBudget);
  const budgetCheck = validateNumericRange(rawBudget, 0.01, 50000000, 'totalBudget');
  if (!budgetCheck.valid) {
    errors.push(budgetCheck.error || 'Invalid "totalBudget": Must be a number between > 0 and 50,000,000.');
  }
  const cleanTotalBudget = budgetCheck.valid ? rawBudget : 10000;

  // 5. Guest Count Validation (>= 1 and <= 20,000)
  if (typeof record.guestCount !== 'number') {
    errors.push('Invalid "guestCount": Must be a numeric value.');
  }
  const rawGuestCount = Number(record.guestCount);
  const guestCheck = validateNumericRange(rawGuestCount, 1, 20000, 'guestCount');
  if (!guestCheck.valid) {
    errors.push(guestCheck.error || 'Invalid "guestCount": Must be an integer between 1 and 20,000.');
  }
  const cleanGuestCount = guestCheck.valid ? Math.round(rawGuestCount) : 50;

  // 6. Date Validation (supports "eventDate" or "date")
  const rawDate = record.eventDate ?? record.date;
  if (!isValidIsoDate(rawDate)) {
    errors.push('Missing or invalid "date" / "eventDate": Expected a valid ISO calendar date string (e.g. YYYY-MM-DD).');
  }
  const cleanDate = isValidIsoDate(rawDate)
    ? String(rawDate).trim()
    : new Date().toISOString().split('T')[0];

  // Optional string & enum fields
  const cleanStartTime = typeof record.startTime === 'string' ? sanitizeHtml(record.startTime.trim()) : '17:00';
  const cleanEndTime = typeof record.endTime === 'string' ? sanitizeHtml(record.endTime.trim()) : '22:00';
  const cleanCurrency = typeof record.currency === 'string' ? sanitizeHtml(record.currency.trim()) : 'USD';
  const cleanVenueType: VenueType = VALID_VENUE_TYPES.includes(record.venueType as VenueType)
    ? (record.venueType as VenueType)
    : 'indoor';
  const cleanTheme = typeof record.theme === 'string' ? sanitizeHtml(record.theme.trim()) : 'Modern Celebration';
  const cleanSpecialRequests = typeof record.specialRequests === 'string'
    ? sanitizeHtml(record.specialRequests.trim())
    : '';

  const cleanDietaryPreferences = Array.isArray(record.dietaryPreferences)
    ? record.dietaryPreferences.map((d) => sanitizeHtml(String(d).trim())).filter(Boolean)
    : ['Vegetarian', 'Gluten-Free'];

  // 7. Timeline Array Validation
  const cleanTimeline: TimelineItem[] = [];
  const rawTimeline = record.timeline;
  if (rawTimeline !== undefined) {
    if (!Array.isArray(rawTimeline)) {
      errors.push('Invalid "timeline": Expected an array of timeline items.');
    } else {
      rawTimeline.forEach((item, index) => {
        if (!item || typeof item !== 'object') {
          errors.push(`Invalid timeline item at index ${index}: Expected an object.`);
          return;
        }
        const t = item as Record<string, unknown>;
        if (!VALID_TIMELINE_PHASES.includes(t.phase as TimelinePhase)) {
          errors.push(
            `Timeline item [${index}] has invalid phase "${String(t.phase)}". Must be one of: ${VALID_TIMELINE_PHASES.join(', ')}.`
          );
        }
        cleanTimeline.push({
          id: typeof t.id === 'string' && t.id.trim() ? sanitizeHtml(t.id.trim()) : `timeline-${index + 1}`,
          time: typeof t.time === 'string' ? sanitizeHtml(t.time.trim()) : '18:00',
          phase: VALID_TIMELINE_PHASES.includes(t.phase as TimelinePhase)
            ? (t.phase as TimelinePhase)
            : 'ceremony',
          title: typeof t.title === 'string' ? sanitizeHtml(t.title.trim()) : `Milestone ${index + 1}`,
          description: typeof t.description === 'string' ? sanitizeHtml(t.description.trim()) : '',
          leadCoordinator: typeof t.leadCoordinator === 'string' ? sanitizeHtml(t.leadCoordinator.trim()) : 'Coordinator',
          isCompleted: Boolean(t.isCompleted),
        });
      });
    }
  }

  // 8. Guests Array Validation
  const cleanGuests: Guest[] = [];
  const rawGuests = record.guests;
  if (rawGuests !== undefined) {
    if (!Array.isArray(rawGuests)) {
      errors.push('Invalid "guests": Expected an array of guest objects.');
    } else {
      rawGuests.forEach((item, index) => {
        if (!item || typeof item !== 'object') {
          errors.push(`Invalid guest at index ${index}: Expected an object.`);
          return;
        }
        const g = item as Record<string, unknown>;
        if (g.rsvpStatus && !VALID_RSVP_STATUSES.includes(g.rsvpStatus as RSVPStatus)) {
          errors.push(
            `Guest [${index}] has invalid rsvpStatus "${String(g.rsvpStatus)}". Must be one of: ${VALID_RSVP_STATUSES.join(', ')}.`
          );
        }
        cleanGuests.push({
          id: typeof g.id === 'string' && g.id.trim() ? sanitizeHtml(g.id.trim()) : `guest-${index + 1}`,
          name: typeof g.name === 'string' ? sanitizeHtml(g.name.trim()) : `Guest ${index + 1}`,
          email: typeof g.email === 'string' ? sanitizeHtml(g.email.trim()) : `guest${index + 1}@example.com`,
          dietary: typeof g.dietary === 'string' ? sanitizeHtml(g.dietary.trim()) : 'Standard',
          tableNumber: typeof g.tableNumber === 'number' && !isNaN(g.tableNumber) ? g.tableNumber : null,
          rsvpStatus: VALID_RSVP_STATUSES.includes(g.rsvpStatus as RSVPStatus)
            ? (g.rsvpStatus as RSVPStatus)
            : 'pending',
          plusOnes: typeof g.plusOnes === 'number' && g.plusOnes >= 0 ? Math.floor(g.plusOnes) : 0,
          notes: typeof g.notes === 'string' ? sanitizeHtml(g.notes.trim()) : undefined,
        });
      });
    }
  }

  // 9. Budget Array Validation (supports "budgetBreakdown" or "budget")
  const cleanBudget: BudgetCategory[] = [];
  const rawBudgetArray = record.budgetBreakdown ?? record.budget;
  if (rawBudgetArray !== undefined) {
    if (!Array.isArray(rawBudgetArray)) {
      errors.push('Invalid "budgetBreakdown": Expected an array of budget categories.');
    } else {
      rawBudgetArray.forEach((item, index) => {
        if (!item || typeof item !== 'object') {
          errors.push(`Invalid budget category at index ${index}: Expected an object.`);
          return;
        }
        const b = item as Record<string, unknown>;
        cleanBudget.push({
          id: typeof b.id === 'string' ? sanitizeHtml(b.id) : `cat-${index + 1}`,
          name: typeof b.name === 'string' ? sanitizeHtml(b.name.trim()) : `Category ${index + 1}`,
          percentage: typeof b.percentage === 'number' && !isNaN(b.percentage) ? b.percentage : 10,
          allocatedAmount: typeof b.allocatedAmount === 'number' && !isNaN(b.allocatedAmount) ? b.allocatedAmount : 1000,
          spentAmount: typeof b.spentAmount === 'number' && !isNaN(b.spentAmount) ? b.spentAmount : 0,
          icon: typeof b.icon === 'string' ? sanitizeHtml(b.icon.trim()) : 'DollarSign',
          recommendations: Array.isArray(b.recommendations)
            ? b.recommendations.map((r) => sanitizeHtml(String(r).trim())).filter(Boolean)
            : [],
        });
      });
    }
  }

  // 10. Menu Array Validation
  const cleanMenu: MenuItem[] = [];
  const rawMenu = record.menu;
  if (rawMenu !== undefined) {
    if (!Array.isArray(rawMenu)) {
      errors.push('Invalid "menu": Expected an array of menu items.');
    } else {
      rawMenu.forEach((item, index) => {
        if (!item || typeof item !== 'object') {
          errors.push(`Invalid menu item at index ${index}: Expected an object.`);
          return;
        }
        const m = item as Record<string, unknown>;
        if (!VALID_MENU_COURSES.includes(m.course as typeof VALID_MENU_COURSES[number])) {
          errors.push(
            `Menu item [${index}] has invalid course "${String(m.course)}". Must be one of: ${VALID_MENU_COURSES.join(', ')}.`
          );
        }
        cleanMenu.push({
          id: typeof m.id === 'string' ? sanitizeHtml(m.id) : `menu-${index + 1}`,
          course: VALID_MENU_COURSES.includes(m.course as typeof VALID_MENU_COURSES[number])
            ? (m.course as typeof VALID_MENU_COURSES[number])
            : 'mains',
          name: typeof m.name === 'string' ? sanitizeHtml(m.name.trim()) : `Dish ${index + 1}`,
          description: typeof m.description === 'string' ? sanitizeHtml(m.description.trim()) : '',
          dietaryTags: Array.isArray(m.dietaryTags)
            ? m.dietaryTags.map((t) => sanitizeHtml(String(t).trim())).filter(Boolean)
            : [],
          recommendedQuantity: typeof m.recommendedQuantity === 'string' ? sanitizeHtml(m.recommendedQuantity.trim()) : '1 serving',
        });
      });
    }
  }

  // Vendors, ThemePalette, Invitations sanitization
  const cleanVendors: VendorItem[] = Array.isArray(record.vendors)
    ? (record.vendors as Record<string, unknown>[]).map((v, i) => ({
        id: typeof v.id === 'string' ? sanitizeHtml(v.id) : `vendor-${i + 1}`,
        category: typeof v.category === 'string' ? sanitizeHtml(v.category) : 'General',
        companyName: typeof v.companyName === 'string' ? sanitizeHtml(v.companyName) : 'Premier Partner',
        contactPerson: typeof v.contactPerson === 'string' ? sanitizeHtml(v.contactPerson) : 'Coordinator',
        emailOrPhone: typeof v.emailOrPhone === 'string' ? sanitizeHtml(v.emailOrPhone) : 'contact@partner.com',
        estimatedCost: typeof v.estimatedCost === 'number' && !isNaN(v.estimatedCost) ? v.estimatedCost : 500,
        status: (['planning', 'contacted', 'negotiating', 'confirmed', 'completed'].includes(String(v.status))
          ? v.status
          : 'planning') as VendorItem['status'],
        notes: typeof v.notes === 'string' ? sanitizeHtml(v.notes) : '',
      }))
    : [];

  const rawPalette = (record.themePalette && typeof record.themePalette === 'object' ? record.themePalette : {}) as Record<string, unknown>;
  const cleanThemePalette: ThemePalette = {
    name: typeof rawPalette.name === 'string' ? sanitizeHtml(rawPalette.name) : 'Celebration Elegance',
    primary: typeof rawPalette.primary === 'string' ? sanitizeHtml(rawPalette.primary) : '#1e3a8a',
    secondary: typeof rawPalette.secondary === 'string' ? sanitizeHtml(rawPalette.secondary) : '#d97706',
    accent: typeof rawPalette.accent === 'string' ? sanitizeHtml(rawPalette.accent) : '#10b981',
    background: typeof rawPalette.background === 'string' ? sanitizeHtml(rawPalette.background) : '#0f172a',
    vibeDescription: typeof rawPalette.vibeDescription === 'string' ? sanitizeHtml(rawPalette.vibeDescription) : 'Vibrant celebration atmosphere',
    lightingStyle: typeof rawPalette.lightingStyle === 'string' ? sanitizeHtml(rawPalette.lightingStyle) : 'Warm ambient uplighting',
    recommendedDressCode: typeof rawPalette.recommendedDressCode === 'string' ? sanitizeHtml(rawPalette.recommendedDressCode) : 'Semi-formal Cocktail',
    curatedMusicPlaylists: Array.isArray(rawPalette.curatedMusicPlaylists)
      ? rawPalette.curatedMusicPlaylists.map((p) => sanitizeHtml(String(p))).filter(Boolean)
      : ['Acoustic Lounge', 'Top Hits Dance Party'],
  };

  const cleanInvitations: InvitationDraft[] = Array.isArray(record.invitations)
    ? (record.invitations as Record<string, unknown>[]).map((inv, i) => ({
        id: typeof inv.id === 'string' ? sanitizeHtml(inv.id) : `inv-${i + 1}`,
        style: (['elegant', 'playful', 'formal', 'poetic'].includes(String(inv.style))
          ? inv.style
          : 'elegant') as InvitationDraft['style'],
        headline: typeof inv.headline === 'string' ? sanitizeHtml(inv.headline) : 'You Are Invited!',
        body: typeof inv.body === 'string' ? sanitizeHtml(inv.body) : 'Join us for a memorable celebration.',
        callToAction: typeof inv.callToAction === 'string' ? sanitizeHtml(inv.callToAction) : 'RSVP by November 1st',
      }))
    : [];

  const isValid = errors.length === 0;

  if (!isValid) {
    return {
      isValid: false,
      valid: false,
      errors,
    };
  }

  const sanitizedPlan: EventPlan = {
    id: cleanId,
    title: cleanTitle,
    eventType: cleanEventType,
    eventDate: cleanDate,
    startTime: cleanStartTime,
    endTime: cleanEndTime,
    guestCount: cleanGuestCount,
    totalBudget: cleanTotalBudget,
    currency: cleanCurrency,
    venueType: cleanVenueType,
    theme: cleanTheme,
    dietaryPreferences: cleanDietaryPreferences,
    specialRequests: cleanSpecialRequests,
    budgetBreakdown: cleanBudget,
    timeline: cleanTimeline,
    vendors: cleanVendors,
    guests: cleanGuests,
    themePalette: cleanThemePalette,
    invitations: cleanInvitations,
    menu: cleanMenu,
  };

  return {
    isValid: true,
    valid: true,
    errors: [],
    sanitizedPlan,
  };
}
