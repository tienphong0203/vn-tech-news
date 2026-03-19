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
  // Thêm mới — tech-focused
  {
    url: 'https://ictnews.vietnamnet.vn/rss/tin-tuc.rss',
    category: 'General' as const,
    source: 'ICTNews',
  },
  {
    url: 'https://genk.vn/rss/tin-tuc.rss',
    category: 'General' as const,
    source: 'GenK',
  },
  {
    url: 'https://cafebiz.vn/rss/cong-nghe.rss',
    category: 'General' as const,
    source: 'CafeBiz',
  },
];

// Google News RSS — Vietnam AI & Cloud specific searches
const GOOGLE_NEWS_SOURCES = [
  {
    url: 'https://news.google.com/rss/search?q=tri+tue+nhan+tao+Viet+Nam&hl=vi&gl=VN&ceid=VN:vi',
    category: 'AI' as const,
    source: 'Google News',
  },
  {
    url: 'https://news.google.com/rss/search?q=AI+ung+dung+doanh+nghiep+Viet+Nam&hl=vi&gl=VN&ceid=VN:vi',
    category: 'AI' as const,
    source: 'Google News',
  },
  {
    url: 'https://news.google.com/rss/search?q=startup+cong+nghe+Viet+Nam+goi+von&hl=vi&gl=VN&ceid=VN:vi',
    category: 'Startup' as const,
    source: 'Google News',
  },
  {
    url: 'https://news.google.com/rss/search?q=chuyen+doi+so+doanh+nghiep+Viet+Nam&hl=vi&gl=VN&ceid=VN:vi',
    category: 'Startup' as const,
    source: 'Google News',
  },
];

// Vietnam Cloud — Google News English queries (work from Vercel US servers)
const CLOUD_SOURCES = [
  {
    url: 'https://news.google.com/rss/search?q=FPT+Cloud+Vietnam&hl=en&gl=US&ceid=US:en',
    category: 'Cloud' as const,
    source: 'Google News',
  },
  {
    url: 'https://news.google.com/rss/search?q=Viettel+Cloud+Vietnam&hl=en&gl=US&ceid=US:en',
    category: 'Cloud' as const,
    source: 'Google News',
  },
  {
    url: 'https://news.google.com/rss/search?q=cloud+computing+Vietnam+data+center&hl=en&gl=US&ceid=US:en',
    category: 'Cloud' as const,
    source: 'Google News',
  },
  {
    url: 'https://news.google.com/rss/search?q=Vietnam+digital+infrastructure+cloud+2025+2026&hl=en&gl=US&ceid=US:en',
    category: 'Cloud' as const,
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
    url: 'https://news.google.com/rss/search?q=GreenNode&hl=en&gl=SG&ceid=SG:en',
    category: 'GreenNode' as const,
    source: 'Google News',
  },
  {
    url: 'https://news.google.com/rss/search?q=ha+tang+cloud+GPU+Viet+Nam+2025+2026&hl=vi&gl=VN&ceid=VN:vi',
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
        '&agrave;': '\u00e0','&aacute;': '\u00e1','&acirc;': '\u00e2','&atilde;': '\u00e3',
        '&egrave;': '\u00e8','&eacute;': '\u00e9','&ecirc;': '\u00ea',
        '&igrave;': '\u00ec','&iacute;': '\u00ed','&icirc;': '\u00ee',
        '&ograve;': '\u00f2','&oacute;': '\u00f3','&ocirc;': '\u00f4','&otilde;': '\u00f5',
        '&ugrave;': '\u00f9','&uacute;': '\u00fa','&ucirc;': '\u00fb',
        '&Agrave;': '\u00c0','&Aacute;': '\u00c1','&Acirc;': '\u00c2',
        '&Egrave;': '\u00c8','&Eacute;': '\u00c9','&Ecirc;': '\u00ca',
        '&Ograve;': '\u00d2','&Oacute;': '\u00d3','&Ocirc;': '\u00d4',
        '&Ugrave;': '\u00d9','&Uacute;': '\u00da','&Ucirc;': '\u00db',
        '&nbsp;': ' ','&ndash;': '\u2013','&mdash;': '\u2014',
        '&lsquo;': '\u2018','&rsquo;': '\u2019','&ldquo;': '\u201c','&rdquo;': '\u201d',
        '&hellip;': '\u2026','&copy;': '\u00a9','&reg;': '\u00ae','&trade;': '\u2122',
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
    'tuoitre.vn': 'Tu\u1ed5i Tr\u1ebb',
    'thanhnien.vn': 'Thanh Ni\u00ean',
    'dantri.com.vn': 'D\u00e2n Tr\u00ed',
    'baomoi.com': 'B\u00e1o M\u1edbi',
    'nhandan.vn': 'Nh\u00e2n D\u00e2n',
    'vietnamnet.vn': 'VietnamNet',
    'cafef.vn': 'CafeF',
    'techcrunch.com': 'TechCrunch',
    'techinasia.com': 'Tech in Asia',
    'e27.co': 'e27',
  };
  return knownSources[domain] || domain;
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 40);
}

