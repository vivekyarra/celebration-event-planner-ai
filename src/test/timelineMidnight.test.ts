import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { toEventMinutes, useTimelineManager } from '../hooks/useTimelineManager';
import { generateRunOfShow } from '../services/plannerGenerator';
import { TimelineItem } from '../types';

const item = (id: string, time: string): TimelineItem => ({
  id,
  time,
  phase: 'entertainment',
  title: id,
  description: '',
  leadCoordinator: 'Host',
  isCompleted: false,
});

describe('Run-of-show across midnight', () => {
  it('places early-morning milestones after an evening start', () => {
    const anchor = 19 * 60;
    expect(toEventMinutes('11:30 PM', anchor)).toBe(23 * 60 + 30);
    expect(toEventMinutes('1:00 AM', anchor)).toBe(25 * 60);
    expect(toEventMinutes('6:30 PM', anchor)).toBe(18 * 60 + 30);
  });

  it('keeps daytime events on a normal clock', () => {
    expect(toEventMinutes('1:00 AM', 9 * 60)).toBe(60);
    expect(toEventMinutes('bad', 19 * 60)).toBe(-1);
  });

  it('does not warn for a late-night party ending after midnight', () => {
    const items = [item('Doors', '7:00 PM'), item('Dance', '11:30 PM'), item('Farewell', '1:00 AM')];
    const { result } = renderHook(() => useTimelineManager(items));
    expect(result.current.isSequenced).toBe(true);
  });

  it('still flags a genuinely out-of-order milestone', () => {
    const items = [item('Doors', '7:00 PM'), item('Dinner', '9:00 PM'), item('Toast', '8:00 PM')];
    const { result } = renderHook(() => useTimelineManager(items));
    expect(result.current.validateSequencing().outOfOrderIndices).toEqual([2]);
  });

  it('sorts post-midnight milestones after the evening ones', () => {
    const items = [item('Doors', '7:00 PM'), item('Farewell', '1:00 AM'), item('Dance', '11:30 PM')];
    const { result } = renderHook(() => useTimelineManager(items));
    act(() => result.current.sortChronologically());
    expect(result.current.timeline.map((t) => t.title)).toEqual(['Doors', 'Dance', 'Farewell']);
  });

  it('generated evening plans are sequenced without false warnings', () => {
    for (const type of ['birthday', 'wedding', 'corporate', 'festive_gala'] as const) {
      const items = generateRunOfShow(type, '19:00');
      const { result } = renderHook(() => useTimelineManager(items));
      expect(result.current.sequencingWarnings).toEqual([]);
    }
  });
});
