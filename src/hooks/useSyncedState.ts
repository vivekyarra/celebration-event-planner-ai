/**
 * Local state that is re-seeded whenever its source prop changes.
 *
 * Implements React's "adjust state when a prop changes" pattern: the previous
 * source is tracked in state and compared during render, so the reset happens
 * in the same render pass instead of a cascading effect-driven re-render.
 *
 * Arrays are compared shallowly (same length, identical elements), so callers
 * passing a fresh-but-equivalent array literal (e.g. `[]`) on every render do
 * not trigger an endless reset loop.
 *
 * @module hooks/useSyncedState
 */

import { useState, type Dispatch, type SetStateAction } from 'react';

function isSameSource<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => Object.is(item, b[i]));
  }
  return false;
}

export function useSyncedState<T>(source: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(source);
  const [prevSource, setPrevSource] = useState<T>(source);

  if (!isSameSource(source, prevSource)) {
    setPrevSource(source);
    setValue(source);
  }

  return [value, setValue];
}
