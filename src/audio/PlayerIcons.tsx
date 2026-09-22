/**
 * The player's glyphs, drawn by hand.
 *
 * Inline SVG rather than an icon package, for the same reasons as the social
 * buttons: seven glyphs do not justify a dependency, and inline paths inherit
 * `currentColor`, so a button changes colour with one CSS rule.
 *
 * They are drawn on one 24x24 grid at matching optical weight — the transport
 * controls solid, the skip arcs stroked with the number of seconds sitting
 * inside them, which is how every player draws that control.
 *
 * Every icon is aria-hidden: the buttons around them carry the labels, so a
 * screen reader hears "Play", not "Play, graphic".
 */
import type { ReactNode } from 'react';

function Glyph({ children, filled = false }: { children: ReactNode; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      focusable="false"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function PlayIcon() {
  return (
    <Glyph filled>
      <path d="M8 5.2 19 12 8 18.8z" />
    </Glyph>
  );
}

export function PauseIcon() {
  return (
    <Glyph filled>
      <rect x="6.6" y="5.2" width="3.9" height="13.6" rx="1.2" />
      <rect x="13.5" y="5.2" width="3.9" height="13.6" rx="1.2" />
    </Glyph>
  );
}

export function PreviousIcon() {
  return (
    <Glyph filled>
      <rect x="5.4" y="5.6" width="2.4" height="12.8" rx="1.1" />
      <path d="M19 5.9v12.2L9.4 12z" />
    </Glyph>
  );
}

export function NextIcon() {
  return (
    <Glyph filled>
      <path d="M5 5.9v12.2L14.6 12z" />
      <rect x="16.2" y="5.6" width="2.4" height="12.8" rx="1.1" />
    </Glyph>
  );
}

/** The seconds live inside the arc, so one component draws both skip buttons. */
function SkipGlyph({ back, seconds }: { back: boolean; seconds: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Mirroring the whole group is what turns rewind into fast-forward. */}
      <g transform={back ? undefined : 'translate(24 0) scale(-1 1)'}>
        {/* An almost-closed circle, open at the top left where the arrow sits. */}
        <path d="M5.1 8.4A8 8 0 1 1 4 12" />
        <path d="M8.6 4.9 4.4 8.6l3.5 3.4" />
      </g>
      <text
        x="12"
        y="15.9"
        textAnchor="middle"
        fontSize="8.6"
        fontWeight="600"
        fill="currentColor"
        stroke="none"
      >
        {seconds}
      </text>
    </svg>
  );
}

export function Back5Icon() {
  return <SkipGlyph back seconds={5} />;
}

export function Forward5Icon() {
  return <SkipGlyph back={false} seconds={5} />;
}

export function CloseIcon() {
  return (
    <Glyph>
      <path d="m7 7 10 10M17 7 7 17" />
    </Glyph>
  );
}

/** Marks the recording the player is on, in the library's track list. */
export function SoundWaveIcon() {
  return (
    <Glyph>
      <path d="M4 10.5v3M8 7.5v9M12 5.5v13M16 8.5v7M20 10.5v3" />
    </Glyph>
  );
}
