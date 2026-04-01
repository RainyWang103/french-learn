-- profiles table
create table profiles (
  id                    uuid references auth.users primary key,
  display_name          text not null,
  track                 text not null default 'standard'
                          check (track in ('standard','advanced')),
  level                 text not null default 'A1'
                          check (level in ('A1','A2','B1')),
  phase                 int  not null default 1
                          check (phase in (1,2,3)),
  current_day           int  not null default 1,
  starting_day          int  not null default 1,
  word_count            int  not null default 7,
  sessions_per_day      int  not null default 1,
  playback_speed        real not null default 0.8,
  streak                int  not null default 0,
  streak_shields        int  not null default 1,
  last_session_date     date,
  difficulty_vocab      real not null default 2.0,
  difficulty_grammar    real not null default 2.0,
  difficulty_listening  real not null default 2.0,
  difficulty_speaking   real not null default 2.0,
  difficulty_vocab_override     real,
  difficulty_grammar_override   real,
  difficulty_listening_override real,
  difficulty_speaking_override  real,
  skip_known_enabled    boolean not null default false,
  hide_pronunciation    boolean not null default false,
  french_only_mode      boolean not null default false,
  flagged_words         text[]  not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- session_logs table
create table session_logs (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users not null,
  day_number          int  not null,
  phase               int  not null,
  date                date not null,
  sections_completed  text[] not null default '{}',
  skipped_as_known    boolean not null default false,
  vocab_score         int,
  vocab_total         int,
  grammar_topic       text,
  grammar_score       int,
  grammar_total       int,
  listening_score     int,
  listening_total     int,
  transcript          jsonb,
  difficulty_ratings  jsonb,
  flagged_words       text[] not null default '{}',
  created_at          timestamptz not null default now()
);

-- Row level security
alter table profiles    enable row level security;
alter table session_logs enable row level security;

create policy "users can only access own profile"
  on profiles using (auth.uid() = id);

create policy "users can only access own logs"
  on session_logs using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();
