/**
 * CelebriteAI Separation of Concerns Hook: Celebration Wizard State & Submission Engine
 * Encapsulates multi-domain celebration wizard forms, input validation rules,
 * dynamic domain preset recommendations, and sanitized EventPlan synthesis.
 *
 * @module hooks/useEventWizard
 */

import React, { useState, useCallback, useMemo } from 'react';
import { EventPlan, EventType, VenueType } from '../types';
import {
  calculateBudgetBreakdown,
  generateCuratedTheme,
  generateInitialGuests,
  generateInvitations,
  generateMenu,
  generateRunOfShow,
  generateVendors,
} from '../services/plannerGenerator';

export interface FieldErrors {
  title?: string;
  guestCount?: string;
  totalBudget?: string;
}

export interface PresetDefaults {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  totalBudget: number;
  venueType: VenueType;
  themeVibe: string;
  dietaryInput: string;
}

export const DOMAIN_PRESETS: Record<EventType, PresetDefaults> = {
  wedding: {
    title: 'Aarav & Ananya’s Royal Wedding',
    date: '2026-12-18',
    startTime: '16:00',
    endTime: '23:30',
    guestCount: 150,
    totalBudget: 30000,
    venueType: 'indoor',
    themeVibe: 'Ethereal Botanical Elegance',
    dietaryInput: 'Vegetarian, Gluten-Free, Vegan, Nut-Free',
  },
  corporate: {
    title: 'Annual Global Innovation Summit & Gala',
    date: '2026-12-05',
    startTime: '14:00',
    endTime: '22:00',
    guestCount: 200,
    totalBudget: 45000,
    venueType: 'hybrid',
    themeVibe: 'Aurora Innovate Horizon',
    dietaryInput: 'Gluten-Free, Halal, Jain Vegetarian, Vegan',
  },
  hackathon: {
    title: 'NextGen AI 24H Global Hackathon',
    date: '2026-11-15',
    startTime: '09:00',
    endTime: '21:00',
    guestCount: 120,
    totalBudget: 15000,
    venueType: 'indoor',
    themeVibe: 'Neon Cyberpunk Gala',
    dietaryInput: 'Vegan, High-Protein, Caffeine Station, Halal',
  },
  birthday: {
    title: 'Maya’s Retro Neon 30th Birthday',
    date: '2026-11-28',
    startTime: '19:00',
    endTime: '01:00',
    guestCount: 50,
    totalBudget: 6000,
    venueType: 'rooftop',
    themeVibe: 'Golden Velvet Celebration',
    dietaryInput: 'Vegetarian, Dairy-Free',
  },
  anniversary: {
    title: 'Golden Horizon 25th Anniversary Gala',
    date: '2026-12-20',
    startTime: '18:00',
    endTime: '23:30',
    guestCount: 80,
    totalBudget: 18000,
    venueType: 'indoor',
    themeVibe: 'Silver & Rose Gold Gala',
    dietaryInput: 'Vegetarian, Gluten-Free',
  },
  baby_shower: {
    title: 'Starlight Welcome Baby Shower',
    date: '2026-11-10',
    startTime: '14:00',
    endTime: '18:00',
    guestCount: 40,
    totalBudget: 4500,
    venueType: 'indoor',
    themeVibe: 'Pastel Meadow Bloom',
    dietaryInput: 'Vegetarian, Dairy-Free',
  },
  festive_gala: {
    title: 'Winter Solstice Festive Charity Gala',
    date: '2026-12-22',
    startTime: '17:30',
    endTime: '23:30',
    guestCount: 250,
    totalBudget: 55000,
    venueType: 'indoor',
    themeVibe: 'Midnight Starlight Luminary',
    dietaryInput: 'Gluten-Free, Halal, Vegan',
  },
  milestone: {
    title: 'Decade of Excellence Milestone Celebration',
    date: '2026-11-30',
    startTime: '18:30',
    endTime: '23:00',
    guestCount: 100,
    totalBudget: 20000,
    venueType: 'rooftop',
    themeVibe: 'Crimson Velvet Glamour',
    dietaryInput: 'Vegetarian, Gluten-Free, Halal',
  },
};

export interface UseEventWizardOptions {
  initialEventType?: EventType;
  defaultTemplate?: 'wedding' | 'corporate' | 'birthday' | 'hackathon' | 'anniversary';
  onPlanCreated?: (plan: EventPlan) => void;
}

