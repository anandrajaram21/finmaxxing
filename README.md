# Finmaxxing

Finmaxxing is a private portfolio and goal tracking app built with Next.js,
Better Auth, tRPC, Drizzle, and SQLite/libSQL.

The app uses Google sign-in and stores finance data per user. The database
schema is defined in code at `src/server/db/schema.ts`.

## Tech Stack

- Next.js App Router
- React
- tRPC
- Better Auth
- Drizzle ORM
- SQLite/libSQL
- Bun

## Local Setup

Install dependencies:

```bash
bun install
```

Create your local environment file:

```bash
cp .env.example .env
```

Fill in the values in `.env`:

```bash
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-local-secret"
BETTER_AUTH_GOOGLE_CLIENT_ID="your-google-client-id"
BETTER_AUTH_GOOGLE_CLIENT_SECRET="your-google-client-secret"
DATABASE_URL="file:./db.sqlite"
```

For local Google OAuth, configure this redirect URI in Google Cloud Console:

```text
http://localhost:3000/api/auth/callback/google
```

Apply the schema to your local database:

```bash
bun run db:push
```

Start the development server:

```bash
bun run dev
```

Open:

```text
http://localhost:3000
```

## Database Workflow

The schema source of truth is:

```text
src/server/db/schema.ts
```

Schema changes are tracked through normal Git history on that file. This repo
does not commit generated Drizzle SQL migration files.

After changing the schema, apply it with:

```bash
bun run db:push
```

To inspect the database visually:

```bash
bun run db:studio
```

Generated Drizzle migration files are ignored via `.gitignore`.

## Data Model

The app keeps the Better Auth tables required for authentication:

- `user`
- `account`
- `session`
- `verification`

The app-specific finance tables are:

- `finmaxxing_portfolio_assumption`
- `finmaxxing_goal`
- `finmaxxing_investment`
- `finmaxxing_allocation`
- `finmaxxing_transaction`

## Scripts

```bash
bun run dev
```

Start the local development server.

```bash
bun run build
```

Build the production app.

```bash
bun run start
```

Start the production server after building.

```bash
bun run typecheck
```

Run TypeScript checks.

```bash
bun run check
```

Run linting and TypeScript checks.

```bash
bun run format:check
```

Check formatting.

```bash
bun run format:write
```

Format files.

```bash
bun run db:push
```

Apply `src/server/db/schema.ts` directly to the configured database.

```bash
bun run db:studio
```

Open Drizzle Studio for the configured database.

## Environment Variables

`BETTER_AUTH_URL`

Base URL used by Better Auth. For local development, use
`http://localhost:3000`.

`BETTER_AUTH_SECRET`

Secret used by Better Auth. Required in production.

`BETTER_AUTH_GOOGLE_CLIENT_ID`

Google OAuth client ID.

`BETTER_AUTH_GOOGLE_CLIENT_SECRET`

Google OAuth client secret.

`DATABASE_URL`

Database connection URL. For local SQLite, use `file:./db.sqlite`.
