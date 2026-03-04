/**
 * AI 顧問聊天 - 流式輸出接口
 * 對接後端 POST /api/chat/stream（後端使用 LangChain 實現流式輸出）
 */
import { API_BASE_URL } from './config';
import { getData, USER_INFO_KEY } from './storage';
import type { UserInfo } from '../types';

/** 後端要求的 user_profile 結構 */
export interface ChatUserProfile {
  id: number;
  username: string;
  name: string;
  phone: string;
  isVip: boolean;
}

/** 單條對話記錄（與後端 MessageItem 對應） */
export interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

/**
 * 調用後端流式聊天接口，逐 chunk  yield 文字
 * @param message 用戶本條消息
 * @param history 歷史對話（可為空或最近若干條），用於上下文
 * @param petName 寵物名稱，用於顧問稱呼
 * @param userProfile 可選，不傳則從本地 storage 讀取 UserInfo 並轉成 user_profile
 */
export async function* chatWithAIStream(
  message: string,
  history: ChatHistoryItem[],
  petName: string = '毛孩子',
  userProfile?: ChatUserProfile
): AsyncGenerator<string, void, unknown> {
  let profile = userProfile;
  if (!profile) {
    const user = await getData<UserInfo>(USER_INFO_KEY);
    if (user) {
      profile = {
        id: parseInt(String(user.id), 10) || 0,
        username: user.username ?? '',
        name: user.name ?? '',
        phone: user.phone ?? '',
        isVip: user.isVIP ?? false,
      };
    } else {
      profile = { id: 0, username: '', name: '', phone: '', isVip: false };
    }
  }

  const body = {
    user_profile: profile,
    message,
    history,
    petName,
  };

  const response = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`伺服器回應錯誤：${response.status} ${response.statusText}`);
  }

  // React Native 的 fetch 可能不提供 response.body（ReadableStream），改為一次讀取全文
  if (!response.body) {
    const fullText = await response.text();
    if (fullText) yield fullText;
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkText = decoder.decode(value, { stream: true });
      yield chunkText;
    }
  } finally {
    reader.releaseLock();
  }
}
