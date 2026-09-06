# SimDeploy + Claude Code

## Option A — CLI (recommended)

Claude Code operates the CLI directly. Prerequisite: a human has run `simdeploy login --token sd_live_...` once on the machine.

```bash
simdeploy analyze --json     # offline inspection of the project in the cwd
simdeploy deploy --yes       # non-interactive deploy; exit != 0 on failure
simdeploy status --json      # latest deployment (status, url, error)
simdeploy logs               # per-step logs for diagnosis
```

Failure diagnosis: `deploy` prints the final status (`ANALYSIS_FAILED` | `BUILD_FAILED` | `DEPLOY_FAILED`) and the error message; `simdeploy logs` brings the log of the step that failed.

## Option B — MCP

`.mcp.json` in the project (or global config):

```json
{
  "mcpServers": {
    "simdeploy": {
      "command": "simdeploy-mcp"
    }
  }
}
```

Exposed tools: `analyze_project`, `estimate_cost`, `create_project`, `deploy_project`, `list_projects`, `get_project`, `get_deployment`, `get_logs`. All return JSON as text; `deploy_project` builds locally and returns the deployment with `url`.

## Suggested CLAUDE.md for user projects

```markdown
To publish this project: `simdeploy deploy --yes`.
To see why a deploy failed: `simdeploy logs`.
Estimated cost before publishing: `simdeploy analyze --json`.
```
