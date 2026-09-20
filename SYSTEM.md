# Orathon Second Brain — Operating Guide

This repository is a durable working-memory and workflow layer for one person or team. Treat saved files as durable context and live systems as authoritative for facts that change over time.

## Primary goals

1. Help the user retrieve the right context without repeatedly explaining it.
2. Preserve decisions, discoveries, and working knowledge across sessions.
3. Make important external systems reachable through clear routes.
4. Turn repeated work into small, testable workflows.
5. Prefer reliable, understandable mechanisms over unnecessary complexity.

## Canonical routes

| Need | Read first |
|---|---|
| Who the user is and what they do | `workspace/identity.md` |
| Current outcomes and priorities | `workspace/objectives.md` |
| Writing and collaboration preferences | `workspace/style.md` |
| External systems and file sources | `workspace/sources.md` |
| Important decisions | `journal/decisions.md` |
| Raw discovery/interview history | `captures/` |
| Reliability reviews | `reviews/` |
| Reusable workflow assets | `workflows/` |
| Visual knowledge explorer | `apps/knowledge-map/README.md` |

## Working rules

- Answer the user's question before adding process commentary.
- Reuse saved facts instead of asking the user to repeat them.
- Distinguish current facts, historical facts, tentative ideas, and assistant suggestions.
- For changing facts, prefer the live source or a dated export over an old summary.
- Never save passwords, API keys, access tokens, or full secret values.
- When a meaningful decision is finalized, offer to record it in `journal/decisions.md`.
- When an important file, folder, or external source is added, use the `route` skill so a future session can find it.
- Do not create duplicate sources of truth. Link to the canonical source instead.
- Avoid autonomous external actions unless the user explicitly requested them and the runtime permits them.
- For high-impact workflows, start with a manual or review-required version and expand autonomy only after successful use.

## Available skills

- `setup` — initialize or refresh durable user/business context.
- `capture` — run a guided discovery session and checkpoint answers to disk.
- `route` — add the smallest useful route to a file, folder, or external source.
- `healthcheck` — test whether context, retrieval, connections, workflows, and recurring behavior are actually usable.
- `improve` — turn one recurring pain point into one measurable improvement.
- `knowledge-map` — configure and build the local visual explorer.

## Freshness

`workspace/objectives.md` and `workspace/sources.md` should include dates when facts can become stale. A summary is not proof that a live system is still reachable.

## Safe editing

Preserve unrelated content. Prefer narrow edits. If a file already has a clear canonical owner, update or route to it rather than creating a parallel file.
