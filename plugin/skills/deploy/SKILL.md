---
description: Use when the user asks to deploy, publish, ship or host a project or site, or asks what hosting a project would cost. Deploys via the SimDeploy CLI (simdeploy analyze, deploy --yes), reads typed failure states with simdeploy logs, fixes the cause and retries.
---

# Deploying with SimDeploy

SimDeploy analyzes the project, picks the lowest-cost compatible architecture and publishes it. No CPU, RAM, region, runtime or provider to choose.

## Preconditions

- CLI available: `npx simdeploy --version` (or install: `npm i -g simdeploy`).
- Authenticated once: `simdeploy login --token <sd_live_...>`. If not authenticated, ask the user to create a token at https://simdeploy.com/dashboard/settings and provide it. Never guess tokens.

## Deploy flow

1. Optional, offline (nothing uploaded): `simdeploy analyze --json`. Read `analysis.recommendedArchitecture` and `recommendation.recommended.monthlyUsd`. Show the estimated cost if the user asked about cost.
2. Deploy: `simdeploy deploy --yes` (never omit `--yes`; without it the CLI prompts).
3. On success the output contains the public URL. Verify it with a request before telling the user it is live.
4. On failure the exit code is non-zero and the status is typed:
   - `ANALYSIS_FAILED`: an architecture SimDeploy cannot host yet (e.g. Next.js SSR). If the project is Next.js, set `output: "export"` in next.config to deploy it as static, then retry.
   - `BUILD_FAILED`: the local build broke — run `simdeploy logs`, fix the build, retry.
   - `DEPLOY_FAILED`: includes a failed health check (published page returned non-2xx). Check that the build output has an index.html; read `simdeploy logs`.
5. Status later: `simdeploy status --json`.

## Rules

- Always `--yes` and `--json` when parsing output.
- Builds run locally; only build output is uploaded. Do not try to upload source.
- Cost figures are labeled estimates from provider price tables — report them as estimates, never as the bill.
- Full machine-readable contract: https://simdeploy.com/llms.txt
