
import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Lightbulb, 
  BookOpen, 
  ChevronRight, 
  ShieldAlert, 
  WifiOff, 
  RefreshCw, 
  ShoppingBag, 
  Star,
  Info,
  Heart,
  Sparkles,
  Trophy
} from 'lucide-react';
import { ProductItem } from '../../services/aiFeatures';

// --- 爪印裝飾組件 ---
const PawDecoration = ({ className = "" }: { className?: string }) => (
  <div className={`absolute pointer-events-none opacity-[0.05] dark:opacity-[0.08] ${className}`}>
    <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 14c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-5-3c1.38 0 2.5-1.12 2.5-2.5S8.38 6 7 6 4.5 7.12 4.5 8.5 5.62 11 7 11zm10 0c1.38 0 2.5-1.12 2.5-2.5S18.38 6 17 6s-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5zM12 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
    </svg>
  </div>
);

// --- 1. 基礎原子組件 ---

interface BaseCardProps {
  children: React.ReactNode;
  variant?: 'peach' | 'mint' | 'lavender' | 'rose' | 'cloud';
  className?: string;
}

export const BaseCard: React.FC<BaseCardProps> = ({ children, variant = 'cloud', className = "" }) => {
  const themes = {
    peach: "from-orange-50 to-rose-50 dark:from-orange-950/20 dark:to-rose-900/20 border-orange-100 dark:border-orange-500/30 text-orange-900 dark:text-orange-100",
    mint: "from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-900/20 border-emerald-100 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-100",
    lavender: "from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-900/20 border-indigo-100 dark:border-indigo-500/30 text-indigo-900 dark:text-indigo-100",
    rose: "from-rose-50 to-pink-100 dark:from-rose-950/20 dark:to-pink-900/20 border-rose-100 dark:border-rose-500/30 text-rose-900 dark:text-rose-100",
    cloud: "from-white/80 to-blue-50/30 dark:from-slate-900/90 dark:to-slate-900/70 border-white dark:border-white/10 text-slate-800 dark:text-slate-100"
  };

  return (
    <div className={`my-4 animate-in fade-in zoom-in-95 duration-500 bg-gradient-to-br border rounded-[32px] p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all ${themes[variant]} ${className}`}>
      <PawDecoration className="-right-4 -bottom-4 rotate-12" />
      <PawDecoration className="-left-6 -top-6 -rotate-12 scale-75" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  primary?: boolean;
}

export const CardAction: React.FC<ActionButtonProps> = ({ label, onClick, icon, primary }) => (
  <button 
    onClick={onClick}
    className={`mt-4 w-full flex items-center justify-center space-x-2 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-[0.1em] transition-all active:scale-95 ${
      primary 
      ? 'bg-current text-white contrast-125 shadow-lg' 
      : 'bg-white/60 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/30'
    }`}
  >
    <span>{label}</span>
    {icon || <ChevronRight size={12} />}
  </button>
);

// --- 2. 組合型業務卡片 ---

// 橫向滑動商品卡片單元 (縮小化處理)
const SingleProductItem: React.FC<{ 
  item: ProductItem; 
  onNavigate: (id: string) => void;
  isSingle: boolean;
}> = ({ item, onNavigate, isSingle }) => (
  <div className={`flex-shrink-0 ${isSingle ? 'w-full' : 'w-[210px]'} snap-center px-1 py-1`}>
     <div className="bg-white dark:bg-slate-900 rounded-[36px] border border-orange-100 dark:border-white/5 overflow-hidden shadow-lg shadow-orange-100/20 dark:shadow-none h-full flex flex-col group relative transition-all active:scale-[0.98]">
        <PawDecoration className="top-2 right-2 rotate-45 scale-50 opacity-[0.03]" />

        <div className="relative p-2">
           <div className="aspect-[13/10] rounded-[28px] overflow-hidden relative shadow-inner">
              <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={item.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/5" />
              
              {item.tag && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg flex items-center space-x-1">
                   <Trophy size={8} fill="currentColor" />
                   <span className="uppercase tracking-tighter">{item.tag}</span>
                </div>
              )}

              <div className="absolute top-3 right-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-xl px-2.5 py-1 text-orange-600 font-black shadow-xl border border-white/40 dark:border-white/10 z-20 flex items-baseline space-x-0.5">
                 <span className="text-[9px] italic">HK$</span>
                 <span className="text-base tracking-tighter leading-none">{item.price}</span>
              </div>

              <div className="absolute bottom-3 left-4 right-4 text-white">
                 <p className="text-[13px] font-black line-clamp-1 drop-shadow-md tracking-tight">{item.title}</p>
              </div>
           </div>
        </div>

        <div className="px-5 pb-5 pt-1 flex flex-col justify-between flex-1">
           <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 line-clamp-2 leading-tight italic opacity-80">
                「{item.content}」
              </p>
              <div className="flex items-center space-x-0.5 text-orange-400">
                <Star size={8} fill="currentColor" />
                <Star size={8} fill="currentColor" />
                <Star size={8} fill="currentColor" />
                <Star size={8} fill="currentColor" />
                <Star size={8} fill="currentColor" />
                <span className="text-[8px] font-black ml-1 text-gray-300">熱賣中</span>
              </div>
           </div>

           <button 
             onClick={() => onNavigate(item.id)}
             className="mt-4 w-full py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
           >
             <Heart size={12} fill="currentColor" className="animate-pulse" />
             <span>帶回家 🎁</span>
           </button>
        </div>
     </div>
  </div>
);

interface ProductCardProps {
  id?: string;
  name?: string;
  price?: number;
  imageUrl?: string;
  tag?: string;
  products?: ProductItem[];
  onNavigate: (id: string) => void;
}

// 商品推薦容器卡片 (修正對齊與寬度)
export const ProductRecommendCard: React.FC<ProductCardProps> = ({ id, name, price, imageUrl, tag, products, onNavigate }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const displayProducts: ProductItem[] = products || (id ? [{
    id: id!,
    title: name!,
    price: price!,
    imageUrl: imageUrl!,
    tag: tag,
    content: "這款好物深受毛孩子們的喜愛喔 ✨"
  }] : []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    // 根據卡片寬度計算索引 (210px + px-1*2)
    const index = Math.round(scrollLeft / 212);
    if (index !== activeIndex) setActiveIndex(index);
  };

  return (
    <div className="my-5 relative w-full overflow-hidden">
       {/* 標題區：修正邊距與文字尺寸 */}
       <div className="mb-3 px-0.5 flex justify-between items-end">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5">
               <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse"></div>
               <h4 className="text-[9px] font-black text-orange-500/60 uppercase tracking-[0.2em]">AI Selection</h4>
            </div>
            <p className="text-base font-black text-gray-800 dark:text-white flex items-center">
              精選好物 <Sparkles size={16} className="ml-1.5 text-orange-400" />
            </p>
          </div>
          
          {displayProducts.length > 1 && (
            <div className="flex space-x-1 pb-1.5">
               {displayProducts.map((_, i) => (
                 <div key={i} className={`h-1 rounded-full transition-all duration-500 ${activeIndex === i ? 'bg-orange-500 w-4' : 'bg-orange-200 dark:bg-orange-900/30 w-1'}`} />
               ))}
            </div>
          )}
       </div>

       {/* 橫向滑動列表 */}
       <div 
         onScroll={handleScroll}
         className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide py-1"
       >
          {displayProducts.map((item) => (
            <SingleProductItem 
              key={item.id} 
              item={item} 
              onNavigate={onNavigate} 
              isSingle={displayProducts.length === 1} 
            />
          ))}
          {displayProducts.length > 1 && <div className="flex-shrink-0 w-12" />}
       </div>

       <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] opacity-40 mt-3 pl-0.5">
         智能算法精準匹配 · 為您推薦
       </p>
    </div>
  );
};

