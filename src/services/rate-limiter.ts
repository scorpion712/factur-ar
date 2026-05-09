import {getDatabase} from "./firestore.js";

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerDay: number;
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  requestsPerMinute: 60,
  requestsPerDay: 10000,
};

export function getClientRateLimit(clientId: string): RateLimitConfig {
  return DEFAULT_RATE_LIMIT;
}

export async function checkRateLimit(clientId: string): Promise<void> {
  const firestore = getDatabase();
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;
  const oneDayAgo = now - 86_400_000;

  const limit = getClientRateLimit(clientId);

  const minuteLogs = await firestore
    .collection(`rateLimits/${clientId}/logs`)
    .where("timestamp", ">", oneMinuteAgo)
    .count()
    .get();

  if (minuteLogs.data().count >= limit.requestsPerMinute) {
    throw new RateLimitError(
      `Rate limit exceeded: ${limit.requestsPerMinute} requests per minute`
    );
  }

  const dayLogs = await firestore
    .collection(`rateLimits/${clientId}/logs`)
    .where("timestamp", ">", oneDayAgo)
    .count()
    .get();

  if (dayLogs.data().count >= limit.requestsPerDay) {
    throw new RateLimitError(
      `Rate limit exceeded: ${limit.requestsPerDay} requests per day`
    );
  }

  await firestore.collection(`rateLimits/${clientId}/logs`).add({
    timestamp: now,
  });
}
