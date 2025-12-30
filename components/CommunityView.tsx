
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
  ListFilter
} from 'lucide-react';
import * as backend from '../backend';
import { View } from '../types';

interface CommunityViewProps {
  onBack: () => void;
  onNavigate: (view: View, data?: any) => void;
  initialOpenPost?: boolean;
  onModalClose?: () => void;
}

const CommunityView: React.FC<CommunityViewProps> = ({ onBack, onNavigate, initialOpenPost = false, onModalClose }) => {
  const [posts, setPosts] = useState<backend.Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isBeautifying, setIsBeautifying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 詳情頁狀態
  const [expandedPost, setExpandedPost] = useState<backend.Post | null>(null);
  const [isDetailClosing, setIsDetailClosing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // 評論詳情（二級詳情）狀態
  const [commentDetailTarget, setCommentDetailTarget] = useState<backend.Comment | null>(null);
  const [isCommentDetailClosing, setIsCommentDetailClosing] = useState(false);

  // 回覆功能狀態
  const [replyingTo, setReplyingTo] = useState<{ id: string, author: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const commentInputRef = useRef<HTMLInputElement>(null);

  // 下拉刷新狀態
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      try {
        const data = await backend.fetchCommunityPosts();
        setPosts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadPosts();
    if (initialOpenPost) {
      setShowCreateModal(true);
    }
  }, [initialOpenPost]);

  const filteredPosts = useMemo(() => {
    if (!searchTerm) return posts;
    return posts.filter(post => 
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
      post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.userTags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, posts]);

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

  const handleTouchEnd = async () => {
    if (pullDistance > 50) {
      setIsRefreshing(true);
      setPullDistance(50);
      try {
        const freshPosts = await backend.fetchCommunityPosts();
        setPosts(freshPosts);
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
    try {
      const { likes, isLiked } = await backend.toggleLikeComment(expandedPost.id, commentId);
      
      const updateCommentInList = (list: backend.Comment[]): backend.Comment[] => {
        return list.map(c => {
          if (c.id === commentId) return { ...c, likes, isLiked };
          if (c.replies) return { ...c, replies: updateCommentInList(c.replies) };
          return c;
        });
      };

      const updatedCommentList = updateCommentInList(expandedPost.commentList);
      
      // 更新 expandedPost
      const newExpanded = { ...expandedPost, commentList: updatedCommentList };
      setExpandedPost(newExpanded);
      
      // 同時更新 commentDetailTarget 如果它正在開啟中
      if (commentDetailTarget) {
         if (commentDetailTarget.id === commentId) {
            setCommentDetailTarget({ ...commentDetailTarget, likes, isLiked });
         } else if (commentDetailTarget.replies) {
            setCommentDetailTarget({ 
               ...commentDetailTarget, 
               replies: updateCommentInList(commentDetailTarget.replies) 
            });
         }
      }

      setPosts(prev => prev.map(p => p.id === expandedPost.id ? { ...p, commentList: updatedCommentList } : p));
    } catch (err) { console.error(err); }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !expandedPost) return;
    try {
      // 核心邏輯：如果詳情框開著，默認就是對該詳情主體的回覆（除非已經指定了特定的子回覆對象）
      const effectiveReplyTarget = replyingTo || (commentDetailTarget ? { id: commentDetailTarget.id, author: commentDetailTarget.author } : null);

      if (effectiveReplyTarget) {
        const reply = await backend.addReply(expandedPost.id, effectiveReplyTarget.id, newComment);
        if (!reply) return;
        
        const injectReplyFlattened = (list: backend.Comment[]): backend.Comment[] => {
          return list.map(c => {
            if (c.id === effectiveReplyTarget.id || c.replies?.some(r => r.id === effectiveReplyTarget.id)) {
              return { ...c, replies: [...(c.replies || []), reply] };
            }
            return c;
          });
        };

        const updatedList = injectReplyFlattened(expandedPost.commentList);
        const newExpanded = { 
          ...expandedPost, 
          commentList: updatedList, 
          comments: expandedPost.comments + 1 
        };
        setExpandedPost(newExpanded);
        
        // 更新評論詳情抽屜
        if (commentDetailTarget) {
            // 注意：這裡需要找到根評論更新詳情框，因為 reply 始終掛載在根評論的 replies 下
            if (commentDetailTarget.id === effectiveReplyTarget.id || commentDetailTarget.replies?.some(r => r.id === effectiveReplyTarget.id)) {
                setCommentDetailTarget({ ...commentDetailTarget, replies: [...(commentDetailTarget.replies || []), reply] });
            }
        }

        setPosts(prev => prev.map(p => p.id === expandedPost.id ? newExpanded : p));
        setReplyingTo(null);
      } else {
        const comment = await backend.addComment(expandedPost.id, newComment);
        const newExpanded = { 
          ...expandedPost, 
          commentList: [comment, ...expandedPost.commentList], 
          comments: expandedPost.comments + 1 
        };
        setExpandedPost(newExpanded);
        setPosts(prev => prev.map(p => p.id === expandedPost.id ? newExpanded : p));
      }
      setNewComment('');
    } catch (err) { console.error(err); }
  };

  const triggerReply = (commentId: string, author: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReplyingTo({ id: commentId, author });
    commentInputRef.current?.focus();
  };

  const toggleRepliesExpansion = (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // 這裡我們修改為彈出底部署
    const targetComment = expandedPost?.commentList.find(c => c.id === commentId);
    if (targetComment) {
        setCommentDetailTarget(targetComment);
        // 進入詳情框後，默認不顯示“正在回覆”，但邏輯上默認回覆主評論人
        setReplyingTo(null);
    }
  };

  const closeDetail = () => {
    setIsDetailClosing(true);
    setTimeout(() => {
      setExpandedPost(null);
      setReplyingTo(null);
      setIsDetailClosing(false);
    }, 300);
  };

  const closeCommentDetail = () => {
      setIsCommentDetailClosing(true);
      setTimeout(() => {
          setCommentDetailTarget(null);
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
    if (!postContent && !selectedImage) return;
    setIsPosting(true);
    try {
      const tagRegex = /#[\w\u4e00-\u9fa5]+/g;
      const tags = postContent.match(tagRegex) || [];
      const newPost = await backend.createCommunityPost(postContent, selectedImage, tags);
      setPosts(prev => [newPost, ...prev]);
      setShowCreateModal(false);
      setPostContent('');
      setSelectedImage(null);
      if (onModalClose) onModalClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleFileSelect = () => {
    const mockImages = ['https://picsum.photos/seed/community1/600/400', 'https://picsum.photos/seed/community2/600/400'];
    setSelectedImage(mockImages[Math.floor(Math.random() * mockImages.length)]);
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
              <img src={img} className="w-full h-full object-cover cursor-zoom-in active:scale-95 transition-transform" alt={`post-grid-${idx}`} />
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
              onClick={(e) => { e.stopPropagation(); onImageClick(img); }}
            >
              <img src={img} className="w-full h-full object-cover" alt={`post-grid-${idx}`} />
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
    const showRepliesLink = !isReply && !commentDetailTarget && comment.replies && comment.replies.length > 0;
    
    return (
      <div className={`flex space-x-3 group ${isReply ? 'mb-6' : 'mb-8'}`}>
        <div className="flex-shrink-0">
          <img src={comment.avatar} className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover`} alt="avatar" />
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
                <span className="text-blue-500 mr-1">回复 @{comment.replyToName}</span>
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
              className="mt-3 text-[11px] font-black text-gray-400 hover:text-orange-500 transition-colors cursor-pointer flex items-center bg-gray-50/40 dark:bg-slate-800/20 px-2 py-1.5 rounded-lg w-fit"
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
            <img src={c.avatar} className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5" alt="teaser-av" />
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
          <div 
            onClick={(e) => { e.stopPropagation(); setExpandedPost(post); }}
            className="pt-2 border-t border-gray-200/30 text-[10px] font-black text-gray-400 hover:text-orange-500 transition-colors cursor-pointer flex items-center"
          >
            共 {post.comments} 條回覆，點擊查看信息
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
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
                <div key={post.id} onClick={() => setExpandedPost(post)} className="p-4 flex space-x-3 cursor-pointer active:bg-gray-50 dark:active:bg-slate-800 transition-colors">
                  <div className="flex-shrink-0"><img src={post.avatar} className="w-12 h-12 rounded-xl object-cover border border-gray-100 dark:border-white/10" alt="avatar" /></div>
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
            </div>
          )}
        </div>
      </div>

      {expandedPost && (
        <div className={`fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-950 overflow-hidden ${isDetailClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
          <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
            <button onClick={closeDetail} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-white active:scale-90"><ArrowLeft size={20} /></button>
            <h3 className="font-black text-sm">動態詳情</h3>
            <button className="w-10 h-10 flex items-center justify-center text-gray-400"><MoreHorizontal size={20} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
            <div className="p-4 flex items-center space-x-3">
              <img src={expandedPost.avatar} className="w-11 h-11 rounded-full object-cover border border-gray-50 dark:border-white/10 shadow-sm" alt="avatar" />
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
                <div className="space-y-2">
                  {expandedPost.commentList.map(comment => (
                    <CommentItem key={comment.id} comment={comment} />
                  ))}
                </div>
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
      )}

      {/* 評論詳情框 (仿B站底部署) */}
      {commentDetailTarget && (
        <div className={`fixed inset-0 z-[160] flex flex-col items-center justify-end ${isCommentDetailClosing ? 'pointer-events-none' : ''}`}>
            {/* 黑色半透明背景遮罩 */}
            <div 
                className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isCommentDetailClosing ? 'opacity-0' : 'opacity-100'}`} 
                onClick={closeCommentDetail}
            />
            
            {/* 從底部彈出的內容區 */}
            <div className={`relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[20px] flex flex-col max-h-[85vh] transition-transform duration-300 shadow-2xl ${isCommentDetailClosing ? 'translate-y-full' : 'translate-y-0'}`}>
                {/* 抽屜頭部 */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5">
                    <span className="font-black text-gray-800 dark:text-white">評論詳情</span>
                    <button onClick={closeCommentDetail} className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {/* 被回覆的原評論 */}
                    <div className="p-5">
                        <CommentItem comment={commentDetailTarget} isReply={false} />
                    </div>
                    
                    {/* 灰色分隔條 */}
                    <div className="h-2 bg-gray-100 dark:bg-slate-800/50 w-full" />
                    
                    {/* 回覆統計與排序標題 */}
                    <div className="flex items-center justify-between px-5 py-4">
                        <span className="text-sm font-black text-gray-800 dark:text-white">
                            相關回覆共{commentDetailTarget.replies?.length || 0}條
                        </span>
                        <div className="flex items-center space-x-1 text-xs font-bold text-gray-400 hover:text-orange-500 cursor-pointer transition-colors">
                            <span>按時間</span>
                            <ListFilter size={14} />
                        </div>
                    </div>
                    
                    {/* 回覆列表 */}
                    <div className="px-5 pb-24">
                        {commentDetailTarget.replies && commentDetailTarget.replies.length > 0 ? (
                            commentDetailTarget.replies.map((reply) => (
                                <CommentItem key={reply.id} comment={reply} isReply={true} />
                            ))
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center space-y-2 opacity-30">
                                <MessageSquare size={32} />
                                <p className="text-xs font-black">暫無相關回覆</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 底部輸入框固定在詳情抽屜下方 */}
                <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-100 dark:border-white/5 p-4 safe-bottom flex flex-col z-[170]">
                    {/* 當在詳情框且有特定子回覆對象時，顯示標識 */}
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
                                placeholder={replyingTo ? `回覆給 @${replyingTo.author}...` : `回覆給 @${commentDetailTarget.author}...`}
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
        </div>
      )}

      {viewingImage && (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center animate-fade-in" onClick={() => setViewingImage(null)}>
          <button className="absolute top-8 right-6 text-white w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full"><X size={24} /></button>
          <img src={viewingImage} className="max-w-full max-h-full object-contain animate-zoom-in" alt="Fullscreen View" />
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-[110] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => { setShowCreateModal(false); if (onModalClose) onModalClose(); }} />
          <div className="relative max-w-md mx-auto w-full bg-white dark:bg-slate-900 rounded-t-[32px] p-6 space-y-6 shadow-2xl animate-slide-up pb-12">
            <div className="flex justify-between items-center"><div className="flex items-center space-x-3"><div className="w-9 h-9 bg-orange-500 text-white rounded-xl flex items-center justify-center"><Send size={18} /></div><h3 className="text-lg font-black dark:text-white">發布新動態</h3></div><button onClick={() => { setShowCreateModal(false); if (onModalClose) onModalClose(); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-400"><X size={20} /></button></div>
            <div className="space-y-4">
              <div className="relative"><textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="這一刻想說點什麼呢... (支持使用 #標籤)" rows={4} className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-white/5 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-orange-500/50 resize-none dark:text-white" /><button onClick={handleBeautify} disabled={!postContent || isBeautifying} className="absolute bottom-3 right-3 bg-indigo-500 text-white px-3 py-2 rounded-xl shadow-lg disabled:opacity-30 active:scale-95 transition-all flex items-center space-x-2">{isBeautifying ? <RefreshCw className="animate-spin" size={12} /> : <Wand2 size={12} />}<span className="text-[10px] font-black uppercase tracking-tight">AI 美化</span></button></div>
              <div className="flex items-center space-x-3"><button onClick={handleFileSelect} className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-500 hover:text-orange-500 transition-colors border border-gray-100 dark:border-white/5"><Camera size={22} /></button><button onClick={handlePost} disabled={isPosting || (!postContent && !selectedImage)} className="flex-1 h-12 bg-orange-500 text-white rounded-xl font-black shadow-xl shadow-orange-300 dark:shadow-none flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-95 transition-transform">{isPosting ? <RefreshCw className="animate-spin" size={18} /> : <><Send size={18} /><span>發布到社群</span></>}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityView;
