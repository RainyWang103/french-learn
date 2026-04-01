# French Learning App — CLAUDE.md

## Project Overview

A Progressive Web App (PWA) for two users (Rainy + girlfriend) to learn French
independently. Deployed on Vercel, data stored in Supabase, installed via Safari
"Add to Home Screen" on iPhone. No backend server. No Anthropic API in production.

-----

## Tech Stack

- Frontend:   React + TypeScript (Vite)
- Database:   Supabase (Postgres + Auth)
- Auth:       Google OAuth via Supabase
- Curriculum: Static JSON files in public/curriculum/
- Deploy:     Vercel (frontend + static files)
- PWA:        manifest.json + service worker (sw.js)

-----

## Repo Rules

- Main branch is protected — never push directly to main
- Always create a feature branch → commit → open PR
- Branch naming: feat/phase-N-description
- One PR per phase
- Commit messages: conventional commits (feat:, fix:, chore:, docs:)
- Never commit .env files — use .env.example with placeholders only
- Never commit secrets, API keys, or credentials of any kind

-----

## Folder Structure

```
french-learn/
├── public/
│   ├── curriculum/
│   │   ├── phase1/          # day001.json → day063.json
│   │   ├── phase2/          # day001.json → day042.json (later)
│   │   └── phase3/          # day001.json → day063.json (later)
│   ├── icons/               # 192x192 and 512x512 PNG
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/GoogleSignIn.tsx
│   │   │   ├── hooks/useAuth.ts
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── index.ts
│   │   ├── profile/
│   │   │   ├── components/ProfileSelect.tsx
│   │   │   ├── components/Settings.tsx
│   │   │   ├── hooks/useProfile.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── session/
│   │   │   ├── components/VocabCard.tsx
│   │   │   ├── components/ListeningWidget.tsx
│   │   │   ├── components/GrammarDrill.tsx
│   │   │   ├── components/SpeakingChallenge.tsx
│   │   │   ├── components/RevisionSection.tsx
│   │   │   ├── components/SessionComplete.tsx
│   │   │   ├── hooks/useSession.ts
│   │   │   ├── hooks/useDayContent.ts
│   │   │   ├── Session.tsx
│   │   │   └── index.ts
│   │   └── progress/
│   │       ├── components/StreakCard.tsx
│   │       ├── components/SessionHistory.tsx
│   │       ├── components/FlaggedWords.tsx
│   │       ├── components/DifficultyChart.tsx
│   │       ├── hooks/useProgress.ts
│   │       └── index.ts
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client singleton
│   │   └── speech.ts        # Web Speech API wrapper
│   ├── types/
│   │   ├── curriculum.ts    # DayContent, VocabWord, etc.
│   │   ├── profile.ts       # UserProfile, SessionLog
│   │   └── supabase.ts      # Auto-generated (Phase 10)
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   └── schema.sql           # Run once via CLI on desktop
├── .env.example
├── tsconfig.json
├── vite.config.ts
└── vercel.json
```

-----

## Curriculum Structure

### File naming

- Content days: public/curriculum/phase{N}/day{NNN}.json (zero-padded, e.g. day001)
- Revision days: computed in code — every 4th day (day 4, 8, 12…) — no JSON file

### Day number logic

```
currentDay % 4 === 0  →  revision day (no fetch)
contentIndex = currentDay - Math.floor(currentDay / 4)
file = /curriculum/phase{phase}/day{pad(contentIndex, 3)}.json
```

### JSON schema — every day file must match exactly

```json
{
  "day": 1,
  "phase": 1,
  "topic": "string",
  "vocab": {
    "standard": [{ "w","t","g","pr","m","n","cj","ex","sp" }],
    "advanced":  [{ "w","t","g","pr","m","n","cj","ex","sp" }]
  },
  "listen": {
    "standard": { "d": [["A","text"],["B","text"]], "qs": [...], "sum": "string" },
    "advanced":  { "d": [...], "qs": [...], "sum": "string" }
  },
  "grammar": {
    "standard": { "title","exp","exs","drills" },
    "advanced":  { "title","exp","exs","drills" }
  },
  "quiz": {
    "standard": [{ "t","q","o","c","e","tw" }],
    "advanced":  [{ "t","q","o","c","e","tw" }]
  },
  "speak": {
    "standard": { "sc","pr","ma","mae","tip" },
    "advanced":  { "sc","pr","ma","mae","tip" }
  }
}
```

### Vocab word shape

```ts
{ w: string, t: "verb"|"noun"|"adjective"|"adverb"|"expression",
  g: "m"|"f"|null, pr: string, m: string, n?: string,
  cj?: Record<string,string>, ex: [string,string][], sp: string }
```

### Quiz question shape

```ts
{ t: "mc"|"f", q: string, o?: string[], c: string, e: string, tw?: string }
```

