/**
 * Tests for the Greek/English URL rules.
 *
 * The cases worth noticing are the ones about "/enquiries" — a path that
 * merely begins with the letters "en" is not English, and getting that wrong
 * would silently switch language on innocent URLs.
 */
import { describe, expect, it } from 'vitest';
import { languageFromPath, localize, mirrorPath, otherLanguage, stripLanguage } from './paths';

describe('languageFromPath', () => {
  it('treats the root and unprefixed paths as Greek', () => {
    expect(languageFromPath('/')).toBe('el');
    expect(languageFromPath('/library')).toBe('el');
    expect(languageFromPath('/read/2')).toBe('el');
  });

  it('detects the /en prefix', () => {
    expect(languageFromPath('/en')).toBe('en');
    expect(languageFromPath('/en/library')).toBe('en');
  });

  it('does not mistake a path that merely starts with the letters en', () => {
    expect(languageFromPath('/enquiries')).toBe('el');
  });
});

describe('stripLanguage', () => {
  it('removes the prefix and keeps a leading slash', () => {
    expect(stripLanguage('/en/library')).toBe('/library');
    expect(stripLanguage('/en')).toBe('/');
    expect(stripLanguage('/library')).toBe('/library');
  });
});

describe('localize', () => {
  it('leaves Greek paths bare', () => {
    expect(localize('/library', 'el')).toBe('/library');
    expect(localize('/en/library', 'el')).toBe('/library');
  });

  it('prefixes English paths', () => {
    expect(localize('/library', 'en')).toBe('/en/library');
    expect(localize('/', 'en')).toBe('/en');
  });

  it('is idempotent', () => {
    expect(localize(localize('/read/1', 'en'), 'en')).toBe('/en/read/1');
  });
});

describe('mirrorPath', () => {
  it('swaps language while preserving query and hash', () => {
    expect(mirrorPath('/read/2', 'en', '?page=12')).toBe('/en/read/2?page=12');
    expect(mirrorPath('/en/', 'el', '', '#contact')).toBe('/#contact');
  });
});

describe('otherLanguage', () => {
  it('flips', () => {
    expect(otherLanguage('el')).toBe('en');
    expect(otherLanguage('en')).toBe('el');
  });
});
