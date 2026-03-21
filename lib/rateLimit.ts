import { NextResponse } from "next/server";

/**
 * Rate Limiter Configuration
 * ===========================
 * Simple in-memory rate limiter for API routes.
 *
 * How it works:
 * 1. Each IP address gets a "bucket" with tokens
 * 2. Each request consumes one token
 * 3. Tokens refill over time (sliding window)
 * 4. When tokens run out, requests are rejected (429)
 *
 * Note: This is an in-memory solution. For production with
 * multiple server instances, use Redis-based rate limiting.
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  /** Maximum requests allowed in the time window */
  maxRequests: number;
  /** Time window in milliseconds (default: 60000 = 1 minute) */
  windowMs: number;
}

/** In-memory store for rate limit entries (IP -> entry) */
const rateLimitStore = new Map<string, RateLimitEntry>();

/** Default configuration: 30 requests per minute */
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
};

/**
 * Cleans up expired entries from the store.
 * Called periodically to prevent memory leaks.
 *
 * @param windowMs - The time window after which entries expire
 */
function cleanupExpiredEntries(windowMs: number): void {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now - entry.lastRefill > windowMs * 2) {
      rateLimitStore.delete(ip);
    }
  }
}

/**
 * Extracts the client IP address from the request.
 * Checks common headers used by proxies/load balancers.
 *
 * @param request - The incoming request object
 * @returns The client IP address or "unknown"
 */
function getClientIp(request: Request): string {
  // Check headers in order of preference
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

/**
 * Rate Limiter Function
 * ======================
 * Call this at the start of your API route handler.
 * Returns null if the request is allowed, or a 429 response if rate limited.
 *
 * @param request - The incoming request object
 * @param config - Optional configuration overrides
 * @returns null if allowed, NextResponse (429) if rate limited
 *
 * @example
 * ```ts
 * export async function GET(request: Request) {
 *   // Check rate limit first
 *   const rateLimitResponse = rateLimit(request);
 *   if (rateLimitResponse) return rateLimitResponse;
 *
 *   // Continue with normal handling...
 * }
 * ```
 */
export function rateLimit(
  request: Request,
  config: Partial<RateLimitConfig> = {}
): NextResponse | null {
  const { maxRequests, windowMs } = { ...DEFAULT_CONFIG, ...config };
  const ip = getClientIp(request);
  const now = Date.now();

  // Periodic cleanup (every 100th request)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries(windowMs);
  }

  // Get or create entry for this IP
  let entry = rateLimitStore.get(ip);

  if (!entry) {
    // First request from this IP
    entry = { tokens: maxRequests - 1, lastRefill: now };
    rateLimitStore.set(ip, entry);
    return null; // Allowed
  }

  // Calculate token refill based on elapsed time
  const elapsed = now - entry.lastRefill;
  const tokensToAdd = Math.floor((elapsed / windowMs) * maxRequests);

  if (tokensToAdd > 0) {
    // Refill tokens (cap at maxRequests)
    entry.tokens = Math.min(maxRequests, entry.tokens + tokensToAdd);
    entry.lastRefill = now;
  }

  // Check if request is allowed
  if (entry.tokens > 0) {
    entry.tokens -= 1;
    return null; // Allowed
  }

  // Rate limited - return 429 response
  const retryAfter = Math.ceil((windowMs - elapsed) / 1000);

  return NextResponse.json(
    {
      error: "Too many requests",
      message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(maxRequests),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil((entry.lastRefill + windowMs) / 1000)),
      },
    }
  );
}

/**
 * Creates a rate limiter with custom configuration.
 * Use this to create different limits for different routes.
 *
 * @param config - Custom rate limit configuration
 * @returns A configured rate limit function
 *
 * @example
 * ```ts
 * // Stricter limit for write operations
 * const strictRateLimit = createRateLimit({ maxRequests: 10, windowMs: 60000 });
 *
 * export async function POST(request: Request) {
 *   const rateLimitResponse = strictRateLimit(request);
 *   if (rateLimitResponse) return rateLimitResponse;
 *   // ...
 * }
 * ```
 */
export function createRateLimit(config: RateLimitConfig) {
  return (request: Request) => rateLimit(request, config);
}

/** Preset rate limiters for common use cases */
export const rateLimits = {
  /** Standard: 30 requests per minute */
  standard: (req: Request) => rateLimit(req, { maxRequests: 30, windowMs: 60000 }),

  /** Strict: 10 requests per minute (for write operations) */
  strict: (req: Request) => rateLimit(req, { maxRequests: 10, windowMs: 60000 }),

  /** Relaxed: 60 requests per minute (for read-heavy endpoints) */
  relaxed: (req: Request) => rateLimit(req, { maxRequests: 60, windowMs: 60000 }),
};
