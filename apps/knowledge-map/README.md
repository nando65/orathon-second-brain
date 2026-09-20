# Local Knowledge Map

A zero-dependency local explorer for Markdown and text files.

Features:

- categories from config,
- deterministic 2D layout,
- search,
- category filters,
- explicit Markdown and wiki-link edges,
- local note reader,
- basic inventory counts,
- no external network calls.

## Configure

Edit `map.config.json` for shared defaults, or create `map.config.local.json` for user-specific paths.

Paths are resolved relative to the repository root.

## Build

```bash
node scripts/build-map.mjs
```

This writes `apps/knowledge-map/data/graph.json`.

## Serve

```bash
node scripts/serve-map.mjs
```

Then open `http://127.0.0.1:4747`.

Generated data may contain note content and is gitignored.
