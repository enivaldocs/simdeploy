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
    h1: "Deploy direto do Claude Code",
    intro:
      "A AutoCloud foi desenhada para agentes: CLI não interativa, saída JSON, logs estruturados e um MCP server nativo. O Claude Code publica um projeto sem nenhuma decisão de infraestrutura.",
    steps: [
      "autocloud login --token ac_live_...  (uma vez, por um humano)",
      "autocloud analyze --json  (análise offline: framework, arquitetura, custo estimado)",
      "autocloud deploy --yes  (build local, publica e retorna a URL)",
      "autocloud logs  (diagnóstico quando algo falha)",
    ],
    bullets: [
      "MCP server com 8 ferramentas (analyze_project, deploy_project, get_logs, ...)",
      "Exit code diferente de zero em falha — o agente sabe quando corrigir",
      "Custo estimado antes de publicar, rotulado como projeção",
    ],
  },
  "codex-deploy": {
    title: "Deploy from OpenAI Codex — AutoCloud",
    description:
      "AutoCloud gives Codex a one-command deploy: autocloud deploy --yes. Structured JSON output, typed failure states and readable logs.",
    h1: "Deploy direto do Codex",
    intro:
      "Codex opera a AutoCloud pela CLI não interativa. Todos os comandos aceitam --json e retornam estados tipados (READY, BUILD_FAILED, DEPLOY_FAILED) que o agente consegue tratar.",
    steps: [
      "npm i -g autocloud",
      "autocloud login --token ac_live_...",
      "autocloud deploy --yes",
      "autocloud status --json",
    ],
    bullets: [
      "Sem prompts interativos com --yes — automação nunca trava",
      "Logs por etapa (ANALYZE, BUILD, DEPLOY, HEALTH) via API e CLI",
      "AGENTS.md e llms.txt documentam o fluxo para qualquer agente",
    ],
  },
  "cursor-deploy": {
    title: "Deploy from Cursor — AutoCloud",
    description:
      "Add the AutoCloud MCP server to Cursor and deploy projects without leaving the editor. Automatic architecture selection and cost estimates.",
    h1: "Deploy direto do Cursor",
    intro:
      "Adicione o MCP server da AutoCloud ao Cursor e o agente ganha deploy, análise de custo e leitura de logs — sem sair do editor e sem decisões de infraestrutura.",
    steps: [
      'Adicione {"mcpServers": {"autocloud": {"command": "autocloud-mcp"}}} ao .cursor/mcp.json',
      "autocloud login --token ac_live_...  (uma vez)",
      "Peça ao agente: deploy this project",
      "O agente recebe a URL pública ou o erro tipado com logs",
    ],
    bullets: [
      "Ferramentas MCP de análise funcionam offline (nada sai da máquina)",
      "deploy_project builda localmente e envia só o output",
      "Custo estimado por arquitetura antes de publicar",
    ],
  },
  "vercel-alternative": {
    title: "AutoCloud — an AI-native deploy platform",
    description:
      "AutoCloud is a deploy platform built agent-first: automatic architecture selection, cost estimates before every deploy and predictable pricing.",
    h1: "Uma plataforma de deploy AI-native",
    intro:
      "Em vez de você escolher runtime, região e plano, a AutoCloud analisa o projeto e escolhe a arquitetura de menor custo compatível — mostrando a estimativa antes do deploy. Feita para quem constrói com coding agents.",
    steps: [
      "autocloud analyze  (veja arquitetura e custo estimado antes de qualquer mudança)",
      "autocloud deploy --yes",
      "URL pública com health check verificado",
    ],
    bullets: [
      "Análise determinística do projeto (framework, rotas, banco, workers)",
      "Roteamento por custo entre providers com tabelas de preço abertas",
      "Preço previsível: limites e excedentes visíveis antes da cobrança",
    ],
  },
  "cheap-nextjs-hosting": {
    title: "Low-cost Next.js hosting decided by AI — AutoCloud",
    description:
      "AutoCloud analyzes your Next.js app and picks the cheapest compatible architecture. Static exports deploy free on the starter plan.",
    h1: "Hosting Next.js pelo menor custo calculado",
    intro:
      "A AutoCloud analisa seu app Next.js — percentual estático, rotas de API, banco — e calcula o custo por arquitetura antes do deploy. Builds estáticos (output: export) publicam no plano gratuito hoje; SSR/serverless está em rollout no adapter cloud.",
    steps: [
      "autocloud analyze  (mostra staticPercentage, rotas e custo por arquitetura)",
      "Para site estático: output: 'export' no next.config",
      "autocloud deploy --yes",
    ],
    bullets: [
      "Custo estimado por arquitetura (static, hybrid, serverless, node-server)",
      "Free allowances dos providers aplicadas no cálculo",
      "Estimativas sempre rotuladas — a fatura real vem do billing, sem surpresa",
    ],
  },
  "ai-deployment-platform": {
    title: "AI deployment platform for coding agents — AutoCloud",
    description:
      "AutoCloud is the deploy target for AI-built software: agents analyze, deploy and debug through CLI, API and MCP — humans just review.",
    h1: "A plataforma de deploy para software construído por IA",
    intro:
      "Código gerado por agentes precisa de um destino que agentes saibam operar. Toda capacidade da AutoCloud existe em quatro superfícies: dashboard, API, CLI e MCP — nada crítico depende de clicar em telas.",
    steps: [
      "Agente roda autocloud analyze --json e lê a arquitetura recomendada",
      "autocloud deploy --yes publica e retorna URL ou erro tipado",
      "autocloud logs alimenta o loop de correção do agente",
    ],
    bullets: [
      "Estados de deployment tipados que agentes tratam programaticamente",
      "API com erros estruturados {code, message} e scopes por token",
      "llms.txt, AGENTS.md e /docs/agents mantidos como contrato",
    ],
  },
};
