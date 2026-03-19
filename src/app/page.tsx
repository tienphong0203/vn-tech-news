import { fetchAllNews } from '@/lib/news';
import NewsGrid from '@/components/NewsGrid';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let articles: Awaited<ReturnType<typeof fetchAllNews>> = [];
  let error = false;

  try {
    articles = await fetchAllNews();
  } catch {
    error = true;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#21262D] sticky top-0 z-20 bg-[#0D1117]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-[#00E5A0] flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" fill="#0D1117"/>
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="#0D1117" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-none" style={{ fontFamily: 'Syne, sans-serif', color: '#E6EDF3' }}>
                VN Tech Pulse
              </h1>
              <p className="text-[10px] text-[#8B949E] font-mono mt-0.5">AI & Cloud · Việt Nam · 24h</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#00E5A0] block" />
              <span className="text-[11px] text-[#8B949E] font-mono">
                {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })}
              </span>
            </div>
            <a href="/" className="text-[12px] font-mono text-[#8B949E] hover:text-[#00E5A0] transition-colors px-3 py-1.5 rounded-lg border border-[#21262D] hover:border-[#00E5A0]/30 flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M10 5.5a4.5 4.5 0 1 1-1.318-3.182" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M10 1.5v2.5H7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refresh
            </a>
          </div>
        </div>
      </header>

      <NewsGrid articles={articles} error={error} />

      <footer className="border-t border-[#21262D] mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between flex-wrap gap-2">
          <p className="text-[11px] text-[#8B949E] font-mono">VN Tech Pulse · Tổng hợp tự động từ RSS</p>
          <p className="text-[11px] text-[#8B949E] font-mono">
            {new Date().toLocaleDateString('vi-VN')} · {articles.length} bài viết
          </p>
        </div>
      </footer>
    </div>
  );
}
