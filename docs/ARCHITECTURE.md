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

One thing does not come from this repo at all: the **voiceover recordings**.
They are too large to commit and too large to build, so they are hosted in a
public Cloudflare R2 bucket and fetched by the browser at the moment someone
presses play. See `src/audio/` in Part 3.

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

The audio library is a self-contained addition and can be read separately, in
the same order: `src/data/recordings.ts`, then `src/audio/queue.ts`, then
`AudioPlayerProvider.tsx`, then the page in `src/routes/AudioLibrary.tsx`.

---

## Part 3 — Every file, by folder

### Root

| File | What it does |
|------|--------------|
| `index.html` | The single HTML page. Loads the Google-hosted body fonts, preloads the self-hosted wordmark font, and pulls in `src/main.tsx`. Everything else is built by JavaScript. |
| `vite.config.ts` | Build configuration. Also contains the small plugin that copies `index.html` to `404.html`, which is what makes deep links work on GitHub Pages. |
| `tsconfig.json` | TypeScript settings. `strict: true`, so the compiler catches a lot before the browser ever does. |
| `package.json` | Dependencies and the `npm run …` commands. |
| `CLAUDE.md` | Project context for AI sessions — decisions, conventions, what is outstanding. |

### `scripts/`

| File | What it does |
|------|--------------|
| `check-recordings.mjs` | Asks the bucket whether every voiceover recording the site links to is really there. Run by hand with `npm run check:audio`; nothing in the build depends on it. |
| `build-pages.mjs` | Turns each PDF into web images. Uses `pdftoppm` to render pages, then ImageMagick to make a 1400 px reading image and a 240 px thumbnail each. Writes `meta.json` per volume and an `index.json` listing every volume that exists. Also copies the PDF itself so the Download button has something to point at. |

### `public/fonts/` — the one self-hosted typeface

| File | What it does |
|------|--------------|
| `source-sans-3-*.woff2` | Source Sans 3, variable (weights 200–900), used **only** for the words "Qualia Typo" — the homepage hero title and the top bar wordmark. One file per unicode range (latin, latin-ext, greek); the browser fetches only what a page needs, which in practice is the ~29 KB latin file. The `@font-face` rules are in `global.css`. |
| `opendyslexic-400.woff2` / `-700.woff2` | OpenDyslexic, offered by the accessibility panel as a dyslexia-friendly alternative. Subsets cut to Latin + Greek, ~38 KB each; the published build of this font is Latin-only, which would be no use on a Greek-default site. Fetched only when a visitor switches the option on. |
| `OFL.txt` | The SIL Open Font License Source Sans 3 ships under. It stays next to the files. |
| `OFL-OpenDyslexic.txt` | The same licence for OpenDyslexic, whose copyright line is a different one. |

Unlike `public/magazines/`, these **are** committed — nothing regenerates them.

### `src/` — top level

| File | What it does |
|------|--------------|
| `main.tsx` | Starts React and mounts the app. Also handles one small thing: if you previously chose English, arriving at the bare root sends you to `/en`. |
| `App.tsx` | The route table and the page shell (top bar, main area, footer, audio player, accessibility button). The route list is defined once and mounted **twice** — once at `/` for Greek, once at `/en` for English. The audio player and the accessibility settings are both mounted above the routes, so neither is lost on navigation. The shell also wraps the top bar, main and footer in `.a11yFilterable` — see `src/a11y/`. |
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
| `socials.ts` | Where the footer's social buttons point, and which volume colour each one wears. **The Facebook, Instagram and Linktree URLs are placeholders** — see README.md. |
| `recordings.ts` | **Every voiceover recording**: which file belongs to which volume, in what order, and under what name on the site. Also where the recordings are hosted. This is the file to edit to rename or repoint one. |
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
| `SocialLinks.tsx` | The round Facebook / Instagram / Linktree / email buttons in the footer. The icons are hand-drawn inline SVG — four glyphs did not justify an icon package. |
| `Button.tsx` | One button style in three variants, as a `<button>`, a `<Link>`, or an `<a>`. |
| `SectionReveal.tsx` | Fades a section in the first time you scroll to it. |
| `Footer.tsx` | The footer: the copyright line and the social buttons. Carries `id="contact"`, because that is what the top bar's Contact link points at. |
| `Flags.tsx` | The Greek and UK flags, drawn as SVG so no image files are needed. |
| `Logo.tsx` | **Placeholder** mark. Replace when there is a real logo. |
| `usePrefersReducedMotion.ts` | Reports whether the visitor has asked for less animation. Every animation checks this. |
| `useMediaQuery.ts` | Reports whether a CSS media query currently matches. Used to switch the flipbook to single-page on narrow screens. |

