/**
 * The player's arithmetic. No React, no audio element — just numbers.
 *
 * Kept apart from the components for the same reason as pagination.ts: this is
 * where the off-by-one and the NaN live, and it is far easier to be sure of
 * them when they can be called directly from a test.
 *
 * The queue is one volume. Walking off either end returns null rather than
 * wrapping around, because rolling from the last recording of volume 1 into
 * volume 2 would be a surprise, not a convenience.
 */

/** The recording after this one, or null at the end of the volume. */
export function nextIndex(index: number, count: number): number | null {
  return index + 1 < count ? index + 1 : null;
}

/** The recording before this one, or null at the start of the volume. */
export function previousIndex(index: number): number | null {
  return index > 0 ? index - 1 : null;
}

/**
 * Where a skip lands, clamped to the file.
 *
 * `duration` is NaN until the browser has read the file's metadata, and can be
 * Infinity for a stream, so it is only used as a ceiling when it is a real
 * number — otherwise the skip is allowed and the browser clamps it for us.
 */
export function seekTarget(current: number, offset: number, duration: number): number {
  const target = Math.max(0, current + offset);
  return Number.isFinite(duration) ? Math.min(target, duration) : target;
}

/**
 * A duration as a person reads it: 1:15, or 1:00:00 once there is an hour of
 * it. Anything not yet known — NaN before metadata loads, or a negative from a
 * seek bar mid-drag — reads as 0:00 rather than "NaN:aN".
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';

  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  const padded = String(secs).padStart(2, '0');

  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${padded}`;
  return `${minutes}:${padded}`;
}
