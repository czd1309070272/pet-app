/**
 * 情绪价值日记 - 工具函数
 */
import type { DiaryEntry } from '../../types';

export type OrderedMediaItem = { type: 'image' | 'video'; uri: string; thumbnailUri?: string };

/** 根据 mediaOrder 还原九宫格顺序，无 mediaOrder 时兼容旧数据（视频在前） */
export function getOrderedMedia(entry: DiaryEntry): OrderedMediaItem[] {
  const images =
    entry.imageUrls && entry.imageUrls.length > 0
      ? entry.imageUrls.filter(Boolean)
      : entry.imageUrl
        ? [entry.imageUrl]
        : [];
  const videos =
    entry.videoUrls && entry.videoUrls.length > 0
      ? entry.videoUrls
      : entry.videoUrl
        ? [entry.videoUrl]
        : [];
  const videoThumbs =
    entry.videoThumbnailUrls && entry.videoThumbnailUrls.length >= videos.length
      ? entry.videoThumbnailUrls
      : entry.videoThumbnailUrl
        ? [entry.videoThumbnailUrl]
        : [];
  const hasVideo = videos.length > 0;

  if (entry.mediaOrder && entry.mediaOrder.length > 0) {
    let imgIdx = 0;
    let vidIdx = 0;
    const ordered = entry.mediaOrder
      .map((t): OrderedMediaItem | null => {
        if (t === 'video' && vidIdx < videos.length)
          return { type: 'video', uri: videos[vidIdx], thumbnailUri: videoThumbs[vidIdx++] };
        if (t === 'image' && imgIdx < images.length)
          return { type: 'image', uri: images[imgIdx++] };
        return null;
      })
      .filter((m): m is OrderedMediaItem => m != null && Boolean(m.uri));
    // 若 mediaOrder 解析结果为空但实际有图片/视频，回退到按顺序展示
    if (ordered.length > 0) return ordered;
  }
  if (!hasVideo) return images.map((uri) => ({ type: 'image' as const, uri }));
  const videoItems = videos.map((uri, i) => ({
    type: 'video' as const,
    uri,
    thumbnailUri: videoThumbs[i],
  }));
  return [...videoItems, ...images.map((uri) => ({ type: 'image' as const, uri }))];
}
