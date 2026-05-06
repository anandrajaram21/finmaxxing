# AGENTS.md

## Project Overview

Finmaxxing is a private personal finance app for portfolio, goal, allocation,
and transaction tracking. It is built with Next.js App Router, React, tRPC,
Better Auth, Drizzle ORM, SQLite/libSQL, Tailwind CSS, and Bun.

The app uses Google sign-in through Better Auth and stores finance data per
user. The database schema is code-first and lives in `src/server/db/schema.ts`.

## Critical Instruction

Never start a development server, production server, preview server, Drizzle
Studio server, or any other long-running local server for this project. Do not
run `bun run dev`, `bun run start`, `bun run preview`, `bun run db:studio`,
`next dev`, `next start`, or equivalent commands.

Use static checks and builds only unless the user explicitly changes this
project-level instruction.

## Project Layout

- `src/app/` - Next.js App Router pages and route handlers.
- `src/app/_components/` - App-specific React components for the finance UI.
- `src/app/api/` - API route handlers for auth, data backup, and tRPC.
- `src/components/ui/` - Shared UI primitives.
- `src/server/api/` - tRPC setup and routers for app data.
- `src/server/better-auth/` - Better Auth server/client configuration.
- `src/server/db/` - Drizzle database client and schema definitions.
- `src/server/yahoo-finance.ts` - Market quote integration.
- `src/trpc/` - tRPC client/server helpers for React and server usage.
- `src/styles/` - Global CSS and CSS type declarations.
- `public/` - Static assets.
- `drizzle.config.ts` - Drizzle Kit configuration.
- `components.json` - shadcn/ui configuration.

Important app routes include:

- `/dashboard` - portfolio and goal dashboard.
- `/goals` - financial goals.
- `/investments` - investment records and market data.
- `/allocations` - goal-to-investment allocation mapping.
- `/transactions` - investment activity and transaction records.
- `/assumptions` - portfolio projection assumptions.
- `/instructions` - in-app guidance.

## Development Notes

- Use Bun for package scripts and dependency management.
- Keep schema changes in `src/server/db/schema.ts`; this repo does not commit
  generated Drizzle SQL migration files.
- App-specific tables use the `finmaxxing_` prefix. Better Auth tables are
  plain `user`, `account`, `session`, and `verification`.
- Preserve per-user data isolation when touching routers, queries, mutations,
  or database access.
- Store money values in minor units where the existing schema already does so
  (`targetAmountMinor`, `monthlySipMinor`, transaction amounts, etc.).
- Prefer existing UI patterns in `src/app/_components/` and
  `src/components/ui/` before adding new abstractions.

## Useful Commands

These commands are acceptable because they terminate on their own:

```bash
bun run check
bun run typecheck
bun run lint
bun run format:check
bun run build
```

Database schema application is available when needed:

```bash
bun run db:push
```

Do not run commands that start a server or wait for browser access.

## Environment

Local configuration is based on `.env.example`. Expected variables include:

- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_GOOGLE_CLIENT_ID`
- `BETTER_AUTH_GOOGLE_CLIENT_SECRET`
- `DATABASE_URL`
- `DATABASE_AUTH_TOKEN`

For local SQLite, `DATABASE_URL` is typically `file:./db.sqlite`.

## Verification Guidance

Prefer `bun run check` for the normal validation pass. Use `bun run build` when
changes affect Next.js routing, server components, auth boundaries, or runtime
behavior that TypeScript alone may not catch.
