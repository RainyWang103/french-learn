# French Learn

A Progressive Web App (PWA) for two users to learn French independently.

## Tech Stack

- **Frontend**: React + TypeScript (Vite)
- **Database**: Supabase (Postgres + Auth)
- **Auth**: Google OAuth via Supabase
- **Deploy**: Vercel

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

### 3. Set up Supabase schema

Run the schema once via the Supabase CLI or dashboard SQL editor:

```bash
# Using Supabase CLI
supabase db push --file supabase/schema.sql
```

### 4. Run the dev server

```bash
npm run dev
```

App runs at `http://localhost:5173`.

### 5. Build for production

```bash
npm run build
```

## Deployment

The app is deployed on Vercel. Push to `main` to trigger a production deployment.

Ensure the following environment variables are set in the Vercel project settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## PWA Installation (iPhone)

1. Open the deployed URL in Safari
2. Tap Share → "Add to Home Screen"
3. The app installs as a standalone PWA

## Notes

- Database credentials are **not** required to run the UI — Supabase calls fail gracefully with a user-facing message
- Never commit `.env` or real credentials
