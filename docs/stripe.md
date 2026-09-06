# Stripe

## Configuration

```
STRIPE_SECRET_KEY=sk_...        # required for billing
STRIPE_WEBHOOK_SECRET=whsec_... # required for the webhook
STRIPE_PUBLISHABLE_KEY=pk_...   # reserved for future client-side elements
```

Without the keys, the product runs with billing in read-only mode (plans displayed, upgrade disabled with a notice).

## Objects used

Customer (1 per organization, created on-demand), Product/Price (auto-provisioned from the Plan on the first purchase and persisted in `stripeProductId`/`stripePrice*Id`), Checkout Session (mode=subscription), Subscription, Invoice, PaymentIntent, Refund, Billing Portal.

## Webhook (POST /api/webhooks/stripe)

Processing pipeline:

1. **Signature validated** (`constructEventAsync`) — invalid → 400 (Stripe does not resend).
2. **Dedup** by `(provider, eventId)` in the WebhookEvent table — PROCESSED/SKIPPED never reprocesses.
3. **Processing** by type: `customer.subscription.*` (sync), `invoice.paid` (Invoice+Payment+included credits), `invoice.payment_failed` (Payment FAILED + notification), `charge.refunded` (Payment REFUNDED), `checkout.session.completed` (analytics).
4. **Failure** → status FAILED + error recorded + 500 response (Stripe resends; `attempts` increments). The `webhook_retry` job reprocesses recent FAILED events.

Register the endpoint in Stripe: `https://<host>/api/webhooks/stripe` with the events above.

## API compatibility

`subscriptionPeriod()` reads `current_period_*` from the SubscriptionItem (API 2025+) with a fallback to the Subscription object (earlier APIs).

## Local testing

`stripe listen --forward-to localhost:3000/api/webhooks/stripe` (Stripe CLI) and checkout in test mode. Events appear in /admin/webhooks.
