
import React from 'react';
import { ChevronLeft } from 'lucide-react';

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
