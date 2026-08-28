/**
 * The route table and the page shell.
 *
 * Two jobs:
 *
 *  1. Decide which page component to render for the current URL.
 *  2. Wrap whichever page that is in the furniture every page shares — the
 *     top bar, the footer, and the scroll-to-top behaviour.
 *
 * The interesting trick is at the bottom: the list of routes is written once
 * and mounted twice, at "/" and at "/en". So "/library" and "/en/library" both
 * render <Library />, and LanguageProvider works out from the path which
 * language to hand it. Adding a page means adding one <Route> to `pages`, and
 * both languages get it.
 */
import { useEffect } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Footer } from './components/Footer';
import { TopBar } from './components/TopBar';
import { LanguageProvider, useLang } from './i18n/LanguageProvider';
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
      <a className="skip-link" href="#main">
        {t('nav.menu')}
      </a>
      <ScrollToTop />
      <TopBar />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
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
    <Route path="read/:volume" element={<Reader />} />
    <Route path="*" element={<NotFound />} />
  </>
);

export function App() {
  return (
    <LanguageProvider>
      <Routes>
        <Route path="/" element={<Shell />}>
          {pages}
          <Route path="en">{pages}</Route>
        </Route>
      </Routes>
    </LanguageProvider>
  );
}
