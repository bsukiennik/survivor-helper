import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('renders a listing marker popup with full detail and a disabled Apply button', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            id: 'listing-1',
            title: 'Boulanger / Boulangère',
            employerName: 'Boulangerie du Marché',
            location: 'Paris',
            description: 'Poste à temps plein.',
            latitude: 48.8566,
            longitude: 2.3522,
            status: 'published',
          },
        ],
      })),
    );

    const { container } = render(<MapView />);

    await waitFor(() => {
      expect(container.querySelector('.leaflet-marker-icon')).toBeTruthy();
    });

    // react-leaflet's Popup only mounts its children once opened — a real
    // Visitor clicks the marker to see the detail (FR2), so the test does too.
    fireEvent.click(container.querySelector('.leaflet-marker-icon')!);

    await waitFor(() => {
      expect(screen.getByText('Boulanger / Boulangère')).toBeTruthy();
    });
    expect(screen.getByText('Boulangerie du Marché')).toBeTruthy();
    expect(screen.getByText('Paris')).toBeTruthy();
    expect(screen.getByText('Poste à temps plein.')).toBeTruthy();

    const applyButton = screen.getByRole('button', { name: /Postuler/i });
    expect(applyButton.hasAttribute('disabled')).toBe(true);
    expect(screen.getByText(/Créez un compte demandeur d'emploi/i)).toBeTruthy();
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
