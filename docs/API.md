# REST API reference

Base URL: `/api` (the Vite dev server proxies it to `http://localhost:5000`). All bodies are JSON unless noted.

## Conventions

- **Auth:** a signed JWT in an **HttpOnly cookie** (`mockroom_token`) set by register/login. The browser sends it
  automatically; JavaScript cannot read it. Endpoints marked 🔒 answer `401` without it.
- **CSRF guard:** every `POST`, `PUT`, `PATCH` and `DELETE` must carry `X-Requested-With: XMLHttpRequest`
  (the Axios client adds it). Without it the server answers `403`.
- **Errors** always look like `{ "error": { "status": 422, "message": "…", "fieldErrors": { "email": "…" } } }`
  (`fieldErrors` only for validation).
- **Rate limits:** 1000 requests / 15 min / IP overall, 30 / 15 min on register and login, 8 / min / user on the two
  AI endpoints. Exceeding them returns `429`.
- **Dates** are ISO 8601 UTC strings. Ids are UUIDs; a malformed id is `404`.

## Status codes we use, and why

| Code | Meaning here |
| --- | --- |
| 200 | OK (read, update, or an idempotent repeat of a create) |
| 201 | Created: a new resource exists (`Location` header points to it) |
| 204 | Done, nothing to return (logout, delete) |
| 400 | Body is not valid JSON |
| 401 | Not signed in / wrong credentials |
| 403 | Missing CSRF header |
| 404 | No such resource (or it belongs to someone else: we never reveal which) |
| 409 | Conflict with current state: slot already taken, email already registered, wrong lifecycle state |
| 413 / 415 | Upload too large / not a PDF |
| 422 | Input failed validation (Zod), with per-field messages |
| 429 | Rate limit, or the AI provider's quota |
| 502 | The AI provider or Storage failed upstream |

## Auth

| Method | Path | Body | Success | Notes |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | `{ name, email, password, targetRole? }` | `201 { user }` | `409` if the email exists. Sets the cookie. |
| POST | `/auth/login` | `{ email, password }` | `200 { user }` | `401` for a wrong email or password (same message for both). |
| POST | `/auth/logout` | | `204` | Clears the cookie. |
| GET | `/auth/me` | | `200 { user }` | `{ user: null }` when signed out: a normal answer, not an error. |

## Catalogue and slots 🔒

| Method | Path | Success |
| --- | --- | --- |
| GET | `/categories` | `{ categories: [{ id, title, summary, topics }], difficulties }` |
| GET | `/slots` | `{ timezone, slotMinutes, days: [{ date, slots: [{ startsAt, status }] }] }` where `status` is `open`, `taken` or `mine` |

Slots are generated from working hours (they are not stored); only *booked* slots exist in the database.

## Interviews 🔒

| Method | Path | Body / query | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/interviews` | `?status=upcoming\|completed\|cancelled&category=` | `200 { interviews }` | 422 bad filter |
| POST | `/interviews` | `{ category, difficulty, scheduledAt, resumeId? }` | `201 { interview }` | **409** slot taken (database unique index), 422 not a real slot / unknown resume |
| GET | `/interviews/:id` | | `200 { interview }` incl. `questions`, `answers` | 404 |
| PATCH | `/interviews/:id` | `{ status: "cancelled" }` | `200 { interview }` | 409 if it is not `booked` |
| POST | `/interviews/:id/session` | | `201` started (AI writes the questions) / `200` already running | 409 cannot start, 429/502 AI |
| PUT | `/interviews/:id/answers` | `{ answers: { "0": "text", … } }` | `200 { savedAt }` (idempotent autosave) | 409 not in progress |
| POST | `/interviews/:id/feedback` | `{ answers? }` | `201 { feedback }`, or `200` if it already exists | 409 not started, 422 nothing answered, 429/502 AI |
| GET | `/interviews/:id/feedback` | | `200 { feedback }` with per-question detail | 404 no feedback yet |

Interview `status` is one of `booked`, `in_progress`, `completed`, `cancelled`, or the derived `missed`
(a booked session whose window has closed, when `SLOT_ENFORCE_WINDOW=true`).

## Feedback 🔒

| Method | Path | Success |
| --- | --- | --- |
| GET | `/feedbacks` | `{ feedbacks: [{ id, interviewId, overallScore, scores, summary, strengths, weaknesses, recommendations, interview: { category, difficulty, scheduledAt } }] }` |

`scores` has five criteria (0 to 10): `technicalAccuracy`, `depth`, `problemSolving`, `communication`, `structure`.
`overallScore` is their mean, computed by the **server**, not trusted from the model.

## Resumes 🔒

| Method | Path | Body | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/resumes` | | `{ resumes: [{ id, fileName, sizeBytes, createdAt }] }` | |
| POST | `/resumes` | `multipart/form-data`, field `file` (PDF, ≤ 5 MB) | `201 { resume }` | 413 too large, 415 not a PDF, 409 limit of 5 |
| DELETE | `/resumes/:id` | | `204` | 404 |
| GET | `/resumes/:id/download` | | `{ url, fileName }`: a signed link valid for one minute | 404 |

## Health

`GET /api/health` → `{ "status": "ok", "time": "…" }` (not rate limited, no auth).
