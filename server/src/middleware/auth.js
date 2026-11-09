import { ApiError } from '../utils/ApiError.js';
import { COOKIE_NAME, verifyToken } from '../utils/jwt.js';

// Reads the JWT from the HttpOnly cookie and attaches { id, email } to the request.
// Express 5 forwards anything thrown here to the error handler, so no try/next boilerplate is needed.
export function requireAuth(req, _res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw new ApiError(401, 'Please sign in to continue.');
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
  } catch {
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }
  next();
}

// Like requireAuth, but an absent or invalid cookie just means "signed out": the request carries on without req.user.
export function optionalAuth(req, _res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    try {
      const payload = verifyToken(token);
      req.user = { id: payload.sub, email: payload.email };
    } catch {
      // expired or tampered token: treat as signed out
    }
  }
  next();
}
