/**
 * The contents of the accessibility panel.
 *
 * Three groups of controls and a reset. The launcher, the open/closed state
 * and the focus handling all live in AccessibilityWidget.tsx; this file is
 * only what is inside the card.
 *
 * Two patterns are used throughout, and both are deliberate:
 *
 *  · Every switch is a <button aria-pressed>, not a checkbox. A toggle button
 *    is announced as "pressed" / "not pressed", which is what these are — they
 *    act the moment they are pressed rather than waiting to be submitted.
 *
 *  · The three colour treatments are toggle buttons too, rather than radios,
 *    even though only one can be on at a time. A radio group cannot be
 *    emptied once something is chosen, and a visitor who turns greyscale on
 *    must be able to turn it off again by pressing the same button.
 *
 * Every control carries real text next to its icon, so the icons are all
 * decorative and a screen reader never meets one.
 */
import { useId, type ReactNode } from 'react';
import styles from './A11yPanel.module.css';
import { useA11y } from './A11yProvider';
import {
  ContrastIcon,
  CursorIcon,
  DyslexiaFontIcon,
  GrayscaleIcon,
  MinusIcon,
  NegativeIcon,
  PlusIcon,
  ReadingGuideIcon,
  ReadingMaskIcon,
  ResetIcon,
  TextBiggerIcon,
  TextSpacingIcon,
  UnderlineLinksIcon,
} from './A11yIcons';
import { useMediaQuery } from '../components/useMediaQuery';
import { useLang } from '../i18n/LanguageProvider';
import { CURSOR_SCALES, FONT_SCALE_MAX, FONT_SCALE_MIN } from './settings';

/** One on/off control: icon above, label below, pressed state on the button. */
function Toggle({
  icon, label, pressed, onClick, note,
}: {
  icon: ReactNode;
  label: string;
  pressed: boolean;
  onClick: () => void;
  note?: string;
}) {
  return (
    <button
      type="button"
      className={styles.toggle}
      aria-pressed={pressed}
      onClick={onClick}
    >
      <span className={styles.toggleIcon}>{icon}</span>
      <span className={styles.toggleLabel}>{label}</span>
      {note && <span className={styles.toggleNote}>{note}</span>}
    </button>
  );
}

/** A labelled pair of − / + buttons with the current value between them. */
function Stepper({
  label, value, onDown, onUp, downLabel, upLabel, atMin, atMax, icon,
}: {
  label: string;
  value: string;
  onDown: () => void;
  onUp: () => void;
  downLabel: string;
  upLabel: string;
  atMin: boolean;
  atMax: boolean;
  icon: ReactNode;
}) {
  const labelId = useId();

  /* A named group, so the two steppers are told apart: on their own the − and
     + buttons and a bare "100%" give a screen reader no way to know whether it
     is reading the text size or the pointer size. aria-labelledby points at
     the visible label rather than repeating it in an aria-label, so nothing is
     announced twice. */
  return (
    <div className={styles.stepper} role="group" aria-labelledby={labelId}>
      <span className={styles.stepperLabel} id={labelId}>
        <span className={styles.stepperIcon}>{icon}</span>
        {label}
      </span>
      <div className={styles.stepperControls}>
        <button
          type="button"
          className={styles.step}
          onClick={onDown}
          disabled={atMin}
          aria-label={downLabel}
        >
          <MinusIcon />
        </button>
        {/* aria-live so the new value is spoken after a press, rather than the
            visitor having to go and find it. */}
        <span className={styles.stepperValue} aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          className={styles.step}
          onClick={onUp}
          disabled={atMax}
          aria-label={upLabel}
        >
          <PlusIcon />
        </button>
      </div>
    </div>
  );
}

