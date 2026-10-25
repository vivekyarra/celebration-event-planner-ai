/**
 * CelebriteAI Separation of Concerns Hook: Timeline & Run-of-Show Manager
 * Encapsulates timeline milestone additions, deletions, reordering,
 * completion tracking, and chronological sequencing validation.
 *
 * @module hooks/useTimelineManager
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { TimelineItem, TimelinePhase } from '../types';

export interface TimelineSequencingResult {
  /** True if milestones are chronologically sequenced with no backwards time steps. */
  isSequenced: boolean;
  /** Array of array indices corresponding to milestones that are out of chronological order. */
  outOfOrderIndices: number[];
  /** Explanatory warnings detailing where chronological sequencing was broken. */
  warnings: string[];
}

export interface UseTimelineManagerReturn {
  /** Current list of timeline milestones. */
  timeline: TimelineItem[];
  /** Adds a new milestone to the schedule. */
  addMilestone: (item: Omit<TimelineItem, 'id'> | TimelineItem) => void;
  /** Removes a milestone by its unique ID. */
  removeMilestone: (id: string) => void;
  /** Reorders a milestone from startIndex to endIndex in the array. */
  reorderMilestones: (startIndex: number, endIndex: number) => void;
  /** Toggles completion checkbox for a milestone. */
  toggleComplete: (id: string) => void;
  /** Filters the run of show by specific event phase or returns all. */
  filterByPhase: (phase: TimelinePhase | 'all') => TimelineItem[];
  /** Sorts the milestones chronologically in ascending order. */
  sortChronologically: () => void;
  /** Checks and reports time sequencing validation. */
  validateSequencing: () => TimelineSequencingResult;
  /** Whether the current timeline is in valid chronological sequence. */
  isSequenced: boolean;
  /** Detailed warnings if any milestones are out of order. */
  sequencingWarnings: string[];
  /** Total completed milestones count. */
  completedCount: number;
  /** Completion percentage [0 - 100]. */
  progressPercentage: number;
  /** Milestone counts mapped by phase. */
  phaseCounts: Record<TimelinePhase, number>;
}

/**
 * Parses varied time strings (e.g. "09:00 AM", "18:30", "5:15 PM") into minutes from midnight (0 - 1439).
 *
 * @param timeStr Time string in 12-hour or 24-hour format.
 * @returns Minutes from midnight, or -1 if unparseable.
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return -1;
  const cleaned = timeStr.trim().toUpperCase();

  const match12 = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const modifier = match12[3];

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  return -1;
}

/**
 * Custom React hook for managing master event timelines and run-of-show cues.
 *
 * @param initialTimeline Initial array of timeline items.
 * @param onUpdateTimeline Optional callback fired on any timeline mutation.
 * @returns Object containing timeline operations, sequencing validator, and memoized metrics.
 *
 * @example
 * ```tsx
 * const {
 *   timeline,
 *   addMilestone,
 *   removeMilestone,
 *   reorderMilestones,
 *   isSequenced,
 *   sequencingWarnings,
 *   progressPercentage
 * } = useTimelineManager(plan.timeline, onUpdateTimeline);
 * ```
 */
