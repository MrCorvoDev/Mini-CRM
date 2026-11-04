---
name: environment-variables
description: Env var rules for Nexty — single valibot-validated module, NEXT_PUBLIC_ prefix for client exposure, .env.example sync. Use when adding/reading env vars or exposing values to client components.
---

# Environment Variables

- All env vars declared/validated in one module: `src/shared/config/env.ts` (valibot schema). Never read `process.env` elsewhere.
- Client-exposed vars need `NEXT_PUBLIC_` prefix and must be listed in the schema before adding to `.env`.
- Secrets never get `NEXT_PUBLIC_`; only read in Server Components, Server Actions, or Route Handlers.
- `.env.local` gitignored; keep `.env.example` in sync (names only, no values).