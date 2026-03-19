// Cache disabled — fetching RSS directly on each request
import type { Article } from './news';

export async function getCachedArticles(): Promise<Article[] | null> {
  return null;
}

export async function setCachedArticles(_articles: Article[]): Promise<void> {
  // no-op
}

export async function getLastUpdated(): Promise<string | null> {
  return null;
}