function isWithin24Hours(dateStr: string): boolean {
  try {
    const pub = new Date(dateStr).getTime();
    const now = Date.now();
    return now - pub < 24 * 60 * 60 * 1000;
  } catch {
    return true;
  }
}

export async function fetchAllNews(): Promise<Article[]> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const allArticles: Article[] = [];
  const seenTitles = new Set<string>();

  const allSources = [
    ...RSS_SOURCES,
    ...GOOGLE_NEWS_SOURCES,
    ...CLOUD_SOURCES,
    ...GREENNODE_SOURCES,
  ];

  await Promise.allSettled(
    allSources.map(async ({ url, category, source }) => {
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

          const cleanTitle = decodeHtml(title).replace(/ - [^-]+$/, '');

          // Clean description first so we can use it in detection
          const cleanDesc = decodeHtml(
            description.replace(/<[^>]+>/g, '').trim()
          ).slice(0, 200);

          // Auto-categorize by keywords using both title and summary
          const titleLower = cleanTitle.toLowerCase();
          const summaryLower = cleanDesc.toLowerCase();
          const combinedText = titleLower + ' ' + summaryLower;
          let detectedCategory: Article['category'] = category;

          if (combinedText.match(/greennode/i)) {
            detectedCategory = 'GreenNode';
          } else if (combinedText.match(
            /\b(cloud|aws|azure|gcp|kubernetes|docker|devops|saas|paas|iaas)\b|điện toán đám mây|đám mây|hạ tầng đám mây|dịch vụ đám mây|máy chủ ảo|trung tâm dữ liệu|fpt cloud|viettel cloud|vnpt cloud|cmc cloud|gpu cloud|hạ tầng ai|an ninh mạng|bảo mật mạng|an toàn thông tin|chuyển đổi số|hạ tầng số|hạ tầng kỹ thuật số/
          )) {
            detectedCategory = 'Cloud';
          } else if (combinedText.match(
            /\b(ai|chatgpt|llm|machine learning|deep learning|generative|copilot|gemini)\b|trí tuệ nhân tạo|học máy|mô hình ngôn ngữ/
          )) {
            detectedCategory = 'AI';
          } else if (combinedText.match(
            /\b(startup|funding|series [abc]|venture capital|unicorn)\b|gọi vốn|khởi nghiệp|đầu tư công nghệ|đổi mới sáng tạo|fintech|edtech|healthtech/
          )) {
            detectedCategory = 'Startup';
          }

          const sourceDomain = extractDomain(link);
          const resolvedSource = source === 'Google News'
            ? (extractSourceName(item, link) || source)
            : source;

          allArticles.push({
            id: `${slugify(cleanTitle)}-${Date.now()}`,
            title: cleanTitle,
            url: link,
            source: resolvedSource,
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

  allArticles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return allArticles.slice(0, 80);
}
