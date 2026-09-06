# SimDeploy for coding agents

SimDeploy is designed to be operated by agents: everything the dashboard does exists in the (non-interactive) CLI and the API. This directory documents usage per agent/tool:

- [claude-code.md](claude-code.md) — Claude Code (CLI + MCP)
- [codex.md](codex.md) — OpenAI Codex
- [cursor.md](cursor.md) — Cursor

## Canonical flow (any agent)

```bash
# 1. Authenticate once (token created by a human in /dashboard/settings)
simdeploy login --token sd_live_...

# 2. Analyze (offline, no side effects)
simdeploy analyze --json

# 3. Non-interactive deploy
simdeploy deploy --yes

# 4. Verify
simdeploy status --json   # exit code != 0 if the deploy failed
simdeploy logs            # per-step logs when it fails
```

Golden rules:

- Always use `--yes` in automation; without it the CLI asks for confirmation in a TTY.
- Always use `--json` when you will parse the output.
- `deploy` returns a non-zero exit code on failure — treat it as a signal.
- The public URL comes in `deployment.url` in the deploy/status JSON.

## API

Base: `$SIMDEPLOY_API_URL` (default `http://localhost:3000`). Auth: header `Authorization: Bearer sd_live_...`.

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/v1/me` | validates the token; returns org and scopes |
| GET/POST | `/api/v1/projects` | list / create `{name, gitRepoUrl?}` |
| GET/DELETE | `/api/v1/projects/:id` | detail / delete |
| POST | `/api/v1/projects/:id/analyze` | `{analysis, usage?, strategy?}` → cost + planned route |
| GET/POST | `/api/v1/projects/:id/deployments` | list / deploy (multipart `meta` + `artifact`) |
| GET | `/api/v1/deployments/:id` | status + events |
| GET | `/api/v1/deployments/:id/logs` | logs (`?format=text` for text) |
| GET/POST | `/api/v1/projects/:id/env` | list keys / set `{key, value, target}` |
| DELETE | `/api/v1/projects/:id/env/:key` | remove a variable |
| POST | `/api/v1/cost/estimate` | `{analysis}` → estimate without a project |

Errors: `{"error": {"code", "message"}}` with a semantic HTTP status (401/403/404/413/429/400).

## MCP

stdio server: `simdeploy-mcp` (binary from the `@simdeploy/mcp-server` package). Tools: `analyze_project`, `estimate_cost`, `create_project`, `deploy_project`, `list_projects`, `get_project`, `get_deployment`, `get_logs`. Authentication reuses `~/.simdeploy/config.json` (created by `simdeploy login`).
