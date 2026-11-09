import { ApiError } from '../utils/ApiError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Cookies are sent automatically by the browser, so state-changing requests must prove they came from our own
// JavaScript: a cross-site form or image cannot set a custom header, and a cross-site fetch that tries to would
// trigger a CORS preflight that our origin allow-list rejects.
export function csrfGuard(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.get('x-requested-with') !== 'XMLHttpRequest') {
    throw new ApiError(403, 'Missing X-Requested-With header.');
  }
  next();
}
