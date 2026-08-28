# How this codebase works

A guided tour, written to be read top to bottom. If you only have ten minutes,
read **Part 1** and **Part 2** — that is enough to find your way around.

---

## Part 1 — The big picture

This is a **static website**. There is no server, no database, no backend. When
you run `npm run build`, everything becomes a folder of plain files (`dist/`)
that any web host can serve. GitHub Pages just hands those files to visitors.

Three things happen, in order:

```
  assets/magazine_vols/*.pdf          ← the magazines, the real source material
            │
            │  npm run pages   (scripts/build-pages.mjs)
            ▼
  public/magazines/vol-N/             ← one .webp image per page, + the PDF
            │
            │  npm run build   (Vite bundles src/ and copies public/)
            ▼
  dist/                               ← the finished website
```

The important idea: **the PDFs are the only real source.** Everything under
`public/magazines/` is generated from them and is thrown away and rebuilt. That
is why it is in `.gitignore` — it would otherwise double the repo's size for no
benefit.

### Why page images instead of showing the PDF directly?

Volume 1's PDF is 19 MB. If the reader loaded the PDF, you would stare at a
blank screen until all 19 MB arrived. By splitting it into one image per page,
the browser downloads only the two pages you are currently looking at — about
40 KB. That is the single biggest reason the reader feels fast.

---

## Part 2 — Reading order

Follow these seven files in this order and the whole project will make sense.

| # | File | Why read it here |
|---|------|------------------|
| 1 | `scripts/build-pages.mjs` | Where the page images come from. Read this first and `public/magazines/` stops being mysterious. |
| 2 | `src/main.tsx` | The entry point. The very first code that runs in the browser. |
| 3 | `src/App.tsx` | The route table — every URL the site answers to, in one screen. |
| 4 | `src/i18n/paths.ts` | How Greek and English are decided. Small, pure, fully tested. |
| 5 | `src/data/volumes.ts` | What a "volume" is, and how image URLs are built. |
| 6 | `src/routes/Home.tsx` | A page assembled from components — the typical shape of a route. |
| 7 | `src/flipbook/pagination.ts` then `Flipbook.tsx` | The hardest part, saved for last. Read the maths before the component. |

---

## Part 3 — Every file, by folder

### Root

| File | What it does |
|------|--------------|
| `index.html` | The single HTML page. Loads Google Fonts and `src/main.tsx`. Everything else is built by JavaScript. |
| `vite.config.ts` | Build configuration. Also contains the small plugin that copies `index.html` to `404.html`, which is what makes deep links work on GitHub Pages. |
| `tsconfig.json` | TypeScript settings. `strict: true`, so the compiler catches a lot before the browser ever does. |
| `package.json` | Dependencies and the `npm run …` commands. |
| `CLAUDE.md` | Project context for AI sessions — decisions, conventions, what is outstanding. |

### `scripts/`

| File | What it does |
|------|--------------|
| `build-pages.mjs` | Turns each PDF into web images. Uses `pdftoppm` to render pages, then ImageMagick to make a 1400 px reading image and a 240 px thumbnail each. Writes `meta.json` per volume and an `index.json` listing every volume that exists. Also copies the PDF itself so the Download button has something to point at. |

### `src/` — top level

| File | What it does |
|------|--------------|
| `main.tsx` | Starts React and mounts the app. Also handles one small thing: if you previously chose English, arriving at the bare root sends you to `/en`. |
| `App.tsx` | The route table and the page shell (top bar, main area, footer). The route list is defined once and mounted **twice** — once at `/` for Greek, once at `/en` for English. |
| `vite-env.d.ts` | One line that tells TypeScript what a `.module.css` import is. |
| `test-setup.ts` | Fills in browser features jsdom lacks, so tests can run. |
| `App.test.tsx` | Renders real pages and checks they work — the safety net for the whole app. |

### `src/i18n/` — the two languages

This is the folder to understand if you want to change any text on the site.

| File | What it does |
|------|--------------|
| `el.json` / `en.json` | **Every word on the website.** Edit these to change copy. They must always have matching keys. |
| `paths.ts` | Pure functions deciding language from the URL. `/library` is Greek, `/en/library` is English. Also builds the "same page, other language" link the flag button uses. |
| `translate.ts` | Looks up a key like `library.read` in a JSON file and fills in `{{count}}`-style placeholders. A missing key returns the key itself, so a half-finished translation shows `library.read` on screen instead of a blank space. |
| `LanguageProvider.tsx` | Wraps the app and hands every component a `t()` function. Also sets `<html lang>` and remembers the choice in `localStorage`. |

**How a component gets text:**

```
URL "/en/library"
  → languageFromPath() says "en"
  → LanguageProvider loads en.json
  → component calls t('library.read')
  → "Read"
```

### `src/data/` — what a volume is

| File | What it does |
|------|--------------|
| `volumes.ts` | The accent colour and year for each volume, plus the functions that build image and PDF URLs. **Add volume 5 here** if there ever is one. |
| `useVolumes.ts` | Fetches the generated `index.json` at runtime and merges it with the above. This is why publishing volume 4 needs no code change: the site asks at load time which volumes actually exist. |

