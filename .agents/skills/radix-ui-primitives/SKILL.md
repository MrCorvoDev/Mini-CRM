---
name: radix-ui-primitives
description: Wrap Radix primitives in shared/ui using the established pattern (asChild, sub-part files, minimal typed props); check existing wrappers first. Use before any new interactive raw HTML element or new Radix-based component.
---

# Radix UI Primitives

Never import `radix-ui` directly in `features/`/`entities/` — every primitive gets wrapped once in `shared/ui/`, features consume the wrapper.

Check the existing wrapper inventory before writing raw HTML; if genuinely missing, check for a Radix primitive before reaching for a raw `<div>`/`<input>`. Update the inventory when adding a wrapper.

## Pattern
- One folder per component in `shared/ui/` (e.g. `shared/ui/Select/`).
- Styled via co-located `.module.scss` (see `scss-styling`).
- Sub-parts (`SelectOption`, `DropdownMenuItem`, etc.) get their own file, re-exported from `index.ts`. Avoid sub components if there is no need(small file, or radix plain wrapper that doesn't add new features).
- Use `asChild` when the consumer needs its own element (e.g. `Link` instead of Radix's default) rather than duplicating markup.

## No Radix primitive available
Write raw HTML only inside `shared/ui/`, and still cover what Radix gives for free: ARIA roles, keyboard interaction, focus management.