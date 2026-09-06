---
name: simdeploy-deploy
description: Use when the user asks to deploy, publish, ship or host a project or site. Deploys via the SimDeploy CLI (analyze, deploy --yes), reads typed failure states with simdeploy logs, fixes the cause and retries. Also use when the user asks what hosting a project would cost.
---

# Deploying with SimDeploy

SimDeploy analyzes the project, picks the lowest-cost compatible architecture and publishes it. You never choose CPU, RAM, region, runtime or provider.

## Preconditions

- CLI available: `simdeploy --version` (install: `npm i -g simdeploy`)
- Authenticated once: `simdeploy login --token <sd_live_...>` — if missing, ask the user to create a token in the SimDeploy dashboard (Settings) and provide it. Never guess tokens.

## Deploy flow

1. Optional but cheap: `simdeploy analyze --json` (offline — nothing uploaded). Read `analysis.recommendedArchitecture` and `recommendation.recommended.monthlyUsd`. Show the user the estimated cost before deploying if they asked about cost.
2. Deploy: `simdeploy deploy --yes` (never omit `--yes`; without it the CLI prompts).
3. On success the output contains the public URL. Verify it with a request before telling the user it is live.
4. On failure the exit code is non-zero and the status is typed:
   - `ANALYSIS_FAILED`: usually an architecture the platform cannot host yet (e.g. SSR before the cloud adapter). If the project is Next.js, `output: "export"` in next.config makes it deployable as static.
   - `BUILD_FAILED`: the local build broke — read `simdeploy logs`, fix the build, retry.
   - `DEPLOY_FAILED`: includes failed health checks — the published page returned non-2xx. Check the build output (index.html present?) and logs.
5. Status later: `simdeploy status --json`.

## Rules

- Always `--yes` and `--json` when you will parse output.
- Builds run locally; only build output is uploaded. Do not try to upload source.
- Cost figures are labeled estimates from provider price tables — report them as estimates, never as the bill.
- The full machine-readable contract is at the SimDeploy instance's `/llms.txt`.
