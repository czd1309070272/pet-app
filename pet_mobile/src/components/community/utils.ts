/**
 * 社群模块工具函数
 */
import { IMAGE_PLACEHOLDER } from './constants';

const VIDEO_EXT = /\.(mp4|mov|webm|avi|mkv|m4v|3gp|ogg|wmv|flv)(\?|$)/i;

export function imageUri(path: string): string {
  const s = (path ?? '').trim();
  if (s === '') return IMAGE_PLACEHOLDER;
  return s.startsWith('http') ? s : s;
}

/** 通过 URL 判断是否为视频（含本地 file://、content:// 等） */
export function isVideoUri(uri: string): boolean {
  const path = (uri ?? '').split('?')[0];
  return VIDEO_EXT.test(path);
}
