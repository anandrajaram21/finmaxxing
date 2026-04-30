# Finmaxxing

A small Next.js app with Google auth, tRPC, Drizzle, and per-user portfolio tracking.

## Development

Install dependencies and start the dev server:

```bash
bun install
bun run dev
```

Apply schema changes directly from `src/server/db/schema.ts`:

```bash
bun run db:push
```

Database schema history lives in Git through changes to `src/server/db/schema.ts`;
this project does not commit generated Drizzle SQL migration files.

## Environment

Copy `.env.example` to `.env` and fill in the Google OAuth values.

For local Google OAuth, configure this redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```
