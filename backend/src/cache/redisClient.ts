import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://:kenza_redis_secret@localhost:6379/0';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('[Redis 7] Connected successfully to session cache');
});

redis.on('error', (err) => {
  console.error('[Redis 7 Error]', err);
});

// Helper pour sauvegarder l'état conversationnel d'une session WhatsApp
export async function saveSessionState(phone: string, state: any, ttlSeconds = 86400): Promise<void> {
  await redis.setex(`session:${phone}`, ttlSeconds, JSON.stringify(state));
}

// Helper pour récupérer l'état conversationnel
export async function getSessionState<T>(phone: string): Promise<T | null> {
  const data = await redis.get(`session:${phone}`);
  if (!data) return null;
  return JSON.parse(data) as T;
}

// Verrou distribué pour éviter les doubles commandes simultanées
export async function acquireLock(key: string, ttlMs = 5000): Promise<boolean> {
  const result = await redis.set(`lock:${key}`, 'locked', 'PX', ttlMs, 'NX');
  return result === 'OK';
}

export async function releaseLock(key: string): Promise<void> {
  await redis.del(`lock:${key}`);
}
