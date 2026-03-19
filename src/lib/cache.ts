import type { Article } from './news';

const CACHE_KEY = 'vn_tech_news_v1';
const LAST_UPDATED_KEY = 'vn_tech_news_updated_at';
const TTL = 60 * 60; // 1 hour

function getRedis() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function redisGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const res = await fetch(`${redis.url}/get/${key}`, {
      headers: { Authorization: `Bearer ${redis.token}` },
      cache: 'no-store',
    });
    const data = await res.json();
    if (!data.result) return null;
    return JSON.parse(data.result) as T;
  } catch {
    return null;
  }
}

async function redisSet(key: string, value: unknown, ex: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await fetch(`${redis.url}/set/${key}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redis.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: JSON.stringify(value), ex }),
    });
  } catch {
    // silently fail
  }
}

export async function getCachedArticles(): Promise<Article[] | null> {
  return redisGet<Article[]>(CACHE_KEY);
}

export async function setCachedArticles(articles: Article[]): Promise<void> {
  await redisSet(CACHE_KEY, articles, TTL);
  await redisSet(LAST_UPDATED_KEY, new Date().toISOString(), TTL);
}

export async function getLastUpdated(): Promise<string | null> {
  return redisGet<string>(LAST_UPDATED_KEY);
}