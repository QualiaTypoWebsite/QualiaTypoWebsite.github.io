#!/usr/bin/env node
/**
 * Renders each magazine PDF in assets/magazine_vols into web-ready page images.
 *
 * Output per volume, under public/magazines/vol-N/:
 *   page-001.webp   1400px wide, for the flipbook
 *   thumb-001.webp  240px wide, for the thumbnail strip
 *   meta.json       { pages, width, height }
 *
 * These are build artifacts and are not committed; CI regenerates them on
 * deploy. Run locally with `npm run pages` before `npm run dev`.
 *
 * Requires poppler-utils (pdftoppm) and ImageMagick on PATH. Either ImageMagick
 * major version works: v7 exposes a single `magick` command, while v6 — still
 * what Debian/Ubuntu's `imagemagick` package installs, including on the GitHub
 * Pages runner — exposes `convert` and `identify` as separate binaries and has
 * no `magick`. resolveImageMagick() picks whichever is present.
 */
import { execFile } from 'node:child_process';
import { copyFile, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import path from 'node:path';
import os from 'node:os';

const run = promisify(execFile);

const SRC_DIR = 'assets/magazine_vols';
const OUT_DIR = 'public/magazines';
const READ_WIDTH = 1400;
const THUMB_WIDTH = 240;
const RENDER_DPI = 200;
const CONCURRENCY = Math.max(2, Math.min(os.cpus().length, 8));

/** "QUALIA 2.pdf" -> 2. Returns null for files that aren't numbered volumes. */
export function volumeNumberFrom(filename) {
  const match = /(\d+)/.exec(path.basename(filename, '.pdf'));
  return match ? Number(match[1]) : null;
}

async function hasBin(bin) {
  try {
    await run('sh', ['-c', `command -v ${bin}`]);
    return true;
  } catch {
    return false;
  }
}

async function requireTool(bin, hint) {
  if (!(await hasBin(bin))) {
    throw new Error(`Missing "${bin}". Install it first: ${hint}`);
  }
}

/**
 * Resolves how to invoke ImageMagick on this machine. Returns the binary and
 * any leading args for the two ways the script uses it: a plain conversion and
 * an `identify`. On v7 both go through `magick` ("magick …", "magick identify
 * …"); on v6 they are the standalone `convert` and `identify` commands. The
 * remaining arguments the script passes (-resize, -quality, -define, -format)
 * are identical across v6 and v7.
 */
async function resolveImageMagick() {
  if (await hasBin('magick')) {
    return { convert: ['magick'], identify: ['magick', 'identify'] };
  }
  if (await hasBin('convert')) {
    return { convert: ['convert'], identify: ['identify'] };
  }
  throw new Error(
    'Missing ImageMagick. Install it first: ' +
      'Fedora: sudo dnf install ImageMagick; ' +
      'Debian/Ubuntu: sudo apt-get install imagemagick',
  );
}

async function pageCount(pdf) {
  const { stdout } = await run('pdfinfo', [pdf]);
  const match = /^Pages:\s+(\d+)$/m.exec(stdout);
  if (!match) throw new Error(`Could not read page count from ${pdf}`);
  return Number(match[1]);
}

/** Runs tasks with a bounded number in flight, so we don't fork 200 processes. */
async function inBatches(items, worker) {
  const queue = [...items];
  const runners = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) await worker(queue.shift());
  });
  await Promise.all(runners);
}

async function renderVolume(pdf, volume, im) {
  const outDir = path.join(OUT_DIR, `vol-${volume}`);
  const pages = await pageCount(pdf);
  console.log(`vol ${volume}: ${pages} pages -> ${outDir}`);

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const tmp = path.join(outDir, '.raw');
  await mkdir(tmp, { recursive: true });

  // pdftoppm is fastest rendering the whole document in one pass.
  await run('pdftoppm', ['-png', '-r', String(RENDER_DPI), pdf, path.join(tmp, 'p')]);

  const raw = (await readdir(tmp)).filter((f) => f.endsWith('.png')).sort();
  if (raw.length !== pages) {
    throw new Error(`vol ${volume}: rendered ${raw.length} images but PDF has ${pages} pages`);
  }

  await inBatches(
    raw.map((file, index) => ({ file, index })),
    async ({ file, index }) => {
      const n = String(index + 1).padStart(3, '0');
      const src = path.join(tmp, file);
      await run(im.convert[0], [...im.convert.slice(1), src,
        '-resize', `${READ_WIDTH}x`, '-quality', '82',
        '-define', 'webp:method=6', path.join(outDir, `page-${n}.webp`)]);
      await run(im.convert[0], [...im.convert.slice(1), src,
        '-resize', `${THUMB_WIDTH}x`, '-quality', '72',
        path.join(outDir, `thumb-${n}.webp`)]);
    },
  );

  // Page geometry drives the flipbook's aspect ratio, so read it from the art
  // itself rather than assuming A5.
  const { stdout } = await run(im.identify[0], [...im.identify.slice(1),
    '-format', '%w %h', path.join(outDir, 'page-001.webp')]);
  const [width, height] = stdout.trim().split(/\s+/).map(Number);

  await rm(tmp, { recursive: true, force: true });

  // The Download button serves the original PDF, so it has to ship too.
  const pdfName = `qualia-typo-vol-${volume}.pdf`;
  await copyFile(pdf, path.join(outDir, pdfName));

  await writeFile(path.join(outDir, 'meta.json'),
    JSON.stringify({ pages, width, height, pdf: pdfName }, null, 2) + '\n');

  return { volume, pages, width, height, pdf: pdfName };
}

async function main() {
  await requireTool('pdftoppm', 'Fedora: sudo dnf install poppler-utils');
  const im = await resolveImageMagick();

  if (!existsSync(SRC_DIR)) throw new Error(`No ${SRC_DIR} directory found`);

  const pdfs = (await readdir(SRC_DIR))
    .filter((f) => f.toLowerCase().endsWith('.pdf'))
    .map((f) => ({ file: f, volume: volumeNumberFrom(f) }))
    .filter((entry) => entry.volume !== null)
    .sort((a, b) => a.volume - b.volume);

  if (!pdfs.length) throw new Error(`No numbered volume PDFs in ${SRC_DIR}`);

  await mkdir(OUT_DIR, { recursive: true });

  const results = [];
  for (const { file, volume } of pdfs) {
    results.push(await renderVolume(path.join(SRC_DIR, file), volume, im));
  }

  // An index of what actually exists, so the app never links a missing volume.
  await writeFile(path.join(OUT_DIR, 'index.json'),
    JSON.stringify({ volumes: results }, null, 2) + '\n');

  console.log(`\nDone. ${results.reduce((n, r) => n + r.pages, 0)} pages across ${results.length} volumes.`);
}

main().catch((err) => {
  console.error(`\nbuild-pages failed: ${err.message}`);
  process.exit(1);
});
