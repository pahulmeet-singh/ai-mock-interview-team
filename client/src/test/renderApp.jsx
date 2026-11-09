import { render } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { Providers } from '@/app/providers';
import { routes } from '@/app/router';
import { installFakeApi } from './fakeApi';

// Mounts the real app (providers + the real route table) at `path`, with the network replaced by the fake API.
export function renderApp(path = '/', options = {}) {
  const fake = installFakeApi(options);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 }, mutations: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <Providers client={client}>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { fake, router };
}
