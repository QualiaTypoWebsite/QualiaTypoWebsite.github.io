/**
 * Tests for the flipbook's page maths.
 *
 * Worth reading as documentation: these cases spell out exactly how a magazine
 * is meant to open — the cover alone, then pages paired 2-3, 4-5, and a final
 * even page alone on the left — including the awkward ends, which is where
 * this kind of code usually goes wrong.
 */
import { describe, expect, it } from 'vitest';
import {
  clampPage, clampSpread, leadPageOfSpread, pagesToPreload,
  spreadCount, spreadIndexOfPage, spreadsFor,
  singleSpreadsFor, layoutSpreads, spreadIndexIn,
} from './pagination';

describe('spreadsFor', () => {
  it('puts the cover alone on the right', () => {
    expect(spreadsFor(6)[0]).toEqual({ left: null, right: 1 });
  });

  it('pairs the interior pages', () => {
    expect(spreadsFor(6)).toEqual([
      { left: null, right: 1 },
      { left: 2, right: 3 },
      { left: 4, right: 5 },
      { left: 6, right: null },
    ]);
  });

  it('leaves no empty side when the last page completes a spread', () => {
    // 67 pages: cover, then 33 full spreads ending 66/67.
    const spreads = spreadsFor(67);
    expect(spreads).toHaveLength(34);
    expect(spreads.at(-1)).toEqual({ left: 66, right: 67 });
  });

  it('gives the final even page its own left-hand board', () => {
    expect(spreadsFor(70).at(-1)).toEqual({ left: 70, right: null });
  });

  it('handles a one-page document and an empty one', () => {
    expect(spreadsFor(1)).toEqual([{ left: null, right: 1 }]);
    expect(spreadsFor(0)).toEqual([]);
  });
});

describe('spreadCount', () => {
  it('agrees with spreadsFor for every real volume length', () => {
    for (const total of [1, 2, 3, 60, 67, 70]) {
      expect(spreadCount(total)).toBe(spreadsFor(total).length);
    }
  });
});

describe('spreadIndexOfPage', () => {
  it('maps the cover to the first spread', () => {
    expect(spreadIndexOfPage(1, 67)).toBe(0);
  });

  it('maps both pages of a spread to the same index', () => {
    expect(spreadIndexOfPage(2, 67)).toBe(1);
    expect(spreadIndexOfPage(3, 67)).toBe(1);
    expect(spreadIndexOfPage(66, 67)).toBe(33);
    expect(spreadIndexOfPage(67, 67)).toBe(33);
  });

  it('clamps out-of-range pages instead of returning a missing spread', () => {
    expect(spreadIndexOfPage(999, 67)).toBe(33);
    expect(spreadIndexOfPage(0, 67)).toBe(0);
  });
});

describe('leadPageOfSpread', () => {
  it('reports the cover for spread 0 and the left page thereafter', () => {
    expect(leadPageOfSpread(0, 67)).toBe(1);
    expect(leadPageOfSpread(1, 67)).toBe(2);
    expect(leadPageOfSpread(33, 67)).toBe(66);
  });

  it('round-trips with spreadIndexOfPage', () => {
    for (let page = 1; page <= 70; page += 1) {
      const index = spreadIndexOfPage(page, 70);
      expect(leadPageOfSpread(index, 70)).toBeLessThanOrEqual(page);
    }
  });
});

describe('clamping', () => {
  it('keeps pages in range', () => {
    expect(clampPage(0, 67)).toBe(1);
    expect(clampPage(100, 67)).toBe(67);
    expect(clampPage(Number.NaN, 67)).toBe(1);
    expect(clampPage(12.4, 67)).toBe(12);
  });

  it('keeps spreads in range', () => {
    expect(clampSpread(-3, 67)).toBe(0);
    expect(clampSpread(999, 67)).toBe(33);
  });
});

describe('pagesToPreload', () => {
  it('covers the neighbouring spreads', () => {
    expect(pagesToPreload(1, 67, 1)).toEqual([1, 2, 3, 4, 5]);
  });

  it('does not run past either end', () => {
    expect(pagesToPreload(0, 67, 2)).toEqual([1, 2, 3, 4, 5]);
    expect(pagesToPreload(33, 67, 1)).toEqual([64, 65, 66, 67]);
  });

  it('stays bounded rather than loading the whole volume', () => {
    expect(pagesToPreload(15, 67, 2).length).toBeLessThanOrEqual(10);
  });
});

describe('single-page layout', () => {
  it('gives every page its own spread on the right', () => {
    expect(singleSpreadsFor(3)).toEqual([
      { left: null, right: 1 },
      { left: null, right: 2 },
      { left: null, right: 3 },
    ]);
  });

  it('switches layout by mode', () => {
    expect(layoutSpreads(6, 'single')).toHaveLength(6);
    expect(layoutSpreads(6, 'double')).toHaveLength(4);
  });

  it('locates a page in either layout', () => {
    expect(spreadIndexIn(layoutSpreads(67, 'double'), 45)).toBe(22);
    expect(spreadIndexIn(layoutSpreads(67, 'single'), 45)).toBe(44);
  });

  it('falls back to the first spread for a page that is not present', () => {
    expect(spreadIndexIn(layoutSpreads(10, 'double'), 999)).toBe(0);
  });
});
