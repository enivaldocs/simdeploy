# SimDeploy + Claude Code

## Opção A — CLI (recomendada)

Claude Code opera a CLI diretamente. Pré-requisito: um humano rodou `simdeploy login --token sd_live_...` uma vez na máquina.

```bash
simdeploy analyze --json     # inspeção offline do projeto no cwd
simdeploy deploy --yes       # deploy não interativo; exit != 0 em falha
simdeploy status --json      # último deployment (status, url, error)
simdeploy logs               # logs por etapa para diagnóstico
```

Diagnóstico de falha: `deploy` imprime o status final (`ANALYSIS_FAILED` | `BUILD_FAILED` | `DEPLOY_FAILED`) e a mensagem de erro; `simdeploy logs` traz o log da etapa que falhou.

## Opção B — MCP

`.mcp.json` no projeto (ou config global):

```json
{
  "mcpServers": {
    "simdeploy": {
      "command": "simdeploy-mcp"
    }
  }
}
```

Ferramentas expostas: `analyze_project`, `estimate_cost`, `create_project`, `deploy_project`, `list_projects`, `get_project`, `get_deployment`, `get_logs`. Todas retornam JSON em texto; `deploy_project` builda localmente e retorna o deployment com `url`.

## Sugestão de CLAUDE.md para projetos de usuários

```markdown
Para publicar este projeto: `simdeploy deploy --yes`.
Para ver por que um deploy falhou: `simdeploy logs`.
Custo estimado antes de publicar: `simdeploy analyze --json`.
```
