# Nexty — Agent Rules and Current Setup

## Stack

Next.js 16 App Router, React 19 + React Compiler, TypeScript strict, SCSS Modules, Redux Toolkit, TanStack Query, Radix UI (primitives only), Valibot, Biome, pnpm, Steiger

## Skills — Load Rules

| Skill                           | Load when                                                                                                                                                                                                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `typescript-advanced-types`     | `shared/lib/type-helper`; generics, conditional/mapped/template types.                                                                                                                                                                                                                           |
| `vercel-react-best-practices`   | Editing `app/` routes, `src/pages/**`, or RSC fetching; `generateMetadata`; `next/image`/`next/font`; `error.tsx`/`not-found.tsx`; handling `"use cache"`, `cacheLife`, `cacheTag`, `revalidateTag`; render/bundle performance investigation; before manual memoization (React Compiler active). |
| `vercel-react-view-transitions` | `<ViewTransition>`, `addTransitionType`, custom CSS fade/morph transitions, shared morphs, Suspense reveals, transition-aware `loading.tsx`, or handling experimental configuration errors.                                                                                                      |
| `ponytail`                      | Before new dependency/utility, or over-engineered solution.                                                                                                                                                                                                                                      |
| `feature-sliced-design`         | New slice; layer placement; cross-slice imports; restructuring.                                                                                                                                                                                                                                  |
| `scss-styling`                  | Any `.module.scss`; `clsx` logic; color/spacing/typography value.                                                                                                                                                                                                                                |
| `state-management`              | TanStack vs Redux vs Context; `model/` file; `createSlice`/`createAsyncThunk`.                                                                                                                                                                                                                   |
| `radix-ui-primitives`           | New Radix wrapper; before raw interactive HTML in `shared/ui`.                                                                                                                                                                                                                                   |
| `codegraph-workflow`            | Multi-file exploration; editing/renaming shared symbol; before grep/glob.                                                                                                                                                                                                                        |
| `error-handling`                | try/catch, Server Action, mutation `onError`, `createAsyncThunk`, `ErrorBoundary`.                                                                                                                                                                                                               |
| `environment-variables`         | New env var, `process.env` read, client exposure.                                                                                                                                                                                                                                                |

## FSD Layers

Imports top→bottom only: `app → pages → widgets → features → entities → shared`. No upward/sideways imports. Public API via root `index.ts` only, never inside segments. Export individually, never `export *`. Alias `@/` → `src/`. Full rules: `feature-sliced-design`.

## Structure

```
/app/ Next.js app directory
/pages/ Empty placeholder (FSD + App Router workaround) — don't touch
/src/app/ providers, root layout, global styles, middleware, store
/src/pages/ page components
/src/widgets/ UI blocks from features/entities/shared
/src/features/ user scenarios + API layer
/src/entities/ domain types, business-logic
/src/shared/api/ reusable API clients
/src/shared/assets/ static assets
/src/shared/config/ env, routes, constants, flags
/src/shared/lib/ framework-agnostic helpers
/src/shared/styles/ see scss-styling
/src/shared/ui/ shared UI components
```
Slice shape: `index.ts` + `ui/` + `model/` + `api/` + `lib/`

## CodeGraph

Pre-indexed graph, query via `pi-codegraph` instead of grep/glob/multi-file Read. Load: `codegraph-workflow` skill.

## TypeScript

- Strict: `noUnusedLocals`, `noUnusedParameters`
- `interface` for objects, `type` for unions/intersections
- `satisfies` for literal narrowing; no `as` unless forced by untyped lib; no `any`

## React & Next.js

- Named exports everywhere; default export only for App Router page/layout
- Import APIs individually: `import { useState } from 'react'`
- Prefer arrow functions for components
- Server Components by default; `"use client"` only for event handlers, `window`/`localStorage`, Redux/TanStack hooks
- React Compiler active — no manual `memo`/`useCallback`/`useMemo`
- TanStack Query for client async; `fetch + cache` for RSC
- `lucide-react`, not raw SVG; `<MorphIcon icon={visible ? Eye : EyeClosed} />` for icon-change transitions
- `generateMetadata`: no `Date.now()` or client-only data
- Wrap render-phase errors in `ErrorBoundary` at app/feature boundary
- Server Actions: validate auth + inputs (valibot) inside the action, don't rely on middleware alone

## State Management

TanStack Query = server/async state. Redux = global client state. Context = component-scoped shared state. Never duplicate server data in Redux. Load: `state-management` skill.

## Styling

SCSS Modules only, BEM, no px/Tailwind/inline styles. Every module starts `@use "@/shared/styles/base" as *;`(src/shared/styles/_base.scss). Load: `scss-styling` skill.

## Radix UI Primitives

Always wrap in `shared/ui/`, never used directly in features/entities. Check existing wrapper first. Load: `radix-ui-primitives` skill.

## Error Handling

RSC fetch, Server Action results, TanStack `onError`, Redux `rejectWithValue`, `ErrorBoundary`. Load: `error-handling` skill.

## Environment Variables

Single validated `env.ts`, `NEXT_PUBLIC_` rules, `.env.example`. Load: `environment-variables` skill.

## Code Quality

Single responsibility; small focused functions; meaningful names; no magic numbers; no unused vars/dead code; no obvious-thing comments; no JSDoc.

## Naming

Component/folder: PascalCase, Hook: `useX`, Helper: camelCase, SCSS: matches component, RTK slice: `camelSlice`, Slice folder: kebab-case

## Tooling

Biome, Steiger (FSD), Lefthook. After changes: `pnpm run format` → `pnpm run lint-unsafe` → `pnpm run lint`.

## Agent Rules

- Never guess API behavior — check docs/existing usage
- Never touch `node_modules`, `.next`, generated folders
- Never add a pnpm package without asking
- Only read files needed; keep diffs minimal
- Prefer relative paths
- Load skills proactively per table above

## Before Writing Code

1. Plan files to touch/create; don't expand scope without asking
2. Load relevant skills per table
3. `codegraph_explore`/`codegraph_impact` for usages, callers, blast radius
4. Confirm FSD layer + slice
5. Check for Radix Primitive before raw HTML
6. Type all props, returns, state
7. Server Component by default; justify `"use client"`
8. New slice → scaffold `index.ts` + `ui/` + `model/` + `api/`
9. `pnpm run format` then `pnpm run lint-unsafe`; fix all errors before finishing
