# Nexty: A Feature-Sliced Design Template for Next.js + TypeScript Projects (v0.10.0)

Nexty is a starter template for building modern **Next.js** applications with **TypeScript**, **SCSS**, **Redux Toolkit**, **Radix UI**, **Valibot**, and **TanStack Query** — organized using the **Feature-Sliced Design (FSD)** methodology.

It provides a clean, layered architecture, essential tooling, and pre-configured linting/formatting to help you start strong.

## Features

- **Next.js (App Router)**: Full-featured React framework with SSR, SSG, ISR, and Turbopack support.
- **TypeScript**: Strict mode with advanced type patterns.
- **Feature-Sliced Design (FSD)**: Scalable architecture based on layers.
- **SCSS Modules**: Component-scoped styles with BEM, `em`/`rem` utilities, and CSS custom properties.
- **Radix UI**: Accessible, headless UI primitives wrapped in `shared/ui/`.
- **Redux Toolkit**: Client state management (auth, UI, settings).
- **TanStack Query**: Server/async state with caching and revalidation.
- **Valibot**: Environment variable validation and type extraction.
- **React 19 + React Compiler**: No manual memoization needed.
- **Biome**: Unified linting + formatting.
- **Steiger**: FSD architecture linting.
- **Lefthook**: Git hooks for consistent commits.
- **AI-Ready**: `AGENTS.md` + `.agents/skills/` for LLM-assisted development.

## Getting Started

### Installation

```bash
pnpm install
```

### Scripts

```bash
pnpm run dev          # Start development server with Turbopack
pnpm run build        # Build production bundle (required before start)
pnpm run start        # Start production server
pnpm run lint         # Run Biome + TypeScript + Steiger (FSD) linters
pnpm run lint-unsafe  # Auto-fix lint issues (unsafe)
pnpm run format       # Format with Biome
```

## Folder Structure (FSD)

```
Nexty/
├── app/                      # Next.js app directory
├── pages/                    # Next.js pages placeholder — do not touch
├── public/                   # Static assets
├── src/
│   ├── app/                  # Providers, root layout, global styles, store
│   ├── pages/                # Page components
│   ├── widgets/              # UI blocks composed from entities/shared
│   ├── features/             # User scenarios + API layer
│   ├── entities/             # Domain types, business-logic independent
│   └── shared/
│       ├── api/              # Reusable API clients
│       ├── assets/           # Static assets
│       ├── config/           # Env, routes, constants, feature flags
│       ├── lib/              # Framework-agnostic helpers
│       ├── styles/           # _base.scss, _variables.scss, _functions.scss, _mixins.scss
│       └── ui/               # Shared UI components
```

## Notes

- **FSD:** Architecture Organized with Feature-Sliced Design https://fsd.how.
- **HTML:** Use BEM methodology for maintainable components (block__element_modificator).
- **Layout:** Body element has font-size that dynamically changing depending on width.
- **Styling:** Use em and rem units(there are scss functions) for responsible design.
- **Fonts:** Add Google Fonts in `src/app/styles/fonts.ts`.
- **State:** Use Redux for global state; TanStack Query for server state.
- **Hooks & Libs:** Place reusable utilities in shared/lib/ and domain-specific ones inside respective slices.
- **Env vars:** Add to `.env.local`, expose via `shared/config/`.
- **Imports:** Public API only — `index.ts` at slice root, no deep imports.
- **AI Development:** Rules and conventions for LLM agents are in `AGENTS.md`. Task-specific skills live in `.agents/skills/`.
