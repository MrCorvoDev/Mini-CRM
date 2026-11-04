---
name: state-management
description: Choose between TanStack Query, Redux Toolkit, and Context, and apply correct patterns once chosen. Use when deciding where state lives, creating a model/ file, writing createSlice/createAsyncThunk, or reviewing for server data leaking into Redux.
---

# State Management Boundaries

| Store | Use for | Never for |
|---|---|---|
| **TanStack Query** | Server/async state: anything fetched, cached, revalidated, mutated remotely. | Client-only UI state. |
| **Redux Toolkit** | Global client state: auth session, app-wide UI flags, user settings. | Server data — don't mirror a query result into Redux. |
| **React Context** | Component-scoped shared state (compound components, local UI coordination). | Anything async or global; if two unrelated routes need it, it's not Context's job. |

Common review mistake: `createAsyncThunk` wrapping a plain GET into Redux — that's TanStack Query's job.

## TanStack Query
- Query keys + fetcher functions live in the slice's `api/` segment.
- `queryFn` stays thin — calls the shared API client, no inline business logic.
- `onError` at the call site for user feedback (see `error-handling`).

## Redux Toolkit
Location: `<slice>/model/`. `createAsyncThunk` only for state-affecting async flows (e.g. login), not plain data fetching. Use `rejectWithValue` with a typed error shape (see `error-handling`). Use `createSelector` for derived/computed state read in a component — selector memoization is Reselect's job, not the Compiler's.

## React Context
Location: `<slice>/model/`, exposed via a custom hook (e.g. `useTabsContext`), never raw `useContext` outside that hook. Provider lives with the compound component root. Reaching for Context to avoid prop drilling across route boundaries is a signal it should be Redux instead.