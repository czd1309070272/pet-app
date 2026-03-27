

/**
 * 评论底部弹窗：含 CommentItem、主评论列表、回复详情弹窗
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  PanResponder,
  Animated,
} from 'react-native';
import { MessageCircle, Heart, Send, Reply, X } from 'lucide-react-native';
import type { Post, Comment } from '../../types';
import { LevelBadge } from './LevelBadge';
import { imageUri } from './utils';
import { MAX_VISIBLE_REPLIES, COMMUNITY_LAYOUT } from './constants';
import { colors, borderRadius, spacing } from '../../theme/tokens';

const INPUT_BAR_HEIGHT = 68;
const { SCREEN_HEIGHT } = COMMUNITY_LAYOUT;
const SHEET_HEIGHT_INITIAL = Math.floor(SCREEN_HEIGHT * 0.55);
const SHEET_HEIGHT_MIN = Math.floor(SCREEN_HEIGHT * 0.4);

function CommentItem({
  comment,
  isReply,
  dark,
  textPrimary,
  textSecondary,
  onLike,
  onReply,
  onViewAllReplies,
  onFetchReplies,
  inlineRepliesState, // 接收状态
}: {
  comment: Comment;
  isReply?: boolean;
  dark: boolean;
  textPrimary: string;
  textSecondary: string;
  onLike: (id: string) => void;
  onReply: (id: string, author: string, top_comment_id?: string) => void;
  onViewAllReplies?: (comment: Comment) => void;
  onFetchReplies?: (commentId: string, isLoadMore: boolean) => void;
  inlineRepliesState?: Record<string, { hasMore: boolean; loading: boolean }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const avatarSize = isReply ? 32 : 40;
  const replyCount = comment.replies?.length ?? 0;
  // const hasReplies = replyCount > 0;

  const [isExpanded, setIsExpanded] = useState(false);
// 新增：锁定状态，用于屏蔽点击瞬间的旧数据渲染
  const [isStartingFetch, setIsStartingFetch] = useState(false);
  // 从字典中获取当前评论的加载和分页状态
  const replyState = inlineRepliesState?.[comment.id] || { hasMore: false, loading: false };
  
  // 判断是否有回复：由于没有 reply_count，我们只能判断后端初次返回的 replies 是否存在且大于0
  const hasReplies = (comment.replies?.length ?? 0) > 0;

 // 监听全局 loading 状态：一旦接口请求结束，解除锁定
  useEffect(() => {
    if (!replyState.loading && isStartingFetch) {
      setIsStartingFetch(false);
    }
  }, [replyState.loading]);

    // 1. 修改展开回复的逻辑
  const handleExpand = () => {
    // 开启锁定模式，屏蔽旧数据，显示“数据加载中”
    setIsStartingFetch(true);
    setIsExpanded(true);
    
    // 【关键修复】：在这里触发初次请求，isLoadMore 传 false 表示清空并重新获取
    onFetchReplies?.(comment.id, false); 
  };

  // 2. 修改加载更多的逻辑
  const handleLoadMore = () => {
    // 【关键修复】：这里应该传 true，表示在原有数据基础上追加
    onFetchReplies?.(comment.id, true);
  };

  return (
    <View style={[styles.commentItem, isReply && styles.commentItemReply]}>
      <Image
        source={{ uri: imageUri(comment.avatar) }}
        style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
      />
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text
            style={[
              styles.author,
              { color: isReply ? textSecondary : textPrimary },
              isReply && styles.authorSmall,
            ]}
          >
            {comment.author}
          </Text>
          <LevelBadge level={comment.vipLevel === 'SVIP' ? 6 : comment.isVIP ? 5 : 3} />
        </View>
        <Text style={[styles.commentContent, { color: textPrimary }]}>
          {comment.replyToName && (
            <Text style={styles.replyTo}>回复 @{comment.replyToName}: </Text>
          )}
          {comment.content}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.time, { color: textSecondary }]}>{comment.time}</Text>
          <View style={styles.actions}>
            <Pressable onPress={() => onLike(comment.id)} style={styles.actionBtn}>
              <Heart
                size={14}
                color={comment.isLiked ? '#f43f5e' : textSecondary}
                fill={comment.isLiked ? '#f43f5e' : 'none'}
                strokeWidth={comment.isLiked ? 0 : 2.5}
              />
              <Text style={[styles.actionText, { color: comment.isLiked ? '#f43f5e' : textSecondary }]}>
                {comment.likes ?? 0}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onReply(comment.id, comment.author, comment.top_comment_id ?? comment.id)}
              style={styles.actionBtn}
            >
              <Text style={[styles.actionText, { color: textSecondary }]}>回复</Text>
            </Pressable>
          </View>
        </View>
        {/* {!isReply && hasReplies && (
          <View style={styles.repliesWrap}>
            {expanded ? (
              <>
                {(comment.replies ?? []).slice(0, MAX_VISIBLE_REPLIES).map((r) => (
                  <CommentItem
                    key={`${comment.id}-${r.id}`}
                    comment={r}
                    isReply
                    dark={dark}
                    textPrimary={textPrimary}
                    textSecondary={textSecondary}
                    onLike={onLike}
                    onReply={(id, author, top_comment_id) =>
                      onReply(id, author, top_comment_id ?? comment.id)
                    }
                  />
                ))}
                {replyCount > MAX_VISIBLE_REPLIES ? (
                  <Pressable onPress={() => onViewAllReplies?.(comment)} style={styles.viewAllBtn}>
                    <Text style={[styles.viewAllText, { color: colors.orange[500] }]}>
                      共 {replyCount - MAX_VISIBLE_REPLIES} 條回覆，點擊查看
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => setExpanded(false)} style={styles.viewAllBtn}>
                    <Text style={[styles.viewAllText, { color: colors.orange[500] }]}>收起</Text>
                  </Pressable>
                )}
              </>
            ) : (
              <Pressable onPress={() => setExpanded(true)} style={styles.viewAllBtn}>
                <Text style={[styles.viewAllText, { color: colors.orange[500] }]}>
                  展開
                </Text>
              </Pressable>
            )}
          </View>
        )} */}
        {/* 二级评论区域 */}
      {/* --- 子评论渲染逻辑 --- */}
        {!isReply && (
          <View style={styles.repliesWrap}>
            
            {/* 场景 A: 还没展开，且有子评论数据（或有回复数） */}
            {!isExpanded && (comment.replies?.length ?? 0) > 0 && (
              <Pressable onPress={handleExpand} style={styles.viewAllBtn}>
                <Text style={[styles.viewAllText, { color: colors.orange[500] }]}>展开回复</Text>
              </Pressable>
            )}

            {/* 场景 B: 已展开 */}
            {isExpanded && (
              <View>
                {/* 逻辑点：如果是第一次获取数据且正在 loading，我们认为此时数组正在被清空重置。
                   如果不显示任何子评论且正在加载，说明是“加载第一批”，此时显示“数据加载中”
                */}
                {/* 核心修改：
                只要满足【正在初次加载锁定】或者【数组已被清空且正在请求】，
                就只显示“数据加载中”，不再去 map comment.replies
              */}
              {isStartingFetch || (replyState.loading && (comment.replies?.length ?? 0) === 0) ? (
                <View style={{ paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.orange[500]} />
                  <Text style={{ marginLeft: 8, fontSize: 12, color: textSecondary }}>
                    数据加载中...
                  </Text>
                </View>
                ) : (
                  <>
                    {/* 渲染现有的子评论列表 */}
                    {comment.replies?.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        isReply={true}
                        dark={dark}
                        textPrimary={textPrimary}
                        textSecondary={textSecondary}
                        onLike={onLike}
                        onReply={onReply}
                      />
                    ))}

                    {/* 底部加载更多（追加逻辑）：数组里有数据，且正在请求下一页 */}
                  {replyState.loading && (comment.replies?.length ?? 0) > 0 && (
                    <View style={{ paddingVertical: 8, flexDirection: 'row' }}>
                      <ActivityIndicator size="small" color={colors.orange[500]} />
                      <Text style={{ marginLeft: 8, fontSize: 12 }}>正在加载更多...</Text>
                    </View>
                  )}

                    {/* “加载更多子评论”按钮：只有在不在加载中，且后端反馈还有更多时显示 */}
                    {replyState.hasMore && !replyState.loading && (
                      <Pressable onPress={handleLoadMore} style={{ marginTop: 8, paddingVertical: 4 }}>
                        <Text style={{ fontSize: 12, color: colors.orange[500], fontWeight: '700' }}>
                           —— 加载更多子评论
                        </Text>
                      </Pressable>
                    )}

                    {/* 收起按钮 */}
                    {!replyState.loading && (
                      <Pressable onPress={() => setIsExpanded(false)} style={styles.viewAllBtn}>
                        <Text style={[styles.viewAllText, { color: textSecondary }]}>收起回复</Text>
                      </Pressable>
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

export interface CommentSheetProps {
  visible: boolean;
  loading: boolean;
  post: Post | null;
  dark: boolean;
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
  borderColor: string;
  insetsBottom: number;
  insetsTop: number;
  keyboardHeight: number;
  newComment: string;
  replyingTo: { id: string; author: string; top_comment_id?: string } | null;
  onFetchReplies?: (commentId: string, isLoadMore: boolean) => void; 
  inlineRepliesState?: Record<string, { hasMore: boolean; loading: boolean }>; // 新增接收状态字典
  repliesModalComment: Comment | null;
  hasMore?: boolean; // 是否还有更多评论
  onLoadMore?: () => void; // 加载更多的回调函数
  loadingMore?: boolean; // 是否正在加载下一页 (可选，用于显示loading状态)
  // 新增：子评论的加载更多
  hasMoreReplies?: boolean; // 当前这条主评论是否还有更多子评论
  loadingMoreReplies?: boolean; // 子评论是否在加载中
  onLoadMoreReplies?: (parentCommentId: string) => void; // 点击加载更多子评论
  onClose: () => void;
  onLike: (id: string) => void;
  onReply: (id: string, author: string, top_comment_id?: string) => void;
  onViewAllReplies: (comment: Comment) => void;
  onCloseRepliesModal: () => void;
  onNewCommentChange: (v: string) => void;
  onClearReplyingTo: () => void;
  onSend: () => void;
  commentInputRef: React.RefObject<TextInput | null>;
}

export function CommentSheet({
  visible,
  loading,
  post,
  dark,
  textPrimary,
  textSecondary,
  cardBg,
  borderColor,
  insetsBottom,
  insetsTop,
  keyboardHeight,
  newComment,
  replyingTo,
  repliesModalComment,
  hasMore = false,      // 默认 false
  onLoadMore,           // 回调
  loadingMore = false,  // 默认 false
  // 新增解构
  hasMoreReplies,
  loadingMoreReplies,
  onLoadMoreReplies,
  onClose,
  onLike,
  onReply,
  onViewAllReplies,
  onCloseRepliesModal,
  onNewCommentChange,
  onClearReplyingTo,
  onSend,
  commentInputRef,
  onFetchReplies,
  inlineRepliesState,
}: CommentSheetProps) {
  const handleOverlayPress = () => {
    keyboardHeight > 0 ? Keyboard.dismiss() : onClose();
  };

  const sheetHeightMax = SCREEN_HEIGHT - insetsTop;
  const animatedHeight = useRef(new Animated.Value(SHEET_HEIGHT_INITIAL)).current;
  const dragStartHeight = useRef(SHEET_HEIGHT_INITIAL);

  useEffect(() => {
    if (visible) animatedHeight.setValue(SHEET_HEIGHT_INITIAL);
  }, [visible, animatedHeight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        animatedHeight.stopAnimation((v) => {
          dragStartHeight.current = typeof v === 'number' ? v : SHEET_HEIGHT_INITIAL;
        });
      },
      onPanResponderMove: (_, g) => {
        const maxH = SCREEN_HEIGHT - insetsTop;
        const newH = Math.min(maxH, Math.max(SHEET_HEIGHT_MIN, dragStartHeight.current - g.dy));
        animatedHeight.setValue(newH);
      },
      onPanResponderRelease: () => {
        animatedHeight.stopAnimation((v) => {
          dragStartHeight.current = typeof v === 'number' ? v : SHEET_HEIGHT_INITIAL;
        });
      },
    })
  ).current;

  const inputBarContent = (
    <>
      {replyingTo && (
        <View style={[styles.replyingBar, dark && styles.replyingBarDark]}>
          <Text style={styles.replyingText}>
            <Reply size={12} style={{ marginRight: 4 }} /> 正在回覆 @{replyingTo.author}
          </Text>
          <Pressable onPress={onClearReplyingTo}>
            <X size={14} color={textSecondary} />
          </Pressable>
        </View>
      )}
      <View style={[styles.inputRow, dark && styles.inputRowDark]}>
        <TextInput
          ref={commentInputRef}
          style={[styles.input, { color: textPrimary }]}
          placeholder={
            replyingTo ? `回覆給 @${replyingTo.author}...` : '說點溫馨的話吧...'
          }
          placeholderTextColor={textSecondary}
          value={newComment}
          onChangeText={onNewCommentChange}
          multiline={true}
          maxLength={100}
        />
        {newComment.trim() ? (
          <Pressable onPress={onSend} style={styles.sendBtn}>
            <Send size={16} color="#fff" />
          </Pressable>
        ) : null}
      </View>
    </>
  );

  // 1. 定义一个处理滚动的函数
  const handleScroll = (event: any) => {
    if (!onLoadMore || loadingMore || !hasMore) return;

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20; // 距离底部多少像素时触发

    // 计算公式：当前滚动位置 + 可视区域高度 >= 内容总高度 - 缓冲距离
    if (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    ) {
      onLoadMore();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleOverlayPress}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleOverlayPress} />
        <Animated.View
          style={[
            styles.content,
            {
              backgroundColor: cardBg,
              borderTopColor: borderColor,
              paddingBottom: insetsBottom + spacing.lg,
              maxHeight: sheetHeightMax,
              height: animatedHeight,
            },
          ]}
        >
          <View style={[styles.pullHandleWrap, { borderBottomColor: borderColor }]} {...panResponder.panHandlers}>
            <View style={[styles.pullHandleBar, dark && styles.pullHandleBarDark]} />
          </View>
          <View style={[styles.sheetHeader, { borderBottomColor: borderColor }]}>
            <Text style={[styles.sheetTitle, { color: textPrimary }]}>
              評論 ({post?.comments ?? post?.commentList?.length ?? 0})
            </Text>
            <Pressable onPress={onClose} style={styles.sheetClose}>
              <X size={20} color={textSecondary} />
            </Pressable>
          </View>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.orange[500]} />
              <Text style={[styles.loadingText, { color: textSecondary }]}>加載評論...</Text>
            </View>
          ) : post ? (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: INPUT_BAR_HEIGHT + spacing.lg }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              // 删除了 onEndReached 和 onEndReachedThreshold
              onScroll={handleScroll}
              scrollEventThrottle={400} // 每 400ms 触发一次 onScroll，避免过于频繁
            >
              {(post.commentList?.length ?? 0) > 0 ? (
                <View style={styles.list}>
                  {/* {[...(post.commentList ?? [])].reverse().map((c, i) => ( */}
                  {(post.commentList ?? []).map((c, i) => (
                    <CommentItem
                      key={`${c.id}-${i}`}
                      comment={c}
                      dark={dark}
                      textPrimary={textPrimary}
                      textSecondary={textSecondary}
                      onLike={onLike}
                      onReply={onReply}
                      onViewAllReplies={onViewAllReplies}
                      onFetchReplies={onFetchReplies}           // 透传
                      inlineRepliesState={inlineRepliesState}   // 透传
                    />
                  ))}

                  {/* 加载更多按钮 */}
                  {hasMore && (
                    <Pressable
                      onPress={onLoadMore}
                      disabled={loadingMore}
                      style={[styles.loadMoreBtn, loadingMore && styles.loadMoreBtnDisabled]}
                    >
                      {loadingMore ? (
                        <ActivityIndicator size="small" color={colors.orange[500]} />
                      ) : (
                        <Text style={[styles.loadMoreText, { color: colors.orange[500] }]}>
                          加载更多评论
                        </Text>
                      )}
                    </Pressable>
                  )}
                </View>
              ) : (
                <View style={styles.empty}>
                  <Text style={[styles.emptyText, { color: textSecondary }]}>暫無評論</Text>
                </View>
              )}
            </ScrollView>
          ) : null}
        </Animated.View>
        {/* 独立输入栏：仅输入框+发送按钮随键盘升降 */}
        {post && !loading && (
          <View
            style={[
              styles.inputBarFixed,
              {
                backgroundColor: cardBg,
                borderTopColor: borderColor,
                bottom: keyboardHeight,
                paddingBottom: keyboardHeight > 0 ? spacing.lg : insetsBottom + spacing.lg,
              },
            ]}
          >
            {inputBarContent}
          </View>
        )}
      </View>

      {/* 回复详情弹窗 */}
      <Modal
        visible={repliesModalComment !== null}
        transparent
        animationType="slide"
        onRequestClose={onCloseRepliesModal}
      >
        {repliesModalComment && post && (
          <View style={styles.overlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onCloseRepliesModal} />
            <View style={[styles.repliesContent, { backgroundColor: cardBg }]}>
              <View style={[styles.repliesHeader, { borderBottomColor: borderColor }]}>
                <Text style={[styles.repliesTitle, { color: textPrimary }]}>全部回覆</Text>
                <Pressable onPress={onCloseRepliesModal} style={styles.repliesClose}>
                  <X size={20} color={textSecondary} />
                </Pressable>
              </View>
              <ScrollView style={styles.repliesScroll} showsVerticalScrollIndicator={false}>
                <View style={[styles.repliesParent, { borderBottomColor: borderColor }]}>
                  <Image
                    source={{ uri: imageUri(repliesModalComment.avatar) }}
                    style={[
                      styles.avatar,
                      { width: 40, height: 40, borderRadius: 20, marginRight: spacing.md },
                    ]}
                  />
                  <View style={styles.commentBody}>
                    <View style={styles.commentHeader}>
                      <Text style={[styles.author, { color: textPrimary }]}>
                        {repliesModalComment.author}
                      </Text>
                      <LevelBadge
                        level={
                          repliesModalComment.vipLevel === 'SVIP'
                            ? 6
                            : repliesModalComment.isVIP
                              ? 5
                              : 3
                        }
                      />
                    </View>
                    <Text style={[styles.commentContent, { color: textPrimary }]}>
                      {repliesModalComment.content}
                    </Text>
                    <Text style={[styles.time, { color: textSecondary }]}>
                      {repliesModalComment.time}
                    </Text>
                  </View>
                </View>
                <View style={styles.repliesList}>
                  {(repliesModalComment.replies ?? []).map((r) => (
                    <CommentItem
                      key={`${repliesModalComment.id}-${r.id}`}
                      comment={r}
                      isReply
                      dark={dark}
                      textPrimary={textPrimary}
                      textSecondary={textSecondary}
                      onLike={onLike}
                      onReply={(id, author, top_comment_id) => {
                        onCloseRepliesModal();
                        onReply(id, author, top_comment_id ?? repliesModalComment.id);
                      }}
                    />
                  ))}

                  {hasMoreReplies && onLoadMoreReplies && (
                    <Pressable
                      onPress={() => onLoadMoreReplies(repliesModalComment.id)}
                      disabled={loadingMoreReplies}
                      style={[styles.loadMoreBtn, loadingMoreReplies && styles.loadMoreBtnDisabled]}
                    >
                      {loadingMoreReplies ? (
                        <ActivityIndicator size="small" color={colors.orange[500]} />
                      ) : (
                        <Text style={[styles.loadMoreText, { color: colors.orange[500] }]}>
                          加载更多评论
                        </Text>
                      )}
                    </Pressable>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({

  loadMoreBtn: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg, // 确保底部有间距，不被输入框遮挡
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(249,115,22,0.08)', // 淡淡的橙色背景
  },
  loadMoreBtnDisabled: {
    opacity: 0.6,
    backgroundColor: 'transparent',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '700',
  },

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
  },
  pullHandleWrap: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pullHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  pullHandleBarDark: { backgroundColor: 'rgba(255,255,255,0.2)' },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 16, fontWeight: '800' },
  sheetClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  loadingWrap: { paddingVertical: 48, alignItems: 'center' },
  loadingText: { marginTop: spacing.md, fontSize: 14, fontWeight: '600' },
  body: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  list: { marginTop: 0 },
  empty: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  inputWrap: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  inputBarFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  replyingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(249,115,22,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.2)',
  },
  replyingBarDark: { backgroundColor: 'rgba(249,115,22,0.15)' },
  replyingText: { fontSize: 10, fontWeight: '800', color: colors.orange[600] },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  inputRowDark: { backgroundColor: 'rgba(30,41,59,0.6)', borderColor: 'rgba(255,255,255,0.06)' },
  input: { flex: 1, fontSize: 14, fontWeight: '600', paddingVertical: 2 },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.orange[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  sendBtnDisabled: { opacity: 0.5 },
  commentItem: { flexDirection: 'row', marginBottom: spacing.xl },
  commentItemReply: { marginBottom: spacing.lg },
  avatar: { marginRight: spacing.md },
  commentBody: { flex: 1, minWidth: 0 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  author: { fontSize: 14, fontWeight: '800' },
  authorSmall: { fontSize: 12 },
  commentContent: { fontSize: 13.5, lineHeight: 20, marginBottom: 4 },
  replyTo: { color: colors.orange[500], fontWeight: '700' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  time: { fontSize: 10, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 10, fontWeight: '700' },
  repliesWrap: { marginTop: spacing.md, marginLeft: 0, paddingLeft: 0 },
  viewAllBtn: { marginTop: spacing.sm, paddingVertical: 4 },
  viewAllText: { fontSize: 12, fontWeight: '800' },
  repliesContent: { maxHeight: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  repliesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  repliesTitle: { fontSize: 16, fontWeight: '800' },
  repliesClose: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  repliesScroll: { padding: spacing.lg, maxHeight: 360 },
  repliesParent: {
    flexDirection: 'row',
    paddingBottom: spacing.lg,
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  repliesList: { marginTop: 0 },
});

// /**
//  * 评论底部弹窗：含 CommentItem、主评论列表、回复详情弹窗
//  */
// import React, { useState, useRef, useEffect } from 'react';
// import {
//   View,
//   Text,
//   Image,
//   TextInput,
//   Pressable,
//   Modal,
//   ScrollView,
//   StyleSheet,
//   ActivityIndicator,
//   Keyboard,
//   PanResponder,
//   Animated,
// } from 'react-native';
// import { MessageCircle, Heart, Send, Reply, X } from 'lucide-react-native';
// import type { Post, Comment } from '../../types';
// import { LevelBadge } from './LevelBadge';
// import { imageUri } from './utils';
// import { MAX_VISIBLE_REPLIES, COMMUNITY_LAYOUT } from './constants';
// import { colors, borderRadius, spacing } from '../../theme/tokens';

// const INPUT_BAR_HEIGHT = 68;
// const { SCREEN_HEIGHT } = COMMUNITY_LAYOUT;
// const SHEET_HEIGHT_INITIAL = Math.floor(SCREEN_HEIGHT * 0.55);
// const SHEET_HEIGHT_MIN = Math.floor(SCREEN_HEIGHT * 0.4);

// function CommentItem({
//   comment,
//   isReply,
//   dark,
//   textPrimary,
//   textSecondary,
//   onLike,
//   onReply,
//   onViewAllReplies,
// }: {
//   comment: Comment;
//   isReply?: boolean;
//   dark: boolean;
//   textPrimary: string;
//   textSecondary: string;
//   onLike: (id: string) => void;
//   onReply: (id: string, author: string, top_comment_id?: string) => void;
//   onViewAllReplies?: (comment: Comment) => void;
// }) {
//   const [expanded, setExpanded] = useState(false);
//   const avatarSize = isReply ? 32 : 40;
//   const replyCount = comment.replies?.length ?? 0;
//   const hasReplies = replyCount > 0;
//   return (
//     <View style={[styles.commentItem, isReply && styles.commentItemReply]}>
//       <Image
//         source={{ uri: imageUri(comment.avatar) }}
//         style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
//       />
//       <View style={styles.commentBody}>
//         <View style={styles.commentHeader}>
//           <Text
//             style={[
//               styles.author,
//               { color: isReply ? textSecondary : textPrimary },
//               isReply && styles.authorSmall,
//             ]}
//           >
//             {comment.author}
//           </Text>
//           <LevelBadge level={comment.vipLevel === 'SVIP' ? 6 : comment.isVIP ? 5 : 3} />
//         </View>
//         <Text style={[styles.commentContent, { color: textPrimary }]}>
//           {comment.replyToName && (
//             <Text style={styles.replyTo}>回复 @{comment.replyToName}: </Text>
//           )}
//           {comment.content}
//         </Text>
//         <View style={styles.meta}>
//           <Text style={[styles.time, { color: textSecondary }]}>{comment.time}</Text>
//           <View style={styles.actions}>
//             <Pressable onPress={() => onLike(comment.id)} style={styles.actionBtn}>
//               <Heart
//                 size={14}
//                 color={comment.isLiked ? '#f43f5e' : textSecondary}
//                 fill={comment.isLiked ? '#f43f5e' : 'none'}
//                 strokeWidth={comment.isLiked ? 0 : 2.5}
//               />
//               <Text style={[styles.actionText, { color: comment.isLiked ? '#f43f5e' : textSecondary }]}>
//                 {comment.likes ?? 0}
//               </Text>
//             </Pressable>
//             <Pressable
//               onPress={() => onReply(comment.id, comment.author, comment.top_comment_id ?? comment.id)}
//               style={styles.actionBtn}
//             >
//               <Text style={[styles.actionText, { color: textSecondary }]}>回复</Text>
//             </Pressable>
//           </View>
//         </View>
//         {!isReply && hasReplies && (
//           <View style={styles.repliesWrap}>
//             {expanded ? (
//               <>
//                 {(comment.replies ?? []).slice(0, MAX_VISIBLE_REPLIES).map((r) => (
//                   <CommentItem
//                     key={`${comment.id}-${r.id}`}
//                     comment={r}
//                     isReply
//                     dark={dark}
//                     textPrimary={textPrimary}
//                     textSecondary={textSecondary}
//                     onLike={onLike}
//                     onReply={(id, author, top_comment_id) =>
//                       onReply(id, author, top_comment_id ?? comment.id)
//                     }
//                   />
//                 ))}
//                 {replyCount > MAX_VISIBLE_REPLIES ? (
//                   <Pressable onPress={() => onViewAllReplies?.(comment)} style={styles.viewAllBtn}>
//                     <Text style={[styles.viewAllText, { color: colors.orange[500] }]}>
//                       共 {replyCount - MAX_VISIBLE_REPLIES} 條回覆，點擊查看
//                     </Text>
//                   </Pressable>
//                 ) : (
//                   <Pressable onPress={() => setExpanded(false)} style={styles.viewAllBtn}>
//                     <Text style={[styles.viewAllText, { color: colors.orange[500] }]}>收起</Text>
//                   </Pressable>
//                 )}
                
//               </>
//             ) : (
//               <Pressable onPress={() => setExpanded(true)} style={styles.viewAllBtn}>
//                 <Text style={[styles.viewAllText, { color: colors.orange[500] }]}>
//                   {/* — 展開 {replyCount} 條回覆 */}
//                   展開
//                 </Text>
//               </Pressable>
//             )}
//           </View>
//         )}
//       </View>
//     </View>
//   );
// }

// export interface CommentSheetProps {
//   visible: boolean;
//   loading: boolean;
//   post: Post | null;
//   dark: boolean;
//   textPrimary: string;
//   textSecondary: string;
//   cardBg: string;
//   borderColor: string;
//   insetsBottom: number;
//   insetsTop: number;
//   keyboardHeight: number;
//   newComment: string;
//   replyingTo: { id: string; author: string; top_comment_id?: string } | null;
//   repliesModalComment: Comment | null;
//   onClose: () => void;
//   onLike: (id: string) => void;
//   onReply: (id: string, author: string, top_comment_id?: string) => void;
//   onViewAllReplies: (comment: Comment) => void;
//   onCloseRepliesModal: () => void;
//   onNewCommentChange: (v: string) => void;
//   onClearReplyingTo: () => void;
//   onSend: () => void;
//   commentInputRef: React.RefObject<TextInput | null>;
// }

// export function CommentSheet({
//   visible,
//   loading,
//   post,
//   dark,
//   textPrimary,
//   textSecondary,
//   cardBg,
//   borderColor,
//   insetsBottom,
//   insetsTop,
//   keyboardHeight,
//   newComment,
//   replyingTo,
//   repliesModalComment,
//   onClose,
//   onLike,
//   onReply,
//   onViewAllReplies,
//   onCloseRepliesModal,
//   onNewCommentChange,
//   onClearReplyingTo,
//   onSend,
//   commentInputRef,
// }: CommentSheetProps) {
//   const handleOverlayPress = () => {
//     keyboardHeight > 0 ? Keyboard.dismiss() : onClose();
//   };

//   const sheetHeightMax = SCREEN_HEIGHT - insetsTop;
//   const animatedHeight = useRef(new Animated.Value(SHEET_HEIGHT_INITIAL)).current;
//   const dragStartHeight = useRef(SHEET_HEIGHT_INITIAL);

//   useEffect(() => {
//     if (visible) animatedHeight.setValue(SHEET_HEIGHT_INITIAL);
//   }, [visible, animatedHeight]);

//   const panResponder = useRef(
//     PanResponder.create({
//       onStartShouldSetPanResponder: () => true,
//       onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
//       onPanResponderGrant: () => {
//         animatedHeight.stopAnimation((v) => {
//           dragStartHeight.current = typeof v === 'number' ? v : SHEET_HEIGHT_INITIAL;
//         });
//       },
//       onPanResponderMove: (_, g) => {
//         const maxH = SCREEN_HEIGHT - insetsTop;
//         const newH = Math.min(maxH, Math.max(SHEET_HEIGHT_MIN, dragStartHeight.current - g.dy));
//         animatedHeight.setValue(newH);
//       },
//       onPanResponderRelease: () => {
//         animatedHeight.stopAnimation((v) => {
//           dragStartHeight.current = typeof v === 'number' ? v : SHEET_HEIGHT_INITIAL;
//         });
//       },
//     })
//   ).current;

//   const inputBarContent = (
//     <>
//       {replyingTo && (
//         <View style={[styles.replyingBar, dark && styles.replyingBarDark]}>
//           <Text style={styles.replyingText}>
//             <Reply size={12} style={{ marginRight: 4 }} /> 正在回覆 @{replyingTo.author}
//           </Text>
//           <Pressable onPress={onClearReplyingTo}>
//             <X size={14} color={textSecondary} />
//           </Pressable>
//         </View>
//       )}
//       <View style={[styles.inputRow, dark && styles.inputRowDark]}>
//         <TextInput
//           ref={commentInputRef}
//           style={[styles.input, { color: textPrimary }]}
//           placeholder={
//             replyingTo ? `回覆給 @${replyingTo.author}...` : '說點溫馨的話吧...'
//           }
//           placeholderTextColor={textSecondary}
//           value={newComment}
//           onChangeText={onNewCommentChange}
//           multiline={true}
//           maxLength={100}
//         />
//         {newComment.trim() ? (
//           <Pressable onPress={onSend} style={styles.sendBtn}>
//             <Send size={16} color="#fff" />
//           </Pressable>
//         ) : null}
//       </View>
//     </>
//   );

//   return (
//     <Modal visible={visible} transparent animationType="slide" onRequestClose={handleOverlayPress}>
//       <View style={styles.overlay}>
//         <Pressable style={StyleSheet.absoluteFill} onPress={handleOverlayPress} />
//         <Animated.View
//           style={[
//             styles.content,
//             {
//               backgroundColor: cardBg,
//               borderTopColor: borderColor,
//               paddingBottom: insetsBottom + spacing.lg,
//               maxHeight: sheetHeightMax,
//               height: animatedHeight,
//             },
//           ]}
//         >
//           <View style={[styles.pullHandleWrap, { borderBottomColor: borderColor }]} {...panResponder.panHandlers}>
//             <View style={[styles.pullHandleBar, dark && styles.pullHandleBarDark]} />
//           </View>
//           <View style={[styles.sheetHeader, { borderBottomColor: borderColor }]}>
//             <Text style={[styles.sheetTitle, { color: textPrimary }]}>
//               評論 ({post?.comments ?? post?.commentList?.length ?? 0})
//             </Text>
//             <Pressable onPress={onClose} style={styles.sheetClose}>
//               <X size={20} color={textSecondary} />
//             </Pressable>
//           </View>
//           {loading ? (
//             <View style={styles.loadingWrap}>
//               <ActivityIndicator size="large" color={colors.orange[500]} />
//               <Text style={[styles.loadingText, { color: textSecondary }]}>加載評論...</Text>
//             </View>
//           ) : post ? (
//             <ScrollView
//               style={styles.scroll}
//               contentContainerStyle={[styles.scrollContent, { paddingBottom: INPUT_BAR_HEIGHT + spacing.lg }]}
//               showsVerticalScrollIndicator={false}
//               keyboardShouldPersistTaps="handled"
//               keyboardDismissMode="on-drag"
//             >
//               {(post.commentList?.length ?? 0) > 0 ? (
//                 <View style={styles.list}>
//                   {[...(post.commentList ?? [])].reverse().map((c, i) => (
//                     <CommentItem
//                       key={`${c.id}-${i}`}
//                       comment={c}
//                       dark={dark}
//                       textPrimary={textPrimary}
//                       textSecondary={textSecondary}
//                       onLike={onLike}
//                       onReply={onReply}
//                       onViewAllReplies={onViewAllReplies}
//                     />
//                   ))}
//                 </View>
//               ) : (
//                 <View style={styles.empty}>
//                   <Text style={[styles.emptyText, { color: textSecondary }]}>暫無評論</Text>
//                 </View>
//               )}
//             </ScrollView>
//           ) : null}
//         </Animated.View>
//         {/* 独立输入栏：仅输入框+发送按钮随键盘升降 */}
//         {post && !loading && (
//           <View
//             style={[
//               styles.inputBarFixed,
//               {
//                 backgroundColor: cardBg,
//                 borderTopColor: borderColor,
//                 bottom: keyboardHeight,
//                 paddingBottom: keyboardHeight > 0 ? spacing.lg : insetsBottom + spacing.lg,
//               },
//             ]}
//           >
//             {inputBarContent}
//           </View>
//         )}
//       </View>

//       {/* 回复详情弹窗 */}
//       <Modal
//         visible={repliesModalComment !== null}
//         transparent
//         animationType="slide"
//         onRequestClose={onCloseRepliesModal}
//       >
//         {repliesModalComment && post && (
//           <View style={styles.overlay}>
//             <Pressable style={StyleSheet.absoluteFill} onPress={onCloseRepliesModal} />
//             <View style={[styles.repliesContent, { backgroundColor: cardBg }]}>
//               <View style={[styles.repliesHeader, { borderBottomColor: borderColor }]}>
//                 <Text style={[styles.repliesTitle, { color: textPrimary }]}>全部回覆</Text>
//                 <Pressable onPress={onCloseRepliesModal} style={styles.repliesClose}>
//                   <X size={20} color={textSecondary} />
//                 </Pressable>
//               </View>
//               <ScrollView style={styles.repliesScroll} showsVerticalScrollIndicator={false}>
//                 <View style={[styles.repliesParent, { borderBottomColor: borderColor }]}>
//                   <Image
//                     source={{ uri: imageUri(repliesModalComment.avatar) }}
//                     style={[
//                       styles.avatar,
//                       { width: 40, height: 40, borderRadius: 20, marginRight: spacing.md },
//                     ]}
//                   />
//                   <View style={styles.commentBody}>
//                     <View style={styles.commentHeader}>
//                       <Text style={[styles.author, { color: textPrimary }]}>
//                         {repliesModalComment.author}
//                       </Text>
//                       <LevelBadge
//                         level={
//                           repliesModalComment.vipLevel === 'SVIP'
//                             ? 6
//                             : repliesModalComment.isVIP
//                               ? 5
//                               : 3
//                         }
//                       />
//                     </View>
//                     <Text style={[styles.commentContent, { color: textPrimary }]}>
//                       {repliesModalComment.content}
//                     </Text>
//                     <Text style={[styles.time, { color: textSecondary }]}>
//                       {repliesModalComment.time}
//                     </Text>
//                   </View>
//                 </View>
//                 <View style={styles.repliesList}>
//                   {(repliesModalComment.replies ?? []).map((r) => (
//                     <CommentItem
//                       key={`${repliesModalComment.id}-${r.id}`}
//                       comment={r}
//                       isReply
//                       dark={dark}
//                       textPrimary={textPrimary}
//                       textSecondary={textSecondary}
//                       onLike={onLike}
//                       onReply={(id, author, top_comment_id) => {
//                         onCloseRepliesModal();
//                         onReply(id, author, top_comment_id ?? repliesModalComment.id);
//                       }}
//                     />
//                   ))}
//                 </View>
//               </ScrollView>
//             </View>
//           </View>
//         )}
//       </Modal>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     justifyContent: 'flex-end',
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
//   content: {
//     borderTopLeftRadius: borderRadius['3xl'],
//     borderTopRightRadius: borderRadius['3xl'],
//   },
//   pullHandleWrap: {
//     paddingVertical: spacing.sm,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderBottomWidth: StyleSheet.hairlineWidth,
//   },
//   pullHandleBar: {
//     width: 36,
//     height: 4,
//     borderRadius: 2,
//     backgroundColor: 'rgba(0,0,0,0.15)',
//   },
//   pullHandleBarDark: { backgroundColor: 'rgba(255,255,255,0.2)' },
//   sheetHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: spacing.lg,
//     paddingVertical: spacing.md,
//     borderBottomWidth: 1,
//   },
//   sheetTitle: { fontSize: 16, fontWeight: '800' },
//   sheetClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
//   loadingWrap: { paddingVertical: 48, alignItems: 'center' },
//   loadingText: { marginTop: spacing.md, fontSize: 14, fontWeight: '600' },
//   body: { flex: 1 },
//   scroll: { flex: 1 },
//   scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
//   list: { marginTop: 0 },
//   empty: { paddingVertical: 48, alignItems: 'center' },
//   emptyText: { fontSize: 14 },
//   inputWrap: {
//     padding: spacing.lg,
//     paddingTop: spacing.md,
//     borderTopWidth: 1,
//   },
//   inputBarFixed: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     paddingHorizontal: spacing.lg,
//     paddingTop: spacing.sm,
//     borderTopWidth: 1,
//   },
//   replyingBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: 'rgba(249,115,22,0.1)',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 12,
//     marginBottom: 8,
//     borderWidth: 1,
//     borderColor: 'rgba(249,115,22,0.2)',
//   },
//   replyingBarDark: { backgroundColor: 'rgba(249,115,22,0.15)' },
//   replyingText: { fontSize: 10, fontWeight: '800', color: colors.orange[600] },
//   inputRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.06)',
//     borderRadius: 18,
//     paddingHorizontal: spacing.md,
//     paddingVertical: 6,
//     borderWidth: 1,
//     borderColor: 'rgba(0,0,0,0.08)',
//   },
//   inputRowDark: { backgroundColor: 'rgba(30,41,59,0.6)', borderColor: 'rgba(255,255,255,0.06)' },
//   input: { flex: 1, fontSize: 14, fontWeight: '600', paddingVertical: 2 },
//   sendBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: colors.orange[500],
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginLeft: 6,
//   },
//   sendBtnDisabled: { opacity: 0.5 },
//   commentItem: { flexDirection: 'row', marginBottom: spacing.xl },
//   commentItemReply: { marginBottom: spacing.lg },
//   avatar: { marginRight: spacing.md },
//   commentBody: { flex: 1, minWidth: 0 },
//   commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
//   author: { fontSize: 14, fontWeight: '800' },
//   authorSmall: { fontSize: 12 },
//   commentContent: { fontSize: 13.5, lineHeight: 20, marginBottom: 4 },
//   replyTo: { color: colors.orange[500], fontWeight: '700' },
//   meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
//   time: { fontSize: 10, fontWeight: '700' },
//   actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
//   actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
//   actionText: { fontSize: 10, fontWeight: '700' },
//   repliesWrap: { marginTop: spacing.md, marginLeft: 0, paddingLeft: 0 },
//   viewAllBtn: { marginTop: spacing.sm, paddingVertical: 4 },
//   viewAllText: { fontSize: 12, fontWeight: '800' },
//   repliesContent: { maxHeight: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
//   repliesHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: spacing.lg,
//     borderBottomWidth: 1,
//   },
//   repliesTitle: { fontSize: 16, fontWeight: '800' },
//   repliesClose: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
//   repliesScroll: { padding: spacing.lg, maxHeight: 360 },
//   repliesParent: {
//     flexDirection: 'row',
//     paddingBottom: spacing.lg,
//     marginBottom: spacing.lg,
//     borderBottomWidth: 1,
//   },
//   repliesList: { marginTop: 0 },
// });
