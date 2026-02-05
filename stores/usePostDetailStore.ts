// src/stores/usePostDetailStore.ts
import { create } from 'zustand';
import { Post, Comment } from '../types';

interface PostDetailState {
    // 储存原始帖子（含初始 commentList，但后续被忽略）
    community: Post | null;
    // 独立维护的、可变的评论树
    comments: Comment[];

    top_limit: number;
    replies_limit: number;

    // 初始化：设置完整帖子，并提取评论
    setFullPost: (post: Post) => void;

    // 更新评论（支持各种增量场景）
    setComments: (comments: Comment[]) => void;
    addComments: (Topnum: number, newComments: Comment[]) => void;
    updateCommentReplies: (topCommentId: string, newReplies: Comment[]) => void;

    getComments: () => Comment[];

    getCommentLastCreatedTime: () => string | null;

    // 👇 新增：根据顶级评论 ID 获取其最后一个子评论的时间
    getLastReplyTimeByTopId: (topCommentId: string) => string | null;

    // 对外：获取最新完整帖子（用最新 comments 替换原 commentList）
    getFullPost: () => Post | null;

    getTopLimit: () => number;
    getRepliesLimit: () => number;
    clearData: () => void;
}

export const usePostDetailStore = create<PostDetailState>()((set, get) => ({
    community: null,
    comments: [],
    top_limit: 5,
    replies_limit: 5,

    getComments: () => get().comments,

    // 🚀 首次加载：存 community，并提取 comments
    setFullPost: (post) => {
        set({
            community: post,
            comments: post.commentList || [],
        });
    },

    getCommentLastCreatedTime: () => {
        const comments = get().comments;
        if (comments.length === 0) return null;
        const lastComment = comments[comments.length - 1];
        return lastComment.time;
    },

    // 👇 新增函数实现
    getLastReplyTimeByTopId: (topCommentId: string) => {
        const comments = get().comments;
        const topComment = comments.find(c => c.id === topCommentId);
        if (!topComment || !topComment.replies || topComment.replies.length === 0) {
            return null;
        }
        // 返回最后一条子评论的时间（假设 replies 按时间顺序排列）
        return topComment.replies[topComment.replies.length - 1].time;
    },

    // 替换全部评论（如刷新）
    setComments: (comments) => set({ comments }),

    addComments: (Topnum, newComments) => {
        console.log('开始添加评论', {
            Topnum: Topnum,
            newComments: newComments,
            currentCommentsCount: get().comments.length
        });
        console.log('当前所有顶级评论ID:', get().comments.map(c => c.id));
        console.log('要查找的目标ID (String):', String(Topnum));

        if (Topnum === 0 || Topnum === -1) {
            // 添加顶级评论
            console.log('添加顶级评论，当前顶级评论数量:', get().comments.length, '新增评论数:', newComments.length);
            set({
                comments: [...get().comments, ...newComments],
            });
            console.log('添加顶级评论后，新的顶级评论数量:', [...get().comments, ...newComments].length);
        } else {
            // 添加子评论到指定顶级评论下
            console.log('添加子评论，目标顶级评论ID:', Topnum, '新增子评论数:', newComments.length);

            set((state) => {
                const updatedComments = state.comments.map(comment => {

                    let topnum_str = String(Topnum);
                    let comment_id_str = String(comment.id);
                    console.log('比较:', comment_id_str, '===', topnum_str);
                    console.log('正在查看评论顶级信息:', comment);
                    if (comment_id_str === topnum_str) {
                        console.log('找到目标顶级评论，更新其子评论，原子评论数:', comment.replies?.length || 0, '新增子评论数:', newComments.length);
                        console.log('添加前的子评论列表:', comment.replies);

                        const updatedReplies = [...(comment.replies || []), ...newComments];
                        console.log('添加后的完整子评论列表:', updatedReplies);

                        return {
                            ...comment,
                            replies: updatedReplies,
                        };
                    }
                    return comment; // ✅ 关键修复！
                });

                console.log('更新后的评论总数:', updatedComments.length);
                return { comments: updatedComments };
            });
        }
    },

    // 追加某栋楼的子评论（如“加载更多回复”）
    updateCommentReplies: (topCommentId, newReplies) =>
        set((state) => {
            const updatedComments = state.comments.map(comment => {
                if (comment.id === topCommentId) {
                    return {
                        ...comment,
                        replies: [...(comment.replies || []), ...newReplies], // 修改这里
                    };
                }
                return comment;
            });
            return { comments: updatedComments };
        }),

    // 🔁 对外提供：用最新 comments 覆盖 community 的 commentList
    getFullPost: () => {
        const { community, comments } = get();
        if (!community) return null;
        return {
            ...community,
            commentList: comments, // 👈 关键：总是用最新的 comments
        };
    },

    getTopLimit: () => get().top_limit,
    getRepliesLimit: () => get().replies_limit,

    clearData: () => set({ community: null, comments: [] }),

}));