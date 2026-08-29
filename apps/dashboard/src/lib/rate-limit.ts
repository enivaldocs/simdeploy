/**
 * Rate limiting com token bucket em memória. Interface estável para trocar
 * por Redis quando houver múltiplas instâncias — os chamadores não mudam.
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

export interface RateLimiter {
  limit(key: string): RateLimitResult;
}

interface Bucket {
  tokens: number;
  lastRefill: number;
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly capacity: number,
    private readonly refillPerSec: number,
  ) {}

  limit(key: string): RateLimitResult {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefill: now };
      this.buckets.set(key, bucket);
    }
    const elapsedSec = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsedSec * this.refillPerSec);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { allowed: true, remaining: Math.floor(bucket.tokens), retryAfterSec: 0 };
    }
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil((1 - bucket.tokens) / this.refillPerSec),
    };
  }
}

const globalStore = globalThis as unknown as {
  acRateLimiters?: { api: RateLimiter; auth: RateLimiter; deploy: RateLimiter };
};

/** Limiters compartilhados (sobrevivem a hot reload em dev). */
export function rateLimiters() {
  if (!globalStore.acRateLimiters) {
    globalStore.acRateLimiters = {
      api: new InMemoryRateLimiter(60, 1),
      auth: new InMemoryRateLimiter(10, 0.1),
      deploy: new InMemoryRateLimiter(10, 0.05),
    };
  }
  return globalStore.acRateLimiters;
}