Note the split: `volumes.ts` holds things a human decides (colour, year),
`index.json` holds things the build discovers (page count, dimensions).

### `src/flipbook/` — the magazine reader

| File | What it does |
|------|--------------|
| `pagination.ts` | Pure maths, no React. Works out which pages face each other. A real magazine has its cover alone on the right, then pages pair up (2‑3, 4‑5, …). Also decides which pages to preload. Heavily tested — start here. |
| `Flipbook.tsx` | The component. Draws two page "boards", and during a turn draws a third element on top — the **leaf** — which rotates in 3D. Handles clicking, dragging, and preloading. |
| `PageImage.tsx` | One page image, showing a shimmer placeholder until it has loaded. |
| `Flipbook.module.css` | The 3D. `perspective`, `preserve-3d` and `backface-visibility` are what make a flat image behave like a turning sheet of paper. |

**How a page turn works** — the one genuinely tricky mechanism in the project:

```
Before:   [ left page 4 ] [ right page 5 ]

You click forward. Three things are drawn at once:
  · left board   still shows page 4
  · right board  already shows page 7   (hidden behind the leaf)
  · the LEAF     front = page 5, back = page 6, rotating from 0° to −180°

As the leaf rotates past 90°, its front face turns away and its back face
comes into view — so you see page 5 lift, flip, and land as page 6.

After:    [ left page 6 ] [ right page 7 ]
```

The leaf is removed once the CSS transition finishes, and the boards are
updated to the new spread. Dragging works the same way, except the rotation
angle follows your pointer instead of a transition. Release past about a third
of the way and it completes; release earlier and it springs back.

### `src/components/` — reusable pieces

| File | What it does |
|------|--------------|
| `TopBar.tsx` | The sticky header: logo, section links, library link, language flag. |
| `TypewriterTitle.tsx` | The homepage title that types itself. |
| `useTypewriter.ts` | The timing behind it: type each letter, hold with a blinking cursor, then drop the full stop. Each keystroke is slightly irregular on purpose — perfectly even typing reads as a machine. |
| `CoverGrid.tsx` | The 2×2 grid of covers on the homepage, with the hover lift. Shows "coming soon" for volumes that do not exist yet. |
| `ContactForm.tsx` | The contact form. |
| `mailto.ts` | Validation and the `mailto:` link the form opens. Pure and tested. |
| `Button.tsx` | One button style in three variants, as a `<button>`, a `<Link>`, or an `<a>`. |
| `SectionReveal.tsx` | Fades a section in the first time you scroll to it. |
| `Footer.tsx` | The footer, with a dot in each volume's colour. |
| `Flags.tsx` | The Greek and UK flags, drawn as SVG so no image files are needed. |
| `Logo.tsx` | **Placeholder** mark. Replace when there is a real logo. |
| `usePrefersReducedMotion.ts` | Reports whether the visitor has asked for less animation. Every animation checks this. |
| `useMediaQuery.ts` | Reports whether a CSS media query currently matches. Used to switch the flipbook to single-page on narrow screens. |

### `src/routes/` — the pages

| File | What it does |
|------|--------------|
| `Home.tsx` | Hero (title, buttons, covers) plus the About, About‑us and Contact sections. |
| `Library.tsx` | Every volume as a row, with Read and Download. |
| `Reader.tsx` | The toolbar, the flipbook, and the thumbnail strip. Keeps the current page in the URL as `?page=12`. |
| `NotFound.tsx` | The 404 page. |

### `src/styles/`

| File | What it does |
|------|--------------|
| `global.css` | The design tokens — every colour, font and easing curve in the project is defined here as a CSS variable. **Change the site's look from this file.** |

Everything else is a `.module.css` file sitting next to its component. CSS
Modules means class names are scoped automatically: `.title` in
`Home.module.css` cannot collide with `.title` anywhere else.

---

## Part 4 — Things worth knowing

### The colours

`--paper`, `--ink` and the pastels are the site's chrome. `--vol-1` … `--vol-4`
are the covers' own colours, taken from the artwork. The rule the design
follows: **the pastels are for the site, the saturated colours belong to the
magazines.** On a volume's page, `--accent` is set to that volume's colour and
the buttons, focus rings and glow pick it up automatically.

### Reduced motion

Some people get motion sick from animation, and their operating system can say
so. Every animated component checks `usePrefersReducedMotion()` and renders the
finished state instead. `global.css` also disables transitions wholesale as a
backstop.

### Why some logic lives in its own file

`pagination.ts`, `paths.ts` and `mailto.ts` contain no React at all. That is
deliberate: they hold the logic most likely to be subtly wrong, and keeping
them separate means they can be tested directly, without rendering anything.
The tests next to them (`*.test.ts`) double as documentation — reading
`pagination.test.ts` tells you exactly how spreads are meant to behave.

### Adding a volume

1. `assets/magazine_vols/QUALIA 4.pdf`
2. `npm run pages`

That is all. `useVolumes` will find it and the "coming soon" tile becomes a
real cover.

### Changing text

`src/i18n/el.json` and `src/i18n/en.json`. Nothing else.
