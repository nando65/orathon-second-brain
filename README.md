# Orathon Second Brain

A local-first AI second brain for **Claude Code** and **Codex**.

It gives your AI a durable workspace for understanding who you are, what matters now, where your information lives, what decisions you have made, and which workflows you want to improve.

## Install

```bash
git clone https://github.com/nando65/orathon-second-brain.git
cd orathon-second-brain
```

### Claude Code

Open the cloned folder in Claude Code and run:

```text
/setup
```

Claude automatically reads `CLAUDE.md`, which routes it to the shared operating guide in `SYSTEM.md`. Claude-specific skills live in `.claude/skills/`.

### Codex

Open the cloned folder as a local project in Codex, then select the `setup` skill or use:

```text
$setup
```

Codex automatically reads `AGENTS.md`, which routes it to the same shared operating guide. Codex-specific skill copies live in `.agents/skills/`.

## What it does

Orathon Second Brain includes six core capabilities:

| Capability | Claude | Codex | Purpose |
|---|---|---|---|
| Setup | `/setup` | `$setup` | Learn who you are, your goals, systems, preferences, and boundaries |
| Capture | `/capture` | `$capture` | Turn discovery conversations into durable notes as you talk |
| Route | `/route` | `$route` | Make important files, folders, projects, and external sources findable |
| Healthcheck | `/healthcheck` | `$healthcheck` | Verify that context, retrieval, sources, workflows, and recurring behavior actually work |
| Improve | `/improve` | `$improve` | Turn one recurring pain point into one measurable workflow improvement |
| Knowledge Map | `/knowledge-map` | `$knowledge-map` | Build a local visual explorer of your Markdown/text knowledge |

## How the second brain is organized

```text
orathon-second-brain/
├── SYSTEM.md                 # Canonical operating guide shared by both runtimes
├── CLAUDE.md                 # Claude Code entry point
├── AGENTS.md                 # Codex entry point
├── workspace/
│   ├── identity.md           # Who you are / what you do
│   ├── objectives.md         # What matters now
│   ├── style.md              # Collaboration and writing preferences
│   └── sources.md            # Registry of authoritative systems and files
├── journal/
│   └── decisions.md          # Durable record of important decisions
├── captures/                 # Guided discovery sessions (private / gitignored)
├── reviews/                  # Healthcheck reports (private / gitignored)
├── workflows/                # Reusable workflow assets
├── apps/
│   └── knowledge-map/        # Local visual knowledge explorer
├── .claude/skills/           # Claude Code skills
└── .agents/skills/           # Codex skills
```

`SYSTEM.md` is the single shared source of operating behavior. `CLAUDE.md` and `AGENTS.md` intentionally stay small so Claude and Codex behave consistently instead of drifting into two different second brains.

## First 10 minutes

1. Clone the repository.
2. Open it in Claude Code or Codex.
3. Run `setup`.
4. Answer the prompts about your role, goals, systems, recurring work, working style, and boundaries.
5. Ask the AI a real work question and let it use the saved context.
6. Use `route` whenever you add an important source.
7. Run `healthcheck` after you have connected real information sources or built a workflow.

## Local Knowledge Map

The included map visualizes local Markdown and text files without uploading them to an external service.

Requires Node.js 20+.

```bash
node scripts/build-map.mjs
node scripts/serve-map.mjs
```

Then open:

```text
http://127.0.0.1:4747
```

It supports category filters, search, explicit note links, and local note reading.

## Privacy

- Keep passwords, API keys, and access tokens out of Markdown.
- `captures/`, `reviews/`, generated map data, and local map configuration are gitignored by default.
- Prefer pointing to authoritative live systems instead of copying large private datasets into this repo.
- The knowledge-map server binds only to `127.0.0.1`.

## Updating skills

`.claude/skills/` is the authoring source. If you change a skill and want the Codex copy regenerated:

```bash
node scripts/sync-skills.mjs
```

## License

MIT. See `LICENSE`.

Built by Orathon.
