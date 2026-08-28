/**
 * Everything the contact form needs to turn what you typed into an email.
 *
 * No React here, and nothing is sent anywhere: buildMailto() produces a
 * mailto: URL, and the form hands that to the visitor's own email program.
 *
 * Kept separate from the component so it can be tested directly — the
 * encoding rules below are fiddly and easy to get subtly wrong. See
 * mailto.test.ts.
 */
export const CONTACT_EMAIL = 'qualiatypowebsite@gmail.com';

export type ContactFields = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type FieldErrors = Partial<Record<'name' | 'email' | 'message', true>>;

/** Deliberately loose: the goal is to catch typos, not to police addresses. */
export function isPlausibleEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validate(fields: ContactFields): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.name.trim()) errors.name = true;
  if (!isPlausibleEmail(fields.email)) errors.email = true;
  if (!fields.message.trim()) errors.message = true;
  return errors;
}

/**
 * Builds the mailto: URL the form hands to the visitor's mail client.
 * Everything is percent-encoded — Greek text, newlines and ampersands in the
 * body would otherwise truncate the message or break the query string.
 */
export function buildMailto(fields: ContactFields, to = CONTACT_EMAIL): string {
  const subject = fields.subject.trim() || `Qualia Typo — ${fields.name.trim()}`;
  const body = `${fields.message.trim()}\n\n— ${fields.name.trim()} <${fields.email.trim()}>`;
  const query = new URLSearchParams({ subject, body });
  // URLSearchParams encodes spaces as "+", which mail clients show literally.
  return `mailto:${to}?${query.toString().replace(/\+/g, '%20')}`;
}
