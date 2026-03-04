import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Reply,
  X,
} from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CommunityStackParamList } from '../navigation/types';
import type { Post, Comment } from '../types';
import { getPostDetail, likePost, commentPost, getToken } from '../front_api';
import { API_BASE_URL } from '../front_api';
import { useApp } from '../context/AppContext';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors, borderRadius, spacing } from '../theme/tokens';

const VIDEO_LOAD_TIMEOUT_MS = 12000;

type Nav = NativeStackNavigationProp<CommunityStackParamList, 'PostDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMG_GAP = 6;
const MAX_VISIBLE_REPLIES = 3;

const IMAGE_PLACEHOLDER = 'https://picsum.photos/seed/placeholder/200';
const VIDEO_EXT = /\.(mp4|mov|webm|avi|mkv|m4v|3gp|ogg|wmv|flv)(\?|$)/i;

/** 将相对路径转为完整 URL；http/file 开头则原样返回 */
function fullMediaUrl(path: string): string {
  const s = (path ?? '').trim();
  if (s === '') return IMAGE_PLACEHOLDER;
  if (s.startsWith('http') || s.startsWith('file')) return s;
  const origin = API_BASE_URL.replace(/\/api\/?$/, '');
  return origin + '/api' + (s.startsWith('/') ? s : '/' + s);
}

/** 根据扩展名判断是否为视频 */
function isVideoUrl(url: string): boolean {
  return VIDEO_EXT.test(url.split('?')[0]);
}

function imageUri(path: string): string {
  const s = (path ?? '').trim();
  if (s === '') return IMAGE_PLACEHOLDER;
  return fullMediaUrl(s);
}

