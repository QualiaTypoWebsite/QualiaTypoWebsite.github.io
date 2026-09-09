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
import { render, screen, within } from '@testing-library/react';
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
    expect(within(grid).getByLabelText(/Τόμος 4 — Σύντομα/)).toBeInTheDocument();
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

describe('unknown routes', () => {
  it('render the 404 page in the right language', async () => {
    renderAt('/en/nowhere');
    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });
});
