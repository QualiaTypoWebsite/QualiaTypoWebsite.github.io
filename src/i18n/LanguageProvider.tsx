/**
 * Makes the current language available to every component.
 *
 * Wraps the whole app (see App.tsx) and provides:
 *
 *   t('nav.home')        a translated string
 *   tList('about.body')  a translated list of paragraphs
 *   to('/library')       that path in the current language
 *   mirror               the current page in the *other* language
 *
 * The language is read from the URL, never stored in React state, so the URL
 * is always the truth. localStorage only remembers the preference for the next
 * visit; it never overrides where a link points.
 */
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import el from './el.json';
import en from './en.json';
import { languageFromPath, localize, mirrorPath, otherLanguage, type Language } from './paths';
import { translate, translateList, type Dict } from './translate';

const DICTS: Record<Language, Dict> = { el: el as Dict, en: en as Dict };

const STORAGE_KEY = 'qualia-typo:language';

type LanguageContextValue = {
  language: Language;
  other: Language;
  t: (key: string, vars?: Record<string, string | number>) => string;
  tList: (key: string) => string[];
  /** Turns a language-neutral path into one for the current language. */
  to: (path: string) => string;
  /** The current page in the other language, query and hash preserved. */
  mirror: string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

/** Remembering the choice is a convenience, so a blocked store is not an error. */
export function rememberLanguage(language: Language): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    /* private mode, or site data blocked — ignore */
  }
}

export function recallLanguage(): Language | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'el' || stored === 'en' ? stored : null;
  } catch {
    return null;
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const language = languageFromPath(location.pathname);

  useEffect(() => {
    document.documentElement.lang = language;
    rememberLanguage(language);
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    const dict = DICTS[language];
    return {
      language,
      other: otherLanguage(language),
      t: (key, vars) => translate(dict, key, vars),
      tList: (key) => translateList(dict, key),
      to: (path) => localize(path, language),
      mirror: mirrorPath(location.pathname, otherLanguage(language), location.search, location.hash),
    };
  }, [language, location.pathname, location.search, location.hash]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside a LanguageProvider');
  return ctx;
}
