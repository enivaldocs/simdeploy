import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Termos de Serviço",
  description:
    "Termos de Serviço da AutoCloud: conta, planos e pagamento, uso aceitável, conteúdo do usuário, cancelamento e reembolso.",
  alternates: { canonical: "/terms" },
};

const SECTIONS: Array<{ title: string; paragraphs: string[] }> = [
  {
    title: "1. O serviço",
    paragraphs: [
      "A AutoCloud é uma plataforma de deploy e hospedagem operada por Yes Serviços Digitais. Ela analisa projetos de software, seleciona automaticamente a arquitetura de infraestrutura, publica o projeto em uma URL e mede o uso (requests, banda, armazenamento).",
      "Valores de custo de infraestrutura exibidos no produto são projeções calculadas sobre tabelas públicas de preço de provedores, sempre rotuladas como estimativa. A cobrança real é exclusivamente a da sua assinatura, descrita na seção 3.",
    ],
  },
  {
    title: "2. Conta",
    paragraphs: [
      "Você é responsável pela segurança das credenciais da sua conta e dos API tokens criados nela. Tokens podem ser revogados a qualquer momento no dashboard.",
      "Podemos suspender contas que violem estes termos, com registro do motivo e comunicação ao titular.",
    ],
  },
  {
    title: "3. Planos, pagamento e reembolso",
    paragraphs: [
      "Os planos têm preço fixo mensal (ou anual) em reais, com limites explícitos exibidos na página de preços e no dashboard. O pagamento é processado pela Stripe; a AutoCloud não armazena dados de cartão.",
      "Você pode trocar de plano ou cancelar a qualquer momento pelo portal de assinatura. O cancelamento vale para o próximo ciclo; o acesso permanece até o fim do período pago.",
      "Compras realizadas online têm direito de arrependimento em até 7 (sete) dias corridos a contar da contratação, com reembolso integral (art. 49 do Código de Defesa do Consumidor). Para exercer, contate support@autocloud.app.",
      "Falhas de pagamento são notificadas; após o período de tolerância, a assinatura volta ao plano gratuito e os limites correspondentes passam a valer.",
    ],
  },
  {
    title: "4. Uso aceitável",
    paragraphs: [
      "É proibido usar a AutoCloud para hospedar ou distribuir: malware, phishing ou páginas que se passem por terceiros; conteúdo que viole direitos autorais ou a lei brasileira; spam ou infraestrutura de abuso (incluindo ataques a terceiros); mineração de criptomoedas; conteúdo de exploração sexual infantil (removido e reportado imediatamente).",
      "Também é proibido tentar contornar limites do plano, interferir na plataforma ou em projetos de outros clientes, ou revender o serviço sem acordo por escrito.",
      "Projetos que violem esta seção podem ser despublicados imediatamente. Sempre que possível, notificamos antes; em abuso ativo contra terceiros, agimos primeiro e notificamos depois.",
    ],
  },
  {
    title: "5. Conteúdo e responsabilidade do usuário",
    paragraphs: [
      "O código e o conteúdo publicados são seus e permanecem seus. Você nos concede apenas a licença técnica necessária para armazenar, processar e servir esse conteúdo — que é o serviço.",
      "Por desenho de segurança, o build do seu código roda na sua máquina (CLI); a plataforma recebe e serve apenas o resultado. Você é o responsável legal pelo conteúdo que publica.",
    ],
  },
  {
    title: "6. Disponibilidade",
    paragraphs: [
      "Trabalhamos para manter o serviço disponível e publicamos o estado dos componentes internamente. Nesta fase do produto não há SLA contratual formal; interrupções relevantes são comunicadas aos afetados.",
      "Backups do banco de dados da plataforma são realizados regularmente. A responsabilidade por manter cópia do código-fonte dos seus projetos é sua (o fluxo padrão publica a partir do seu repositório/máquina).",
    ],
  },
  {
    title: "7. Alterações e encerramento",
    paragraphs: [
      "Estes termos podem ser atualizados; mudanças relevantes são comunicadas com antecedência razoável. O uso continuado após a vigência da nova versão constitui aceite.",
      "Você pode encerrar a conta a qualquer momento. No encerramento, projetos são despublicados e os dados tratados conforme a Política de Privacidade.",
    ],
  },
  {
    title: "8. Contato e foro",
    paragraphs: ["Dúvidas sobre estes termos: support@autocloud.app. Aplica-se a lei brasileira."],
  },
];

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold">Termos de Serviço</h1>
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
