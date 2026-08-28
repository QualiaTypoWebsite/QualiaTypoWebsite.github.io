/**
 * Entry point — the first code that runs in the browser.
 *
 * index.html loads this file, and this file mounts the React app into the
 * <div id="root"> that index.html provides. Everything you see on the site is
 * built from here downward.
 *
 * BrowserRouter is what gives the site real URLs (/library rather than
 * /#library). That works on GitHub Pages only because vite.config.ts also
 * publishes a 404.html — see the comment there for why.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { recallLanguage } from './i18n/LanguageProvider';
import './styles/global.css';

/**
 * A returning visitor who chose English should land in English, but only from
 * the bare root — deep links and the Greek homepage must stay where they point.
 */
function redirectToRememberedLanguage() {
  if (window.location.pathname !== '/') return;
  if (recallLanguage() === 'en') {
    window.history.replaceState(null, '', `/en${window.location.search}${window.location.hash}`);
  }
}

redirectToRememberedLanguage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
