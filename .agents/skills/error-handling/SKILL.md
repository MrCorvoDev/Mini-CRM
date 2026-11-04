---
name: error-handling
description: Nexty error-handling conventions — RSC fetching, Server Actions, TanStack mutations, Redux thunks, ErrorBoundaries. Use for any try/catch, Server Action, mutation onError, createAsyncThunk, or ErrorBoundary.
---

# Error Handling

- **RSC fetching**: let errors bubble to nearest `error.tsx`; don't swallow with empty try/catch. Use `notFound()` for missing resources.
- **Server Actions**: validate with valibot first, return a typed `{ success: true, data } | { success: false, error }` instead of throwing across the server/client boundary.
- **Client mutations (TanStack)**: handle `onError` at the call site for user feedback. Don't rely on a global ErrorBoundary for expected failures (validation, 404s).
- **Redux thunks**: use `rejectWithValue` with a typed error shape; never let a thunk throw raw.
- **Render errors**: one `ErrorBoundary` per widget/page section, not one global boundary.
- Never catch-and-ignore — if caught, re-throw, re-surface, or log it.