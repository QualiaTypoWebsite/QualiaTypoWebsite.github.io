/**
 * The Greek and UK flags for the language switcher, drawn as inline SVG.
 *
 * Inline rather than image files so the site ships no extra assets for them,
 * and so they stay sharp at any size.
 */

export function GreekFlag({ title }: { title: string }) {
  return (
    <svg viewBox="0 0 27 18" role="img" aria-label={title} focusable="false">
      <rect width="27" height="18" fill="#fff" />
      {/* Nine stripes, blue first and last. */}
      <g fill="#0d5eaf">
        {[0, 4, 8, 12, 16].map((y) => (
          <rect key={y} y={y} width="27" height="2" />
        ))}
        <rect width="10" height="10" />
      </g>
      <g fill="#fff">
        <rect x="4" width="2" height="10" />
        <rect y="4" width="10" height="2" />
      </g>
    </svg>
  );
}

export function UkFlag({ title }: { title: string }) {
  return (
    <svg viewBox="0 0 60 30" role="img" aria-label={title} focusable="false">
      <clipPath id="uk-diagonals">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#00247d" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path
        d="M0,0 L60,30 M60,0 L0,30"
        clipPath="url(#uk-diagonals)"
        stroke="#cf142b"
        strokeWidth="4"
      />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#cf142b" strokeWidth="6" />
    </svg>
  );
}
