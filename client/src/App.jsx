import { RouterProvider } from 'react-router-dom';
import { Providers } from '@/app/providers';
import { createAppRouter } from '@/app/router';

const router = createAppRouter();

export default function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
