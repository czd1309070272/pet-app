import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Heart, Trash2, Maximize2, X } from 'lucide-react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors, spacing, borderRadius } from '../../theme/tokens';
import { shadowGlass } from '../../theme/tokens';
import { COMMUNITY_LAYOUT } from '../community/constants';
import type { OrderedMediaItem } from './utils';
import { DiaryVideoThumbnail } from './DiaryVideoThumbnail';

/** 大图模式内联视频播放器，仅在有 uri 时挂载以便使用 useVideoPlayer */
function InlineVideoPlayer({
  uri,
  width,
  height,
  borderRadius: radius = 16,
}: {
  uri: string;
  width: number;
  height: number;
  borderRadius?: number;
}) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = false;
    p.loop = false;
  });
  useEffect(() => {
    player.play();
    // 不在卸载时调用 player.pause()，避免原生播放器已销毁导致 NativeSharedObjectNotFoundException
  }, [player]);
  return (
    <View style={[styles.largeViewImagePage, { width, height }]}>
      <VideoView
        style={[styles.largeViewImage, { width, height, borderRadius: radius }]}
        player={player}
        contentFit="contain"
        nativeControls
      />
    </View>
  );
}

const styles = StyleSheet.create({
  entryCardShadowWrap: {
    marginBottom: spacing.xl,
    borderRadius: 32,
    overflow: 'visible',
  },
  entryCard: {
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  entryImageSingleWrap: { width: '100%', alignItems: 'center' },
  entryImage: { width: '100%', height: 192 },
  entryImageGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
  },
  entryImageGridCell: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  entryImageGridOverlay: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryImageGridOverlayText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  entryBody: { padding: spacing.xl },
  entryHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  entryDate: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  entryHeadRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  styleTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  styleTagText: { fontSize: 9, fontWeight: '800', color: colors.orange[500] },
  deleteConfirmRow: { flexDirection: 'row', gap: 8 },
  deleteConfirmBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  deleteConfirmBtnText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  deleteCancelBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  deleteCancelBtnText: { fontSize: 10, fontWeight: '800' },
  entryContent: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  entryActions: {
    flexDirection: 'row',
    gap: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  entryAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  entryActionText: { fontSize: 10, fontWeight: '700' },
  // 大图模式（占满九宫格区域）
  largeViewWrap: {
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  largeViewImagePage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeViewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  largeViewHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    zIndex: 2,
  },
  largeViewFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    zIndex: 2,
  },
  largeViewIndexText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  largeViewCloseBtn: { padding: spacing.xs },
  largeViewExpandBtn: { padding: spacing.xs },
});

const MAX_CELLS = 9;

