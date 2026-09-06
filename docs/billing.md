# Billing

## Principles

1. **Money never uses floats** — integer minor units (cents) + currency on every transaction (`@simdeploy/finance` validates).
2. **The frontend never confirms a payment** — only the Stripe webhook changes subscription/payment state.
3. **ESTIMATED ≠ ACTUAL** — cost projections (CostEstimate/ProviderCost ESTIMATED) never mix with real values (Payment/Invoice/ProviderCost ACTUAL).
4. **Plans are configuration** — the Plan table (price, limits, Stripe ids); editable in /admin/settings without a deploy.

## Upgrade flow

```
/dashboard/billing → Upgrade → POST /api/v1/billing/checkout
→ Stripe Checkout (price auto-provisioned on the first time and saved on the Plan)
→ payment → webhook (signed) → sync Subscription/Invoice/Payment
→ the new plan's limits take effect
```

Downgrade/cancellation: Customer Portal (`POST /api/v1/billing/portal`).

## Credits

`CreditLedgerEntry` is an immutable ledger: positive entries (credit) and negative entries (debit); the balance is ALWAYS derived (`balanceOf`). Types: PURCHASE, PROMOTION, SUBSCRIPTION, USAGE, REFUND, MANUAL, REVERSAL. A manual entry requires the FINANCE/ADMIN role and is audited. Credits included in the plan (`limits.includedCreditsMinor`) are added on each paid invoice.

## Multi-currency

Revenue in BRL; provider costs in USD. Margins are only computed with the USD→BRL rate configured in /admin/settings — without a rate, the UI shows "Configure FX rate". `sumByCurrency`/`CurrencyMismatchError` prevent a raw sum.

## Reconciliation

The `stripe_reconciliation` job compares the database's subscriptions with Stripe and fixes discrepancies (audited as `reconciliation.subscription_fixed`). Never rely on webhooks alone.
