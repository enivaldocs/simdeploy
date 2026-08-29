import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Política de Uso Aceitável",
  description:
    "O que pode e o que não pode ser hospedado na AutoCloud, e como tratamos violações e denúncias de abuso.",
  alternates: { canonical: "/acceptable-use" },
};

const SECTIONS: Array<{ title: string; paragraphs: string[] }> = [
  {
    title: "1. Princípio",
    paragraphs: [
      "A AutoCloud publica software de terceiros na internet. Esta política define os usos proibidos e como agimos quando eles ocorrem. Ela integra os Termos de Serviço.",
    ],
  },
  {
    title: "2. Conteúdo e atividades proibidos",
    paragraphs: [
      "Malware, ransomware, comando e controle, ou qualquer código destinado a comprometer sistemas de terceiros.",
      "Phishing e páginas que se passem por outra empresa, marca ou pessoa — incluindo telas de login falsas e coleta de credenciais ou dados de pagamento sob pretexto falso.",
      "Conteúdo de exploração ou abuso sexual infantil: remoção imediata e denúncia às autoridades competentes.",
      "Violação de direitos autorais e distribuição de conteúdo ilegal sob a lei brasileira.",
      "Spam em qualquer forma: envio, infraestrutura de envio ou landing pages de campanhas de spam.",
      "Ataques a terceiros: DDoS, scraping abusivo, brute force, varredura não autorizada.",
      "Mineração de criptomoedas e qualquer uso projetado para consumir recursos fora dos limites do plano.",
    ],
  },
  {
    title: "3. Uso da plataforma",
    paragraphs: [
      "É proibido contornar limites do plano, interferir em projetos de outros clientes, explorar vulnerabilidades da plataforma (reporte-as em vez disso) ou revender o serviço sem acordo escrito.",
      "Pesquisa de segurança de boa-fé sobre a própria conta é bem-vinda; reporte achados a support@autocloud.app.",
    ],
  },
  {
    title: "4. Aplicação",
    paragraphs: [
      "Violações levam à despublicação do projeto e, em casos graves ou reincidentes, à suspensão da conta. Sempre que possível notificamos antes; em abuso ativo contra terceiros, despublicamos primeiro e notificamos em seguida. Toda ação fica registrada em auditoria.",
      "Para denunciar abuso hospedado na AutoCloud: support@autocloud.app com a URL e a descrição do problema.",
    ],
  },
];

export default function AcceptableUsePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold">Política de Uso Aceitável</h1>
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
