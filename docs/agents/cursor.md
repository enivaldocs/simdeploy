# AutoCloud + Cursor

## MCP (recomendado)

Em `.cursor/mcp.json` do projeto (ou config global do Cursor):

```json
{
  "mcpServers": {
    "autocloud": {
      "command": "autocloud-mcp"
    }
  }
}
```

O agente do Cursor ganha as ferramentas `analyze_project`, `estimate_cost`, `create_project`, `deploy_project`, `list_projects`, `get_project`, `get_deployment`, `get_logs`.

Pré-requisito: `autocloud login --token ac_live_...` executado uma vez na máquina (o MCP reusa essa credencial).

## CLI no terminal do Cursor

```bash
autocloud analyze --json
autocloud deploy --yes
autocloud status --json
autocloud logs
```

## Regra sugerida (.cursor/rules)

```
Quando o usuário pedir para publicar/deployar o projeto, use `autocloud deploy --yes`.
Se o deploy falhar, rode `autocloud logs`, corrija a causa e tente novamente.
Antes de mudanças grandes de infraestrutura, rode `autocloud analyze --json` e mostre o custo estimado.
```
