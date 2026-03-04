/**
 * 支出/账单 API - 迁移自原 React 项目 backend.fetchExpenses
 * 原实现为本地 mock，后端若有对应接口可在此改为请求
 */
import type { Expense } from '../types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 获取支出列表
 */
export async function fetchExpenses(): Promise<Expense[]> {
  await delay(300);
  return [
    {
      id: 'e1',
      amount: 350,
      category: 'FOOD',
      date: '2025-03-20',
      description: '購買貓糧',
      petName: '麻薯',
    },
    {
      id: 'e2',
      amount: 800,
      category: 'HEALTH',
      date: '2025-03-15',
      description: '年度體檢',
      petName: '豆腐',
    },
  ];
}
