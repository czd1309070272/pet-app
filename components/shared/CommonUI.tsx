
import React from 'react';
import { ChevronLeft, X, ArrowRight } from 'lucide-react';
import { getErrorDetail } from '../../constants/errorConfig';

export const GlassCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <div
    onClick={onClick}
    className={`glass rounded-[32px] p-6 border shadow-glass dark:shadow-glass-dark ${onClick ? 'clickable' : ''} ${className}`}
  >
    {children}
  </div>
);

export const ViewHeader: React.FC<{ title: string; onBack: () => void; rightElement?: React.ReactNode }> = ({ title, onBack, rightElement }) => (
  <div className="flex items-center justify-between mb-8 px-1">
    <div className="flex items-center space-x-4">
      <button
        onClick={onBack}
        className="w-12 h-12 flex items-center justify-center glass rounded-full text-gray-600 dark:text-gray-300 shadow-sm border border-white/60 dark:border-white/10 clickable active:scale-90"
        aria-label="返回"
      >
        <ChevronLeft size={24} />
      </button>
      <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">{title}</h2>
    </div>
    <div className="min-w-[48px] min-h-[48px] flex items-center justify-end">
      {rightElement}
    </div>
  </div>
);

export const ActionButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'glass';
  className?: string;
  disabled?: boolean;
}> = ({ onClick, children, variant = 'primary', className = "", disabled }) => {
  const baseClass = "min-h-[56px] px-6 rounded-2xl font-black text-base transition-all clickable flex items-center justify-center space-x-3";
  const variants = {
    primary: "bg-orange-500 text-white shadow-xl shadow-orange-300 dark:shadow-none",
    glass: "glass text-gray-600 dark:text-gray-300 border border-white/40 dark:border-white/5"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${variants[variant]} ${disabled ? 'opacity-50 grayscale pointer-events-none' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export const ErrorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  code?: number;
  onRetry?: () => void;
}> = ({ isOpen, onClose, code, onRetry }) => {
  if (!isOpen) return null;
  const detail = getErrorDetail(code);
  const Icon = detail.icon;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20 overflow-hidden">
        <div className="p-8 text-center space-y-6">
          <div className={`w-20 h-20 mx-auto rounded-3xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center ${detail.iconColor} shadow-inner`}>
            <Icon size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-gray-800 dark:text-white">{detail.title}</h3>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 leading-relaxed px-2">
              {detail.message}
            </p>
          </div>
          <div className="pt-2 space-y-3">
            <button
              onClick={onRetry || onClose}
              className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-200 dark:shadow-none active:scale-95 transition-transform flex items-center justify-center space-x-2"
            >
              <span>{detail.actionLabel}</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-600 transition-colors"
            >
              關閉窗口
            </button>
          </div>
        </div>
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-300 hover:text-gray-500"><X size={20} /></button>
      </div>
    </div>
  );
};
