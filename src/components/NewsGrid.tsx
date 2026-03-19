'use client';

import { useState } from 'react';
import type { Article } from '@/lib/news';
import NewsCard from './NewsCard';

type Category = 'All' | 'AI' | 'Cloud' | 'Startup' | 'General' | 'GreenNode';

const FILTERS: { label: string; value: Category }[] = [
  { label: 'Tất cả', value: 'All' },
  { label: 'AI', value: 'AI' },
  { label: 'Hạ tầng số', value: 'Cloud' },
  { label: 'Startup', value: 'Startup' },
  { label: 'Công nghệ', value: 'General' },
  { label: '🌿 GreenNode', value: 'GreenNode' },
];

// Score articles for "hot" ranking
function scoreArticle(article: Article): number {
  let score = 0;
  const now = Date.now();
  const age = now - new Date(article.publishedAt).getTime();
  const ageHours = age / (1000 * 60 * 60);

  // Recency — bài mới nhất lên đầu
  if (ageHours < 1) score += 50;
  else if (ageHours < 3) score += 30;
  else if (ageHours < 6) score += 15;
  else if (ageHours < 12) score += 5;

  const text = (article.title + ' ' + article.summary).toLowerCase();

  // High-value keywords cho từng category
  const hotKeywords = [
    // AI
    'chatgpt', 'gemini', 'openai', 'anthropic', 'nvidia', 'llm', 'gpt',
    'make in viet', 'nghị quyết 57',
    // Cloud/infra
    'fpt cloud', 'viettel cloud', 'greennode', 'data center', 'trung tâm dữ liệu',
    'gpu', 'hạ tầng ai',
    // Startup
    'gọi vốn', 'triệu usd', 'tỷ usd', 'series a', 'series b', 'unicorn',
    // Impact
    'việt nam', 'chính phủ', 'bộ trưởng', 'thủ tướng',
  ];

  for (const kw of hotKeywords) {
    if (text.includes(kw)) score += 10;
  }

  // Trusted sources bonus
  const trustedSources = ['vnexpress', 'tuoitre', 'thanhnien', 'vietnamnet'];
  if (trustedSources.some(s => article.sourceDomain.includes(s))) score += 5;

  return score;
}

function getTop3(articles: Article[]): Set<string> {
  if (articles.length <= 3) return new Set(articles.map(a => a.id));
  const sorted = [...articles].sort((a, b) => scoreArticle(b) - scoreArticle(a));
  return new Set(sorted.slice(0, 3).map(a => a.id));
}

export default function NewsGrid({ articles, error }: { articles: Article[]; error: boolean }) {
  const [activeFilter, setActiveFilter] = useState<Category>('All');

  const filtered = activeFilter === 'All' ? articles : articles.filter(a => a.category === activeFilter);

  const counts: Record<string, number> = { All: articles.length };
  for (const a of articles) {
    counts[a.category] = (counts[a.category] ?? 0) + 1;
  }

  const top3Ids = getTop3(filtered);
  const hotArticles = filtered.filter(a => top3Ids.has(a.id));
  const restArticles = filtered.filter(a => !top3Ids.has(a.id));

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {FILTERS.map(f => {
          const isActive = activeFilter === f.value;
          const isGreenNode = f.value === 'GreenNode';
          return (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`shrink-0 text-[12px] font-mono px-3 py-1 rounded-full border transition-all ${
                isActive
                  ? isGreenNode
                    ? 'bg-[#00E5A0]/15 border-[#00E5A0]/50 text-[#00E5A0] font-semibold'
                    : 'bg-[#00E5A0]/10 border-[#00E5A0]/40 text-[#00E5A0]'
                  : isGreenNode
                    ? 'border-[#00E5A0]/20 text-[#00E5A0]/60 hover:text-[#00E5A0] hover:border-[#00E5A0]/40'
                    : 'border-[#21262D] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#30363D]'
              }`}
            >
              {f.label}
              {counts[f.value] !== undefined && (
                <span className="ml-1.5 opacity-60">{counts[f.value]}</span>
              )}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="text-center py-20">
          <p className="text-[#8B949E] font-mono text-sm">Không thể tải tin tức. Thử lại sau.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#8B949E] font-mono text-sm">
            {activeFilter === 'GreenNode' ? 'Chưa có tin về GreenNode trong 24h qua.' : 'Không có tin tức nào trong 24h qua.'}
          </p>
        </div>
      ) : (
        <>
          {/* Hot section */}
          {hotArticles.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-mono text-[#00E5A0] uppercase tracking-widest">🔥 Nổi bật</span>
                <div className="h-px flex-1 bg-[#21262D]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {hotArticles.map((article, i) => (
                  <NewsCard key={article.id} article={article} index={i} isHot />
                ))}
              </div>
            </div>
          )}

          {/* Rest of articles */}
          {restArticles.length > 0 && (
            <div>
              {hotArticles.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-mono text-[#8B949E] uppercase tracking-widest">Tất cả bài viết</span>
                  <div className="h-px flex-1 bg-[#21262D]" />
                  <span className="text-[11px] text-[#8B949E] font-mono">{filtered.length} bài</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {restArticles.map((article, i) => (
                  <NewsCard key={article.id} article={article} index={i} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
