/**
 * The accessibility panel, exercised the way a visitor would use it.
 *
 * settings.test.ts covers the rules; this file covers the wiring — that
 * pressing a control really does put the attribute on <html> that a11y.css is
 * keyed off, that the panel can be opened and closed from the keyboard, and
 * that a preference survives a reload.
 *
 * Note what is deliberately not tested here: what the page then *looks* like.
 * jsdom has no layout and no colour, so a test asserting on the greyscale
 * overlay would only be asserting that the same string is in two files. The
 * contract worth pinning down is the attribute.
 */
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { A11Y_STORAGE_KEY } from './A11yProvider';

const INDEX = {
  volumes: [{ volume: 1, pages: 67, width: 1400, height: 1986, pdf: 'qualia-typo-vol-1.pdf' }],
};

function renderAt(path = '/en') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

/** Renders the app, opens the panel, and hands back the pieces a test needs. */
async function openPanel(path = '/en') {
  renderAt(path);
  const user = userEvent.setup();
  const launcher = await screen.findByRole('button', { name: 'Accessibility tools' });
  await user.click(launcher);
  const panel = await screen.findByRole('group', { name: 'Accessibility' });
  return { user, launcher, panel };
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(INDEX), { status: 200 })));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
  // The settings live on <html>, which is shared across tests in a file.
  for (const name of [...document.documentElement.getAttributeNames()]) {
    if (name.startsWith('data-a11y-')) document.documentElement.removeAttribute(name);
  }
  document.documentElement.style.removeProperty('--a11y-font-scale');
});

describe('the launcher', () => {
  it('is on the page, labelled, and starts closed', async () => {
    renderAt();
    const launcher = await screen.findByRole('button', { name: 'Accessibility tools' });
    expect(launcher).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('group', { name: 'Accessibility' })).not.toBeInTheDocument();
  });

  it('is present on every page, not only the homepage', async () => {
    renderAt('/en/library');
    expect(await screen.findByRole('button', { name: 'Accessibility tools' })).toBeInTheDocument();
  });

  it('appears in Greek at the root', async () => {
    renderAt('/');
    expect(await screen.findByRole('button', { name: 'Εργαλεία προσβασιμότητας' }))
      .toBeInTheDocument();
  });
});

describe('opening and closing', () => {
  it('opens on click and moves focus into the card', async () => {
    const { panel } = await openPanel();
    expect(screen.getByRole('button', { name: 'Accessibility tools' }))
      .toHaveAttribute('aria-expanded', 'true');
    // Focus lands on Close, so the next Tab is a control rather than the page.
    expect(within(panel).getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  it('closes on Escape and hands focus back to the launcher', async () => {
    const { user, launcher } = await openPanel();
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('group', { name: 'Accessibility' })).not.toBeInTheDocument(),
    );
    expect(launcher).toHaveFocus();
  });

  it('closes on the close button', async () => {
    const { user, panel, launcher } = await openPanel();
    await user.click(within(panel).getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('group', { name: 'Accessibility' })).not.toBeInTheDocument(),
    );
    expect(launcher).toHaveFocus();
  });
});