function DetailVideoBlock({ videoUrl }: { videoUrl: string }) {
  const size = SCREEN_WIDTH - spacing.lg * 2;
  const url = fullMediaUrl(videoUrl);
  const [loadFailed, setLoadFailed] = useState(false);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.muted = false;
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  useEffect(() => {
    if (status === 'readyToPlay') {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      setLoadFailed(false);
      return;
    }
    if (status === 'error') {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      setLoadFailed(true);
      return;
    }
    loadTimeoutRef.current = setTimeout(() => {
      loadTimeoutRef.current = null;
      setLoadFailed(true);
    }, VIDEO_LOAD_TIMEOUT_MS);
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [status]);

  return (
    <View style={[styles.detailImageWrap, { width: size, height: size * (9 / 16), marginBottom: IMG_GAP }]}>
      <VideoView style={StyleSheet.absoluteFill} player={player} contentFit="contain" nativeControls />
      {loadFailed && (
        <View style={styles.videoLoadFailedOverlay}>
          <Text style={styles.videoLoadFailedText}>視頻加載失敗</Text>
        </View>
      )}
    </View>
  );
}

function LevelBadge({ level = 3 }: { level?: number }) {
  const colorMap: Record<number, string> = {
    0: '#d1d5db', 1: '#9ca3af', 2: '#6b7280', 3: '#60a5fa', 4: '#3b82f6', 5: '#f97316', 6: '#f43f5e',
  };
  return (
    <View style={[styles.levelBadge, { backgroundColor: colorMap[level] ?? colorMap[0] }]}>
      <Text style={styles.levelBadgeText}>LV{level}</Text>
    </View>
  );
}

function CommentItem({
  comment,
  isReply,
  dark,
  textPrimary,
  textSecondary,
  onLike,
  onReply,
  onViewAllReplies,
}: {
  comment: Comment;
  isReply?: boolean;
  dark: boolean;
  textPrimary: string;
  textSecondary: string;
  onLike: (id: string) => void;
  onReply: (id: string, author: string, top_comment_id?: string) => void;
  onViewAllReplies?: (comment: Comment) => void;
}) {
  const avatarSize = isReply ? 32 : 40;
  return (
    <View style={[styles.commentItem, isReply && styles.commentItemReply]}>
      <Image
        source={{ uri: imageUri(comment.avatar) }}
        style={[styles.commentAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
      />
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentAuthor, { color: isReply ? textSecondary : textPrimary }, isReply && styles.commentAuthorSmall]}>
            {comment.author}
          </Text>
          <LevelBadge level={comment.vipLevel === 'SVIP' ? 6 : comment.isVIP ? 5 : 3} />
        </View>
        <Text style={[styles.commentContent, { color: textPrimary }]}>
          {comment.replyToName && (
            <Text style={styles.commentReplyTo}>回复 @{comment.replyToName}: </Text>
          )}
          {comment.content}
        </Text>
        <View style={styles.commentMeta}>
          <Text style={[styles.commentTime, { color: textSecondary }]}>{comment.time}</Text>
          <View style={styles.commentActions}>
            <Pressable onPress={() => onLike(comment.id)} style={styles.commentActionBtn}>
              <Heart
                size={14}
                color={comment.isLiked ? '#f43f5e' : textSecondary}
                fill={comment.isLiked ? '#f43f5e' : 'none'}
                strokeWidth={comment.isLiked ? 0 : 2.5}
              />
              <Text style={[styles.commentActionText, { color: comment.isLiked ? '#f43f5e' : textSecondary }]}>
                {comment.likes ?? 0}
              </Text>
            </Pressable>
            <Pressable onPress={() => onReply(comment.id, comment.author, comment.top_comment_id ?? comment.id)} style={styles.commentActionBtn}>
              <Text style={[styles.commentActionText, { color: textSecondary }]}>回复</Text>
            </Pressable>
          </View>
        </View>
        {!isReply && (comment.replies?.length ?? 0) > 0 && (
          <View style={styles.repliesWrap}>
            {(comment.replies ?? []).slice(0, MAX_VISIBLE_REPLIES).map((r) => (
              <CommentItem
                key={`${comment.id}-${r.id}`}
                comment={r}
                isReply
                dark={dark}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                onLike={onLike}
                onReply={onReply}
              />
            ))}
            {(comment.replies?.length ?? 0) > MAX_VISIBLE_REPLIES && (
              <Pressable
                onPress={() => onViewAllReplies?.(comment)}
                style={styles.viewAllRepliesBtn}
              >
                <Text style={[styles.viewAllRepliesText, { color: colors.orange[500] }]}>
                  共 {(comment.replies?.length ?? 0) - MAX_VISIBLE_REPLIES} 條回覆，點擊查看
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

export default function PostDetailScreen({
  route,
  navigation,
}: {
  route: { params: { postId: number } };
  navigation: Nav;
}) {
  const { postId } = route.params;
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useApp();
  const dark = isDarkMode;

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string; top_comment_id?: string } | null>(null);
  /** 用户点击「写评论」或「回复」时才为 true，用于控制输入框显示 */
  const [showCommentInput, setShowCommentInput] = useState(false);
  /** 点击「共x条回复」时显示的评论详情弹窗 */
  const [repliesModalComment, setRepliesModalComment] = useState<Comment | null>(null);
  /** 键盘高度，用于让底部输入框随键盘上移 */
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const commentInputRef = useRef<TextInput>(null);

  const loadPost = useCallback(async () => {
    const token = await getToken();
    const data = await getPostDetail({
      token: token ?? '',
      post_id: postId,
      top_limit: 10,
      replies_limit: 10,
    });
    setPost(data ?? null);
  }, [postId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      await loadPost();
      if (!cancelled) setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [loadPost]);

  // 键盘弹起/收起时更新高度，使底部输入框随键盘上移
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subShow = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const subHide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  // 弹出输入框后自动聚焦并唤起键盘
  useEffect(() => {
    if (!showCommentInput) return;
    const t = setTimeout(() => commentInputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [showCommentInput]);

  const handleLikePost = useCallback(async () => {
    if (!post) return;
    const token = await getToken();
    const res = await likePost({ token: token ?? '', target_id: post.id, target_type: 'post' });
    setPost((p) => (p ? { ...p, likes: res.likes, isLiked: res.isLiked } : null));
  }, [post]);

  const handleLikeComment = useCallback(async (commentId: string) => {
    if (!post) return;
    const token = await getToken();
    const res = await likePost({
      token: token ?? '',
      target_id: commentId,
      target_type: 'comment',
    });
    setPost((p) => {
      if (!p) return null;
      const update = (list: Comment[]): Comment[] =>
        list.map((c) =>
          c.id === commentId
            ? { ...c, likes: res.likes, isLiked: res.isLiked }
            : { ...c, replies: c.replies?.length ? update(c.replies) : [] }
        );
      return { ...p, commentList: update(p.commentList ?? []) };
    });
  }, [post]);

  const handleReply = useCallback((id: string, author: string, top_comment_id?: string) => {
    setReplyingTo({ id, author, top_comment_id });
    setShowCommentInput(true);
  }, []);

  const handleOpenCommentInput = useCallback(() => {
    setReplyingTo(null);
    setShowCommentInput(true);
  }, []);

  const handleCloseCommentInput = useCallback(() => {
    Keyboard.dismiss();
    setShowCommentInput(false);
    setReplyingTo(null);
    setNewComment('');
  }, []);

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim() || !post) return;
    const token = await getToken();
    if (replyingTo) {
      const reply = await commentPost({
        token: token ?? '',
        post_id: post.id,
        content: newComment.trim(),
        parent_id: replyingTo.id,
        reply_to_id: replyingTo.id,
        root_id: replyingTo.top_comment_id ?? replyingTo.id ?? undefined,
        reply_to_name: replyingTo.author,
      });
      if (reply) {
        Keyboard.dismiss();
        await loadPost();
        setNewComment('');
        setReplyingTo(null);
        setShowCommentInput(false);
      }
    } else {
      const comment = await commentPost({
        token: token ?? '',
        post_id: post.id,
        content: newComment.trim(),
      });
      if (comment) {
        Keyboard.dismiss();
        await loadPost();
        setNewComment('');
        setShowCommentInput(false);
      }
    }
  }, [newComment, post, replyingTo, loadPost]);

  if (isLoading) {
    return (
      <View style={[styles.center, dark ? styles.bgDark : styles.bgLight]}>
        <ActivityIndicator size="large" color={colors.orange[500]} />
        <Text style={[styles.loadingText, { color: dark ? colors.gray[400] : colors.gray[500] }]}>
          加載中...
        </Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.center, dark ? styles.bgDark : styles.bgLight]}>
        <Text style={[styles.emptyText, { color: dark ? colors.gray[400] : colors.gray[500] }]}>
          該動態不存在或已刪除
        </Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>返回</Text>
        </Pressable>
      </View>
    );
  }

  const cardBg = dark ? '#0f172a' : '#fff';
  const textPrimary = dark ? '#f8fafc' : '#1f2937';
  const textSecondary = dark ? '#94a3b8' : '#6b7280';
  const borderColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return (
    <View style={[styles.container, dark && styles.bgDark]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
          <ArrowLeft size={20} color={textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>動態詳情</Text>
        <Pressable style={styles.headerBtn}>
          <MoreHorizontal size={20} color={textSecondary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: showCommentInput ? 140 : spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          {/* 作者信息区 */}
          <View style={[styles.authorRow, { borderBottomColor: borderColor }]}>
            <Image source={{ uri: imageUri(post.avatar) }} style={styles.detailAvatar} />
            <View style={styles.authorInfo}>
              <View style={styles.authorNameRow}>
                <Text style={[styles.detailAuthor, { color: textPrimary }]}>{post.author}</Text>
                <LevelBadge level={post.vipLevel === 'SVIP' ? 6 : post.isVIP ? 5 : 3} />
              </View>
              <Text style={[styles.detailTime, { color: textSecondary }]}>{post.time} 發布</Text>
            </View>
          </View>

          {/* 正文与图片 */}
          <View style={styles.detailContent}>
            <Text style={[styles.detailBody, { color: textPrimary }]}>
              {post.fullContent ?? post.content}
            </Text>
            {(post.userTags ?? []).length > 0 && (
              <View style={styles.detailTags}>
                {post.userTags!.map((tag, i) => (
                  <Text key={i} style={styles.detailTag}>{tag}</Text>
                ))}
              </View>
            )}
            {(() => {
              const allMedia = [...(post.images || []), ...(post.videos || [])];
              const mediaList = allMedia.map((url, i) => ({ url, key: `m-${i}-${url}` }));
              const images = mediaList.filter((m) => !isVideoUrl(m.url));
              const videos = mediaList.filter((m) => isVideoUrl(m.url));
              if (images.length === 0 && videos.length === 0) return null;
              const size = SCREEN_WIDTH - spacing.lg * 2;
              return (
                <View style={styles.detailImages}>
                  {images.map(({ url, key }) => (
                    <View key={key} style={[styles.detailImageWrap, { marginBottom: IMG_GAP }]}>
                      <Image
                        source={{ uri: imageUri(url) }}
                        style={[styles.detailImage, { width: size, height: size }]}
                        resizeMode="contain"
                      />
                    </View>
                  ))}
                  {videos.map(({ url, key }) => (
                    <DetailVideoBlock key={key} videoUrl={url} />
                  ))}
                </View>
              );
            })()}

            {/* 点赞、评论数 */}
            <View style={[styles.detailActions, { borderColor }]}>
              <Pressable onPress={handleLikePost} style={styles.detailAction}>
                <Heart
                  size={22}
                  color={post.isLiked ? '#f43f5e' : textSecondary}
                  fill={post.isLiked ? '#f43f5e' : 'none'}
                  strokeWidth={post.isLiked ? 0 : 2}
                />
                <Text style={[styles.detailActionText, { color: post.isLiked ? '#f43f5e' : textSecondary }]}>
                  {post.likes} 點讚
                </Text>
              </Pressable>
              <View style={styles.detailAction}>
                <MessageCircle size={22} color="#3b82f6" />
                <Text style={[styles.detailActionText, { color: '#3b82f6' }]}>{post.comments} 評論</Text>
              </View>
            </View>

            {/* 评论区：标题 + 写评论入口 */}
            <View style={[styles.commentsSection, { borderTopColor: borderColor }]}>
              <View style={styles.commentsHeader}>
                <Text style={[styles.commentsTitle, { color: textSecondary }]}>
                  全部評論 ({post.comments ?? post.commentList?.length ?? 0})
                </Text>
                <Pressable onPress={handleOpenCommentInput} style={[styles.writeCommentBtn, { borderColor }]}>
                  <MessageCircle size={14} color={colors.orange[500]} />
                  <Text style={styles.writeCommentBtnText}>寫評論</Text>
                </Pressable>
              </View>
              {(post.commentList?.length ?? 0) > 0 ? (
                <View style={styles.commentsList}>
                  {[...(post.commentList ?? [])].reverse().map((c, i) => (
                    <CommentItem
                      key={`${c.id}-${i}`}
                      comment={c}
                      dark={dark}
                      textPrimary={textPrimary}
                      textSecondary={textSecondary}
                      onLike={handleLikeComment}
                      onReply={handleReply}
                      onViewAllReplies={(cmt) => setRepliesModalComment(cmt)}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.commentsEmpty}>
                  <Text style={[styles.commentsEmptyText, { color: textSecondary }]}>暫無評論</Text>
                  <Pressable onPress={handleOpenCommentInput} style={[styles.emptyCommentCta, { borderColor }]}>
                    <Text style={[styles.emptyCommentCtaText, { color: colors.orange[500] }]}>來說一句...</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* 仅当用户点击「写评论」或「回复」时显示底部输入框；随键盘上移 */}
        {showCommentInput && (
          <View
            style={[
              styles.footer,
              {
                bottom: keyboardHeight,
                paddingBottom: insets.bottom + spacing.md,
                backgroundColor: cardBg,
                borderTopColor: borderColor,
              },
            ]}
          >
            {replyingTo ? (
              <View style={[styles.replyingBar, dark && styles.replyingBarDark]}>
                <Text style={styles.replyingText}>
                  <Reply size={12} style={{ marginRight: 4 }} /> 正在回覆 @{replyingTo.author}
                </Text>
                <Pressable onPress={handleCloseCommentInput}>
                  <X size={14} color={textSecondary} />
                </Pressable>
              </View>
            ) : (
              <View style={[styles.replyingBar, dark && styles.replyingBarDark]}>
                <Text style={styles.replyingText}>在動態下留言</Text>
                <Pressable onPress={handleCloseCommentInput}>
                  <X size={14} color={textSecondary} />
                </Pressable>
              </View>
            )}
            <View style={[styles.inputRow, dark && styles.inputRowDark]}>
              <TextInput
                ref={commentInputRef}
                style={[styles.input, { color: textPrimary }]}
                placeholder={replyingTo ? `回覆給 @${replyingTo.author}...` : '說點溫馨的話吧...'}
                placeholderTextColor={textSecondary}
                value={newComment}
                onChangeText={setNewComment}
              />
              {newComment.trim() ? (
                <Pressable onPress={handleAddComment} style={styles.sendBtn}>
                  <Send size={18} color="#fff" />
                </Pressable>
              ) : null}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* 回复详情弹窗：显示某条评论的全部回复 */}
      <Modal
        visible={repliesModalComment !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setRepliesModalComment(null)}
      >
        {repliesModalComment && (
          <View style={styles.repliesModalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setRepliesModalComment(null)} />
            <View style={[styles.repliesModalContent, { backgroundColor: cardBg }]}>
              <View style={[styles.repliesModalHeader, { borderBottomColor: borderColor }]}>
                <Text style={[styles.repliesModalTitle, { color: textPrimary }]}>全部回覆</Text>
                <Pressable onPress={() => setRepliesModalComment(null)} style={styles.repliesModalClose}>
                  <X size={20} color={textSecondary} />
                </Pressable>
              </View>
              <ScrollView style={styles.repliesModalScroll} showsVerticalScrollIndicator={false}>
                <View style={[styles.repliesModalParent, { borderBottomColor: borderColor }]}>
                  <Image
                    source={{ uri: imageUri(repliesModalComment.avatar) }}
                    style={[styles.commentAvatar, { width: 40, height: 40, borderRadius: 20, marginRight: spacing.md }]}
                  />
                  <View style={styles.commentBody}>
                    <View style={styles.commentHeader}>
                      <Text style={[styles.commentAuthor, { color: textPrimary }]}>{repliesModalComment.author}</Text>
                      <LevelBadge level={repliesModalComment.vipLevel === 'SVIP' ? 6 : repliesModalComment.isVIP ? 5 : 3} />
                    </View>
                    <Text style={[styles.commentContent, { color: textPrimary }]}>{repliesModalComment.content}</Text>
                    <Text style={[styles.commentTime, { color: textSecondary }]}>{repliesModalComment.time}</Text>
                  </View>
                </View>
                <View style={styles.repliesModalList}>
                  {(repliesModalComment.replies ?? []).map((r) => (
                    <CommentItem
                      key={`${repliesModalComment.id}-${r.id}`}
                      comment={r}
                      isReply
                      dark={dark}
                      textPrimary={textPrimary}
                      textSecondary={textSecondary}
                      onLike={handleLikeComment}
                      onReply={(id, author, top_comment_id) => {
                        setRepliesModalComment(null);
                        setReplyingTo({ id, author, top_comment_id });
                        setShowCommentInput(true);
                      }}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgDark: { backgroundColor: '#020617' },
  bgLight: { backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, fontSize: 12, fontWeight: '800' },
  emptyText: { fontSize: 14, marginBottom: spacing.lg },
  backBtn: { backgroundColor: colors.orange[500], paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { color: '#fff', fontWeight: '800' },
  pressed: { opacity: 0.9 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 14, fontWeight: '800' },

  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  authorInfo: { flex: 1, minWidth: 0 },
  detailAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: spacing.md, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailAuthor: { fontSize: 14, fontWeight: '800' },
  detailTime: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  detailContent: { padding: spacing.lg },
  detailBody: { fontSize: 15, lineHeight: 24, marginBottom: spacing.md },
  detailTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  detailTag: { fontSize: 14, fontWeight: '800', color: '#2563eb' },
  detailImages: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.xl },
  detailImageWrap: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  videoLoadFailedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLoadFailedText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  detailImage: {},
  detailActions: { flexDirection: 'row', alignItems: 'center', gap: 40, paddingVertical: spacing.lg, borderTopWidth: 1, borderBottomWidth: 1 },
  detailAction: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailActionText: { fontSize: 12, fontWeight: '800' },

  commentsSection: { marginTop: spacing.lg, paddingTop: spacing.xl, borderTopWidth: 1 },
  commentsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  commentsTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  writeCommentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  writeCommentBtnText: { fontSize: 12, fontWeight: '800', color: colors.orange[500] },
  commentsList: { marginTop: 0 },
  commentsEmpty: { paddingVertical: spacing['2xl'], alignItems: 'center', gap: spacing.md },
  commentsEmptyText: { fontSize: 14 },
  emptyCommentCta: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  emptyCommentCtaText: { fontSize: 13, fontWeight: '800' },

  commentItem: { flexDirection: 'row', marginBottom: spacing.xl },
  commentItemReply: { marginBottom: spacing.lg },
  commentAvatar: { marginRight: spacing.md },
  commentBody: { flex: 1, minWidth: 0 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  commentAuthor: { fontSize: 14, fontWeight: '800' },
  commentAuthorSmall: { fontSize: 12 },
  commentContent: { fontSize: 13.5, lineHeight: 20, marginBottom: 4 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  commentTime: { fontSize: 10, fontWeight: '700' },
  commentActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  commentActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentActionText: { fontSize: 10, fontWeight: '700' },
  repliesWrap: { marginTop: spacing.md, marginLeft: 0, paddingLeft: 0 },
  viewAllRepliesBtn: { marginTop: spacing.sm, paddingVertical: 4 },
  viewAllRepliesText: { fontSize: 12, fontWeight: '800' },

  repliesModalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  repliesModalContent: { maxHeight: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  repliesModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1 },
  repliesModalTitle: { fontSize: 16, fontWeight: '800' },
  repliesModalClose: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  repliesModalScroll: { padding: spacing.lg, maxHeight: 360 },
  repliesModalParent: { flexDirection: 'row', paddingBottom: spacing.lg, marginBottom: spacing.lg, borderBottomWidth: 1 },
  repliesModalList: { marginTop: 0 },
  levelBadge: { paddingHorizontal: 2, paddingVertical: 1, borderRadius: 2, minWidth: 20, height: 11, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  levelBadgeText: { color: '#fff', fontSize: 7, fontWeight: '800' },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
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
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  inputRowDark: { backgroundColor: 'rgba(30,41,59,0.6)', borderColor: 'rgba(255,255,255,0.06)' },
  input: { flex: 1, fontSize: 12, fontWeight: '700', paddingVertical: 4 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.orange[500], alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  sendBtnDisabled: { opacity: 0.5 },
});
