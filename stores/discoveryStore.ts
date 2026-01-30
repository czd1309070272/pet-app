// src/stores/discoveryStore.ts
import { create } from 'zustand';
import { Product } from '../types';

interface DiscoveryState {
    // 主商品列表（最终渲染用）
    products: Product[];
    activeCategory: 'ALL' | Product['category'];
    layoutMode: 'GRID' | 'LIST';
    offset: number;           // 分类浏览页码
    limit: number;            // 每页数量

    // 搜索相关状态
    isSearching: boolean;
    searchKeyword: string;
    searchOffset: number;     // 搜索页码
    originalProducts: Product[]; // 退出搜索时用于 merge 的“原始分类商品快照”

    // Actions
    setProducts: (products: Product[]) => void;
    addProducts: (newProducts: Product[]) => void;
    setActiveCategory: (category: 'ALL' | Product['category']) => void;
    setLayoutMode: (mode: 'GRID' | 'LIST') => void;
    incrementOffset: () => void;
    resetOffset: () => void;
    clear: () => void;

    // 搜索专用 actions
    startSearch: (keyword: string) => void;
    endSearch: () => void;
    setSearchResults: (products: Product[], isNextPage: boolean) => void;
    incrementSearchOffset: () => void;
    restoreOriginalAndMerge: (searchedProducts: Product[]) => void;
}

export const useDiscoveryStore = create<DiscoveryState>()((set, get) => ({
    products: [],
    activeCategory: 'ALL',
    layoutMode: 'GRID',
    offset: 1,
    limit: 6,

    isSearching: false,
    searchKeyword: '',
    searchOffset: 1,
    originalProducts: [],

    // --- 基础 actions ---
    setProducts: (products) => set({ products }),
    addProducts: (newProducts) =>
        set((state) => ({ products: [...state.products, ...newProducts] })),

    setActiveCategory: (category) =>
        set({
            activeCategory: category,
            products: [],
            offset: 1,
            isSearching: false,
            searchKeyword: '',
            originalProducts: [],
        }),

    setLayoutMode: (mode) => set({ layoutMode: mode }),
    incrementOffset: () => set((state) => ({ offset: state.offset + 1 })),
    resetOffset: () => set({ offset: 1 }),

    clear: () =>
        set({
            products: [],
            activeCategory: 'ALL',
            layoutMode: 'GRID',
            offset: 1,
            isSearching: false,
            searchKeyword: '',
            originalProducts: [],
        }),

    // --- 搜索 actions ---
    startSearch: (keyword) => {
        const { products } = get();
        set({
            isSearching: true,
            searchKeyword: keyword,
            searchOffset: 1,
            originalProducts: [...products], // 保存当前商品作为“原始数据”
            products: [], // 清空，准备填入搜索结果
        });
    },

    endSearch: () => {
        set({
            isSearching: false,
            searchKeyword: '',
            searchOffset: 1,
        });
    },

    setSearchResults: (newProducts, isNextPage) => {
        set((state) => {
            if (isNextPage) {
                return {
                    products: [...state.products, ...newProducts],
                };
            } else {
                // 第一页：直接替换
                return {
                    products: newProducts,
                };
            }
        });
    },

    incrementSearchOffset: () => set((state) => ({ searchOffset: state.searchOffset + 1 })),

    restoreOriginalAndMerge: (searchedProducts) => {
        set((state) => {
            const originalMap = new Map(state.originalProducts.map(p => [p.id, p]));
            // 将搜索结果加入，去重（以搜索结果优先？或原始优先？这里按 id 去重，保留最新）
            const merged = new Map<string, Product>();

            // 先放原始商品
            state.originalProducts.forEach(p => merged.set(p.id, p));
            // 再放搜索商品（会覆盖同 id 的原始商品，但通常不会冲突）
            searchedProducts.forEach(p => merged.set(p.id, p));

            const mergedArray = Array.from(merged.values());

            return {
                products: mergedArray,
                originalProducts: [], // 清理快照
                isSearching: false,
                searchKeyword: '',
                searchOffset: 1,
            };
        });
    },
}));