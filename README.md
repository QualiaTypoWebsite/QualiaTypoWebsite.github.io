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

## Adding a volume

All four volumes are published. To add a fifth:

1. Drop the PDF into `assets/magazine_vols/` with a number in the filename, e.g. `QUALIA 5.pdf`.
2. Add an entry to `VOLUME_META` in `src/data/volumes.ts` — its accent colour and year.
3. Run `npm run pages`.

That is the whole process: the site asks at load time which volumes actually
exist, so nothing else needs changing. A volume listed in `VOLUME_META` whose
PDF is not there yet shows as "coming soon" on the homepage and in the
library, which is how volume 4 appeared before it was finished.

## Editing the text

All copy lives in two files, and nothing else needs touching:

- `src/i18n/el.json` — Greek
- `src/i18n/en.json` — English

The two files must have the same keys. The Greek file is written first and is
the source of truth for wording; the English one is its translation. In the
English copy a numbered magazine is an **issue** ("Issue 2"), matching the
Greek "Τεύχος".

`src/App.test.tsx` checks some of these strings word for word, so changing
the text of a heading, a button or the reader's title can fail a test. That
is expected: update the test to the new wording, not the other way round.

**To make words bold**, wrap them in double asterisks, as in Markdown:
`"Το **Qualia Typo** είναι…"`. Mark the same phrase in the English file too.
This works in the homepage's intro, About and "Who we are" paragraphs; in a
button or a title the asterisks would show as typed. A `**` left without its
closing pair also shows as typed, so a typo is visible rather than turning
the rest of the paragraph bold.

**The places to pick up a printed copy** — the list at the end of the
homepage's About section — are `about.venues` in both files. Each entry is
just the name: the pin in front of it is drawn by the site
(`src/components/VenueList.tsx`), so don't type a 📍 in. To add a venue, add
it to both files at the same position, in Greek and in English.

## The audio recordings

Volumes 1, 2 and 4 have been recorded as voiceovers — one file per article or
spread — and the site presents them at **`/audio`** (`/en/audio`), reached from
the button under "Every issue" on the library page. Volume 3 has not been
recorded; it still gets a section, which says so when opened.

**The recordings themselves are not in this repo.** They are far too large to
commit, so they live in a public Cloudflare R2 bucket. What *is* committed is
one small `file-order.txt` per volume under `assets/voiceovers/` — the record
of what was recorded and in what order. `.gitignore` excludes everything else
in that folder, and the tests read those text files, so they need to stay
tracked. URLs are built like this:

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

## The social links

The footer's four round buttons — Instagram, Facebook, Linktree and email —
are listed in **`src/data/socials.ts`**:

| Button | URL |
|---|---|
| Instagram | `https://www.instagram.com/qualiaart` |
| Facebook | `https://www.facebook.com/p/Qualia-Art-61575113092569/` |
| Linktree | `https://linktr.ee/qualiaartyouthgroup` |
| Email | `mailto:qualiaartyouthgroup@gmail.com` |

To change one, edit its URL in `src/data/socials.ts` (the email address is
`CONTACT_EMAIL` at the top). Nothing else needs touching — the button, its
colour and its label are already wired up. `src/App.test.tsx` asserts the
URLs, so it will fail and remind you to update it there too.

Adding a fifth network means adding an entry to `SOCIALS`, an icon to
`ICONS` in `src/components/SocialLinks.tsx`, and a label to both i18n files.

## Accessibility

The site is built to **WCAG 2.2 Level AA** — the standard every accessibility
law points at, including the European Accessibility Act and Greek law
4727/2020. On top of that there is a panel of display preferences, reached from
the blue button in the bottom-right corner of every page.

Those are two different things, and the order matters: **the site conforms on
its own, and the panel is a convenience offered on top of it.** Bolt-on
accessibility widgets have a deservedly poor reputation — they are sold as
instant compliance, they fix a fraction of what is actually wrong, and they
routinely fight the assistive technology they claim to help. This one is not
sold as anything. It is first-party, it ships with the site, it stores nothing
anywhere but the visitor's own browser, and it sits on a site that works
without it. Please do not describe it as making the site accessible; the work
below is what does that.

### What conformance meant in practice

