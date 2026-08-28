# Qualia Typo

The website for **Qualia Typo**, the art magazine of the Qualia Art Youth Group.
Static, bilingual (Greek by default, English under `/en`), and deployed to
GitHub Pages at <https://qualiatypowebsite.github.io/>.

## Running it locally

```bash
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
| Homepage, library, reader | `src/routes/` |

Page images are build output and are **not** committed — CI regenerates them on
every deploy, which keeps the repo to just the source PDFs.

## Commands

```bash
npm run dev      # dev server
npm test         # unit and rendering tests
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which installs the
PDF tooling, renders the pages, runs the tests, builds, and publishes to GitHub
Pages. Enable it once under **Settings → Pages → Source → GitHub Actions**.
