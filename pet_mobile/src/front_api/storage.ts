/**
 * 前端持久化存储 - 迁移自原 React 项目 Cookie 逻辑，移动端使用 AsyncStorage
 * 用于保存用户信息等，供 auth 模块使用
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_INFO_KEY = 'UserInfo';

export interface StoredUserPayload {
  data: unknown;
  expiresAt?: number; // 可选：过期时间戳（毫秒），不传则按天数在写入时计算
}

/**
 * 保存数据到本地，支持过期天数
 * 对应原项目 SaveDataToCookie(key, value, days)
 */
export async function saveData(key: string, value: unknown, days?: number): Promise<void> {
  const payload: StoredUserPayload = {
    data: value,
  };
  if (days != null && days > 0) {
    payload.expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
  }
  await AsyncStorage.setItem(key, JSON.stringify(payload));
}

/**
 * 从本地读取数据，若已过期则返回 null
 * 对应原项目 GetDataFromCookie(key)
 */
export async function getData<T = unknown>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw == null) return null;
  try {
    const payload = JSON.parse(raw) as StoredUserPayload;
    if (payload.expiresAt != null && Date.now() > payload.expiresAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return (payload.data as T) ?? null;
  } catch {
    return raw as unknown as T;
  }
}

/**
 * 删除指定 key
 * 对应原项目 RemoveCookie(key)
 */
export async function removeData(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

/** 用户信息存储 key，与后端 Cookie key 一致 */
export { USER_INFO_KEY };
