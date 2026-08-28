/**
 * How the site decides which language a URL is asking for.
 *
 * Greek is the default and lives at the root; English is prefixed with /en:
 *
 *     /            /library            /read/1        ← Greek
 *     /en          /en/library         /en/read/1     ← English
 *
 * Keeping the language in the path rather than in React state means an English
 * link can be shared and will open in English.
 *
 * These are plain functions with no React in them, so they can be tested
 * directly — see paths.test.ts.
 */
export const LANGUAGES = ['el', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

/** Greek is the default and lives at the root; English is prefixed with /en. */
export const DEFAULT_LANGUAGE: Language = 'el';

/** Which language a URL is asking for. Anything not under /en is Greek. */
export function languageFromPath(pathname: string): Language {
  return /^\/en(\/|$)/.test(pathname) ? 'en' : 'el';
}

/** The language-neutral part of a URL: "/en/library" and "/library" both -> "/library". */
export function stripLanguage(pathname: string): string {
  const stripped = pathname.replace(/^\/en(?=\/|$)/, '');
  return stripped === '' ? '/' : stripped;
}

/** Puts a neutral path into a language. localize("/library", "en") -> "/en/library". */
export function localize(pathname: string, language: Language): string {
  const neutral = stripLanguage(pathname);
  if (language === DEFAULT_LANGUAGE) return neutral;
  return neutral === '/' ? '/en' : `/en${neutral}`;
}

/**
 * The same page in the other language, preserving query and hash so the flag
 * button keeps you where you were (including ?page=12 in the reader).
 */
export function mirrorPath(
  pathname: string,
  target: Language,
  search = '',
  hash = '',
): string {
  return `${localize(pathname, target)}${search}${hash}`;
}

export function otherLanguage(language: Language): Language {
  return language === 'el' ? 'en' : 'el';
}
