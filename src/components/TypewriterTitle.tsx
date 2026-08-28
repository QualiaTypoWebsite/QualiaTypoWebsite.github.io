/**
 * The homepage title that types itself: "Qualia Typo", a pause with a blinking
 * cursor, then the full stop drops in.
 *
 * The timing lives in useTypewriter.ts; this file is only the markup and the
 * cursor's appearance.
 *
 * Accessibility note: a screen reader would announce a letter-by-letter
 * animation as gibberish, so the finished title is rendered once in a visually
 * hidden span, and the animated version is hidden from assistive technology.
 */
import styles from './TypewriterTitle.module.css';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { useTypewriter } from './useTypewriter';

const WORD = 'Qualia Typo';
const STOP = '.';

export function TypewriterTitle() {
  const reduced = usePrefersReducedMotion();
  const { text, phase } = useTypewriter({ word: WORD, suffix: STOP, instant: reduced });

  const typedWord = text.startsWith(WORD) ? WORD : text;
  const hasStop = text.endsWith(STOP);

  return (
    <h1 className={styles.title}>
      {/* The finished title is announced once, rather than letter by letter. */}
      <span className="sr-only">{WORD + STOP}</span>
      <span aria-hidden="true">
        {typedWord}
        {hasStop && <span className={styles.stop}>{STOP}</span>}
        {!reduced && phase !== 'done' && (
          <span
            className={`${styles.cursor} ${
              phase === 'holding' ? styles.blinking : phase === 'punctuating' ? styles.fading : ''
            }`}
          />
        )}
      </span>
    </h1>
  );
}
