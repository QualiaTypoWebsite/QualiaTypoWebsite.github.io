# Audio library — design

An audio library page listing the magazine's voiceover recordings, with a
player that keeps playing as the visitor moves around the site.

## Why

Volumes 1, 2 and 4 have been recorded as voiceovers, one file per article or
spread, and the files are hosted in a public Cloudflare R2 bucket. The site has
no way to reach them. Volume 3 has not been recorded.

## Scope

- A new page at `/audio` (`/en/audio`), reached from a button under the
  library's "Every volume" heading.
- One collapsible section per volume, including volume 3, which opens onto a
  "no recordings yet" message.
- A "play from the start" button per volume, and a play button per recording.
- A player fixed to the bottom-left corner: title, seek bar, play/pause,
  ±5 seconds, previous/next track.

Out of scope: a top-bar link, downloads, transcripts, playback speed,
per-recording deep links, and any tie between a recording and the page of the
magazine it reads.

## Data

`src/data/recordings.ts` holds a `Recording[]` per volume. Each entry carries
the file's exact name in the bucket and the alias shown on the site; an
optional `url` overrides the computed link for a single recording that has been
moved elsewhere.

Aliases follow `vol<volume>-part<position>`, where position is 1-based within
the volume. They are language-neutral and so live here rather than in the i18n
files.

URLs are `RECORDINGS_BASE/qt<volume>/<file>`, with the filename passed through
`encodeURIComponent`. The encoding is not cosmetic: four filenames contain
spaces, Greek letters or a comma.

The order is the order in `assets/voiceovers/vol-N/file-order.txt`, which
follows the magazine. A test reads those files and asserts the data still
matches, so the two cannot drift apart unnoticed.

## Playback

Playback state lives in `AudioPlayerProvider`, mounted in `App.tsx` above the
route table, because a provider inside a route would be unmounted on navigation
and the sound would stop. It owns the one `<audio>` element and exposes play,
toggle, seek, next, previous and close.

The queue is a single volume. Finishing a track advances to the next one in the
same volume; finishing the last one stops rather than rolling into another
volume, and previous/next are disabled at the ends. The volume being played
sets the player's accent colour.

`src/audio/queue.ts` holds the pure parts — next and previous index, clamped
seeking, time formatting — with no React in it, so it can be tested directly,
in the manner of `pagination.ts` and `paths.ts`.

## Interface

The page reuses the library's visual language: one row per volume, each row
setting `--accent` to its own cover colour. Rows are collapsed by default and
carry `aria-expanded`/`aria-controls`; the height animation has a
`prefers-reduced-motion` path that renders the open state outright.

The player is hidden until the first play, then slides up from the bottom-left.
Its icons are inline SVG, as in `SocialLinks.tsx` — too few glyphs to justify a
package.

All user-facing text goes in `el.json` and `en.json` under `audio.*`.

## Verification

- `queue.test.ts` for the pure logic.
- `recordings.test.ts` for alias shape and uniqueness, and for agreement with
  the `file-order.txt` files.
- Additions to `App.test.tsx`: the library's new button, the page's four
  sections, volume 3's empty state, and that pressing play produces an
  `<audio>` element pointing at the correctly encoded bucket URL.
- `scripts/check-recordings.mjs` (`npm run check:audio`) requests every URL and
  reports any that do not answer, for re-verifying after a bucket change.

`test-setup.ts` must stub `HTMLMediaElement.play` and `pause`, which jsdom does
not implement.
