
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Share2, 
  Heart, 
  Bookmark, 
  Clock, 
  User, 
  Calendar,
  Loader2,
  Sparkles,
  ArrowRight,
  MessageCircle,
  ThumbsUp
} from 'lucide-react';
import * as backend from '../backend';
import { Article } from '../types';

interface ArticleDetailViewProps {
  articleId: string;
  onBack: () => void;
}

const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({ articleId, onBack }) => {
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await backend.fetchArticleById(articleId);
      setArticle(data);
      setIsLoading(false);
    };
    load();
  }, [articleId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-white dark:bg-slate-950">
        <Loader2 className="animate-spin text-orange-500 mb-4" size={32} />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">正在載入專家的智慧...</p>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 relative">
      {/* Sticky Header with Fade Effect */}
      <div className="fixed top-0 left-0 right-0 z-[100] px-5 py-4 flex items-center justify-between pointer-events-none">
        <button 
          onClick={onBack} 
          className="pointer-events-auto w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-800 dark:text-white shadow-sm border border-slate-200/50 active:scale-90 transition-transform"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex space-x-2 pointer-events-auto">
          <button className="w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-800 dark:text-white shadow-sm border border-slate-200/50 active:scale-90 transition-transform">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-32">
        {/* Cover Image with Gradient Overlay */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <img src={article.coverImage} className="w-full h-full object-cover" alt={article.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-950 via-transparent to-black/20"></div>
          
          <div className="absolute bottom-6 left-6 right-6">
             <span className="bg-orange-500 text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-lg">
                {article.category}
             </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-6 pt-4 space-y-6">
          <div className="space-y-4">
             <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
               {article.title}
             </h1>
             
             <div className="flex items-center justify-between py-4 border-y border-gray-50 dark:border-white/5">
                <div className="flex items-center space-x-3">
                   <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-orange-500">
                      <User size={18} />
                   </div>
                   <div>
                      <p className="text-xs font-black text-slate-800 dark:text-white">{article.author}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{article.date}</p>
                   </div>
                </div>
                <div className="flex items-center space-x-4 text-gray-400">
                   <div className="flex items-center space-x-1">
                      <Clock size={12} />
                      <span className="text-[10px] font-black">{article.readTime}</span>
                   </div>
                   <div className="flex items-center space-x-1">
                      <ThumbsUp size={12} />
                      <span className="text-[10px] font-black">{article.likes}</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium space-y-6 whitespace-pre-wrap">
             {article.content}
          </div>

          {/* AI Insight Box */}
          <div className="bg-orange-50 dark:bg-orange-500/5 rounded-[32px] p-6 border border-orange-100/50 space-y-3 mt-10">
             <div className="flex items-center space-x-2 text-orange-600">
                <Sparkles size={18} />
                <h4 className="text-sm font-black uppercase tracking-wider">AI 推薦總結</h4>
             </div>
             <p className="text-xs font-bold text-orange-800/70 dark:text-orange-200/60 leading-relaxed">
               科學養寵不僅是責任，更是一種愛的體現。建議將本文提到的水分優化方案與您的寵物日常飲食相結合，持續觀察兩週，您會發現毛孩子的狀態有顯著提升。
             </p>
          </div>

          {/* Copyright Section */}
          <div className="pt-10 pb-4 border-t border-gray-50 dark:border-white/5 text-center opacity-30">
             <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
               © 2025 PawPal AI · 版權所有 · 專業養寵指導
             </p>
          </div>
        </div>
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[110]">
         <div className="glass bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[28px] p-2 flex items-center justify-between shadow-2xl border-white/60 dark:border-white/5">
            <div className="flex items-center space-x-1 flex-1">
               <button 
                 onClick={() => setIsLiked(!isLiked)}
                 className={`flex-1 flex flex-col items-center py-2 transition-all active:scale-90 ${isLiked ? 'text-rose-500' : 'text-gray-400'}`}
               >
                  <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                  <span className="text-[8px] font-black mt-0.5">點讚</span>
               </button>
               <button 
                 onClick={() => setIsBookmarked(!isBookmarked)}
                 className={`flex-1 flex flex-col items-center py-2 transition-all active:scale-90 ${isBookmarked ? 'text-orange-500' : 'text-gray-400'}`}
               >
                  <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
                  <span className="text-[8px] font-black mt-0.5">收藏</span>
               </button>
               <button className="flex-1 flex flex-col items-center py-2 text-gray-400 active:scale-90">
                  <MessageCircle size={20} />
                  <span className="text-[8px] font-black mt-0.5">評論</span>
               </button>
            </div>
            
            <button className="bg-orange-600 text-white h-12 px-6 rounded-2xl font-black text-xs flex items-center justify-center space-x-2 shadow-xl shadow-orange-600/20 active:scale-95 transition-all">
               <span>加入養寵群組</span>
               <ArrowRight size={14} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default ArticleDetailView;
