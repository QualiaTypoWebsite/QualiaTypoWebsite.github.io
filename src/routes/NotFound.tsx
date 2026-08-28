/**
 * The 404 page, shown for any URL that matches no route.
 *
 * On GitHub Pages it is also what a visitor briefly hits for a deep link,
 * because the server has no route table — see the 404.html plugin in
 * vite.config.ts.
 */
import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LanguageProvider';

export function NotFound() {
  const { t, to } = useLang();
  return (
    <div className="shell" style={{ padding: '7rem 0', textAlign: 'center' }}>
      <p className="eyebrow">404</p>
      <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>{t('notFound.title')}</h1>
      <p style={{ color: 'var(--ink-soft)', marginTop: '0.8rem' }}>{t('notFound.body')}</p>
      <Link to={to('/')} style={{ marginTop: '1.4rem', display: 'inline-block' }}>
        {t('notFound.home')}
      </Link>
    </div>
  );
}
