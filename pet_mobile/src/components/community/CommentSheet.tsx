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
  const [expanded, setExpanded] = useState(false);
  const avatarSize = isReply ? 32 : 40;
  const replyCount = comment.replies?.length ?? 0;
  const hasReplies = replyCount > 0;
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
        {!isReply && hasReplies && (
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
                  — 展開 {replyCount} 條回覆
                </Text>
              </Pressable>
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
  repliesModalComment: Comment | null;
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
  onClose,
  onLike,
  onReply,
  onViewAllReplies,
  onCloseRepliesModal,
  onNewCommentChange,
  onClearReplyingTo,
  onSend,
  commentInputRef,
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
            >
              {(post.commentList?.length ?? 0) > 0 ? (
                <View style={styles.list}>
                  {[...(post.commentList ?? [])].reverse().map((c, i) => (
                    <CommentItem
                      key={`${c.id}-${i}`}
                      comment={c}
                      dark={dark}
                      textPrimary={textPrimary}
                      textSecondary={textSecondary}
                      onLike={onLike}
                      onReply={onReply}
                      onViewAllReplies={onViewAllReplies}
                    />
                  ))}
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
