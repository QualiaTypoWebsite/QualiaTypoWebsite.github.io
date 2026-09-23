/**
 * Keeps <title> truthful, and says out loud when the page has changed.
 *
 * Two jobs, both invisible:
 *
 *  1. Writes document.title for the current route (WCAG 2.4.2 Page Titled).
 *  2. Announces the new page through a live region.
 *
 * The second job exists because of how a single page application navigates.
 * Following a link here does not load a document: React swaps the contents of
 * <main> and the browser says nothing. A sighted visitor sees the page change;
 * a screen reader user gets silence, and has to go looking for what happened.
 * A polite live region closes that gap by reading the new page's name.
 *
 * Two details that are easy to get wrong, and are the reason this is a
 * component rather than three lines in App.tsx:
 *
 *  · The region is mounted for the whole life of the app and starts empty.
 *    A live region that appears at the same moment it gains text is usually
 *    not announced at all — assistive technology has to be watching it before
 *    the change happens.
 *
 *  · The first page is deliberately not announced. Arriving on a page is
 *    already narrated by the browser reading its title; announcing it again
 *    would make every visit start by saying the same thing twice.
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { pageTitleFor } from './pageTitle';
import { useLang } from '../i18n/LanguageProvider';

export function PageAnnouncer() {
  const { t, language } = useLang();
  const { pathname } = useLocation();
  const [announcement, setAnnouncement] = useState('');
  /* Whether a navigation has happened yet. The first render is the initial
     page load, which the browser already narrates from the title. */
  const navigated = useRef(false);

  const { key, vars } = pageTitleFor(pathname);
  const title = t(key, vars);

  useEffect(() => {
    document.title = title;

    if (!navigated.current) {
      navigated.current = true;
      return;
    }
    setAnnouncement(t('a11y.pageChanged', { title }));
    // `language` is a dependency because switching language re-titles the page
    // without the path changing in any other way.
  }, [title, t, language]);

  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {announcement}
    </div>
  );
}
