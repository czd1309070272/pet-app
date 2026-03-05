/**
 * 卡片嚴重度配置 - 用不同顏色/圖標區分
 * 紅色（緊急） > 橙色（用藥風險） > 黃色（一般免責） > 藍色（信息性）
 */
export type SeverityLevel = 'urgent' | 'medication' | 'disclaimer' | 'info';

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  urgent: '#dc2626',      // 紅 - 緊急
  medication: '#ea580c',  // 橙 - 用藥/喂食風險
  disclaimer: '#ca8a04',  // 黃 - 一般免責
  info: '#2563eb',        // 藍 - 信息性
};

/** 對應淺色背景（用於卡片底色） */
export const SEVERITY_BG: Record<SeverityLevel, { light: string; dark: string }> = {
  urgent: { light: 'rgba(220, 38, 38, 0.1)', dark: 'rgba(220, 38, 38, 0.15)' },
  medication: { light: 'rgba(234, 88, 12, 0.1)', dark: 'rgba(234, 88, 12, 0.15)' },
  disclaimer: { light: 'rgba(202, 138, 4, 0.1)', dark: 'rgba(202, 138, 4, 0.15)' },
  info: { light: 'rgba(37, 99, 235, 0.08)', dark: 'rgba(37, 99, 235, 0.12)' },
};
