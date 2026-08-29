import { prisma } from "@autocloud/db";
import { formatMinor } from "@autocloud/finance";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TrackPageView } from "@/components/track-page-view";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    number: "01",
    title: "Analyze",
    body: "O AI Project Analyzer varre o projeto: framework, rotas de API, banco, workers, percentual estático. Determinístico, offline — nada sai da sua máquina.",
  },
  {
    number: "02",
    title: "Route",
    body: "O AICloudRouter calcula o custo de cada arquitetura compatível nas tabelas de preço dos providers e escolhe a mais barata. Você vê a estimativa antes de publicar.",
  },
  {
    number: "03",
    title: "Deploy",
    body: "Build na sua máquina, upload só do resultado, publicação com health check verificado. URL pública no final — ou um erro tipado com logs para corrigir.",
  },
  {
    number: "04",
    title: "Optimize",
    body: "Uso medido de verdade (requests, banda, storage) alimenta o Autopilot, que compara alocado versus usado e aponta onde a infraestrutura pode custar menos.",
  },
];

/** O mecanismo único, etapa por etapa — a estrutura que a plataforma executa. */
const PIPELINE = [
  { stage: "Projeto", detail: "seu código, do jeito que está" },
  { stage: "AI Project Analyzer", detail: "varredura determinística do repositório" },
  { stage: "Detecção do framework", detail: "Next.js, Vite, React, Astro, Express, Node, static" },
  {
    stage: "Detecção das necessidades",
    detail: "API routes, banco, cron, workers, storage, env vars",
  },
  {
    stage: "Estimativa de recursos",
    detail: "percentual estático, memória, timeout por arquitetura",
  },
  {
    stage: "Seleção da arquitetura",
    detail: "static, edge, serverless, hybrid ou node-server — por compatibilidade",
  },
  {
    stage: "Estimativa de custo",
    detail: "projeção mensal por provider, com free allowances aplicadas",
  },
  { stage: "Build", detail: "na sua máquina — código nunca executa no servidor da plataforma" },
  { stage: "Deploy", detail: "upload do artefato, publicação e health check HTTP verificado" },
  { stage: "Monitoramento", detail: "requests, banda e storage medidos por projeto" },
  { stage: "Otimização", detail: "recomendações de custo conforme o uso real" },
];

const FEATURES = [
  {
    title: "Zero decisões de infraestrutura",
    body: "Sem escolher CPU, RAM, região, runtime ou provider. A plataforma decide pela arquitetura de menor custo compatível com o projeto.",
  },
  {
    title: "Custo antes do deploy",
    body: "Cada deploy mostra a projeção mensal por arquitetura, calculada sobre tabelas públicas de preço — sempre rotulada como estimativa, nunca surpresa.",
  },
  {
    title: "Feita para coding agents",
    body: "CLI não interativa (--yes, --json), estados de deployment tipados, logs estruturados por etapa e MCP server nativo para Claude Code, Codex e Cursor.",
  },
  {
    title: "Pipeline transparente",
    body: "Timeline completa de cada deploy: análise, fila, build, upload, publicação e health check HTTP real — com evento e log de cada transição.",
  },
  {
    title: "Segurança por desenho",
    body: "Seu código nunca executa nos servidores da plataforma: o build roda na sua máquina e só o resultado é publicado, validado antes da extração.",
  },
  {
    title: "Preço previsível",
    body: "Planos com limites explícitos, uso medido de verdade (requests e banda) e cobrança via Stripe. O que está incluso fica visível antes de pagar.",
  },
];

