/**
 * The list of places in Athens where the printed magazine can be picked up,
 * shown in the homepage's About section.
 *
 * The names come from `about.venues` in the two i18n files, not from a data
 * file like socials.ts, because they are language-dependent: the English file
 * carries a transliteration or translation of each Greek name. Adding a venue
 * means adding it to both files, in the same position.
 *
 * It is a real <ul> rather than one paragraph per venue. A screen reader then
 * announces "list, 20 items" and lets a listener skip past it, instead of
 * reading twenty separate paragraphs. The pin in front of each name used to be
 * a 📍 emoji typed into the text, which a screen reader reads aloud as "round
 * pushpin" before every single name; it is now drawn here, aria-hidden, in the
 * page's ink colour rather than the emoji's saturated red, so the covers stay
 * the only saturated colour on the page.
 */
import styles from './VenueList.module.css';

/** A map pin on the same 24x24 grid, and at the same stroke weight, as the
 *  other hand-drawn icons (see PlayerIcons.tsx). Decorative only. */
function PinIcon() {
  return (
    <svg
      className={styles.pin}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s-6.5-6-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 15 12 21 12 21z" />
      <circle cx="12" cy="9.8" r="2.3" />
    </svg>
  );
}

export function VenueList({ venues }: { venues: string[] }) {
  return (
    // role="list" looks redundant on a <ul>, but Safari's VoiceOver stops
    // treating a list as a list once its bullets are removed with
    // `list-style: none`, and the explicit role puts the semantics back.
    <ul className={styles.list} role="list">
      {venues.map((venue) => (
        <li key={venue} className={styles.item}>
          <PinIcon />
          <span>{venue}</span>
        </li>
      ))}
    </ul>
  );
}
