interface RateLimitEntry {
  count: number;
  firstAttemptAt: number;
  blockedUntil?: number;
}

// In-memory cache for rate-limiting
const rateLimitStore = new Map<string, RateLimitEntry>();
let lastCleanupAt = Date.now();

function cleanupExpired(windowMs: number) {
  const now = Date.now();
  // Clean up at most once per minute
  if (now - lastCleanupAt < 60_000) return;
  lastCleanupAt = now;

  for (const [key, entry] of rateLimitStore.entries()) {
    const isLockoutExpired = !entry.blockedUntil || entry.blockedUntil <= now;
    const isWindowExpired = now - entry.firstAttemptAt > windowMs;
    if (isLockoutExpired && isWindowExpired) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  isBlocked: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
}

/**
 * Checks if a given key is currently rate-limited.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): RateLimitResult {
  cleanupExpired(windowMs);

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return {
      isBlocked: false,
      remainingAttempts: maxAttempts,
      retryAfterSeconds: 0,
    };
  }

  // Check if currently locked out
  if (entry.blockedUntil && entry.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
    return {
      isBlocked: true,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  // Check if window has expired
  if (now - entry.firstAttemptAt > windowMs) {
    rateLimitStore.delete(key);
    return {
      isBlocked: false,
      remainingAttempts: maxAttempts,
      retryAfterSeconds: 0,
    };
  }

  // If reached max attempts, trigger lockout
  if (entry.count >= maxAttempts) {
    const lockoutMs = windowMs;
    entry.blockedUntil = now + lockoutMs;
    const retryAfterSeconds = Math.ceil(lockoutMs / 1000);
    return {
      isBlocked: true,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  return {
    isBlocked: false,
    remainingAttempts: Math.max(0, maxAttempts - entry.count),
    retryAfterSeconds: 0,
  };
}

/**
 * Records a failed attempt for a given key and returns updated status.
 */
export function recordFailure(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000,
  lockoutMs: number = 15 * 60 * 1000
): RateLimitResult {
  cleanupExpired(windowMs);

  const now = Date.now();
  let entry = rateLimitStore.get(key);

  if (
    !entry ||
    (now - entry.firstAttemptAt > windowMs && (!entry.blockedUntil || entry.blockedUntil <= now))
  ) {
    entry = {
      count: 1,
      firstAttemptAt: now,
    };
    rateLimitStore.set(key, entry);
  } else {
    entry.count += 1;
  }

  if (entry.count >= maxAttempts) {
    entry.blockedUntil = now + lockoutMs;
    const retryAfterSeconds = Math.ceil(lockoutMs / 1000);
    return {
      isBlocked: true,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  return {
    isBlocked: false,
    remainingAttempts: Math.max(0, maxAttempts - entry.count),
    retryAfterSeconds: 0,
  };
}

/**
 * Resets the rate limit tracker for a key upon successful action.
 */
export function resetLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Extracts client IP from request headers or socket.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
