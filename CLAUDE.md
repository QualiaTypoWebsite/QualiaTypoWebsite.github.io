# CLAUDE.md

Context for Claude Code sessions working on this repo. A new session starts
with no memory of previous ones, so anything that must survive belongs here.

**Read `docs/ARCHITECTURE.md` first.** It is the guided tour of the codebase:
what every file does, and the order to read them in.

## What this project is

The website for *Qualia Typo*, the art magazine of the Qualia Art Youth Group.
A static, bilingual site where visitors read the magazine in a flipbook viewer
and download the PDFs. Deployed to GitHub Pages at
<https://qualiatypowebsite.github.io/>.

The audience is readers of an art magazine, so the site is deliberately quiet:
soft paper-toned chrome, and the only saturated colours on any page are the
magazine covers themselves.

## Stack

Vite + React 18 + TypeScript, plain CSS with CSS Modules, framer-motion for
animation, React Router for routing. No CSS framework and no UI library — the
styling is hand-written on purpose, for control over the typography.

## Commands

```bash
npm run pages   # render the PDFs into page images — run once after cloning
npm run dev     # dev server on http://localhost:5173
npm test        # vitest, 140 tests
npm run build   # tsc + vite build into dist/
npm run check:audio  # check every voiceover URL still resolves (needs network)
```

**Node 20.19+ is required** (CI and `.nvmrc` use 22). Vite 8 / Rolldown import
`styleText` from `node:util`, absent before Node 20.19, so on older Node every
`npm` script fails with `does not provide an export named 'styleText'`.
`.npmrc` sets `engine-strict=true` so `npm install` refuses old Node outright.

`npm run pages` needs `poppler-utils` and `ImageMagick` installed system-wide
(either major version — the script auto-detects `magick` vs `convert`/`identify`).
Without it the site runs but every magazine page is a broken image.

## Decisions already made — don't quietly reverse these

- **Page images are generated, never committed.** `public/magazines/` is
  gitignored; CI regenerates it on every deploy. This keeps the repo at the
  ~30 MB of source PDFs instead of ~67 MB. The PDFs in `assets/magazine_vols/`
  are the single source of truth.
- **Greek is the default language and lives at the root**; English is under
  `/en`. Language is derived from the URL path, never from React state alone,
  so an English link is shareable.
- **The flipbook is custom.** It was written rather than taken from a library
  because the available ones are canvas-based and feel clunky. Don't swap it
  for a dependency without asking.
- **There is no contact form.** It was removed in favour of four round social
  buttons (Facebook, Instagram, Linktree, email) in the footer, by the owner's
  explicit choice — the footer is where visitors look for these, and a whole
  homepage section for four icons was more weight than they deserve. The site
  still sends nothing to any third-party service: the email button is a plain
  `mailto:`. Don't add a form backend, and don't reinstate the form.
- **Source Sans 3 is self-hosted in `public/fonts/` and used only for the
  wordmark** ("Qualia Typo" — the hero title and the top bar), through the
  `--font-title` token. Body and display type stay on the Google-hosted Inter
  and DM Mono. Those font files are committed, unlike the page images.
- **The voiceover recordings live in a public Cloudflare R2 bucket**, not in
  this repo — they are far too large to commit, so `.gitignore` excludes
  `assets/voiceovers/` apart from one small `file-order.txt` per volume, which
  **is** committed: `recordings.test.ts` reads those files, so CI fails without
  them. Don't re-ignore them. The URLs are
  built in `src/data/recordings.ts` as `RECORDINGS_BASE/qt<volume>/<filename>`.
  That file is plain, hand-editable data: renaming a recording on the site is
  an `alias` edit, repointing one is a `file` edit, and moving the whole lot is
  one constant. Filenames are URL-encoded because four of them contain spaces,
  a comma or Greek letters. `npm run check:audio` re-verifies every link.
- **The aliases (`vol2-part5`) are a placeholder naming convention**, chosen so
  the list reads sensibly before the recordings have real titles. They live in
  `recordings.ts` rather than the i18n files because they contain no language.
- **The audio player is mounted above the route table**, in `App.tsx`, so that
  playback survives navigation. Don't move it into the audio page — a provider
  inside a route is unmounted on navigation and the sound stops.
- **Vite/Vitest/React Router are pinned to exact versions** that are free of the
  CVEs `npm audit` flagged. Keep `npm audit` at zero.
- **The site targets WCAG 2.2 Level AA on its own, and the accessibility panel
  is a convenience on top of that** — never a substitute for it, and never
  described as one. Bolt-on accessibility overlays are discredited for good
  reasons; what keeps this one honest is that the site conforms without it.
  Don't add a claim anywhere that the button makes the site accessible.
- **Every colour in `global.css` carries its measured contrast ratio in a
  comment.** If you change one, re-measure it against all five surfaces the
  site paints — paper, sunk paper, the two homepage washes, and the reader's
  accent glow at volume 4's yellow, which is the lightest background here.
