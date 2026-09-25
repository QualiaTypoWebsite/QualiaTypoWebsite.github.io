/**
 * Draws a translated string that may contain **bold** phrases.
 *
 * The parsing is in src/i18n/emphasis.ts; this only turns its pieces into
 * elements. It renders inline content with no wrapper, so the caller keeps
 * its own <p>: <p><RichText text={t('home.intro')} /></p>.
 *
 * Bold is a <b>, not a <strong>. <strong> tells assistive technology the
 * words are *important*; these are names and titles — "Qualia Typo #1",
 * «Πού είναι η τέχνη;» — made to stand out for the eye, which is what HTML
 * defines <b> for. Screen readers read both the same by default, so the
 * choice is about saying the right thing, not about how it sounds.
 *
 * Only the homepage prose goes through this. Anywhere else a ** would be
 * shown as typed — including page titles and aria-labels, where bold could
 * not be shown anyway.
 */
import { Fragment } from 'react';
import styles from './RichText.module.css';
import { splitEmphasis } from '../i18n/emphasis';

export function RichText({ text }: { text: string }) {
  return (
    <>
      {splitEmphasis(text).map((segment, i) =>
        segment.bold ? (
          <b key={i} className={styles.bold}>{segment.text}</b>
        ) : (
          // A keyed Fragment, not a <span>: plain text needs no element of
          // its own, only a key so React can tell the pieces apart.
          <Fragment key={i}>{segment.text}</Fragment>
        ),
      )}
    </>
  );
}
