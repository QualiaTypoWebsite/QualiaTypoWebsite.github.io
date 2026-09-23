/**
 * The glyphs for the accessibility panel.
 *
 * Hand-drawn inline SVG rather than an icon package, for the same reasons as
 * PlayerIcons.tsx and SocialLinks.tsx: a dozen glyphs do not justify a
 * dependency, and inline SVG inherits currentColor, so one CSS rule colours
 * every icon in the panel.
 *
 * All of them are decorative. Each option in the panel carries real text
 * beside its icon, so every glyph here is aria-hidden and a screen reader
 * never meets one.
 */
import type { ReactNode } from 'react';

/** One 24x24 grid for every glyph, so they sit at matching optical weight. */
function Glyph({ children, fill = 'none' }: { children: ReactNode; fill?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill={fill}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/**
 * The launcher's mark: the standard accessibility symbol — a figure with arms
 * and legs out, inside a ring. This is the form people recognise on a
 * government or university site, which is the whole point of using it.
 */
export function AccessibilityIcon({ size = 26 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="10.1" />
      <circle cx="12" cy="6.6" r="1.55" fill="currentColor" stroke="none" />
      {/* Arms out, then the body down and the legs apart. */}
      <path d="M5.9 9.9c3.9 1.1 8.3 1.1 12.2 0" />
      <path d="M12 9.9v4.4" />
      <path d="M12 14.3 9.4 19.3" />
      <path d="m12 14.3 2.6 5" />
    </svg>
  );
}

export const TextBiggerIcon = () => (
  <Glyph>
    <path d="M2.6 18.2 7.4 6.4l4.8 11.8" />
    <path d="M4.2 14.4h6.4" />
    <path d="M17.6 9.6v8" />
    <path d="M13.6 13.6h8" />
  </Glyph>
);

/** Half the circle filled: the usual shorthand for a colour treatment. */
export const GrayscaleIcon = () => (
  <Glyph>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 3.4a8.6 8.6 0 0 0 0 17.2z" fill="currentColor" stroke="none" />
  </Glyph>
);

export const ContrastIcon = () => (
  <Glyph>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 3.4a8.6 8.6 0 0 1 0 17.2z" fill="currentColor" stroke="none" />
    <path d="M12 3.4v17.2" />
  </Glyph>
);

/** A square with its inner half inverted — the negative of itself. */
export const NegativeIcon = () => (
  <Glyph>
    <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="3" fill="currentColor" stroke="none" />
    <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="3" />
    <path d="M12 3.6v16.8" stroke="var(--panel-bg, #fff)" />
    <path d="M7.8 8.2h-.1M7.8 12h-.1M7.8 15.8h-.1" stroke="var(--panel-bg, #fff)" />
  </Glyph>
);

export const UnderlineLinksIcon = () => (
  <Glyph>
    <path d="M10.2 13.8a3.6 3.6 0 0 0 5.1 0l2.6-2.6a3.6 3.6 0 0 0-5.1-5.1l-.9.9" />
    <path d="M13.8 10.2a3.6 3.6 0 0 0-5.1 0l-2.6 2.6a3.6 3.6 0 0 0 5.1 5.1l.9-.9" />
    <path d="M4.4 21.4h15.2" />
  </Glyph>
);

export const CursorIcon = () => (
  <Glyph>
    <path d="M5.4 3.2 19 10.6l-5.9 1.7-2.2 5.8z" />
  </Glyph>
);

/** A page with a clear band across its middle. */
export const ReadingMaskIcon = () => (
  <Glyph>
    <rect x="3.4" y="3.8" width="17.2" height="16.4" rx="2.4" />
    <path d="M3.4 9.8h17.2M3.4 14.2h17.2" />
    <path d="M6.2 12h11.6" strokeWidth="2.6" />
  </Glyph>
);

export const ReadingGuideIcon = () => (
  <Glyph>
    <path d="M3.4 7.2h12M3.4 16.8h9" />
    <path d="M2.6 12h18.8" strokeWidth="2.8" />
  </Glyph>
);

/** A letter set on a baseline — the "readable typeface" shorthand. */
export const DyslexiaFontIcon = () => (
  <Glyph>
    <path d="M6.6 16.6V7.4h4.1a4.6 4.6 0 0 1 0 9.2z" />
    <path d="M15.8 7.4v9.2" />
    <path d="M3.6 20.4h16.8" strokeWidth="2.4" />
  </Glyph>
);

export const TextSpacingIcon = () => (
  <Glyph>
    <path d="M3.4 6.2h17.2M3.4 12h17.2M3.4 17.8h17.2" />
    <path d="m6.4 2.6 2 2-2 2" transform="translate(-3 0)" />
  </Glyph>
);

/* The stepper buttons. Plain arithmetic signs rather than the A- / A+ pair,
   which only makes sense on the text-size row and read as nonsense on the
   pointer-size one. The row's own leading icon says which is which. */
export const MinusIcon = () => (
  <Glyph>
    <path d="M5 12h14" strokeWidth="2.1" />
  </Glyph>
);

export const PlusIcon = () => (
  <Glyph>
    <path d="M12 5v14M5 12h14" strokeWidth="2.1" />
  </Glyph>
);

export const ResetIcon = () => (
  <Glyph>
    <path d="M3.8 12a8.2 8.2 0 1 0 2.5-5.9" />
    <path d="M3.4 4.6v4.2h4.2" />
  </Glyph>
);

export const CloseIcon = () => (
  <Glyph>
    <path d="m6.6 6.6 10.8 10.8M17.4 6.6 6.6 17.4" />
  </Glyph>
);
