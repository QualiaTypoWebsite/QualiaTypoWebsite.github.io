/**
 * The timing behind the homepage title.
 *
 * Runs a small scripted sequence and reports what should currently be on
 * screen:
 *
 *   typing      → letters appearing one at a time
 *   holding     → the word is complete, the cursor blinks
 *   punctuating → the full stop has just landed
 *   done        → finished, cursor gone
 *
 * TypewriterTitle.tsx turns those into markup. The deliberate irregularity in
 * keystrokeDelay() is the whole point — evenly spaced letters read as a
 * machine, and the effect is meant to read as a person at a typewriter.
 */
import { useEffect, useRef, useState } from 'react';

export type TypewriterPhase = 'typing' | 'holding' | 'punctuating' | 'done';

export type TypewriterState = { text: string; phase: TypewriterPhase };

export type TypewriterOptions = {
  /** Typed one character at a time. */
  word: string;
  /** Added after the pause — the full stop that ends the title. */
  suffix?: string;
  /** Base milliseconds between keystrokes, varied per character. */
  speed?: number;
  /** How long the cursor blinks alone before the suffix lands. */
  hold?: number;
  /** Skips the whole performance and renders the finished title. */
  instant?: boolean;
};

/**
 * Human typing is not metronomic. Varying each keystroke a little — and
 * resting slightly longer after a space — is what keeps the title from
 * reading as a CSS steps() animation.
 */
function keystrokeDelay(char: string, speed: number): number {
  const jitter = 0.6 + Math.random() * 0.9;
  const rest = char === ' ' ? 2.1 : 1;
  return Math.round(speed * jitter * rest);
}

export function useTypewriter({
  word,
  suffix = '.',
  speed = 95,
  hold = 2000,
  instant = false,
}: TypewriterOptions): TypewriterState {
  const [state, setState] = useState<TypewriterState>(() =>
    instant ? { text: word + suffix, phase: 'done' } : { text: '', phase: 'typing' },
  );
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (instant) {
      setState({ text: word + suffix, phase: 'done' });
      return;
    }

    setState({ text: '', phase: 'typing' });
    let elapsed = 0;
    const at = (delay: number, fn: () => void) => {
      elapsed += delay;
      timers.current.push(window.setTimeout(fn, elapsed));
    };

    for (const [i, char] of [...word].entries()) {
      at(keystrokeDelay(char, speed), () =>
        setState({ text: word.slice(0, i + 1), phase: 'typing' }),
      );
    }

    at(0, () => setState({ text: word, phase: 'holding' }));
    at(hold, () => setState({ text: word + suffix, phase: 'punctuating' }));
    at(450, () => setState({ text: word + suffix, phase: 'done' }));

    const scheduled = timers.current;
    return () => {
      scheduled.forEach(window.clearTimeout);
      timers.current = [];
    };
  }, [word, suffix, speed, hold, instant]);

  return state;
}
