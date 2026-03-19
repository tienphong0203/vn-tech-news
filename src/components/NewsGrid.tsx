'use client';

import { useState } from 'react';
import type { Article } from '@/lib/news';
import NewsCard from './NewsCard';

type Category = 'All' | 'AI' | 'Cloud' | 'Startup' | 'General' | 'GreenNode';

const FILTERS: { label: string; value: Category; accent?: string }[] = [
  { label: 'Tất cả', value: 'All' },
  { label: 'AI', value: 'AI' },
  { label: 'Hạ tầng số', value: 'Cloud' },
  { label: 'Startup', value: 'Startup' },
  { label: 'Công nghệ', value: 'General' },
  { label: '🌿 GreenNode', value: 'GreenNode', accent: '#00E5A0' },
];

export default function NewsGrid({ articles, error }: { articles: Article[]; error: boolean }) {
  const [activeFilter, setActiveFilter] = useState<Category>('All');

  const filtered = activeFilter === 'All' ? articles : articles.filter(a => a.category === activeFilter);

  const counts: Record<string, number> = { All: articles.length };
  for (const a of articles) {
    counts[a.category] = (counts[a.category] ?? 0) + 1;
  }

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
            {activeFilter === 'GreenNode'
              ? 'Chưa có tin về GreenNode trong 24h qua.'
              : 'Không có tin tức nào trong 24h qua.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-[12px] text-[#8B949E] font-mono mb-4">
            <span className="text-[#E6EDF3]">{filtered.length}</span> bài viết
            {activeFilter !== 'All' && ` · ${activeFilter}`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((article, i) => (
              <NewsCard key={article.id} article={article} index={i} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
