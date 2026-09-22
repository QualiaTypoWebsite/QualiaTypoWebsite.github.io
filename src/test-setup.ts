/**
 * Runs before every test file.
 *
 * jsdom (the fake browser the tests run in) implements only part of the real
 * browser API. Each stub below fills in something the app genuinely uses, so
 * the tests exercise the real components rather than special test-only paths.
 */
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

/**
 * jsdom implements neither of these, and both are load-bearing here:
 * matchMedia drives the reduced-motion and single-page-layout hooks, and
 * IntersectionObserver is what framer-motion's whileInView waits on.
 */
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

if (!('IntersectionObserver' in window)) {
  class StubIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: ReadonlyArray<number> = [];
    constructor(private readonly callback: IntersectionObserverCallback) {}
    // Report everything as visible, so revealed sections render their content.
    observe(target: Element) {
      this.callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        this,
      );
    }
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    value: StubIntersectionObserver,
    writable: true,
    configurable: true,
  });
}

// jsdom logs "Not implemented" for scrolling; the app legitimately calls it.
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
Element.prototype.scrollIntoView = vi.fn();

/**
 * jsdom has an <audio> element but no media engine behind it: play() and
 * pause() throw "Not implemented", and currentTime is read-only.
 *
 * These stubs give it just enough of one. play() and pause() fire the real
 * events and move `paused`, which is what the player reads when deciding
 * whether a click means play or pause — so a test can press the button and
 * then assert on what the button says, rather than on some test-only flag.
 * currentTime becomes a plain number so seeking can be checked.
 */
type FakeMedia = HTMLMediaElement & { _paused?: boolean; _time?: number };
Object.defineProperties(window.HTMLMediaElement.prototype, {
  play: {
    configurable: true,
    value(this: FakeMedia) {
      this._paused = false;
      this.dispatchEvent(new Event('play'));
      return Promise.resolve();
    },
  },
  pause: {
    configurable: true,
    value(this: FakeMedia) {
      this._paused = true;
      this.dispatchEvent(new Event('pause'));
    },
  },
  paused: {
    configurable: true,
    get(this: FakeMedia) {
      return this._paused ?? true;
    },
  },
  load: { configurable: true, value: () => undefined },
  currentTime: {
    configurable: true,
    get(this: FakeMedia) {
      return this._time ?? 0;
    },
    set(this: FakeMedia, value: number) {
      this._time = value;
      this.dispatchEvent(new Event('timeupdate'));
    },
  },
});
