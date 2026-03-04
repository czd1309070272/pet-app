# PawPal AI - React Native 移動端

由 Web 端 (Vite + React) 遷移而來的 React Native (Expo) 項目，採用「先頁面、再 backend/service」的遷移方案。

## 技術棧

- **Expo SDK 54** + TypeScript
- **React Navigation**（Native Stack + Bottom Tabs）
- **lucide-react-native** 圖標
- **Zustand** 可選狀態
- **Mock API**（階段一）：`src/api/mock.ts`，與原 `backend` 同接口

## 目錄結構

- `src/types.ts` - 與 Web 端一致的類型與 View 枚舉
- `src/theme/` - 設計 token、主題
- `src/constants/errorConfig.tsx` - 錯誤碼與文案
- `src/components/shared/CommonUI.tsx` - GlassCard、ViewHeader、ActionButton、ErrorModal（RN 版）
- `src/api/mock.ts` - 階段一 Mock 接口
- `src/context/AppContext.tsx` - 登錄態、深色模式
- `src/navigation/` - 根導航、主 Tab、各 Stack（Home / Discovery / Community / Profile）
- `src/screens/` - 登錄、首頁、個人中心、設定及占位頁

## 運行

```bash
cd pet_mobile
npm install
npm start
```

使用 Expo Go 掃描二維碼或選擇 Android / iOS 模擬器。

## 階段一說明

- 當前為 **階段一**：頁面與導航已遷移，數據來自 **Mock**（`src/api/mock.ts`）。
- 登錄：任意帳密可登入（Mock 返回固定用戶）；`getCurrentUser()` 返回 `null` 時顯示登錄頁。
- 階段二將：替換 Mock 為真實 `backend`、配置 `API_BASE_URL`、AsyncStorage 鑒權、文件上傳適配等。

## 與 Web 對應關係

| Web | RN |
|-----|-----|
| `App.tsx` 的 `currentView` + `overlayStack` | React Navigation Stack + Tabs |
| `index.html` Tailwind + 內聯 CSS | `src/theme/tokens.ts` + StyleSheet / 組件內樣式 |
| `components/shared/CommonUI.tsx` | `src/components/shared/CommonUI.tsx`（View / Pressable） |
| `backend.ts` | 階段一：`src/api/mock.ts`；階段二：適配層 + 真實 API |
