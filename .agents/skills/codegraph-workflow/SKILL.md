---
name: codegraph-workflow
description: Navigate/modify the codebase via pi-codegraph tools in the correct order instead of grep/glob/multi-file Read. Use at the start of any "how does X work/reach Y" exploration, before renaming/editing a shared symbol, or before falling back to text search.
---

# CodeGraph Workflow

| Tool | Use for |
|---|---|
| `codegraph_explore` | Broad "how does X work/reach Y". Default starting point. |
| `codegraph_node` | One symbol's signature/location/source/callers/callees — name already known. |
| `codegraph_search` | Symbol search by name/declaration (not arbitrary text/constants — that's grep). |
| `codegraph_callers`/`codegraph_callees` | Who calls a symbol / what it calls. |
| `codegraph_impact` | Blast radius before any rename or signature change. |
| `codegraph_files` | Indexed file tree. |
| `codegraph_status` | Index health/pending sync — check if results look stale. |

1. Try `codegraph_explore` before grep/glob/Read.
2. Before editing/renaming an exported symbol, run `codegraph_impact`/`codegraph_callers` — don't assume usage is limited to where you found it.
3. Fall back to grep/glob/Read only for what CodeGraph doesn't cover: runtime behavior, non-indexed files, exact string/constant search.
4. If `codegraph_status` shows pending sync, flag it first.