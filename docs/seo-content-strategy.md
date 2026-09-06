# SEO content strategy — /learn hub

Source: Semrush Keyword Strategy Builder, seed "vps", US database (2026-08-29). The full dump has 10 topics / 182 suggested pages; this is the prioritization applied to the product.

## Thesis

SimDeploy does not sell VPS — it makes a VPS unnecessary for most projects. The right play with this keyword universe is to **intercept the funnel of people researching VPS/hosting** with technically honest guides, at the angles where the product is the natural conclusion: **calculated cost** and **zero server management**. Guides that end with "and in this case you really do need a VPS" earn trust (and citation by AIs) — the opposite of a disguised landing page.

Rule inherited from the other projects: **never generate all 182 pages at once** (thin content). Scale by adding good guides, measuring indexing/queries in GSC before each batch.

## Prioritization of the dump's clusters

| Cluster (Semrush) | Fit with the product | Decision |
| --- | --- | --- |
| vps pricing and plans (87K vol) | HIGH — cost is our mechanism | Batch 1: server cost per month; Batch 2: cloud server cost, free tiers, storage cheap |
| vps hosting fundamentals (65K) | HIGH — comparisons decide the architecture | Batch 1: cloud hosting vs vps, vps vs dedicated; Batch 2: vps vs vm, benefits, kvm |
| vps management (660) + operations | HIGH — "zero ops" is the product | Batch 1: vps management, automated backups |
| vps security (5.4K) | HIGH — "not your job" angle | Batch 1: what is server hardening; Batch 2: ddos protected hosting, hardening checklist |
| vps use cases (8K) | MEDIUM | Batch 2: docker hosting (2.2K, ties into the containers roadmap), vps reseller |
| vps backup and recovery (4K) | MEDIUM | Batch 1 covers the pillar; Batch 2: disaster recovery in cloud computing (3.4K) |
| windows vps hosting (29K) | LOW — outside the product | Ignore |
| linux vps hosting (22K) | LOW-MEDIUM | Cost angles only (cheap linux vps) in Batch 3 |
| vps control panels (7K) | LOW — cPanel is not the audience | Ignore |
| vps website hosting / geo (peru vps, chile vps…) | LOW for now | Reassess with acquisition data |

## Batch 1 — published in /learn (6 guides)

| Slug | Target keyword | KD | Vol |
| --- | --- | --- | --- |
| cloud-hosting-vs-vps | cloud hosting vs vps | 38 | 2.4K |
| vps-vs-dedicated-server | vps vs dedicated server | 39 | 2.3K |
| server-cost-per-month | server cost per month + cloud server cost per month | 26/61 | 90/70 |
| what-is-server-hardening | what is server hardening | 7 | 260 |
| automated-backups-for-a-vps | how to set up automated backups for a vps | 14 | 120 |
| vps-management | vps management + benefits angle | 21 | 660 |

Format of each guide: 4 honest sections + FAQ (FAQPage schema + Article JSON-LD) + a single closing "Where SimDeploy fits" section + a CTA to analyze. Real content, no invented numbers.

## Batch 2 (next, after Batch 1 is indexed)

docker hosting · vps vs vm · benefits of vps hosting · how to setup a vps (a genuine guide + alternative) · ddos protected vps hosting · disaster recovery in cloud computing · free vps no credit card (honest angle: what "free" actually covers) · cloud vps hourly billing.

## Measurement

Once there is a public domain: GSC (impressions/position per guide), a landing_view event per page in /admin/growth, and share-of-answer in the AIs for the FAQ questions.
