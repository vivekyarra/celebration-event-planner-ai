import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGuestManager } from '../hooks/useGuestManager';
import { useTimelineManager, parseTimeToMinutes } from '../hooks/useTimelineManager';
import { Guest, TimelineItem } from '../types';

describe('Separation of Concerns Hooks Test Suite', () => {
  describe('useGuestManager', () => {
    const sampleGuests: Guest[] = [
      {
        id: 'g-1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        dietary: 'Vegetarian',
        tableNumber: 1,
        rsvpStatus: 'confirmed',
        plusOnes: 1,
      },
      {
        id: 'g-2',
        name: 'Bob Smith',
        email: 'bob@example.com',
        dietary: 'Gluten-Free',
        tableNumber: 1,
        rsvpStatus: 'pending',
        plusOnes: 0,
      },
      {
        id: 'g-3',
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        dietary: 'Vegetarian',
        tableNumber: 2,
        rsvpStatus: 'declined',
        plusOnes: 0,
      },
      {
        id: 'g-4',
        name: 'Diana Prince',
        email: 'diana@example.com',
        dietary: 'Vegan',
        tableNumber: null,
        rsvpStatus: 'confirmed',
        plusOnes: 2,
      },
    ];

    it('calculates derived metrics accurately', () => {
      const { result } = renderHook(() => useGuestManager(sampleGuests));

      expect(result.current.confirmedCount).toBe(2);
      expect(result.current.pendingCount).toBe(1);
      expect(result.current.declinedCount).toBe(1);
      // Confirmed headcount: Alice (1 + 1) + Diana (1 + 2) = 5
      expect(result.current.totalHeadcount).toBe(5);

      expect(result.current.dietaryBreakdown).toEqual({
        Vegetarian: 2,
        'Gluten-Free': 1,
        Vegan: 1,
      });

      // Table 1 has Alice and Bob
      expect(result.current.tableAllocations[1]).toHaveLength(2);
      // Table 2 has Charlie
      expect(result.current.tableAllocations[2]).toHaveLength(1);
      // Table 0 (unassigned) has Diana
      expect(result.current.tableAllocations[0]).toHaveLength(1);
    });

    it('adds a new guest record and notifies callback', () => {
      const onUpdate = vi.fn();
      const { result } = renderHook(() => useGuestManager(sampleGuests, onUpdate));

      act(() => {
        result.current.addGuest({
          name: 'Evan Wright',
          email: 'evan@example.com',
          dietary: 'Standard',
          rsvpStatus: 'confirmed',
          plusOnes: 0,
          tableNumber: 2,
        });
      });

      expect(result.current.guests).toHaveLength(5);
      expect(result.current.confirmedCount).toBe(3);
      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate.mock.calls[0][0]).toHaveLength(5);
    });

    it('updates guest RSVP status and re-computes headcount', () => {
      const onUpdate = vi.fn();
      const { result } = renderHook(() => useGuestManager(sampleGuests, onUpdate));

      act(() => {
        // Change Bob from pending to confirmed (adds 1 to headcount)
        result.current.updateGuestStatus('g-2', 'confirmed');
      });

      expect(result.current.confirmedCount).toBe(3);
      expect(result.current.pendingCount).toBe(0);
      expect(result.current.totalHeadcount).toBe(6);
      expect(onUpdate).toHaveBeenCalled();
    });

    it('deletes a guest record properly', () => {
      const onUpdate = vi.fn();
      const { result } = renderHook(() => useGuestManager(sampleGuests, onUpdate));

      act(() => {
        result.current.deleteGuest('g-1');
      });

      expect(result.current.guests).toHaveLength(3);
      expect(result.current.guests.find((g) => g.id === 'g-1')).toBeUndefined();
      expect(onUpdate).toHaveBeenCalled();
    });

    it('filters guests by RSVP status and dietary tags', () => {
      const { result } = renderHook(() => useGuestManager(sampleGuests));

      const confirmedOnly = result.current.filterByRsvp('confirmed');
      expect(confirmedOnly).toHaveLength(2);

      const all = result.current.filterByRsvp('all');
      expect(all).toHaveLength(4);

      const vegOnly = result.current.filterByDietary('vegetarian');
      expect(vegOnly).toHaveLength(2);
    });
  });

  describe('useTimelineManager', () => {
    const sampleTimeline: TimelineItem[] = [
      {
        id: 't-1',
        time: '4:00 PM',
        phase: 'setup',
        title: 'Vendor Load-in',
        description: 'Audio check',
        leadCoordinator: 'Stage Mgr',
        isCompleted: true,
      },
      {
        id: 't-2',
        time: '5:30 PM',
        phase: 'arrival',
        title: 'Guest Reception',
        description: 'Cocktails',
        leadCoordinator: 'Host',
        isCompleted: false,
      },
      {
        id: 't-3',
        time: '7:00 PM',
        phase: 'ceremony',
        title: 'Keynote & Toast',
        description: 'Speeches',
        leadCoordinator: 'MC',
        isCompleted: false,
      },
    ];

    it('parses time strings to minutes accurately', () => {
      expect(parseTimeToMinutes('12:00 AM')).toBe(0);
      expect(parseTimeToMinutes('01:30 AM')).toBe(90);
      expect(parseTimeToMinutes('12:00 PM')).toBe(720);
      expect(parseTimeToMinutes('04:00 PM')).toBe(960);
      expect(parseTimeToMinutes('11:59 PM')).toBe(1439);
      expect(parseTimeToMinutes('invalid')).toBe(-1);
    });

    it('validates chronological sequencing correctly', () => {
      const { result } = renderHook(() => useTimelineManager(sampleTimeline));
      expect(result.current.isSequenced).toBe(true);
      expect(result.current.sequencingWarnings).toHaveLength(0);

      // Add milestone with out-of-order time (e.g. 3:00 PM after 7:00 PM)
      act(() => {
        result.current.addMilestone({
          time: '3:00 PM',
          phase: 'setup',
          title: 'Late Setup Surprise',
          description: '',
          leadCoordinator: 'Tech',
          isCompleted: false,
        });
      });

      expect(result.current.isSequenced).toBe(false);
      expect(result.current.sequencingWarnings.length).toBeGreaterThan(0);
    });

    it('sorts out-of-order milestones chronologically', () => {
      const outOfOrder: TimelineItem[] = [
        { ...sampleTimeline[2] }, // 7:00 PM
        { ...sampleTimeline[0] }, // 4:00 PM
        { ...sampleTimeline[1] }, // 5:30 PM
      ];

      const { result } = renderHook(() => useTimelineManager(outOfOrder));
      expect(result.current.isSequenced).toBe(false);

      act(() => {
        result.current.sortChronologically();
      });

      expect(result.current.isSequenced).toBe(true);
      expect(result.current.timeline[0].time).toBe('4:00 PM');
      expect(result.current.timeline[1].time).toBe('5:30 PM');
      expect(result.current.timeline[2].time).toBe('7:00 PM');
    });

    it('reorders and removes milestones as expected', () => {
      const onUpdate = vi.fn();
      const { result } = renderHook(() => useTimelineManager(sampleTimeline, onUpdate));

      // Reorder index 0 to index 2
      act(() => {
        result.current.reorderMilestones(0, 2);
      });

      expect(result.current.timeline[2].id).toBe('t-1');
      expect(onUpdate).toHaveBeenCalled();

      // Remove milestone
      act(() => {
        result.current.removeMilestone('t-2');
      });

      expect(result.current.timeline).toHaveLength(2);
      expect(result.current.timeline.find((t) => t.id === 't-2')).toBeUndefined();
    });

    it('computes completion progress percentage accurately', () => {
      const { result } = renderHook(() => useTimelineManager(sampleTimeline));
      expect(result.current.completedCount).toBe(1);
      expect(result.current.progressPercentage).toBe(33); // 1 / 3 = 33%

      act(() => {
        result.current.toggleComplete('t-2');
      });

      expect(result.current.completedCount).toBe(2);
      expect(result.current.progressPercentage).toBe(67); // 2 / 3 = 67%
    });
  });
});
