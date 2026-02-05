
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Heart,
  Share2,
  Sparkles,
  TrendingUp,
  X,
  Camera,
  Image as ImageIcon,
  Send,
  Wand2,
  RefreshCw,
  Search,
  ArrowLeft,
  Smile,
  MoreHorizontal,
  Reply,
  Loader2,
  ArrowDownCircle,
  Crown,
  History,
  ThumbsDown,
  MessageSquare,
  ChevronDown,
  ListFilter,
  Plus
} from 'lucide-react';
import * as backend from '../backend';
import { url_base, View } from '../types';
import { useCommunityStore } from '@/stores/communityStore'; // 👈 新增导入
import { usePostDetailStore } from '@/stores/usePostDetailStore';

interface CommunityViewProps {
  onBack: () => void;
  onNavigate: (view: View, data?: any) => void;
  initialOpenPost?: boolean;
  onModalClose?: () => void;
}

// 🔍 在整个文件顶部，import 下方
const findCommentById = (
  comments: backend.Comment[],
  id: string
): backend.Comment | null => {
  for (const top of comments) {
    if (top.id === id) return top;
    if (top.replies) {
      for (const reply of top.replies) {
        if (reply.id === id) return reply;
      }
    }
  }
  return null;
};

const CommunityView: React.FC<CommunityViewProps> = ({ onBack, onNavigate, initialOpenPost = false, onModalClose }) => {
  const {
    communityList,
    communityTimenode,
    addCommunityList,
    setCommunityTimenode,
    setCommunityList,
    getCommunityList,
    getLimit,
    clearAll,
    getCommunityTimenode,
  } = useCommunityStore();

  const {
    getFullPost,
    setFullPost,
    setComments,
    addComments,
    updateCommentReplies,
    clearData,
    getTopLimit,
    getRepliesLimit,
    getComments,
    getCommentLastCreatedTime,
    getLastReplyTimeByTopId,
  } = usePostDetailStore();
  // 替换原来的 useState
  const initialPosts = useCommunityStore.getState().getCommunityList();
  const [posts, setPosts] = useState<backend.Post[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isBeautifying, setIsBeautifying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImgDataSet, setSelectedImgDataSet] = useState<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 詳情頁狀態
  const [expandedPost, setExpandedPost] = useState<backend.Post | null>(null);
  const [isDetailClosing, setIsDetailClosing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const commentsFromStore = getComments();
  const [isLoadingMore, setIsLoadingMore] = useState(false); // 👈 新增：加载更多状态
  // 控制顶级评论“加载更多”
  const [hasMoreTopComments, setHasMoreTopComments] = useState(true);

  // 評論詳情（二級詳情）狀態
  // const [commentDetailTarget, setCommentDetailTarget] = useState<backend.Comment | null>(null);
  const [commentDetailId, setCommentDetailId] = useState<string | null>(null);
  const [isCommentDetailClosing, setIsCommentDetailClosing] = useState(false);
  const [isLoadingMoreReplies, setIsLoadingMoreReplies] = useState(false);  // 控制子评论“加载更多”的 loading 状态
  const [hasMoreReplies, setHasMoreReplies] = useState(true);// 标记是否还有更多子评论可加载（由 API 响应决定）

  // 回覆功能狀態
  const [replyingTo, setReplyingTo] = useState<{ id: string, author: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const commentInputRef = useRef<HTMLInputElement>(null);

  // 下拉刷新狀態
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  // 上拉刷新状态
  const [hasMore, setHasMore] = useState(true); // 是否还有更多数据可加载
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null); // 滚动到底部的哨兵元素

  // 在组件顶部添加一个ref来标记是否已经加载过
  const hasLoaded = useRef(false);

  // ✅ 根据 commentDetailId 实时查找最新评论对象
  const targetComment = useMemo(() => {
    if (!commentDetailId) return null;
    return findCommentById(commentsFromStore, commentDetailId);
  }, [commentDetailId, commentsFromStore]); // 依赖 store 变化

  useEffect(() => {
    // 重置偏移量以确保从第一页开始加载（可选，根据业务）
    backend.resetCommunityPostsOffset();
    const loadPosts = async () => {
      setIsLoading(true);
      try {
        // 👇 先尝试从 store 中获取已有数据
        // const cachedPosts = getCommunityList();
        // if (cachedPosts.length > 0) {
        //   setPosts(cachedPosts); // 优先使用缓存
        //   console.log('✅ 使用缓存的社区帖子', cachedPosts.length);
        // }
        // 👇 再去拉取最新数据（增量更新）
        let limit = getLimit();
        // 在 useEffect 的 loadPosts 函数中
        const data = await backend.fetchCommunityPostsByTime('older', null, limit);
        if (data.length > 0) {
          // ✅ 设置 older 游标：最后一条（最旧）
          const nextOlderNode = data[data.length - 1].time;
          setCommunityTimenode("older", nextOlderNode);
          // ✅ 设置 newer 游标：第一条（最新）
          const nextNewerNode = data[0].time;
          setCommunityTimenode("newer", nextNewerNode);
        }
        // 去重合并（防止重复）
        const existingPostIds = new Set(posts.map(p => p.id));
        const newPosts = data.filter(post => !existingPostIds.has(post.id));
        // 合并：新帖在前
        const mergedPosts = [...newPosts, ...posts];
        // 更新状态 & store
        setPosts(mergedPosts);
        setCommunityList(mergedPosts); // 👈 存入 store

      } catch (err) {
        console.error('加载社区帖子失败:', err);
      } finally {
        setIsLoading(false);
      }
    };
    // 只在组件首次挂载时加载（避免重复触发）
    if (!hasLoaded.current) {
      loadPosts();
      hasLoaded.current = true;
    }
    if (initialOpenPost) {
      setShowCreateModal(true);
    }
  }, [initialOpenPost]);

  // 底部上拉刷新旧数据
  useEffect(() => {
    if (!hasMore || isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isRefreshing) {
          loadMorePosts();
        }
      },
      { threshold: 1.0 }
    );
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    observerRef.current = observer;
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, isRefreshing]);

  const filteredPosts = useMemo(() => {
    console.log('Filtered posts at:',
      new Date().toLocaleTimeString('zh-CN',
        { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), posts);
    console.log('Filtering posts with searchTerm:', searchTerm);
    if (!searchTerm) {
      console.log('No search term, returning all posts', posts);
      return posts;
    }
    console.log('Applying filter for searchTerm:', searchTerm);
    return posts.filter(post =>
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.userTags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, posts]);

  const hasMoreRef = useRef(hasMore);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  const loadMorePosts = async () => {
    if (!posts.length || !hasMoreRef.current) return; // ✅ 改这里
    // setIsLoading(true);
    try {
      const lastPost = posts[posts.length - 1];
      const limit = getLimit();
      console.log('Loading older posts after:', lastPost.id);
      const olderPosts = await backend.fetchCommunityPostsByTime('older', getCommunityTimenode("older"), limit);
      if (olderPosts.length === 0) {
        setHasMore(false);
        console.log('No more posts to load.');
        return;
      }
      // ✅ 提取最后一条（这批旧数据中最旧的那条）的时间
      const nextTimenode = olderPosts[olderPosts.length - 1].time; // 👈 关键！
      setCommunityTimenode("older", nextTimenode);

      // 去重（理论上不需要，但保险起见）
      const existingIds = new Set(posts.map(p => p.id));
      const uniqueOlder = olderPosts.filter(p => !existingIds.has(p.id));
      if (uniqueOlder.length === 0) {
        setHasMore(false);
        return;
      }
      // const updatedPosts = [...posts, ...uniqueOlder];
      setPosts(posts => [...posts, ...uniqueOlder]);
      addCommunityList("older", uniqueOlder); // 👈 同步到 store
      console.log('Loaded older posts:', uniqueOlder.length);
    } catch (err) {
      console.error('Failed to load more posts:', err);
    } finally {
      // setIsLoading(false);
    }
  };

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

  //顶部下拉刷新
  const handleTouchEnd = async () => {
    if (pullDistance > 50) {
      setIsRefreshing(true);
      setPullDistance(50);
      try {
        console.log('Refreshing posts...');
        const freshPosts = await backend.fetchCommunityPostsByTime("newer", getCommunityTimenode("newer"), getLimit());

        setPosts(prevPosts => {
          if (freshPosts.length > 0) {
            const nextTimenode = freshPosts[freshPosts.length - 1].time;
            setCommunityTimenode("newer", nextTimenode);
          }
          // 使用Set来跟踪已存在的帖子ID，避免重复
          const existingPostIds = new Set(prevPosts.map(post => post.id));
          console.log('Existing post IDs:', existingPostIds);
          // 过滤出新帖子中不存在的帖子
          const newPosts = freshPosts.filter(post => !existingPostIds.has(post.id));
          console.log('New posts fetched:', newPosts);
          // 存储新帖子
          addCommunityList("newer", newPosts);
          // 将新帖子添加到现有帖子前面（通常新帖子排在前面）
          return [...newPosts, ...prevPosts];
        });
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    touchStartY.current = 0;
  };

  const handleLike = async (postId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      console.log('Toggling like for post:', postId);
      const { likes, isLiked } = await backend.toggleLikePost(postId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes, isLiked } : p));
      if (expandedPost && expandedPost.id === postId) {
        setExpandedPost(prev => prev ? { ...prev, likes, isLiked } : null);
      }
    } catch (err) { console.error(err); }
  };

  const handleLikeComment = async (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!expandedPost) return;

    // 👇 1. 乐观更新：立即更新 UI（提升体验）
    const updateStoreComment = (id: string, delta: number) => {
      // 更新 store 中的评论
      const comments = getComments();
      const updateReplies = (replies: backend.Comment[]): backend.Comment[] =>
        replies.map(c =>
          c.id === id
            ? { ...c, likes: c.likes + delta, isLiked: !c.isLiked }
            : { ...c, replies: updateReplies(c.replies || []) }
        );

      const updatedComments = comments.map(c =>
        c.id === id
          ? { ...c, likes: c.likes + delta, isLiked: !c.isLiked }
          : { ...c, replies: updateReplies(c.replies || []) }
      );
      setComments(updatedComments); // 👈 更新 store
    };

    // 👇 先乐观更新（+1 或 -1）
    const targetComment = findCommentById(getComments(), commentId);
    if (targetComment) {
      updateStoreComment(commentId, targetComment.isLiked ? -1 : 1);
    }

    try {
      // 👇 2. 调用后端接口
      const { likes, isLiked } = await backend.toggleLikeComment(expandedPost.id, commentId);

      // 👇 3. 【可选】用后端返回的真实值覆盖（更安全）
      const finalUpdate = (id: string) => {
        const comments = getComments();
        const updateReplies = (replies: backend.Comment[]): backend.Comment[] =>
          replies.map(c =>
            c.id === id ? { ...c, likes, isLiked } : { ...c, replies: updateReplies(c.replies || []) }
          );

        const updatedComments = comments.map(c =>
          c.id === id ? { ...c, likes, isLiked } : { ...c, replies: updateReplies(c.replies || []) }
        );
        setComments(updatedComments);
      };
      finalUpdate(commentId);

      // 同时更新 expandedPost（用于详情页顶部显示）
      setExpandedPost(prev => prev ? ({ ...prev, commentList: getComments() }) : null);

    } catch (err) {
      console.error(err);
      // 👇 4. 如果失败，回滚乐观更新
      if (targetComment) {
        updateStoreComment(commentId, targetComment.isLiked ? 1 : -1);
      }
      alert('操作失败，请重试');
    }
  };

  // 👇 新增：加载更多顶级评论
  const handleLoadMoreTopComments = async () => {
    console.log('开始加载更多顶级评论', {
      expandedPostId: expandedPost?.id,
      isLoadingMore: isLoadingMore,
      hasMoreTopComments: hasMoreTopComments
    });

    if (!expandedPost || isLoadingMore || !hasMoreTopComments) {
      console.log('加载条件不满足，跳过加载');
      return;
    }

    setIsLoadingMore(true);
    try {
      const limit = getTopLimit();
      console.log('调用API获取更多顶级评论，参数:', {
        postId: expandedPost.id,
        cursorTime: getCommentLastCreatedTime(),
        limit: limit,
        topCommentId: null
      });

      const newCommentsResponse = await backend.fetchCommunityComments(
        expandedPost.id,
        getCommentLastCreatedTime(),
        limit,
        null, // topCommentId 为 null 表示加载顶级评论
      );

      // 👇 修改：newCommentsResponse 是数组，直接使用数组进行判断
      const comments = newCommentsResponse || [];
      const hasMore = comments.length > 0; // 如果数组有内容，表示还有更多数据

      console.log('获取到更多顶级评论结果:', {
        commentsCount: comments.length,
        hasMore: hasMore,
        comments: comments
      });

      if (comments.length > 0) {
        addComments(0, comments); // 添加到 store
        console.log('已将新评论添加到store');
      }

      // 更新状态：无论有没有新数据，都以 API 的 has_more 为准
      setHasMoreTopComments(hasMore);
      console.log('更新hasMoreTopComments状态:', hasMore);

    } catch (error) {
      console.error('加载更多评论失败:', error);
      alert('加载失败，请稍后重试');
      setHasMoreTopComments(false); // 出错也视为无更多
    } finally {
      setIsLoadingMore(false);
      console.log('结束加载更多顶级评论，重置loading状态');
    }
  };

  const handleLoadMoreReplies = async () => {
    console.log('开始加载更多回复', {
      commentDetailId: commentDetailId,
      isLoadingMoreReplies: isLoadingMoreReplies,
      hasMoreReplies: hasMoreReplies,
      expandedPostId: expandedPost?.id
    });

    if (!commentDetailId || isLoadingMoreReplies || !hasMoreReplies) {
      console.log('加载回复条件不满足，跳过加载');
      return; // 注意：这里用 commentDetailId
    }

    setIsLoadingMoreReplies(true);
    try {
      const limit = getRepliesLimit();
      const cursorTime = getLastReplyTimeByTopId(commentDetailId);
      console.log('调用API获取更多回复，参数:', {
        postId: expandedPost!.id,
        cursorTime: cursorTime,
        limit: limit,
        topCommentId: commentDetailId
      });

      const newRepliesResponse = await backend.fetchCommunityComments(
        expandedPost!.id,
        cursorTime,
        limit,
        commentDetailId, // 👈 用 ID
      );

      const replies = newRepliesResponse || [];
      const hasMore = replies.length > 0;

      console.log('获取到更多回复结果:', {
        repliesCount: replies.length,
        hasMore: hasMore,
        replies: replies
      });

      if (replies.length > 0) {
        addComments(Number(commentDetailId), replies); // ✅ 只更新 store
        console.log('已将新回复添加到store，父评论ID:', commentDetailId);
        // 不再需要手动 setCommentDetailTarget！
      }

      setHasMoreReplies(hasMore);
      console.log('更新hasMoreReplies状态:', hasMore);
    } catch (error) {
      console.error('加载更多回复失败:', error);
      alert('加载失败，请稍后重试');
      setHasMoreReplies(false);
    } finally {
      setIsLoadingMoreReplies(false);
      console.log('结束加载更多回复，重置loading状态');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !expandedPost) return;
    console.log('开始处理添加评论或回复，当前评论内容:', newComment);

    try {
      // ✅ 使用 targetComment（来自 store）替代已删除的 commentDetailTarget
      const effectiveReplyTarget = replyingTo || (targetComment ?
        { id: targetComment.id, author: targetComment.author } : null);

      if (effectiveReplyTarget) {
        // ====== 查找被回复评论的完整信息（用于确定 rootId）======
        const fullTargetComment = findCommentById(commentsFromStore, effectiveReplyTarget.id);
        if (!fullTargetComment) {
          alert('目标评论未找到');
          return;
        }

        const rootId = fullTargetComment.top_comment_id || fullTargetComment.id;

        console.log('准备添加回复，参数:', {
          postId: expandedPost.id,
          commentId: effectiveReplyTarget.id,
          content: newComment,
          rootId
        });

        const reply = await backend.addReply(
          expandedPost.id,
          effectiveReplyTarget.id,
          newComment,
          rootId
        );

        console.log('后端回复操作完成，返回结果:', reply);
        if (!reply) {
          alert('回复添加失败，请重试');
          return;
        }

        // ✅ 统一使用 addComments 添加子评论
        addComments(effectiveReplyTarget.id, [reply]);

        setReplyingTo(null);
        setNewComment('');
        console.log('回复已成功添加并更新UI');

      } else {
        // ====== 添加顶级评论 ======
        console.log('准备添加顶级评论，参数:', { postId: expandedPost.id, content: newComment });

        const comment = await backend.addComment(expandedPost.id, newComment);
        console.log('后端评论操作完成，返回结果:', comment);
        if (!comment) {
          alert('评论添加失败，请重试');
          return;
        }

        // ✅ 统一使用 addComments 添加顶级评论（parentId = 0）
        addComments(0, [comment]);

        setNewComment('');
        console.log('顶级评论已成功添加并更新UI');
      }

    } catch (err) {
      console.error('处理添加评论时出错:', err);
      alert('添加评论时出现错误，请重试');
    }
  };

  const triggerReply = (commentId: string, author: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReplyingTo({ id: commentId, author });
    commentInputRef.current?.focus();
  };

  const toggleRepliesExpansion = (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCommentDetailId(commentId); // ✅ 只存 ID
    setReplyingTo(null);
    // e.stopPropagation();
    // // 這裡我們修改為彈出底部署
    // const targetComment = expandedPost?.commentList.find(c => c.id === commentId);
    // if (targetComment) {
    //   setCommentDetailTarget(targetComment);
    //   // 進入詳情框後，默認不顯示“正在回覆”，但邏輯上默認回覆主評論人
    //   setReplyingTo(null);
    // }
  };

  const closeDetail = () => {
    setIsDetailClosing(true);
    setTimeout(() => {
      setExpandedPost(null);
      setReplyingTo(null);
      setIsDetailClosing(false);
      // 👇 保留已有的 clearData（清空 store 中的评论数据）
      clearData();
      // 👇 新增：重置两个“加载更多”的 loading 状态
      setIsLoadingMore(false);
      setIsLoadingMoreReplies(false);
      // 可选：也重置 hasMore 状态（避免下次打开显示“无更多”）
      setHasMoreTopComments(true);
      setHasMoreReplies(true);
    }, 300);
  };

  const closeCommentDetail = () => {
    setIsCommentDetailClosing(true);
    setTimeout(() => {
      setCommentDetailId(null); // ✅ 清空 ID
      // setCommentDetailTarget(null);
      setReplyingTo(null);
      setIsCommentDetailClosing(false);
    }, 300);
  };

  const handleBeautify = async () => {
    if (!postContent) return;
    setIsBeautifying(true);
    try {
      const beautified = await backend.beautifyDiary(postContent);
      setPostContent(beautified);
    } finally {
      setIsBeautifying(false);
    }
  };

  const handlePost = async () => {
    if (!postContent && selectedImages.length === 0) return;
    setIsPosting(true);
    try {
      const tagRegex = /#[\w\u4e00-\u9fa5]+/g;
      const tags = postContent.match(tagRegex) || [];
      // 使用支持多圖的後端接口
      const newPost = await backend.createCommunityPostMulti(postContent, selectedImgDataSet, tags);
      console.log('New Post:', newPost);
      if (newPost === null) {
        // 如果返回null，说明上传失败，提示用户但不关闭模态框
        alert('上传失败，请重试');
        return; // 提前返回，不执行后续成功逻辑
      }
      console.log('Creating new post with content:', postContent, 'and images:', selectedImgDataSet);
      // setPosts(prevPosts => [newPost, ...prevPosts]);
      setPosts(prevPosts => {
        let newPosts = [newPost];
        addCommunityList("newer", newPosts);
        return [newPost, ...prevPosts];
      })
      console.log('Updated posts state:', posts);
      // 强制确保状态更新
      console.log('帖子已添加到列表，当前posts长度:', posts.length + 1);

      setShowCreateModal(false);
      setPostContent('');
      setSelectedImages([]);
      setSelectedImgDataSet([]);
      if (onModalClose) onModalClose();
    } catch (err) {
      console.error(err);
      alert('上传过程中发生错误，请重试');
    } finally {
      setIsPosting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // 检查是否有超过10MB的文件
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    const oversizedFiles = files.filter((file): file is File => file instanceof File && file.size > maxSize);

    if (oversizedFiles.length > 0) {
      alert('所选文件不可大于10MB！');
      return;
    }

    if (selectedImages.length + files.length > 9 || selectedImgDataSet.length + files.length > 9) {
      alert('抱歉，每次最多只能上傳 9 個文件喔！🐾');
      return;
    }
    // 类型检查确保files数组中的每个元素都是File类型
    const validFiles = files.filter((file): file is File => file instanceof File);
    console.log('Selected files:', validFiles);
    // 保存原始文件对象用于上传
    setSelectedImgDataSet(prev => [...prev, ...validFiles]);
    console.log('Updated selectedImgDataSet:', selectedImgDataSet);
    // 生成预览URL用于界面显示
    const newPreviewUrls = validFiles.map(file => {
      // 对于视频文件，使用URL.createObjectURL生成预览
      if (file.type.startsWith('video/')) {
        return URL.createObjectURL(file);
      }
      // 对于图片文件，也使用URL.createObjectURL生成预览
      return URL.createObjectURL(file);
    });
    setSelectedImages(prev => [...prev, ...newPreviewUrls]);
    // 清除 input 值，確保可以重複選擇相同文件
    e.target.value = '';
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const LevelBadge = ({ level = 3 }: { level?: number }) => {
    const colors = [
      'bg-gray-300', // LV0
      'bg-gray-400', // LV1
      'bg-gray-500', // LV2
      'bg-blue-400', // LV3
      'bg-blue-500', // LV4
      'bg-orange-500', // LV5
      'bg-rose-500',  // LV6
    ];
    const color = colors[level] || colors[0];
    return (
      <span className={`${color} text-white text-[7px] font-black italic px-0.5 rounded-[2px] ml-1 flex items-center justify-center min-w-[20px] h-[11px] uppercase`}>
        LV{level}
      </span>
    );
  };


  const ImageGrid: React.FC<{ images: string[], onImageClick: (url: string) => void, isDetail?: boolean }> = ({ images, onImageClick, isDetail = false }) => {
    if (!images || images.length === 0) return null;

    if (isDetail) {
      const gridCols = images.length === 1 ? 'grid-cols-1' : images.length === 2 || images.length === 4 ? 'grid-cols-2' : 'grid-cols-3';
      return (
        <div className={`grid ${gridCols} gap-1.5 mt-3 pr-4`}>
          {images.map((img, idx) => (
            <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-gray-100 dark:border-white/5" onClick={(e) => { e.stopPropagation(); onImageClick(img); }}>
              {img.match(/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i) ? (  // 检查是否为视频文件
                <div className="relative w-full h-full">
                  <video
                    src={`${url_base}${img}`}
                    className="w-full h-full object-cover cursor-zoom-in active:scale-95 transition-transform"
                    controls={false}
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center opacity-80">
                      <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <img src={`${url_base}${img}`} className="w-full h-full object-cover cursor-zoom-in active:scale-95 transition-transform" alt={`post-grid-${idx}`} />
              )}
            </div>
          ))}
        </div>
      );
    }
    const displayCount = Math.min(images.length, 3);
    const visibleImages = images.slice(0, displayCount);
    const hasMore = images.length > displayCount;
    const gridCols = displayCount === 1 ? 'grid-cols-1' : displayCount === 2 ? 'grid-cols-2' : 'grid-cols-3';
    return (
      <div className={`grid ${gridCols} gap-1.5 mt-3 pr-4`}>
        {visibleImages.map((img, idx) => {
          const isLast = idx === displayCount - 1 && hasMore;
          return (
            <div
              key={idx}
              className="aspect-square rounded-lg overflow-hidden border border-gray-100 dark:border-white/5 relative group active:scale-95 transition-transform"
              onClick={(e) => { e.stopPropagation(); onImageClick(`${url_base}${img}`); }}
            >
              {img.match(/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i) ? (  // 检查是否为视频文件
                <div className="relative w-full h-full">
                  <video
                    src={`${url_base}${img}`}
                    className="w-full h-full object-cover"
                    controls={false}
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <img src={`${url_base}${img}`} className="w-full h-full object-cover" alt={`post-grid-${idx}`} />
              )}
              {isLast && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                  <span className="font-black text-lg tracking-tighter">+{images.length - displayCount + 1}</span>
                  <span className="text-[8px] font-black uppercase opacity-60">More</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };


  const CommentItem: React.FC<{ comment: backend.Comment, isReply?: boolean }> = ({ comment, isReply = false }) => {
    // 只有根評論且當前不在評論詳情抽屜中時，才顯示“共x條回覆”按鈕
    // const showRepliesLink = !isReply && !commentDetailTarget && comment.replies && comment.replies.length > 0;
    const showRepliesLink = !isReply && !commentDetailId && comment.replies && comment.replies.length > 0;
    return (
      <div className={`flex space-x-3 group ${isReply ? 'mb-6' : 'mb-8'}`}>
        <div className="flex-shrink-0">
          <img src={`${url_base}${comment.avatar}`} className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover`} alt="avatar" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-1">
            <span className={`font-bold ${isReply ? 'text-xs text-gray-500' : 'text-sm text-gray-800 dark:text-white'}`}>
              {comment.author}
            </span>
            <LevelBadge level={comment.vipLevel === 'SVIP' ? 6 : (comment.isVIP ? 5 : 3)} />
          </div>
          <div className="space-y-1.5">
            <p className={`${isReply ? 'text-xs' : 'text-[13.5px]'} text-gray-700 dark:text-slate-200 leading-relaxed font-medium`}>
              {comment.replyToName && (
                <span className="text-blue-500 mr-1">回复 @{comment.replyToName}:{comment.replyToContent}</span>
              )}
              {comment.content}
            </p>
            <div className="flex items-center space-x-4 text-[10px] text-gray-400 font-bold tracking-tight">
              <span>{comment.time}</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={(e) => handleLikeComment(comment.id, e)}
                  className={`flex items-center space-x-0.5 transition-all active:scale-125 ${comment.isLiked ? 'text-rose-500' : ''}`}
                >
                  <Heart size={14} fill={comment.isLiked ? "currentColor" : "none"} strokeWidth={comment.isLiked ? 0 : 2.5} />
                  <span>{comment.likes || 0}</span>
                </button>
                <button className="p-1 hover:text-orange-500 transition-colors">
                  <ThumbsDown size={14} />
                </button>
                <button
                  onClick={(e) => triggerReply(comment.id, comment.author, e)}
                  className="hover:text-blue-500 transition-colors"
                >
                  回复
                </button>
              </div>
            </div>
          </div>

          {showRepliesLink && (
            <div
              onClick={(e) => toggleRepliesExpansion(comment.id, e)}
              className="mt-3 text-[11px] font-black text-gray-400 transition-colors cursor-pointer flex items-center bg-gray-50/40 dark:bg-slate-800/20 px-2 py-1.5 rounded-lg w-fit"
            >
              共 {comment.replies?.length} 條回覆，點擊查看
            </div>
          )}
        </div>
      </div>
    );
  };

  const CommentTeaser: React.FC<{ post: backend.Post }> = ({ post }) => {
    if (!post.commentList || post.commentList.length === 0) return null;
    const teaserItems = post.commentList.slice(0, 2);

    return (
      <div className="mt-4 bg-gray-50/50 dark:bg-slate-800/30 rounded-2xl p-3 border border-gray-100 dark:border-white/5 space-y-2.5">
        {teaserItems.map((c, idx) => (
          <div key={idx} className="flex space-x-2.5 items-start">
            <img src={`${url_base}${c.avatar}`} className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5" alt="teaser-av" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center mb-0.5">
                <span className="text-[11px] font-black text-gray-800 dark:text-white truncate max-w-[80px]">{c.author}</span>
                <LevelBadge level={c.vipLevel === 'SVIP' ? 6 : (c.isVIP ? 5 : 3)} />
              </div>
              <p className="text-[11px] text-gray-600 dark:text-slate-300 font-medium line-clamp-1">{c.content}</p>
            </div>
          </div>
        ))}
        {post.comments > 2 && (
          <div onClick={async (e) => {
            e.stopPropagation();
            try {
              const fullPost = await backend.fetchCommunityPostDetail(
                post.id,
                getTopLimit(),
                getRepliesLimit()
              );
              setFullPost(fullPost);
              setExpandedPost(fullPost);
            } catch (error) {
              console.error("加载完整帖子失败:", error);
              alert("加载评论详情失败，请稍后再试");
            }
          }}
            className="pt-2 border-t border-gray-200/30 text-[10px] font-black text-gray-400 transition-colors cursor-pointer flex items-center"
          >
            共 {post.comments} 條回覆，點擊查看信息
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <div className="h-16"></div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/*"  // 修改：添加视频支持
        multiple
        className="hidden"
      />

      <div className="max-w-md mx-auto w-full flex-1 flex flex-col overflow-hidden">
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
          <div className="p-4 pb-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">萌寵社群</h2>
              <button
                onClick={() => onNavigate(View.COMMUNITY_HISTORY)}
                className="w-8 h-8 glass rounded-lg flex items-center justify-center text-gray-500 dark:text-slate-300 active:scale-90 transition-transform"
              >
                <History size={18} />
              </button>
            </div>
            <div className="relative group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="搜尋話題、動態..." className="w-full bg-gray-100 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:ring-1 focus:ring-orange-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex space-x-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
            {['全部', '🔥 熱門', '# 飲食', '# 健康', '# 趣味'].map((tag, i) => (<button key={i} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black transition-all ${i === 0 ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}>{tag}</button>))}
          </div>
        </div>
        <div
          ref={scrollContainerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex-1 overflow-y-auto pb-32 relative scroll-smooth"
        >
          <div
            className="flex items-center justify-center overflow-hidden transition-all duration-200 bg-gray-50/50 dark:bg-slate-900/50"
            style={{ height: pullDistance + 'px' }}
          >
            <div className="flex flex-col items-center space-y-1">
              {isRefreshing ? (
                <RefreshCw className="animate-spin text-orange-500" size={18} />
              ) : (
                <ArrowDownCircle className={`text-gray-400 transition-transform ${pullDistance > 50 ? 'rotate-180 text-orange-400' : ''}`} size={18} />
              )}
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {isRefreshing ? '正在同步數據' : (pullDistance > 50 ? '放手開始刷新' : '下拉獲取最新內容')}
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 opacity-40">
              <Loader2 className="animate-spin text-orange-500" size={32} />
              <p className="text-xs font-black">正在連結寵友圈...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-slate-900">
              {filteredPosts.map(post => (
                //   <div key={post.id} onClick={() => setExpandedPost(post)} className="p-4 flex space-x-3 cursor-pointer active:bg-gray-50 dark:active:bg-slate-800 transition-colors"> 
                < div
                  key={post.id}
                  onClick={async () => {
                    // ✅ 新增：加载完整帖子数据
                    try {
                      const fullPost = await backend.fetchCommunityPostDetail(post.id, getTopLimit(), getRepliesLimit()); // ← 关键！
                      setFullPost(fullPost); // ← 先把这个帖子储存起来
                      setExpandedPost(fullPost);
                    } catch (error) {
                      console.error('加载完整帖子失败:', error);
                      alert('无法加载帖子详情，请稍后重试');
                    }
                  }} className="p-4 flex space-x-3 cursor-pointer active:bg-gray-50 dark:active:bg-slate-800 transition-colors">
                  <div className="flex-shrink-0"><img src={`${url_base}${post.avatar}`} className="w-12 h-12 rounded-xl object-cover border border-gray-100 dark:border-white/10" alt="avatar" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-black text-sm text-gray-900 dark:text-white truncate">{post.author}</span>
                        <LevelBadge level={post.vipLevel === 'SVIP' ? 6 : (post.isVIP ? 5 : 3)} />
                        {post.isV && <TrendingUp size={10} className="text-yellow-500" />}
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">{post.time}</span>
                    </div>
                    <div className="mt-1 space-y-2">
                      <p className="text-sm text-gray-700 dark:text-slate-200 leading-relaxed font-medium line-clamp-3">{post.content}</p>

                      {post.userTags && post.userTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {post.userTags.map((tag, i) => (
                            <span
                              key={i}
                              onClick={(e) => { e.stopPropagation(); setSearchTerm(tag); }}
                              className="text-xs font-black text-blue-500 hover:opacity-70 transition-opacity"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <ImageGrid images={post.images} onImageClick={(url) => setViewingImage(url)} isDetail={false} />

                      {/* 評論預覽 ( feed card ) */}
                      <CommentTeaser post={post} />
                    </div>
                    <div className="flex items-center space-x-8 mt-4">
                      <button className="flex items-center space-x-1 text-gray-400 hover:text-orange-500"><Share2 size={16} /><span className="text-[10px] font-black">分享</span></button>
                      <button className="flex items-center space-x-1 text-gray-400 hover:text-blue-500"><MessageCircle size={16} /><span className="text-[10px] font-black">{post.comments}</span></button>
                      <button
                        onClick={(e) => handleLike(post.id, e)}
                        className={`flex items-center space-x-1 transition-all active:scale-125 ${post.isLiked ? 'text-rose-500' : 'text-gray-400'}`}
                      >
                        <Heart size={16} fill={post.isLiked ? "currentColor" : "none"} strokeWidth={post.isLiked ? 0 : 2} />
                        <span className="text-[10px] font-black">{post.likes}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* 👇 上拉加载哨兵 */}
              {!isLoading && hasMore && <div ref={sentinelRef} className="h-px" />}
              {/* 加载中指示器 */}
              {isLoading && !isRefreshing && (
                <div className="py-6 flex justify-center">
                  <Loader2 className="animate-spin text-orange-500" size={20} />
                </div>
              )}
              {/* 没有更多内容提示 */}
              {/* {!hasMore && !isLoading && (
                <div className="py-4 text-center text-gray-500 text-sm">
                  没有更多内容了
                </div>
              )} */}
            </div>
          )}
        </div>
      </div>

      {
        expandedPost && (
          <div className={`fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-950 overflow-hidden ${isDetailClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
            <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
              <button onClick={closeDetail} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-white active:scale-90"><ArrowLeft size={20} /></button>
              <h3 className="font-black text-sm">動態詳情</h3>
              <button className="w-10 h-10 flex items-center justify-center text-gray-400"><MoreHorizontal size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
              <div className="p-4 flex items-center space-x-3">
                <img src={`${url_base}${expandedPost.avatar}`} className="w-11 h-11 rounded-full object-cover border border-gray-50 dark:border-white/10 shadow-sm" alt="avatar" />
                <div>
                  <div className="flex items-center">
                    <p className="font-black text-sm dark:text-white">{expandedPost.author}</p>
                    <LevelBadge level={expandedPost.vipLevel === 'SVIP' ? 6 : (expandedPost.isVIP ? 5 : 3)} />
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{expandedPost.time} 發布</p>
                </div>
              </div>

              <div className="px-4 space-y-4">
                <div className="text-[15px] text-gray-800 dark:text-slate-100 leading-relaxed font-medium whitespace-pre-wrap">
                  {expandedPost.fullContent}

                  {expandedPost.userTags && expandedPost.userTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {expandedPost.userTags.map((tag, i) => (
                        <span key={i} className="text-sm font-black text-blue-500">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <ImageGrid images={expandedPost.images} onImageClick={(url) => setViewingImage(url)} isDetail={true} />

                <div className="flex items-center space-x-10 py-5 border-y border-gray-100 dark:border-white/5">
                  <button
                    onClick={(e) => handleLike(expandedPost.id, e as any)}
                    className={`flex items-center space-x-2 font-black transition-all active:scale-110 ${expandedPost.isLiked ? 'text-rose-500' : 'text-gray-400'}`}
                  >
                    <Heart size={22} fill={expandedPost.isLiked ? "currentColor" : "none"} strokeWidth={expandedPost.isLiked ? 0 : 2} />
                    <span className="text-xs">{expandedPost.likes} 點讚</span>
                  </button>
                  <button className="flex items-center space-x-2 text-blue-500 font-black">
                    <MessageCircle size={22} />
                    <span className="text-xs">{expandedPost.comments} 評論</span>
                  </button>
                </div>

                <div className="space-y-4 mt-4 pb-12">
                  <h4 className="font-black text-gray-400 text-[10px] uppercase tracking-widest px-1">全部評論 ({expandedPost.comments})</h4>
                  {/* <div className="space-y-2">
                    {expandedPost.commentList.map(comment => (
                      <CommentItem key={comment.id} comment={comment} />
                    ))}
                  </div> */}
                  {/* 评论列表 */}

                  {commentsFromStore.length > 0 ? (
                    <div className="space-y-2">
                      {commentsFromStore.map(comment => (
                        <CommentItem key={comment.id} comment={comment} />
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <p className="text-gray-400 text-sm">暫無評論</p>
                    </div>
                  )}
                  {/* 加载更多 / 无更多提示 */}
                  {/* 顶级评论 - 加载更多 / 无更多提示 */}
                  {commentsFromStore.length > 0 ? (
                    <>
                      {hasMoreTopComments ? (
                        <button
                          onClick={handleLoadMoreTopComments}
                          disabled={isLoadingMore}
                          className={`w-full h-12 rounded-2xl font-black text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm ${isLoadingMore
                            ? 'bg-white/50 dark:bg-slate-800/30 text-blue-400 cursor-not-allowed'
                            : 'bg-white/95 dark:bg-slate-900/95 text-blue-600 hover:text-blue-700 active:scale-95 shadow-none dark:shadow-none backdrop-blur-md'
                            }`}
                        >
                          {isLoadingMore ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              <span>加載中...</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown size={16} />
                              <span>加載更多評論</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <p className="text-center text-blue-400 text-[10px] font-black uppercase tracking-widest py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
                          暫無更多評論
                        </p>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-100 dark:border-white/5 p-4 safe-bottom flex flex-col z-[110]">
              {replyingTo && (
                <div className="flex items-center justify-between bg-orange-50/50 dark:bg-orange-500/10 px-3 py-1.5 rounded-t-xl border-x border-t border-orange-100 dark:border-white/5 animate-in slide-in-from-bottom-2">
                  <span className="text-[10px] font-black text-orange-600 flex items-center">
                    <Reply size={12} className="mr-1" />
                    正在回覆 @{replyingTo.author}
                  </span>
                  <button onClick={() => setReplyingTo(null)} className="text-gray-400 p-1"><X size={12} /></button>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <div className={`flex-1 flex items-center bg-gray-100 dark:bg-slate-800/80 rounded-2xl px-4 py-2 border border-gray-200/50 dark:border-white/5 ${replyingTo ? 'rounded-tl-none' : ''}`}>
                  <Smile size={20} className="text-gray-400 mr-2" />
                  <input
                    ref={commentInputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyingTo ? `回覆給 @${replyingTo.author}...` : "說點溫馨的話吧..."}
                    className="bg-transparent w-full text-xs font-bold focus:outline-none py-2 dark:text-white"
                  />
                </div>
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${newComment.trim() ? 'bg-orange-500 text-white shadow-lg active:scale-95' : 'bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-slate-600 shadow-inner'}`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* 評論詳情框 (仿B站底部署) */}
      {targetComment && (
        <div className={`fixed inset-0 z-[160] flex flex-col items-center justify-end ${isCommentDetailClosing ? 'pointer-events-none' : ''}`}>
          <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isCommentDetailClosing ? 'opacity-0' : 'opacity-100'}`} onClick={() => setCommentDetailId(null)} />

          <div className={`relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[20px] flex flex-col max-h-[85vh] transition-transform duration-300 shadow-2xl ${isCommentDetailClosing ? 'translate-y-full' : 'translate-y-0'}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5">
              <span className="font-black text-gray-800 dark:text-white">評論詳情</span>
              <button onClick={() => setCommentDetailId(null)} className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {/* 被回覆的原評論 */}
              <div className="p-5">
                <CommentItem comment={targetComment} isReply={false} />
              </div>

              <div className="h-2 bg-gray-100 dark:bg-slate-800/50 w-full" />

              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-sm font-black text-gray-800 dark:text-white">
                  相關回覆共{targetComment.replies?.length || 0}條
                </span>
                <div className="flex items-center space-x-1 text-xs font-bold text-gray-400 hover:text-orange-500 cursor-pointer transition-colors">
                  <span>按時間</span>
                  <ListFilter size={14} />
                </div>
              </div>

              <div className="px-5 pb-24">
                {targetComment.replies && targetComment.replies.length > 0 ? (
                  <>
                    {targetComment.replies.map((reply) => (
                      <CommentItem key={reply.id} comment={reply} isReply={true} />
                    ))}

                    {hasMoreReplies ? (
                      <button onClick={handleLoadMoreReplies} disabled={isLoadingMoreReplies}
                        className={`w-full h-10 mt-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center space-x-1.5 ${isLoadingMoreReplies ? 'bg-white/50 dark:bg-slate-800/30 text-blue-400 cursor-not-allowed' : 'bg-white/95 dark:bg-slate-900/95 text-blue-600 hover:text-blue-700 active:scale-95 shadow-none dark:shadow-none backdrop-blur-md'}`} >
                        {isLoadingMoreReplies ? (<> <Loader2 size={16} className="animate-spin" /> <span>加載中...</span> </>) : (<> <ChevronDown size={16} /> <span>加載更多回覆</span> </>)}
                      </button>
                    ) : (
                      <p className="text-center text-blue-400 text-[10px] font-black uppercase tracking-widest py-3 mt-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
                        暫無更多回覆
                      </p>
                    )}
                  </>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center space-y-2 opacity-40">
                    <MessageSquare size={32} className="text-blue-400" />
                    <p className="text-xs font-black text-blue-500">暫無相關回覆</p>
                  </div>
                )}
              </div>
            </div>

            {/* 底部輸入框 */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-100 dark:border-white/5 p-4 safe-bottom flex flex-col z-[170]">
              {replyingTo && (
                <div className="flex items-center justify-between bg-orange-50/50 dark:bg-orange-500/10 px-3 py-1.5 rounded-t-xl border-x border-t border-orange-100 dark:border-white/5 animate-in slide-in-from-bottom-2">
                  <span className="text-[10px] font-black text-orange-600 flex items-center">
                    <Reply size={12} className="mr-1" /> 正在回覆 @{replyingTo.author}
                  </span>
                  <button onClick={() => setReplyingTo(null)} className="text-gray-400 p-1"><X size={12} /></button>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <div className={`flex-1 flex items-center bg-gray-100 dark:bg-slate-800/80 rounded-2xl px-4 py-2 border border-gray-200/50 dark:border-white/5 ${replyingTo ? 'rounded-tl-none' : ''}`}>
                  <Smile size={20} className="text-gray-400 mr-2" />
                  <input
                    ref={commentInputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyingTo ? `回覆給 @${replyingTo.author}...` : (targetComment ? `回覆給 @${targetComment.author}...` : "說點溫馨的話吧...")}
                    className="bg-transparent w-full text-xs font-bold focus:outline-none py-2 dark:text-white"
                  />
                </div>
                <button onClick={handleAddComment} disabled={!newComment.trim()}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${newComment.trim() ? 'bg-orange-500 text-white shadow-lg active:scale-95' : 'bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-slate-600 shadow-inner'}`} >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {
        viewingImage && (
          <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center animate-fade-in" onClick={() => setViewingImage(null)}>
            <button className="absolute top-8 right-6 text-white w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full"><X size={24} /></button>
            {viewingImage.match(/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i) ? (  // 检查是否为视频文件
              <video
                src={viewingImage}
                className="max-w-full max-h-full object-contain animate-zoom-in"
                controls
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img src={`${url_base}${viewingImage}`} className="max-w-full max-h-full object-contain animate-zoom-in" alt="Fullscreen View" />
            )}
          </div>
        )
      }

      {
        showCreateModal && (
          <div className="fixed inset-0 z-[110] flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => { setShowCreateModal(false); if (onModalClose) onModalClose(); }} />
            <div className="relative max-w-md mx-auto w-full bg-white dark:bg-slate-900 rounded-t-[32px] p-6 space-y-6 shadow-2xl animate-slide-up pb-12 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center"><div className="flex items-center space-x-3"><div className="w-9 h-9 bg-orange-500 text-white rounded-xl flex items-center justify-center"><Send size={18} /></div><h3 className="text-lg font-black dark:text-white">發布新動態</h3></div><button onClick={() => { setShowCreateModal(false); if (onModalClose) onModalClose(); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-400"><X size={20} /></button></div>
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="這一刻想說點什麼呢... (支持使用 #標籤)"
                    rows={4}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-white/5 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-orange-500/50 resize-none dark:text-white"
                  />
                  <button onClick={handleBeautify} disabled={!postContent || isBeautifying} className="absolute bottom-3 right-3 bg-indigo-500 text-white px-3 py-2 rounded-xl shadow-lg disabled:opacity-30 active:scale-95 transition-all flex items-center space-x-2">
                    {isBeautifying ? <RefreshCw className="animate-spin" size={12} /> : <Wand2 size={12} />}
                    <span className="text-[10px] font-black uppercase tracking-tight">AI 美化</span>
                  </button>
                </div>

                {/* 圖片上傳預覽區域 */}
                <div className="grid grid-cols-3 gap-2">
                  {selectedImages.map((img, i) => {
                    // 检查对应的原始文件是否为视频
                    const correspondingFile = selectedImgDataSet[i];
                    const isVideo = correspondingFile && correspondingFile.type.startsWith('video/');
                    return (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 group">
                        {isVideo ? (  // 使用原始文件类型判断是否为视频
                          <video
                            src={img}
                            className="w-full h-full object-cover"
                            controls={false}
                            muted
                          />
                        ) : (
                          <img src={img} className="w-full h-full object-cover" alt="Preview" />
                        )}
                        <button
                          onClick={() => removeSelectedImage(i)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}

                  {selectedImages.length < 9 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-2xl bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-gray-400 hover:text-orange-500 hover:border-orange-200 transition-all active:scale-95"
                    >
                      <Plus size={24} />
                      <span className="text-[9px] font-black mt-1 uppercase">{selectedImages.length}/9</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-500 hover:text-orange-500 transition-colors border border-gray-100 dark:border-white/5">
                    <Camera size={22} />
                  </button>
                  <button
                    onClick={handlePost}
                    disabled={isPosting || (postContent.trim() === '' && selectedImages.length === 0)}
                    className="flex-1 h-12 bg-orange-500 text-white rounded-xl font-black shadow-xl shadow-orange-300 dark:shadow-none flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-95 transition-transform"
                  >
                    {isPosting ? <RefreshCw className="animate-spin" size={18} /> : <><Send size={18} /><span>發布到社群</span></>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default CommunityView;
