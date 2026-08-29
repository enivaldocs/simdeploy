import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Acordo de Processamento de Dados (DPA)",
  description:
    "Como a AutoCloud atua como operadora dos dados pessoais contidos nos projetos dos clientes, nos termos da LGPD.",
  alternates: { canonical: "/dpa" },
};

const SECTIONS: Array<{ title: string; paragraphs: string[] }> = [
  {
    title: "1. Papéis",
    paragraphs: [
      "Para os dados da SUA conta (e-mail, billing, uso), a Yes Serviços Digitais é controladora — ver a Política de Privacidade.",
      "Para dados pessoais eventualmente contidos nos PROJETOS que você publica (código, conteúdo servido, variáveis de ambiente), você é o controlador e a AutoCloud atua como operadora (art. 5º, VII, LGPD), tratando esses dados exclusivamente para prestar o serviço: armazenar, publicar e servir o projeto.",
    ],
  },
  {
    title: "2. Instruções e finalidade",
    paragraphs: [
      "Tratamos os dados dos seus projetos apenas conforme suas instruções expressas pela própria operação do produto (deploy, configuração de variáveis, remoção). Não acessamos o conteúdo dos seus projetos exceto para operar o serviço, atender solicitação sua de suporte ou cumprir obrigação legal.",
    ],
  },
  {
    title: "3. Segurança",
    paragraphs: [
      "Medidas técnicas aplicadas: variáveis de ambiente criptografadas em repouso (AES-256-GCM); isolamento por organização em todas as consultas; builds executados fora dos servidores da plataforma; artefatos validados antes da extração; tokens armazenados apenas como hash; registro de auditoria de ações sensíveis.",
    ],
  },
  {
    title: "4. Suboperadores",
    paragraphs: [
      "Utilizamos suboperadores estritamente necessários: provedores de infraestrutura onde os projetos são publicados (ex.: Cloudflare) e a Stripe para pagamentos (dados de billing, não dos seus projetos). Mudanças relevantes na lista são comunicadas.",
    ],
  },
  {
    title: "5. Incidentes, devolução e eliminação",
    paragraphs: [
      "Incidentes de segurança com dados pessoais são comunicados ao cliente afetado sem demora injustificada, com as informações exigidas pela LGPD.",
      "No encerramento da conta ou remoção de um projeto, o conteúdo publicado é despublicado e os artefatos eliminados dos nossos sistemas, ressalvadas cópias de backup com expurgo em ciclo regular.",
      "Dúvidas e solicitações: support@autocloud.app.",
    ],
  },
];

export default function DpaPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold">Acordo de Processamento de Dados</h1>
        <p className="mt-2 text-sm text-ink-faint">Última atualização: 29 de agosto de 2026</p>
        <div className="mt-10 space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-medium">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-relaxed text-ink-dim">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
