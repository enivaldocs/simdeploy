/**
 * Páginas de aquisição. TODO o conteúdo descreve o produto real — funciona
 * hoje via CLI/MCP como descrito. Nada aspiracional apresentado como atual.
 */
export interface LandingContent {
  title: string;
  description: string;
  h1: string;
  intro: string;
  steps: string[];
  bullets: string[];
}

export const LANDING_PAGES: Record<string, LandingContent> = {
  "claude-code-deploy": {
    title: "Deploy from Claude Code — AutoCloud",
    description:
      "Let Claude Code deploy your project with one non-interactive command. AutoCloud analyzes the project, picks the lowest-cost architecture and returns a public URL.",
    h1: "Deploy straight from Claude Code",
    intro:
      "AutoCloud was designed for agents: non-interactive CLI, JSON output, structured logs and a native MCP server. Claude Code ships a project with zero infrastructure decisions.",
    steps: [
      "autocloud login --token ac_live_...  (once, by a human)",
      "autocloud analyze --json  (offline analysis: framework, architecture, estimated cost)",
      "autocloud deploy --yes  (builds locally, publishes and returns the URL)",
      "autocloud logs  (diagnosis when something fails)",
    ],
    bullets: [
      "MCP server with 8 tools (analyze_project, deploy_project, get_logs, ...)",
      "Non-zero exit code on failure — the agent knows when to fix",
      "Estimated cost before publishing, labeled as a projection",
    ],
  },
  "codex-deploy": {
    title: "Deploy from OpenAI Codex — AutoCloud",
    description:
      "AutoCloud gives Codex a one-command deploy: autocloud deploy --yes. Structured JSON output, typed failure states and readable logs.",
    h1: "Deploy straight from Codex",
    intro:
      "Codex operates AutoCloud through the non-interactive CLI. Every command takes --json and returns typed states (READY, BUILD_FAILED, DEPLOY_FAILED) the agent can handle.",
    steps: [
      "npm i -g autocloud",
      "autocloud login --token ac_live_...",
      "autocloud deploy --yes",
      "autocloud status --json",
    ],
    bullets: [
      "No interactive prompts with --yes — automation never hangs",
      "Per-stage logs (ANALYZE, BUILD, DEPLOY, HEALTH) via API and CLI",
      "AGENTS.md and llms.txt document the flow for any agent",
    ],
  },
  "cursor-deploy": {
    title: "Deploy from Cursor — AutoCloud",
    description:
      "Add the AutoCloud MCP server to Cursor and deploy projects without leaving the editor. Automatic architecture selection and cost estimates.",
    h1: "Deploy straight from Cursor",
    intro:
      "Add the AutoCloud MCP server to Cursor and the agent gains deploys, cost analysis and log reading — without leaving the editor and with zero infrastructure decisions.",
    steps: [
      'Add {"mcpServers": {"autocloud": {"command": "autocloud-mcp"}}} to .cursor/mcp.json',
      "autocloud login --token ac_live_...  (once)",
      "Ask the agent: deploy this project",
      "The agent gets the public URL or the typed error with logs",
    ],
    bullets: [
      "MCP analysis tools work offline (nothing leaves the machine)",
      "deploy_project builds locally and uploads only the output",
      "Estimated cost per architecture before publishing",
    ],
  },
  "vercel-alternative": {
    title: "AutoCloud — an AI-native deploy platform",
    description:
      "AutoCloud is a deploy platform built agent-first: automatic architecture selection, cost estimates before every deploy and predictable pricing.",
    h1: "An AI-native deploy platform",
    intro:
      "Instead of you picking runtime, region and plan, AutoCloud analyzes the project and selects the lowest-cost compatible architecture — showing the estimate before the deploy. Built for people who build with coding agents.",
    steps: [
      "autocloud analyze  (see architecture and estimated cost before changing anything)",
      "autocloud deploy --yes",
      "Public URL with a verified health check",
    ],
    bullets: [
      "Deterministic project analysis (framework, routes, database, workers)",
      "Cost-based routing across providers with open price tables",
      "Predictable pricing: limits and overages visible before you are charged",
    ],
  },
  "cheap-nextjs-hosting": {
    title: "Low-cost Next.js hosting decided by AI — AutoCloud",
    description:
      "AutoCloud analyzes your Next.js app and picks the cheapest compatible architecture. Static exports deploy free on the starter plan.",
    h1: "Next.js hosting at the lowest computed cost",
    intro:
      "AutoCloud analyzes your Next.js app — static share, API routes, database — and computes the cost per architecture before the deploy. Static builds (output: export) ship on the free plan today; SSR/serverless is rolling out on the cloud adapter.",
    steps: [
      "autocloud analyze  (shows staticPercentage, routes and cost per architecture)",
      "For a static site: output: 'export' in next.config",
      "autocloud deploy --yes",
    ],
    bullets: [
      "Estimated cost per architecture (static, hybrid, serverless, node-server)",
      "Provider free allowances applied in the math",
      "Estimates always labeled — the real bill comes from billing, no surprises",
    ],
  },
  "ai-deployment-platform": {
    title: "AI deployment platform for coding agents — AutoCloud",
    description:
      "AutoCloud is the deploy target for AI-built software: agents analyze, deploy and debug through CLI, API and MCP — humans just review.",
    h1: "The deploy platform for AI-built software",
    intro:
      "Code generated by agents needs a target that agents know how to operate. Every AutoCloud capability exists on four surfaces: dashboard, API, CLI and MCP — nothing critical depends on clicking through screens.",
    steps: [
      "The agent runs autocloud analyze --json and reads the recommended architecture",
      "autocloud deploy --yes publishes and returns a URL or a typed error",
      "autocloud logs feeds the agent's fix loop",
    ],
    bullets: [
      "Typed deployment states agents handle programmatically",
      "API with structured errors {code, message} and per-token scopes",
      "llms.txt, AGENTS.md and /docs/agents maintained as a contract",
    ],
  },
};
