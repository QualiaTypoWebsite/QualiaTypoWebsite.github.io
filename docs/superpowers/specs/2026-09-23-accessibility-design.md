# Accessibility — design

The site is to meet **WCAG 2.2 Level AA**, and then to carry a visitor-facing
panel of display preferences on top of that.

Two phases, in this order and not the other way round:

1. **Make the site itself conform.** Contrast, focus, headings, titles, labels.
2. **Add the preference panel.** A convenience layer for visitors, sitting on
   a site that already works without it.

The order matters and is the whole argument of this document. See
"Why the panel is second" at the end.

---

## Phase 1 — what was wrong

Every colour pair in the palette was measured rather than judged by eye. Much
of the site already passed: language handling, reduced motion, alt text, the
flipbook's keyboard and drag alternatives, and icon labelling were all correct
before this work started. What follows is only what failed.

### Contrast

| Token | Was | Measured | Now | Now measures |
|---|---|---|---|---|
| `--ink-faint` | `#9a938b` | **2.87:1** on paper | `#6e675f` | **4.74:1** worst case |
| control borders | `--rule` `#e2dbd1` | **1.30:1** | `--rule-strong` `#8a8279` | **3.22:1** worst case |
| focus ring | `var(--accent)` | **1.20:1** on a volume 4 page | `--focus-ring` `#1a1a1a` | **14.79:1** worst case |

"Worst case" means the least contrasty of the five surfaces the site actually
paints: `--paper`, `--paper-sunk`, the blush wash on the About section, the
periwinkle wash on the About-us section, and the reader's accent glow at
volume 4's yellow. A colour that passes on paper but fails on a wash is not
fixed, so all five are checked.

`--ink-faint` carried the entire footer, every section eyebrow, the hero
tagline, the scroll hint and the reader hint — all of it below the 4.5:1 that
1.4.3 requires for body text. Darkening the one token fixes every use at once,
which is why the token existed in the first place.

`--rule` is kept exactly as it was for decorative separators — the footer's top
rule, the section dividers — where nothing is being communicated by the line.
`--rule-strong` is only for the boundary of something you can operate: toolbar
buttons, the language pill, the menu toggle, quiet buttons. 1.4.11 applies to
the second kind and not the first, and keeping two tokens means the site does
not lose its lightness everywhere to satisfy a rule about controls.

The focus ring was the worst of the three, and the most interesting. It
inherited `var(--accent)`, so on a volume 4 page it was drawn in `#f5e849` at
**1.20:1** — invisible. The fix is a dedicated `--focus-ring` token in ink,
which works because `outline-offset` draws the ring *outside* the element, on
whatever surface is behind it — and every surface on this site is paper-toned,
including a magazine page. A dark ring is therefore the one colour that is safe
everywhere, and the token can be flipped wholesale by the high-contrast mode in
phase 2.

The old rule also carried `border-radius: 3px`, which applied to the focused
element itself and squared off the round social buttons the moment they took
keyboard focus. Modern browsers follow an element's own `border-radius` when
drawing an outline, so the declaration was removed rather than replaced.

### Structure and labelling

- **The skip link said "Menu".** It was labelled `t('nav.menu')`. It now has
  its own `a11y.skipToContent` string, and `<main>` takes `tabIndex={-1}` so
  the jump actually moves focus rather than only scrolling.
- **The reader had no `<h1>`.** It now has a visually hidden one naming the
  volume.
- **`<title>` was `Qualia Typo` on all five routes**, and navigation was
  silent to a screen reader. Both are fixed by one small piece of logic
  (`documentTitle`, in `src/a11y/`) driving `document.title` and a polite live
  region.
- **`aria-label` sat on plain `<div>`s** — the thumbnail strip, the "coming
  soon" tiles — where assistive technology ignores it, because a `div` has no
  role for the label to name. Real roles were added.
- **The seek bar's thumb was 12px** against the 24×24 that 2.5.8 requires.
- **The language switcher's label is English text on a Greek page**, which
  needs `lang` so it is not read in the wrong accent (3.1.2).
- **The sticky bar could hide a focused element** when tabbing down the page
  (2.4.11); focus targets now carry `scroll-margin-top`.
- **No Windows High Contrast Mode path** — in forced-colors every `color-mix()`
  background silently vanished.

`body { font-size: 17px }` was also changed to `rem` off a `100%` root. This is
**not** a 1.4.4 failure, because browser zoom satisfies that criterion on its
own; but px ignores a visitor who has raised their browser's default font size,
and the change is also what makes the panel's font zoom possible in phase 2.

---

## Phase 2 — the panel

A round button in the bottom-right corner of every page, opening a floating
card of display preferences.

### Shape of the code

`src/a11y/`, following `src/audio/` — the pure logic separated from the React,
the data in one editable place, the icons hand-drawn.

