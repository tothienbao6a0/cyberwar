// Simple in-memory rate limiter
// In production, use Redis or a similar distributed store

interface RateLimitInfo {
  count: number;
  firstRequest: number;
}

const WINDOW_SIZE_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30; // 30 requests per minute

const rateLimitStore = new Map<string, RateLimitInfo>();

export async function rateLimit(identifier: string) {
  const now = Date.now();
  const userLimit = rateLimitStore.get(identifier);

  // Clean up old entries
  if (userLimit && now - userLimit.firstRequest > WINDOW_SIZE_MS) {
    rateLimitStore.delete(identifier);
  }

  if (!rateLimitStore.has(identifier)) {
    rateLimitStore.set(identifier, {
      count: 1,
      firstRequest: now
    });
    return {
      success: true,
      limit: MAX_REQUESTS,
      remaining: MAX_REQUESTS - 1,
      reset: now + WINDOW_SIZE_MS
    };
  }

  const info = rateLimitStore.get(identifier)!;
  
  if (info.count >= MAX_REQUESTS) {
    return {
      success: false,
      limit: MAX_REQUESTS,
      remaining: 0,
      reset: info.firstRequest + WINDOW_SIZE_MS
    };
  }

  info.count++;
  rateLimitStore.set(identifier, info);

  return {
    success: true,
    limit: MAX_REQUESTS,
    remaining: MAX_REQUESTS - info.count,
    reset: info.firstRequest + WINDOW_SIZE_MS
  };
} 