const FAQ = [
  {
    q: "O que eu preciso fazer para publicar um projeto?",
    a: "Instalar a CLI, autenticar uma vez e rodar autocloud deploy na raiz do projeto. A análise, a escolha de arquitetura e a publicação são automáticas.",
  },
  {
    q: "Quais frameworks são detectados?",
    a: "Next.js, Vite, React (CRA), Astro, Express, Node genérico e sites estáticos. O deploy atual cobre builds estáticos (Vite, CRA, Astro estático, Next com output export); SSR/serverless está em rollout no adapter cloud — o pipeline avisa com erro claro quando o projeto ainda depende dele.",
  },
  {
    q: "Como funciona com Claude Code, Codex ou Cursor?",
    a: "A CLI aceita --yes e --json para automação, e há um MCP server com ferramentas de análise, deploy e leitura de logs. O agente publica, lê o erro tipado se falhar e corrige sozinho.",
  },
  {
    q: "Quanto custa?",
    a: "Há plano gratuito para começar. Os planos pagos têm preço fixo mensal com limites explícitos — e a estimativa de custo de infraestrutura aparece antes de cada deploy.",
  },
  {
    q: "Como é a cobrança?",
    a: "Assinatura via Stripe (cartão), com portal para trocar de plano ou cancelar a qualquer momento. Compras online têm direito de arrependimento de 7 dias (art. 49 do CDC).",
  },
];

