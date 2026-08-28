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
npm test        # vitest, 57 tests
npm run build   # tsc + vite build into dist/
```

`npm run pages` needs `poppler-utils` and `ImageMagick` installed system-wide.
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
- **The contact form uses `mailto:`,** by the owner's explicit choice. It sends
  nothing to any third-party service. Don't add a form backend.
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
  `paths.ts`, `mailto.ts`. Components stay thin enough to read.
- Keep `docs/ARCHITECTURE.md` current when files are added or moved.

## Still outstanding

- Copy in both JSON files is placeholder, marked `PLACEHOLDER` / `ΠΡΟΣΩΡΙΝΟ`.
- `src/components/Logo.tsx` draws a stand-in mark; there is no real logo yet.
- Volume 4 does not exist. Dropping `QUALIA 4.pdf` into `assets/magazine_vols/`
  and running `npm run pages` publishes it — no code change needed.
- Volume years in `src/data/volumes.ts` were guessed and need confirming.
