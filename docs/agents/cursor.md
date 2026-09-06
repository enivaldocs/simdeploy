# SimDeploy + Cursor

## MCP (recommended)

In the project's `.cursor/mcp.json` (or Cursor's global config):

```json
{
  "mcpServers": {
    "simdeploy": {
      "command": "simdeploy-mcp"
    }
  }
}
```

The Cursor agent gains the tools `analyze_project`, `estimate_cost`, `create_project`, `deploy_project`, `list_projects`, `get_project`, `get_deployment`, `get_logs`.

Prerequisite: `simdeploy login --token sd_live_...` run once on the machine (the MCP reuses that credential).

## CLI in the Cursor terminal

```bash
simdeploy analyze --json
simdeploy deploy --yes
simdeploy status --json
simdeploy logs
```

## Suggested rule (.cursor/rules)

```
When the user asks to publish/deploy the project, use `simdeploy deploy --yes`.
If the deploy fails, run `simdeploy logs`, fix the cause, and try again.
Before large infrastructure changes, run `simdeploy analyze --json` and show the estimated cost.
```
