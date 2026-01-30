// src/stores/useHistoryStore.ts
import { create } from 'zustand';
import { CommunityHistoryItem } from '../types';

type HistoryType = 'WATCH' | 'LIKE' | 'COMMENT';

interface HistoryState {
    histories: Record<HistoryType, CommunityHistoryItem[]>;
    offsets: Record<HistoryType, number>; // 当前页码（从 0 开始）
    hasMore: Record<HistoryType, boolean>; // 是否还能加载更多
    limit: number;

    setHistories: (type: HistoryType, items: CommunityHistoryItem[]) => void;
    addHistories: (type: HistoryType, newItems: CommunityHistoryItem[]) => void;
    incrementOffset: (type: HistoryType) => void;
    setHasMore: (type: HistoryType, value: boolean) => void;
    getOffset: (type: HistoryType) => number;
    getHistory: (type: HistoryType) => CommunityHistoryItem[];
    getHasMore: (type: HistoryType) => boolean;
    resetTab: (type: HistoryType) => void;
    clearAll: () => void;
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
    resetTab: (type) =>
        set((state) => ({
            histories: { ...state.histories, [type]: [] },
            offsets: { ...state.offsets, [type]: 0 },
            hasMore: { ...state.hasMore, [type]: true },
        })),

    clearAll: () =>
        set({
            histories: { WATCH: [], LIKE: [], COMMENT: [] },
            offsets: { WATCH: 0, LIKE: 0, COMMENT: 0 },
            hasMore: { WATCH: true, LIKE: true, COMMENT: true },
        }),

    histories: {
        WATCH: [],
        LIKE: [],
        COMMENT: [],
    },
    offsets: {
        WATCH: 0,
        LIKE: 0,
        COMMENT: 0,
    },
    hasMore: {
        WATCH: true,
        LIKE: true,
        COMMENT: true,
    },
    limit: 10,

    setHistories: (type, items) =>
        set((state) => ({
            histories: { ...state.histories, [type]: items },
        })),

    addHistories: (type, newItems) =>
        set((state) => ({
            histories: {
                ...state.histories,
                [type]: [...state.histories[type], ...newItems],
            },
        })),

    incrementOffset: (type) =>
        set((state) => ({
            offsets: {
                ...state.offsets,
                [type]: state.offsets[type] + 1,
            },
        })),

    setHasMore: (type, value) =>
        set((state) => ({
            hasMore: { ...state.hasMore, [type]: value },
        })),

    getOffset: (type) => get().offsets[type],
    getHistory: (type) => get().histories[type],
    getHasMore: (type) => get().hasMore[type],
}));