export function DiaryEntryCard({
  entryId,
  orderedMedia,
  images,
  entryDate,
  entryStyle,
  content,
  cellSize,
  dark,
  glassBg,
  glassBorder,
  textColor,
  subColor,
  showDeleteConfirm,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onVideoPress,
  onImagePress,
}: {
  entryId: string;
  orderedMedia: OrderedMediaItem[];
  images: string[];
  entryDate: string;
  entryStyle: string;
  content: string;
  cellSize: number;
  dark: boolean;
  glassBg: string;
  glassBorder: string;
  textColor: string;
  subColor: string;
  showDeleteConfirm: boolean;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onVideoPress: (uri: string) => void;
  onImagePress: (urls: string[], index: number) => void;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const [largeViewIndex, setLargeViewIndex] = useState<number | null>(null);
  const [inlinePlayingUri, setInlinePlayingUri] = useState<string | null>(null);
  const largeViewListRef = useRef<FlatList<OrderedMediaItem> | null>(null);

  const totalMedia = orderedMedia.length;
  const overflowCount = totalMedia > MAX_CELLS ? totalMedia - (MAX_CELLS - 1) : 0;
  const cellCount = overflowCount > 0 ? MAX_CELLS - 1 : totalMedia;
  const showGrid = totalMedia > 1;
  let imageIndex = 0;

  // 大图模式容器尺寸：与九宫格区域一致
  const largeViewWidth = windowWidth - spacing.xl * 2;
  const largeViewHeight =
    2 * spacing.sm + 3 * cellSize + 2 * COMMUNITY_LAYOUT.IMG_GAP;

  const pageWidth = largeViewWidth;
  const handleLargeViewScrollEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / pageWidth);
    const next = Math.min(
      Math.max(0, index),
      Math.max(0, orderedMedia.length - 1)
    );
    setLargeViewIndex(next);
    setInlinePlayingUri(null);
  };

  const openFullscreen = () => {
    if (largeViewIndex === null) return;
    const item = orderedMedia[largeViewIndex];
    if (!item) return;
    if (item.type === 'video') {
      onVideoPress(item.uri);
      return;
    }
    const imageIndexInImages = orderedMedia
      .slice(0, largeViewIndex + 1)
      .filter((m) => m.type === 'image').length - 1;
    onImagePress(images, Math.max(0, imageIndexInImages));
  };

  const renderMediaCell = (i: number) => {
    const item = orderedMedia[i];
    if (!item) return null;
    const cellStyle = { width: cellSize, height: cellSize };
    if (item.type === 'video') {
      return (
        <DiaryVideoThumbnail
          key={`${entryId}-v-${i}`}
          videoUri={item.uri}
          thumbnailUri={item.thumbnailUri}
          style={[styles.entryImageGridCell, cellStyle]}
          playSize={showGrid ? 28 : 40}
          onPress={() => setLargeViewIndex(i)}
        />
      );
    }
    const idx = imageIndex++;
    return (
      <Pressable
        key={`${entryId}-img-${i}`}
        style={[styles.entryImageGridCell, cellStyle]}
        onPress={() => setLargeViewIndex(idx)}
      >
        <Image
          source={{ uri: item.uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      </Pressable>
    );
  };

  return (
    <View
      style={[styles.entryCardShadowWrap, dark ? shadowGlass.dark : shadowGlass.light]}
    >
      <View
        style={[
          styles.entryCard,
          {
            backgroundColor: glassBg,
            borderColor: glassBorder,
            borderTopColor: dark
              ? 'rgba(255,255,255,0.14)'
              : 'rgba(255,255,255,0.55)',
          },
        ]}
      >
        {orderedMedia.length > 0 &&
          (largeViewIndex !== null && orderedMedia.length > 0 ? (
            <View
              style={[
                styles.largeViewWrap,
                { width: largeViewWidth, height: largeViewHeight },
              ]}
            >
              <FlatList
                ref={largeViewListRef}
                data={orderedMedia}
                horizontal
                decelerationRate="fast"
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
                snapToAlignment="start"
                snapToOffsets={orderedMedia.map((_, i) => i * pageWidth)}
                initialScrollIndex={Math.min(
                  largeViewIndex,
                  orderedMedia.length - 1
                )}
                getItemLayout={(_, index) => ({
                  length: pageWidth,
                  offset: pageWidth * index,
                  index,
                })}
                keyExtractor={(item, i) =>
                  `${entryId}-lv-${i}-${item.type}-${item.uri}`
                }
                onMomentumScrollEnd={handleLargeViewScrollEnd}
                onScrollEndDrag={handleLargeViewScrollEnd}
                renderItem={({ item, index }) => {
                  const isCurrentPage = index === largeViewIndex;
                  const isVideoPlaying =
                    item.type === 'video' && inlinePlayingUri === item.uri;
                  if (item.type === 'video') {
                    if (isCurrentPage && isVideoPlaying) {
                      return (
                        <InlineVideoPlayer
                          uri={item.uri}
                          width={pageWidth}
                          height={largeViewHeight}
                          borderRadius={16}
                        />
                      );
                    }
                    return (
                      <View
                        style={[
                          styles.largeViewImagePage,
                          {
                            width: pageWidth,
                            height: largeViewHeight,
                          },
                        ]}
                      >
                        <DiaryVideoThumbnail
                          videoUri={item.uri}
                          thumbnailUri={item.thumbnailUri}
                          style={[
                            styles.largeViewImage,
                            {
                              width: pageWidth,
                              height: largeViewHeight,
                              borderRadius: 16,
                            },
                          ]}
                          playSize={56}
                          onPress={() => setInlinePlayingUri(item.uri)}
                        />
                      </View>
                    );
                  }
                  return (
                    <View
                      style={[
                        styles.largeViewImagePage,
                        {
                          width: pageWidth,
                          height: largeViewHeight,
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: item.uri }}
                        style={[
                          styles.largeViewImage,
                          {
                            width: pageWidth,
                            height: largeViewHeight,
                          },
                        ]}
                        resizeMode="contain"
                      />
                    </View>
                  );
                }}
              />
              <View style={styles.largeViewHeader} pointerEvents="box-none">
                <Pressable
                  onPress={() => {
                    setLargeViewIndex(null);
                    setInlinePlayingUri(null);
                  }}
                  style={styles.largeViewCloseBtn}
                  hitSlop={12}
                >
                  <X size={22} color="rgba(255,255,255,0.95)" />
                </Pressable>
                <Pressable
                  onPress={openFullscreen}
                  style={styles.largeViewExpandBtn}
                  hitSlop={12}
                >
                  <Maximize2 size={22} color="rgba(255,255,255,0.95)" />
                </Pressable>
              </View>
              <View style={styles.largeViewFooter} pointerEvents="box-none">
                <Text style={styles.largeViewIndexText}>
                  {largeViewIndex + 1}/{orderedMedia.length}
                </Text>
              </View>
            </View>
          ) : showGrid ? (
            <View
              style={[
                styles.entryImageGridWrap,
                { gap: COMMUNITY_LAYOUT.IMG_GAP },
              ]}
            >
              {Array.from({ length: cellCount }).map((_, i) =>
                renderMediaCell(i)
              )}
              {overflowCount > 0 && (
                <Pressable
                  style={[
                    styles.entryImageGridCell,
                    { width: cellSize, height: cellSize },
                  ]}
                  onPress={() =>
                    setLargeViewIndex(Math.max(0, orderedMedia.length - 1))
                  }
                >
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      styles.entryImageGridOverlay,
                    ]}
                  >
                    <Text style={styles.entryImageGridOverlayText}>
                      +{overflowCount}
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.entryImageSingleWrap}>
              {orderedMedia[0].type === 'video' ? (
                <DiaryVideoThumbnail
                  videoUri={orderedMedia[0].uri}
                  thumbnailUri={orderedMedia[0].thumbnailUri}
                  style={[styles.entryImage, { width: '100%', height: 192 }]}
                  playSize={40}
                  onPress={() => setLargeViewIndex(0)}
                />
              ) : (
              <Pressable onPress={() => setLargeViewIndex(0)}>
                  <Image
                    source={{ uri: orderedMedia[0].uri }}
                    style={styles.entryImage}
                    resizeMode="cover"
                  />
                </Pressable>
              )}
            </View>
          ))}

        <View style={styles.entryBody}>
          <View style={styles.entryHead}>
            <Text style={[styles.entryDate, { color: subColor }]}>
              {entryDate}
            </Text>
            <View style={styles.entryHeadRight}>
              <View
                style={[
                  styles.styleTag,
                  {
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    borderColor: 'rgba(249, 115, 22, 0.2)',
                  },
                ]}
              >
                <Text style={styles.styleTagText}>{entryStyle}</Text>
              </View>
              {showDeleteConfirm ? (
                <View style={styles.deleteConfirmRow}>
                  <Pressable
                    onPress={onDeleteConfirm}
                    style={styles.deleteConfirmBtn}
                  >
                    <Text style={styles.deleteConfirmBtnText}>確認</Text>
                  </Pressable>
                  <Pressable
                    onPress={onDeleteCancel}
                    style={styles.deleteCancelBtn}
                  >
                    <Text style={[styles.deleteCancelBtnText, { color: subColor }]}>
                      取消
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={onDeleteRequest}>
                  <Trash2 size={14} color={subColor} />
                </Pressable>
              )}
            </View>
          </View>
          <Text style={[styles.entryContent, { color: textColor }]}>
            {content}
          </Text>
          <View style={styles.entryActions}>
            <Pressable style={styles.entryAction}>
              <Heart size={16} color={subColor} />
              <Text style={[styles.entryActionText, { color: subColor }]}>
                收藏
              </Text>
            </Pressable>
            <Pressable style={styles.entryAction}>
              <Text style={[styles.entryActionText, { color: subColor }]}>
                分享
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