// 通用內容卡片 (也進行微調縮小)
export const GenericCard: React.FC<{ 
  title: string; 
  icon?: React.ElementType; 
  content: string; 
  variant?: BaseCardProps['variant'];
  actions?: Array<{ label: string; onClick: () => void }>;
}> = ({ title, icon: Icon, content, variant = 'lavender', actions }) => (
  <BaseCard variant={variant}>
    <div className="flex items-start space-x-3.5">
      {Icon && (
        <div className="w-10 h-10 bg-current bg-opacity-10 rounded-[16px] flex items-center justify-center shrink-0 shadow-inner">
          <Icon size={20} className="opacity-80" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="text-[15px] font-black mb-1 tracking-tight">{title}</h4>
        <p className="text-[11px] opacity-75 leading-relaxed font-bold">{content}</p>
        <div className="space-y-0.5">
          {actions?.map((act, i) => (
            <CardAction key={i} label={act.label} onClick={act.onClick} />
          ))}
        </div>
      </div>
    </div>
  </BaseCard>
);

export const WarningCard: React.FC<{ title: string; content: string; onAction?: () => void }> = (props) => (
  <GenericCard {...props} variant="peach" icon={AlertTriangle} actions={props.onAction ? [{ label: '立即查看', onClick: props.onAction }] : undefined} />
);

export const SuggestionCard: React.FC<{ title: string; content: string; onAction?: () => void }> = (props) => (
  <GenericCard {...props} variant="mint" icon={Lightbulb} actions={props.onAction ? [{ label: '設定提醒', onClick: props.onAction }] : undefined} />
);

export const KnowledgeCard: React.FC<{ title: string; content: string; onAction?: () => void }> = (props) => (
  <GenericCard {...props} variant="lavender" icon={BookOpen} actions={props.onAction ? [{ label: '學習一下', onClick: props.onAction }] : undefined} />
);

export const ChatErrorCard: React.FC<{ title: string; content: string; onRetry?: () => void; actionLabel?: string }> = ({ title, content, onRetry, actionLabel }) => (
  <BaseCard variant="rose">
    <div className="flex items-center space-x-3.5 mb-3.5">
      <div className="w-10 h-10 bg-rose-500 text-white rounded-[16px] flex items-center justify-center shadow-lg shadow-rose-200 dark:shadow-none animate-bounce">
        <WifiOff size={20} />
      </div>
      <div>
        <h4 className="text-[15px] font-black">{title}</h4>
        <p className="text-[8px] font-black opacity-50 uppercase tracking-widest flex items-center">
          <Info size={8} className="mr-1" />
          網絡連接小異常
        </p>
      </div>
    </div>
    <p className="text-[11px] opacity-80 leading-relaxed font-black mb-4 pl-1">{content}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="w-full py-3.5 bg-white/50 dark:bg-black/30 rounded-[20px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 border border-white dark:border-white/5 active:scale-95"
      >
        <RefreshCw size={14} />
        <span>{actionLabel || '重新召喚 AI'}</span>
      </button>
    )}
  </BaseCard>
);
