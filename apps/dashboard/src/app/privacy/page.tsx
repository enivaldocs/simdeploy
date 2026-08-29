import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Política de Privacidade",
  description:
    "Como a AutoCloud coleta, usa e protege dados pessoais — bases legais (LGPD), subprocessadores, retenção e direitos do titular.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS: Array<{ title: string; paragraphs: string[] }> = [
  {
    title: "1. Quem somos",
    paragraphs: [
      "A AutoCloud é operada por Yes Serviços Digitais (controladora dos dados, nos termos da Lei 13.709/2018 — LGPD). Contato do encarregado: support@autocloud.app.",
    ],
  },
  {
    title: "2. O que coletamos",
    paragraphs: [
      "Dados de conta: e-mail, nome e, se você conectar o GitHub, o identificador público e login da sua conta GitHub.",
      "Dados de uso do produto: projetos, deployments, logs de pipeline, métricas medidas de tráfego dos seus sites (contagens de requests e bytes — não registramos IP nem identidade dos visitantes dos seus sites), e eventos de produto (ex.: deploy concluído, checkout iniciado).",
      "Dados de cobrança: plano, faturas e status de pagamento. Os dados de cartão são coletados e armazenados exclusivamente pela Stripe — nunca passam pelos nossos servidores.",
      "Cookies: cookie de sessão (autenticação, essencial) e um cookie de atribuição de origem (utm/referrer do primeiro acesso, expira em 30 dias). Não usamos cookies de publicidade de terceiros.",
      "Variáveis de ambiente dos seus projetos são criptografadas (AES-256-GCM) antes de gravadas, nunca aparecem em logs e nunca são exibidas depois de salvas.",
    ],
  },
  {
    title: "3. Para que usamos (bases legais)",
    paragraphs: [
      "Prestar o serviço contratado — publicar, servir e medir seus projetos (execução de contrato).",
      "Cobrança, prevenção a fraude e cumprimento de obrigações fiscais (obrigação legal e legítimo interesse).",
      "Melhorar o produto a partir de eventos agregados de uso e origem de aquisição (legítimo interesse).",
      "Comunicações transacionais — falha de deploy, falha de pagamento, limites de uso (execução de contrato). Não enviamos marketing sem consentimento.",
    ],
  },
  {
    title: "4. Com quem compartilhamos (subprocessadores)",
    paragraphs: [
      "Stripe (processamento de pagamentos); provedores de infraestrutura onde os seus projetos são publicados (ex.: Cloudflare); GitHub, apenas se você conectar sua conta. Compartilhamos com cada um somente o necessário para a função.",
      "Não vendemos dados pessoais. Dados podem ser fornecidos a autoridades mediante obrigação legal.",
    ],
  },
  {
    title: "5. Retenção e segurança",
    paragraphs: [
      "Dados da conta e de cobrança são mantidos enquanto a conta existir e pelos prazos legais fiscais após o encerramento. Logs de pipeline e métricas de uso são dados operacionais e podem ser expurgados periodicamente.",
      "Medidas de segurança incluem: criptografia de secrets em repouso, tokens de API armazenados apenas como hash, isolamento por organização em todas as consultas, registro de auditoria de ações sensíveis e validação de assinatura em webhooks de pagamento.",
    ],
  },
  {
    title: "6. Seus direitos (LGPD)",
    paragraphs: [
      "Você pode solicitar: confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação dos dados e revogação de consentimento — pelo e-mail support@autocloud.app. Respondemos nos prazos da LGPD.",
      "O encerramento da conta despublica os projetos e inicia a eliminação dos dados pessoais, ressalvados os que devemos manter por obrigação legal.",
    ],
  },
  {
    title: "7. Alterações",
    paragraphs: [
      "Esta política pode ser atualizada; mudanças relevantes são comunicadas. A data da última atualização está no topo da página.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold">Política de Privacidade</h1>
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
