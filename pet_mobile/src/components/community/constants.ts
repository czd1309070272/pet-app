/**
 * 社群模块常量 - 布局与业务配置
 */
import { Dimensions } from 'react-native';
import { spacing } from '../../theme/tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const COMMUNITY_LAYOUT = {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  LIST_PADDING_H: spacing.sm,
  CARD_PADDING_INNER: spacing.lg,
  AVATAR_GAP: spacing.sm,
  AVATAR_SIZE: 48,
  IMG_GAP: 6,
  MAX_PREVIEW_IMAGES: 9,
  GRID_SAFE_MARGIN: 10,
  LONG_PRESS_MS: 400,
} as const;

// 卡片内可用于正文+图片的宽度
const CARD_BODY_WIDTH =
  SCREEN_WIDTH - COMMUNITY_LAYOUT.LIST_PADDING_H * 2 - COMMUNITY_LAYOUT.CARD_PADDING_INNER * 2
  - COMMUNITY_LAYOUT.AVATAR_SIZE - COMMUNITY_LAYOUT.AVATAR_GAP;

const IMG_GRID_WIDTH = Math.floor(CARD_BODY_WIDTH - COMMUNITY_LAYOUT.GRID_SAFE_MARGIN);
const IMG_CELL_SIZE = Math.floor((IMG_GRID_WIDTH - COMMUNITY_LAYOUT.IMG_GAP * 2) / 3);

export const MEDIA_GRID = {
  IMG_GRID_WIDTH,
  IMG_CELL_SIZE,
  IMG_GRID_CONTENT_WIDTH: IMG_CELL_SIZE * 3 + COMMUNITY_LAYOUT.IMG_GAP * 2,
  IMG_GRID_HEIGHT: IMG_CELL_SIZE * 3 + COMMUNITY_LAYOUT.IMG_GAP * 2,
  modalCellSize: Math.floor((SCREEN_WIDTH - 48 - 2 * 12 - 2 * COMMUNITY_LAYOUT.IMG_GAP) / 3),
  modalFullSize: Math.min(
    Math.floor((SCREEN_WIDTH - 48 - 2 * 12 - 2 * COMMUNITY_LAYOUT.IMG_GAP) / 3) * 3 + COMMUNITY_LAYOUT.IMG_GAP * 2,
    200
  ),
} as const;

export const TAGS = ['全部', '🔥 熱門', '# 飲食', '# 健康', '# 趣味'] as const;
export const MODAL_TAGS = ['# 飲食', '# 健康', '# 趣味', '# 日常', '# 萌寵'] as const;

export const IMAGE_PLACEHOLDER = 'https://picsum.photos/seed/placeholder/200';
export const MAX_MEDIA = 9;
export const MAX_VISIBLE_REPLIES = 3;

export const MAX_PREVIEW_IMAGES = 9;
