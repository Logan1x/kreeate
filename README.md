# Kreeate

Kreeate is an AI-assisted GitHub issue creator.

You describe a bug, feature, or task in plain English, Kreeate formats it into a concise issue draft, suggests priority, and lets you submit directly to a selected repository after GitHub sign-in.

## Features

- GitHub OAuth authentication with per-user repository access
- AI issue generation with issue type presets (`Bug`, `Feature`, `Task`)
- Auto priority suggestion (`P0` to `P3`) with manual override
- Repository selector with pin/unpin and last-selection memory
- Recent issues carousel for quick access
- API rate limiting on generate/submit endpoints
- Model fallback support for more reliable generation

## Tech Stack

- Next.js (App Router) + React + TypeScript
- NextAuth v5 (GitHub provider)
- Drizzle ORM + PostgreSQL (Neon-friendly)
- Tailwind CSS + shadcn/ui
- OpenRouter via OpenAI SDK-compatible client

## Installation

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

```bash
cp .env.local.example .env.local
```

Set these values in `.env.local`:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_generated_secret"

# GitHub OAuth
GITHUB_ID="your_github_oauth_client_id"
GITHUB_SECRET="your_github_oauth_client_secret"

# OpenRouter
OPENROUTER_API_KEY="your_openrouter_api_key"

# Optional model overrides
OPENROUTER_PRIMARY_MODEL="openai/gpt-oss-safeguard-20b"
OPENROUTER_FALLBACK_MODEL="deepseek/deepseek-v3.2"

# Optional admin analytics access
ADMIN_EMAILS="admin1@example.com,admin2@example.com"
```

Generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3) Set up GitHub OAuth app

Create an OAuth app in GitHub Developer Settings with:

- Homepage URL: `http://localhost:3000`
- Callback URL: `http://localhost:3000/api/auth/callback/github`

### 4) Run database migrations

```bash
npx drizzle-kit migrate
```

### 5) Start development server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Common Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run ESLint

## API Routes

- `POST /api/generate` - generate issue draft
- `POST /api/submit` - create issue in GitHub repo
- `GET /api/repos` - list accessible repos
- `GET /api/preferences` - get last repo and pinned repos
- `POST /api/preferences` - pin/unpin repos
- `GET /api/recent-issues` - list recently created issues
- `GET /api/admin/analytics` - admin metrics for generation reliability

Admin dashboard:

- `/admin/analytics` - visualizes success/fail rate, fallback usage, and rate-limited requests
