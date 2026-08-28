/**
 * PLACEHOLDER MARK — stands in until the group's real logo exists.
 * Replace this component's contents with the artwork, or swap it for an
 * <img> pointing at the logo file once one is added to /public.
 */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M25.5 25.5 L32 32" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="20" cy="20" r="4.4" fill="var(--vol-1)" />
    </svg>
  );
}