export interface UseEventWizardReturn {
  eventType: EventType;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  totalBudget: number;
  currency: string;
  venueType: VenueType;
  themeVibe: string;
  dietaryInput: string;
  dietaryTags: string;
  fieldErrors: FieldErrors;
  validationErrors: string[];
  isValid: boolean;
  isFieldInvalid: (field: keyof FieldErrors) => boolean;
  setEventType: (newType: EventType, autoReseed?: boolean) => void;
  setTitle: (newTitle: string) => void;
  setDate: (newDate: string) => void;
  setStartTime: (newStartTime: string) => void;
  setEndTime: (newEndTime: string) => void;
  setGuestCount: (newGuestCount: number) => void;
  setTotalBudget: (newBudget: number) => void;
  setVenueType: (newVenue: VenueType) => void;
  setThemeVibe: (newTheme: string) => void;
  setDietaryInput: (newDietary: string) => void;
  handleFieldChange: (field: string, value: any) => void;
  loadPreset: (presetName: string) => void;
  resetDefaults: () => void;
  validate: () => { isValid: boolean; fieldErrors: FieldErrors; validationErrors: string[] };
  handleSubmit: (e?: React.FormEvent) => EventPlan | null;
}

/**
 * Custom React hook for driving the celebration creation wizard, validating inputs,
 * and synthesizing complete EventPlan domain entities.
 */
