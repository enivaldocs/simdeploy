# AutoCloud para coding agents

AutoCloud foi desenhada para ser operada por agentes: tudo que o dashboard faz existe em CLI (não interativa) e API. Este diretório documenta o uso por agente/ferramenta:

- [claude-code.md](claude-code.md) — Claude Code (CLI + MCP)
- [codex.md](codex.md) — OpenAI Codex
- [cursor.md](cursor.md) — Cursor

## Fluxo canônico (qualquer agente)

```bash
# 1. Autenticar uma vez (token criado por um humano em /dashboard/settings)
autocloud login --token ac_live_...

# 2. Analisar (offline, sem efeitos colaterais)
autocloud analyze --json

# 3. Deploy não interativo
autocloud deploy --yes

# 4. Verificar
autocloud status --json   # exit code != 0 se o deploy falhou
autocloud logs            # logs por etapa quando falhar
```

Regras de ouro:

- Sempre `--yes` em automação; sem ele a CLI pede confirmação em TTY.
- Sempre `--json` quando for interpretar a saída.
- `deploy` retorna exit code diferente de zero em falha — trate como sinal.
- A URL pública vem em `deployment.url` no JSON do deploy/status.

## API

Base: `$AUTOCLOUD_API_URL` (default `http://localhost:3000`). Auth: header `Authorization: Bearer ac_live_...`.

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/v1/me` | valida token; retorna org e scopes |
| GET/POST | `/api/v1/projects` | listar / criar `{name, gitRepoUrl?}` |
| GET/DELETE | `/api/v1/projects/:id` | detalhe / remover |
| POST | `/api/v1/projects/:id/analyze` | `{analysis, usage?, strategy?}` → custo + rota planejada |
| GET/POST | `/api/v1/projects/:id/deployments` | listar / deploy (multipart `meta` + `artifact`) |
| GET | `/api/v1/deployments/:id` | status + eventos |
| GET | `/api/v1/deployments/:id/logs` | logs (`?format=text` para texto) |
| GET/POST | `/api/v1/projects/:id/env` | listar chaves / definir `{key, value, target}` |
| DELETE | `/api/v1/projects/:id/env/:key` | remover variável |
| POST | `/api/v1/cost/estimate` | `{analysis}` → estimativa sem projeto |

Erros: `{"error": {"code", "message"}}` com HTTP status semântico (401/403/404/413/429/400).

## MCP

Servidor stdio: `autocloud-mcp` (binário do pacote `@autocloud/mcp-server`). Ferramentas: `analyze_project`, `estimate_cost`, `create_project`, `deploy_project`, `list_projects`, `get_project`, `get_deployment`, `get_logs`. A autenticação reusa `~/.autocloud/config.json` (criada por `autocloud login`).
