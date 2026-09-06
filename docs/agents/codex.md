# SimDeploy + OpenAI Codex

Codex operates SimDeploy through the non-interactive CLI.

## Setup (once, by a human)

```bash
npm i -g simdeploy
simdeploy login --token sd_live_...   # token created in /dashboard/settings
```

## Commands for the agent

```bash
simdeploy analyze --json   # offline analysis: framework, architecture, estimated cost
simdeploy deploy --yes     # full deploy; exit code != 0 on failure
simdeploy status --json    # {deployment: {status, url, error}}
simdeploy logs             # per-step logs (ANALYZE/QUEUE/BUILD/DEPLOY)
```

## Suggestion for user projects' AGENTS.md

```markdown
## Deploy

- Publish: `simdeploy deploy --yes` (the URL comes out at the end; failure => exit != 0)
- Diagnosis: `simdeploy logs`
- Never edit server configuration manually — SimDeploy decides the infrastructure.
```

## Direct API

If you prefer HTTP: see [README.md](README.md#api) — Bearer token, JSON, structured errors.
