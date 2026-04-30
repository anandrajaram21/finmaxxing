# Finmaxxing Notes

A small Next.js app with Google auth, tRPC, Drizzle, and per-user notes.

## Development

Install dependencies and start the dev server:

```bash
bun install
bun run dev
```

Apply schema changes:

```bash
bun run db:push
```

## Environment

Copy `.env.example` to `.env` and fill in the Google OAuth values.

For local Google OAuth, configure this redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```
