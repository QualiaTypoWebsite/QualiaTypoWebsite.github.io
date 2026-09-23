/**
 * What the accessibility panel can be set to, and what that means to the page.
 *
 * No React in this file. It holds the shape of the settings, the rules about
 * what values are allowed, and the translation from a settings object into the
 * attributes that go on <html> — which is the whole mechanism by which the
 * panel changes the site. Everything visual is then a CSS rule in a11y.css
 * keyed off one of those attributes.
 *
 * Keeping it separate means the rules can be tested without rendering
 * anything, the same split as pagination.ts, paths.ts and queue.ts. See
 * settings.test.ts, which doubles as the documentation of how each setting is
 * meant to behave.
 *
 * A note on what this is and is not. These are display preferences, offered as
 * a convenience. They are not what makes the site accessible — the site's own
 * markup and colours are, and those were fixed first. Nothing here should ever
 * be described as making the site conformant.
 */

/**
 * Greyscale, high contrast and negative are one setting rather than three
 * flags, because they are mutually exclusive in practice: greyscale plus
 * negative is a grey, inverted page that is no more readable than either on
 * its own.
 */
export type ContrastMode = 'none' | 'grayscale' | 'high' | 'negative';

export type A11ySettings = {
  /** Multiplies the root font size. 1 is the site's own size. */
  fontScale: number;
  /** Multiplies the cursor. 1 is the system cursor, untouched. */
  cursorScale: number;
  contrast: ContrastMode;
  underlineLinks: boolean;
  dyslexiaFont: boolean;
  /** The letter, word, line and paragraph spacing named in WCAG 1.4.12. */
  textSpacing: boolean;
  /** Dims the page above and below a band that follows the pointer. */
  readingMask: boolean;
  /** Draws a ruler line that follows the pointer. */
  readingGuide: boolean;
};

export const DEFAULT_SETTINGS: A11ySettings = {
  fontScale: 1,
  cursorScale: 1,
  contrast: 'none',
  underlineLinks: false,
  dyslexiaFont: false,
  textSpacing: false,
  readingMask: false,
  readingGuide: false,
};

/**
 * 100% to 160%. Past about 160% the two-column layouts start to fight the
 * text, and a visitor who needs more than that is better served by browser
 * zoom, which scales everything rather than only the type.
 */
export const FONT_SCALE_MIN = 1;
export const FONT_SCALE_MAX = 1.6;
export const FONT_SCALE_STEP = 0.1;

/** 1 leaves the system cursor alone; the other two are the custom SVG ones. */
export const CURSOR_SCALES = [1, 1.5, 2] as const;

/** Rounded to one decimal because 1.1 + 0.1 is not 1.2 in binary floating point. */
function roundScale(value: number): number {
  return Math.round(value * 10) / 10;
}

export function clampFontScale(value: number): number {
  if (!Number.isFinite(value)) return FONT_SCALE_MIN;
  return roundScale(Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, value)));
}

/** One step bigger or smaller, stopping at the ends rather than wrapping. */
export function stepFontScale(value: number, direction: 1 | -1): number {
  return clampFontScale(roundScale(clampFontScale(value) + direction * FONT_SCALE_STEP));
}

/** The next cursor size up or down, stopping at the ends. */
export function stepCursorScale(value: number, direction: 1 | -1): number {
  const index = CURSOR_SCALES.indexOf(value as (typeof CURSOR_SCALES)[number]);
  const from = index === -1 ? 0 : index;
  const next = Math.min(CURSOR_SCALES.length - 1, Math.max(0, from + direction));
  return CURSOR_SCALES[next];
}

/** Whether anything has been changed, which is what the Reset button reads. */
export function isDefault(settings: A11ySettings): boolean {
  return (Object.keys(DEFAULT_SETTINGS) as (keyof A11ySettings)[]).every(
    (key) => settings[key] === DEFAULT_SETTINGS[key],
  );
}

/**
 * What the settings look like once they are on the document.
 *
 * `attributes` go on <html> as data-* attributes and `cssVariables` as inline
 * custom properties. A null value means "remove this", so that a page with
 * nothing switched on carries no accessibility attributes at all and the
 * stylesheet's own rules apply untouched.
 */
export type DocumentState = {
  attributes: Record<string, string | null>;
  cssVariables: Record<string, string | null>;
};

export function documentStateFor(settings: A11ySettings): DocumentState {
  return {
    attributes: {
      /* Greyscale and negative are painted by an overlay; high contrast is a
         token override. All three are the same attribute because only one of
         them can be true at a time. */
      'data-a11y-contrast': settings.contrast === 'none' ? null : settings.contrast,
      'data-a11y-underline': settings.underlineLinks ? 'on' : null,
      'data-a11y-font': settings.dyslexiaFont ? 'dyslexic' : null,
      'data-a11y-spacing': settings.textSpacing ? 'on' : null,
      'data-a11y-cursor': cursorAttribute(settings.cursorScale),
    },
    cssVariables: {
      /* Left off entirely at 1, so the stylesheet's own font-size applies and
         nothing is multiplied by one on every element for no reason. */
      '--a11y-font-scale': settings.fontScale === 1 ? null : String(settings.fontScale),
    },
  };
}

/** The cursor is named rather than numbered, because CSS needs two fixed sizes. */
function cursorAttribute(scale: number): string | null {
  if (scale >= 2) return 'huge';
  if (scale > 1) return 'large';
  return null;
}

/**
 * Reads settings back out of storage.
 *
 * Deliberately forgiving: anything missing, misspelled or of the wrong type
 * falls back to that field's default rather than throwing. Stored settings are
 * a convenience, and a visitor whose stored value has gone stale after an
 * update should get a working site, not a blank page.
 */
export function parseSettings(raw: string | null): A11ySettings {
  if (!raw) return DEFAULT_SETTINGS;

  let stored: unknown;
  try {
    stored = JSON.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
  if (!stored || typeof stored !== 'object') return DEFAULT_SETTINGS;

  const value = stored as Record<string, unknown>;
  const bool = (key: keyof A11ySettings) =>
    typeof value[key] === 'boolean' ? (value[key] as boolean) : (DEFAULT_SETTINGS[key] as boolean);

  const contrast = value.contrast;
  const contrasts: ContrastMode[] = ['none', 'grayscale', 'high', 'negative'];

  return {
    fontScale:
      typeof value.fontScale === 'number' ? clampFontScale(value.fontScale) : DEFAULT_SETTINGS.fontScale,
    cursorScale: CURSOR_SCALES.includes(value.cursorScale as (typeof CURSOR_SCALES)[number])
      ? (value.cursorScale as number)
      : DEFAULT_SETTINGS.cursorScale,
    contrast: contrasts.includes(contrast as ContrastMode)
      ? (contrast as ContrastMode)
      : DEFAULT_SETTINGS.contrast,
    underlineLinks: bool('underlineLinks'),
    dyslexiaFont: bool('dyslexiaFont'),
    textSpacing: bool('textSpacing'),
    readingMask: bool('readingMask'),
    readingGuide: bool('readingGuide'),
  };
}

export function serializeSettings(settings: A11ySettings): string {
  return JSON.stringify(settings);
}
