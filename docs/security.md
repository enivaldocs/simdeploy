# Security

## Core threat model

User code is HOSTILE. It never runs on the platform server: the build runs on the client (CLI) and the server receives only artifacts, validated before extraction (no symlinks/hardlinks/devices, no `..`/absolute paths, limits of 20k files/500MB).

## Implemented controls

| Area | Control |
| --- | --- |
| Authentication | httpOnly session with a SHA-256 hash in the database; OAuth state HMAC; dev-login only with NODE_ENV=development |
| API tokens | `sd_live_*`, only the hash persisted, scopes, expiration, revocation, lastUsedAt |
| RBAC | MemberRole (org) + StaffRole (admin) verified in the backend on every route/page |
| Multi-tenant | Every query filters by organizationId derived from the auth context, never from input (anti-IDOR) |
| Input | zod on every API route (shared schemas) |
| Secrets | Env vars AES-256-GCM at rest; never logged; never returned after creation; a change audit records the KEY, never the value |
| Webhooks | Stripe signature validated before any effect; dedup; controlled retry |
| Upload | Multipart limited to 100MB; artifact validated on extraction |
| Serving | Path traversal blocked (resolve + startsWith); content-types by allowlist |
| Rate limit | Token bucket per identity (API), per IP (auth), per org (deploy) |
| Audit | Sensitive mutations with before/after, IP, and user-agent |
| CSRF | Cookies sameSite=lax; mutations via same-origin fetch; Bearer tokens immune |
| Billing | Payment state only changes via a signed webhook — never from the frontend |

## Known open items (recorded, not hidden)

- In-memory rate limit (single-instance) — swap for Redis when scaling horizontally.
- Idempotency-Key header on deployment POSTs (today: rate limit + natural dedup by artifact).
- 2FA/SSO for staff accounts.
