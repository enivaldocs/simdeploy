import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "About",
  description:
    "AutoCloud é a plataforma de deploy AI-native da Yes Serviços Digitais: análise automática do projeto, arquitetura de menor custo e publicação em um comando.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold">Sobre a AutoCloud</h1>
        <div className="mt-8 space-y-5 leading-relaxed text-ink-dim">
          <p>
            A AutoCloud nasceu de uma constatação simples: hoje o código é cada vez mais escrito por
            pessoas com ajuda de agentes de IA — mas publicar esse código continua exigindo decisões
            de infraestrutura que nem a pessoa nem o agente deveriam precisar tomar. Qual runtime,
            qual região, quanta memória, qual provider, quanto isso vai custar.
          </p>
          <p>
            Nossa resposta é o <span className="text-ink">Autopilot Infrastructure</span>: a
            plataforma analisa o projeto, calcula o custo de cada arquitetura compatível nas tabelas
            de preço dos provedores, escolhe a mais barata, publica com verificação de saúde e segue
            medindo o uso real para recomendar otimizações. A pessoa (ou o agente) roda um comando e
            recebe uma URL.
          </p>
          <p>
            Somos agent-first por princípio: tudo que existe no dashboard existe também em API, CLI
            não interativa e MCP — porque acreditamos que o próximo deploy do seu projeto tem boa
            chance de ser feito pelo seu agente, não por você.
          </p>
          <p>
            A AutoCloud é um produto <span className="text-ink">Yes Serviços Digitais</span>,
            empresa brasileira que opera plataformas SaaS de consumo e infraestrutura digital.
          </p>
        </div>
        <div className="mt-10 flex gap-4">
          <Link
            href="/login"
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-canvas hover:bg-accent-dim"
          >
            Start free
          </Link>
          <a
            href="mailto:support@autocloud.app"
            className="rounded-md border border-edge px-5 py-2.5 text-ink-dim hover:border-accent hover:text-ink"
          >
            Contact
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
