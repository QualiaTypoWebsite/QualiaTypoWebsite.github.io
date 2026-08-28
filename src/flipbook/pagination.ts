/**
 * A magazine opens like a real book: the cover sits alone on the right, then
 * pages pair up as spreads, and a final even page sits alone on the left.
 * `null` means "no page on this side" — rendered as empty board, not a blank
 * page, so the book never looks like it has an extra sheet.
 */
export type Spread = { left: number | null; right: number | null };

/** Spread 0 is the cover alone; spread i pairs pages 2i and 2i+1. */
export function spreadsFor(totalPages: number): Spread[] {
  if (totalPages <= 0) return [];
  const spreads: Spread[] = [{ left: null, right: 1 }];
  for (let page = 2; page <= totalPages; page += 2) {
    spreads.push({
      left: page,
      right: page + 1 <= totalPages ? page + 1 : null,
    });
  }
  return spreads;
}

export function spreadCount(totalPages: number): number {
  if (totalPages <= 0) return 0;
  return 1 + Math.ceil((totalPages - 1) / 2);
}

/** Which spread a given page appears on. Page 1 is the cover, spread 0. */
export function spreadIndexOfPage(page: number, totalPages: number): number {
  const clamped = clampPage(page, totalPages);
  return clamped === 1 ? 0 : Math.floor(clamped / 2);
}

/** The page number a spread should report — the left page if there is one. */
export function leadPageOfSpread(index: number, totalPages: number): number {
  const spreads = spreadsFor(totalPages);
  const spread = spreads[Math.min(Math.max(index, 0), spreads.length - 1)];
  if (!spread) return 1;
  return spread.left ?? spread.right ?? 1;
}

export function clampPage(page: number, totalPages: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.min(Math.max(Math.round(page), 1), Math.max(totalPages, 1));
}

export function clampSpread(index: number, totalPages: number): number {
  return Math.min(Math.max(index, 0), Math.max(spreadCount(totalPages) - 1, 0));
}

/**
 * Pages worth having in the browser cache around the current spread. Keeping
 * this small matters: a volume is ~70 images and eagerly loading all of them
 * would defeat the point of splitting the PDF up.
 */
export function pagesToPreload(
  spreadIndex: number,
  totalPages: number,
  radius = 2,
): number[] {
  const spreads = spreadsFor(totalPages);
  const wanted = new Set<number>();
  for (let i = spreadIndex - radius; i <= spreadIndex + radius; i += 1) {
    const spread = spreads[i];
    if (!spread) continue;
    if (spread.left) wanted.add(spread.left);
    if (spread.right) wanted.add(spread.right);
  }
  return [...wanted].sort((a, b) => a - b);
}

/**
 * On narrow screens a two-page spread makes each page too small to read, so
 * the book collapses to one page per turn. Modelling that as a spread with
 * only a right-hand page lets the turning logic stay identical in both modes.
 */
export function singleSpreadsFor(totalPages: number): Spread[] {
  return Array.from({ length: Math.max(totalPages, 0) }, (_, i) => ({
    left: null,
    right: i + 1,
  }));
}

export type LayoutMode = 'double' | 'single';

export function layoutSpreads(totalPages: number, mode: LayoutMode): Spread[] {
  return mode === 'single' ? singleSpreadsFor(totalPages) : spreadsFor(totalPages);
}

/** Finds the spread holding a page within a given layout. */
export function spreadIndexIn(spreads: Spread[], page: number): number {
  const index = spreads.findIndex((s) => s.left === page || s.right === page);
  return index === -1 ? 0 : index;
}
