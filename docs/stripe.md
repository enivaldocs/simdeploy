# Stripe

## Configuração

```
STRIPE_SECRET_KEY=sk_...        # obrigatório para billing
STRIPE_WEBHOOK_SECRET=whsec_... # obrigatório para o webhook
STRIPE_PUBLISHABLE_KEY=pk_...   # reservado para elementos client-side futuros
```

Sem as chaves, o produto funciona com billing em modo leitura (planos exibidos, upgrade desabilitado com aviso).

## Objetos usados

Customer (1 por organização, criado on-demand), Product/Price (auto-provisionados a partir do Plan na primeira compra e persistidos em `stripeProductId`/`stripePrice*Id`), Checkout Session (mode=subscription), Subscription, Invoice, PaymentIntent, Refund, Billing Portal.

## Webhook (POST /api/webhooks/stripe)

Pipeline de processamento:

1. **Assinatura validada** (`constructEventAsync`) — inválida → 400 (Stripe não reenvia).
2. **Dedup** por `(provider, eventId)` na tabela WebhookEvent — PROCESSED/SKIPPED nunca reprocessa.
3. **Processamento** por tipo: `customer.subscription.*` (sync), `invoice.paid` (Invoice+Payment+créditos inclusos), `invoice.payment_failed` (Payment FAILED + notificação), `charge.refunded` (Payment REFUNDED), `checkout.session.completed` (analytics).
4. **Falha** → status FAILED + erro gravado + resposta 500 (Stripe reenvia; `attempts` incrementa). Job `webhook_retry` reprocessa FAILED recentes.

Registrar o endpoint no Stripe: `https://<host>/api/webhooks/stripe` com os eventos acima.

## Compatibilidade de API

`subscriptionPeriod()` lê `current_period_*` do SubscriptionItem (API 2025+) com fallback para o objeto Subscription (APIs anteriores).

## Teste local

`stripe listen --forward-to localhost:3000/api/webhooks/stripe` (Stripe CLI) e checkout em modo teste. Eventos aparecem em /admin/webhooks.
