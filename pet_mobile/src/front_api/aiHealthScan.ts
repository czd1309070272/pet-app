/**
 * AI 健康检测（粪便/皮肤）接口 - 迁移自原 React 项目 services/aiFeatures.ts
 * 对应移动端「AI 健康检测」中的粪便/皮肤检测功能。
 * 先不与后端对接，仅接口与类型迁移。
 */
import type { HealthScanResult } from '../types';

// --- 統一響應格式 ---
export interface AIResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

/** 移动端可传图片 uri（如 ImagePicker 返回），对接后端时再转为 FormData */
export type ImageInput = File | { uri: string; type?: string };

/**
 * 将 ImageInput 转为 FormData 并追加 file 字段（RN 用 uri/name/type，Web 用 File）
 */
export function buildFormDataWithFile(file: ImageInput): FormData {
  const formData = new FormData();
  if (typeof file === 'object' && 'uri' in file) {
    (formData as any).append('file', {
      uri: file.uri,
      name: 'image.jpg',
      type: file.type || 'image/jpeg',
    });
  } else {
    formData.append('file', file as File);
  }
  return formData;
}

/**
 * AI 健康检测：粪便(STOOL) 或 皮肤(SKIN)
 * @param mode 'STOOL' | 'SKIN'
 * @param petName 宠物名称
 * @param file 图片文件（Web: File；RN: { uri, type? }）
 * @returns AIResponse<HealthScanResult>
 */
export async function performAIHealthScan(
  mode: 'STOOL' | 'SKIN',
  petName: string,
  file: ImageInput
): Promise<AIResponse<HealthScanResult>> {
  try {
    if (!file) return { code: 400, message: '未選擇文件', data: null };

    // TODO: 对接后端时在此调用接口，上传 file（RN 下用 uri 构造 FormData）
    // const formData = new FormData();
    // formData.append('file', ...);
    // formData.append('mode', mode);
    // formData.append('petName', petName);
    // const response = await fetch(`${API_BASE_URL}/xxx`, { method: 'POST', body: formData });

    // 占位：未对接后端，返回默认成功结构
    const resultUrl =
      typeof file === 'object' && 'uri' in file ? file.uri : (file as File).name;
    return {
      code: 200,
      message: '成功',
      data: {
        status: 'Healthy',
        desc: '分析完成',
        suggestions: ['持續觀察'],
        resultUrl,
      },
    };
  } catch (err) {
    console.error('AI Scan Error:', err);
    return { code: 500, message: 'AI 服務暫時中斷，請重試', data: null };
  }
}
