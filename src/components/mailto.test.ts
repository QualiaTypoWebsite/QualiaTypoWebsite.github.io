/**
 * Tests for the contact form's validation and mailto: link.
 *
 * The encoding cases matter most: Greek text, newlines, ampersands and equals
 * signs all have to survive the trip into an email program, and getting the
 * escaping wrong truncates the visitor's message without any visible error.
 */
import { describe, expect, it } from 'vitest';
import { buildMailto, CONTACT_EMAIL, isPlausibleEmail, validate } from './mailto';

const base = { name: 'Μελίνα', email: 'a@b.gr', subject: '', message: 'Γεια σας' };

describe('isPlausibleEmail', () => {
  it('accepts ordinary addresses', () => {
    expect(isPlausibleEmail('a@b.gr')).toBe(true);
    expect(isPlausibleEmail('  spaced@example.com  ')).toBe(true);
  });

  it('rejects obvious typos', () => {
    expect(isPlausibleEmail('nope')).toBe(false);
    expect(isPlausibleEmail('a@b')).toBe(false);
    expect(isPlausibleEmail('a b@c.gr')).toBe(false);
    expect(isPlausibleEmail('')).toBe(false);
  });
});

describe('validate', () => {
  it('passes a complete form', () => {
    expect(validate(base)).toEqual({});
  });

  it('flags each missing field', () => {
    expect(validate({ ...base, name: '   ' })).toEqual({ name: true });
    expect(validate({ ...base, email: 'x' })).toEqual({ email: true });
    expect(validate({ ...base, message: '' })).toEqual({ message: true });
  });
});

describe('buildMailto', () => {
  it('addresses the group', () => {
    expect(buildMailto(base)).toContain(`mailto:${CONTACT_EMAIL}?`);
  });

  it('falls back to a generated subject', () => {
    const url = new URL(buildMailto(base));
    expect(url.searchParams.get('subject')).toBe('Qualia Typo — Μελίνα');
  });

  it('keeps an explicit subject', () => {
    const url = new URL(buildMailto({ ...base, subject: 'Συνεργασία' }));
    expect(url.searchParams.get('subject')).toBe('Συνεργασία');
  });

  it('signs the body with the sender so replies are possible', () => {
    const url = new URL(buildMailto(base));
    expect(url.searchParams.get('body')).toBe('Γεια σας\n\n— Μελίνα <a@b.gr>');
  });

  it('encodes characters that would otherwise break the query string', () => {
    const url = new URL(buildMailto({ ...base, message: 'a & b\nc=d?e' }));
    expect(url.searchParams.get('body')).toContain('a & b\nc=d?e');
    expect(buildMailto({ ...base, message: 'a & b' })).not.toContain('a & b');
  });

  it('encodes spaces as %20 rather than +, which mail clients show literally', () => {
    expect(buildMailto({ ...base, subject: 'two words' })).toContain('two%20words');
  });
});
