# AutoCloud + OpenAI Codex

Codex opera a AutoCloud pela CLI não interativa.

## Setup (uma vez, por um humano)

```bash
npm i -g autocloud
autocloud login --token ac_live_...   # token criado em /dashboard/settings
```

## Comandos para o agente

```bash
autocloud analyze --json   # análise offline: framework, arquitetura, custo estimado
autocloud deploy --yes     # deploy completo; exit code != 0 em falha
autocloud status --json    # {deployment: {status, url, error}}
autocloud logs             # logs por etapa (ANALYZE/QUEUE/BUILD/DEPLOY)
```

## Sugestão para AGENTS.md de projetos de usuários

```markdown
## Deploy

- Publicar: `autocloud deploy --yes` (a URL sai no final; falha => exit != 0)
- Diagnóstico: `autocloud logs`
- Nunca editar configuração de servidor manualmente — a AutoCloud decide a infraestrutura.
```

## API direta

Se preferir HTTP: ver [README.md](README.md#api) — Bearer token, JSON, erros estruturados.
