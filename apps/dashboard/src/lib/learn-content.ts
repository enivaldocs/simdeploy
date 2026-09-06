/**
 * Hub de conteúdo SEO (/learn). Estratégia: interceptar o funil de busca de
 * VPS/hosting com guias tecnicamente honestos, no ângulo do produto — custo
 * calculado e zero gestão de servidor. Fonte da priorização:
 * docs/seo-content-strategy.md (Semrush, seed "vps", database US).
 *
 * Regra: cada guia é conteúdo REAL e útil por si só. Nada de thin content —
 * escala vem de adicionar guias bons, não de gerar 182 páginas de uma vez.
 */

export interface LearnSection {
  h2: string;
  paragraphs: string[];
}

export interface LearnArticle {
  slug: string;
  title: string;
  description: string;
  cluster: string;
  updated: string;
  sections: LearnSection[];
  faq: Array<{ q: string; a: string }>;
}

export const LEARN_ARTICLES: LearnArticle[] = [
  {
    slug: "cloud-hosting-vs-vps",
    title: "Cloud hosting vs VPS: which one do you actually need?",
    description:
      "A practical comparison of cloud platforms and VPS hosting — cost model, operations burden, scaling — and how to decide without guessing.",
    cluster: "Fundamentals",
    updated: "2026-08-29",
    sections: [
      {
        h2: "The real difference is who operates the server",
        paragraphs: [
          "A VPS gives you a slice of a physical machine with root access: you pick the size, install the runtime, configure the web server, TLS, firewall, deploys, monitoring and backups. A cloud platform (PaaS) gives you a deploy target: you push code and the platform decides how it runs.",
          "Neither is universally better. A VPS is cheaper per raw resource and gives total control; a platform is cheaper per hour of your time and removes an entire class of operational failure — misconfigured TLS, unpatched kernels, full disks, forgotten backups.",
        ],
      },
      {
        h2: "Cost: the sticker price is not the price",
        paragraphs: [
          "A small VPS costs around USD 4-6/month, which looks unbeatable. The hidden line items are your hours: initial hardening, deploy pipelines, monitoring, and the incident at 2am. For a static site or a mostly-static app, a platform's free tier is usually cheaper than any VPS — the compute involved is nearly zero.",
          "The honest way to decide is to price the architecture your project actually needs, not the machine you assume it needs. Most projects that 'need a VPS' are static sites with three API routes.",
        ],
      },
      {
        h2: "When a VPS is the right call",
        paragraphs: [
          "Long-running background workers, custom system dependencies, protocols beyond HTTP, strict data-locality requirements, or workloads that saturate a machine 24/7 — these genuinely favor a VPS or dedicated server, where you pay for capacity instead of requests.",
        ],
      },
      {
        h2: "Where SimDeploy fits",
        paragraphs: [
          "SimDeploy analyzes your project (framework, API routes, static share, database, workers) and computes the monthly cost of each compatible architecture from provider price tables — then deploys on the cheapest one. If your project truly needs a server-style architecture, the analysis says so instead of hiding it. Run simdeploy analyze in your repo; it is free, offline, and shows the numbers before any deploy.",
        ],
      },
    ],
    faq: [
      {
        q: "Is cloud hosting more expensive than a VPS?",
        a: "For mostly-static projects, no — request-based platforms are usually cheaper because compute is near zero. For constantly-busy workloads, a VPS's flat capacity price wins. The right answer depends on the architecture your project needs, which can be computed rather than guessed.",
      },
      {
        q: "Can I move from a VPS to a deploy platform later?",
        a: "Yes — if your app builds to static output or standard serverless functions, migration is mostly repointing DNS. The lock-in risk is in bespoke server configuration, which platforms eliminate.",
      },
    ],
  },
  {
    slug: "vps-vs-dedicated-server",
    title: "VPS vs dedicated server: cost, performance and when each wins",
    description:
      "How virtual private servers compare to dedicated machines on price, isolation and performance — with the third option most comparisons skip.",
    cluster: "Fundamentals",
    updated: "2026-08-29",
    sections: [
      {
        h2: "Same job, different isolation",
        paragraphs: [
          "A dedicated server is an entire physical machine: all cores, all RAM, all disk I/O are yours. A VPS is a virtualized slice of one, sharing hardware with neighbors. Dedicated wins on raw and consistent performance; VPS wins on price and flexibility — you can resize a VPS in minutes.",
        ],
      },
      {
        h2: "The price gap in practice",
        paragraphs: [
          "Entry VPS plans run USD 4-10/month; entry dedicated machines start around USD 40-80/month and climb fast. Between them sits a large gray zone where people overpay: a workload that fits a USD 6 VPS running on a USD 60 dedicated box, or a bursty app on a VPS that throttles under load.",
          "Noisy-neighbor effects on cheap VPS plans are real but overstated for web workloads; for latency-critical or disk-heavy workloads (databases, game servers), dedicated hardware still earns its price.",
        ],
      },
      {
        h2: "The option both comparisons skip",
        paragraphs: [
          "If your workload is a website or API, the honest third option is not renting a machine at all: request-based architectures (static, serverless, hybrid) price by usage and drop to near zero when idle. The machine-versus-machine debate only applies once you have decided you need a machine.",
        ],
      },
      {
        h2: "Where SimDeploy fits",
        paragraphs: [
          "SimDeploy's cost engine compares architectures — static, hybrid, serverless, node-server — against real provider price tables for your specific project, before you deploy. Projects that genuinely need a persistent server are routed (and priced) as such; the rest stop paying for idle capacity.",
        ],
      },
    ],
    faq: [
      {
        q: "Is a dedicated server faster than a VPS?",
        a: "For consistent, hardware-bound workloads, yes — no neighbors, full disk I/O. For typical web traffic, a well-sized VPS or a request-based platform is indistinguishable to users.",
      },
    ],
  },
  {
    slug: "server-cost-per-month",
    title: "How much does a server cost per month? Real numbers by architecture",
    description:
      "What websites and APIs actually cost per month across static hosting, serverless, VPS and dedicated — with the free allowances that change the math.",
    cluster: "Pricing",
    updated: "2026-08-29",
    sections: [
      {
        h2: "The four price models",
        paragraphs: [
          "Static hosting: often free — CDN-served files with generous or unlimited request allowances (Cloudflare, for example, charges nothing for static asset requests or egress).",
          "Serverless/functions: pay per request and compute time, typically with millions of free requests per month; a paid tier around USD 5/month commonly includes 10M requests.",
          "VPS: flat USD 4-10/month for small instances (2 vCPU / 4GB class), regardless of traffic — you pay the same at zero requests and at full load.",
          "Dedicated: flat USD 40+/month for a whole machine.",
        ],
      },
      {
        h2: "Why most small projects should cost about zero",
        paragraphs: [
          "A portfolio, landing page, docs site or mostly-static app fits inside free allowances almost entirely. The common mistake is defaulting to a VPS 'to be safe' and paying flat rent for idle capacity — plus your own time as the unpaid sysadmin.",
          "The crossover point where flat-rate machines beat per-request pricing is traffic-dependent, but it sits far higher than most people assume: tens of millions of dynamic requests per month, not thousands.",
        ],
      },
      {
        h2: "Estimate it instead of guessing",
        paragraphs: [
          "The cost of a project is a function of its architecture and its usage — both measurable. SimDeploy computes exactly this: it analyzes your repo, prices every compatible architecture from provider price tables (free allowances included) and shows the monthly projection before any deploy. Estimates are labeled as estimates; the real bill only ever comes from your plan.",
        ],
      },
    ],
    faq: [
      {
        q: "How much does it cost to host a website per month?",
        a: "A static or mostly-static site: usually USD 0 within free allowances. A dynamic app on serverless: commonly USD 0-5/month at small scale. A small VPS: USD 4-10/month flat. A dedicated server: USD 40+/month.",
      },
      {
        q: "Are hosting cost estimates reliable?",
        a: "They are projections from price tables and usage assumptions — useful for choosing an architecture, not invoices. Always check the free allowances; they dominate the math at small scale.",
      },
    ],
  },
  {
    slug: "what-is-server-hardening",
    title: "What is server hardening? The checklist, and when it is not your job",
    description:
      "Server hardening explained: what actually reduces risk on a Linux VPS, a realistic checklist, and which parts disappear on a managed platform.",
    cluster: "Security",
    updated: "2026-08-29",
    sections: [
      {
        h2: "Hardening in one sentence",
        paragraphs: [
          "Hardening is reducing a server's attack surface: fewer services listening, fewer credentials that work, fewer things an attacker can do after getting in. On a VPS this is your responsibility from minute one — a fresh instance with password SSH and an open firewall is scanned within minutes of boot.",
        ],
      },
      {
        h2: "The checklist that matters",
        paragraphs: [
          "SSH: key-only authentication, no root login, ideally a non-standard port or VPN/bastion. Firewall: default-deny inbound, allow only 80/443 and your management path. Updates: unattended security patches for the OS. Services: remove or disable everything not serving the app. Users: least privilege, no shared accounts. TLS: automated certificates, no legacy protocols. Logs: shipped somewhere an attacker cannot erase. Backups: automated, tested by restoring.",
          "Everything on that list is table stakes, none of it differentiates your product, and all of it fails silently when neglected.",
        ],
      },
      {
        h2: "The part nobody puts on the checklist",
        paragraphs: [
          "The biggest risk is drift: hardening is a process, not a one-time setup. The server hardened in January runs unpatched software by June unless someone owns it continuously.",
        ],
      },
      {
        h2: "Where SimDeploy fits",
        paragraphs: [
          "On SimDeploy there is no server for you to harden: builds run on your machine, only static output and functions are published, user code never executes on the platform's own servers, secrets are encrypted at rest, and the serving layer is the provider's hardened edge. The checklist above stays valid for the machines you still operate — and disappears for the projects you deploy here.",
        ],
      },
    ],
    faq: [
      {
        q: "What is the first thing to do on a new VPS?",
        a: "Before anything else: create a non-root user, switch SSH to key-only authentication, and enable a default-deny firewall allowing only SSH and 80/443. Then enable automatic security updates.",
      },
    ],
  },
  {
    slug: "automated-backups-for-a-vps",
    title: "How to set up automated backups for a VPS (and actually test them)",
    description:
      "A working backup setup for a Linux VPS: what to back up, tools, schedules, offsite copies — and the restore test that makes it real.",
    cluster: "Operations",
    updated: "2026-08-29",
    sections: [
      {
        h2: "What actually needs backing up",
        paragraphs: [
          "Three things: your data (databases, uploaded files), your configuration (nginx/systemd/env files), and the knowledge of how to rebuild the rest. Do not image the whole disk out of fear — OS and packages are reproducible; your database is not.",
        ],
      },
      {
        h2: "A setup that works",
        paragraphs: [
          "Databases: a nightly dump (pg_dump --format=custom for Postgres, mysqldump for MySQL) via cron or systemd timer, compressed, with 7 daily + 4 weekly retention.",
          "Files and config: an incremental tool like restic or borg to an offsite target (object storage such as S3/R2/B2). Offsite is non-negotiable — a backup on the same VPS dies with the VPS.",
          "Provider snapshots are a good extra layer for fast whole-machine recovery, but they are not a substitute: they live in the same account and region as the machine they protect.",
        ],
      },
      {
        h2: "The restore test is the backup",
        paragraphs: [
          "An untested backup is a hope, not a backup. Monthly: restore the latest dump into a scratch database, count a few tables, open the app against it. Write the restore commands down where the panicking future you will find them.",
        ],
      },
      {
        h2: "Where SimDeploy fits",
        paragraphs: [
          "For projects deployed on SimDeploy, the artifact-based model changes the equation: your source of truth is your repository, every deploy is a rebuildable artifact, and there is no server state to lose. The backup discipline above remains essential for the databases and machines you run elsewhere.",
        ],
      },
    ],
    faq: [
      {
        q: "How often should a VPS be backed up?",
        a: "Databases: at least daily, more often if the data changes fast. Files/config: daily incrementals are cheap with restic/borg. Snapshots: weekly plus before risky changes.",
      },
    ],
  },
  {
    slug: "vps-management",
    title: "VPS management: what it really takes per month, and when you should not do it",
    description:
      "The recurring work of running a VPS — updates, monitoring, deploys, incidents — quantified, plus the cases where a managed platform is the rational choice.",
    cluster: "Operations",
    updated: "2026-08-29",
    sections: [
      {
        h2: "The recurring workload nobody prices in",
        paragraphs: [
          "Owning a VPS is a part-time job with a small but nonzero weekly load: security updates and reboots, certificate and DNS issues, disk space and log rotation, deploy scripts that break with new dependencies, monitoring the monitoring. Individually trivial; collectively they are hours every month and a pager that never fully turns off.",
        ],
      },
      {
        h2: "When self-managing is worth it",
        paragraphs: [
          "It is worth it when the machine is the product (game servers, custom protocols), when compliance demands specific control, when you saturate hardware 24/7, or when you are learning — running a VPS teaches more Linux than any course.",
        ],
      },
      {
        h2: "When it is not",
        paragraphs: [
          "For websites, APIs and apps built with modern frameworks, self-managed servers add operational risk without adding product value. Every hour spent patching nginx is an hour not spent on the thing users pay for. This is the entire reason managed platforms exist.",
        ],
      },
      {
        h2: "Where SimDeploy fits",
        paragraphs: [
          "SimDeploy removes the management layer entirely: no runtime to patch, no sizing to revisit, no deploy scripts to maintain. The platform analyzes the project, picks the lowest-cost compatible architecture, deploys with a verified health check and measures real usage. One command — from you or from your coding agent.",
        ],
      },
    ],
    faq: [
      {
        q: "How many hours per month does a VPS take to manage?",
        a: "A quiet, well-automated single server: roughly 1-4 hours monthly for updates, checks and small fixes — plus unpredictable incident time. Multiply per server, and budget the 2am factor.",
      },
      {
        q: "What is the alternative to managing a VPS?",
        a: "A managed deploy platform: you keep the code, the platform owns the servers, patching, scaling and TLS. It trades some control for eliminating a category of work and risk.",
      },
    ],
  },
];

export function getLearnArticle(slug: string): LearnArticle | undefined {
  return LEARN_ARTICLES.find((article) => article.slug === slug);
}
