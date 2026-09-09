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
npm test        # vitest, 48 tests
npm run build   # tsc + vite build into dist/
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
- **Vite/Vitest/React Router are pinned to exact versions** that are free of the
  CVEs `npm audit` flagged. Keep `npm audit` at zero.

## Conventions

- **Comment thoroughly.** The owner reads this codebase herself. Every file
  gets a header comment explaining its role; non-obvious logic gets a comment
  explaining *why*, not restating *what*.
- **All user-facing text goes in `src/i18n/el.json` and `src/i18n/en.json`.**
  Never hard-code a Greek or English string in a component. The two files must
  always have identical key structures.
- **Every animation needs a `prefers-reduced-motion` path.** Use the
  `usePrefersReducedMotion` hook and render the finished state.
- **Pure logic lives in its own file with tests** — see `pagination.ts`,
  `paths.ts`. Components stay thin enough to read.
- Keep `docs/ARCHITECTURE.md` current when files are added or moved.
- Keep this file `CLAUDE.md` up-to-date with the latest important changes or conventions when files are added, moved or modded. Only when it is necessary.

## Still outstanding

- Copy in both JSON files is placeholder, marked `PLACEHOLDER` / `ΠΡΟΣΩΡΙΝΟ`.
- `src/components/Logo.tsx` draws a stand-in mark; there is no real logo yet.
- Volume 4 does not exist. Dropping `QUALIA 4.pdf` into `assets/magazine_vols/`
  and running `npm run pages` publishes it — no code change needed.
- Volume years in `src/data/volumes.ts` were guessed and need confirming.
- **The Facebook, Instagram and Linktree URLs in `src/data/socials.ts` are
  placeholders** ending in `PLACEHOLDER` and lead nowhere. They need the
  group's real profile URLs.
