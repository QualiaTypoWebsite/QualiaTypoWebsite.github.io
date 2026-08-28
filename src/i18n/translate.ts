/**
 * Looks up a piece of text in a translation file.
 *
 * Keys are dotted paths into the JSON: translate(dict, 'library.read'). Values
 * may contain {{placeholders}}, filled in from the vars argument.
 *
 * A missing key returns the key itself rather than throwing. That is a
 * deliberate choice: a half-finished translation then shows "library.read" on
 * screen — visible, obviously wrong, and easy to grep for — instead of
 * crashing the page or leaving a silent blank.
 */
export type Dict = Record<string, unknown>;

/** Walks a dotted key path: get(d, "library.read"). */
function lookup(dict: Dict, key: string): unknown {
  return key.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object' && part in (node as Dict)) {
      return (node as Dict)[part];
    }
    return undefined;
  }, dict);
}

/** Fills {{name}} placeholders. Unknown placeholders are left as-is. */
export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  );
}

/**
 * Resolves a string key. A missing key returns the key itself rather than
 * throwing, so a half-translated file degrades to something visible and
 * findable instead of a blank page.
 */
export function translate(
  dict: Dict,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const value = lookup(dict, key);
  if (typeof value === 'string') return interpolate(value, vars);
  return key;
}

/** Resolves a key whose value is a list of paragraphs. */
export function translateList(dict: Dict, key: string): string[] {
  const value = lookup(dict, key);
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  return [];
}
