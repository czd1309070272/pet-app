import { Dimensions } from 'react-native';
import type { VideoFeedItem } from './types';
import { spacing } from '../../theme/tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export { SCREEN_WIDTH, SCREEN_HEIGHT };

/** 用於展示的公開短視頻樣例 */
export const SAMPLE_VIDEO_URI = 'http://www.w3school.com.cn/i/movie.mp4';

/** 播放倍速選項 */
export const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
/** 清晰度選項 */
export const QUALITY_OPTIONS = ['流暢', '標清', '高清', '超清'] as const;

export const PROGRESS_BAR_HEIGHT = 4;
export const PROGRESS_BAR_TOUCH_SLOP = 28;
/** TikTok 式下拉刷新：頂部彈出提示區高度 */
export const REFRESH_PROMPT_HEIGHT = 72;
export const PROGRESS_BAR_BOTTOM = 40;
export const HIDE_PROGRESS_DELAY_MS = 1000;
/** 視頻加載超時（TikTok 式：超時或錯誤時顯示「加載失敗，點擊重試」） */
export const VIDEO_LOAD_TIMEOUT_MS = 12000;
export const PROGRESS_BAR_FADE_DURATION_MS = 350;
export const PROGRESS_BAR_PAD = spacing.lg;
export const PROGRESS_BAR_WIDTH = SCREEN_WIDTH - 2 * PROGRESS_BAR_PAD;

/** 刷新時長 1.5 秒：展示旋轉動畫，避免後台請求過快 */
export const REFRESH_DURATION_MS = 1500;

/** 頂部下拉刷新 或 右滑返回首頁：同一 PanResponder 分支處理 */
export const PULL_TRIGGER_DY = 48;
export const PULL_CANCEL_DY = 28;
export const SWIPE_RIGHT_DX = 55;
export const SWIPE_RIGHT_MIN_RELEASE = 40;

export const MOCK_VIDEOS: VideoFeedItem[] = [
  {
    id: '1',
    coverUrl: 'https://picsum.photos/seed/v1/400/800',
    videoUrl: SAMPLE_VIDEO_URI,
    avatarUrl: 'https://picsum.photos/seed/a1/100/100',
    username: '@萌寵日記',
    description: '今天帶毛孩去公園曬太陽～ #寵物日常 #柯基',
    likes: 12800,
    comments: 320,
    isLiked: false,
    isCollected: false,
  },
  {
    id: '2',
    coverUrl: 'https://picsum.photos/seed/v2/400/800',
    videoUrl: SAMPLE_VIDEO_URI,
    avatarUrl: 'https://picsum.photos/seed/a2/100/100',
    username: '@貓奴日常',
    description: '主子終於肯理我了 TAT #貓咪 #橘貓',
    likes: 25600,
    comments: 890,
    isLiked: true,
    isCollected: false,
  },
  {
    id: '3',
    coverUrl: 'https://picsum.photos/seed/v3/400/800',
    videoUrl: SAMPLE_VIDEO_URI,
    avatarUrl: 'https://picsum.photos/seed/a3/100/100',
    username: '@PawPal 好物',
    description: '開箱新買的寵物飲水機，毛孩超愛 #寵物用品 #開箱',
    likes: 5200,
    comments: 156,
    isLiked: false,
    isCollected: true,
  },
  {
    id: '4',
    coverUrl: 'https://picsum.photos/seed/v4/400/800',
    videoUrl: SAMPLE_VIDEO_URI,
    avatarUrl: 'https://picsum.photos/seed/a4/100/100',
    username: '@柴犬阿黃',
    description: '週末露營帶狗子一起～ #柴犬 #露營',
    likes: 18900,
    comments: 420,
    isLiked: false,
    isCollected: false,
  },
  {
    id: '5',
    coverUrl: 'https://picsum.photos/seed/v5/400/800',
    videoUrl: SAMPLE_VIDEO_URI,
    avatarUrl: 'https://picsum.photos/seed/a5/100/100',
    username: '@寵物營養師',
    description: '三種食材自制健康零食，毛孩搶著吃 #自制 #健康',
    likes: 32100,
    comments: 668,
    isLiked: true,
    isCollected: true,
  },
];
