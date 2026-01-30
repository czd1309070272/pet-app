
import React, { useState, useEffect } from 'react';
import {
   ChevronLeft,
   Share2,
   MoreHorizontal,
   ShoppingCart,
   MessageCircle,
   Store,
   Heart,
   Star,
   ChevronRight,
   ShieldCheck,
   Truck,
   RotateCcw,
   Loader2,
   Info,
   CheckCircle,
   ShoppingBag
} from 'lucide-react';
import * as backend from '../backend';
import { Product, url_base, View } from '../types';

// Fix: Added onNavigate to ProductDetailViewProps to resolve assignability error in App.tsx
interface ProductDetailViewProps {
   productId: string;
   onBack: () => void;
   onNavigate: (view: View, data?: any) => void;
}

// Fix: Destructured onNavigate from props

const ProductDetailView: React.FC<ProductDetailViewProps> = ({ productId, onBack, onNavigate }) => {
   const [product, setProduct] = useState<Product | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [isLiked, setIsLiked] = useState(false);
   const [activeImageIdx, setActiveImageIdx] = useState(0);

   useEffect(() => {
      const loadData = async () => {
         setIsLoading(true);
         const data = await backend.fetchProductById(productId);
         console.log("ProductDetailView data:", data);
         setProduct(data);
         setIsLoading(false);
         setActiveImageIdx(data.detailImages.map(() => 0));
      };
      loadData();
   }, [productId]);

   const handleAddToCart = async () => {
      if (!product) return;

      try {
         // 添加当前产品到购物车，数量为1
         await backend.addToCart(product, 1);
         // 可以在这里添加提示信息，比如toast通知
         console.log(`${product.name} 已添加到购物车`);
         onNavigate(View.CART);
         // 询问用户是否要前往购物车
         // const goToCart = window.confirm('商品已添加到购物车！是否前往购物车？');
         // if (goToCart) {

         // }
      } catch (error) {
         console.error('添加到购物车失败:', error);
         alert('添加到购物车失败，请稍后重试');
      }
   };

   if (isLoading) {
      return (
         <div className="flex-1 flex flex-col items-center justify-center h-full bg-white dark:bg-slate-950">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={32} />
            <p className="text-xs font-black text-gray-400">正在獲取產品資訊...</p>
         </div>
      );
   }

   if (!product) {
      return (
         <div className="flex-1 flex flex-col items-center justify-center h-full bg-white dark:bg-slate-950 p-6">
            <p className="text-sm font-black text-gray-500 mb-6">抱歉，該產品目前無法提供</p>
            <button onClick={onBack} className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-black text-sm">返回商城</button>
         </div>
      );
   }

   const images = product.detailImages || [product.imageUrl];

   return (
      <div className="flex flex-col h-full bg-zinc-50 dark:bg-slate-950">
         {/* 沉浸式透明 Header */}
         <div className="fixed top-0 left-0 right-0 z-[100] p-5 flex items-center justify-between pointer-events-none">
            <button onClick={onBack} className="pointer-events-auto w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-800 dark:text-white shadow-sm border border-slate-200/50 active:scale-90 transition-transform">
               <ChevronLeft size={22} />
            </button>
            <div className="flex space-x-2 pointer-events-auto">
               <button className="w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-800 dark:text-white shadow-sm border border-slate-200/50 active:scale-90 transition-transform">
                  <Share2 size={18} />
               </button>
               <button className="w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-800 dark:text-white shadow-sm border border-slate-200/50 active:scale-90 transition-transform">
                  <MoreHorizontal size={18} />
               </button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto pb-32 scrollbar-hide">
            {/* 精緻輪播圖區域 */}
            <div className="relative aspect-[1/1] bg-white dark:bg-slate-900">
               <img src={`${url_base}${images[activeImageIdx]}`} className="w-full h-full object-cover" alt={product.name} />
               {images.length > 1 && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-1.5 bg-black/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                     {images.map((_, idx) => (
                        <div key={idx} className={`h-1.5 rounded-full transition-all ${activeImageIdx === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`} />
                     ))}
                  </div>
               )}
            </div>

            {/* 產品標題與價格 - 香港簡約排版 */}
            <div className="bg-white dark:bg-slate-900 px-6 py-8 border-b border-slate-100 dark:border-slate-800">
               <div className="flex items-center space-x-2 mb-3">
                  <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Limited</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product ID: {product.productId}</span>
               </div>
               <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-4">{product.name}</h1>

               <div className="flex items-end justify-between">
                  <div className="flex flex-col">
                     {product.originalPrice && (
                        <span className="text-xs text-slate-400 line-through font-bold mb-1">HK$ {product.originalPrice}</span>
                     )}
                     <div className="flex items-baseline space-x-1 text-orange-600">
                        <span className="text-lg font-black italic">HK$</span>
                        <span className="text-4xl font-black tracking-tighter">{product.price}</span>
                     </div>
                  </div>
                  <div className="flex items-center space-x-1 text-amber-500 font-black text-xs glass px-3 py-2 rounded-xl">
                     <Star size={14} fill="currentColor" />
                     <span>{product.rating}</span>
                     <span className="text-slate-300 mx-1">|</span>
                     <span className="text-slate-400">已售 {product.sales}</span>
                  </div>
               </div>
            </div>

            {/* 物流與保障服務 - 香港用戶最關心的資訊 */}
            <div className="mt-2 bg-white dark:bg-slate-900 px-6 py-6 space-y-5 border-y border-slate-100 dark:border-slate-800">
               <div className="flex items-center justify-between group cursor-pointer">
                  <div className="flex space-x-6">
                     <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                           <Truck size={18} />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">順豐速運發貨</span>
                           <span className="text-[9px] font-bold text-slate-400">滿 HK$300 免運費</span>
                        </div>
                     </div>
                     <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
                           <RotateCcw size={18} />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">7天無條件退換</span>
                           <span className="text-[9px] font-bold text-slate-400">原廠包裝未拆</span>
                        </div>
                     </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
               </div>

               <div className="p-4 bg-zinc-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-white/5">
                  <div className="flex items-center space-x-3">
                     <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                        <ShieldCheck size={20} />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-900 dark:text-white">PawPal 正品保證</span>
                        <span className="text-[9px] font-bold text-slate-400 italic">Global Quality Certified</span>
                     </div>
                  </div>
                  <button className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">查看資質</button>
               </div>
            </div>

            {/* 產品詳情與規格 - 結構化排版 */}
            <div className="mt-2 bg-white dark:bg-slate-900 px-6 py-8 space-y-8">
               <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                     <Info size={18} className="text-orange-500" />
                     <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">產品說明 / Details</h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                     {product.description || "此產品由 PawPal 專業研發團隊精心挑選，旨在為香港的都市萌寵提供最均衡的營養與最舒適的體驗。100% 安全認證，符合國際進口標準。"}
                  </p>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  {images.map((img, i) => (
                     <div key={i} className="rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                        <img src={`${url_base}${img}`} className="w-full h-auto" alt={`Detail view ${i}`} />
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* 底部操作欄 - 香港通用術語 */}
         <div className="fixed bottom-0 left-0 right-0 z-[110] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 p-4 flex items-center justify-between max-w-md mx-auto safe-bottom">
            <div className="flex items-center space-x-4 px-2">
               <button className="flex flex-col items-center space-y-1 text-slate-400 hover:text-orange-500 transition-colors">
                  <Store size={22} strokeWidth={1.5} />
                  <span className="text-[9px] font-bold uppercase">店舖</span>
               </button>
               <button className="flex flex-col items-center space-y-1 text-slate-400 hover:text-blue-500 transition-colors">
                  <MessageCircle size={22} strokeWidth={1.5} />
                  <span className="text-[9px] font-bold uppercase">諮詢</span>
               </button>
               <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`flex flex-col items-center space-y-1 transition-all active:scale-125 ${isLiked ? 'text-rose-500' : 'text-slate-400'}`}
               >
                  <Heart size={22} strokeWidth={1.5} fill={isLiked ? "currentColor" : "none"} />
                  <span className="text-[9px] font-bold uppercase">收藏</span>
               </button>
            </div>

            <div className="flex items-center space-x-2 flex-1 justify-end pl-4">
               <button
                  onClick={handleAddToCart}
                  className="flex-1 max-w-[120px] bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3.5 rounded-2xl font-black text-xs active:scale-95 transition-all border border-slate-200 dark:border-slate-700"
               >
                  加入購物籃
               </button>
               <button
                  onClick={() => onNavigate(View.CART)}
                  className="flex-1 max-w-[120px] bg-orange-600 text-white px-4 py-3.5 rounded-2xl font-black text-xs shadow-xl shadow-orange-600/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
               >
                  <span>立即結賬</span>
               </button>
            </div>
         </div>
      </div>
   );
};

export default ProductDetailView;
