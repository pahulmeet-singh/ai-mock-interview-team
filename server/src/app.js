import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { csrfGuard } from './middleware/csrfGuard.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.set('trust proxy', env.TRUST_PROXY);
app.disable('x-powered-by');

app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim()), credentials: true }));
if (env.NODE_ENV !== 'test') app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api', generalLimiter);
app.use('/api', csrfGuard);
app.use('/api', routes);

// In production this server also serves the built React app (client/dist). The browser then sees ONE origin:
// first-party cookies, no CORS, no separate static host and no SPA-rewrite rules to configure.
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (env.NODE_ENV === 'production' && existsSync(clientDist)) {
  // Hashed build files never change, so cache them hard. A missing one is a real 404, never index.html.
  app.use('/assets', express.static(path.join(clientDist, 'assets'), { immutable: true, maxAge: '1y' }), (_req, res) => res.status(404).type('text/plain').send('Not found'));
  app.use(express.static(clientDist, { index: false, maxAge: '1h' }));
  // Any other GET (a deep link such as /interviews/abc) gets index.html so the client router can take over.
  app.use((req, res, next) =>
    req.method === 'GET' && !req.path.startsWith('/api')
      ? res.sendFile(path.join(clientDist, 'index.html'), { headers: { 'Cache-Control': 'no-cache' } })
      : next(),
  );
}

app.use(notFound);
app.use(errorHandler);

export default app;