export function A11yPanel() {
  const { t } = useLang();
  const { settings, set, toggle, zoomText, zoomCursor, reset, untouched } = useA11y();
  /* The reading aids follow the pointer, so a touch-only device gets a note
     saying so. Both halves are checked rather than just one: a browser that
     reports neither — some headless and embedded ones do — then says nothing,
     which is better than telling someone with a mouse that they need one. */
  /* Both hooks are called into variables first: written as one && expression,
     the second useMediaQuery would be skipped whenever the first was false,
     and a hook that is sometimes not called breaks React's hook order. */
  const hasCoarsePointer = useMediaQuery('(any-pointer: coarse)');
  const hasFinePointer = useMediaQuery('(any-pointer: fine)');
  const coarseOnly = hasCoarsePointer && !hasFinePointer;

  /** Pressing the active treatment again turns it off. */
  const setContrast = (mode: 'grayscale' | 'high' | 'negative') =>
    set('contrast', settings.contrast === mode ? 'none' : mode);

  const percent = (scale: number) => t('a11y.panel.percent', { value: Math.round(scale * 100) });

  return (
    <div className={styles.body}>
      <Stepper
        icon={<TextBiggerIcon />}
        label={t('a11y.panel.textSize')}
        value={percent(settings.fontScale)}
        onDown={() => zoomText(-1)}
        onUp={() => zoomText(1)}
        downLabel={t('a11y.panel.textSmaller')}
        upLabel={t('a11y.panel.textBigger')}
        atMin={settings.fontScale <= FONT_SCALE_MIN}
        atMax={settings.fontScale >= FONT_SCALE_MAX}
      />

      <Stepper
        icon={<CursorIcon />}
        label={t('a11y.panel.cursorSize')}
        value={percent(settings.cursorScale)}
        onDown={() => zoomCursor(-1)}
        onUp={() => zoomCursor(1)}
        downLabel={t('a11y.panel.cursorSmaller')}
        upLabel={t('a11y.panel.cursorBigger')}
        atMin={settings.cursorScale <= CURSOR_SCALES[0]}
        atMax={settings.cursorScale >= CURSOR_SCALES[CURSOR_SCALES.length - 1]}
      />

      <p className={styles.groupLabel} id="a11y-colours">
        {t('a11y.panel.colours')}
      </p>
      <div className={styles.grid} role="group" aria-labelledby="a11y-colours">
        <Toggle
          icon={<GrayscaleIcon />}
          label={t('a11y.panel.grayscale')}
          pressed={settings.contrast === 'grayscale'}
          onClick={() => setContrast('grayscale')}
        />
        <Toggle
          icon={<ContrastIcon />}
          label={t('a11y.panel.highContrast')}
          pressed={settings.contrast === 'high'}
          onClick={() => setContrast('high')}
        />
        <Toggle
          icon={<NegativeIcon />}
          label={t('a11y.panel.negative')}
          pressed={settings.contrast === 'negative'}
          onClick={() => setContrast('negative')}
        />
      </div>

      <p className={styles.groupLabel} id="a11y-reading">
        {t('a11y.panel.reading')}
      </p>
      <div className={styles.grid} role="group" aria-labelledby="a11y-reading">
        <Toggle
          icon={<UnderlineLinksIcon />}
          label={t('a11y.panel.underlineLinks')}
          pressed={settings.underlineLinks}
          onClick={() => toggle('underlineLinks')}
        />
        <Toggle
          icon={<DyslexiaFontIcon />}
          label={t('a11y.panel.dyslexiaFont')}
          pressed={settings.dyslexiaFont}
          onClick={() => toggle('dyslexiaFont')}
        />
        <Toggle
          icon={<TextSpacingIcon />}
          label={t('a11y.panel.textSpacing')}
          pressed={settings.textSpacing}
          onClick={() => toggle('textSpacing')}
        />
        <Toggle
          icon={<ReadingMaskIcon />}
          label={t('a11y.panel.readingMask')}
          pressed={settings.readingMask}
          onClick={() => toggle('readingMask')}
          note={coarseOnly ? t('a11y.panel.pointerOnly') : undefined}
        />
        <Toggle
          icon={<ReadingGuideIcon />}
          label={t('a11y.panel.readingGuide')}
          pressed={settings.readingGuide}
          onClick={() => toggle('readingGuide')}
          note={coarseOnly ? t('a11y.panel.pointerOnly') : undefined}
        />
      </div>

      <button
        type="button"
        className={styles.reset}
        onClick={reset}
        disabled={untouched}
      >
        <ResetIcon />
        {t('a11y.panel.reset')}
      </button>

      {/* Said plainly, and on purpose: these are preferences, not a promise. */}
      <p className={styles.note}>{t('a11y.panel.note')}</p>
    </div>
  );
}
