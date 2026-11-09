# Viva guide

How to use it: read section 1 to see where every syllabus topic lives, skim section 3 for the questions examiners
actually ask, and make sure **each of you can explain the slice you own** (section 4). Open the files while you read.

## 1. Syllabus → code

| Syllabus topic | Where to find it | What to say |
| --- | --- | --- |
| ES6+, immutability, shallow vs deep copy (Unit I) | `client/src/lib/immutable.js` + `immutable.test.js` | Helpers never mutate: they return new arrays/objects with spread, `map`, `filter`. The tests freeze their inputs, so any mutation would throw. |
| Referential equality, state comparison | `stores/sessionStore.js` (`markSaved`), `features/booking/SlotPicker.jsx` | `state.answers !== saved` is a one-comparison "did it change while saving?"; `React.memo` skips children whose props are the same references. |
| Vite, JSX, SPA, Virtual DOM (Unit I) | `client/vite.config.js`, `index.html`, `src/main.jsx`, `hooks/useRenderCount.js` | One HTML file, one JS bundle per route. `useRenderCount` logs renders in dev to show reconciliation. |
| Component design, composition, lifting state (Unit II) | `features/booking/BookingPage.jsx`, `components/ui/*`, `components/common/*` | `BookingPage` owns the chosen day and form, and passes them to `SlotPicker` and `BookingSummary`. UI primitives are props-driven (`cva` variants). |
| Tailwind, responsive, accessibility (Unit II) | `tailwind.config.js`, `postcss.config.js`, `src/index.css`, `components/layout/Sidebar.jsx`, `common/FormField.jsx` | Design tokens are CSS variables mapped to utilities. Desktop-first shell collapses to a drawer below `lg`. Labels, `aria-invalid`, skip link, live regions. |
| `useState`, events, derived state (Unit III) | `features/session/AnswerEditor.jsx`, `features/categories/CategoriesPage.jsx` | Word count and the visible day are computed during render, never stored. |
| `useEffect`, cleanup, dependencies (Unit III) | `hooks/useCountdown.js`, `hooks/useEventListener.js`, `features/session/hooks.js` | Every interval/listener is removed in the cleanup function. |
| `useCallback`, `useMemo`, `React.memo` (Unit III) | `BookingPage.jsx` (`selectSlot`), `SlotPicker.jsx`, `CategoriesPage.jsx`, `feedback/hooks.js` | Stable callback + memoised child = only changed slot buttons re-render. `useMemo` caches the dashboard statistics. |
| `useContext`, custom hooks (Unit III) | `features/auth/AuthContext.jsx`, `src/hooks/*` | Context distributes "who is signed in" without prop drilling. |
| Controlled vs uncontrolled (Unit IV) | Controlled: `AnswerEditor.jsx`, `CategoriesPage.jsx` search, RHF `Controller` in `BookingPage.jsx`. Uncontrolled: RHF `register` in `LoginPage.jsx`, file input in `ResumeUploader.jsx`. | Controlled = React state is the source of truth; uncontrolled = the DOM owns the value and we read it via a ref. |
| Form handling, accessibility (Unit IV) | `LoginPage.jsx`, `RegisterPage.jsx`, `BookingPage.jsx`, `common/FormField.jsx` | `handleSubmit`, per-field errors, server errors mapped back with `setError` (`lib/errors.js`). |
| Zod validation (Unit IV) | `features/*/schemas.js` (client), `server/src/schemas/*` (server) | Same rules both sides: the client for instant feedback, the server because clients can be bypassed. `zodResolver` plugs a schema into RHF. |
| HTTP/REST, Axios, loading/error/empty (Unit V) | `lib/api.js`, `docs/API.md`, `components/common/{LoadingState,ErrorState,EmptyState}.jsx` | One Axios instance with interceptors. Every fetch renders skeleton, error with retry, or empty state. |
| React Query, caching, background sync (Unit V) | `app/queryClient.js`, `lib/queryKeys.js`, `features/*/hooks.js` | `staleTime`, refetch on focus, `refetchInterval` for slots, `invalidateQueries` after mutations, optimistic cancel. Devtools show the cache. |
| Routing: nested, dynamic, protected, query params, code splitting (Unit V) | `app/router.jsx`, `features/auth/ProtectedRoute.jsx`, `InterviewsPage.jsx` | Layout routes + `<Outlet />`, `:id` params, filters in `?status=…`, `lazy()` per page. |
| Global state: Context, Zustand, server state (Unit VI) | `stores/sessionStore.js`, `stores/uiStore.js`, `AuthContext.jsx`, React Query | See section 2. |
| Debugging, env variables, production build (Unit VI) | `client/.env.example`, `import.meta.env`, `npm run build`, React Query Devtools | Env vars are baked in at build time and must be prefixed `VITE_`. Use the React DevTools Profiler with `useRenderCount`. |

**The 14 course practicals** map to the same files: utilities → `lib/immutable.js`; Vite/JSX → `main.jsx`;
reusable components → `components/`; Tailwind → `index.css`, `tailwind.config.js`; events/state → `AnswerEditor`;
effects → `useCountdown`; memo hooks → `SlotPicker`; custom hook → `src/hooks/`; controlled/uncontrolled forms →
`BookingPage`, `ResumeUploader`; Zod → `schemas.js`; data fetching → `lib/api.js`; React Query → `hooks.js`;
routing → `router.jsx`; global state + production build → `sessionStore.js`, `npm run build`.

## 2. Local vs global vs server state

