/**
 * 社群媒体九宫格：图片+视频混合展示
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Play } from 'lucide-react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';
import type { PostMediaItem } from './types';
import { imageUri } from './utils';
import { COMMUNITY_LAYOUT, MEDIA_GRID, MAX_PREVIEW_IMAGES } from './constants';
import { colors, borderRadius } from '../../theme/tokens';

const { IMG_GAP } = COMMUNITY_LAYOUT;
const { IMG_CELL_SIZE, IMG_GRID_CONTENT_WIDTH } = MEDIA_GRID;

const feedVideoThumbCache = new Map<string, string>();

function FeedVideoThumbnail({
  videoUri,
  cellW,
  cellH,
  isSingle,
  onPress,
}: {
  videoUri: string;
  cellW: number;
  cellH: number;
  isSingle: boolean;
  onPress: () => void;
}) {
  const [thumbUri, setThumbUri] = useState<string | null>(() => feedVideoThumbCache.get(videoUri) ?? null);
  useEffect(() => {
    if (thumbUri) return;
    let c = false;
    VideoThumbnails.getThumbnailAsync(videoUri, { time: 0 })
      .then(({ uri }) => {
        if (!c) {
          feedVideoThumbCache.set(videoUri, uri);
          setThumbUri(uri);
        }
      })
      .catch(() => {});
    return () => { c = true; };
  }, [videoUri, thumbUri]);
  return (
    <Pressable onPress={onPress} style={[styles.imageGridItem, { width: cellW, height: cellH }]}>
      <View style={[styles.imageGridImg, styles.mediaGridVideoBg]}>
        {thumbUri ? (
          <>
            <Image source={{ uri: thumbUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={styles.videoPlayOverlay}>
              <View style={[styles.playIconWrap, isSingle && styles.playIconWrapLarge]}>
                <Play size={isSingle ? 32 : 18} color="#fff" fill="#fff" strokeWidth={0} />
              </View>
            </View>
          </>
        ) : (
          <View style={[styles.playIconWrap, isSingle && styles.playIconWrapLarge]}>
            <Play size={isSingle ? 32 : 18} color="#fff" fill="#fff" strokeWidth={0} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

export interface CommunityMediaGridProps {
  items: PostMediaItem[];
  onImagePress?: (url: string) => void;
  onVideoPress?: (videoUri: string) => void;
  onMorePress?: () => void;
  cellSize?: number;
  contentWidth?: number;
}

export function CommunityMediaGrid({
  items,
  onImagePress,
  onVideoPress,
  onMorePress,
  cellSize = IMG_CELL_SIZE,
  contentWidth = IMG_GRID_CONTENT_WIDTH,
}: CommunityMediaGridProps) {
  if (!items?.length) return null;
  const fullGridHeight = cellSize * 3 + IMG_GAP * 2;
  const isSingle = items.length === 1;
  const show = items.slice(0, MAX_PREVIEW_IMAGES);
  const moreCount = items.length - show.length;

  return (
    <View style={[styles.imageGridWrap, { width: contentWidth }]}>
      <View style={[styles.imageGrid, { flexDirection: 'row', flexWrap: 'wrap', gap: IMG_GAP, width: contentWidth }]}>
        {show.map((item, i) => {
          const isMoreCell = i === show.length - 1 && moreCount > 0;
          const isVideo = item.type === 'video';
          const cellW = isSingle ? contentWidth : cellSize;
          const cellH = isSingle ? fullGridHeight : cellSize;
          if (isVideo) {
            return (
              <View key={`${item.uri}-${i}`} style={{ width: cellW, height: cellH }}>
                <FeedVideoThumbnail
                  videoUri={item.uri}
                  cellW={cellW}
                  cellH={cellH}
                  isSingle={isSingle}
                  onPress={() => onVideoPress?.(item.uri)}
                />
                {isMoreCell ? (
                  <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={(e) => { e?.stopPropagation?.(); onMorePress?.(); }}
                  >
                    <View style={styles.imageGridMore}>
                      <Text style={styles.imageGridMoreText}>+{moreCount}</Text>
                      <Text style={styles.imageGridMoreLabel}>张</Text>
                    </View>
                  </Pressable>
                ) : null}
              </View>
            );
          }
          return (
            <Pressable
              key={`${item.uri}-${i}`}
              onPress={() => !isMoreCell && onImagePress?.(item.uri)}
              style={[styles.imageGridItem, { width: cellW, height: cellH }]}
            >
              <Image source={{ uri: imageUri(item.uri) }} style={styles.imageGridImg} resizeMode="cover" />
              {isMoreCell ? (
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={(e) => { e?.stopPropagation?.(); onMorePress?.(); }}
                >
                  <View style={styles.imageGridMore}>
                    <Text style={styles.imageGridMoreText}>+{moreCount}</Text>
                    <Text style={styles.imageGridMoreLabel}>张</Text>
                  </View>
                </Pressable>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageGridWrap: { alignSelf: 'flex-start', marginTop: 6, marginBottom: 6, overflow: 'hidden' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  imageGridItem: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  imageGridImg: { width: '100%', height: '100%' },
  mediaGridVideoBg: { backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  videoPlayOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  playIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconWrapLarge: { width: 56, height: 56, borderRadius: 28 },
  imageGridMore: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageGridMoreText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  imageGridMoreLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '700' },
});