| File | Job |
|---|---|
| `settings.ts` | No React. The settings type, the defaults, the clamping, and the mapping from settings to `<html>` attributes. Tested directly. |
| `A11yProvider.tsx` | Holds the settings, persists them, writes them onto `<html>`. |
| `A11yButton.tsx` | The launcher. |
| `A11yPanel.tsx` | The card. |
| `A11yIcons.tsx` | Inline SVG, like `PlayerIcons.tsx`. |
| `ReadingAids.tsx` | The mask and the guide — the only part that watches the pointer. |
| `a11y.css` | The `html[data-*]` rules and the OpenDyslexic `@font-face`. |

The provider is mounted **above the route table** in `App.tsx`, for the same
reason the audio player is: a provider inside a route is unmounted on
navigation, and the visitor's settings would reset every time they opened a
volume.

### How each preference works

Every one is a token override on `<html>`. That is possible only because the
site already funnels all colour through `global.css` and all type through three
font tokens — the panel changes those tokens and the whole site follows.

| Preference | Mechanism |
|---|---|
| Font zoom | `--a11y-font-scale`, 100%–160% in ten-point steps. Depends on phase 1's `rem` change. |
| Grayscale, negative | A fixed `pointer-events: none` overlay using `backdrop-filter`. |
| High contrast | A token override, not a filter. |
| Underline links | One rule. |
| Cursor zoom | An SVG data-URI cursor at two sizes. No asset files. |
| Dyslexia font | Overrides the three font tokens. |
| Text spacing | The four values named in WCAG 1.4.12. |
| Reading mask, guide | A fixed overlay following the pointer. |
| Reset | Back to defaults, storage cleared. |

Three of these need their reasoning recorded, because each looks like a smaller
decision than it is.

**Why `backdrop-filter` and not `filter`.** Putting `filter` on `<html>` is the
obvious way to grey out or invert a page, and it is a trap: a filtered element
becomes the containing block for its `position: fixed` descendants, so every
fixed thing on the site — the audio player, the reading aids, and the
accessibility button itself — would stop being fixed and scroll away. A fixed,
transparent, non-interactive overlay with `backdrop-filter` produces the same
picture and changes no layout at all. The panel is painted above that overlay,
so it stays legible in negative contrast instead of inverting along with
everything else.

**Why high contrast is not a filter.** No filter can create contrast; `contrast()`
stretches what is already there and blows out the pastels on the way. Since the
site's colours are all tokens, the honest implementation is to redefine them —
a near-black ground with white text — which produces a real high-contrast theme
rather than a harsh version of a quiet one.

**Why grayscale, high contrast and negative are one setting.** They are stored
as a single `filter` field rather than three booleans, because stacking them
produces nonsense: grayscale plus negative is grey, inverted, and no more
readable than either alone.

Under negative contrast, images are inverted a second time by a rule of their
own, so the artwork comes out true while the chrome inverts. This is a
deliberate departure from how most such widgets behave, and it is the right one
here: the site exists to show an art magazine, and showing the art in negative
defeats the purpose of the page.

The reading mask and guide are hidden on touch devices. Both follow the
pointer, and a pointer-driven reading aid does nothing on a phone.

### What was asked for and not built

**Bionic-style bolding of the first letters of each word** was requested as
"marking" and is deliberately absent. Three reasons, in order of weight:

1. The evidence does not support it. *"No, Bionic Reading does not work"*
   (Acta Psychologica, 2024) found no difference in reading speed or
   comprehension, and a 2025 eye-tracking study agreed. Nothing shows a
   dyslexia-specific benefit.
2. It would harm the people it claims to help. Bolding part of a word means
   splitting every word into two elements, and some screen readers and most
   braille displays treat that as a word boundary.
3. It cannot be done cleanly here. The only site-wide implementation is to walk
   and rewrite the text nodes React owns, and redo it on every re-render — of
   which this site has many, from page turns to the audio player's timer.

**Text spacing** stands in its place: evidence-backed for dyslexic readers, and
itself a WCAG success criterion.

### The panel's own accessibility

A disclosure, not a modal. Escape and click-outside close it, focus returns to
the launcher, and the page stays usable while it is open — which matters here,
because the whole point is to watch what each toggle does to the page behind
it. The mutually exclusive filters are toggle buttons with `aria-pressed`
rather than radios, so that pressing the active one turns it off.

---

## Why the panel is second

Bolt-on accessibility overlays are discredited, and for good reasons: they are
sold as instant compliance, they fix perhaps a third of what is actually wrong,
and they routinely fight the assistive technology they claim to assist. In
January 2025 the US Federal Trade Commission fined one vendor $1M over its
compliance claims, and in the same year 28% of US accessibility lawsuits were
filed against sites that had an overlay installed.

That verdict is about third-party scripts sold as a substitute for the work.
This panel is not one. It is first-party, it ships with the site, it stores
nothing anywhere but the visitor's own browser, and it sits on top of a site
that conforms on its own — because phase 1 came first.

So the panel is described everywhere in this project as what it is: a set of
display preferences, offered as a convenience. Nothing in the README, the
interface, or this document claims that the button makes the site accessible.
Phase 1 is what makes the site accessible.
