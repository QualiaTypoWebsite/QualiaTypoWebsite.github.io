/**
 * The player's arithmetic, tested without rendering anything.
 *
 * These are the parts most likely to be subtly wrong — walking off the end of
 * a volume, seeking past the end of a file, formatting a duration that has not
 * loaded yet — so they live in queue.ts with no React around them.
 */
import { describe, expect, it } from 'vitest';
import { formatTime, nextIndex, previousIndex, seekTarget } from './queue';

describe('stepping through a volume', () => {
  it('moves forward while there is somewhere to go', () => {
    expect(nextIndex(0, 3)).toBe(1);
    expect(nextIndex(1, 3)).toBe(2);
  });

  it('stops at the last recording rather than wrapping', () => {
    expect(nextIndex(2, 3)).toBeNull();
  });

  it('moves back, and stops at the first recording', () => {
    expect(previousIndex(2)).toBe(1);
    expect(previousIndex(0)).toBeNull();
  });

  it('reports nothing to play in an empty volume', () => {
    expect(nextIndex(0, 0)).toBeNull();
  });
});

describe('seeking', () => {
  it('moves by the offset asked for', () => {
    expect(seekTarget(30, 5, 100)).toBe(35);
    expect(seekTarget(30, -5, 100)).toBe(25);
  });

  it('never goes before the start', () => {
    expect(seekTarget(2, -5, 100)).toBe(0);
  });

  it('never goes past the end', () => {
    expect(seekTarget(98, 5, 100)).toBe(100);
  });

  // A file that has not loaded yet reports NaN or Infinity for its duration.
  it('ignores an unknown duration instead of producing NaN', () => {
    expect(seekTarget(10, 5, Number.NaN)).toBe(15);
    expect(seekTarget(10, 5, Number.POSITIVE_INFINITY)).toBe(15);
  });
});

describe('formatting a duration', () => {
  it('reads as minutes and padded seconds', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(9)).toBe('0:09');
    expect(formatTime(75)).toBe('1:15');
    expect(formatTime(600)).toBe('10:00');
  });

  it('grows an hours field only when it needs one', () => {
    expect(formatTime(3599)).toBe('59:59');
    expect(formatTime(3600)).toBe('1:00:00');
  });

  // Shown before metadata arrives, so it must not read "NaN:aN".
  it('shows zero for a duration it does not know yet', () => {
    expect(formatTime(Number.NaN)).toBe('0:00');
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe('0:00');
    expect(formatTime(-4)).toBe('0:00');
  });
});
