import axios from 'axios';

// One configured Axios instance for the whole app.
//  - withCredentials: the browser sends the HttpOnly auth cookie with every request
//  - X-Requested-With: the server's CSRF guard requires it on state-changing requests
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
  timeout: 30_000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

// Every failure reaches the UI in the same shape, whatever went wrong underneath.
export class ApiError extends Error {
  constructor({ status, message, fieldErrors }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors ?? {};
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data?.error;
    const message =
      body?.message ??
      (error.code === 'ECONNABORTED' ? 'The request took too long. Please try again.' : status === 0 ? 'Cannot reach the server. Check your connection.' : 'Something went wrong.');
    // An expired session anywhere in the app signs the user out; the auth probe itself opts out.
    if (status === 401 && !error.config?.skipAuthRedirect) onUnauthorized();
    return Promise.reject(new ApiError({ status, message, fieldErrors: body?.fieldErrors }));
  },
);
