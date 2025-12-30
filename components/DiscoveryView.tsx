
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Star, 
  Plus, 
  Loader2, 
  Heart, 
  ShoppingBag, 
  LayoutGrid, 
  List, 
  CheckCircle2,
  Trophy
} from 'lucide-react';
import * as backend from '../backend';
import { Product, View } from '../types';

interface DiscoveryViewProps {
  onNavigate: (view: View, data?: any) => void;
}

const DiscoveryView: React.FC<DiscoveryViewProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'ALL' | Product['category']>('ALL');
  const [layoutMode, setLayoutMode] = useState<'GRID' | 'LIST'>('GRID');
  const [cartCount, setCartCount] = useState(0);
  const [isAddingId, setIsAddingId] = useState<string | null>(null);

  // 初始化数据：商品列表和购物车数量
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        const [pData, cartItems] = await Promise.all([
          backend.fetchProducts(activeCategory === 'ALL' ? undefined : activeCategory),
          backend.fetchCart()
        ]);
        setProducts(pData);
        setCartCount(cartItems.reduce((acc, item) => acc + item.quantity, 0));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, [activeCategory]);

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setIsAddingId(product.id);
    try {
      await backend.addToCart(product, 1);
      const cartItems = await backend.fetchCart();
      setCartCount(cartItems.reduce((acc, item) => acc + item.quantity, 0));
      // 震动反馈 (如果支持)
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    } finally {
      setTimeout(() => setIsAddingId(null), 800);
    }
  };

  const categories = [
    { id: 'ALL', label: '全部' },
    { id: 'FOOD', label: '主糧' },
    { id: 'TREAT', label: '零食' },
    { id: 'HEALTH', label: '健康' },
    { id: 'TOY', label: '玩具' }
  ];

  return (
    <div className="flex flex-col h-full bg-[#f6f6f6] dark:bg-slate-950 pb-24">
      {/* 淘宝风格搜索栏 Header */}
      <div className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 space-y-3 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center justify-between">
           <div className="flex items-center space-x-2">
             <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white shadow-md">
                <ShoppingBag size={18} />
             </div>
             <h2 className="text-lg font-black text-gray-800 dark:text-white tracking-tight italic">PawPal <span className="text-orange-500">Mall</span></h2>
           </div>
           
           <div className="flex items-center space-x-2">
              {/* 布局切换按钮 */}
              <button 
                onClick={() => setLayoutMode(layoutMode === 'GRID' ? 'LIST' : 'GRID')}
                className="p-2.5 glass rounded-xl text-gray-500 dark:text-white active:scale-90 transition-transform"
                title={layoutMode === 'GRID' ? '切换到单排' : '切换到双排'}
              >
                {layoutMode === 'GRID' ? <List size={20} /> : <LayoutGrid size={20} />}
              </button>

              {/* 购物车入口 (带动态角标) */}
              <button 
                onClick={() => onNavigate(View.CART)}
                className="relative p-2.5 bg-white dark:bg-slate-800 rounded-xl text-gray-800 dark:text-white shadow-sm border border-gray-100 dark:border-white/10 active:scale-90 transition-transform"
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-orange-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 px-1 animate-in zoom-in duration-300">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
           </div>
        </div>

        <div className="flex space-x-2">
          <div className="flex-1 relative group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="搜尋全球萌寵好物..." 
              className="w-full bg-[#f1f1f1] dark:bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 text-xs font-bold focus:ring-1 focus:ring-orange-500 transition-all dark:text-white" 
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Categories Chips */}
        <div className="flex space-x-2 overflow-x-auto px-4 py-4 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`flex-shrink-0 px-5 py-1.5 rounded-full text-[11px] font-black transition-all ${activeCategory === cat.id ? 'bg-orange-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-gray-500 border border-gray-100 dark:border-white/5'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Product Display Area */}
        <div className="px-3 pb-12">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 opacity-40">
              <Loader2 className="animate-spin text-orange-500" size={32} />
              <p className="text-xs font-black">正在探索精選好物...</p>
            </div>
          ) : (
            <div className={layoutMode === 'GRID' ? "grid grid-cols-2 gap-2" : "flex flex-col space-y-2"}>
              {products.map(product => (
                <div 
                  key={product.id} 
                  onClick={() => onNavigate(View.PRODUCT_DETAIL, product.id)}
                  className={`bg-white dark:bg-slate-900 overflow-hidden shadow-sm active:scale-[0.98] transition-transform flex cursor-pointer
                    ${layoutMode === 'GRID' ? 'flex-col rounded-2xl' : 'flex-row rounded-2xl h-36'}
                  `}
                >
                  {/* 图片区域 */}
                  <div className={`relative ${layoutMode === 'GRID' ? 'w-full aspect-square' : 'w-36 h-36 shrink-0'}`}>
                     <img src={product.imageUrl} className="w-full h-full object-cover" alt={product.name} />
                     {product.tag && (
                       <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-600 to-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm flex items-center space-x-0.5">
                         <Trophy size={8} />
                         <span className="uppercase tracking-tighter">{product.tag}</span>
                       </div>
                     )}
                     <button className="absolute bottom-2 left-2 w-7 h-7 bg-black/10 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-rose-500 transition-colors">
                        <Heart size={14} />
                     </button>
                  </div>

                  {/* 信息区域 */}
                  <div className={`p-3 flex-1 flex flex-col justify-between ${layoutMode === 'GRID' ? '' : 'min-w-0'}`}>
                     <div>
                       <h4 className={`text-xs font-black text-gray-800 dark:text-white leading-snug line-clamp-2 ${layoutMode === 'LIST' ? 'text-sm' : ''}`}>
                         {product.name}
                       </h4>
                       <div className="flex items-center space-x-1 mt-1.5 opacity-60">
                          <Star size={10} className="text-orange-500" fill="currentColor" />
                          <span className="text-[9px] font-black text-gray-500 dark:text-slate-400">{product.rating} | 已售 {product.sales}</span>
                       </div>
                       {layoutMode === 'LIST' && (
                         <p className="text-[10px] text-gray-400 mt-2 line-clamp-1 italic font-medium">官方正品 · 限時包郵</p>
                       )}
                     </div>

                     <div className="flex items-end justify-between mt-2">
                        <div className="min-w-0">
                           <div className="flex items-baseline space-x-0.5 text-orange-600">
                              <span className="text-[10px] font-black">HK$</span>
                              <span className="text-lg font-black tracking-tighter leading-none">{product.price}</span>
                           </div>
                           {product.originalPrice && (
                             <p className="text-[9px] text-gray-300 line-through font-medium">HK$ {product.originalPrice}</p>
                           )}
                        </div>
                        
                        <button 
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={isAddingId === product.id}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-90
                            ${isAddingId === product.id ? 'bg-emerald-500 scale-110' : 'bg-orange-600 shadow-orange-200 dark:shadow-none hover:bg-orange-500'}
                            ${layoutMode === 'LIST' ? 'w-24 h-9 space-x-1.5' : ''}
                          `}
                        >
                           {isAddingId === product.id ? (
                             <CheckCircle2 size={18} className="text-white animate-in zoom-in" />
                           ) : (
                             <>
                               <Plus size={18} className="text-white" />
                               {layoutMode === 'LIST' && <span className="text-white text-[10px] font-black">加購物籃</span>}
                             </>
                           )}
                        </button>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* 空状态占位 */}
      {!isLoading && products.length === 0 && (
         <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <ShoppingBag size={48} className="text-gray-400 mb-2" />
            <p className="text-xs font-black">該分類下暫無好物...</p>
         </div>
      )}
    </div>
  );
};

export default DiscoveryView;
