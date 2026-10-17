import "server-only";

/**
 * Fixed-window, in-memory rate limiter, keyed per user.
 * Protects the OpenAI budget from runaway clients on a single server instance; use a shared
 * store (e.g. Redis) instead if the app runs on several instances.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function check(key: string): { ok: true } | { ok: false; retryAfterSeconds: number } {
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      // Drop expired entries now and then so the map can't grow without bound.
      if (hits.size > 10_000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true };
    }

    if (entry.count >= limit) return { ok: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
    entry.count += 1;
    return { ok: true };
  };
}
