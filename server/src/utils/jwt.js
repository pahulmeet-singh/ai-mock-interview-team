import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const COOKIE_NAME = 'mockroom_token';

export const signToken = (user) => jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
export const verifyToken = (token) => jwt.verify(token, env.JWT_SECRET);

// The token lives in an HttpOnly cookie: JavaScript in the page can never read it, which blunts XSS token theft.
const cookieBase = () => ({
  httpOnly: true,
  sameSite: env.COOKIE_SAMESITE,
  secure: env.NODE_ENV === 'production' || env.COOKIE_SAMESITE === 'none',
  path: '/',
});

export function setAuthCookie(res, token) {
  const { exp } = jwt.decode(token);
  res.cookie(COOKIE_NAME, token, { ...cookieBase(), maxAge: exp * 1000 - Date.now() });
}

export const clearAuthCookie = (res) => res.clearCookie(COOKIE_NAME, cookieBase());
