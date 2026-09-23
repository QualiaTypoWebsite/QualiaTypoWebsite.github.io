/**
 * The route table and the page shell.
 *
 * Two jobs:
 *
 *  1. Decide which page component to render for the current URL.
 *  2. Wrap whichever page that is in the furniture every page shares — the
 *     top bar, the footer, and the scroll-to-top behaviour.
 *
 * The audio player sits above the route table rather than inside a page, so a
 * recording keeps playing while the visitor moves around the site.
 *
 * The interesting trick is at the bottom: the list of routes is written once
 * and mounted twice, at "/" and at "/en". So "/library" and "/en/library" both
 * render <Library />, and LanguageProvider works out from the path which
 * language to hand it. Adding a page means adding one <Route> to `pages`, and
 * both languages get it.
 */
import { useEffect } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { A11yProvider } from './a11y/A11yProvider';
import { AccessibilityWidget } from './a11y/AccessibilityWidget';
import { PageAnnouncer } from './a11y/PageAnnouncer';
import { AudioPlayer } from './audio/AudioPlayer';
import { AudioPlayerProvider } from './audio/AudioPlayerProvider';
import { Footer } from './components/Footer';
import { TopBar } from './components/TopBar';
import { LanguageProvider, useLang } from './i18n/LanguageProvider';
import { AudioLibrary } from './routes/AudioLibrary';
import { Home } from './routes/Home';
import { Library } from './routes/Library';
import { NotFound } from './routes/NotFound';
import { Reader } from './routes/Reader';

/** A new page starts at the top, unless the URL asked for a section. */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);
  return null;
}

function Shell() {
  const { t } = useLang();
  return (
    <>
      {/* This used to be labelled t('nav.menu'), so the first thing a keyboard
          visitor met on every page was a link that said "Menu" and went to the
          content. It needs its own words. */}
      <a className="skip-link" href="#main">
        {t('a11y.skipToContent')}
      </a>
      {/* Second in the DOM, straight after the skip link: someone who needs
          these controls should reach them on the second Tab, not after the
          whole navigation. Where it appears on screen is CSS's business. */}
      <AccessibilityWidget />
      <PageAnnouncer />
      <ScrollToTop />

      {/* Everything the greyscale and negative settings recolour lives inside
          this wrapper, and everything position: fixed stays outside it. A
          filter makes its element the containing block for fixed descendants,
          so a filter applied any higher up — on <html>, say — would quietly
          un-fix the audio player and the accessibility button. Nothing in here
          is fixed, so there is nothing to break. The top bar is sticky, not
          fixed, and is unaffected. See src/a11y/a11y.css. */}
      <div className="a11yFilterable">
        <TopBar />
        {/* tabIndex={-1} is what makes the skip link work. Without it the
            browser scrolls to <main> but leaves focus behind in the top bar, so
            the next Tab goes back into the navigation the visitor was trying to
            skip. */}
        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>
        <Footer />
      </div>

      {/* Outside the wrapper because it is fixed, and recoloured by a rule of
          its own in AudioPlayer.module.css so it still matches the page.
          Last in the DOM so it comes last in the tab order; CSS lifts it into
          the bottom-left corner, and it renders nothing until something plays. */}
      <AudioPlayer />
    </>
  );
}

/**
 * Greek lives at the root and English under /en, so the same route table is
 * mounted twice. LanguageProvider reads which one is active from the path.
 */
const pages = (
  <>
    <Route index element={<Home />} />
    <Route path="library" element={<Library />} />
    <Route path="audio" element={<AudioLibrary />} />
    <Route path="read/:volume" element={<Reader />} />
    <Route path="*" element={<NotFound />} />
  </>
);

export function App() {
  return (
    <LanguageProvider>
      {/* Both providers are above the routes for the same reason: a provider
          inside a route is unmounted on navigation, which would stop the
          recording mid-sentence and reset the visitor's display settings
          every time they opened a volume. */}
      <A11yProvider>
        <AudioPlayerProvider>
          <Routes>
            <Route path="/" element={<Shell />}>
              {pages}
              <Route path="en">{pages}</Route>
            </Route>
          </Routes>
        </AudioPlayerProvider>
      </A11yProvider>
    </LanguageProvider>
  );
}
