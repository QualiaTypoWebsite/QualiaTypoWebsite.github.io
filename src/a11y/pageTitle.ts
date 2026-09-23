/**
 * Which title belongs to which URL.
 *
 * The site is a single page application, so the browser never loads a new
 * document and never changes the <title> by itself. Before this file existed,
 * every one of the five routes was called "Qualia Typo" — which passes WCAG
 * 2.4.2 Page Titled by the letter, since a title does exist, but tells a
 * visitor nothing. Someone with a dozen tabs open, or someone listening to a
 * screen reader read the tab list, learns only that all of them are this site.
 *
 * Pure functions with no React in them, so they can be tested directly — the
 * same split as paths.ts and pagination.ts. What actually writes the title,
 * and announces the change out loud, is PageAnnouncer.tsx.
 */
import { stripLanguage } from '../i18n/paths';

/** A key into the `titles` block of el.json / en.json, plus its placeholders. */
export type PageTitle = {
  key: string;
  vars?: Record<string, string | number>;
};

/**
 * The title for a URL, in whichever language that URL is in — the language
 * prefix is stripped first, so "/library" and "/en/library" resolve to the
 * same key and the caller's own dictionary decides the words.
 *
 * Anything unrecognised is the 404 page, which mirrors the route table in
 * App.tsx: its last route is `path="*"`, so there is no such thing as a URL
 * that renders nothing.
 */
export function pageTitleFor(pathname: string): PageTitle {
  const path = stripLanguage(pathname);

  if (path === '/') return { key: 'titles.home' };
  if (path === '/library') return { key: 'titles.library' };
  if (path === '/audio') return { key: 'titles.audio' };

  // The reader carries its volume in the title, because "Volume 2" is the only
  // part a visitor with several tabs open can actually tell apart.
  const reader = /^\/read\/([^/]+)$/.exec(path);
  if (reader) return { key: 'titles.reader', vars: { n: reader[1] } };

  return { key: 'titles.notFound' };
}
