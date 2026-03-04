import React, { useState, useMemo } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Plus,
} from 'lucide-react-native';
import type { VideoFeedItem } from './types';
import { parseDescription } from './utils';
import { videoFeedStyles } from './styles';
import { VideoPlayerLayer } from './VideoPlayerLayer';
import { spacing } from '../../theme/tokens';
import { ensureImageUri } from '../../utils/imageUri';

export const VideoCell = React.memo(function VideoCell({
  item,
  index,
  isActive,
  isScreenFocused,
  onLike,
  onCollect,
  onComment,
  onShare,
}: {
  item: VideoFeedItem;
  index: number;
  isActive: boolean;
  isScreenFocused: boolean;
  onLike: (id: string) => void;
  onCollect: (id: string) => void;
  onComment: (id: string) => void;
  onShare: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom || 24;
  const hasVideo = Boolean(item.videoUrl);
  const [retryKey, setRetryKey] = useState(0);
  const descParts = useMemo(
    () => parseDescription(item.description),
    [item.description]
  );
  const sideBarStyle = useMemo(
    () => [videoFeedStyles.sideBar, { bottom: safeBottom + 58 }],
    [safeBottom]
  );
  const infoBarStyle = useMemo(
    () => [videoFeedStyles.infoBar, { bottom: safeBottom + 30, left: spacing.lg }],
    [safeBottom]
  );

  return (
    <View style={videoFeedStyles.cell}>
      {/* 視頻層：expo-video（有 videoUrl）或封面圖；僅在頁面聚焦且為當前項時播放 */}
      {hasVideo ? (
        <VideoPlayerLayer
          key={`${item.id}-${retryKey}`}
          videoUrl={item.videoUrl!}
          coverUrl={item.coverUrl}
          isActive={isActive && isScreenFocused}
          onRetry={() => setRetryKey((k) => k + 1)}
        />
      ) : (
        <>
          <Image source={{ uri: ensureImageUri(item.coverUrl) }} style={videoFeedStyles.cover} resizeMode="cover" />
          <View style={videoFeedStyles.coverOverlay} />
        </>
      )}

      {/* 右側：頭像 + 關注 + 點讚 / 評論 / 收藏 / 分享（TikTok 式豎排） */}
      <View style={sideBarStyle}>
        <Pressable style={videoFeedStyles.avatarWrap}>
          <Image source={{ uri: ensureImageUri(item.avatarUrl) }} style={videoFeedStyles.avatar} />
          <View style={videoFeedStyles.followBtn}>
            <Plus size={16} color="#fff" strokeWidth={2.5} />
          </View>
          <Text style={videoFeedStyles.followLabel}>關注</Text>
        </Pressable>
        <Pressable onPress={() => onLike(item.id)} style={videoFeedStyles.actionCol}>
          <Heart
            size={38}
            color="rgba(255,255,255,0.75)"
            fill={item.isLiked ? '#fe2c55' : 'none'}
            strokeWidth={2}
          />
          <Text style={videoFeedStyles.actionCount}>
            {item.likes >= 10000 ? `${(item.likes / 10000).toFixed(1)}w` : String(item.likes)}
          </Text>
        </Pressable>
        <Pressable onPress={() => onComment(item.id)} style={videoFeedStyles.actionCol}>
          <MessageCircle size={36} color="rgba(255,255,255,0.75)" strokeWidth={2} />
          <Text style={videoFeedStyles.actionCount}>
            {item.comments >= 10000 ? `${(item.comments / 10000).toFixed(1)}w` : item.comments}
          </Text>
        </Pressable>
        <Pressable onPress={() => onCollect(item.id)} style={videoFeedStyles.actionCol}>
          <Bookmark
            size={32}
            color="rgba(255,255,255,0.75)"
            fill={item.isCollected ? 'rgba(255,255,255,0.75)' : 'none'}
            strokeWidth={2}
          />
          <Text style={videoFeedStyles.actionLabel}>收藏</Text>
        </Pressable>
        <Pressable onPress={() => onShare(item.id)} style={videoFeedStyles.actionCol}>
          <Share2 size={30} color="rgba(255,255,255,0.75)" strokeWidth={2} />
          <Text style={videoFeedStyles.actionLabel}>分享</Text>
        </Pressable>
      </View>

      {/* 左下：用戶名 + 簡介（TikTok 風格，簡介內 #tags 高亮） */}
      <View style={infoBarStyle}>
        <View style={videoFeedStyles.userRow}>
          <Text style={videoFeedStyles.username}>{item.username}</Text>
        </View>
        <Text style={videoFeedStyles.description} numberOfLines={4}>
          {descParts.map((part, i) =>
            part.type === 'tag' ? (
              <Text key={i} style={videoFeedStyles.tag}>
                {part.value}{' '}
              </Text>
            ) : (
              <Text key={i} style={videoFeedStyles.descriptionText}>
                {part.value}
              </Text>
            )
          )}
        </Text>
      </View>
    </View>
  );
});