-----

## User Profiles

### Two users

- Rainy (you): Standard track, starts Day 1, elementary A1
- Girlfriend:  Advanced track, starts at assessed day, already mid-A1+

### Track differences

```
Standard track                  Advanced track
──────────────────────────────────────────────────────
5 words/session default         7 words/session default
Pronunciation hints shown       Pronunciation hints hidden
Full grammar explanation        Condensed + harder drills
0.7× listening default          0.9× listening default
No skip-known button            Skip-known button available
Hint available in speaking      No hints in speaking
Easier quiz (3 options)         Harder quiz (4 options, no hints)
```

### Difficulty system

- Stored as float per section: difficulty_vocab, difficulty_grammar,
  difficulty_listening, difficulty_speaking
- Scale: 1.0 (too easy) → 4.0 (too hard)
- Display labels: 1.0–1.5 "Too easy", 1.5–2.5 "Just right",
  2.5–3.5 "Slightly too hard", 3.5–4.0 "Too hard"
- Auto-updated after every section using updateDifficulty()
- Manual override available in Settings → resets with "reset to auto"

### updateDifficulty algorithm

```ts
function updateDifficulty(current: number, score: number, total: number): number {
  const ratio = score / total
  if (ratio === 1.0) return Math.max(1, current - 0.3)  // perfect → easier
  if (ratio >= 0.8)  return current                      // good → no change
  if (ratio >= 0.6)  return Math.min(4, current + 0.2)  // ok → slightly harder
  return Math.min(4, current + 0.5)                      // struggling → harder
}
```

### Scaffolding rules per difficulty

```
VOCAB
1.0–1.5  10 words, no pronunciation, harder quiz
1.5–2.5  standard word count, pronunciation shown, normal quiz
2.5–3.5  fewer words, extra notes, hints in quiz
3.5–4.0  minimum words, all hints, pronunciation always shown

GRAMMAR
1.0–1.5  skip explanation, 8 harder drills
1.5–2.5  standard explanation, 5 drills
2.5–3.5  longer explanation, worked examples, 4 easier drills
3.5–4.0  full explanation, 3 easy drills, all examples shown

LISTENING
1.0–1.5  1.0× speed, 5 questions, no replay
1.5–2.5  0.8× speed, 3 questions, 1 replay
2.5–3.5  0.6× speed, 2 questions, unlimited replay
3.5–4.0  0.6× speed, 2 questions, transcript shown upfront

SPEAKING
1.0–1.5  no model answer until requested
1.5–2.5  model answer available after attempt
2.5–3.5  sentence starters provided as hints
3.5–4.0  sentence starters + model answer shown together
```

-----

## Supabase Schema (write to supabase/schema.sql)

```sql
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
```

-----

## Environment Variables

### .env.example (commit this)

```
VITE_SUPABASE_URL=your-supabase-url-here
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

### .env (never commit — gitignored)

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

-----

## Design System

- Reuse the cozy café aesthetic from the demo exactly
- Background: #1a1410, Card: #2e2620, Accent: #c4704b
- Fonts: Playfair Display (headings) + Source Serif 4 (body)
- Dark mode only — no light mode toggle needed
- All interactive elements use buttons, never type-to-proceed
- Accent answers in fill-in inputs — normalise before checking
  (strip diacritics, lowercase, trim, collapse whitespace)

-----

## Code Standards

- TypeScript strict mode — no `any` types
- Each feature exports only via its index.ts (no deep imports)
- Hooks own all data-fetching and state — components are pure UI
- No inline styles in components — use CSS modules or Tailwind
- All Supabase calls wrapped in try/catch with user-facing error state
- Web Speech API calls must be triggered by user gesture (iOS Safari)
- Service worker: cache-first for /curriculum/, network-first for Supabase

-----

## What Is NOT Built Yet (pending desktop setup)

- Real Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- Google OAuth client ID / secret
- Vercel deployment
- Supabase schema actually run
- Phase 2 and Phase 3 curriculum JSON

All Supabase calls should fail gracefully with a clear message:
"Database not connected yet — progress will not be saved."
This allows full UI development and testing without live credentials.

-----

## Test Strategy — Phase 2 additions

### Framework
Vitest + jsdom. Colocated test files (*.test.ts).
Scripts: "test" (vitest run), "test:watch" (vitest)

### CI pipeline
.github/workflows/ci.yml — three parallel jobs on every PR:
typecheck (tsc --noEmit), test (vitest run), build (vite build)
Phase 3 adds: validate-curriculum job on curriculum file changes
All jobs must pass before merging.

### Files with tests this phase
src/lib/difficulty.test.ts — updateDifficulty, difficultyLabel,
getScaffolding: all cases, boundaries, ceiling/floor
