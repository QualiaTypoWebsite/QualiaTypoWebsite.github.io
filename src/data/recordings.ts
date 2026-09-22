/**
 * The voiceover recordings, and where to find them.
 *
 * This is the file to edit when a recording changes. It is deliberately plain
 * data, in the spirit of volumes.ts: everything a human decides — the order,
 * the names shown on the site, which file belongs to which volume — lives
 * here, and no component needs touching to change any of it.
 *
 *   · rename a recording   → change its `alias`
 *   · repoint a recording  → change its `file` (or give it a `url`)
 *   · move the whole lot   → change RECORDINGS_BASE, once
 *
 * The aliases are a convention, not the filenames: `vol2-part5` is the fifth
 * recording of volume 2. They carry no Greek or English in them, which is why
 * they live here rather than in the i18n files.
 *
 * The order below is the order in assets/voiceovers/vol-N/file-order.txt,
 * which follows the magazine itself. recordings.test.ts reads those files and
 * checks this list still agrees with them, so the two cannot quietly drift.
 *
 * Volume 3 has no recordings; it is listed as an empty array rather than left
 * out, so the page can show it with a "nothing yet" message instead of
 * pretending the volume does not exist.
 */

/** The public Cloudflare R2 bucket the recordings are served from. */
export const RECORDINGS_BASE = 'https://pub-e61841570dd448b7948dfe96745e70f5.r2.dev';

export type Recording = {
  /** The file's exact name in the bucket, spaces and Greek letters included. */
  file: string;
  /** The name shown on the site — see the note about aliases above. */
  alias: string;
  /**
   * Overrides the computed link for this one recording. Only needed if a
   * single file ends up somewhere other than the bucket; normally omitted.
   */
  url?: string;
};

