/**
 * AI 诊疗报告翻译/解读接口 - 迁移自原 React 项目 services/aiFeatures.ts
 * 对应移动端「AI 健康检测」中的诊疗报告解读功能。对接后端 POST /api/scanner/translate
 */
import type { TranslatorResult } from '../types';
import type { AIResponse, ImageInput } from './aiHealthScan';
import { buildFormDataWithFile } from './aiHealthScan';
import { API_BASE_URL } from './config';

export type { AIResponse };

/**
 * 诊疗报告解读：上传报告图片，返回解释、建议与术语摘要
 * @param _petName 宠物名称（后端当前未使用，保留参数与前端 UI 一致）
 * @param file 报告图片（Web: File；RN: { uri, type? }）
 * @returns AIResponse<TranslatorResult>
 */
export async function performTranslatorAnalysis(
  _petName: string,
  file: ImageInput
): Promise<AIResponse<TranslatorResult>> {
  try {
    if (!file) return { code: 400, message: '無文件輸入', data: null };

    const formData = buildFormDataWithFile(file);
    const response = await fetch(`${API_BASE_URL}/scanner/translate`, {
      method: 'POST',
      body: formData,
    });
    const json = await response.json().catch(() => ({}));
    const message = json.detail ?? json.message ?? '請求失敗';

    if (!response.ok) {
      return {
        code: response.status,
        message: typeof message === 'string' ? message : '報告翻譯請求失敗',
        data: null,
      };
    }

    const data = json.data as Partial<TranslatorResult> | undefined;
    return {
      code: json.code ?? 200,
      message: json.message ?? '成功',
      data: data
        ? {
            explanation: data.explanation ?? '解析完成',
            suggestions: data.suggestions ?? [],
            termExcerpts: data.termExcerpts ?? '無',
          }
        : null,
    };
  } catch (err) {
    console.error('Translator analysis error:', err);
    return { code: 500, message: '翻譯引擎連接超時', data: null };
  }
}
