/**
 * 请求辅助：获取当前用户 token，供各业务 API 使用（避免循环依赖 auth）
 */
import { getData, USER_INFO_KEY } from './storage';
import type { UserInfo } from '../types';

export async function getToken(): Promise<string | null> {
  const user = await getData<UserInfo>(USER_INFO_KEY);
  return user?.token ?? null;
}
