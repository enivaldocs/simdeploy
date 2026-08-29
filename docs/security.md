# Segurança

## Modelo de ameaça central

Código de usuário é HOSTIL. Ele nunca executa no servidor da plataforma: o build roda no cliente (CLI) e o servidor recebe apenas artefatos, validados antes da extração (sem symlinks/hardlinks/devices, sem `..`/paths absolutos, limites de 20k arquivos/500MB).

## Controles implementados

| Área | Controle |
| --- | --- |
| Autenticação | Sessão httpOnly com hash SHA-256 no banco; OAuth state HMAC; dev-login só com NODE_ENV=development |
| API tokens | `ac_live_*`, só hash persistido, scopes, expiração, revogação, lastUsedAt |
| RBAC | MemberRole (org) + StaffRole (admin) verificados no backend em toda rota/página |
| Multi-tenant | Toda query filtra por organizationId derivado do auth context, nunca do input (anti-IDOR) |
| Input | zod em toda rota de API (schemas compartilhados) |
| Secrets | Env vars AES-256-GCM em repouso; nunca logados; nunca retornados após criação; auditoria de alteração registra a CHAVE, nunca o valor |
| Webhooks | Assinatura Stripe validada antes de qualquer efeito; dedup; retry controlado |
| Upload | Multipart limitado a 100MB; artefato validado na extração |
| Serving | Path traversal bloqueado (resolve + startsWith); content-types por allowlist |
| Rate limit | Token bucket por identidade (API), por IP (auth), por org (deploy) |
| Audit | Mutações sensíveis com before/after, IP e user-agent |
| CSRF | Cookies sameSite=lax; mutações via fetch same-origin; tokens Bearer imunes |
| Billing | Estado de pagamento só muda via webhook assinado — nunca pelo frontend |

## Pendências conhecidas (registradas, não escondidas)

- Rate limit em memória (single-instance) — trocar por Redis ao escalar horizontalmente.
- Idempotency-Key header em POSTs de deployment (hoje: rate limit + dedup natural por artefato).
- 2FA/SSO para contas staff.