export default async function HomePage() {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    take: 4,
  });

  // Dados estruturados (AEO): definição do produto, ofertas reais e FAQ.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "AutoCloud",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        description:
          "AI-native deploy platform: analyzes a project, automatically picks the lowest-cost compatible architecture, deploys it with a verified health check and keeps optimizing infrastructure based on measured usage. Built for developers and coding agents (Claude Code, Codex, Cursor) via CLI, API and MCP.",
        offers: plans.map((plan) => ({
          "@type": "Offer",
          name: `AutoCloud ${plan.name}`,
          price: (plan.priceMonthlyMinor / 100).toFixed(2),
          priceCurrency: plan.currency,
        })),
        publisher: { "@type": "Organization", name: "Yes Serviços Digitais" },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD estático gerado no servidor
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TrackPageView event="landing_view" />
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="mb-4 inline-block rounded-full border border-edge bg-panel px-3 py-1 font-mono text-xs text-ink-dim">
              AI-native deploy platform
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              You build. <span className="text-accent">AI chooses where it runs.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-dim">
              Publique projetos sem escolher servidor, CPU ou infraestrutura. A AutoCloud analisa o
              código, calcula a arquitetura de menor custo e entrega a URL — em um comando.
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="rounded-md bg-accent px-5 py-2.5 font-medium text-canvas hover:bg-accent-dim"
              >
                Deploy your first project
              </Link>
              <Link
                href="/docs/agents"
                className="rounded-md border border-edge px-5 py-2.5 text-ink-dim hover:border-accent hover:text-ink"
              >
                Analyze my project
              </Link>
            </div>
            <p className="mt-5 font-mono text-xs text-ink-faint">
              Funciona com Claude Code, Codex, Cursor e o seu terminal.
            </p>
          </div>
          <pre className="overflow-x-auto rounded-xl border border-edge bg-panel p-5 font-mono text-sm leading-relaxed text-ink-dim shadow-2xl">
            {`$ npx autocloud deploy --yes

AutoCloud

OK  Project detected: Vite
OK  128 files analyzed
OK  Architecture calculated

  Recommended: static on cloudflare
  Estimated cost: USD 0.00/month
  (projecao por tabelas de preco)

Building
OK  Build completed

Deploying
OK  Health check OK (HTTP 200)
OK  Deployment ready

  https://my-project.autocloud.app`}
          </pre>
        </section>

        {/* O que é (definição citável — answer-first para AEO) */}
        <section className="border-t border-edge-soft">
          <div className="mx-auto w-full max-w-3xl px-6 py-14 text-center">
            <h2 className="text-lg font-medium text-ink-dim">What is AutoCloud?</h2>
            <p className="mt-4 text-xl leading-relaxed">
              A AutoCloud é uma plataforma de deploy AI-native: ela{" "}
              <span className="text-accent">analisa o projeto</span>, escolhe automaticamente a{" "}
              <span className="text-accent">arquitetura de menor custo</span> compatível, faz o
              deploy com health check verificado e{" "}
              <span className="text-accent">segue otimizando</span> a infraestrutura conforme o uso
              real.
            </p>
          </div>
        </section>

        {/* Mecanismo único: Autopilot Infrastructure */}
        <section className="border-t border-edge-soft bg-panel/40">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-semibold">
              O mecanismo: <span className="text-accent">Autopilot Infrastructure</span>
            </h2>
            <p className="mt-2 max-w-2xl text-ink-dim">
              Nenhuma pergunta sobre CPU, RAM, região ou runtime. Esta é a estrutura completa que
              roda em cada deploy:
            </p>
            <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
              <ol className="space-y-0">
                {PIPELINE.map((item, index) => (
                  <li key={item.stage} className="relative flex gap-4 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/50 bg-panel font-mono text-[10px] text-accent">
                        {index + 1}
                      </span>
                      {index < PIPELINE.length - 1 ? (
                        <span className="mt-1 w-px flex-1 bg-edge" />
                      ) : null}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm font-medium leading-6">{item.stage}</p>
                      <p className="text-xs text-ink-faint">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="grid content-start gap-4 sm:grid-cols-2">
                {STEPS.map((step) => (
                  <div key={step.number} className="rounded-xl border border-edge bg-panel p-6">
                    <p className="font-mono text-xs text-accent">{step.number}</p>
                    <h3 className="mt-2 text-lg font-medium">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-dim">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-edge bg-panel p-6">
                <h3 className="font-medium">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-dim">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Agent-first */}
        <section className="border-t border-edge-soft bg-panel/40">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold">Feita para agentes operarem sozinhos</h2>
              <p className="mt-3 leading-relaxed text-ink-dim">
                Tudo que o dashboard faz existe em API, CLI e MCP. Saída JSON, exit codes honestos,
                estados de falha tipados e logs por etapa — o agente publica, diagnostica e corrige
                sem intervenção humana.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 font-mono text-xs text-ink-dim">
                <span className="rounded-full border border-edge px-3 py-1">Claude Code</span>
                <span className="rounded-full border border-edge px-3 py-1">OpenAI Codex</span>
                <span className="rounded-full border border-edge px-3 py-1">Cursor</span>
                <span className="rounded-full border border-edge px-3 py-1">MCP</span>
              </div>
              <Link
                href="/docs/agents"
                className="mt-6 inline-block rounded-md border border-edge px-4 py-2 text-sm text-ink-dim hover:border-accent hover:text-ink"
              >
                Documentação para agentes
              </Link>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-edge bg-panel p-5 font-mono text-xs leading-relaxed text-ink-dim">
              {`{
  "mcpServers": {
    "autocloud": { "command": "autocloud-mcp" }
  }
}

// tools: analyze_project, estimate_cost,
// deploy_project, get_deployment, get_logs,
// list_projects, get_project, create_project`}
            </pre>
          </div>
        </section>

        {/* Pricing teaser (valores reais do banco) */}
        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Predictable pricing</h2>
              <p className="mt-2 text-ink-dim">
                Limites explícitos, uso medido, sem surpresa na fatura.
              </p>
            </div>
            <Link href="/pricing" className="text-sm text-accent hover:underline">
              Ver planos completos
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <Link
                key={plan.id}
                href="/pricing"
                className={`rounded-xl border bg-panel p-5 transition-colors hover:border-accent/60 ${
                  plan.slug === "pro" ? "border-accent" : "border-edge"
                }`}
              >
                <p className="font-medium">{plan.name}</p>
                <p className="mt-1 font-mono text-xl">
                  {plan.priceMonthlyMinor === 0
                    ? "R$ 0"
                    : formatMinor(plan.priceMonthlyMinor, plan.currency)}
                  <span className="text-xs text-ink-faint">/mês</span>
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-edge-soft bg-panel/40">
          <div className="mx-auto w-full max-w-3xl px-6 py-16">
            <h2 className="text-2xl font-semibold">Perguntas frequentes</h2>
            <div className="mt-8 space-y-6">
              {FAQ.map((item) => (
                <div key={item.q} className="border-b border-edge-soft pb-6 last:border-0">
                  <h3 className="font-medium">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-dim">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="mx-auto w-full max-w-6xl px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold">Do código à URL em um comando</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-dim">
            Comece grátis. A estimativa de custo aparece antes de qualquer deploy.
          </p>
          <div className="mt-7 flex justify-center gap-4">
            <Link
              href="/login"
              className="rounded-md bg-accent px-6 py-3 font-medium text-canvas hover:bg-accent-dim"
            >
              Start free
            </Link>
            <Link
              href="/pricing"
              className="rounded-md border border-edge px-6 py-3 text-ink-dim hover:border-accent hover:text-ink"
            >
              Pricing
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
