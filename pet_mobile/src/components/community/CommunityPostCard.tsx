/**
 * 社群动态卡片
 */
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { MessageCircle, Heart, Share2, TrendingUp } from 'lucide-react-native';
import type { Post } from '../../types';
import { LevelBadge } from './LevelBadge';
import { CommunityMediaGrid } from './CommunityMediaGrid';
import { imageUri, isVideoUri } from './utils';
import { COMMUNITY_LAYOUT } from './constants';
import { spacing, borderRadius } from '../../theme/tokens';

const { AVATAR_GAP } = COMMUNITY_LAYOUT;

export interface CommunityPostCardProps {
  post: Post;
  dark: boolean;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  onLike: (postId: number) => void;
  onCommentPress: (post: Post) => void;
  onVideoPress: (videoUri: string) => void;
  onImagePress: (images: string[], index: number) => void;
}

export function CommunityPostCard({
  post,
  dark,
  cardBg,
  textPrimary,
  textSecondary,
  onLike,
  onCommentPress,
  onVideoPress,
  onImagePress,
}: CommunityPostCardProps) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          shadowColor: dark ? '#000' : '#000',
          shadowOpacity: dark ? 0.2 : 0.08,
        },
      ]}
    >
      <View style={styles.row}>
        <Image
          source={{ uri: imageUri(post.avatar) }}
          style={[styles.avatar, dark && { borderColor: 'rgba(255,255,255,0.15)' }]}
        />
        <View style={styles.body}>
          <View style={styles.cardHeader}>
            <View style={styles.authorRow}>
              <Text style={[styles.authorName, { color: textPrimary }]} numberOfLines={1}>
                {post.author}
              </Text>
              <LevelBadge level={post.vipLevel === 'SVIP' ? 6 : post.isVIP ? 5 : 3} />
              {post.isV && <TrendingUp size={10} color="#eab308" />}
            </View>
            <Text style={[styles.time, { color: textSecondary }]}>
              {post.time ? `發布於 ${post.time}` : ''}
            </Text>
          </View>
          <Text style={[styles.content, { color: textPrimary }]} numberOfLines={6}>
            {post.content}
          </Text>
          {(post.userTags ?? []).length > 0 && (
            <View style={styles.tagsRow}>
              {post.userTags!.map((tag, i) => (
                <Text key={i} style={styles.tag}>
                  {tag}
                </Text>
              ))}
            </View>
          )}
          {(post.orderedMedia?.length || post.images?.length || post.videos?.length) ? (
            <CommunityMediaGrid
              items={
                post.orderedMedia?.length
                  ? post.orderedMedia.map((uri) => ({
                      uri,
                      type: (isVideoUri(uri) ? 'video' : 'image') as 'image' | 'video',
                    }))
                  : [
                      ...(post.images || []).map((uri) => ({
                        uri,
                        type: (isVideoUri(uri) ? 'video' : 'image') as 'image' | 'video',
                      })),
                      ...(post.videos || []).map((uri) => ({ uri, type: 'video' as const })),
                    ]
              }
              onImagePress={(url) => {
                const ordered = post.orderedMedia ?? [...(post.images || []), ...(post.videos || [])];
                const imgList = ordered.filter((u) => !isVideoUri(u));
                const idx = imgList.indexOf(url);
                onImagePress(imgList, idx >= 0 ? idx : 0);
              }}
              onVideoPress={onVideoPress}
            />
          ) : null}
          <View style={styles.actionsRow}>
            <View style={styles.actionItem}>
              <Share2 size={22} color={textSecondary} />
              <Text style={[styles.actionText, { color: textSecondary }]}>分享</Text>
            </View>
            <Pressable onPress={() => onCommentPress(post)} style={styles.actionItem} hitSlop={8}>
              <MessageCircle size={22} color={textSecondary} />
              <Text style={[styles.actionText, { color: textSecondary }]}>{post.comments}</Text>
            </Pressable>
            <Pressable onPress={() => onLike(post.id)} style={styles.actionItem} hitSlop={8}>
              <Heart
                size={22}
                color={post.isLiked ? '#f43f5e' : textSecondary}
                fill={post.isLiked ? '#f43f5e' : 'none'}
                strokeWidth={post.isLiked ? 0 : 2}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: post.isLiked ? '#f43f5e' : textSecondary },
                ]}
              >
                {post.likes}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 0,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  row: { flexDirection: 'row' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    marginRight: AVATAR_GAP,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  body: { flex: 1, minWidth: 0, overflow: 'hidden' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, minWidth: 0 },
  authorName: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  time: { fontSize: 12, fontWeight: '600', opacity: 0.75 },
  content: { fontSize: 14, lineHeight: 22, marginBottom: 4, letterSpacing: 0.2 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  tag: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3xl'],
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 12, fontWeight: '700' },
});
