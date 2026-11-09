# Mockroom: AI Mock Interview Platform

Book a slot, take an AI-led mock interview, and get a scored report that shows where the marks went.
Built for the INT252 (Web App Development with ReactJS) course.

| Layer | Technology |
| --- | --- |
| Frontend | React 19 + Vite, Tailwind CSS 3.4 (PostCSS), shadcn/ui (Radix), React Router, Recharts |
| Forms and validation | React Hook Form + Zod |
| State | Zustand (live-session UI state) + TanStack React Query (server state) + Context (auth user) |
| Backend | Node.js + Express 5 REST API, JWT in HttpOnly cookies, nodemon in development |
| Database and files | Supabase: PostgreSQL + private Storage bucket (resumes) |
| AI | Google Gemini over plain HTTP REST, called from the server only |

**Features:** interview categories, slot booking (double-booking guarded by the database), a timed live session with
autosave, an AI-scored feedback dashboard (scorecard, skill radar, trend), and resume upload.

---

## 1. Run it (about 10 minutes)

**You need:** Node.js 20.19+ (or 22.12+), a free [Supabase](https://supabase.com) project, and a free
[Google AI Studio](https://aistudio.google.com) API key (optional: you can start with `GEMINI_MOCK=true`).

```bash
# 1. install everything (root + server + client)
npm run setup

# 2. database: Supabase dashboard → SQL Editor → New query → paste server/db/schema.sql → Run
#    (optional demo data: run server/db/seed.sql the same way)

# 3. configure the server
cp server/.env.example server/.env      # then fill in the values below
cp client/.env.example client/.env      # optional

# 4. start API (http://localhost:5000) and web app (http://localhost:5173) together
npm run dev
```

Fill in `server/.env`:

| Variable | Where to get it |
| --- | --- |
| `SUPABASE_URL` | Supabase → your project's Overview page (or the **Connect** button) → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API Keys → the **secret** key (`sb_secret_…`; older projects: the `service_role` key). **Server only. Never put it in the client.** |
| `JWT_SECRET` | Any 32+ random characters: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `GEMINI_API_KEY` | Google AI Studio → Get API key. Or set `GEMINI_MOCK=true` to use offline fixtures. |

On boot the API prints `[ok] Supabase reachable, tables found` and creates the private `resumes` storage bucket for you.
If you see a `[warn]` line instead, it tells you which step is missing.

**Demo account** (only if you ran `seed.sql`): `demo@example.com` / `Demo@12345`, with three scored sessions and one booking.

### Check it works

With the API running (and `GEMINI_MOCK=true`, `SLOT_ENFORCE_WINDOW=false`):

```bash
npm run smoke        # 28 end-to-end checks: auth, booking, 409 double-booking guard, AI session, feedback, resumes
npm test             # unit and component tests for server and client
```

### First live run checklist (things only your keys can prove)

1. Register an account in the browser, then sign out and back in.
2. Upload a PDF on **Resumes** and open it (this exercises Supabase Storage).
3. Book a slot, **Start session**, answer, **Submit**. With real Gemini the first call takes 5 to 20 seconds.
4. `permission denied` from Supabase (code 42501)? Supabase stopped exposing new tables to its API automatically
   (new projects since May 2026, every project since 30 Oct 2026). `schema.sql` ends with the grants the server
   needs, so re-run the whole file in the SQL editor.
5. If the AI step fails, the server log shows Google's message. Common fixes: wrong key, or free-tier quota. Try
   `GEMINI_MODEL=gemini-3.5-flash-lite` (default) or `GEMINI_API=generateContent`, or fall back to `GEMINI_MOCK=true`.

---

## 2. Project layout

```
server/                     Express REST API
  db/schema.sql             4 tables: users, interviews, feedbacks, resumes (+ constraints, indexes, RLS)
  src/config/               env.js (Zod-validated), supabase.js, categories.js
  src/middleware/           auth (JWT cookie), validate (Zod), upload (multer), rateLimit, csrfGuard, errorHandler
  src/routes/ controllers/  one pair per resource: auth, categories, slots, interviews, session, feedbacks, resumes
  src/services/             gemini (AI), slot (time maths), storage (Supabase Storage), interview (shared queries)
client/                     React SPA
  src/app/                  providers, router (lazy routes), queryClient
  src/components/ui/        shadcn primitives     layout/  app shell, auth layout     common/  shared pieces
  src/features/             auth · categories · booking · interviews · session · feedback · resume
  src/stores/ hooks/ lib/   Zustand stores, custom hooks, api client, formatting, immutable helpers
docs/VIVA_GUIDE.md          syllabus → file map, state-management comparison, viva Q&A
docs/API.md                 every endpoint, status codes and shapes
generate_repo.sh            builds the git history in 7 stages (see section 4)
```

## 3. Configuration notes

- **Time zone.** Slots are generated in `SLOT_TZ` (default `Asia/Kolkata`, 10:00 to 18:00, 60-minute slots, 14 days
  ahead). Set the same zone in `client/.env` as `VITE_APP_TIMEZONE`.
- **Demo vs strict sessions.** `SLOT_ENFORCE_WINDOW=false` (default in `.env.example`) lets you start a booked
  session at any time, which is what you want for a live demo. Set it to `true` to open sessions 10 minutes before
  the slot and close them 30 minutes after it begins.
- **Gemini.** The default model is `gemini-3.5-flash-lite` because its free quota is far larger than the bigger
  models'. For stronger feedback set `GEMINI_MODEL=gemini-3.8-flash` (check your quota in AI Studio). Model names
  change over time: the current list is at <https://ai.google.dev/gemini-api/docs/models>.
- **Deploying.** Build the client with `npm run build` and host `client/dist` on any static host; run the API on a
  Node host (Render, Railway, ...). If the two live on different domains, set `VITE_API_URL` in the client build,
  `CLIENT_ORIGIN` on the server, and `COOKIE_SAMESITE=none` (HTTPS is required for that cookie setting).
  Free Supabase projects pause after a period of inactivity: open the dashboard and wake it before a demo.

## 4. Git history: `generate_repo.sh`

The script turns the finished code into a clean, reviewable history following the 7-phase plan, one logical commit
per feature slice. It deliberately uses **real timestamps and your own git identity** (`git config user.name`):

```bash
./generate_repo.sh           # shows the plan and which stage is next
./generate_repo.sh 1         # run stage 1 when you actually reach it; then 2, 3 ... 7
```

Run each stage on the day you really work on that part, and split the stages between teammates so each person has
read and can explain the slice they commit. Each stage's commits are meant to build on their own; the script
checks that stages run in order.

## 5. Honest limitations

- Scores come from an AI model. They are good for finding things to practise, not for judging a candidate.
- Interview answers are typed text; there is no voice or code editor.
- Slots model one candidate at a time (one booking per time slot), which is simple to explain and enforce.
- The Gemini and Supabase calls could not be exercised from the build environment; they are covered by stubbed-fetch
  tests and a local Postgres/PostgREST run, so your first live run is the final check (section 1).
