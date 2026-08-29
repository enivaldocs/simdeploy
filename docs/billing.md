# Billing

## Princípios

1. **Dinheiro nunca usa float** — minor units (centavos) inteiros + currency em toda transação (`@autocloud/finance` valida).
2. **Frontend nunca confirma pagamento** — só o webhook Stripe muda estado de assinatura/pagamento.
3. **ESTIMATED ≠ ACTUAL** — projeção de custo (CostEstimate/ProviderCost ESTIMATED) nunca se mistura com valores reais (Payment/Invoice/ProviderCost ACTUAL).
4. **Planos são configuração** — tabela Plan (preço, limites, ids Stripe); editáveis em /admin/settings sem deploy.

## Fluxo de upgrade

```
/dashboard/billing → Upgrade → POST /api/v1/billing/checkout
→ Stripe Checkout (price auto-provisionado na primeira vez e salvo no Plan)
→ pagamento → webhook (assinado) → sync Subscription/Invoice/Payment
→ limites do novo plano valem
```

Downgrade/cancelamento: Customer Portal (`POST /api/v1/billing/portal`).

## Créditos

`CreditLedgerEntry` é um ledger imutável: entradas positivas (crédito) e negativas (débito); saldo SEMPRE derivado (`balanceOf`). Tipos: PURCHASE, PROMOTION, SUBSCRIPTION, USAGE, REFUND, MANUAL, REVERSAL. Lançamento manual exige papel FINANCE/ADMIN e é auditado. Créditos inclusos no plano (`limits.includedCreditsMinor`) entram a cada invoice paga.

## Multi-moeda

Receita em BRL; custos de provider em USD. Margens só são calculadas com a taxa USD→BRL configurada em /admin/settings — sem taxa, a UI mostra "Configure FX rate". `sumByCurrency`/`CurrencyMismatchError` impedem soma crua.

## Reconciliação

Job `stripe_reconciliation` compara assinaturas do banco com o Stripe e corrige divergências (auditado como `reconciliation.subscription_fixed`). Nunca dependa só de webhooks.
