/**
 * 日记相关 API - 迁移自原 React 项目 backend.fetchDiaryEntries
 * 原实现为本地 mock，后端若有对应接口可在此改为请求
 */
import type { DiaryEntry } from '../types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 获取日记列表
 * 原 backend 为 mock 数据，此处保持一致；后续可改为 POST /api/xxx
 */
export async function fetchDiaryEntries(): Promise<DiaryEntry[]> {
  await delay(300);
  return [
    {
      id: 'e_1',
      date: new Date().toISOString().slice(0, 10),
      content: '今日萌寵時光 ✨',
      style: 'happy',
      petName: '寶貝',
    },
  ];
}