export function useTimelineManager(
  initialTimeline: TimelineItem[] = [],
  onUpdateTimeline?: (timeline: TimelineItem[]) => void
): UseTimelineManagerReturn {
  const [timeline, setTimeline] = useState<TimelineItem[]>(initialTimeline);

  // Synchronize internal state with external changes
  useEffect(() => {
    setTimeline(initialTimeline);
  }, [initialTimeline]);

  const commitUpdate = useCallback(
    (newTimeline: TimelineItem[]) => {
      setTimeline(newTimeline);
      if (onUpdateTimeline) {
        onUpdateTimeline(newTimeline);
      }
    },
    [onUpdateTimeline]
  );

  const addMilestone = useCallback(
    (itemInput: Omit<TimelineItem, 'id'> | TimelineItem) => {
      const newItem: TimelineItem = {
        ...itemInput,
        id: 'id' in itemInput && itemInput.id ? itemInput.id : `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        isCompleted: Boolean(itemInput.isCompleted),
        leadCoordinator: itemInput.leadCoordinator || 'Event Host',
      };

      const updated = [...timeline, newItem];
      commitUpdate(updated);
    },
    [timeline, commitUpdate]
  );

  const removeMilestone = useCallback(
    (id: string) => {
      const updated = timeline.filter((item) => item.id !== id);
      commitUpdate(updated);
    },
    [timeline, commitUpdate]
  );

  const reorderMilestones = useCallback(
    (startIndex: number, endIndex: number) => {
      if (
        startIndex < 0 ||
        startIndex >= timeline.length ||
        endIndex < 0 ||
        endIndex >= timeline.length
      ) {
        return;
      }
      const reordered = Array.from(timeline);
      const [removed] = reordered.splice(startIndex, 1);
      reordered.splice(endIndex, 0, removed);
      commitUpdate(reordered);
    },
    [timeline, commitUpdate]
  );

  const toggleComplete = useCallback(
    (id: string) => {
      const updated = timeline.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      );
      commitUpdate(updated);
    },
    [timeline, commitUpdate]
  );

  const filterByPhase = useCallback(
    (phase: TimelinePhase | 'all'): TimelineItem[] => {
      if (phase === 'all') return timeline;
      return timeline.filter((item) => item.phase === phase);
    },
    [timeline]
  );

  const sortChronologically = useCallback(() => {
    const sorted = [...timeline].sort((a, b) => {
      const minA = parseTimeToMinutes(a.time);
      const minB = parseTimeToMinutes(b.time);
      if (minA === -1 || minB === -1) return 0;
      return minA - minB;
    });
    commitUpdate(sorted);
  }, [timeline, commitUpdate]);

  const validateSequencing = useCallback((): TimelineSequencingResult => {
    const outOfOrderIndices: number[] = [];
    const warnings: string[] = [];

    let lastMinutes = -1;
    let lastTimeStr = '';

    for (let i = 0; i < timeline.length; i++) {
      const current = timeline[i];
      const currentMinutes = parseTimeToMinutes(current.time);

      if (currentMinutes !== -1) {
        if (lastMinutes !== -1 && currentMinutes < lastMinutes) {
          outOfOrderIndices.push(i);
          warnings.push(
            `Milestone "${current.title}" (${current.time}) is scheduled earlier than previous milestone (${lastTimeStr}).`
          );
        }
        lastMinutes = currentMinutes;
        lastTimeStr = current.time;
      }
    }

    return {
      isSequenced: outOfOrderIndices.length === 0,
      outOfOrderIndices,
      warnings,
    };
  }, [timeline]);

  const sequencingValidation = useMemo(() => validateSequencing(), [validateSequencing]);

  const completedCount = useMemo(
    () => timeline.filter((item) => item.isCompleted).length,
    [timeline]
  );

  const progressPercentage = useMemo(() => {
    if (timeline.length === 0) return 0;
    return Math.round((completedCount / timeline.length) * 100);
  }, [timeline.length, completedCount]);

  const phaseCounts = useMemo(() => {
    const counts: Record<TimelinePhase, number> = {
      setup: 0,
      arrival: 0,
      ceremony: 0,
      dining: 0,
      entertainment: 0,
      winddown: 0,
    };
    for (const item of timeline) {
      if (counts[item.phase] !== undefined) {
        counts[item.phase]++;
      }
    }
    return counts;
  }, [timeline]);

  return {
    timeline,
    addMilestone,
    removeMilestone,
    reorderMilestones,
    toggleComplete,
    filterByPhase,
    sortChronologically,
    validateSequencing,
    isSequenced: sequencingValidation.isSequenced,
    sequencingWarnings: sequencingValidation.warnings,
    completedCount,
    progressPercentage,
    phaseCounts,
  };
}
