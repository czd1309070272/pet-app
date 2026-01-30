
import React from 'react';
import { AlertTriangle, Lightbulb, BookOpen, ChevronRight, ShieldAlert, WifiOff, RefreshCw } from 'lucide-react';

interface CardProps {
  title: string;
  content: string;
  actionLabel?: string;
  onAction?: () => void;
}

// 1. 警告卡片：用於高風險、緊急提醒
export const WarningCard: React.FC<CardProps> = ({ title, content, actionLabel, onAction }) => (
  <div className="my-4 animate-in fade-in zoom-in-95 duration-500">
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-500/30 rounded-[24px] p-5 shadow-sm relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
        <ShieldAlert size={100} />
      </div>
      <div className="flex items-start space-x-3 relative z-10">
        <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-200 shrink-0">
          <AlertTriangle size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-black text-amber-900 dark:text-amber-100 mb-1">{title}</h4>
          <p className="text-xs text-amber-800/70 dark:text-amber-200/70 leading-relaxed font-medium">
            {content}
          </p>
          {actionLabel && (
            <button 
              onClick={onAction}
              className="mt-3 flex items-center space-x-1 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest hover:opacity-70 transition-opacity"
            >
              <span>{actionLabel}</span>
              <ChevronRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

// 2. 建議卡片：用於提供專家護理、餵養建議
export const SuggestionCard: React.FC<CardProps> = ({ title, content, actionLabel, onAction }) => (
  <div className="my-4 animate-in fade-in zoom-in-95 duration-500 delay-100">
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-500/30 rounded-[24px] p-5 shadow-sm relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
        <Lightbulb size={100} />
      </div>
      <div className="flex items-start space-x-3 relative z-10">
        <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 shrink-0">
          <Lightbulb size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-100 mb-1">{title}</h4>
          <p className="text-xs text-emerald-800/70 dark:text-emerald-200/70 leading-relaxed font-medium">
            {content}
          </p>
          {actionLabel && (
            <button 
              onClick={onAction}
              className="mt-3 flex items-center space-x-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest"
            >
              <span>{actionLabel}</span>
              <ChevronRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

// 3. 知識卡片：用於科普冷知識、行為學
export const KnowledgeCard: React.FC<CardProps> = ({ title, content, actionLabel, onAction }) => (
  <div className="my-4 animate-in fade-in zoom-in-95 duration-500 delay-200">
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-500/30 rounded-[24px] p-5 shadow-sm relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
        <BookOpen size={100} />
      </div>
      <div className="flex items-start space-x-3 relative z-10">
        <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
          <BookOpen size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-100 mb-1">{title}</h4>
          <p className="text-xs text-indigo-800/70 dark:text-indigo-200/70 leading-relaxed font-medium">
            {content}
          </p>
          {actionLabel && (
            <button 
              onClick={onAction}
              className="mt-3 flex items-center space-x-1 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest"
            >
              <span>{actionLabel}</span>
              <ChevronRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

// 4. 錯誤卡片：用於替代聊天中的彈窗錯誤
export const ChatErrorCard: React.FC<CardProps & { onRetry?: () => void }> = ({ title, content, actionLabel, onRetry }) => (
  <div className="my-4 animate-in fade-in slide-in-from-left-4 duration-500">
    <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-500/20 rounded-[24px] p-5 shadow-sm space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg">
          <WifiOff size={20} />
        </div>
        <div>
          <h4 className="text-sm font-black text-rose-900 dark:text-rose-100">{title}</h4>
          <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Network Alert</p>
        </div>
      </div>
      <p className="text-xs text-rose-700/80 dark:text-rose-300/70 leading-relaxed font-bold">
        {content}
      </p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="w-full py-3 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition-all"
        >
          <RefreshCw size={14} />
          <span>{actionLabel || '重新連結'}</span>
        </button>
      )}
    </div>
  </div>
);
