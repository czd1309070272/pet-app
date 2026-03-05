/**
 * 可組合卡片類型 - 用於在消息、流式輸出等場景下拼接不同類型卡片
 */
import type { Product } from '../../types';
import type { SeverityLevel } from './severityConfig';

/** 好物推薦卡片 */
export interface ProductRecommendationCardData {
  type: 'product_recommendation';
  title?: string;
  products: Product[];
  /** 最多展示數量，默認 3 */
  maxItems?: number;
}

/** 用藥/喂食風險卡 - 橙色 */
export interface MedicationFeedingRiskCardData {
  type: 'medication_feeding_risk';
  title?: string;
  content: string;
}

/** 緊急情況警示卡 - 紅色 */
export interface EmergencyAlertCardData {
  type: 'emergency_alert';
  title?: string;
  content: string;
}

/** 品種/年齡特殊風險卡 - 個性化警示 */
export interface BreedAgeRiskCardData {
  type: 'breed_age_risk';
  title?: string;
  content: string;
  /** 寵物信息，如「柯基犬 · 幼犬」 */
  petInfo?: string;
  severity?: SeverityLevel;
}

/** AI 局限性/準確性卡 - 透明度、信任，藍色 */
export interface AILimitationCardData {
  type: 'ai_limitation';
  title?: string;
  content: string;
}

/** 隱私與數據使用卡 - 合規推薦，藍色 */
export interface PrivacyDataCardData {
  type: 'privacy_data';
  title?: string;
  content: string;
}

/** 長條形免責聲明/非醫療建議卡 - 黃色，置於底部 */
export interface DisclaimerCardData {
  type: 'disclaimer';
  content?: string;
}

export type MessageCardData =
  | ProductRecommendationCardData
  | MedicationFeedingRiskCardData
  | EmergencyAlertCardData
  | BreedAgeRiskCardData
  | AILimitationCardData
  | PrivacyDataCardData
  | DisclaimerCardData;