export function useEventWizard(options?: UseEventWizardOptions): UseEventWizardReturn {
  const initialType: EventType = options?.initialEventType || (options?.defaultTemplate as EventType) || 'wedding';
  const defaults = DOMAIN_PRESETS[initialType] || DOMAIN_PRESETS.wedding;

  const [eventType, setEventTypeState] = useState<EventType>(initialType);
  const [title, setTitleState] = useState<string>(defaults.title);
  const [date, setDate] = useState<string>(defaults.date);
  const [startTime, setStartTime] = useState<string>(defaults.startTime);
  const [endTime, setEndTime] = useState<string>(defaults.endTime);
  const [guestCount, setGuestCountState] = useState<number>(defaults.guestCount);
  const [totalBudget, setTotalBudgetState] = useState<number>(defaults.totalBudget);
  const [currency] = useState<string>('USD');
  const [venueType, setVenueType] = useState<VenueType>(defaults.venueType);
  const [themeVibe, setThemeVibe] = useState<string>(defaults.themeVibe);
  const [dietaryInput, setDietaryInputState] = useState<string>(defaults.dietaryInput);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Dynamically re-seeds default recommendations when event type changes
  const setEventType = useCallback((newType: EventType, autoReseed: boolean = true) => {
    setEventTypeState(newType);
    setFieldErrors({});
    setValidationErrors([]);
    if (autoReseed && DOMAIN_PRESETS[newType]) {
      const preset = DOMAIN_PRESETS[newType];
      setTitleState(preset.title);
      setDate(preset.date);
      setStartTime(preset.startTime);
      setEndTime(preset.endTime);
      setGuestCountState(preset.guestCount);
      setTotalBudgetState(preset.totalBudget);
      setVenueType(preset.venueType);
      setThemeVibe(preset.themeVibe);
      setDietaryInputState(preset.dietaryInput);
    }
  }, []);

  const setTitle = useCallback((newTitle: string) => {
    setTitleState(newTitle);
    setFieldErrors((prev) => ({ ...prev, title: undefined }));
    setValidationErrors((prev) => prev.filter((msg) => !msg.includes('Celebration / Event Name')));
  }, []);

  const setGuestCount = useCallback((newCount: number) => {
    setGuestCountState(newCount);
    setFieldErrors((prev) => ({ ...prev, guestCount: undefined }));
    setValidationErrors((prev) => prev.filter((msg) => !msg.includes('Target guests')));
  }, []);

  const setTotalBudget = useCallback((newBudget: number) => {
    setTotalBudgetState(newBudget);
    setFieldErrors((prev) => ({ ...prev, totalBudget: undefined }));
    setValidationErrors((prev) => prev.filter((msg) => !msg.includes('Total budget')));
  }, []);

  const setDietaryInput = useCallback((val: string) => {
    setDietaryInputState(val);
  }, []);

  const handleFieldChange = useCallback(
    (field: string, value: any) => {
      switch (field) {
        case 'title':
          setTitle(value);
          break;
        case 'eventType':
          setEventType(value as EventType);
          break;
        case 'venueType':
          setVenueType(value as VenueType);
          break;
        case 'date':
          setDate(value);
          break;
        case 'startTime':
          setStartTime(value);
          break;
        case 'endTime':
          setEndTime(value);
          break;
        case 'guestCount':
          setGuestCount(value);
          break;
        case 'totalBudget':
          setTotalBudget(value);
          break;
        case 'themeVibe':
          setThemeVibe(value);
          break;
        case 'dietaryInput':
        case 'dietaryTags':
          setDietaryInput(value);
          break;
        default:
          break;
      }
    },
    [setTitle, setEventType, setGuestCount, setTotalBudget, setDietaryInput]
  );

  const loadPreset = useCallback((presetName: string) => {
    const key = presetName.toLowerCase() as EventType;
    if (DOMAIN_PRESETS[key]) {
      setEventType(key, true);
    }
  }, [setEventType]);

  const resetDefaults = useCallback(() => {
    const d = DOMAIN_PRESETS[eventType] || DOMAIN_PRESETS.wedding;
    setTitleState(d.title);
    setDate(d.date);
    setStartTime(d.startTime);
    setEndTime(d.endTime);
    setGuestCountState(d.guestCount);
    setTotalBudgetState(d.totalBudget);
    setVenueType(d.venueType);
    setThemeVibe(d.themeVibe);
    setDietaryInputState(d.dietaryInput);
    setFieldErrors({});
    setValidationErrors([]);
  }, [eventType]);

  const validate = useCallback(() => {
    const errs: string[] = [];
    const fErrs: FieldErrors = {};

    const trimmedTitle = (title || '').trim();
    if (!trimmedTitle) {
      const msg = 'Celebration / Event Name is required.';
      errs.push(msg);
      fErrs.title = msg;
    } else if (trimmedTitle.length > 200) {
      const msg = 'Celebration / Event Name cannot exceed 200 characters.';
      errs.push(msg);
      fErrs.title = msg;
    }

    if (typeof guestCount !== 'number' || isNaN(guestCount) || guestCount < 5 || guestCount > 5000) {
      const msg = 'Target guests must be between 5 and 5,000 attendees.';
      errs.push(msg);
      fErrs.guestCount = msg;
    }

    if (typeof totalBudget !== 'number' || isNaN(totalBudget) || totalBudget < 100 || totalBudget > 10000000) {
      const msg = 'Total budget must be between 100 and 10,000,000.';
      errs.push(msg);
      fErrs.totalBudget = msg;
    }

    return {
      isValid: errs.length === 0,
      fieldErrors: fErrs,
      validationErrors: errs,
    };
  }, [title, guestCount, totalBudget]);

  const isFieldInvalid = useCallback(
    (field: keyof FieldErrors): boolean => {
      return Boolean(fieldErrors[field]);
    },
    [fieldErrors]
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent): EventPlan | null => {
      if (e?.preventDefault) {
        e.preventDefault();
      }

      const valResult = validate();
      if (!valResult.isValid) {
        setFieldErrors(valResult.fieldErrors);
        setValidationErrors(valResult.validationErrors);
        return null;
      }

      setFieldErrors({});
      setValidationErrors([]);

      const dietList = dietaryInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const newPlan: EventPlan = {
        id: `event-${Date.now()}`,
        title: title.trim(),
        eventType,
        eventDate: date,
        startTime,
        endTime,
        guestCount,
        totalBudget,
        currency,
        venueType,
        theme: themeVibe,
        dietaryPreferences: dietList,
        specialRequests: '',
        budgetBreakdown: calculateBudgetBreakdown(eventType, totalBudget),
        timeline: generateRunOfShow(eventType, startTime),
        vendors: generateVendors(eventType, totalBudget),
        guests: generateInitialGuests(guestCount),
        themePalette: generateCuratedTheme(eventType, themeVibe),
        invitations: generateInvitations(title.trim(), eventType, date, venueType),
        menu: generateMenu(eventType, dietList),
      };

      if (options?.onPlanCreated) {
        options.onPlanCreated(newPlan);
      }

      return newPlan;
    },
    [
      validate,
      title,
      eventType,
      date,
      startTime,
      endTime,
      guestCount,
      totalBudget,
      currency,
      venueType,
      themeVibe,
      dietaryInput,
      options,
    ]
  );

  const isValid = useMemo(() => {
    const trimmedTitle = (title || '').trim();
    if (!trimmedTitle || trimmedTitle.length > 200) return false;
    if (typeof guestCount !== 'number' || guestCount < 5 || guestCount > 5000) return false;
    if (typeof totalBudget !== 'number' || totalBudget < 100 || totalBudget > 10000000) return false;
    return true;
  }, [title, guestCount, totalBudget]);

  return {
    eventType,
    title,
    date,
    startTime,
    endTime,
    guestCount,
    totalBudget,
    currency,
    venueType,
    themeVibe,
    dietaryInput,
    dietaryTags: dietaryInput,
    fieldErrors,
    validationErrors,
    isValid,
    isFieldInvalid,
    setEventType,
    setTitle,
    setDate,
    setStartTime,
    setEndTime,
    setGuestCount,
    setTotalBudget,
    setVenueType,
    setThemeVibe,
    setDietaryInput,
    handleFieldChange,
    loadPreset,
    resetDefaults,
    validate,
    handleSubmit,
  };
}
