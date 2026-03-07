/**
 * 情绪价值日记 - 常量
 */
export const MOOD_TAGS: { label: string; value: string }[] = [
  { label: '開心', value: 'happy' },
  { label: '放鬆', value: 'relaxed' },
  { label: '治癒', value: 'healing' },
  { label: '想念', value: 'miss' },
  { label: '平靜', value: 'calm' },
];

export const MAX_DIARY_MEDIA = 9;

/** 图片大小上限 10MB */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** 视频时长上限 5 分钟（毫秒） */
export const MAX_VIDEO_DURATION_MS = 5 * 60 * 1000;
