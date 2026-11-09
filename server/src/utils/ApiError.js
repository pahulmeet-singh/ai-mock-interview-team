// An error we expect and can describe to the client: it carries an HTTP status and optional per-field messages.
export class ApiError extends Error {
  constructor(status, message, fieldErrors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}
