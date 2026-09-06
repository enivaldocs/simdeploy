# SimDeploy + OpenAI Codex

Codex opera a SimDeploy pela CLI não interativa.

## Setup (uma vez, por um humano)

```bash
npm i -g simdeploy
simdeploy login --token sd_live_...   # token criado em /dashboard/settings
```

## Comandos para o agente

```bash
simdeploy analyze --json   # análise offline: framework, arquitetura, custo estimado
simdeploy deploy --yes     # deploy completo; exit code != 0 em falha
simdeploy status --json    # {deployment: {status, url, error}}
simdeploy logs             # logs por etapa (ANALYZE/QUEUE/BUILD/DEPLOY)
```

## Sugestão para AGENTS.md de projetos de usuários

```markdown
## Deploy

- Publicar: `simdeploy deploy --yes` (a URL sai no final; falha => exit != 0)
- Diagnóstico: `simdeploy logs`
- Nunca editar configuração de servidor manualmente — a SimDeploy decide a infraestrutura.
```

## API direta

Se preferir HTTP: ver [README.md](README.md#api) — Bearer token, JSON, erros estruturados.
