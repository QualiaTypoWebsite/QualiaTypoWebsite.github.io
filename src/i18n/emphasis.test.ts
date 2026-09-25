/**
 * Tests for the **bold** markers in the i18n files.
 *
 * They double as the specification of the syntax: what counts as bold, and
 * what happens when someone forgets a closing pair of asterisks.
 */
import { describe, expect, it } from 'vitest';
import { splitEmphasis, stripEmphasis } from './emphasis';

describe('splitEmphasis', () => {
  it('leaves text without markers as one plain piece', () => {
    expect(splitEmphasis('Χωρίς έντονα')).toEqual([{ text: 'Χωρίς έντονα', bold: false }]);
  });

  it('bolds the text between a pair of markers', () => {
    expect(splitEmphasis('Το **Qualia Typo** είναι')).toEqual([
      { text: 'Το ', bold: false },
      { text: 'Qualia Typo', bold: true },
      { text: ' είναι', bold: false },
    ]);
  });

  it('handles several bold phrases, and one at either end', () => {
    expect(splitEmphasis('**#1** και **#2**')).toEqual([
      { text: '#1', bold: true },
      { text: ' και ', bold: false },
      { text: '#2', bold: true },
    ]);
  });

  it('keeps punctuation inside the markers, quotes included', () => {
    expect(splitEmphasis('ερώτημα **«Πού είναι η τέχνη;»**')).toEqual([
      { text: 'ερώτημα ', bold: false },
      { text: '«Πού είναι η τέχνη;»', bold: true },
    ]);
  });

  it('shows an unclosed marker as literal text instead of bolding the rest', () => {
    expect(splitEmphasis('**ένα** και **δύο χωρίς τέλος')).toEqual([
      { text: 'ένα', bold: true },
      { text: ' και **δύο χωρίς τέλος', bold: false },
    ]);
  });

  it('drops empty pieces', () => {
    expect(splitEmphasis('α****β')).toEqual([
      { text: 'α', bold: false },
      { text: 'β', bold: false },
    ]);
    expect(splitEmphasis('')).toEqual([]);
  });
});

describe('stripEmphasis', () => {
  it('returns the text a reader sees, without the markers', () => {
    expect(stripEmphasis('Το **Qualia Typo** είναι')).toBe('Το Qualia Typo είναι');
  });
});
