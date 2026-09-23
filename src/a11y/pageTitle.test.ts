/**
 * Which title belongs to which URL.
 *
 * These read as documentation of the rule: every route has its own title, in
 * either language, and anything unrecognised falls to the 404 title rather
 * than to nothing.
 */
import { describe, expect, it } from 'vitest';
import { pageTitleFor } from './pageTitle';

describe('pageTitleFor', () => {
  it('names each route', () => {
    expect(pageTitleFor('/')).toEqual({ key: 'titles.home' });
    expect(pageTitleFor('/library')).toEqual({ key: 'titles.library' });
    expect(pageTitleFor('/audio')).toEqual({ key: 'titles.audio' });
  });

  it('gives the same title to both languages, since the words come from the dictionary', () => {
    expect(pageTitleFor('/en')).toEqual({ key: 'titles.home' });
    expect(pageTitleFor('/en/library')).toEqual({ key: 'titles.library' });
    expect(pageTitleFor('/en/audio')).toEqual({ key: 'titles.audio' });
  });

  it('carries the volume number into the reader title', () => {
    expect(pageTitleFor('/read/2')).toEqual({ key: 'titles.reader', vars: { n: '2' } });
    expect(pageTitleFor('/en/read/3')).toEqual({ key: 'titles.reader', vars: { n: '3' } });
  });

  it('does not mistake a deeper path for the reader', () => {
    expect(pageTitleFor('/read/2/extra')).toEqual({ key: 'titles.notFound' });
    expect(pageTitleFor('/read')).toEqual({ key: 'titles.notFound' });
  });

  it('falls back to the 404 title, mirroring the catch-all route', () => {
    expect(pageTitleFor('/nowhere')).toEqual({ key: 'titles.notFound' });
    expect(pageTitleFor('/en/nowhere')).toEqual({ key: 'titles.notFound' });
  });

  it('is not confused by a path that merely starts with "en"', () => {
    // "/entries" is Greek, not English — stripLanguage only takes /en as a
    // whole segment, and the title logic inherits that.
    expect(pageTitleFor('/entries')).toEqual({ key: 'titles.notFound' });
  });
});
