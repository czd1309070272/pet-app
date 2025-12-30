
import React, { useState, useEffect } from 'react';
import { ChevronLeft, History, Heart, MessageSquare, Loader2, Clock, ExternalLink } from 'lucide-react';
import * as backend from '../backend';
import { CommunityHistoryItem } from '../types';

interface CommunityHistoryViewProps {
  onBack: () => void;
}

const CommunityHistoryView: React.FC<CommunityHistoryViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'WATCH' | 'LIKE' | 'COMMENT'>('WATCH');
  const [historyItems, setHistoryItems] = useState<CommunityHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const tabs = [
    { id: 'WATCH', label: '觀看歷史', icon: <History size={14} /> },
    { id: 'LIKE', label: '點讚記錄', icon: <Heart size={14} /> },
    { id: 'COMMENT', label: '評論記錄', icon: <MessageSquare size={14} /> },
  ];

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const data = await backend.fetchCommunityHistory(activeTab);
        setHistoryItems(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
        <div className="px-6 py-4 flex items-center space-x-4">
          <button 
            onClick={onBack} 
            className="w-10 h-10 flex items-center justify-center glass rounded-xl text-gray-600 dark:text-white shadow-sm active:scale-90 transition-transform"
          >
            <ChevronLeft size={22} />
          </button>
          <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">社群足跡</h3>
        </div>
        
        {/* Tabs */}
        <div className="flex px-4 pb-2">
           {tabs.map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex-1 flex items-center justify-center space-x-1.5 py-3 text-xs font-black transition-all relative ${activeTab === tab.id ? 'text-orange-600' : 'text-gray-400'}`}
             >
               {tab.icon}
               <span>{tab.label}</span>
               {activeTab === tab.id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-orange-500 rounded-full" />}
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center opacity-40">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={32} />
            <p className="text-xs font-black">正在同步足跡...</p>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="py-20 text-center space-y-4">
             <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-gray-300">
                <History size={32} />
             </div>
             <p className="text-xs font-black text-gray-400 tracking-widest uppercase">尚無足跡記錄</p>
          </div>
        ) : (
          historyItems.map(item => (
            <div key={item.id} className="glass bg-white dark:bg-slate-900 p-4 rounded-[32px] border border-white/60 dark:border-white/5 shadow-sm space-y-3 active:scale-[0.98] transition-transform cursor-pointer">
               <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img src={item.authorAvatar} className="w-8 h-8 rounded-lg object-cover" alt="avatar" />
                    <div>
                      <p className="text-[11px] font-black text-gray-800 dark:text-white">{item.author}</p>
                      <div className="flex items-center space-x-1 text-[9px] text-gray-400 font-bold">
                        <Clock size={10} />
                        <span>{item.time}</span>
                      </div>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-gray-300" />
               </div>

               <div className="flex space-x-3">
                  {item.image && (
                    <img src={item.image} className="w-16 h-16 rounded-xl object-cover border border-gray-50 dark:border-white/10" alt="post-thumb" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium line-clamp-2 leading-relaxed">
                      {item.contentSnippet}
                    </p>
                    {item.type === 'COMMENT' && item.commentText && (
                      <div className="mt-2 bg-orange-50/50 dark:bg-orange-500/5 p-2 rounded-xl border border-orange-100/50 dark:border-orange-500/10">
                        <p className="text-[10px] font-black text-orange-600 flex items-center">
                          <MessageSquare size={10} className="mr-1" />
                          我的評論：
                        </p>
                        <p className="text-[11px] font-bold text-gray-700 dark:text-slate-200 mt-1">
                          {item.commentText}
                        </p>
                      </div>
                    )}
                  </div>
               </div>

               <div className="flex justify-end pt-1">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    item.type === 'LIKE' ? 'bg-rose-50 text-rose-500' : 
                    item.type === 'COMMENT' ? 'bg-blue-50 text-blue-500' : 
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {item.type === 'LIKE' ? '點讚了' : item.type === 'COMMENT' ? '評論了' : '觀看了'}
                  </span>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunityHistoryView;
