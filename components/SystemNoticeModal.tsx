
import React from 'react';
import { X, Rocket, Bell, CheckCircle2, ArrowRight, Sparkles, Image as ImageIcon } from 'lucide-react';

export type NoticeType = 'UPDATE' | 'ANNOUNCEMENT';

export interface NoticeSection {
  type: 'text' | 'list' | 'image';
  content: string | string[];
}

interface SystemNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: NoticeType;
  version?: string;
  title: string;
  sections: NoticeSection[];
  actionLabel?: string;
  closeOnOverlayClick?: boolean; // 新增属性：点击背景是否关闭
}

const SystemNoticeModal: React.FC<SystemNoticeModalProps> = ({
  isOpen,
  onClose,
  type = 'UPDATE',
  version = '2.1.0',
  title,
  sections,
  actionLabel = '我知道了',
  closeOnOverlayClick = false // 默认不允许点击背景关闭
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 px-8">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-500" 
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* 彈窗主體 */}
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[48px] overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 border border-white/20 dark:border-white/5 flex flex-col max-h-[85vh]">
        
        {/* 頂部裝飾色塊 */}
        <div className={`h-32 w-full shrink-0 relative flex items-center justify-center overflow-hidden ${
          type === 'UPDATE' ? 'bg-gradient-to-br from-orange-400 to-rose-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
        }`}>
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 bg-white/20 backdrop-blur-xl p-4 rounded-3xl border border-white/30 shadow-2xl animate-bounce">
            {type === 'UPDATE' ? (
              <Rocket size={40} className="text-white fill-white/20" />
            ) : (
              <Bell size={40} className="text-white fill-white/20" />
            )}
          </div>
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 標題區 */}
        <div className="px-8 pt-6 pb-2 text-center shrink-0">
          <div className="flex items-center justify-center space-x-2">
            <h3 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">{title}</h3>
            {type === 'UPDATE' && (
              <span className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-orange-200/50">
                V{version}
              </span>
            )}
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic mt-1">Official News Feed</p>
        </div>

        {/* 內容區 - 支持多種類型滾動 */}
        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-5 scrollbar-hide">
          {sections.map((section, index) => {
            if (section.type === 'text') {
              return (
                <p key={index} className="text-xs font-bold text-gray-600 dark:text-slate-300 leading-relaxed">
                  {section.content as string}
                </p>
              );
            }
            if (section.type === 'list') {
              return (
                <div key={index} className="bg-gray-50 dark:bg-slate-800/50 rounded-[24px] p-4 space-y-3 border border-gray-100 dark:border-white/5">
                  {(section.content as string[]).map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <CheckCircle2 size={14} className={type === 'UPDATE' ? 'text-orange-500 mt-0.5' : 'text-indigo-500 mt-0.5'} />
                      <span className="text-[11px] font-bold text-gray-700 dark:text-slate-200">{item}</span>
                    </div>
                  ))}
                </div>
              );
            }
            if (section.type === 'image') {
              return (
                <div key={index} className="relative rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-sm group">
                  <img src={section.content as string} className="w-full h-auto object-cover" alt="Notice visual" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            }
            return null;
          })}
        </div>

        {/* 底部按鈕區 */}
        <div className="px-8 pb-8 pt-2 shrink-0 space-y-4">
          <button 
            onClick={onClose}
            className={`w-full h-14 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all ${
              type === 'UPDATE' 
              ? 'bg-orange-600 text-white shadow-orange-600/20' 
              : 'bg-slate-900 text-white shadow-slate-900/20'
            }`}
          >
            <span>{actionLabel}</span>
            <ArrowRight size={18} />
          </button>
          
          <div className="flex items-center justify-center space-x-2 text-gray-300 dark:text-slate-600">
             <Sparkles size={12} />
             <span className="text-[9px] font-black uppercase tracking-widest italic">PawPal AI 致力於更好的陪伴</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemNoticeModal;
