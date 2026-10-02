-- CareerOS V1 — minimal real-user schema.
--
-- Only accounts, career profiles and jobs live in the database. Match /
-- Resume / Interview artifacts stay in their existing (client-side / mock)
-- structures for now.
--
-- SECURITY: every table is protected by row level security; a logged-in
-- user can only ever read / write their own rows.

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  name text,
  resume_text text,
  -- The confirmed CareerProfile object (see src/types CareerProfile), stored
  -- verbatim so localized text round-trips losslessly.
  career_profile_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: own rows" on public.profiles;
create policy "profiles: own rows"
  on public.profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -------------------------------------------------------------------- jobs
-- Queryable columns for listings + `data` (the full Job object) and
-- `analysis_json` (the JdAnalysis) so the existing UI types round-trip.
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company text not null,
  title text not null,
  location text,
  job_url text,
  jd text not null,
  status text not null default 'interested',
  data jsonb not null,
  analysis_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jobs enable row level security;

drop policy if exists "jobs: own rows" on public.jobs;
create policy "jobs: own rows"
  on public.jobs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------------- index
create index if not exists jobs_user_id_idx on public.jobs (user_id, created_at desc);