### `src/audio/` — the voiceovers

| File | What it does |
|------|--------------|
| `queue.ts` | Pure maths, no React: the next and previous recording, a clamped skip, and a duration formatted for a person to read. Tested directly, like `pagination.ts`. |
| `AudioPlayerProvider.tsx` | Owns the one `<audio>` element and everything about what is playing. Mounted **above the route table** in `App.tsx`. |
| `AudioPlayer.tsx` | The player card in the bottom-left corner. Renders nothing until something is played. |
| `PlayerIcons.tsx` | The transport glyphs, hand-drawn inline SVG — no icon package, for the same reason as `SocialLinks.tsx`. |
| `AudioPlayer.module.css` | The card, including the rebuilt seek bar (the native one cannot be tinted). |

**Where the recordings live.** Unlike the magazines, the audio is not in this
repo and is not generated by the build. The MP3s sit in a public Cloudflare R2
bucket, and `recordings.ts` holds the list of filenames plus the base URL:

```
  RECORDINGS_BASE / qt<volume> / <filename>
```

`assets/voiceovers/vol-N/file-order.txt` is the record of what was recorded and
in what order. It is the source `recordings.ts` was built from, and
`recordings.test.ts` reads it back and checks the two still agree, so neither
can drift without a test failing.

**Why the provider sits above the routes.** A provider inside the audio page
would be unmounted the moment the visitor navigated, taking its `<audio>`
element and the sound with it. Up in `App.tsx` it survives every navigation, so
a recording keeps playing while the visitor browses the library or reads the
magazine. The queue is one volume: finishing the last recording stops rather
than rolling on into a different volume.

### `src/a11y/` — accessibility

Two separate jobs live here, and it is worth keeping them apart in your head.

The first is **the site's own conformance**: `pageTitle.ts` and
`PageAnnouncer.tsx` give each route its own `<title>` and say out loud when the
page has changed, which a single page application does not do by itself. That
is not optional polish — it is WCAG 2.4.2, and it applies whether or not anyone
ever opens the panel.

The second is **the panel**: the blue button in the bottom-right corner of
every page, offering display preferences.

| File | What it does |
|------|--------------|
| `pageTitle.ts` | Pure, no React: which title belongs to which URL. Tested directly, like `pagination.ts`. |
| `PageAnnouncer.tsx` | Writes `document.title`, and announces navigation through a live region. Renders nothing visible. |
| `settings.ts` | Pure, no React: what the panel can be set to, what is allowed, and how a settings object becomes attributes on `<html>`. The rules live here and nowhere else. Tested directly. |
| `A11yProvider.tsx` | Holds the settings, persists them to this browser, and writes them on to `<html>` in one effect. Mounted above the route table. |
| `AccessibilityWidget.tsx` | The launcher, the card, and the focus handling. |
| `A11yPanel.tsx` | What is inside the card. |
| `A11yIcons.tsx` | Hand-drawn inline SVG, like `PlayerIcons.tsx`. |
| `ReadingAids.tsx` | The reading mask and the reading guide — the only part that watches the pointer. |
| `a11y.css` | The rules every setting is keyed off. Global, not a module, because they are `html[data-*] …` descendant selectors. |

**How the panel works, in one line:** the provider writes `data-a11y-*`
attributes on `<html>`, and `a11y.css` restyles the site by overriding the
tokens in `global.css`. Nothing else in the codebase knows the panel exists.

