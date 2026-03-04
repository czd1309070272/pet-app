/**
 * 登录/注册相关前端 API - 迁移自原 React 项目 backend.ts
 * 使用 front_api/config 的 base URL 与 front_api/storage 持久化用户信息
 */
import type { UserInfo } from '../types';
import { API_BASE_URL } from './config';
import { getData, removeData, saveData, USER_INFO_KEY } from './storage';

const USER_STORAGE_DAYS = 7;

/** 登录/注册等请求超时时间（毫秒），网络异常时避免长时间等待 */
const REQUEST_TIMEOUT_MS = 15000;

/**
 * 带超时的 fetch，超时或网络问题会中止请求并抛出可读错误
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// --- Auth ---

/**
 * 登录
 * 原接口: POST /loginview/login
 * 失败时抛出带中文提示的 Error（用户名/密码错误、用户不存在、网络错误等），由界面红字展示，不崩溃
 */
export async function login(username: string, password: string): Promise<UserInfo> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/loginview/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password_hash: password,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (data.code === 200 && data.data) {
      const dat = data.data;
      const user: UserInfo = {
        id: String(dat.user_id),
        username: dat.username,
        name: dat.nickname,
        avatar: dat.avatar_url ?? '',
        isVIP: !!dat.vip_level && dat.vip_level !== 'NONE',
        vipLevel: dat.vip_level ?? '',
        vipExpiry: dat.vip_expiry ?? '',
        phone: dat.phone ?? '',
        gender: dat.gender,
        googleBound: !!dat.google_id,
        appleBound: !!dat.apple_id,
        level: dat.level,
        token: dat.token,
        Expires_in: dat.expires_in,
      };
      await saveData(USER_INFO_KEY, user, USER_STORAGE_DAYS);
      return user;
    }
    throw new Error(data.msg ?? '用戶名或密碼錯誤，請重試');
  } catch (e) {
    if (e instanceof Error) {
      if (e.name === 'AbortError') {
        throw new Error('請求超時，請檢查網絡後重試');
      }
      if (e.message.includes('fetch') || e.message.includes('Failed to fetch') || e.message.includes('Network') || e.message.includes('network')) {
        throw new Error('網絡錯誤，請檢查連線後重試');
      }
      throw e;
    }
    throw new Error('網絡錯誤，請檢查連線後重試');
  }
}

/**
 * 注册
 * 原接口: POST /loginview/register
 * 失败时抛出带中文提示的 Error，由界面红字展示
 */
export async function register(
  username: string,
  password: string,
  regType: string,
  name?: string
): Promise<UserInfo> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/loginview/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password_hash: password,
        nickname: name,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (data.code === 200 && data.data) {
      const dat = data.data;
      const phone = regType === 'PHONE' ? dat.phone ?? '' : '';
      const user: UserInfo = {
        id: String(dat.user_id),
        username: dat.username,
        name: dat.nickname,
        avatar: '',
        isVIP: false,
        vipLevel: '',
        vipExpiry: '',
        phone,
        gender: '保密',
        googleBound: false,
        appleBound: false,
        level: 1,
        token: dat.token,
        Expires_in: dat.expires_in,
      };
      return user;
    }
    if (data.code === 401) {
      await logout();
      throw new Error('未登錄');
    }
    throw new Error(data.msg ?? '註冊失敗，請重試');
  } catch (e) {
    if (e instanceof Error) {
      if (e.name === 'AbortError') {
        throw new Error('請求超時，請檢查網絡後重試');
      }
      if (e.message.includes('fetch') || e.message.includes('Failed to fetch') || e.message.includes('Network') || e.message.includes('network')) {
        throw new Error('網絡錯誤，請檢查連線後重試');
      }
      throw e;
    }
    throw new Error('網絡錯誤，請檢查連線後重試');
  }
}

/**
 * 验证验证码（当前为前端模拟逻辑，可与后端对接后改为真实接口）
 */
export async function verifyCode(identifier: string, code: string): Promise<boolean> {
  return code === '123456' || code.length === 6;
}

/**
 * 重置密码
 * 原接口: POST /loginview/reset_password
 * 失败时抛出带中文提示的 Error，由界面红字展示
 */
export async function resetPassword(identifier: string, newPassword: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/loginview/reset_password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: identifier,
        password_hash: newPassword,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (data.code === 200) return true;
    throw new Error(data.msg ?? '重置密碼失敗，請重試');
  } catch (e) {
    if (e instanceof Error) {
      if (e.name === 'AbortError') {
        throw new Error('請求超時，請檢查網絡後重試');
      }
      if (e.message.includes('fetch') || e.message.includes('Failed to fetch') || e.message.includes('Network') || e.message.includes('network')) {
        throw new Error('網絡錯誤，請檢查連線後重試');
      }
      throw e;
    }
    throw new Error('網絡錯誤，請檢查連線後重試');
  }
}

/**
 * 获取当前登录用户（从本地存储读取，并校验 token、VIP 过期）
 */
export async function getCurrentUser(): Promise<UserInfo | null> {
  const userInfo = await getData<UserInfo>(USER_INFO_KEY);
  if (!userInfo?.token || userInfo.token === '') {
    await logout();
    return null;
  }
  const vipExpiry = userInfo.vipExpiry;
  if (vipExpiry) {
    const expiryDate = new Date(vipExpiry);
    if (!Number.isNaN(expiryDate.getTime()) && expiryDate <= new Date()) {
      await logout();
      return null;
    }
  }
  return userInfo;
}

/**
 * 更新用户资料（当前为本地合并，若后端有接口可在此发起请求）
 */
export async function updateUserProfile(updates: Partial<UserInfo>): Promise<UserInfo> {
  const current = await getData<UserInfo>(USER_INFO_KEY);
  if (!current) throw new Error('未登录');
  const next = { ...current, ...updates };
  await saveData(USER_INFO_KEY, next, USER_STORAGE_DAYS);
  return next;
}

/**
 * 登出：清除本地用户信息
 */
export async function logout(): Promise<void> {
  await removeData(USER_INFO_KEY);
}