- **`--accent` is for backgrounds and borders; `--accent-ink` is for anything a
  reader has to make out.** Two of the four cover colours are light (volume 3's
  green is 2.00:1 on paper, volume 4's yellow 1.20:1), so using `--accent` as a
  text or state colour makes it vanish on those volumes. `--accent-ink` is
  declared on `*`, not `:root`, because a `var()` inside a custom property is
  substituted where it is *declared* — on `:root` it would freeze at volume 1's
  pink for the whole site. Don't "tidy" it up to `:root`.
- **The greyscale and negative settings filter `.a11yFilterable`, a wrapper
  around the top bar, main and footer — not `<html>`.** A filtered element
  becomes the containing block for its `position: fixed` descendants, so a
  filter higher up would un-fix the audio player and the accessibility button.
  Everything fixed stays outside that wrapper. An earlier version used
  `backdrop-filter` on a transparent overlay, which needs no wrapper and is
  tidier; it was abandoned because Firefox renders it as nothing at all under
  software rendering, and a colour setting that silently does nothing is worse
  than no setting.
- **High contrast is a token override, not a CSS filter.** No filter can create
  contrast. It works by redefining the tokens in `global.css`, which is also
  why it costs about fifteen lines.
- **OpenDyslexic is self-hosted in `public/fonts/` and committed**, like Source
  Sans 3. The published webfont build of it is Latin-only and therefore useless
  here; the two files are subsets cut from the upstream font, which does carry
  the full modern Greek alphabet. Its licence is `OFL-OpenDyslexic.txt`.
- **Bionic-style bolding of word stems was asked for and deliberately not
  built.** The peer-reviewed evidence does not support it, splitting every word
  into two elements harms screen readers and braille displays, and doing it
  site-wide would mean rewriting the text nodes React owns on every re-render.
  Text spacing — the WCAG 1.4.12 values — stands in its place. Don't add it
  without revisiting all three of those.

## Conventions

- **Comment thoroughly.** The owner reads this codebase herself. Every file
  gets a header comment explaining its role; non-obvious logic gets a comment
  explaining *why*, not restating *what*.
- **All user-facing text goes in `src/i18n/el.json` and `src/i18n/en.json`.**
  Never hard-code a Greek or English string in a component. The two files must
  always have identical key structures.
- **Bold in the copy is written `**like this**`**, and the same phrases are
  marked in both languages. Only strings drawn through `RichText` (the homepage
  prose) turn the markers into bold; anywhere else they would appear as typed,
  so don't use them in titles, buttons or aria-labels. No HTML in the JSON.
- **Every animation needs a `prefers-reduced-motion` path.** Use the
  `usePrefersReducedMotion` hook and render the finished state.
- **Anything new has to clear WCAG 2.2 AA before it ships**: 4.5:1 for text,
  3:1 for the border of anything operable and for any state you can see, a
  visible focus ring, a 24×24 target, a label on every control, and real text
  rather than an `aria-label` on an element with no role.
- **Pure logic lives in its own file with tests** — see `pagination.ts`,
  `paths.ts`. Components stay thin enough to read.
- Keep `docs/ARCHITECTURE.md` current when files are added or moved.
- Keep `README.md` current too — it is the door into the project for someone
  who has never seen it. A new feature usually earns a short section there
  saying where its data lives and what a person would want to change.
- Keep this file `CLAUDE.md` up-to-date with the latest important changes or conventions when files are added, moved or modded. Only when it is necessary.

## A note on how to write code here

Please treat the following as the house style rather than as optional polish.
This is a small codebase that its owner reads herself, and the point of every
item below is the same: someone should be able to open any file, alone, and
understand what it is for and why it is the way it is.

- **Comment generously, and comment the reasoning.** Give every file a header
  comment saying what its role is. Where a line is not obvious, say *why* it is
  that way — "the filename is encoded because four of them contain spaces" is
  worth writing; "encode the filename" is not, because the code already says
  that. A comment explaining a decision saves the next reader from undoing it.
- **Keep files small and give each one a single job.** If a file has grown hard
  to hold in your head, that is the signal to split it. A reader should be able
  to answer "what does this do, how do I use it, what does it depend on?"
  without reading the internals.
- **Separate the logic that could be wrong from the code that draws things.**
  The arithmetic and the string handling go in their own plain file with no
  React in it, and get tested directly — `pagination.ts`, `paths.ts`,
  `queue.ts`. The component is then thin enough to read at a glance, and the
  tests double as documentation of how the logic is meant to behave.
- **Put the things a human might want to change in one obvious place**, as
  plain data — `volumes.ts`, `socials.ts`, `recordings.ts`, the two i18n files.
  Editing the site's content should never mean editing a component.
- **Follow the patterns that are already here** rather than introducing a
  second way of doing the same thing. Look at how a similar feature was built
  before inventing an approach; consistency is worth more than cleverness.
- **Write for the person using the site, not only the one reading the code.**
  Every control needs a label, every animation needs a reduced-motion path,
  every interactive element needs to work from the keyboard, and every piece of
  text needs to exist in both languages.
- **Reach for a dependency last.** Four icons, a flipbook and an audio player
  were all hand-written here on purpose. Prefer a small amount of code you
  control and can comment.
- **Leave the documentation true.** If a change makes a sentence in
  `README.md`, `docs/ARCHITECTURE.md` or this file wrong, fix the sentence in
  the same breath. Documentation that has quietly gone stale is worse than none.
- **Finish by checking, not by assuming.** `npm test`, `npm run build` and
  `npm audit` should all be clean before you call the work done, and say
  plainly what you ran.

## Still outstanding

- The homepage intro, About and "Who we are" copy is final (Greek written by
  the owner, English translated from it). The `_placeholder` note at the top of
  each JSON file is still there; remove it from both once the rest of the copy
  has been signed off.
- `src/components/Logo.tsx` draws a stand-in mark; there is no real logo yet.
- All four volumes are published. A fifth needs its PDF in
  `assets/magazine_vols/`, an entry in `VOLUME_META`, and `npm run pages`.
- Volume years in `src/data/volumes.ts` were guessed and need confirming.
- Volume 3 has no voiceover recordings. The audio library shows it with a
  "nothing yet" message; adding recordings means filling in `3: []` in
  `src/data/recordings.ts` and uploading the files to `qt3/` in the bucket.
- The recording aliases are provisional — see the decision above.
- **The Facebook, Instagram and Linktree URLs in `src/data/socials.ts` are
  placeholders** ending in `PLACEHOLDER` and lead nowhere. They need the
  group's real profile URLs.
