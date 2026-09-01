import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MapView } from './MapView';

describe('MapView', () => {
  afterEach(() => {
    // vitest.config.ts has `globals: false`, so @testing-library/react's
    // automatic afterEach(cleanup) registration (which checks for a global
    // `afterEach`) never fires — without this, each test's DOM nodes leak
    // into the next test.
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders the map without an account/login prompt, even with zero listings', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => [],
      })),
    );

    render(<MapView />);

    expect(screen.getByRole('heading', { name: 'GéoEmploi' })).toBeTruthy();
    expect(screen.queryByText(/login/i)).toBeNull();
    expect(screen.queryByText(/connexion/i)).toBeNull();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/listings');
    });
  });

  it('keeps the map usable and shows a status banner when the listings fetch rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Network request failed');
      }),
    );

    render(<MapView />);

    // Map/page must not go blank — heading still renders.
    expect(screen.getByRole('heading', { name: 'GéoEmploi' })).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toMatch(
        /n'ont pas pu être chargées/,
      );
    });
  });

  it('keeps the map usable and shows a status banner when the listings response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({}),
      })),
    );

    render(<MapView />);

    expect(screen.getByRole('heading', { name: 'GéoEmploi' })).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toMatch(
        /n'ont pas pu être chargées/,
      );
    });
  });
});
