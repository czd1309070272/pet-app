import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Animated,
  StyleSheet,
  FlatList,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Heart, Trash2, Maximize2, X, Check, ChevronDown, ChevronRight, Pencil } from 'lucide-react-native';
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
  entryImage: { width: '100%', height: 220 },
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
  generatedSection: {
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  generatedLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  generatedLabel: { fontSize: 13, fontWeight: '800', marginLeft: spacing.xl },
  generatedArrowWrap: { padding: spacing.xs, marginRight: spacing.sm },
  generatedActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: spacing.md,
  },
  generatedActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
  },
  generatedActionBtnText: { fontSize: 12, fontWeight: '700' },
  moodPopupBar: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodPopupBtnText: { fontSize: 14, fontWeight: '800', color: colors.orange[600] },
  moodSelectCheckbox: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodSelectCheckboxSelected: {
    borderColor: colors.orange[500],
    backgroundColor: colors.orange[500],
  },
  moodSelectCheckboxSingle: { top: 8, right: 8, width: 26, height: 26, borderRadius: 13 },
  entryImageSinglePress: { width: '100%' },
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

export interface DiaryEntryCardProps {
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
  onEntryPress?: () => void;
  showMoodPopup?: boolean;
  moodSelectMode?: boolean;
  selectedMoodImageUrls?: string[];
  onMoodBarPress?: () => void;
  onMoodImageToggle?: (url: string) => void;
  generatedResult?: { comicUrls: string[] };
  onDeleteGeneratedComic?: () => void;
  onRegenerateComic?: () => void;
  onEditGeneratedComic?: () => void;
}

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
  onEntryPress,
  showMoodPopup = false,
  moodSelectMode = false,
  selectedMoodImageUrls = [],
  onMoodBarPress,
  onMoodImageToggle,
  generatedResult,
  onDeleteGeneratedComic,
  onRegenerateComic,
  onEditGeneratedComic,
}: DiaryEntryCardProps) {
  const hasImages = images.length > 0;
  const { width: windowWidth } = useWindowDimensions();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [largeViewIndex, setLargeViewIndex] = useState<number | null>(null);
  const [comicLargeViewIndex, setComicLargeViewIndex] = useState<number | null>(null);
  const [isComicVisible, setIsComicVisible] = useState(true);
  const comicLargeViewListRef = useRef<FlatList<string> | null>(null);

  const handlePressIn = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 80,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 8,
    }).start();
  }, [scaleAnim]);
  const [inlinePlayingUri, setInlinePlayingUri] = useState<string | null>(null);
  const largeViewListRef = useRef<FlatList<OrderedMediaItem> | null>(null);

  const totalMedia = orderedMedia.length;
  const overflowCount = totalMedia > MAX_CELLS ? totalMedia - (MAX_CELLS - 1) : 0;
  const cellCount = overflowCount > 0 ? MAX_CELLS - 1 : totalMedia;
  const showGrid = totalMedia > 1;
  let imageIndex = 0;

  // 大图模式容器尺寸：与九宫格区域一致，便于居中
  const largeViewWidth = 3 * cellSize + 2 * COMMUNITY_LAYOUT.IMG_GAP;
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
    const isImageSelected = selectedMoodImageUrls.includes(item.uri);
    if (moodSelectMode) {
      return (
        <Pressable
          key={`${entryId}-img-${i}`}
          style={[styles.entryImageGridCell, cellStyle]}
          onPress={() => onMoodImageToggle?.(item.uri)}
        >
          <Image
            source={{ uri: item.uri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View
            style={[
              styles.moodSelectCheckbox,
              isImageSelected && styles.moodSelectCheckboxSelected,
            ]}
          >
            {isImageSelected ? (
              <Check size={12} color="#fff" strokeWidth={3} />
            ) : null}
          </View>
        </Pressable>
      );
    }
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
    <Animated.View
      style={[
        styles.entryCardShadowWrap,
        dark ? shadowGlass.dark : shadowGlass.light,
        { transform: [{ scale: scaleAnim }] },
      ]}
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
        {showMoodPopup && (
          <Pressable
            onPress={onMoodBarPress}
            style={[
              styles.moodPopupBar,
              { backgroundColor: dark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)' },
            ]}
          >
            <Text style={styles.moodPopupBtnText}>
              {moodSelectMode && selectedMoodImageUrls.length > 0
                ? `已选择${selectedMoodImageUrls.length}张图片`
                : '生成宠物心里话 / 漫画'}
            </Text>
          </Pressable>
        )}
        {orderedMedia.length > 0 &&
          (largeViewIndex !== null && orderedMedia.length > 0 ? (
            <View style={{ alignItems: 'center' }}>
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
          ) : (() => {
              const singleUri = orderedMedia[0].uri || images[0];
              const singleImageStyle = { width: largeViewWidth, height: 220 };
              return (
            <View style={[styles.entryImageSingleWrap, { width: largeViewWidth }]}>
              {orderedMedia[0].type === 'video' ? (
                <DiaryVideoThumbnail
                  videoUri={orderedMedia[0].uri}
                  thumbnailUri={orderedMedia[0].thumbnailUri}
                  style={[styles.entryImage, singleImageStyle]}
                  playSize={40}
                  onPress={() => setLargeViewIndex(0)}
                />
              ) : moodSelectMode ? (
                <Pressable
                  onPress={() => onMoodImageToggle?.(singleUri)}
                  style={styles.entryImageSinglePress}
                >
                  {singleUri ? (
                    <Image
                      key={singleUri}
                      source={{ uri: singleUri }}
                      style={[styles.entryImage, singleImageStyle]}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.entryImage, singleImageStyle, { backgroundColor: colors.gray[50] }]} />
                  )}
                  <View
                    style={[
                      styles.moodSelectCheckbox,
                      styles.moodSelectCheckboxSingle,
                      selectedMoodImageUrls.includes(singleUri) &&
                        styles.moodSelectCheckboxSelected,
                    ]}
                  >
                    {selectedMoodImageUrls.includes(singleUri) ? (
                      <Check size={14} color="#fff" strokeWidth={3} />
                    ) : null}
                  </View>
                </Pressable>
              ) : singleUri ? (
                <Pressable onPress={() => setLargeViewIndex(0)}>
                  <Image
                    key={singleUri}
                    source={{ uri: singleUri }}
                    style={[styles.entryImage, singleImageStyle]}
                    resizeMode="cover"
                  />
                </Pressable>
              ) : (
                <View style={[styles.entryImage, singleImageStyle, { backgroundColor: colors.gray[50] }]} />
              )}
            </View>
          ); })() )}

        <Pressable
          style={styles.entryBody}
          onPress={hasImages && onEntryPress ? onEntryPress : undefined}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
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
        </Pressable>

        {generatedResult && generatedResult.comicUrls.length > 0 && (() => {
          const comicUrls = generatedResult.comicUrls;
          const comicTotal = comicUrls.length;
          const comicOverflow = comicTotal > MAX_CELLS ? comicTotal - (MAX_CELLS - 1) : 0;
          const comicCellCount = comicOverflow > 0 ? MAX_CELLS - 1 : comicTotal;
          const comicShowGrid = comicTotal > 1;
          const comicPageWidth = largeViewWidth;
          const handleComicScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const offset = e.nativeEvent.contentOffset.x;
            const index = Math.round(offset / comicPageWidth);
            setComicLargeViewIndex(Math.min(Math.max(0, index), comicTotal - 1));
          };
          const openComicFullscreen = () => {
            if (comicLargeViewIndex === null) return;
            onImagePress(comicUrls, comicLargeViewIndex);
          };
          return (
            <View style={styles.generatedSection}>
              {isComicVisible ? (
                <>
                  <Pressable
                    style={styles.generatedLabelRow}
                    onPress={() => setIsComicVisible(false)}
                  >
                    <Text style={[styles.generatedLabel, { color: subColor }]}>
                      生成漫画
                    </Text>
                    <View style={styles.generatedArrowWrap}>
                      <ChevronDown size={22} color={subColor} />
                    </View>
                  </Pressable>
                  <View style={styles.generatedActions}>
                    <Pressable
                      onPress={onDeleteGeneratedComic}
                      style={[styles.generatedActionBtn, { borderColor: dark ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.5)' }]}
                    >
                      <Trash2 size={14} color="#ef4444" />
                      <Text style={[styles.generatedActionBtnText, { color: '#ef4444' }]}>删除</Text>
                    </Pressable>
                    <Pressable
                      onPress={onRegenerateComic}
                      style={[styles.generatedActionBtn, { borderColor: dark ? 'rgba(249,115,22,0.4)' : 'rgba(249,115,22,0.5)' }]}
                    >
                      <Text style={[styles.generatedActionBtnText, { color: colors.orange[500] }]}>重新生成</Text>
                    </Pressable>
                    <Pressable
                      onPress={onEditGeneratedComic}
                      style={[styles.generatedActionBtn, { borderColor: dark ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.5)' }]}
                    >
                      <Pencil size={14} color="#3b82f6" />
                      <Text style={[styles.generatedActionBtnText, { color: '#3b82f6' }]}>编辑</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <Pressable
                  style={styles.generatedLabelRow}
                  onPress={() => setIsComicVisible(true)}
                >
                  <Text style={[styles.generatedLabel, { color: subColor }]}>
                    生成漫画
                  </Text>
                  <View style={styles.generatedArrowWrap}>
                    <ChevronRight size={22} color={subColor} />
                  </View>
                </Pressable>
              )}
              {isComicVisible && (comicLargeViewIndex !== null ? (
                <View style={{ alignItems: 'center' }}>
                  <View style={[styles.largeViewWrap, { width: largeViewWidth, height: largeViewHeight }]}>
                    <FlatList
                      ref={comicLargeViewListRef}
                    data={comicUrls}
                    horizontal
                    decelerationRate="fast"
                    scrollEventThrottle={16}
                    showsHorizontalScrollIndicator={false}
                    snapToAlignment="start"
                    snapToOffsets={comicUrls.map((_, i) => i * comicPageWidth)}
                    initialScrollIndex={Math.min(comicLargeViewIndex, comicTotal - 1)}
                    getItemLayout={(_, index) => ({ length: comicPageWidth, offset: comicPageWidth * index, index })}
                    keyExtractor={(_, i) => `${entryId}-comic-lv-${i}`}
                    onMomentumScrollEnd={handleComicScrollEnd}
                    onScrollEndDrag={handleComicScrollEnd}
                    renderItem={({ item }) => (
                      <View style={[styles.largeViewImagePage, { width: comicPageWidth, height: largeViewHeight }]}>
                        <Image
                          source={{ uri: item }}
                          style={[styles.largeViewImage, { width: comicPageWidth, height: largeViewHeight, borderRadius: 16 }]}
                          resizeMode="contain"
                        />
                      </View>
                    )}
                  />
                  <View style={styles.largeViewHeader} pointerEvents="box-none">
                    <Pressable onPress={() => setComicLargeViewIndex(null)} style={styles.largeViewCloseBtn} hitSlop={12}>
                      <X size={22} color="rgba(255,255,255,0.95)" />
                    </Pressable>
                    <Pressable onPress={openComicFullscreen} style={styles.largeViewExpandBtn} hitSlop={12}>
                      <Maximize2 size={22} color="rgba(255,255,255,0.95)" />
                    </Pressable>
                  </View>
                  <View style={styles.largeViewFooter} pointerEvents="box-none">
                    <Text style={styles.largeViewIndexText}>
                      {comicLargeViewIndex + 1}/{comicTotal}
                    </Text>
                  </View>
                  </View>
                </View>
              ) : comicShowGrid ? (
                <View style={[styles.entryImageGridWrap, { gap: COMMUNITY_LAYOUT.IMG_GAP }]}>
                  {Array.from({ length: comicCellCount }).map((_, i) => (
                    <Pressable
                      key={`${entryId}-comic-${i}`}
                      style={[styles.entryImageGridCell, { width: cellSize, height: cellSize }]}
                      onPress={() => setComicLargeViewIndex(i)}
                    >
                      <Image source={{ uri: comicUrls[i] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    </Pressable>
                  ))}
                  {comicOverflow > 0 && (
                    <Pressable
                      style={[styles.entryImageGridCell, { width: cellSize, height: cellSize }]}
                      onPress={() => setComicLargeViewIndex(comicTotal - 1)}
                    >
                      <View style={[StyleSheet.absoluteFill, styles.entryImageGridOverlay]}>
                        <Text style={styles.entryImageGridOverlayText}>+{comicOverflow}</Text>
                      </View>
                    </Pressable>
                  )}
                </View>
              ) : (
                <View style={styles.entryImageSingleWrap}>
                  <Pressable onPress={() => setComicLargeViewIndex(0)}>
                    <Image
                      source={{ uri: comicUrls[0] }}
                      style={styles.entryImage}
                      resizeMode="cover"
                    />
                  </Pressable>
                </View>
              ))}
            </View>
          );
        })()}
      </View>
    </Animated.View>
  );
}
