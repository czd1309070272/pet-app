/**
 * 预约/日程 API - 迁移自原 React 项目 backend.fetchAppointments
 * 原实现为本地 mock，后端若有对应接口可在此改为请求
 */
import type { Appointment } from '../types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 获取预约列表
 */
export async function fetchAppointments(): Promise<Appointment[]> {
  await delay(300);
  return [
    {
      id: 'a1',
      hospitalName: '愛心寵物醫院',
      date: '2025-04-01',
      time: '10:00',
      petName: '麻薯',
      type: '疫苗接種',
    },
  ];
}
