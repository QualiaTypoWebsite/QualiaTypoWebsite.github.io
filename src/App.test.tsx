/**
 * Whole-app tests: real pages are rendered and then poked at the way a visitor
 * would, rather than testing components in isolation.
 *
 * This is the safety net for the things that would be most embarrassing to
 * break — the site failing to load, the wrong language appearing, a volume not
 * opening, a social link pointing at the wrong place.
 *
 * Everything runs in jsdom, a fake browser. The fetch of index.json is stubbed
 * here (there is no server in a test), and the browser features jsdom is
 * missing are filled in by test-setup.ts.
 */
import { render, screen, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

const INDEX = {
  volumes: [
    { volume: 1, pages: 67, width: 1400, height: 1986, pdf: 'qualia-typo-vol-1.pdf' },
    { volume: 2, pages: 70, width: 1400, height: 1986, pdf: 'qualia-typo-vol-2.pdf' },
    { volume: 3, pages: 60, width: 1400, height: 1986, pdf: 'qualia-typo-vol-3.pdf' },
  ],
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(INDEX), { status: 200 })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the homepage', () => {
  it('mounts in Greek by default', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Qualia Typo.');
    expect(screen.getByText('Ξεκινήστε τον τόμο 1')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('el');
  });

  it('mounts in English under /en', async () => {
    renderAt('/en');
    expect(await screen.findByText('Start reading vol. 1')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  it('offers the other language, pointing at the mirrored path', async () => {
    renderAt('/library');
    const toggle = await screen.findByRole('link', { name: /Switch to English/i });
    expect(toggle).toHaveAttribute('href', '/en/library');
  });

  it('shows every published cover plus a placeholder for volume 4', async () => {
    renderAt('/');
    const grid = await screen.findByRole('list', { name: 'Τόμοι του Qualia Typo' });
    expect(await within(grid).findAllByRole('img')).toHaveLength(3);
    // The tile's volume number used to be an aria-label on a bare <div>, which
    // assistive technology ignores; it is real (visually hidden) text now, so
    // this looks it up the way a screen reader would find it.
    expect(within(grid).getByText(/Τόμος 4 — σύντομα/)).toBeInTheDocument();
  });
});

describe('the library', () => {
  it('lists published volumes with a download link', async () => {
    renderAt('/en/library');
    expect(await screen.findByRole('heading', { name: 'Every volume' })).toBeInTheDocument();
    const downloads = await screen.findAllByRole('link', { name: 'Download PDF' });
    expect(downloads).toHaveLength(3);
    expect(downloads[0]).toHaveAttribute('href', '/magazines/vol-1/qualia-typo-vol-1.pdf');
  });
});

describe('the reader', () => {
  it('opens a volume at its cover', async () => {
    renderAt('/read/2');
    expect(await screen.findByText('Σελίδα 1 από 70')).toBeInTheDocument();
  });

  it('honours a deep-linked page', async () => {
    renderAt('/read/2?page=12');
    expect(await screen.findByText('Σελίδα 12 από 70')).toBeInTheDocument();
  });

  it('clamps a page beyond the end of the volume', async () => {
    renderAt('/read/3?page=999');
    expect(await screen.findByText('Σελίδα 60 από 60')).toBeInTheDocument();
  });

  it('explains itself when the volume does not exist', async () => {
    renderAt('/en/read/4');
    expect(await screen.findByText("That volume isn't available yet.")).toBeInTheDocument();
  });
});

describe('the social buttons in the footer', () => {
  it('link out to every network, with the email one as a mailto:', async () => {
    renderAt('/en');

    const links = {
      'Qualia Typo on Instagram': 'https://www.instagram.com/PLACEHOLDER/',
      'Qualia Typo on Facebook': 'https://www.facebook.com/PLACEHOLDER',
      'All our links on Linktree': 'https://linktr.ee/PLACEHOLDER',
      'Email us': 'mailto:qualiatypowebsite@gmail.com',
    };

    for (const [name, href] of Object.entries(links)) {
      expect(await screen.findByRole('link', { name })).toHaveAttribute('href', href);
    }
  });

  it('sends the outbound ones to a new tab, but not the mailto:', async () => {
    renderAt('/en');
    expect(await screen.findByRole('link', { name: 'Qualia Typo on Instagram' }))
      .toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'Email us' })).not.toHaveAttribute('target');
  });
});