describe('the settings reach the document', () => {
  const root = () => document.documentElement;

  it('underlines links', async () => {
    const { user, panel } = await openPanel();
    const toggle = within(panel).getByRole('button', { name: 'Underline links' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(root()).toHaveAttribute('data-a11y-underline', 'on');

    await user.click(toggle);
    expect(root()).not.toHaveAttribute('data-a11y-underline');
  });

  it('switches the dyslexia font and the text spacing', async () => {
    const { user, panel } = await openPanel();
    await user.click(within(panel).getByRole('button', { name: 'Dyslexia-friendly font' }));
    await user.click(within(panel).getByRole('button', { name: 'Text spacing' }));
    expect(root()).toHaveAttribute('data-a11y-font', 'dyslexic');
    expect(root()).toHaveAttribute('data-a11y-spacing', 'on');
  });

  it('keeps the three colour treatments mutually exclusive', async () => {
    const { user, panel } = await openPanel();
    const grayscale = within(panel).getByRole('button', { name: 'Grayscale' });
    const negative = within(panel).getByRole('button', { name: 'Negative contrast' });

    await user.click(grayscale);
    expect(root()).toHaveAttribute('data-a11y-contrast', 'grayscale');

    // Choosing another one replaces it rather than stacking on top of it.
    await user.click(negative);
    expect(root()).toHaveAttribute('data-a11y-contrast', 'negative');
    expect(grayscale).toHaveAttribute('aria-pressed', 'false');
    expect(negative).toHaveAttribute('aria-pressed', 'true');

    // And pressing the active one again turns it off, which a radio could not.
    await user.click(negative);
    expect(root()).not.toHaveAttribute('data-a11y-contrast');
  });

  it('steps the text size, and says what it is now', async () => {
    const { user, panel } = await openPanel();
    // Both steppers read "100%" at rest, so each is scoped by its own name —
    // which is the reason they are named groups in the first place.
    const size = within(panel).getByRole('group', { name: 'Text size' });
    expect(within(size).getByText('100%')).toBeInTheDocument();

    await user.click(within(size).getByRole('button', { name: 'Larger text' }));
    expect(within(size).getByText('110%')).toBeInTheDocument();
    expect(root().style.getPropertyValue('--a11y-font-scale')).toBe('1.1');

    await user.click(within(size).getByRole('button', { name: 'Smaller text' }));
    expect(root().style.getPropertyValue('--a11y-font-scale')).toBe('');
  });

  it('stops the text size at its maximum rather than running on', async () => {
    const { user, panel } = await openPanel();
    const size = within(panel).getByRole('group', { name: 'Text size' });
    const bigger = within(size).getByRole('button', { name: 'Larger text' });
    for (let i = 0; i < 10; i += 1) {
      if (!(bigger as HTMLButtonElement).disabled) await user.click(bigger);
    }
    expect(within(size).getByText('160%')).toBeInTheDocument();
    expect(bigger).toBeDisabled();
  });

  it('names each stepper, so the two are told apart', async () => {
    const { panel } = await openPanel();
    expect(within(panel).getByRole('group', { name: 'Text size' })).toBeInTheDocument();
    expect(within(panel).getByRole('group', { name: 'Pointer size' })).toBeInTheDocument();
  });

  it('names the two custom cursor sizes', async () => {
    const { user, panel } = await openPanel();
    await user.click(within(panel).getByRole('button', { name: 'Larger pointer' }));
    expect(root()).toHaveAttribute('data-a11y-cursor', 'large');
    await user.click(within(panel).getByRole('button', { name: 'Larger pointer' }));
    expect(root()).toHaveAttribute('data-a11y-cursor', 'huge');
  });
});

describe('reset', () => {
  it('is unavailable until something has been changed', async () => {
    const { user, panel } = await openPanel();
    const reset = within(panel).getByRole('button', { name: 'Reset settings' });
    expect(reset).toBeDisabled();

    await user.click(within(panel).getByRole('button', { name: 'Underline links' }));
    expect(reset).toBeEnabled();
  });

  it('puts everything back and empties the stored preferences', async () => {
    const { user, panel } = await openPanel();
    await user.click(within(panel).getByRole('button', { name: 'Underline links' }));
    await user.click(within(panel).getByRole('button', { name: 'High contrast' }));
    await user.click(within(panel).getByRole('button', { name: 'Larger text' }));
    expect(window.localStorage.getItem(A11Y_STORAGE_KEY)).not.toBeNull();

    await user.click(within(panel).getByRole('button', { name: 'Reset settings' }));

    expect(document.documentElement).not.toHaveAttribute('data-a11y-underline');
    expect(document.documentElement).not.toHaveAttribute('data-a11y-contrast');
    expect(document.documentElement.style.getPropertyValue('--a11y-font-scale')).toBe('');
    // Nothing left behind: defaults are stored as the absence of a key.
    expect(window.localStorage.getItem(A11Y_STORAGE_KEY)).toBeNull();
  });
});

describe('remembering', () => {
  it('restores a preference on the next visit', async () => {
    const { user, panel } = await openPanel();
    await user.click(within(panel).getByRole('button', { name: 'Dyslexia-friendly font' }));

    // Unmount and mount again: the visitor closing the tab and coming back.
    cleanup();
    document.documentElement.removeAttribute('data-a11y-font');
    renderAt('/en/library');

    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute('data-a11y-font', 'dyslexic'),
    );
  });

  it('ignores stored settings that have gone bad', async () => {
    window.localStorage.setItem(A11Y_STORAGE_KEY, 'not json');
    renderAt();
    await screen.findByRole('button', { name: 'Accessibility tools' });
    // A working site rather than a blank page.
    expect(document.documentElement).not.toHaveAttribute('data-a11y-contrast');
  });
});
