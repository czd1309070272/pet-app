// src/views/DiscoveryView.tsx
import React, { useState, useEffect, useRef } from 'react';
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
import { Product, url_base, View } from '../types';
import { useDiscoveryStore } from '@/stores/discoveryStore';

interface DiscoveryViewProps {
  onNavigate: (view: View, data?: any) => void;
}

const DiscoveryView: React.FC<DiscoveryViewProps> = ({ onNavigate }) => {
  const {
    products,
    activeCategory,
    layoutMode,
    offset,
    limit,
    isSearching,
    searchKeyword,
    searchOffset,
    setProducts,
    addProducts,
    setActiveCategory,
    setLayoutMode,
    incrementOffset,
    startSearch,
    endSearch,
    setSearchResults,
    incrementSearchOffset,
    restoreOriginalAndMerge,
  } = useDiscoveryStore();

  const [isLoading, setIsLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [isAddingId, setIsAddingId] = useState<string | null>(null);

  // 下拉刷新状态
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshNoData, setRefreshNoData] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  // 搜索输入本地状态
  const [searchInput, setSearchInput] = useState('');

  // 初始化：加载第一页分类商品 & 购物车
  useEffect(() => {
    if (isSearching) return;

    const controller = new AbortController();
    const loadFirstPage = async () => {
      setIsLoading(true);
      try {
        const [pData, cartItems] = await Promise.all([
          backend.fetchProducts(
            activeCategory === 'ALL' ? 'ALL' : activeCategory,
            1,
            limit,
            { signal: controller.signal }
          ),
          backend.fetchCart({ signal: controller.signal }),
        ]);

        if (controller.signal.aborted) return;

        setProducts(pData);
        setCartCount(cartItems.reduce((acc, item) => acc + item.quantity, 0));
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('加载失败:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadFirstPage();
    return () => controller.abort();
  }, [activeCategory, limit, isSearching]);

  // 购物车初始加载
  useEffect(() => {
    const controller = new AbortController();
    backend.fetchCart({ signal: controller.signal })
      .then(cartItems => {
        setCartCount(cartItems.reduce((acc, item) => acc + item.quantity, 0));
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.warn('加载购物车失败:', err);
        }
      });
    return () => controller.abort();
  }, []);

  // 搜索提交处理
  const handleSearchSubmit = async () => {
    const keyword = searchInput.trim();
    if (!keyword) {
      // 清空 → 退出搜索，并 merge
      const currentSearched = products;
      restoreOriginalAndMerge(currentSearched);
      setSearchInput('');
      await loadCategoryPage(activeCategory, 1);
      return;
    }

    startSearch(keyword);
    await loadSearchPage(keyword, 1, false);
  };

  const loadSearchPage = async (keyword: string, page: number, isNextPage: boolean) => {
    setIsLoading(true);
    try {
      const results = await backend.searchProducts(keyword, page, limit);
      setSearchResults(results, isNextPage);
      if (isNextPage && results.length > 0) {
        incrementSearchOffset();
      }
    } catch (err) {
      console.error('搜索失败:', err);
      if (!isNextPage) {
        setSearchResults([], false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategoryPage = async (category: string, page: number) => {
    setIsLoading(true);
    try {
      const pData = await backend.fetchProducts(
        category === 'ALL' ? 'ALL' : category,
        page,
        limit
      );
      if (page === 1) {
        setProducts(pData);
      } else {
        addProducts(pData);
        incrementOffset();
      }
    } catch (err) {
      console.error('加载分类失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 下拉刷新
  const refreshProducts = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setPullDistance(50);

    try {
      if (isSearching) {
        const nextPage = searchOffset + 1;
        const results = await backend.searchProducts(searchKeyword, nextPage, limit);
        if (results.length === 0) {
          setRefreshNoData(true);
        } else {
          setRefreshNoData(false);
          setSearchResults(results, true);
          incrementSearchOffset();
        }
      } else {
        const nextPageProducts = await backend.fetchProducts(
          activeCategory === 'ALL' ? 'ALL' : activeCategory,
          offset + 1,
          limit
        );
        if (nextPageProducts.length === 0) {
          setRefreshNoData(true);
        } else {
          setRefreshNoData(false);
          addProducts(nextPageProducts);
          incrementOffset();
        }
      }

      const cartItems = await backend.fetchCart();
      setCartCount(cartItems.reduce((acc, item) => acc + item.quantity, 0));
    } catch (err) {
      console.error('刷新失败:', err);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  };

  // 触摸事件
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === 0 || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartY.current;
    if (distance > 0) {
      setPullDistance(Math.min(distance * 0.4, 80));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 50) {
      refreshProducts();
    } else {
      setPullDistance(0);
    }
    touchStartY.current = 0;
  };

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setIsAddingId(product.id);
    try {
      await backend.addToCart(product, 1);
      const cartItems = await backend.fetchCart();
      setCartCount(cartItems.reduce((acc, item) => acc + item.quantity, 0));
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

  const handleCategoryChange = (cat: string) => {
    if (isSearching) {
      const currentSearched = products;
      restoreOriginalAndMerge(currentSearched);
    }
    setActiveCategory(cat as any);
  };

  return (
    <div className="flex flex-col h-full bg-[#f6f6f6] dark:bg-slate-950 pb-24">
      <div className="h-16"></div>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 space-y-3 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white shadow-md">
              <ShoppingBag size={18} />
            </div>
            <h2 className="text-lg font-black text-gray-800 dark:text-white tracking-tight italic">PawPal <span className="text-orange-500">Mall</span></h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setLayoutMode(layoutMode === 'GRID' ? 'LIST' : 'GRID')}
              className="p-2.5 glass rounded-xl text-gray-500 dark:text-white active:scale-90 transition-transform"
              title={layoutMode === 'GRID' ? '切换到单排' : '切换到双排'}
            >
              {layoutMode === 'GRID' ? <List size={20} /> : <LayoutGrid size={20} />}
            </button>

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

        {/* 搜索栏 + 搜索按钮 */}
        <div className="flex space-x-2">
          <div className="flex-1 relative group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (e.target.value === '') {
                  const currentSearched = products;
                  restoreOriginalAndMerge(currentSearched);
                  loadCategoryPage(activeCategory, 1);
                }
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              placeholder="搜尋全球萌寵好物..."
              className="w-full bg-[#f1f1f1] dark:bg-slate-800 border-none rounded-xl py-2 pl-10 pr-12 text-xs font-bold focus:ring-1 focus:ring-orange-500 transition-all dark:text-white"
            />
            {/* 搜索按钮 */}
            <button
              onClick={handleSearchSubmit}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-orange-500 active:scale-95 transition-transform"
              aria-label="搜索"
            >
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-y-auto scrollbar-hide"
      >
        {/* 下拉刷新指示器 */}
        <div
          className="flex items-center justify-center overflow-hidden transition-all duration-200 bg-[#f6f6f6]/50 dark:bg-slate-950/50"
          style={{ height: pullDistance + 'px' }}
        >
          <div className="flex flex-col items-center space-y-1">
            {isRefreshing ? (
              <Loader2 className="animate-spin text-orange-500" size={18} />
            ) : (
              <div className={`text-gray-400 transition-transform ${pullDistance > 50 ? 'rotate-180 text-orange-400' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </div>
            )}
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {isRefreshing
                ? (refreshNoData ? '已無最新數據' : '正在同步數據')
                : (pullDistance > 50 ? '放手開始刷新' : '下拉獲取最新內容')}
            </span>
          </div>
        </div>

        {/* 分类标签栏：仅在非搜索状态下显示 */}
        {!isSearching && (
          <div className="flex space-x-2 overflow-x-auto px-4 py-4 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex-shrink-0 px-5 py-1.5 rounded-full text-[11px] font-black transition-all ${activeCategory === cat.id ? 'bg-orange-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-gray-500 border border-gray-100 dark:border-white/5'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Product Display Area */}
        <div className="px-3 pb-12">
          {isLoading && !isRefreshing ? (
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
                  <div className={`relative ${layoutMode === 'GRID' ? 'w-full aspect-square' : 'w-36 h-36 shrink-0'}`}>
                    <img src={`${url_base}${product.imageUrl}`} className="w-full h-full object-cover" alt={product.name} />
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

      {!isLoading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 opacity-30">
          <ShoppingBag size={48} className="text-gray-400 mb-2" />
          <p className="text-xs font-black">
            {isSearching ? '沒有找到相關商品...' : '該分類下暫無好物...'}
          </p>
        </div>
      )}
    </div>
  );
};

export default DiscoveryView;