/** Every recording, by volume, in the order the magazine reads. */
export const RECORDINGS: Record<number, Recording[]> = {
  1: [
    { file: 'qt1p4.mp3', alias: 'vol1-part1' },
    { file: 'qt1p7.mp3', alias: 'vol1-part2' },
    { file: 'qt1p8 periehomena.mp3', alias: 'vol1-part3' },
    { file: 'qt1p9.mp3', alias: 'vol1-part4' },
    { file: 'qt1p11s1.mp3', alias: 'vol1-part5' },
    { file: 'qt1p11s2.mp3', alias: 'vol1-part6' },
    { file: 'qt1p12.mp3', alias: 'vol1-part7' },
    { file: 'qt1p13.mp3', alias: 'vol1-part8' },
    { file: 'qt1p14.mp3', alias: 'vol1-part9' },
    { file: 'qt1p15.mp3', alias: 'vol1-part10' },
    { file: 'qt1p16.mp3', alias: 'vol1-part11' },
    { file: 'qt1p17.mp3', alias: 'vol1-part12' },
    { file: 'qt1p18.mp3', alias: 'vol1-part13' },
    { file: 'qt1p19-20.mp3', alias: 'vol1-part14' },
    { file: 'qt1p21-22.mp3', alias: 'vol1-part15' },
    { file: 'qt1p23.mp3', alias: 'vol1-part16' },
    { file: 'qt1p24.mp3', alias: 'vol1-part17' },
    { file: 'qt1p25.mp3', alias: 'vol1-part18' },
    { file: 'qt1p27.mp3', alias: 'vol1-part19' },
    { file: 'qt1p29.mp3', alias: 'vol1-part20' },
    { file: 'qt1p31-32.mp3', alias: 'vol1-part21' },
    { file: 'qt1p33.mp3', alias: 'vol1-part22' },
    { file: 'qt1p34.mp3', alias: 'vol1-part23' },
    { file: 'qt1p35-36.mp3', alias: 'vol1-part24' },
    { file: 'qt1p37.mp3', alias: 'vol1-part25' },
    { file: 'qt1p47.mp3', alias: 'vol1-part26' },
    { file: 'qt1p48.mp3', alias: 'vol1-part27' },
    { file: 'qt1p50.mp3', alias: 'vol1-part28' },
    { file: 'qt1p51.mp3', alias: 'vol1-part29' },
    { file: 'qt1p52s1.mp3', alias: 'vol1-part30' },
    { file: 'qt1p52s2.mp3', alias: 'vol1-part31' },
    { file: 'qt1p53s1.mp3', alias: 'vol1-part32' },
    { file: 'qt1p53s2.mp3', alias: 'vol1-part33' },
    { file: 'qt1p53s3.mp3', alias: 'vol1-part34' },
    { file: 'qt1p54s1.mp3', alias: 'vol1-part35' },
    { file: 'qt1p54s2.mp3', alias: 'vol1-part36' },
    { file: 'qt1p54s3.mp3', alias: 'vol1-part37' },
    { file: 'qt1p54s4.mp3', alias: 'vol1-part38' },
    { file: 'qt1p55s1.mp3', alias: 'vol1-part39' },
    { file: 'qt1p55s2.mp3', alias: 'vol1-part40' },
    { file: 'qt1p55s3.mp3', alias: 'vol1-part41' },
    { file: 'qt1p56.mp3', alias: 'vol1-part42' },
    { file: 'qt1p59.mp3', alias: 'vol1-part43' },
    { file: 'qt1p62.mp3', alias: 'vol1-part44' },
    { file: 'qt1p63.64.χωρις εικόνα.mp3', alias: 'vol1-part45' },
  ],
  2: [
    { file: 'qt2p00.mp3', alias: 'vol2-part1' },
    { file: 'qt2periehomena.mp3', alias: 'vol2-part2' },
    { file: 'qt2p6.mp3', alias: 'vol2-part3' },
    { file: 'qt2p10,11.mp3', alias: 'vol2-part4' },
    { file: 'qt2p17.mp3', alias: 'vol2-part5' },
    { file: 'qt2p27.mp3', alias: 'vol2-part6' },
    { file: 'qt2p28.mp3', alias: 'vol2-part7' },
    { file: 'qt2p29.mp3', alias: 'vol2-part8' },
    { file: 'qt2p31.mp3', alias: 'vol2-part9' },
    { file: 'qt2p32.mp3', alias: 'vol2-part10' },
    { file: 'qt2p35.mp3', alias: 'vol2-part11' },
    { file: 'qt2p36.mp3', alias: 'vol2-part12' },
    { file: 'qt2p43.mp3', alias: 'vol2-part13' },
    { file: 'qt2p44.mp3', alias: 'vol2-part14' },
    { file: 'qt2p45.mp3', alias: 'vol2-part15' },
    { file: 'qt2p46.mp3', alias: 'vol2-part16' },
    { file: 'qt2p47.mp3', alias: 'vol2-part17' },
    { file: 'qt2p48.mp3', alias: 'vol2-part18' },
    { file: 'qt2p49.mp3', alias: 'vol2-part19' },
    { file: 'qt2p50.mp3', alias: 'vol2-part20' },
    { file: 'qt2p51.mp3', alias: 'vol2-part21' },
    { file: 'qt2p52.mp3', alias: 'vol2-part22' },
    { file: 'qt2p54.mp3', alias: 'vol2-part23' },
    { file: 'qt2p55.mp3', alias: 'vol2-part24' },
    { file: 'qt2p64.mp3', alias: 'vol2-part25' },
  ],
  /** Volume 3 has not been recorded. The page shows an empty section for it. */
  3: [],
  4: [
    { file: 'qt4tokitrino.mp3', alias: 'vol4-part1' },
    { file: 'qt4perihomename ektyposi.mp3', alias: 'vol4-part2' },
    { file: 'qt4periehomena.mp3', alias: 'vol4-part3' },
    { file: 'qt4p6-7.mp3', alias: 'vol4-part4' },
    { file: 'qt4p8.mp3', alias: 'vol4-part5' },
    { file: 'qt4p9.mp3', alias: 'vol4-part6' },
    { file: 'qt4p17.mp3', alias: 'vol4-part7' },
    { file: 'qt4p18.mp3', alias: 'vol4-part8' },
    { file: 'qt4p19.mp3', alias: 'vol4-part9' },
    { file: 'qt4p22.mp3', alias: 'vol4-part10' },
    { file: 'qt4p25.mp3', alias: 'vol4-part11' },
    { file: 'qt4p26.mp3', alias: 'vol4-part12' },
    { file: 'qt4p27.mp3', alias: 'vol4-part13' },
    { file: 'qt4p28.mp3', alias: 'vol4-part14' },
    { file: 'qt4p30-31.mp3', alias: 'vol4-part15' },
    { file: 'qt4p33.mp3', alias: 'vol4-part16' },
    { file: 'qt4p42.mp3', alias: 'vol4-part17' },
    { file: 'qt4p43.mp3', alias: 'vol4-part18' },
    { file: 'qt4p44-49 zodiac.mp3', alias: 'vol4-part19' },
    { file: 'qt4p54-55.mp3', alias: 'vol4-part20' },
    { file: 'qt4p56-57.mp3', alias: 'vol4-part21' },
    { file: 'qt4p58.mp3', alias: 'vol4-part22' },
  ],
};

/** Recordings for a volume, or an empty list for one that has none. */
export function recordingsFor(volume: number): Recording[] {
  return RECORDINGS[volume] ?? [];
}

/** The bucket keeps each volume in its own folder: qt1, qt2, qt4. */
export function recordingFolder(volume: number): string {
  return `qt${volume}`;
}

/**
 * Where to fetch a recording from.
 *
 * The filename is encoded rather than pasted in raw, and that is load-bearing:
 * four of the files have spaces, Greek letters or a comma in their names, and
 * an unencoded space would simply 404.
 */
export function recordingUrl(volume: number, recording: Recording): string {
  if (recording.url) return recording.url;
  return `${RECORDINGS_BASE}/${recordingFolder(volume)}/${encodeURIComponent(recording.file)}`;
}

/** True if a volume has anything to listen to. */
export function hasRecordings(volume: number): boolean {
  return recordingsFor(volume).length > 0;
}
