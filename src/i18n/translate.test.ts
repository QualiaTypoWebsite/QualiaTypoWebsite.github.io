/**
 * Tests for translation lookup and {{placeholder}} filling.
 *
 * Note the cases covering a missing key: they pin down the deliberate choice
 * that a missing translation shows the key on screen instead of throwing.
 */
import { describe, expect, it } from 'vitest';
import { interpolate, translate, translateList } from './translate';

const dict = {
  nav: { home: 'Αρχική' },
  library: { pages: '{{count}} σελίδες' },
  about: { body: ['one', 'two'], title: 'About' },
};

describe('translate', () => {
  it('resolves a dotted key', () => {
    expect(translate(dict, 'nav.home')).toBe('Αρχική');
  });

  it('interpolates variables', () => {
    expect(translate(dict, 'library.pages', { count: 67 })).toBe('67 σελίδες');
  });

  it('returns the key when it is missing, rather than throwing', () => {
    expect(translate(dict, 'nav.nope')).toBe('nav.nope');
    expect(translate(dict, 'totally.absent.key')).toBe('totally.absent.key');
  });

  it('returns the key when the value is not a string', () => {
    expect(translate(dict, 'about.body')).toBe('about.body');
  });
});

describe('interpolate', () => {
  it('leaves unknown placeholders untouched', () => {
    expect(interpolate('{{a}} and {{b}}', { a: '1' })).toBe('1 and {{b}}');
  });
});

describe('translateList', () => {
  it('returns paragraph arrays', () => {
    expect(translateList(dict, 'about.body')).toEqual(['one', 'two']);
  });

  it('returns an empty list for a non-array key', () => {
    expect(translateList(dict, 'about.title')).toEqual([]);
  });
});
