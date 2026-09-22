/**
 * Guards the recordings list against drifting away from the source it was
 * built from.
 *
 * assets/voiceovers/vol-N/file-order.txt is the record of what was recorded
 * and in what order; recordings.ts is the copy the site reads. Nothing keeps
 * them in step automatically, so this test reads both and compares them. If a
 * recording is added, removed or reordered in one and not the other, these
 * fail and say which volume.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { RECORDINGS, recordingsFor, recordingUrl, RECORDINGS_BASE } from './recordings';

/** The volumes that have a file-order.txt. Volume 3 was never recorded. */
const RECORDED = [1, 2, 4];

/**
 * The order files were written by a shell, so a name containing a space is
 * wrapped in single quotes. Those quotes are shell syntax, not part of the
 * filename.
 */
function filesInOrder(volume: number): string[] {
  const file = path.resolve(`assets/voiceovers/vol-${volume}/file-order.txt`);
  return readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^'(.*)'$/, '$1'));
}

describe('the recordings list', () => {
  it.each(RECORDED)('matches file-order.txt for volume %i, exactly and in order', (volume) => {
    expect(recordingsFor(volume).map((r) => r.file)).toEqual(filesInOrder(volume));
  });

  it('has an entry for volume 3, holding nothing', () => {
    expect(RECORDINGS[3]).toEqual([]);
  });

  it('numbers the aliases by volume and position', () => {
    for (const [volume, list] of Object.entries(RECORDINGS)) {
      list.forEach((recording, i) => {
        expect(recording.alias).toBe(`vol${volume}-part${i + 1}`);
      });
    }
  });

  it('gives every recording on the site a distinct name', () => {
    const aliases = Object.values(RECORDINGS).flatMap((list) => list.map((r) => r.alias));
    expect(new Set(aliases).size).toBe(aliases.length);
  });
});

describe('building a recording URL', () => {
  it('puts each volume in its own bucket folder', () => {
    expect(recordingUrl(2, { file: 'qt2p6.mp3', alias: 'vol2-part3' })).toBe(
      `${RECORDINGS_BASE}/qt2/qt2p6.mp3`,
    );
  });

  // The four awkward filenames are the reason recordingUrl encodes at all.
  it('encodes spaces, commas and Greek letters', () => {
    expect(recordingUrl(1, { file: 'qt1p8 periehomena.mp3', alias: 'a' })).toContain(
      '/qt1/qt1p8%20periehomena.mp3',
    );
    expect(recordingUrl(2, { file: 'qt2p10,11.mp3', alias: 'b' })).toContain('%2C11.mp3');
    expect(recordingUrl(1, { file: 'qt1p63.64.χωρις εικόνα.mp3', alias: 'c' })).toContain(
      '%CF%87%CF%89%CF%81%CE%B9%CF%82%20',
    );
  });

  it('steps aside for a recording that carries its own url', () => {
    const elsewhere = { file: 'ignored.mp3', alias: 'd', url: 'https://example.com/x.mp3' };
    expect(recordingUrl(1, elsewhere)).toBe('https://example.com/x.mp3');
  });

  it('points every real recording at a well-formed https URL', () => {
    for (const volume of RECORDED) {
      for (const recording of recordingsFor(volume)) {
        const url = new URL(recordingUrl(volume, recording));
        expect(url.protocol).toBe('https:');
        expect(url.pathname).toBe(`/qt${volume}/${encodeURIComponent(recording.file)}`);
      }
    }
  });
});