**The one piece of structure it imposes on the rest of the app.** The greyscale
and negative settings are a CSS `filter`, and a filtered element becomes the
containing block for its `position: fixed` descendants. Put that filter on
`<html>` and the audio player, the reading aids and the accessibility button
all stop being fixed and scroll away with the page. So `App.tsx` wraps the top
bar, the main content and the footer in a `.a11yFilterable` div and keeps every
fixed thing outside it. The top bar is `sticky`, not `fixed`, and is unharmed.

That is also why the panel is painted outside the wrapper: with a treatment on,
it stays in true colour, which matters because it is how the treatment gets
switched off again.

**What it is not.** These are display preferences. The site's own markup and
colours are what make it accessible — see the Accessibility section of
`README.md`, and the measured contrast ratios commented in `global.css`.

### `src/routes/` — the pages

| File | What it does |
|------|--------------|
| `Home.tsx` | Hero (title, buttons, covers) plus the About and About‑us sections. |
| `Library.tsx` | Every volume as a row, with Read and Download. Also the way in to the audio library. |
| `AudioLibrary.tsx` | The recordings, one collapsible section per volume. Volume 3 gets a section too, saying there is nothing yet. |
| `Reader.tsx` | The toolbar, the flipbook, and the thumbnail strip. Keeps the current page in the URL as `?page=12`. |
| `NotFound.tsx` | The 404 page. |

### `src/styles/`

| File | What it does |
|------|--------------|
| `global.css` | The design tokens — every colour, font and easing curve in the project is defined here as a CSS variable. **Change the site's look from this file.** |

The three fonts are `--font-display` (DM Mono, the site's headings and small
caps), `--font-body` (Inter, everything you read) and `--font-title` (Source
Sans 3, the wordmark and nothing else). `--font-title` is kept separate on
purpose: restyling the site's name should never drag the body copy with it.

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

### Colour, and the two accent tokens

`--accent` is a magazine cover colour at full saturation. Two of the four are
light: volume 3's green measures 2.00:1 against the paper and volume 4's yellow
1.20:1, both far below the 4.5:1 that text needs. So there are two tokens.
`--accent` is for backgrounds, borders and glows; **`--accent-ink` is for
anything a reader has to make out** — the "ΤΟΜΟΣ 4" labels, the active toolbar
toggle, the current thumbnail. It is the same colour mixed 40% into ink, which
is the largest share that still clears 4.5:1 for every volume.

It is declared on `*` rather than on `:root`, and that is not an accident: a
`var()` inside a custom property is substituted on the element that *declares*
it, so a `:root` declaration would resolve once against volume 1's pink and
every row would inherit that finished colour. The comment in `global.css`
spells this out.

### Reduced motion

Some people get motion sick from animation, and their operating system can say
so. Every animated component checks `usePrefersReducedMotion()` and renders the
finished state instead. `global.css` also disables transitions wholesale as a
backstop.

### Why some logic lives in its own file

`pagination.ts` and `paths.ts` contain no React at all. That is
deliberate: they hold the logic most likely to be subtly wrong, and keeping
them separate means they can be tested directly, without rendering anything.
The tests next to them (`*.test.ts`) double as documentation — reading
`pagination.test.ts` tells you exactly how spreads are meant to behave.

### Adding a volume

1. `assets/magazine_vols/QUALIA 4.pdf`
2. `npm run pages`

That is all. `useVolumes` will find it and the "coming soon" tile becomes a
real cover.

### Adding or changing a recording

1. Upload the file to the bucket, under `qt<volume>/`.
2. Add a line to that volume's list in `src/data/recordings.ts`.
3. `npm run check:audio` to confirm the link resolves.

To rename one on the site, change its `alias` — that is the only field a
visitor ever sees. To repoint one, change its `file`. Volume 3 is an empty list
waiting to be filled in the same way.

Note that `recordings.test.ts` compares the list against
`assets/voiceovers/vol-N/file-order.txt`, so adding a recording means adding it
to both — which is the point: the text file stays a truthful record of what was
recorded.

### Changing text

`src/i18n/el.json` and `src/i18n/en.json`. Nothing else. The recordings'
aliases are the one exception: they contain no language, so they live in
`src/data/recordings.ts` instead.
