/**
 * 社群主页：动态列表、发布、评论、媒体查看
 * 职责：状态管理、API 调用、组件编排
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Image,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Modal,
  Alert,
  Platform,
  Keyboard,
  InteractionManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, History, Send } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CommunityStackParamList } from '../navigation/types';
import type { Post, Comment } from '../types';
import { getCommunityPosts, createPost, likePost, commentPost, getPostDetail, getToken } from '../front_api';
import { useTabBarVisibility } from '../context/TabBarVisibilityContext';
import { useApp } from '../context/AppContext';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { colors, spacing } from '../theme/tokens';

import {
  COMMUNITY_LAYOUT,
  TAGS,
  MAX_MEDIA,
  imageUri,
  CommunityPostCard,
  CommunityCreateModal,
  CommentSheet,
  ImageViewerModal,
  FullscreenVideoModal,
  type PostMediaItem,
} from '../components/community';

type Nav = NativeStackNavigationProp<CommunityStackParamList, 'Community'>;

const { SCREEN_WIDTH, LIST_PADDING_H } = COMMUNITY_LAYOUT;

export default function CommunityScreen({
  navigation,
  route,
}: {
  navigation: Nav;
  route?: { params?: { openPost?: boolean } };
}) {
  const { isDarkMode } = useApp();
  const dark = isDarkMode;
  const insets = useSafeAreaInsets();
  const { reportScroll, setTabBarVisible } = useTabBarVisibility();

  // 帖子列表
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState(0);

  // 发布弹窗
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postTags, setPostTags] = useState<string[]>([]);
  const [postMedia, setPostMedia] = useState<PostMediaItem[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 媒体查看
  const [viewingImages, setViewingImages] = useState<string[] | null>(null);
  const [viewingImageIndex, setViewingImageIndex] = useState(0);
  const [viewingVideo, setViewingVideo] = useState<string | null>(null);
  const imageViewerScrollRef = useRef<ScrollView>(null);

  // 评论弹窗
  const [commentSheetPost, setCommentSheetPost] = useState<Post | null>(null);
  const [commentSheetLoading, setCommentSheetLoading] = useState(false);
  const [commentNewText, setCommentNewText] = useState('');
  const [commentReplyingTo, setCommentReplyingTo] = useState<{
    id: string;
    author: string;
    top_comment_id?: string;
  } | null>(null);
  const [repliesModalComment, setRepliesModalComment] = useState<Comment | null>(null);
  const commentInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (viewingImages != null && viewingImages.length > 0) {
      const t = setTimeout(() => {
        imageViewerScrollRef.current?.scrollTo({
          x: viewingImageIndex * SCREEN_WIDTH,
          animated: false,
        });
      }, 50);
      return () => clearTimeout(t);
    }
  }, [viewingImages]);

  const openCreateModal = useCallback(() => {
    setShowCreateModal(true);
    setTabBarVisible(false);
  }, [setTabBarVisible]);

  const closeCreateModal = useCallback(() => {
    if (isPosting) return;
    Keyboard.dismiss();
    setShowCreateModal(false);
    setTabBarVisible(true);
    setPostMedia([]);
  }, [isPosting, setTabBarVisible]);

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

  useEffect(() => {
    if (route?.params?.openPost) {
      setShowCreateModal(true);
      setTabBarVisible(false);
    }
  }, [route?.params?.openPost, setTabBarVisible]);

  // 提前请求相册权限，减少点击添加时等待
  useEffect(() => {
    if (showCreateModal) {
      ImagePicker.requestMediaLibraryPermissionsAsync();
    }
  }, [showCreateModal]);

  const lastScrollY = useRef(0);
  const [headerCompact, setHeaderCompact] = useState(false);

  const handleScroll = useCallback(
    (e: import('react-native').NativeSyntheticEvent<import('react-native').NativeScrollEvent>) => {
      reportScroll(e);
      const y = e.nativeEvent.contentOffset.y;
      const diff = y - lastScrollY.current;
      lastScrollY.current = y;
      if (y > 80 && diff > 5) setHeaderCompact(true);
      else if (y < 50 || diff < -20) setHeaderCompact(false);
    },
    [reportScroll]
  );

  const loadPosts = useCallback(async () => {
    const token = await getToken();
    const data = await getCommunityPosts({ token: token ?? '', num: 50, offset: 0 });
    setPosts(data);
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadPosts();
    setIsRefreshing(false);
  }, [loadPosts]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      await loadPosts();
      if (!cancelled) setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [loadPosts]);

  const filteredPosts = searchTerm.trim()
    ? posts.filter(
        (p) =>
          p.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.userTags ?? []).some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : posts;

  const handleLike = useCallback(async (postId: number) => {
    const token = await getToken();
    const res = await likePost({ token: token ?? '', target_id: postId, target_type: 'post' });
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: res.likes, isLiked: res.isLiked } : p))
    );
  }, []);

  const openCommentSheet = useCallback(async (post: Post) => {
    setCommentSheetPost(null);
    setCommentSheetLoading(true);
    try {
      const token = await getToken();
      const data = await getPostDetail({
        token: token ?? '',
        post_id: post.id,
        top_limit: 10,
        replies_limit: 10,
      });
      setCommentSheetPost(data ?? post);
    } finally {
      setCommentSheetLoading(false);
    }
  }, []);

  const closeCommentSheet = useCallback(() => {
    setCommentSheetPost(null);
    setCommentNewText('');
    setCommentReplyingTo(null);
    setRepliesModalComment(null);
    Keyboard.dismiss();
  }, []);

  const handleCommentSheetLike = useCallback(async (commentId: string) => {
    if (!commentSheetPost) return;
    const token = await getToken();
    const res = await likePost({
      token: token ?? '',
      target_id: commentId,
      target_type: 'comment',
    });
    setCommentSheetPost((p) => {
      if (!p) return null;
      const update = (list: Comment[]): Comment[] =>
        list.map((c) =>
          c.id === commentId
            ? { ...c, likes: res.likes, isLiked: res.isLiked }
            : { ...c, replies: c.replies?.length ? update(c.replies) : [] }
        );
      return { ...p, commentList: update(p.commentList ?? []) };
    });
  }, [commentSheetPost]);

  const handleCommentSheetReply = useCallback((id: string, author: string, top_comment_id?: string) => {
    setCommentReplyingTo({ id, author, top_comment_id });
    setTimeout(() => commentInputRef.current?.focus(), 150);
  }, []);

  const handleCommentSheetAdd = useCallback(async () => {
    if (!commentNewText.trim() || !commentSheetPost) return;
    const token = await getToken();
    const updateCount = (fresh: Post | null) =>
      fresh ? (fresh.commentList?.length ?? fresh.comments ?? 0) : commentSheetPost.comments + 1;

    if (commentReplyingTo) {
      const reply = await commentPost({
        token: token ?? '',
        post_id: commentSheetPost.id,
        content: commentNewText.trim(),
        parent_id: commentReplyingTo.id,
        reply_to_id: commentReplyingTo.id,
        root_id: commentReplyingTo.top_comment_id ?? commentReplyingTo.id ?? undefined,
        reply_to_name: commentReplyingTo.author,
      });
      if (reply) {
        Keyboard.dismiss();
        const fresh = await getPostDetail({
          token: token ?? '',
          post_id: commentSheetPost.id,
          top_limit: 10,
          replies_limit: 10,
        });
        setCommentSheetPost(fresh ?? commentSheetPost);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === commentSheetPost.id ? { ...p, comments: updateCount(fresh) } : p
          )
        );
        setCommentNewText('');
        setCommentReplyingTo(null);
      }
    } else {
      const comment = await commentPost({
        token: token ?? '',
        post_id: commentSheetPost.id,
        content: commentNewText.trim(),
      });
      if (comment) {
        Keyboard.dismiss();
        const fresh = await getPostDetail({
          token: token ?? '',
          post_id: commentSheetPost.id,
          top_limit: 10,
          replies_limit: 10,
        });
        setCommentSheetPost(fresh ?? commentSheetPost);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === commentSheetPost.id ? { ...p, comments: updateCount(fresh) } : p
          )
        );
        setCommentNewText('');
      }
    }
  }, [commentNewText, commentSheetPost, commentReplyingTo]);

  const handlePost = useCallback(async () => {
    if (!postContent.trim()) return;
    setIsPosting(true);
    try {
      const tagRegex = /#[\w\u4e00-\u9fa5]+/g;
      const parsedTags = postContent.match(tagRegex) ?? [];
      const tags = [...new Set([...postTags, ...parsedTags])];
      const images = postMedia.filter((m) => m.type === 'image').map((m) => m.uri);
      const videos = postMedia.filter((m) => m.type === 'video').map((m) => m.uri);
      const token = await getToken();
      const newPost = await createPost({
        token: token ?? '',
        content: postContent,
        images,
        videos: videos.length ? videos : undefined,
        tags,
      });
      if (newPost) {
        setPosts((prev) => [newPost, ...prev]);
        setShowCreateModal(false);
        setTabBarVisible(true);
        setPostContent('');
        setPostTags([]);
        setPostMedia([]);
      }
    } finally {
      setIsPosting(false);
    }
  }, [postContent, postTags, postMedia, setTabBarVisible]);

  const isAssetVideo = useCallback(
    (a: {
      type?: string | null;
      duration?: number | null;
      mimeType?: string | null;
      fileName?: string | null;
      uri: string;
    }) => {
      if (a.type === 'video' || a.type === 'pairedVideo') return true;
      if (a.duration != null && a.duration > 0) return true;
      const mime = (a.mimeType ?? '').toLowerCase();
      if (mime.startsWith('video/')) return true;
      const name = (a.fileName ?? a.uri ?? '').toLowerCase();
      if (/\.(mp4|mov|avi|webm|mkv|m4v|3gp)(\?|$)/i.test(name)) return true;
      return false;
    },
    []
  );

  const appendAssetsToPostMedia = useCallback(
    (
      assets: {
        uri: string;
        type?: string | null;
        duration?: number | null;
        mimeType?: string | null;
        fileName?: string | null;
      }[],
      asType?: 'image' | 'video'
    ) => {
      setPostMedia((prev) => {
        const maxNew = MAX_MEDIA - prev.length;
        if (maxNew <= 0) return prev;
        const added: PostMediaItem[] = assets
          .slice(0, maxNew)
          .filter((a) => a.uri)
          .map((a) => ({
            uri: a.uri,
            type: asType ?? (isAssetVideo(a) ? 'video' : 'image'),
          }));
        return [...prev, ...added];
      });
    },
    [isAssetVideo]
  );

  const pickImagesOnly = useCallback(() => {
    if (postMedia.length >= MAX_MEDIA) {
      Alert.alert('提示', `最多只能上传 ${MAX_MEDIA} 个文件（图片+视频合计）`);
      return;
    }
    InteractionManager.runAfterInteractions(async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: MAX_MEDIA - postMedia.length,
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
      });
      if (!result.canceled && result.assets?.length) {
        appendAssetsToPostMedia(result.assets, 'image');
      }
    });
  }, [postMedia.length, appendAssetsToPostMedia]);

  const pickVideosOnly = useCallback(() => {
    if (postMedia.length >= MAX_MEDIA) {
      Alert.alert('提示', `最多只能上传 ${MAX_MEDIA} 个文件（图片+视频合计）`);
      return;
    }
    InteractionManager.runAfterInteractions(async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'videos',
        allowsMultipleSelection: true,
        selectionLimit: MAX_MEDIA - postMedia.length,
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
      });
      if (!result.canceled && result.assets?.length) {
        appendAssetsToPostMedia(result.assets, 'video');
      }
    });
  }, [postMedia.length, appendAssetsToPostMedia]);

  const onAddMedia = useCallback(() => {
    if (postMedia.length >= MAX_MEDIA) {
      Alert.alert('提示', `最多只能上传 ${MAX_MEDIA} 个文件（图片+视频合计）`);
      return;
    }
    Alert.alert('添加媒体', '请选择要添加的内容', [
      { text: '添加图片', onPress: pickImagesOnly },
      { text: '添加视频', onPress: pickVideosOnly },
      { text: '取消', style: 'cancel' as const },
    ]);
  }, [postMedia.length, pickImagesOnly, pickVideosOnly]);

  // 視頻縮略圖：延後到交互完成後生成，避免阻塞選擇器彈出
  useEffect(() => {
    const videosToProcess = postMedia.filter((m) => m.type === 'video' && !m.thumbnailUri);
    if (videosToProcess.length === 0) return;
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      Promise.all(
        videosToProcess.map(async (item) => {
          try {
            const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(item.uri, { time: 0 });
            return { videoUri: item.uri, thumbnailUri: thumbUri };
          } catch {
            return { videoUri: item.uri, thumbnailUri: null as string | null };
          }
        })
      ).then((results) => {
        if (cancelled) return;
        setPostMedia((prev) =>
          prev.map((m) => {
            const r = results.find((x) => x.videoUri === m.uri);
            if (r && r.thumbnailUri && m.type === 'video') {
              return { ...m, thumbnailUri: r.thumbnailUri };
            }
            return m;
          })
        );
      });
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [postMedia]);

  const removePostMedia = useCallback((uri: string) => {
    setPostMedia((prev) => prev.filter((m) => m.uri !== uri));
  }, []);

  const reorderPostMedia = useCallback((fromIndex: number, toIndex: number) => {
    setPostMedia((prev) => {
      const arr = [...prev];
      const [removed] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, removed);
      return arr;
    });
  }, []);

  const togglePostTag = useCallback((tag: string) => {
    setPostTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }, []);

  const handleVideoPress = useCallback((videoUri: string) => {
    setViewingVideo(videoUri);
  }, []);

  const bg = dark ? colors.slate[950] : colors.glassBg.light;
  const cardBg = dark ? colors.slate[900] : '#fff';
  const textPrimary = dark ? '#f8fafc' : '#1f2937';
  const textSecondary = dark ? '#94a3b8' : colors.gray[500];
  const borderColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const renderPost = useCallback(
    ({ item: post }: { item: Post }) => (
      <CommunityPostCard
        post={post}
        dark={dark}
        cardBg={cardBg}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        onLike={handleLike}
        onCommentPress={openCommentSheet}
        onVideoPress={handleVideoPress}
        onImagePress={(images, idx) => {
          setViewingImages(images);
          setViewingImageIndex(idx);
        }}
      />
    ),
    [dark, cardBg, textPrimary, textSecondary, handleLike, openCommentSheet, handleVideoPress]
  );

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header - 下滑隐藏搜索，tags 顶替；上滑显示搜索 */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: cardBg,
            borderBottomColor: borderColor,
            paddingTop: insets.top + spacing.sm,
          },
        ]}
      >
        {!headerCompact && (
          <View style={styles.searchRow}>
            <View style={[styles.searchWrap, dark && styles.searchWrapDark]}>
              <Search size={16} color={textSecondary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: textPrimary }]}
                placeholder="搜尋話題、動態..."
                placeholderTextColor={textSecondary}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
            <Pressable
              onPress={() => navigation.navigate('CommunityHistory')}
              style={({ pressed }) => [
                styles.historyBtn,
                dark && { backgroundColor: 'rgba(30,41,59,0.6)' },
                pressed && styles.pressed,
              ]}
            >
              <History size={18} color={textSecondary} />
            </Pressable>
          </View>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsScroll}
        >
          {TAGS.map((tag, i) => (
            <Pressable
              key={i}
              onPress={() => setActiveTag(i)}
              style={[
                styles.tagChip,
                activeTag === i ? styles.tagChipActive : dark ? styles.tagChipDark : styles.tagChipLight,
              ]}
            >
              <Text
                style={[styles.tagChipText, { color: activeTag === i ? '#fff' : textSecondary }]}
              >
                {tag}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.orange[500]} />
          <Text style={[styles.loadingText, { color: textSecondary }]}>正在連結寵友圈...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPost}
          contentContainerStyle={styles.listContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.orange[500]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                {searchTerm ? '沒有找到相關動態' : '暫無動態'}
              </Text>
            </View>
          }
        />
      )}

      <Pressable onPress={openCreateModal} style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
        <Send size={22} color="#fff" />
      </Pressable>

      <CommunityCreateModal
        visible={showCreateModal}
        dark={dark}
        postContent={postContent}
        postTags={postTags}
        postMedia={postMedia}
        isPosting={isPosting}
        keyboardHeight={keyboardHeight}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        onClose={closeCreateModal}
        onContentChange={setPostContent}
        onTagToggle={togglePostTag}
        onMediaReorder={reorderPostMedia}
        onMediaRemove={removePostMedia}
        onMediaAdd={onAddMedia}
        onSubmit={handlePost}
        onDismissKeyboard={() => Keyboard.dismiss()}
      />

      <Modal visible={viewingImages !== null && viewingImages.length > 0} transparent animationType="fade">
        <View style={styles.imageViewerOverlay}>
          <ImageViewerModal
            uris={viewingImages ?? []}
            scrollRef={imageViewerScrollRef}
            viewingImageIndex={viewingImageIndex}
            onIndexChange={setViewingImageIndex}
            onClose={() => setViewingImages(null)}
          />
          <View style={styles.imageViewerThumbBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imageViewerThumbContent}
            >
              {viewingImages?.map((uri, i) => (
                <Pressable
                  key={uri + i}
                  onPress={() => {
                    setViewingImageIndex(i);
                    imageViewerScrollRef.current?.scrollTo({
                      x: i * SCREEN_WIDTH,
                      animated: true,
                    });
                  }}
                  style={[
                    styles.imageViewerThumbWrap,
                    i === viewingImageIndex && styles.imageViewerThumbActive,
                  ]}
                >
                  <Image
                    source={{ uri: imageUri(uri) }}
                    style={styles.imageViewerThumb}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {viewingVideo && (
        <FullscreenVideoModal videoUri={viewingVideo} onClose={() => setViewingVideo(null)} />
      )}

      <CommentSheet
        visible={commentSheetPost !== null}
        loading={commentSheetLoading}
        post={commentSheetPost}
        dark={dark}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        cardBg={cardBg}
        borderColor={borderColor}
        insetsBottom={insets.bottom}
        insetsTop={insets.top}
        keyboardHeight={keyboardHeight}
        newComment={commentNewText}
        replyingTo={commentReplyingTo}
        repliesModalComment={repliesModalComment}
        onClose={closeCommentSheet}
        onLike={handleCommentSheetLike}
        onReply={handleCommentSheetReply}
        onViewAllReplies={setRepliesModalComment}
        onCloseRepliesModal={() => setRepliesModalComment(null)}
        onNewCommentChange={setCommentNewText}
        onClearReplyingTo={() => setCommentReplyingTo(null)}
        onSend={handleCommentSheetAdd}
        commentInputRef={commentInputRef}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', maxWidth: SCREEN_WIDTH },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  searchWrapDark: {
    backgroundColor: 'rgba(30,41,59,0.6)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600', paddingVertical: 0 },
  historyBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  tagsScroll: { flexDirection: 'row', gap: 8, paddingRight: spacing.lg },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    minHeight: 30,
    justifyContent: 'center',
  },
  tagChipActive: {
    backgroundColor: colors.orange[500],
    shadowColor: colors.orange[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  tagChipLight: { backgroundColor: 'rgba(0,0,0,0.06)' },
  tagChipDark: { backgroundColor: 'rgba(30,41,59,0.6)' },
  tagChipText: { fontSize: 12, fontWeight: '700' },
  listContent: { paddingHorizontal: LIST_PADDING_H, paddingBottom: 120, paddingTop: spacing.sm },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, fontSize: 14, fontWeight: '600', opacity: 0.8 },
  emptyWrap: { paddingVertical: 64, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, fontWeight: '600', opacity: 0.7 },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.orange[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.orange[600],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
  },
  imageViewerThumbBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  imageViewerThumbContent: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  imageViewerThumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  imageViewerThumbActive: { borderColor: '#fff' },
  imageViewerThumb: { width: '100%', height: '100%' },
});
