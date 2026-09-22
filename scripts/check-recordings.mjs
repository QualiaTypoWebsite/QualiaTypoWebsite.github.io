/**
 * Asks the bucket whether every recording the site links to is really there.
 *
 *     npm run check:audio
 *
 * Run it after moving a file, renaming one, or pointing RECORDINGS_BASE at a
 * different bucket. It prints one line per volume and lists anything that did
 * not answer with a 200, with the status it gave instead — a 404 means the
 * name in recordings.ts and the name in the bucket have parted company.
 *
 * It reads src/data/recordings.ts as text rather than importing it, because
 * that file is TypeScript and this script is plain Node. That works only
 * because the file is deliberately plain data; if it ever grows logic, this
 * will need a real parser rather than the two regexes below.
 *
 * Nothing in the build depends on this script. It is a tool for a human, and
 * it exits non-zero if anything is missing so CI could use it too.
 */
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/data/recordings.ts', import.meta.url), 'utf8');

const base = source.match(/RECORDINGS_BASE = '([^']+)'/)?.[1];
if (!base) {
  console.error('Could not find RECORDINGS_BASE in src/data/recordings.ts.');
  process.exit(1);
}

/**
 * Walks the RECORDINGS object a line at a time, collecting the files listed
 * under each volume. A line scanner rather than one big regular expression:
 * an empty volume is written "3: []," on a single line, and a regex spanning
 * whole blocks quietly swallows the next volume when it meets one.
 */
function parseVolumes(text) {
  const volumes = [];
  let open = null;

  for (const line of text.split('\n')) {
    const empty = line.match(/^ {2}(\d+): \[\],?\s*$/);
    if (empty) {
      volumes.push({ volume: Number(empty[1]), files: [], overrides: [] });
      continue;
    }

    const start = line.match(/^ {2}(\d+): \[\s*$/);
    if (start) {
      open = { volume: Number(start[1]), files: [], overrides: [] };
      continue;
    }

    if (open === null) continue;

    if (/^ {2}\],?\s*$/.test(line)) {
      volumes.push(open);
      open = null;
      continue;
    }

    const file = line.match(/file: '([^']+)'/);
    if (file) open.files.push(file[1]);
    const url = line.match(/url: '([^']+)'/);
    if (url) open.overrides.push(url[1]);
  }

  return volumes;
}

/** The same URL the site builds — see recordingUrl() in recordings.ts. */
function urlFor(volume, file) {
  return `${base}/qt${volume}/${encodeURIComponent(file)}`;
}

async function check(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok ? null : `HTTP ${res.status}`;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

const volumes = parseVolumes(source);

// A silent mis-parse would be worse than no check at all, so the volumes found
// are compared against the keys the file declares before anything is fetched.
const declared = [...source.matchAll(/^ {2}(\d+): \[/gm)].map((m) => Number(m[1]));
const found = volumes.map((v) => v.volume);
if (found.length !== declared.length || found.some((v, i) => v !== declared[i])) {
  console.error('Could not read src/data/recordings.ts: expected volumes ' +
    `${declared.join(', ')} but parsed ${found.join(', ') || 'none'}.`);
  process.exit(1);
}

console.log(`Checking ${base}\n`);

const broken = [];
let checked = 0;

for (const { volume, files, overrides } of volumes) {
  if (files.length === 0) {
    console.log(`  vol ${volume}  —  no recordings`);
    continue;
  }
  if (overrides.length > 0) {
    console.log(`  vol ${volume}  —  ${overrides.length} entr(y/ies) override the bucket URL`);
  }

  // A handful at a time: polite to the bucket, and fast enough for 92 files.
  const results = [];
  for (let i = 0; i < files.length; i += 8) {
    const batch = files.slice(i, i + 8);
    results.push(
      ...(await Promise.all(
        batch.map(async (file) => ({ file, problem: await check(urlFor(volume, file)) })),
      )),
    );
  }

  checked += results.length;
  const bad = results.filter((r) => r.problem);
  broken.push(...bad.map((r) => ({ volume, ...r })));
  console.log(`  vol ${volume}  —  ${results.length - bad.length}/${results.length} reachable`);
}

if (broken.length === 0) {
  console.log(`\nAll ${checked} recordings are reachable.`);
  process.exit(0);
}

console.error(`\n${broken.length} of ${checked} could not be fetched:`);
for (const { volume, file, problem } of broken) {
  console.error(`  vol ${volume}  ${file}  —  ${problem}`);
}
process.exit(1);
