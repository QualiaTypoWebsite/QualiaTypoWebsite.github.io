/**
 * Reads the one piece of formatting the i18n files are allowed: **bold**.
 *
 * The copy lives in plain JSON, which cannot hold markup, and putting HTML in
 * it would mean rendering it with dangerouslySetInnerHTML. Instead a phrase to
 * be bolded is wrapped in double asterisks, the way Markdown does it — easy to
 * type, easy to read in the JSON — and this file splits such a string into
 * plain and bold pieces for RichText.tsx to draw.
 *
 * Only bold is supported, on purpose. It is all the copy asks for, and every
 * extra rule (italics, links, escaping) is another way for a stray character
 * in someone's prose to be misread as formatting.
 *
 * Pure string handling, no React — tested in emphasis.test.ts.
 */

/** One run of text, either plain or bold. */
export interface Segment {
  text: string;
  bold: boolean;
}

const MARKER = '**';

/**
 * Splits "Το **Qualia Typo** είναι" into
 * [{ "Το ", plain }, { "Qualia Typo", bold }, { " είναι", plain }].
 *
 * Markers pair up left to right. An opening ** with no closing partner is
 * kept as literal text rather than bolding the rest of the paragraph: a
 * forgotten asterisk should show up on screen as an obvious typo, not as half
 * a paragraph in bold. Empty pieces (from "****", or a marker at either end
 * of the string) are dropped.
 */
export function splitEmphasis(text: string): Segment[] {
  const parts = text.split(MARKER);

  // Splitting on the marker gives plain, bold, plain, bold, … — so an even
  // number of parts means the last marker was never closed. Glue that last
  // piece back onto the plain text before it, asterisks included.
  if (parts.length % 2 === 0) {
    const unclosed = parts.pop()!;
    parts[parts.length - 1] += MARKER + unclosed;
  }

  return parts
    .map((part, i) => ({ text: part, bold: i % 2 === 1 }))
    .filter((segment) => segment.text !== '');
}

/** The same text with the markers taken out, for anywhere that is not drawn
 *  as rich text (a test, a plain-text comparison). */
export function stripEmphasis(text: string): string {
  return splitEmphasis(text).map((segment) => segment.text).join('');
}
