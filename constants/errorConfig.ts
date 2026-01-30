
import { AlertTriangle, WifiOff, ImageOff, ZapOff } from 'lucide-react';
import React from 'react';

export interface ErrorDetail {
  title: string;
  message: string;
  icon: React.ElementType;
  iconColor: string;
  actionLabel: string;
}

export const ERROR_MAP: Record<number | string, ErrorDetail> = {
  400: {
    title: '圖片識別障礙',
    message: '我們無法看清照片中的內容。請確保光線充足、對焦清晰，且不要有嚴重的反光喔。',
    icon: ImageOff,
    iconColor: 'text-orange-500',
    actionLabel: '重新拍攝'
  },
  500: {
    title: '伺服器開小差',
    message: '後端 AI 助手暫時斷開了連結，可能是網路不穩定或系統正在維護。',
    icon: WifiOff,
    iconColor: 'text-rose-500',
    actionLabel: '檢查網路'
  },
  'default': {
    title: '發生未知異常',
    message: '我們遇到了一些技術難題，請重新嘗試或聯繫 PawPal 支援團隊。',
    icon: ZapOff,
    iconColor: 'text-gray-500',
    actionLabel: '我知道了'
  }
};

export const getErrorDetail = (code: number | undefined): ErrorDetail => {
  return ERROR_MAP[code || 'default'] || ERROR_MAP['default'];
};