describe('the audio library', () => {
  const BUCKET = 'https://pub-e61841570dd448b7948dfe96745e70f5.r2.dev';

  /** Opens one volume's section and hands back what is inside it. */
  async function openVolume(n: number) {
    const user = userEvent.setup();
    const summary = await screen.findByRole('button', { name: new RegExp(`Qualia Typo #${n}`) });
    await user.click(summary);
    expect(summary).toHaveAttribute('aria-expanded', 'true');
    return user;
  }

  it('is reachable from the library page', async () => {
    renderAt('/en/library');
    expect(await screen.findByRole('link', { name: 'Audio library' }))
      .toHaveAttribute('href', '/en/audio');
  });

  it('gives every volume a section, recorded or not', async () => {
    renderAt('/en/audio');
    expect(await screen.findByRole('heading', { name: 'Listen to the magazine' }))
      .toBeInTheDocument();
    for (const n of [1, 2, 3, 4]) {
      expect(screen.getByRole('button', { name: new RegExp(`Qualia Typo #${n}`) }))
        .toBeInTheDocument();
    }
  });

  it('starts with every section closed', async () => {
    renderAt('/en/audio');
    const summary = await screen.findByRole('button', { name: /Qualia Typo #1/ });
    expect(summary).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Play vol1-part1' })).not.toBeInTheDocument();
  });

  it('says so when a volume has nothing recorded', async () => {
    renderAt('/en/audio');
    await openVolume(3);
    expect(await screen.findByText('No recordings yet for this volume.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Play from the start' })).not.toBeInTheDocument();
  });

  it('lists a volume\'s recordings under their aliases, in order', async () => {
    renderAt('/en/audio');
    await openVolume(2);
    const tracks = await screen.findAllByRole('listitem');
    // A track reads "07vol2-part7"; the volume's own <li> wraps them all, so
    // matching from the start of the text is what keeps it out of the count.
    const names = tracks
      .map((li) => li.textContent ?? '')
      .filter((text) => /^\d{2}vol2-part\d+$/.test(text));
    expect(names).toHaveLength(25);
    expect(names[0]).toContain('vol2-part1');
    expect(names[24]).toContain('vol2-part25');
  });

  it('plays a recording from the bucket and shows it in the player', async () => {
    renderAt('/en/audio');
    const user = await openVolume(1);

    expect(screen.queryByRole('complementary', { name: 'Audio player' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Play vol1-part1' }));

    const player = await screen.findByRole('complementary', { name: 'Audio player' });
    expect(within(player).getByText('vol1-part1')).toBeInTheDocument();
    expect(screen.getByTestId('audio-element'))
      .toHaveAttribute('src', `${BUCKET}/qt1/qt1p4.mp3`);
  });

  // The four awkward filenames are the reason the URL is encoded at all.
  it('encodes a filename with a space in it', async () => {
    renderAt('/en/audio');
    const user = await openVolume(1);
    await user.click(screen.getByRole('button', { name: 'Play vol1-part3' }));
    expect(screen.getByTestId('audio-element'))
      .toHaveAttribute('src', `${BUCKET}/qt1/qt1p8%20periehomena.mp3`);
  });

  it('starts a volume at its first recording', async () => {
    renderAt('/en/audio');
    const user = await openVolume(4);
    await user.click(screen.getByRole('button', { name: 'Play from the start' }));

    const player = await screen.findByRole('complementary', { name: 'Audio player' });
    expect(within(player).getByText('vol4-part1')).toBeInTheDocument();
    expect(screen.getByTestId('audio-element'))
      .toHaveAttribute('src', `${BUCKET}/qt4/qt4tokitrino.mp3`);
  });

  it('steps between recordings, and stops at the ends of the volume', async () => {
    renderAt('/en/audio');
    const user = await openVolume(1);
    await user.click(screen.getByRole('button', { name: 'Play vol1-part1' }));

    const player = await screen.findByRole('complementary', { name: 'Audio player' });
    expect(within(player).getByRole('button', { name: 'Previous recording' })).toBeDisabled();

    await user.click(within(player).getByRole('button', { name: 'Next recording' }));
    expect(within(player).getByText('vol1-part2')).toBeInTheDocument();

    await user.click(within(player).getByRole('button', { name: 'Previous recording' }));
    expect(within(player).getByText('vol1-part1')).toBeInTheDocument();
  });

  it('pauses and resumes the recording it is on', async () => {
    renderAt('/en/audio');
    const user = await openVolume(2);
    await user.click(screen.getByRole('button', { name: 'Play vol2-part1' }));

    const player = await screen.findByRole('complementary', { name: 'Audio player' });
    await user.click(within(player).getByRole('button', { name: 'Pause' }));
    expect(within(player).getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  it('keeps playing when the visitor moves to another page', async () => {
    renderAt('/en/audio');
    const user = await openVolume(1);
    await user.click(screen.getByRole('button', { name: 'Play vol1-part1' }));
    await screen.findByRole('complementary', { name: 'Audio player' });

    await user.click(screen.getByRole('link', { name: 'Back to the library' }));
    expect(await screen.findByRole('heading', { name: 'Every volume' })).toBeInTheDocument();

    const player = screen.getByRole('complementary', { name: 'Audio player' });
    expect(within(player).getByText('vol1-part1')).toBeInTheDocument();
    expect(screen.getByTestId('audio-element'))
      .toHaveAttribute('src', `${BUCKET}/qt1/qt1p4.mp3`);
  });

  it('dismisses the player when it is closed', async () => {
    renderAt('/en/audio');
    const user = await openVolume(1);
    await user.click(screen.getByRole('button', { name: 'Play vol1-part1' }));

    const player = await screen.findByRole('complementary', { name: 'Audio player' });
    await user.click(within(player).getByRole('button', { name: 'Close the player' }));
    // The card animates out, so it lingers for a frame after the click.
    await waitForElementToBeRemoved(() =>
      screen.queryByRole('complementary', { name: 'Audio player' }),
    );
  });

  it('renders the page in Greek at the root', async () => {
    renderAt('/audio');
    expect(await screen.findByRole('heading', { name: 'Ακούστε το περιοδικό' })).toBeInTheDocument();
  });
});

describe('accessibility', () => {
  it('offers a skip link that says what it does, and points at <main>', async () => {
    renderAt('/en');
    // This used to be labelled with t('nav.menu'), so the first thing a
    // keyboard visitor met on every page was a link reading "Menu".
    const skip = await screen.findByRole('link', { name: 'Skip to content' });
    expect(skip).toHaveAttribute('href', '#main');

    // And <main> has to be focusable, or the jump scrolls without moving focus.
    expect(document.querySelector('main')).toHaveAttribute('tabindex', '-1');
  });

  it('gives every route its own document title', async () => {
    renderAt('/en/library');
    await screen.findByRole('heading', { name: 'Every volume' });
    expect(document.title).toBe('Library · Qualia Typo');
  });

  it('names the volume in the reader title, in the right language', async () => {
    renderAt('/read/2');
    await screen.findByText('Σελίδα 1 από 70');
    expect(document.title).toBe('Τόμος 2 · Qualia Typo');
  });

  it('announces the new page after navigating, but not on arrival', async () => {
    renderAt('/en/library');
    await screen.findByRole('heading', { name: 'Every volume' });
    const status = screen.getByRole('status');
    // Arriving is already narrated by the browser reading the title.
    expect(status).toHaveTextContent('');

    const user = userEvent.setup();
    await user.click(screen.getByRole('link', { name: 'Audio library' }));
    await screen.findByRole('heading', { name: 'Listen to the magazine' });
    expect(status).toHaveTextContent('Navigated to Audio library · Qualia Typo');
  });

  it('gives the reader an h1, which it did not have at all', async () => {
    renderAt('/en/read/2');
    expect(await screen.findByRole('heading', { level: 1 }))
      .toHaveTextContent('Qualia Typo — volume 2');
  });

  it('marks the language switcher as being written in the language it leads to', async () => {
    renderAt('/library');
    // Greek page, English label: without lang, a screen reader reads
    // "Switch to English" in a Greek voice (WCAG 3.1.2).
    const toggle = await screen.findByRole('link', { name: /Switch to English/i });
    expect(toggle).toHaveAttribute('lang', 'en');
  });

  it('labels the navigation and the reader toolbar as landmarks and groups', async () => {
    renderAt('/en/read/2');
    expect(await screen.findByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Reading tools' })).toBeInTheDocument();
  });
});

describe('unknown routes', () => {
  it('render the 404 page in the right language', async () => {
    renderAt('/en/nowhere');
    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });
});
