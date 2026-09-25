/**
 * Keeps the homepage, the library and the audio library colourless.
 *
 * The owner asked for these three pages to carry no colour of their own, so
 * that the magazine covers are the only colour on them. The colours were not
 * deleted: the library rows and audio sections still set --accent to their
 * volume's colour (App.test.tsx checks that), and the --vol-N and pastel
 * tokens still exist in global.css. What must not come back by accident is a
 * rule on these pages that *paints* with one of them.
 *
 * jsdom does not render CSS, so this reads the three stylesheets as text, the
 * way recordings.test.ts reads file-order.txt. If a colour on one of these
 * pages is ever wanted on purpose, that is a decision to make with the owner;
 * then remove the file from this list and update CLAUDE.md.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const COLOURLESS = [
  'src/routes/Home.module.css',
  'src/routes/Library.module.css',
  'src/routes/AudioLibrary.module.css',
];

/** Any var() that resolves to a volume colour or one of its pastel tints.
 *  --butter is left out on purpose: it is the striped "coming soon" tile,
 *  which is not a volume's colour and is only shown for an unpublished one. */
const VOLUME_COLOUR = /var\(--(accent|accent-ink|vol-\d+|blush|periwinkle|celadon)\)/g;

/** The rule text only. The comments explain the old tints and name these
 *  tokens freely, which must not count as using them. */
function rulesOf(file: string): string {
  return readFileSync(path.resolve(file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
}

describe('the colourless pages', () => {
  it.each(COLOURLESS)('%s paints nothing with a volume colour', (file) => {
    expect(rulesOf(file).match(VOLUME_COLOUR)).toBeNull();
  });
});
