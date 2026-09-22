# Qualia Typo

The website for **Qualia Typo**, the art magazine of the Qualia Art Youth Group.
Static, bilingual (Greek by default, English under `/en`), and deployed to
GitHub Pages at <https://qualiatypowebsite.github.io/>.

## Running it locally

**Node 20.19+ is required** (22 recommended — that is what CI uses, and what
`.nvmrc` selects). Vite 8 pulls in Rolldown, which imports `styleText` from
`node:util`; on Node 18 `npm run dev` dies with
`does not provide an export named 'styleText'`. With `nvm`, run `nvm install`
then `nvm use` in this directory.

```bash
nvm use         # or otherwise switch to Node 22
npm install
npm run pages   # renders the PDFs into page images (needed once, and after adding a volume)
npm run dev     # http://localhost:5173
```

`npm run pages` needs two system tools:

```bash
sudo dnf install poppler-utils ImageMagick     # Fedora
sudo apt-get install poppler-utils imagemagick # Debian/Ubuntu
```

## Adding volume 4

1. Drop the PDF into `assets/magazine_vols/` with a number in the filename, e.g. `QUALIA 4.pdf`.
2. Run `npm run pages`.

That is the whole process. `src/data/volumes.ts` already reserves an entry for
volume 4 (its accent colour and year); adjust those if needed. Until the PDF
exists the site shows it as "coming soon" on the homepage and in the library.

## Editing the text

All copy lives in two files, and nothing else needs touching:

- `src/i18n/el.json` — Greek
- `src/i18n/en.json` — English

The two files must have the same keys. Strings currently marked `PLACEHOLDER` /
`ΠΡΟΣΩΡΙΝΟ` are the ones still awaiting real copy.

## The audio recordings

Volumes 1, 2 and 4 have been recorded as voiceovers — one file per article or
spread — and the site presents them at **`/audio`** (`/en/audio`), reached from
the button under "Every volume" on the library page. Volume 3 has not been
recorded; it still gets a section, which says so when opened.

**The recordings are not in this repo.** They are far too large to commit, so
they live in a public Cloudflare R2 bucket and `assets/voiceovers/` holds only
a `file-order.txt` per volume — the record of what was recorded and in what
order. URLs are built like this:

```
https://pub-….r2.dev / qt<volume> / <filename>
        RECORDINGS_BASE      folder       exact name in the bucket
```

Everything you might want to change is in **`src/data/recordings.ts`**, which
is deliberately plain data with no logic in it:

| To do this | Change this |
|---|---|
| Rename a recording on the site | its `alias` |
| Point a recording at a different file | its `file` |
| Host one recording somewhere else entirely | add `url: '…'` to that entry |
| Move the whole bucket | `RECORDINGS_BASE`, once |
| Add volume 3's recordings | upload them to `qt3/`, then fill in `3: []` |

The names shown on the site — `vol1-part1`, `vol2-part5` — are **placeholders**,
a convention meaning "the fifth recording of volume 2". Replace them with real
titles whenever there are some; they are just strings, and `alias` is the only
field that appears on screen.

Four of the filenames contain spaces, a comma or Greek letters. They work
because the code URL-encodes every filename — so do not "tidy" that away.

After changing anything here, check the links still resolve:

```bash
npm run check:audio
```

It requests all 92 files and prints anything that does not answer, with the
status it gave instead. A 404 means the name in `recordings.ts` and the name in
the bucket have parted company. `npm test` catches a different mistake: it reads
the `file-order.txt` files back and fails if `recordings.ts` has drifted from
them.

## The social links ⚠ placeholders

The footer's four round buttons — Instagram, Facebook, Linktree and email —
are listed in **`src/data/socials.ts`**. Three of them currently point at
placeholder URLs and **lead nowhere**:

| Button | Current URL | Needs |
|---|---|---|
| Instagram | `https://www.instagram.com/PLACEHOLDER/` | the group's real profile |
| Facebook | `https://www.facebook.com/PLACEHOLDER` | the group's real page |
| Linktree | `https://linktr.ee/PLACEHOLDER` | the group's real Linktree |
| Email | `mailto:qualiatypowebsite@gmail.com` | ✅ already correct |

Replace the three `PLACEHOLDER` URLs in `src/data/socials.ts` before the next
deploy. Nothing else needs touching — the button, its colour and its label are
already wired up. `src/App.test.tsx` asserts the URLs, so it will fail and
remind you to update it there too.

Adding a fifth network means adding an entry to `SOCIALS`, an icon to
`ICONS` in `src/components/SocialLinks.tsx`, and a label to both i18n files.

## The logo

`src/components/Logo.tsx` draws a placeholder mark. Replace its contents with
the real artwork when there is one.

## How it is put together

| Area | Where |
|---|---|
| Page images built from the PDFs | `scripts/build-pages.mjs` → `public/magazines/` |
| Flipbook reader | `src/flipbook/` |
| Language routing (`/` Greek, `/en` English) | `src/i18n/paths.ts` |
| Volume metadata and colours | `src/data/volumes.ts` |
| Homepage, library, reader, audio library | `src/routes/` |
| Recording list, aliases and bucket URL | `src/data/recordings.ts` |
| Audio player and playback state | `src/audio/` |

Page images are build output and are **not** committed — CI regenerates them on
every deploy, which keeps the repo to just the source PDFs.

## Commands

```bash
npm run dev         # dev server
npm test            # unit and rendering tests
npm run build       # production build into dist/
npm run preview     # serve the production build
npm run pages       # render the PDFs into page images
npm run check:audio # check every voiceover URL still resolves (needs network)
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which installs the
PDF tooling, renders the pages, runs the tests, builds, and publishes to GitHub
Pages. Enable it once under **Settings → Pages → Source → GitHub Actions**.
