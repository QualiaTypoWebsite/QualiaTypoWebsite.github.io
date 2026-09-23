/**
 * The rules behind the accessibility panel.
 *
 * These read as documentation of how each setting is meant to behave: where
 * the font scale stops, why the three contrast modes are one field, and what
 * happens to a stored value that has gone stale.
 */
import { describe, expect, it } from 'vitest';
import {
  clampFontScale,
  CURSOR_SCALES,
  DEFAULT_SETTINGS,
  documentStateFor,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  isDefault,
  parseSettings,
  serializeSettings,
  stepCursorScale,
  stepFontScale,
  type A11ySettings,
} from './settings';

/** A settings object with one field changed. */
const withSetting = (patch: Partial<A11ySettings>): A11ySettings => ({
  ...DEFAULT_SETTINGS,
  ...patch,
});

describe('the font scale', () => {
  it('stops at both ends rather than running away', () => {
    expect(stepFontScale(FONT_SCALE_MAX, 1)).toBe(FONT_SCALE_MAX);
    expect(stepFontScale(FONT_SCALE_MIN, -1)).toBe(FONT_SCALE_MIN);
  });

  it('steps in tenths, without floating point dust', () => {
    // 1.1 + 0.1 is 1.2000000000000002 in binary floating point, and that would
    // end up in the DOM as the value of a custom property.
    expect(stepFontScale(1.1, 1)).toBe(1.2);
    expect(stepFontScale(1.2, 1)).toBe(1.3);
    expect(stepFontScale(1.3, -1)).toBe(1.2);
  });

  it('clamps anything out of range, including nonsense', () => {
    expect(clampFontScale(9)).toBe(FONT_SCALE_MAX);
    expect(clampFontScale(0)).toBe(FONT_SCALE_MIN);
    expect(clampFontScale(Number.NaN)).toBe(FONT_SCALE_MIN);
    expect(clampFontScale(Number.POSITIVE_INFINITY)).toBe(FONT_SCALE_MIN);
  });
});

describe('the cursor scale', () => {
  it('moves between the three fixed sizes and stops', () => {
    expect(stepCursorScale(1, 1)).toBe(1.5);
    expect(stepCursorScale(1.5, 1)).toBe(2);
    expect(stepCursorScale(2, 1)).toBe(2);
    expect(stepCursorScale(1, -1)).toBe(1);
  });

  it('recovers from a value that is not one of the sizes', () => {
    expect(CURSOR_SCALES).not.toContain(1.3);
    expect(stepCursorScale(1.3, 1)).toBe(1.5);
  });
});

describe('what goes on to <html>', () => {
  it('puts nothing on the document when nothing is switched on', () => {
    const { attributes, cssVariables } = documentStateFor(DEFAULT_SETTINGS);
    // Every value null means every attribute is removed, so an untouched page
    // carries no accessibility markup at all.
    expect(Object.values(attributes).every((v) => v === null)).toBe(true);
    expect(cssVariables['--a11y-font-scale']).toBeNull();
  });

  it('names the contrast mode in one attribute, never two', () => {
    expect(documentStateFor(withSetting({ contrast: 'grayscale' })).attributes['data-a11y-contrast'])
      .toBe('grayscale');
    expect(documentStateFor(withSetting({ contrast: 'negative' })).attributes['data-a11y-contrast'])
      .toBe('negative');
    expect(documentStateFor(withSetting({ contrast: 'high' })).attributes['data-a11y-contrast'])
      .toBe('high');
  });

  it('carries the font scale only once it differs from the site\'s own size', () => {
    expect(documentStateFor(withSetting({ fontScale: 1 })).cssVariables['--a11y-font-scale'])
      .toBeNull();
    expect(documentStateFor(withSetting({ fontScale: 1.3 })).cssVariables['--a11y-font-scale'])
      .toBe('1.3');
  });

  it('names the two custom cursor sizes, and leaves the system one alone', () => {
    expect(documentStateFor(withSetting({ cursorScale: 1 })).attributes['data-a11y-cursor'])
      .toBeNull();
    expect(documentStateFor(withSetting({ cursorScale: 1.5 })).attributes['data-a11y-cursor'])
      .toBe('large');
    expect(documentStateFor(withSetting({ cursorScale: 2 })).attributes['data-a11y-cursor'])
      .toBe('huge');
  });

  it('flags the remaining switches', () => {
    const on = documentStateFor(
      withSetting({ underlineLinks: true, dyslexiaFont: true, textSpacing: true }),
    ).attributes;
    expect(on['data-a11y-underline']).toBe('on');
    expect(on['data-a11y-font']).toBe('dyslexic');
    expect(on['data-a11y-spacing']).toBe('on');
  });

  it('leaves the reading aids out, because they are drawn rather than styled', () => {
    const { attributes } = documentStateFor(
      withSetting({ readingMask: true, readingGuide: true }),
    );
    expect(Object.values(attributes).every((v) => v === null)).toBe(true);
  });
});

describe('isDefault', () => {
  it('is true only when nothing at all has been changed', () => {
    expect(isDefault(DEFAULT_SETTINGS)).toBe(true);
    expect(isDefault(withSetting({ fontScale: 1.1 }))).toBe(false);
    expect(isDefault(withSetting({ readingGuide: true }))).toBe(false);
    expect(isDefault(withSetting({ contrast: 'high' }))).toBe(false);
  });
});

describe('reading settings back out of storage', () => {
  it('round-trips everything it wrote', () => {
    const settings = withSetting({
      fontScale: 1.4,
      cursorScale: 2,
      contrast: 'negative',
      underlineLinks: true,
      readingMask: true,
    });
    expect(parseSettings(serializeSettings(settings))).toEqual(settings);
  });

  it('falls back to the defaults for anything missing or empty', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('{}')).toEqual(DEFAULT_SETTINGS);
  });

  it('survives storage that is not even JSON', () => {
    // Another script on the domain, or a half-written value — either way the
    // visitor should get a working site rather than a crash.
    expect(parseSettings('not json at all')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('"a string"')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('null')).toEqual(DEFAULT_SETTINGS);
  });

  it('rejects values of the wrong type, field by field', () => {
    const parsed = parseSettings(
      JSON.stringify({ fontScale: 'huge', underlineLinks: 'yes', contrast: 'sepia' }),
    );
    expect(parsed).toEqual(DEFAULT_SETTINGS);
  });

  it('clamps a stored font scale that is out of range', () => {
    // A value saved before the maximum was lowered must not come back as-is.
    expect(parseSettings(JSON.stringify({ fontScale: 4 })).fontScale).toBe(FONT_SCALE_MAX);
  });

  it('keeps the good fields when only one of them is broken', () => {
    const parsed = parseSettings(
      JSON.stringify({ contrast: 'high', cursorScale: 'big', underlineLinks: true }),
    );
    expect(parsed.contrast).toBe('high');
    expect(parsed.underlineLinks).toBe(true);
    expect(parsed.cursorScale).toBe(DEFAULT_SETTINGS.cursorScale);
  });
});
