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
