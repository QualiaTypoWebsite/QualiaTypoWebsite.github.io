/**
 * Where to find the Qualia Art Youth Group, and in what colour.
 *
 * Kept as data rather than as markup inside the footer so that changing a
 * handle — or adding a fifth network — is a one-line edit here, with no
 * component to touch. SocialLinks.tsx renders whatever this list contains.
 *
 * Each entry borrows one volume's cover colour. The buttons are the only
 * place in the site chrome where the cover palette appears, now that the
 * footer's volume dots have made way for them; SocialLinks.module.css tints
 * them well back into the paper so four coloured circles never shout.
 *
 * ⚠ The Facebook, Instagram and Linktree URLs below are PLACEHOLDERS and lead
 * nowhere. Replace them with the group's real profiles — see README.md,
 * "The social links".
 */
export const CONTACT_EMAIL = 'qualiatypowebsite@gmail.com';

/** Matches the icon keys in SocialLinks.tsx and the labels in the i18n files. */
export type SocialId = 'facebook' | 'instagram' | 'linktree' | 'email';

export type Social = {
  id: SocialId;
  href: string;
  /** A volume's cover colour, used as the button's tint. */
  accent: string;
};

export const SOCIALS: Social[] = [
  { id: 'instagram', href: 'https://www.instagram.com/PLACEHOLDER/', accent: 'var(--vol-1)' },
  { id: 'facebook', href: 'https://www.facebook.com/PLACEHOLDER', accent: 'var(--vol-2)' },
  { id: 'linktree', href: 'https://linktr.ee/PLACEHOLDER', accent: 'var(--vol-3)' },
  { id: 'email', href: `mailto:${CONTACT_EMAIL}`, accent: 'var(--vol-4)' },
];

/** True for the links that leave the site and so need target/rel treatment. */
export function isExternal(social: Social): boolean {
  return !social.href.startsWith('mailto:');
}
