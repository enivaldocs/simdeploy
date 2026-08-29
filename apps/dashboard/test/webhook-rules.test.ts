import { describe, expect, it } from "vitest";
import { shouldProcessWebhook } from "@/lib/billing/webhook-rules";

describe("webhook idempotency rules", () => {
  it("evento novo é processado", () => {
    expect(shouldProcessWebhook(null)).toBe("process");
  });

  it("evento já processado NUNCA reprocessa (idempotência)", () => {
    expect(shouldProcessWebhook({ status: "PROCESSED" })).toBe("skip");
    expect(shouldProcessWebhook({ status: "SKIPPED" })).toBe("skip");
  });

  it("evento com falha anterior é reprocessado (retry)", () => {
    expect(shouldProcessWebhook({ status: "FAILED" })).toBe("process");
  });

  it("evento travado em PROCESSING (crash) é reprocessado", () => {
    expect(shouldProcessWebhook({ status: "PROCESSING" })).toBe("process");
    expect(shouldProcessWebhook({ status: "RECEIVED" })).toBe("process");
  });
});
