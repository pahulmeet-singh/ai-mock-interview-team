-- AI Mock Interview Platform: database schema (PostgreSQL on Supabase)
--
-- Run it once: Supabase dashboard → SQL Editor → New query → paste → Run.
-- It is idempotent (create ... if not exists), so running it again never deletes data.
-- To start from scratch, uncomment the reset block below first.
--
-- Four entities, as agreed in the architecture FAQ: users, interviews, feedbacks, resumes.
-- Interview categories are not a table: they live in server/src/config/categories.js, and the CHECK constraint
-- below must list the same ids.

-- drop table if exists public.feedbacks, public.interviews, public.resumes, public.users cascade;

-- ── users ───────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  name          text        not null check (char_length(name) between 2 and 60),
  email         text        not null,
  password_hash text        not null,                -- bcrypt hash; the plain password is never stored
  target_role   text        check (char_length(target_role) <= 80),
  created_at    timestamptz not null default now()
);
-- Case-insensitive uniqueness: "A@x.com" and "a@x.com" are the same person.
create unique index if not exists users_email_key on public.users (lower(email));

-- ── resumes ─────────────────────────────────────────────────────────────────
create table if not exists public.resumes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references public.users (id) on delete cascade,
  file_name  text        not null,
  file_url   text        not null,                   -- object path inside the private Storage bucket
  mime_type  text        not null default 'application/pdf',
  size_bytes integer     not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);
create index if not exists resumes_user_idx on public.resumes (user_id, created_at desc);

-- ── interviews ──────────────────────────────────────────────────────────────
create table if not exists public.interviews (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid        not null references public.users (id) on delete cascade,
  resume_id        uuid        references public.resumes (id) on delete set null,
  category         text        not null check (category in ('frontend', 'backend', 'system-design', 'dsa', 'cs-fundamentals', 'behavioral')),
  difficulty       text        not null default 'intermediate' check (difficulty in ('foundation', 'intermediate', 'advanced')),
  scheduled_at     timestamptz not null,              -- the booked slot (stored in UTC)
  duration_minutes integer     not null default 45 check (duration_minutes between 10 and 120),
  status           text        not null default 'booked' check (status in ('booked', 'in_progress', 'completed', 'cancelled')),
  questions        jsonb,                             -- [{ prompt, topic }], written by the AI when the session starts
  answers          jsonb       not null default '{}'::jsonb,  -- { "0": "text", "1": "text" }, autosaved while typing
  started_at       timestamptz,
  submitted_at     timestamptz,
  created_at       timestamptz not null default now()
);
-- The double-booking guard. Only one live (non-cancelled) interview may hold a given slot, enforced by the
-- database itself, so two simultaneous requests can never both succeed. Cancelling frees the slot again.
create unique index if not exists interviews_slot_key on public.interviews (scheduled_at) where status <> 'cancelled';
create index if not exists interviews_user_idx on public.interviews (user_id, scheduled_at desc);

-- ── feedbacks ───────────────────────────────────────────────────────────────
create table if not exists public.feedbacks (
  id            uuid primary key default gen_random_uuid(),
  interview_id  uuid          not null unique references public.interviews (id) on delete cascade,  -- one report per interview
  user_id       uuid          not null references public.users (id) on delete cascade,
  overall_score numeric(3, 1) not null check (overall_score between 0 and 10),
  result        jsonb         not null,               -- the AI evaluation: scores, summary, strengths, weaknesses, ...
  model         text          not null,               -- which model produced it, for traceability
  created_at    timestamptz   not null default now()
);
create index if not exists feedbacks_user_idx on public.feedbacks (user_id, created_at desc);

-- ── security ────────────────────────────────────────────────────────────────
-- Row Level Security on with no policies = the public (anon / authenticated) keys can read nothing.
-- Only the Express server, holding the service-role key, touches these tables, and it scopes every query
-- to the signed-in user.
alter table public.users      enable row level security;
alter table public.resumes    enable row level security;
alter table public.interviews enable row level security;
alter table public.feedbacks  enable row level security;

-- Supabase no longer exposes new tables to its API automatically (changed for new projects in 2026), so the server's
-- role (used by the secret / service_role key) is granted access explicitly.
grant usage on schema public to service_role;
grant all on public.users, public.resumes, public.interviews, public.feedbacks to service_role;
