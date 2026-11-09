import { ApiError } from '../utils/ApiError.js';

// validate(schema, 'body' | 'query') runs a Zod schema and stores the parsed (trimmed, coerced) result on
// req.valid[source]. In Express 5 req.query is read-only, so we never write back to the request itself.
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const fieldErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join('.') || '_';
      fieldErrors[field] ??= issue.message;
    }
    throw new ApiError(422, 'Please check the highlighted fields.', fieldErrors);
  }
  req.valid = { ...req.valid, [source]: result.data };
  next();
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// router.param('id', uuidParam): a malformed id can never match a row, so answer 404 before touching the database.
export function uuidParam(_req, _res, next, value) {
  if (!UUID.test(value)) throw new ApiError(404, 'Not found.');
  next();
}
