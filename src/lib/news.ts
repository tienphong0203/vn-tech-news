import { XMLParser } from 'fast-xml-parser';

export type Article = {
  id: string;
  title: string;
  url: string;
  source: string;
  sourceDomain: string;
  summary: string;
  publishedAt: string;
  category: 'AI' | 'Cloud' | 'Startup' | 'General' | 'GreenNode';
  imageUrl?: string;
};

// Direct RSS feeds — Vietnam-focused only
const RSS_SOURCES = [
  // Vietnamese general tech
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
    url: 'https://vietnamnet.vn/rss/cong-nghe.rss',
    category: 'General' as const,
    source: 'VietnamNet',
  },
];

// Google News RSS — Vietnam AI & Cloud specific searches
const GOOGLE_NEWS_SOURCES = [
  {
    url: 'https://news.google.com/rss/search?q=trí+tuệ+nhân+tạo+Việt+Nam&hl=vi&gl=VN&ceid=VN:vi',
    category: 'AI' as const,
    source: 'Google News',
  },
  {
    url: 'https://news.google.com/rss/search?q=AI+ứng+dụng+doanh+nghiệp+Việt+Nam&hl=vi&gl=VN&ceid=VN:vi',
    category: 'AI' as const,
    source: 'Google News',
  },
  {
    url: 'https://news.google.com/rss/search?q=điện+toán+đám+mây+Việt+Nam+cloud&hl=vi&gl=VN&ceid=VN:vi',
    category: 'Cloud' as const,
    source: 'Google News',
  },
  {
    url: 'https://news.google.com/rss/search?q=FPT+Cloud+Viettel+Cloud+VNPT+cloud&hl=vi&gl=VN&ceid=VN:vi',
    category: 'Cloud' as const,
    source: 'Google News',
  },
  {
    url: 'https://news.google.com/rss/search?q=startup+công+nghệ+Việt+Nam+gọi+vốn&hl=vi&gl=VN&ceid=VN:vi',
    category: 'Startup' as const,
    source: 'Google News',
  },
  {
    url: 'https://news.google.com/rss/search?q=chuyển+đổi+số+doanh+nghiệp+Việt+Nam&hl=vi&gl=VN&ceid=VN:vi',
    category: 'Startup' as const,
    source: 'Google News',
  },
];

// GreenNode & Vietnam cloud infrastructure
const GREENNODE_SOURCES = [
  {
    url: 'https://news.google.com/rss/search?q=GreenNode+cloud+Vietnam&hl=vi&gl=VN&ceid=VN:vi',
    category: 'GreenNode' as const,
    source: 'Google News',
  },
  {
    url: 'https://news.google.com/rss/search?q="GreenNode"&hl=en&gl=SG&ceid=SG:en',
    category: 'GreenNode' as const,
    source: 'Google News',
  },
  {
    url: 'https://news.google.com/rss/search?q=hạ+tầng+cloud+GPU+Việt+Nam+2025+2026&hl=vi&gl=VN&ceid=VN:vi',
    category: 'GreenNode' as const,
    source: 'Google News',
  },
];

// Decode HTML entities
function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&[a-z]+;/g, (entity) => {
      const entities: Record<string, string> = {
        '&agrave;': 'à','&aacute;': 'á','&acirc;': 'â','&atilde;': 'ã','&auml;': 'ä',
        '&egrave;': 'è','&eacute;': 'é','&ecirc;': 'ê','&euml;': 'ë',
        '&igrave;': 'ì','&iacute;': 'í','&icirc;': 'î','&iuml;': 'ï',
        '&ograve;': 'ò','&oacute;': 'ó','&ocirc;': 'ô','&otilde;': 'õ','&ouml;': 'ö',
        '&ugrave;': 'ù','&uacute;': 'ú','&ucirc;': 'û','&uuml;': 'ü',
        '&Agrave;': 'À','&Aacute;': 'Á','&Acirc;': 'Â','&Atilde;': 'Ã',
        '&Egrave;': 'È','&Eacute;': 'É','&Ecirc;': 'Ê',
        '&Igrave;': 'Ì','&Iacute;': 'Í','&Icirc;': 'Î',
        '&Ograve;': 'Ò','&Oacute;': 'Ó','&Ocirc;': 'Ô','&Otilde;': 'Õ',
        '&Ugrave;': 'Ù','&Uacute;': 'Ú','&Ucirc;': 'Û',
        '&nbsp;': ' ','&ndash;': '–','&mdash;': '—',
        '&lsquo;': '\u2018','&rsquo;': '\u2019','&ldquo;': '\u201C','&rdquo;': '\u201D',
        '&hellip;': '…','&copy;': '©','&reg;': '®','&trade;': '™',
      };
      return entities[entity] ?? entity;
    });
}

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

// Heuristic: check if title has enough Vietnamese characters
function isVietnamese(text: string): boolean {
  const vnChars = (text.match(/[àáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/gi) ?? []).length;
  return vnChars >= 2 || text.length < 20; // short titles (EN) still allowed if from VN sources
}

export async function fetchAllNews(): Promise<Article[]> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const allArticles: Article[] = [];
  const seenTitles = new Set<string>();

  const allSources = [
    ...RSS_SOURCES.map(s => ({ ...s, requireVietnamese: false })),
    ...GOOGLE_NEWS_SOURCES.map(s => ({ ...s, requireVietnamese: true })),
    ...GREENNODE_SOURCES.map(s => ({ ...s, requireVietnamese: false })),
  ];

  await Promise.allSettled(
    allSources.map(async ({ url, category, source, requireVietnamese }) => {
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

          // Decode HTML entities in title
          const cleanTitle = decodeHtml(title).replace(/ - [^-]+$/, '');

          // Skip non-Vietnamese articles from Google News sources
          if (requireVietnamese && !isVietnamese(cleanTitle)) continue;

          // Auto-categorize by keywords in title (skip GreenNode — keep as-is)
          const titleLower = cleanTitle.toLowerCase();
          let detectedCategory: Article['category'] = category;
          if (category !== 'GreenNode') {
            if (titleLower.match(/greennode/i)) {
              detectedCategory = 'GreenNode';
            } else if (titleLower.match(/\b(ai|trí tuệ nhân tạo|chatgpt|llm|machine learning|deep learning|generative)\b/)) {
              detectedCategory = 'AI';
            } else if (titleLower.match(/\b(cloud|điện toán đám mây|aws|azure|gcp|kubernetes|server|hosting|viettelcloud|fpt cloud)\b/)) {
              detectedCategory = 'Cloud';
            } else if (titleLower.match(/\b(startup|khởi nghiệp|funding|series|venture|đầu tư)\b/)) {
              detectedCategory = 'Startup';
            }
          }

          // Clean HTML from description then decode entities
          const cleanDesc = decodeHtml(
            description.replace(/<[^>]+>/g, '').trim()
          ).slice(0, 200);

          const sourceDomain = extractDomain(link);

          allArticles.push({
            id: `${slugify(cleanTitle)}-${Date.now()}`,
            title: cleanTitle,
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

  return allArticles.slice(0, 80);
}