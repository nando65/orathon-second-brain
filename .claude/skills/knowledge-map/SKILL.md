---
name: knowledge-map
description: Configure, build, and run the local visual knowledge map for Markdown and text sources.
argument-hint: "[map title or source categories]"
---

# Knowledge Map

This skill builds an independent local 2D explorer. It does not require external services or API keys.

Read:
- `SYSTEM.md`
- `apps/knowledge-map/README.md`
- `apps/knowledge-map/map.config.json`

## Configure

Ask only for information not already supplied:

1. What should the map be called?
2. Which local categories should it include?

For each category, record:
- an ID,
- display label,
- one or more verified local paths.

Use 1–10 categories. Do not guess paths.

Update `apps/knowledge-map/map.config.local.json` so user-specific paths remain untracked.

## Build and run

From repository root:

```bash
node scripts/build-map.mjs
node scripts/serve-map.mjs
```

The server binds only to `127.0.0.1`.

## Verify

Confirm:
- the generated node count is nonzero when selected sources contain notes,
- configured categories appear,
- search finds a known note,
- category filtering works,
- selecting a node opens its note content,
- explicit Markdown links are rendered when their target can be resolved,
- no source files were modified.

If a category is empty, report it honestly. Do not invent knowledge to populate the map.
