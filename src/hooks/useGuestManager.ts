/**
 * CelebriteAI Separation of Concerns Hook: Guest & Attendance Manager
 * Encapsulates guest list state mutations, RSVP status transitions,
 * dietary aggregation, and seating/table allocation mapping.
 *
 * @module hooks/useGuestManager
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Guest, RSVPStatus } from '../types';

export interface UseGuestManagerReturn {
  /** The current array of guests being managed. */
  guests: Guest[];
  /** Adds a new guest record, generating a unique ID if omitted. */
  addGuest: (guest: Omit<Guest, 'id'> | Guest) => void;
  /** Updates the RSVP status ('confirmed' | 'pending' | 'declined') of a specific guest. */
  updateGuestStatus: (id: string, status: RSVPStatus) => void;
  /** Permanently removes a guest from the registry. */
  deleteGuest: (id: string) => void;
  /** Filters the guest list by RSVP status or returns all. */
  filterByRsvp: (status: RSVPStatus | 'all') => Guest[];
  /** Filters the guest list by specific dietary requirement tag. */
  filterByDietary: (dietary: string) => Guest[];
  /** Total count of confirmed guests. */
  confirmedCount: number;
  /** Total count of pending guests. */
  pendingCount: number;
  /** Total count of declined guests. */
  declinedCount: number;
  /** Total headcount including confirmed guests and their approved plus-ones. */
  totalHeadcount: number;
  /** Frequency map of dietary tags across all registered guests. */
  dietaryBreakdown: Record<string, number>;
  /** Map of table numbers to the list of seated guests. Unassigned guests map to table 0. */
  tableAllocations: Record<number, Guest[]>;
}

/**
 * Custom React hook for managing guest lists, seating assignments, and RSVP metrics.
 *
 * @param initialGuests Array of initial guests.
 * @param onUpdateGuests Optional callback invoked whenever the guest list is modified.
 * @returns Object providing guest operations and memoized analytics.
 *
 * @example
 * ```tsx
 * const {
 *   guests,
 *   addGuest,
 *   updateGuestStatus,
 *   deleteGuest,
 *   confirmedCount,
 *   totalHeadcount,
 *   dietaryBreakdown,
 *   tableAllocations
 * } = useGuestManager(plan.guests, onUpdateGuests);
 * ```
 */
export function useGuestManager(
  initialGuests: Guest[] = [],
  onUpdateGuests?: (guests: Guest[]) => void
): UseGuestManagerReturn {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);

  // Synchronize internal state if initialGuests prop changes externally
  useEffect(() => {
    setGuests(initialGuests);
  }, [initialGuests]);

  const commitUpdate = useCallback(
    (newGuests: Guest[]) => {
      setGuests(newGuests);
      if (onUpdateGuests) {
        onUpdateGuests(newGuests);
      }
    },
    [onUpdateGuests]
  );

  const addGuest = useCallback(
    (guestInput: Omit<Guest, 'id'> | Guest) => {
      const newGuest: Guest = {
        ...guestInput,
        id: 'id' in guestInput && guestInput.id ? guestInput.id : `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        rsvpStatus: guestInput.rsvpStatus || 'pending',
        dietary: guestInput.dietary || 'Standard',
        plusOnes: typeof guestInput.plusOnes === 'number' && guestInput.plusOnes >= 0 ? guestInput.plusOnes : 0,
        tableNumber: typeof guestInput.tableNumber === 'number' ? guestInput.tableNumber : null,
      };

      const updated = [...guests, newGuest];
      commitUpdate(updated);
    },
    [guests, commitUpdate]
  );

  const updateGuestStatus = useCallback(
    (id: string, status: RSVPStatus) => {
      const updated = guests.map((g) => (g.id === id ? { ...g, rsvpStatus: status } : g));
      commitUpdate(updated);
    },
    [guests, commitUpdate]
  );

  const deleteGuest = useCallback(
    (id: string) => {
      const updated = guests.filter((g) => g.id !== id);
      commitUpdate(updated);
    },
    [guests, commitUpdate]
  );

  const filterByRsvp = useCallback(
    (status: RSVPStatus | 'all'): Guest[] => {
      if (status === 'all') return guests;
      return guests.filter((g) => g.rsvpStatus === status);
    },
    [guests]
  );

  const filterByDietary = useCallback(
    (dietary: string): Guest[] => {
      const query = dietary.toLowerCase().trim();
      return guests.filter((g) => g.dietary.toLowerCase().includes(query));
    },
    [guests]
  );

  // Memoized Derived Statistics
  const confirmedCount = useMemo(
    () => guests.filter((g) => g.rsvpStatus === 'confirmed').length,
    [guests]
  );

  const pendingCount = useMemo(
    () => guests.filter((g) => g.rsvpStatus === 'pending').length,
    [guests]
  );

  const declinedCount = useMemo(
    () => guests.filter((g) => g.rsvpStatus === 'declined').length,
    [guests]
  );

  const totalHeadcount = useMemo(
    () =>
      guests
        .filter((g) => g.rsvpStatus === 'confirmed')
        .reduce((sum, g) => sum + 1 + (g.plusOnes || 0), 0),
    [guests]
  );

  const dietaryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    for (const g of guests) {
      const tag = g.dietary?.trim() || 'Standard';
      breakdown[tag] = (breakdown[tag] || 0) + 1;
    }
    return breakdown;
  }, [guests]);

  const tableAllocations = useMemo(() => {
    const tables: Record<number, Guest[]> = {};
    for (const g of guests) {
      const tableKey = g.tableNumber ?? 0; // 0 denotes unassigned seating
      if (!tables[tableKey]) {
        tables[tableKey] = [];
      }
      tables[tableKey].push(g);
    }
    return tables;
  }, [guests]);

  return {
    guests,
    addGuest,
    updateGuestStatus,
    deleteGuest,
    filterByRsvp,
    filterByDietary,
    confirmedCount,
    pendingCount,
    declinedCount,
    totalHeadcount,
    dietaryBreakdown,
    tableAllocations,
  };
}
