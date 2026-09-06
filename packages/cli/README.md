# SimDeploy CLI

Deploy any project without choosing servers, CPU, region or runtime. SimDeploy analyzes your code, picks the lowest-cost compatible architecture, deploys it and gives you a public URL — in one command.

Built for developers and coding agents (Claude Code, Codex, Cursor).

## Install

```bash
npm i -g simdeploy
```

## Use

```bash
simdeploy login --token sd_live_...   # create a token at https://simdeploy.com/dashboard/settings
simdeploy analyze --json              # offline: framework, architecture, estimated cost
simdeploy deploy --yes                # build locally, publish, get a URL
simdeploy logs                        # per-stage logs if something fails
simdeploy status                      # latest deployment
```

`--yes` skips prompts (use it in CI and with agents). `--json` prints structured output. Exit codes are non-zero on failure.

## How it works

The build runs on your machine; only the output is uploaded. The platform re-prices the project against provider price tables, routes it to the cheapest compatible architecture, publishes it and verifies the URL with a real health check.

Docs: https://simdeploy.com/docs · Agent guide: https://simdeploy.com/docs/agents · Machine-readable: https://simdeploy.com/llms.txt

MIT © Yes Serviços Digitais
