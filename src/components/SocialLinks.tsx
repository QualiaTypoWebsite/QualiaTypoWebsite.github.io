/**
 * The row of round social buttons in the footer.
 *
 * Icon-only, so every link carries an aria-label from the i18n files — the
 * SVGs themselves are aria-hidden and a screen reader never sees them.
 *
 * The icons are hand-drawn paths rather than an icon package: four glyphs do
 * not justify a dependency, and inline SVG inherits `currentColor`, which is
 * what lets each button take its own volume colour from one CSS rule.
 *
 * Where the links point lives in src/data/socials.ts.
 */
import type { CSSProperties, ReactNode } from 'react';
import styles from './SocialLinks.module.css';
import { isExternal, SOCIALS, type SocialId } from '../data/socials';
import { useLang } from '../i18n/LanguageProvider';

/**
 * One 24x24 glyph per network, drawn on the same grid so they sit at matching
 * optical weight. Instagram, Linktree and the envelope are strokes; Facebook's
 * f only reads at this size as a solid.
 */
const ICONS: Record<SocialId, ReactNode> = {
  facebook: (
    <path
      fill="currentColor"
      d="M13.6 21v-8h2.7l.41-3.13H13.6V7.87c0-.9.25-1.52 1.55-1.52h1.66V3.55A22.3 22.3 0 0 0 14.39 3.4c-2.4 0-4.04 1.47-4.04 4.16v2.31H7.63V13h2.72v8z"
    />
  ),
  instagram: (
    <>
      <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="5" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.1" cy="6.9" r="1.15" fill="currentColor" stroke="none" />
    </>
  ),
  linktree: (
    <>
      <path d="M7.4 5.2 12 9.6l4.6-4.4" />
      <path d="M5.4 11.1h13.2" />
      <path d="M12 9.6V19" />
    </>
  ),
  email: (
    <>
      <rect x="3.2" y="5.6" width="17.6" height="12.8" rx="2.2" />
      <path d="m3.9 7 8.1 6.1L20.1 7" />
    </>
  ),
};

export function SocialLinks() {
  const { t } = useLang();

  return (
    <ul className={styles.list}>
      {SOCIALS.map((social) => (
        <li key={social.id}>
          <a
            className={styles.button}
            href={social.href}
            aria-label={t(`social.${social.id}`)}
            // Both the tint and the focus ring come from this one value, so a
            // button's outline matches the colour it is wearing.
            style={{ '--social': social.accent, '--accent': social.accent } as CSSProperties}
            {...(isExternal(social)
              ? { target: '_blank', rel: 'noreferrer noopener' }
              : {})}
          >
            <svg
              viewBox="0 0 24 24"
              width="21"
              height="21"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              {ICONS[social.id]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
