# SimDeploy + Cursor

## MCP (recomendado)

Em `.cursor/mcp.json` do projeto (ou config global do Cursor):

```json
{
  "mcpServers": {
    "simdeploy": {
      "command": "simdeploy-mcp"
    }
  }
}
```

O agente do Cursor ganha as ferramentas `analyze_project`, `estimate_cost`, `create_project`, `deploy_project`, `list_projects`, `get_project`, `get_deployment`, `get_logs`.

Pré-requisito: `simdeploy login --token sd_live_...` executado uma vez na máquina (o MCP reusa essa credencial).

## CLI no terminal do Cursor

```bash
simdeploy analyze --json
simdeploy deploy --yes
simdeploy status --json
simdeploy logs
```

## Regra sugerida (.cursor/rules)

```
Quando o usuário pedir para publicar/deployar o projeto, use `simdeploy deploy --yes`.
Se o deploy falhar, rode `simdeploy logs`, corrija a causa e tente novamente.
Antes de mudanças grandes de infraestrutura, rode `simdeploy analyze --json` e mostre o custo estimado.
```
