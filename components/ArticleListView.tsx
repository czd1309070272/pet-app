
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Search, 
  Clock, 
  Heart, 
  Loader2, 
  BookOpen, 
  TrendingUp,
  Filter
} from 'lucide-react';
import * as backend from '../backend';
import { Article, View } from '../types';

interface ArticleListViewProps {
  onBack: () => void;
  onNavigate: (view: View, data?: any) => void;
}

const ArticleListView: React.FC<ArticleListViewProps> = ({ onBack, onNavigate }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');

  const categories = ['全部', '健康守護', '護理科普', '行為解析', '營養膳食'];

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await backend.fetchArticles();
      setArticles(data);
      setIsLoading(false);
    };
    load();
  }, []);

  const filteredArticles = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         a.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === '全部' || a.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5 p-4 space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onBack} 
              className="w-10 h-10 flex items-center justify-center glass rounded-xl text-gray-600 dark:text-white shadow-sm active:scale-90 transition-transform"
            >
              <ChevronLeft size={22} />
            </button>
            <div>
              <h2 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">萌寵百科全書</h2>
              <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">Expert Pet Knowledge Base</p>
            </div>
          </div>
          <div className="w-10 h-10 flex items-center justify-center glass rounded-xl text-gray-400">
            <Filter size={20} />
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-2">
          <div className="relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="搜尋科普知識或症狀..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100 dark:bg-slate-800 border-none rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:ring-1 focus:ring-orange-500 transition-all dark:text-white"
            />
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex space-x-2 overflow-x-auto px-2 pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-[11px] font-black transition-all ${
                activeCategory === cat 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 dark:shadow-none' 
                : 'bg-white dark:bg-slate-800 text-gray-400 border border-gray-100 dark:border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide pb-32">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center opacity-40">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={32} />
            <p className="text-xs font-black uppercase tracking-widest">正在打開百科全書...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-32 text-center opacity-20 space-y-4">
             <BookOpen size={64} className="mx-auto" />
             <p className="font-black text-sm uppercase">暫無匹配的百科內容</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredArticles.map((article) => (
              <div 
                key={article.id}
                onClick={() => onNavigate(View.ARTICLE_DETAIL, article.id)}
                className="glass bg-white dark:bg-slate-900 rounded-[36px] overflow-hidden border border-white/60 dark:border-white/5 shadow-sm active:scale-[0.98] transition-all group cursor-pointer"
              >
                <div className="relative aspect-[16/8] overflow-hidden">
                  <img src={article.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={article.title} />
                  <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] font-black text-orange-600 uppercase tracking-widest border border-white/50 dark:border-white/5 shadow-sm">
                    {article.category}
                  </div>
                  <div className="absolute bottom-4 right-4 flex items-center space-x-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-white">
                    <Clock size={12} />
                    <span className="text-[10px] font-black tracking-tight">{article.readTime}</span>
                  </div>
                </div>
                
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-black text-gray-800 dark:text-white leading-tight group-hover:text-orange-500 transition-colors">
                      {article.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>
                  <div className="pt-4 flex items-center justify-between border-t border-gray-50 dark:border-white/5">
                    <div className="flex items-center space-x-2">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{article.author}</span>
                       <div className="w-1 h-1 bg-gray-200 rounded-full" />
                       <span className="text-[10px] font-black text-gray-300 uppercase">{article.date}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-rose-500/60 group-hover:text-rose-500 transition-colors">
                      <Heart size={14} fill="currentColor" className="opacity-20 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[10px] font-black">{article.likes}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Knowledge Bot Teaser */}
        <div className="mt-10 p-8 rounded-[40px] bg-indigo-600 text-white relative overflow-hidden shadow-2xl shadow-indigo-200 dark:shadow-none">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-10">
            <BookOpen size={180} />
          </div>
          <div className="relative z-10 space-y-4">
             <div className="flex items-center space-x-2">
                <TrendingUp size={20} className="text-indigo-200" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">AI Daily Insight</span>
             </div>
             <h4 className="text-xl font-black tracking-tight leading-snug">找不到想要的內容？<br />試試諮詢 AI 萌寵顧問</h4>
             <p className="text-xs text-indigo-100/60 font-bold leading-relaxed">24/7 隨時在線，為您解答任何專業的養寵難題。</p>
             <button 
              onClick={() => onNavigate(View.AI_CONSULTANT)}
              className="px-6 py-3 bg-white text-indigo-600 rounded-2xl text-xs font-black shadow-lg active:scale-95 transition-transform"
             >
               立即諮詢
             </button>
          </div>
        </div>

        <p className="text-center text-[9px] text-gray-300 dark:text-gray-700 font-black uppercase tracking-[0.3em] pt-12 italic">
          Powered by PawPal Expert Panel · © 2025
        </p>
      </div>
    </div>
  );
};

export default ArticleListView;
