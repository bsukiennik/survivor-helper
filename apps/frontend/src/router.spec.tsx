import { createMemoryRouter, RouterProvider } from 'react-router';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { router } from './router';

/**
 * Renders the *actual* route table (not a component in isolation), so a
 * drifted path between the header's <Link to="..."> and this file's route
 * entries would fail here even though each component's own spec passes.
 */
describe('router', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('navigates from the map to the login page when "Se connecter" is clicked', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));

    const memoryRouter = createMemoryRouter(router.routes, { initialEntries: ['/'] });
    render(<RouterProvider router={memoryRouter} />);

    fireEvent.click(screen.getByRole('link', { name: 'Se connecter' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Se connecter' })).toBeTruthy();
    });
  });

  it('shows the not-found page for an unmatched path', async () => {
    const memoryRouter = createMemoryRouter(router.routes, { initialEntries: ['/does-not-exist'] });
    render(<RouterProvider router={memoryRouter} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Page introuvable' })).toBeTruthy();
    });
  });
});