| Kind | Example here | Tool | Why this tool |
| --- | --- | --- | --- |
| **Local** | Search text, open dialog, selected day | `useState` | Only one component (or its children) cares. |
| **Global UI** | Live session: timer, current question, draft answers; mobile sidebar | **Zustand** | Many distant components read it. Selectors mean a clock tick re-renders only the timer. No provider needed. |
| **Server** | Interviews, slots, feedback, resumes, current user | **React Query** | It belongs to the server. We only cache it. Fetching, caching, de-duplicating, retrying and refreshing come built in. |
| **Auth user** | Who is signed in | React Query + **Context** | The user is server state; Context just hands it to every component. |

*Why not Redux Toolkit?* It solves the same problem as Zustand with more ceremony (slices, actions, store provider). Our
global state is small, so Zustand's few lines suffice. The course's practical asks for "Context or Zustand".
*Why not put server data in Zustand/Context?* You would have to hand-write loading flags, caching, refetching and
invalidation, which React Query already does correctly.

## 3. Questions you will probably be asked

**Why does React need immutable updates?** React and the stores compare references (`===`) to detect change. If you
mutate an array in place its reference is the same, so nothing re-renders. `updateById` returns a new array and a new
item but keeps untouched items' references, so `memo` can skip them.

**Why `useEffect` cleanup?** Without it the interval in `useNow` would keep running after the component unmounts
(a leak, and `setState` on an unmounted component). Cleanup runs before the next effect and on unmount.

**Where do you use `useMemo` / `useCallback` / `memo`, and do they always help?** Slot grid and category rows (many
similar children), dashboard statistics (derived from a list). They are not free: only use them where re-rendering
is measurably costly. `useRenderCount` lets us show the difference.

**Controlled or uncontrolled?** Both. The session textarea is controlled (value from the store). Login fields use RHF
`register`, which is uncontrolled and so does not re-render on every keystroke. A file input can only be uncontrolled.

**Why validate with Zod on both client and server?** The client check is UX. The server check is security: anyone can
call the API without our UI. The server also validates the **AI's** JSON before saving it.

**Why React Query instead of `useEffect` + `fetch`?** `useEffect` fetching has no cache, races on fast navigation,
and needs hand-written loading/error/retry state. React Query gives all of that, plus de-duplication, background
refresh and invalidation. `staleTime` is how long data counts as fresh; `gcTime` is how long unused data stays cached.

**What is an optimistic update?** `useCancelInterview` changes the cached interview to "cancelled" immediately, then
rolls back from a snapshot if the server refuses, then refetches to confirm.

**How are routes protected?** `ProtectedRoute` is a layout route: it renders `<Outlet />` only when `useAuth()` says
signed in, otherwise `<Navigate to="/login" state={{ from }} />`. Real protection is on the server: every data
endpoint also requires the cookie.

**Why `lazy()` routes?** Code splitting: a page's JavaScript downloads only when first visited, so the first load is
small. See the per-page chunks in `client/dist/assets` after `npm run build`.

**JWT in an HttpOnly cookie vs localStorage?** HttpOnly means page scripts can't read it, so an XSS bug can't steal
the token. The cost is CSRF, so we add `SameSite=Lax` and require a custom `X-Requested-With` header on writes.

**How do you stop two people booking the same slot?** The database does: a partial unique index on
`interviews(scheduled_at) where status <> 'cancelled'`. Two simultaneous inserts: one wins, the other gets Postgres
error 23505, which the API returns as `409 Conflict`. A check-then-insert in code would race.

**Why are slots not a table?** Generated from working hours: nothing to keep in sync, and the schema stays at the
four agreed entities. Only booked slots are stored.

**Why is the Gemini key on the server?** Anything in the browser can be read by anyone. The server also asks for JSON
matching a schema, validates it with Zod, retries once if it is malformed, treats candidate answers as data (not
instructions) in the prompt, and computes the overall score itself.

**Why the Supabase secret (formerly service-role) key, and is that safe?** It bypasses Row Level Security, so it lives only on the
server, and every query is filtered by the signed-in user's id. RLS is enabled with no policies, so the public keys
can read nothing.

**How does autosave avoid losing or duplicating work?** Typing updates the store. `useAutosave` debounces 1.5 s, sends
the answers (idempotent `PUT`), and ignores slow older responses. `markSaved` compares object references, so if you
typed during the request you are still marked "unsaved". `beforeunload` warns if anything is unsaved.

**What would you improve?** Voice answers, a human reviewer role, multi-seat slots, email reminders, and measured
AI-quality evaluation. State these honestly: examiners respect it.

## 4. Suggested split (so each person owns something real)

| Owner | Slice | Stages | Be ready to demo and explain |
| --- | --- | --- | --- |
| A | Backend and data | 1, 3 | `server/`: schema, auth, REST, validation, double-booking guard, resumes |
| B | App foundation, forms, routing | 2, 4, 5 | Tailwind setup, router, auth context, booking and resume forms, React Query hooks |
| C | Live session, AI, dashboard | 6, 7 | Zustand session store, autosave, Gemini service, scorecard and charts, tests |

Whoever runs a stage commits it (`./generate_repo.sh <n>`), so the history shows who owns which slice.

## 5. Demo script (6 minutes)

1. Sign in as the demo user: dashboard with stats, radar and trend (React Query + derived state).
2. Book a slot: pick a category and day; show a taken slot; mention the unique index and `409`.
3. Start the session: the timer (Zustand selector), type an answer, point at "Saved" (autosave).
4. Submit: the scoring overlay, then the scorecard. Open one question to show the model answer.
5. Open React Query Devtools: show cached queries going stale and refetching.
6. Show `docs/API.md` or the Network tab: status codes and the HttpOnly cookie.

Have `GEMINI_MOCK=true` ready as a fallback if the network or quota fails on the day.