Colour is the part worth knowing about, because the palette is deliberately
quiet and quiet is easy to get wrong. Every colour in `src/styles/global.css`
carries its measured contrast ratio in a comment next to it. Three tokens exist
purely to keep that honest:

| Token | For | Measures |
|---|---|---|
| `--ink-faint` | the quietest text — footer, eyebrows, hints, the library's issue labels | 4.83:1 |
| `--rule-strong` | the border of anything you can operate | 3.28:1 |
| `--accent-ink` | a volume's colour when used as **text** | 4.65:1 |

The last one is the subtle one. `--accent` is a magazine cover colour at full
saturation, and two of the four are light — volume 3's green measures 2.00:1 on
paper and volume 4's yellow 1.20:1. Backgrounds and borders may use `--accent`
freely; **anything a reader has to make out uses `--accent-ink`**, which is the
same colour mixed 40% into ink. It is declared on `*` rather than on `:root`,
and the comment there explains why — it is a genuine CSS trap.

Volume colours only appear where a page belongs to one volume: the reader, the
audio player card while it plays that volume, and the social buttons. The
homepage, the library and the audio library are deliberately colourless —
plain paper, so the covers are the only colour there — and the default
`--accent` is the paper colour itself. At that default `--accent-ink` measures
just under AA (4.48:1), so text that belongs to no volume uses `--ink-faint`
instead.

### Using the magazine colours

The colours are all still in the code, ready to use — the pages above simply
don't paint with them:

- **Any one cover colour, anywhere:** `var(--vol-1)` … `var(--vol-4)` in CSS
  (defined in `src/styles/global.css`).
- **"This issue's colour", inside a library row or an audio library section:**
  each row already carries its issue's colour, so `var(--accent)` for a
  background or border, or `var(--accent-ink)` for text, is all it takes. Use
  `--accent-ink` for anything people read — volumes 3 and 4 are too light to
  read as raw text.
- **The pastel tints:** `var(--blush)`, `var(--periwinkle)`, `var(--celadon)`,
  `var(--butter)`.
- **In TypeScript:** `VOLUME_META` and `accentFor(n)` in `src/data/volumes.ts`.

Colouring something on the homepage, library or audio library will fail
`src/routes/colourless.test.ts` on purpose, as a reminder that those pages were
made colourless by choice. If it's intended, take that page's stylesheet out of
the list in that test.

Beyond colour: every route sets its own `<title>` and announces itself on
navigation, the focus ring is a single ink colour that works on every
background the site has, and there is a `forced-colors` path so nothing
vanishes in Windows High Contrast Mode.

### The panel

`src/a11y/`. Text size, pointer size, greyscale, high contrast, negative
contrast, underlined links, a dyslexia-friendly typeface, WCAG-standard text
spacing, a reading mask, a reading guide, and a reset.

Everything it does is a CSS custom property or a `data-*` attribute on
`<html>`, which is possible only because the site already funnels every colour
and every typeface through a token. **To add a setting:** add a field to
`A11ySettings` in `settings.ts`, map it in `documentStateFor`, add a rule to
`a11y.css` keyed off the new attribute, add a `<Toggle>` to `A11yPanel.tsx`,
and add its label to both i18n files. The tests in `settings.test.ts` will tell
you if you have missed a step.

Two things in there are load-bearing and look like they could be simplified:

- **The colour treatments filter a wrapper `<div>`, not `<html>`.** A filtered
  element becomes the containing block for its `position: fixed` descendants,
  so a filter any higher up would quietly un-fix the audio player and the
  accessibility button itself. `App.tsx` wraps the top bar, main content and
  footer in `.a11yFilterable` and leaves everything fixed outside it.
- **High contrast is a token override, not a filter.** No filter can create
  contrast.

**The dyslexia-friendly typeface** is OpenDyslexic, under the SIL Open Font
License, self-hosted in `public/fonts/` alongside the wordmark face. The
published webfont build of it is Latin-only, which is no use on a site whose
default language is Greek, so `opendyslexic-400.woff2` and `-700.woff2` are
subsets cut from the upstream font, which does carry the full modern Greek
alphabet. They are about 38 KB each and are fetched only if a visitor switches
the option on.

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
| Accessibility panel and its settings | `src/a11y/` |

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
