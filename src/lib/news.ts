import { XMLParser } from 'fast-xml-parser';

export type Article = {
  id: string;
  title: string;
  url: string;
  source: string;
  sourceDomain: string;
  summary: string;
  publishedAt: string;
  category: 'AI' | 'Cloud' | 'Startup' | 'General';
  imageUrl?: string;
};

// Direct RSS feeds from Vietnamese & international tech news sources
const RSS_SOURCES = [
  {
    url: 'https://vnexpress.net/rss/khoa-hoc-cong-nghe.rss',
    category: 'General' as const,
    source: 'VnExpress',
  },
  {
    url: 'https://tuoitre.vn/rss/nhip-song-so.rss',
    category: 'General' as const,
    source: 'Tuổi Trẻ',
  },
  {
    url: 'https://thanhnien.vn/rss/cong-nghe.rss',
    category: 'General' as const,
    source: 'Thanh Niên',
  },
  {
    url: 'https://dantri.com.vn/rss/khoa-hoc-cong-nghe.rss',
    category: 'General' as const,
    source: 'Dân Trí',
  },
  {
    url: 'https://www.techinasia.com/feed',
    category: 'Startup' as const,
    source: 'Tech in Asia',
  },
  {
    url: 'https://e27.co/feed/',
    category: 'Startup' as const,
    source: 'e27',
  },
];

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

function extractSourceName(item: Record<string, unknown>, fallbackUrl: string): string {
  // Google News RSS embeds source in <source> tag
  const src = item['source'];
  if (src && typeof src === 'string') return src;
  if (src && typeof src === 'object' && src !== null) {
    const obj = src as Record<string, unknown>;
    if (typeof obj['#text'] === 'string') return obj['#text'];
    if (typeof obj['@_url'] === 'string') return obj['@_url'];
  }
  const domain = extractDomain(fallbackUrl);
  const knownSources: Record<string, string> = {
    'vnexpress.net': 'VnExpress',
    'tuoitre.vn': 'Tuổi Trẻ',
    'thanhnien.vn': 'Thanh Niên',
    'dantri.com.vn': 'Dân Trí',
    'baomoi.com': 'Báo Mới',
    'nhandan.vn': 'Nhân Dân',
    'vietnamnet.vn': 'VietnamNet',
    'cafef.vn': 'CafeF',
    'techcrunch.com': 'TechCrunch',
    'techinasia.com': 'Tech in Asia',
    'e27.co': 'e27',
    'dealstreetasia.com': 'DealStreetAsia',
  };
  return knownSources[domain] || domain;
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 40);
}

// Decode Google News redirect URLs
function decodeGoogleUrl(url: string): string {
  // Google News wraps actual URLs — return as-is, browser will redirect
  return url;
}

function isWithin24Hours(dateStr: string): boolean {
  try {
    const pub = new Date(dateStr).getTime();
    const now = Date.now();
    return now - pub < 24 * 60 * 60 * 1000;
  } catch {
    return true; // include if can't parse
  }
}

export async function fetchAllNews(): Promise<Article[]> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const allArticles: Article[] = [];
  const seenTitles = new Set<string>();

  await Promise.allSettled(
    RSS_SOURCES.map(async ({ url, category, source }) => {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' },
          next: { revalidate: 0 },
        });
        if (!res.ok) return;

        const xml = await res.text();
        const parsed = parser.parse(xml);
        const items = parsed?.rss?.channel?.item ?? [];
        const itemList = Array.isArray(items) ? items : [items];

        for (const item of itemList) {
          const title: string = typeof item.title === 'object' ? (item.title?.['#text'] ?? '') : String(item.title ?? '');
          const link: string = typeof item.link === 'object' ? (item.link?.['#text'] ?? '') : String(item.link ?? item.guid ?? '');
          const pubDate: string = typeof item.pubDate === 'object' ? new Date().toISOString() : String(item.pubDate ?? new Date().toISOString());
          const description: string = typeof item.description === 'object' ? (item.description?.['#text'] ?? '') : String(item.description ?? '');

          if (!title || seenTitles.has(title)) continue;
          if (!isWithin24Hours(pubDate)) continue;

          seenTitles.add(title);

          // Auto-categorize by keywords in title
          const titleLower = title.toLowerCase();
          let detectedCategory = category;
          if (titleLower.match(/\b(ai|trí tuệ nhân tạo|chatgpt|llm|machine learning|deep learning|generative)\b/)) {
            detectedCategory = 'AI';
          } else if (titleLower.match(/\b(cloud|điện toán đám mây|aws|azure|gcp|kubernetes|server|hosting)\b/)) {
            detectedCategory = 'Cloud';
          } else if (titleLower.match(/\b(startup|khởi nghiệp|funding|series|venture|đầu tư)\b/)) {
            detectedCategory = 'Startup';
          }

          // Clean HTML from description
          const cleanDesc = description
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim()
            .slice(0, 200);

          const sourceDomain = extractDomain(link);

          allArticles.push({
            id: `${slugify(title)}-${Date.now()}`,
            title: title.replace(/ - [^-]+$/, ''),
            url: link,
            source,
            sourceDomain,
            summary: cleanDesc || 'Xem bài viết đầy đủ tại nguồn.',
            publishedAt: pubDate,
            category: detectedCategory,
            imageUrl: undefined,
          });
        }
      } catch (err) {
        console.error(`RSS fetch failed for ${url}:`, err);
      }
    })
  );

  // Sort by date descending
  allArticles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return allArticles.slice(0, 60);
}
