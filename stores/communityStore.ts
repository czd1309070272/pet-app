// src/stores/useHistoryStore.ts
import { create } from 'zustand';
import { Post } from '../types';

type timeType = 'older' | 'newer';

interface CommunityState {
    communityList: Post[];
    communityTimenode: Record<timeType, string | null>;
    limit: number;

    setCommunityList: (posts: Post[]) => void;
    setCommunityTimenode: (type: timeType, timenode: string | null) => void;
    addCommunityList: (type: timeType, posts: Post[]) => void;
    resetCommunityList: (type: timeType) => void;
    resetCommunityTimenode: (type: timeType) => void;
    getCommunityList: () => Post[];
    getCommunityTimenode: (type: timeType) => string | null;
    getLimit: () => number;
    clearAll: () => void;
}

export const useCommunityStore = create<CommunityState>()((set, get) => ({
    communityList: [],
    communityTimenode: {
        older: null,
        newer: null,
    },
    limit: 10,

    setCommunityList: (posts) =>
        set({ communityList: posts }),

    addCommunityList: (type, newPosts) => {
        const currentList = get().communityList;
        let updatedList: Post[] = [];
        if (type === 'newer') {
            // 如果是newer，将新数据添加到当前列表的前面
            updatedList = [...newPosts, ...currentList];
        } else if (type === 'older') {
            // 如果是older，将新数据添加到当前列表的后面
            updatedList = [...currentList, ...newPosts];
        }
        set({ communityList: updatedList });
    },

    getCommunityTimenode: (type) =>
        get().communityTimenode[type],

    getLimit: () =>
        get().limit,

    setCommunityTimenode: (type, timenode) =>
        set((state) => ({
            communityTimenode: { ...state.communityTimenode, [type]: timenode },
        })),

    resetCommunityList: (type) =>
        set((state) => ({
            communityList: { ...state.communityList, [type]: [] },
        })),

    resetCommunityTimenode: (type) =>
        set((state) => ({
            communityTimenode: { ...state.communityTimenode, [type]: null },
        })),

    getCommunityList: () =>
        get().communityList,

    clearAll: () =>
        set({
            communityList: [],
            communityTimenode: { older: null, newer: null },
        }),
}));