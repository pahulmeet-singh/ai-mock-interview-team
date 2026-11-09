import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/bricolage-grotesque';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <main className="p-10">
      <h1 className="font-display text-3xl font-semibold">Mockroom</h1>
      <p className="mt-2 text-muted-foreground">Design tokens and fonts are wired up.</p>
    </main>
  </StrictMode>,
);
