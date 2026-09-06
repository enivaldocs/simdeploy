/**
 * Documentação pública (/docs). Padrão observado no tráfego orgânico da
 * Vercel: docs indexáveis são o maior motor de aquisição de dev tools.
 * TODO o conteúdo descreve o produto REAL como ele funciona hoje.
 */

export interface DocSection {
  h2: string;
  paragraphs?: string[];
  code?: string;
}

export interface DocPage {
  slug: string;
  title: string;
  description: string;
  group: string;
  sections: DocSection[];
}

export const DOC_PAGES: DocPage[] = [
  {
    slug: "getting-started",
    title: "Getting started with AutoCloud",
    description:
      "From code to a public URL in one command: install the CLI, authenticate, analyze and deploy.",
    group: "Basics",
    sections: [
      {
        h2: "1. Install the CLI",
        code: "npm i -g autocloud",
      },
      {
        h2: "2. Authenticate",
        paragraphs: [
          "Create an API token in the dashboard (Settings) and log in once. Tokens are scoped and revocable; only a hash is ever stored.",
        ],
        code: "autocloud login --token ac_live_...",
      },
      {
        h2: "3. Analyze (optional, offline)",
        paragraphs: [
          "The analyzer runs entirely on your machine — nothing is uploaded. It detects the framework, API routes, database, workers and static share, then prices every compatible architecture from provider price tables.",
        ],
        code: "autocloud analyze --json",
      },
      {
        h2: "4. Deploy",
        paragraphs: [
          "The build runs on your machine; only the output is uploaded. The platform re-runs the cost analysis, routes to the lowest-cost compatible architecture, publishes and verifies the URL with a real HTTP health check.",
        ],
        code: "autocloud deploy --yes\n\n# Deployment ready:\n# https://your-project.autocloud.app",
      },
      {
        h2: "What is supported today",
        paragraphs: [
          "Detected frameworks: Next.js, Vite, React (CRA), Astro, Express, generic Node and static sites. Deploys currently cover static builds (Vite, CRA, static Astro, Next.js with output: 'export'); SSR/serverless is rolling out on the cloud adapter and fails with a clear, typed error until then.",
        ],
      },
    ],
  },
  {
    slug: "cli",
    title: "AutoCloud CLI",
    description:
      "Command reference: login, analyze, deploy, status, logs, projects — with the flags that matter for automation.",
    group: "Basics",
    sections: [
      {
        h2: "Commands",
        code: `autocloud login --token <ac_live_...>  # authenticate (once)
autocloud analyze [--json] [--dir <path>]  # offline analysis + cost estimate
autocloud deploy [--yes] [--json] [--dir <path>]  # build locally and publish
autocloud status [--json]  # latest deployment of the linked project
autocloud logs [--json]    # per-stage logs of the latest deployment
autocloud projects [--json]  # list your projects`,
      },
      {
        h2: "Automation flags",
        paragraphs: [
          "--yes skips every prompt — required for CI and coding agents (without it, deploy asks for confirmation on a TTY and refuses on a non-TTY).",
          "--json prints structured output on analyze, deploy, status and projects. Exit codes are honest: non-zero on failure, so agents and scripts can branch on them.",
        ],
      },
      {
        h2: "Project linking",
        paragraphs: [
          "The first deploy in a directory creates the project and writes .autocloud/project.json (added to your .gitignore automatically). Subsequent deploys reuse the link.",
        ],
      },
    ],
  },
  {
    slug: "deployments",
    title: "Deployments",
    description:
      "The deployment pipeline: typed states, per-stage logs, health checks and how failures are reported.",
    group: "Platform",
    sections: [
      {
        h2: "Pipeline states",
        paragraphs: [
          "Every deployment moves through a typed state machine: CREATED, ANALYZING, QUEUED, BUILDING, UPLOADING, DEPLOYING, HEALTH_CHECK, READY — with typed failures ANALYSIS_FAILED, BUILD_FAILED and DEPLOY_FAILED. Each transition is recorded as an event; each stage writes structured logs.",
        ],
      },
      {
        h2: "What each stage does",
        paragraphs: [
          "ANALYZING re-prices the project against current provider price tables and routes it (lowest cost wins among compatible architectures). BUILDING validates the artifact built on your machine. UPLOADING persists it. DEPLOYING publishes through the provider adapter. HEALTH_CHECK performs a real HTTP request against the published URL — a non-2xx response fails the deployment instead of shipping something broken.",
        ],
      },
      {
        h2: "Reading failures",
        paragraphs: [
          "Failures carry the stage-typed status plus an error message, and the per-stage logs are available in the dashboard, via autocloud logs, and via GET /api/v1/deployments/:id/logs (JSON by default, ?format=text for plain text).",
        ],
      },
      {
        h2: "Security model",
        paragraphs: [
          "Your code never executes on the platform's servers: builds run on your machine and only the output artifact is uploaded. Artifacts are validated before extraction — no symlinks, no path traversal, size and entry limits.",
        ],
      },
    ],
  },
  {
    slug: "environment-variables",
    title: "Environment variables",
    description:
      "Encrypted at rest, never displayed after saving, scoped per environment — managed via dashboard or API.",
    group: "Platform",
    sections: [
      {
        h2: "How they are stored",
        paragraphs: [
          "Values are encrypted with AES-256-GCM before touching the database, never appear in logs, and are never returned in plaintext after creation — the dashboard shows only the key and a mask. Changes are recorded in the audit log (key name only, never the value).",
        ],
      },
      {
        h2: "Managing variables",
        paragraphs: [
          "Dashboard: project page, Environment Variables tab. API: GET/POST /api/v1/projects/:id/env and DELETE /api/v1/projects/:id/env/:key (scopes env:read / env:write). Targets: all environments, production or preview.",
        ],
        code: `curl -X POST https://<host>/api/v1/projects/<id>/env \\
  -H "Authorization: Bearer ac_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"key":"DATABASE_URL","value":"...","target":"production"}'`,
      },
      {
        h2: "Build-time variables",
        paragraphs: [
          "Because builds run on your machine in the current model, build-time variables come from your local environment (your .env). Platform-stored variables are injected into server-side runtimes as cloud architectures roll out.",
        ],
      },
    ],
  },
  {
    slug: "api",
    title: "REST API",
    description:
      "The AutoCloud API v1: authentication, endpoints, error format and scopes — everything the dashboard does, programmatically.",
    group: "Platform",
    sections: [
      {
        h2: "Authentication",
        paragraphs: [
          "Bearer tokens (ac_live_...) created in the dashboard, with per-token scopes: projects:read/write, deployments:read/write, logs:read, env:read/write, cost:read, billing:read. Rate limits apply per identity; errors return a consistent shape.",
        ],
        code: '{"error": {"code": "forbidden", "message": "..."}}',
      },
      {
        h2: "Endpoints",
        code: `GET  /api/v1/me                              # token check, org, scopes
GET  /api/v1/projects                        # list projects
POST /api/v1/projects                        # {name, gitRepoUrl?}
GET  /api/v1/projects/:id                    # project detail
DELETE /api/v1/projects/:id                  # unpublish + delete
POST /api/v1/projects/:id/analyze            # register analysis, get cost + route
GET  /api/v1/projects/:id/deployments        # list deployments
POST /api/v1/projects/:id/deployments        # deploy (multipart meta + artifact)
GET  /api/v1/deployments/:id                 # status + events
GET  /api/v1/deployments/:id/logs            # logs (?format=text)
GET/POST /api/v1/projects/:id/env            # environment variables
POST /api/v1/cost/estimate                   # standalone cost estimate
GET  /api/v1/billing                         # plan, credits, invoices`,
      },
      {
        h2: "Deploy payload",
        paragraphs: [
          "POST deployments takes multipart/form-data: a meta field (JSON with the ProjectAnalysis, trigger, strategy and git info) and an artifact field (tar.gz of the build output, max 100MB). The CLI does this for you; the format is documented so agents and CI can too.",
        ],
      },
    ],
  },
  {
    slug: "mcp",
    title: "MCP server",
    description:
      "Give Claude Code, Codex or Cursor direct tools to analyze, deploy and debug projects on AutoCloud.",
    group: "For agents",
    sections: [
      {
        h2: "Setup",
        paragraphs: [
          "The MCP server ships as the autocloud-mcp stdio binary and reuses the CLI's authentication (~/.autocloud/config.json from autocloud login).",
        ],
        code: `{
  "mcpServers": {
    "autocloud": { "command": "autocloud-mcp" }
  }
}`,
      },
      {
        h2: "Tools",
        paragraphs: [
          "analyze_project and estimate_cost run fully offline. create_project, deploy_project, list_projects, get_project, get_deployment and get_logs talk to the API. deploy_project builds locally and uploads only the output, returning the deployment with its URL or typed error.",
        ],
      },
      {
        h2: "Agent contract",
        paragraphs: [
          "The stable, machine-readable summary of how agents should operate AutoCloud lives at /llms.txt; the human version is /docs/agents. Deployment states and error shapes are typed and documented so agents can branch on them.",
        ],
      },
    ],
  },
  {
    slug: "cost-engine",
    title: "Cost engine and architecture routing",
    description:
      "How AutoCloud prices every compatible architecture from provider price tables and picks the cheapest — before anything deploys.",
    group: "Platform",
    sections: [
      {
        h2: "Estimates, not invoices",
        paragraphs: [
          "Every figure the cost engine produces is a projection from public provider price tables (with their free allowances) and explicit usage assumptions — always labeled as an estimate. The only real charge on AutoCloud is your subscription plan.",
        ],
      },
      {
        h2: "How routing works",
        paragraphs: [
          "The analyzer produces facts about the project (framework, API routes, static share, database, workers). Compatibility rules eliminate architectures that cannot run it (background workers exclude serverless, for example). The router then compares the monthly projection of every remaining architecture across providers and picks the cheapest — that is the default CHEAPEST strategy; BALANCED and PERFORMANCE exist for when performance data justifies paying more.",
        ],
      },
      {
        h2: "Seeing the numbers",
        paragraphs: [
          "autocloud analyze prints the recommended architecture, its monthly projection and the alternatives with their prices. The same breakdown is stored with every deployment and visible in the dashboard, including the reasons for the chosen route.",
        ],
      },
    ],
  },
  {
    slug: "plans-and-limits",
    title: "Plans, limits and the free tier",
    description:
      "What each AutoCloud plan includes, how limits work, and how billing stays predictable.",
    group: "Basics",
    sections: [
      {
        h2: "Free tier",
        paragraphs: [
          "The free plan is real: projects with an autocloud subdomain, enough bandwidth and deploys for side projects and evaluation, no card required. Limits are explicit on the pricing page and in your dashboard.",
        ],
      },
      {
        h2: "Paid plans",
        paragraphs: [
          "Paid plans raise project counts, bandwidth, storage and daily deploys, and unlock custom domains. Prices are fixed monthly (or annual) amounts billed through Stripe, with a portal to change plans or cancel anytime. Online purchases carry a 7-day right of withdrawal (article 49 of the Brazilian Consumer Code).",
        ],
      },
      {
        h2: "Usage is measured, not guessed",
        paragraphs: [
          "Requests, bandwidth, storage and deploys are metered from real traffic and shown in your dashboard. Approaching a limit triggers a notification at 80% and 100% — no surprise cutoffs, no surprise bills.",
        ],
      },
    ],
  },
];

export function getDocPage(slug: string): DocPage | undefined {
  return DOC_PAGES.find((page) => page.slug === slug);
}
