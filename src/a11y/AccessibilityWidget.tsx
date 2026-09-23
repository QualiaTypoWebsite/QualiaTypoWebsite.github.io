/**
 * The accessibility button, and the card it opens.
 *
 * Mounted once in the app shell, so it is on every page. It renders three
 * things: the round launcher in the bottom-right corner, the panel it opens,
 * and the reading aids.
 *
 * It sits outside the wrapper that the colour settings filter, so the panel
 * stays in true colour while greyscale or negative contrast is on — see
 * App.tsx and a11y.css.
 *
 * WHY A DISCLOSURE AND NOT A MODAL
 *
 * The panel does not trap focus and does not make the page inert. Every
 * control in it changes the page behind it, and the whole point is to watch
 * what each one does — a modal that hid the page would hide the only thing
 * worth looking at. So: Escape closes it, clicking away closes it, focus moves
 * into it when it opens and back to the launcher when it closes, and the page
 * stays live throughout.
 *
 * WHERE IT SITS IN THE DOM
 *
 * Second, straight after the skip link. A keyboard visitor who needs these
 * controls should reach them on the second Tab of the page, not after the
 * whole of the navigation — and its position on screen is a matter for CSS,
 * which puts it in the corner regardless.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './AccessibilityWidget.module.css';
import { AccessibilityIcon, CloseIcon } from './A11yIcons';
import { A11yPanel } from './A11yPanel';
import { ReadingAids } from './ReadingAids';
import { usePrefersReducedMotion } from '../components/usePrefersReducedMotion';
import { useLang } from '../i18n/LanguageProvider';

export function AccessibilityWidget() {
  const { t } = useLang();
  const reduced = usePrefersReducedMotion();
  const [open, setOpen] = useState(false);

  const panelId = useId();
  const titleId = useId();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  /** Closing always hands focus back, so the keyboard never loses its place. */
  const close = () => {
    setOpen(false);
    launcherRef.current?.focus();
  };

  // Escape closes from anywhere, including from inside the page behind it.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      setOpen(false);
      launcherRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  /* Clicking away closes it, but focus is deliberately *not* pulled back to
     the launcher here: the visitor has just chosen somewhere else to be, and
     yanking focus into the corner would undo that. */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || launcherRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Opening moves focus into the card, so the next Tab is a control in it.
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  return (
    <>
      <ReadingAids />

      <div className={styles.root}>
        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              id={panelId}
              className={styles.panel}
              role="group"
              aria-labelledby={titleId}
              initial={reduced ? false : { opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={styles.head}>
                <h2 className={styles.title} id={titleId}>
                  {t('a11y.panel.title')}
                </h2>
                <button
                  type="button"
                  ref={closeRef}
                  className={styles.close}
                  onClick={close}
                  aria-label={t('a11y.panel.close')}
                >
                  <CloseIcon />
                </button>
              </div>
              <A11yPanel />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          ref={launcherRef}
          className={styles.launcher}
          onClick={() => (open ? close() : setOpen(true))}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={t('a11y.panel.open')}
        >
          <AccessibilityIcon />
        </button>
      </div>
    </>
  );
}
