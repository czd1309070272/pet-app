/**
 * AI 成分表扫描分析接口 - 迁移自原 React 项目 services/aiFeatures.ts
 * 对应移动端「AI 健康检测」中的成分表扫描功能。对接后端 POST /api/scanner/analyze
 */
import type { ScannerResult } from '../types';
import type { AIResponse, ImageInput } from './aiHealthScan';
import { buildFormDataWithFile } from './aiHealthScan';
import { API_BASE_URL } from './config';

export type { AIResponse };

/** 宠物上下文，用于成分分析 */
export interface PetContext {
  breed: string;
  age: number;
  gender: string;
}

/**
 * 成分表扫描分析：上传食品成分表图片，返回安全/风险成分与摘要
 * @param file 成分表图片（Web: File；RN: { uri, type? }）
 * @param petContext 宠物品种、年龄、性别
 * @returns AIResponse<ScannerResult>
 */
export async function performScannerAnalysis(
  file: ImageInput,
  petContext: PetContext
): Promise<AIResponse<ScannerResult>> {
  try {
    if (!file) return { code: 400, message: '未選擇文件', data: null };

    const formData = buildFormDataWithFile(file);
    formData.append('breed', petContext.breed);
    formData.append('age', petContext.age.toString());
    formData.append('gender', petContext.gender);

    const response = await fetch(`${API_BASE_URL}/scanner/analyze`, {
      method: 'POST',
      body: formData,
    });
    const json = await response.json().catch(() => ({}));
    const message = json.detail ?? json.message ?? '請求失敗';

    if (!response.ok) {
      return {
        code: response.status,
        message: typeof message === 'string' ? message : '成分分析請求失敗',
        data: null,
      };
    }

    const data = json.data as Partial<ScannerResult> | undefined;
    const resultUrl =
      typeof file === 'object' && 'uri' in file ? file.uri : (file as File).name;
    return {
      code: json.code ?? 200,
      message: json.message ?? '成功',
      data: data
        ? {
            riskIngredients: data.riskIngredients ?? [],
            safeIngredients: data.safeIngredients ?? [],
            summary: data.summary ?? '解析成功',
            resultUrl: data.resultUrl || resultUrl,
          }
        : null,
    };
  } catch (err) {
    console.error('Scanner analysis error:', err);
    return { code: 500, message: '成分分析器啟動失敗', data: null };
  }
}
