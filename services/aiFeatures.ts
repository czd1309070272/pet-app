
// import { GoogleGenAI, Type } from "@google/genai";
import { Phone } from "lucide-react";
import { HealthScanResult, ScannerResult, TranslatorResult } from "../types";
import Cookie from 'js-cookie';
// 實例化 Gemini API 客戶端
// const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });
// 保存数据到 Cookie，支持过期时间（天数）
export const SaveDataToCookie = (key: string, value: any, days: number) => {
  Cookie.set(key, JSON.stringify(value), { expires: days });
};
// 同时添加获取和删除 Cookie 的辅助函数
export const GetDataFromCookie = (key: string): any => {
  const cookieValue = Cookie.get(key);
  if (cookieValue) {
    try {
      return JSON.parse(cookieValue);
    } catch (error) {
      return cookieValue; // 如果不是 JSON 格式，直接返回
    }
  }
  return null;
};
// 删除指定的 Cookie
export const RemoveCookie = (key: string) => {
  Cookie.remove(key);
};

// --- 統一響應格式 ---
export interface AIResponse<T> {
  code: number;
  message: string;
  data: T | null;
}
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
// --- 輔助函數 ---

const fileToGenerativePart = async (file: File | Blob) => {
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: base64,
      mimeType: file.type || 'image/jpeg',
    },
  };
};

// --- 四大核心 AI 功能 ---

export const performAIHealthScan = async (mode: 'STOOL' | 'SKIN', petName: string, file: File): Promise<AIResponse<HealthScanResult>> => {
  try {
    if (!file) return { code: 400, message: "未選擇文件", data: null };

    // const ai = getAI();
    // const imagePart = await fileToGenerativePart(file);
    // const prompt = mode === 'STOOL' 
    //   ? `這是寵物${petName}的糞便照片。請進行健康檢測分析。如果圖片不清晰或不是糞便，請在回覆中標註識別失敗。`
    //   : `這是寵物${petName}的皮膚照片。請檢查是否有病變。`;

    // const response = await ai.models.generateContent({
    //   model: "gemini-3-flash-preview",
    //   contents: { parts: [imagePart, { text: prompt }] },
    //   config: {
    //     systemInstruction: "你是一位專業的寵物健康 AI 助手。如果圖片難以辨認，請將 status 設為 'Error'。否則，狀態只能是 'Healthy' 或 'Observation'。",
    //     responseMimeType: "application/json",
    //     responseSchema: {
    //       type: Type.OBJECT,
    //       properties: {
    //         status: { type: Type.STRING, description: "健康狀態: Healthy, Observation, 或 Error" },
    //         desc: { type: Type.STRING, description: "狀況描述" },
    //         suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "建議清單" },
    //       },
    //       required: ["status", "desc", "suggestions"],
    //     },
    //   },
    // });

    // const result = JSON.parse(response.text || "{}");
    const result = JSON.parse("{}");
    if (result.status === 'Error') {
      return { code: 400, message: "圖片內容模糊，AI 無法精準識別", data: null };
    }

    return {
      code: 200,
      message: "成功",
      data: {
        status: (result.status as 'Healthy' | 'Observation') || 'Healthy',
        desc: result.desc || '分析完成',
        suggestions: result.suggestions || ['持續觀察'],
        resultUrl: URL.createObjectURL(file)
      }
    };
  } catch (err) {
    console.error("AI Scan Error:", err);
    return { code: 500, message: "AI 服務暫時中斷，請重試", data: null };
  }
};
export const performScannerAnalysis = async (file: File, petContext: { breed: string, age: number, gender: string }): Promise<AIResponse<ScannerResult>> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('breed', petContext.breed);
  formData.append('age', petContext.age.toString());     // number 轉 string
  formData.append('gender', petContext.gender);
  console.log(formData)
  try {
    const response = await fetch('/api/scanner/analyze',{
      method: 'POST',
      body: formData
    });
    const results=await response.json();
    console.log(results)
    // const ai = getAI();
    // const imagePart = await fileToGenerativePart(file);
    // const response = await ai.models.generateContent({
    //   model: "gemini-3-flash-preview",
    //   contents: { parts: [imagePart, { text: "請分析這張寵物食品成分表。如果無法提取文字，請回覆包含 Error 的 JSON。" }] },
    //   config: {
    //     systemInstruction: "你是一位寵物營養專家。如果圖片模糊，請將 hasRisk 設為 null 並在 summary 寫 'Error'。",
    //     responseMimeType: "application/json",
    //     responseSchema: {
    //       type: Type.OBJECT,
    //       properties: {
    //         hasRisk: { type: Type.BOOLEAN },
    //         safeIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
    //         summary: { type: Type.STRING },
    //       },
    //       required: ["summary"],
    //     },
    //   },
    // });
    // const result = JSON.parse(response.text || "{}");
    const result=results.data
    if (result.summary === 'Error') {
      return { code: 400, message: "成分表圖片模糊，無法提取內容", data: null };
    }

    return {
      code: 200,
      message: "成功",
      data: {
        riskIngredients: result.riskIngredients || [],
        safeIngredients: result.safeIngredients || [],
        summary: result.summary || '解析成功',
        resultUrl: URL.createObjectURL(file)
      }
    };
  } catch (err) {
    return { code: 500, message: "成分分析器啟動失敗", data: null };
  }
};

export const performTranslatorAnalysis = async (petName: string, file: File): Promise<AIResponse<TranslatorResult>> => {
  try {
    if (!file) return { code: 400, message: "無文件輸入", data: null };
    const formData = new FormData();
    formData.append('file', file);
    console.log(formData)
    const response = await fetch('/api/scanner/translate',{
      method: 'POST',
      body: formData
    });
    const results=await response.json();
    console.log("data from backend:",results)
    const result=results.data
    // const ai = getAI();
    // const imagePart = await fileToGenerativePart(file);
    // const response = await ai.models.generateContent({
    //   model: "gemini-3-flash-preview",
    //   contents: { parts: [imagePart, { text: `請解讀這份寵物${petName}的診療報告。` }] },
    //   config: {
    //     systemInstruction: "你是一位寵物醫生助手。如果圖片不是化驗單，請在 explanation 內容中包含「INVALID_REPORT」。",
    //     responseMimeType: "application/json",
    //     responseSchema: {
    //       type: Type.OBJECT,
    //       properties: {
    //         explanation: { type: Type.STRING },
    //         suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    //         termExcerpts: { type: Type.STRING },
    //       },
    //       required: ["explanation"],
    //     },
    //   },
    // });
    // const result = JSON.parse(results.text || "{}");
    // const result = JSON.parse(response.text || "{}");
    // if (result.explanation?.includes('INVALID_REPORT')) {
    //   return { code: 400, message: "這似乎不是一張寵物診療報告，請重新上傳", data: null };
    // }
    return {
      code: 200,
      message: "成功",
      data: {
        explanation: result.explanation || '解析完成',
        suggestions: result.suggestions || [],
        termExcerpts: result.termExcerpts || '無'
      }
    };
  } catch (err) {
    return { code: 500, message: "翻譯引擎連接超時", data: null };
  }
};

export interface ProductItem {
  id: string;
  title: string;
  content: string;
  price: number;
  imageUrl: string;
  tag?: string;
}
// --- AI 顧問卡片觸發 Mock 入口 ---
export interface AIConsultantCard {
  type: 'WARNING' | 'SUGGESTION' | 'KNOWLEDGE' | 'PRODUCT' | 'GENERIC';
  title: string;
  content: string;
  actionLabel?: string;
  products?: ProductItem[]; // 支持多個商品推薦
  productId?: string;
  price?: number;
  imageUrl?: string;
}

export const getMockCardForMessage = async (message: string, petName: string = '毛孩子'): Promise<AIConsultantCard | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const text = message.toLowerCase();
    // 1. 商品推薦觸發
    // 1. 商品推薦觸發 (返回 2-3 個)
  if (text.includes('推薦') || text.includes('買什麼') || text.includes('糧') || text.includes('零食')) {
    const allProducts: ProductItem[] = [
      { 
        id: 'prod1', 
        title: '皇家全價成貓糧 2kg', 
        content: '富含優質蛋白，助力貓咪成長。', 
        price: 280, 
        imageUrl: 'https://picsum.photos/seed/catfood1/600/400',
        tag: '口碑爆款'
      },
      { 
        id: 'prod2', 
        title: '渴望六種魚貓糧', 
        content: '天然無穀物，美毛效果極佳。', 
        price: 350, 
        imageUrl: 'https://picsum.photos/seed/catfood2/600/400',
        tag: '天然進口'
      },
      { 
        id: 'prod3', 
        title: '希爾思腸胃護理配方', 
        content: '專為玻璃胃主子設計，易吸收。', 
        price: 320, 
        imageUrl: 'https://picsum.photos/seed/catfood3/600/400',
        tag: '處方精選'
      }
    ];

    // 隨機返回 2 個或 3 個
    // const count = Math.random() > 0.5 ? 3 : 2;
    return { 
      type: 'PRODUCT', 
      title: '為您精選的萌寵好物', 
      content: '根據您的諮詢，AI 推薦以下適合的產品：', 
      products: allProducts.slice(0, 3)
    };
  }
  // 2. 健康警告
  if (text.includes('嘔吐') || text.includes('拉肚子') || text.includes('精神不好')) {
    return { type: 'WARNING', title: '緊急健康警示', content: `${petName} 如果出現頻繁嘔吐並伴隨精神萎靡，可能是急性腸胃炎。`, actionLabel: '查看附近醫院' };
  }

  // 3. 護理建議
  if (text.includes('驅蟲') || text.includes('疫苗')) {
    return { type: 'SUGGESTION', title: '專家護理建議', content: '春季是寄生蟲高發期，建議每月進行一次體外驅蟲。', actionLabel: '添加用藥提醒' };
  }

  // 4. 科普知識
  if (text.includes('冷知識') || text.includes('為什麼') || text.includes('貓草')) {
    return { type: 'KNOWLEDGE', title: '寵物行為科普', content: '貓咪吃貓草是通過纖維素刺激胃壁，幫助吐出毛球。', actionLabel: '了解更多' };
  }
  return null;
};

export const chatWithAIStream = async function* (message: string, history: {role: 'user' | 'model', text: string}[], petName: string = '毛孩子') {
  const userinfo=GetDataFromCookie('UserInfo')
  // --- 測試代碼：關鍵字模擬異常 ---
  if (message.includes('TEST_NETWORK_ERROR')) {
    throw { code: 500, message: "網路發生異常錯誤，請確認您的連線狀態喔。" };
  }
  if (message.includes('TEST_SERVER_ERROR')) {
    throw { code: 500, message: "伺服器端發生了一些狀況，我們的工程師正在修復中。" };
  }
  if (message.includes('TEST_400_ERROR')) {
    throw { code: 400, message: "識別引擎認為您的描述不夠準確，請試試看換個說法。" };
  }
  const data={
    user_profile: {
      id: userinfo.id,
      username: userinfo.username,
      name: userinfo.name,
      phone: userinfo.phone,
      isVip: Boolean(userinfo.isVip)
    },
    message: message,
    history: history,
    petName: petName
  }
  const response=await fetch('/api/chat/stream',{
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  if (!response.ok) {
    throw new Error(`伺服器回應錯誤：${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('無法取得 streaming 回應 body');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunkText = decoder.decode(value, { stream: true });

      // 假設後端是 SSE 或純文字 chunk，直接 yield
      // 如果後端是 JSON 格式的 chunk，需要自己 parse
      yield chunkText;
    }
  } finally {
    reader.releaseLock();
  }
};

export const beautifyDiary = async (content: string): Promise<AIResponse<string>> => {
  try {
    if (!content.trim()) return { code: 400, message: "內容不能為空", data: null };
    // const ai = getAI();
    // const response = await ai.models.generateContent({
    //   model: "gemini-3-flash-preview",
    //   contents: `請將這段寵物日記美化，語氣要充滿「台式療癒風」。原文：${content}`,
    //   config: {
    //     systemInstruction: "你是一位資深的寵物博主，擅長撰寫溫暖治癒的內容。",
    //     temperature: 0.8,
    //   },
    // });
    return { code: 200, message: "成功", data: content };
    // return { code: 200, message: "成功", data: response.text || content };
  } catch (err) {
    return { code: 500, message: "AI 潤色超時", data: content };
  }
};

// --- AI Consultant History ---

export interface AIHistorySession {
  id: string;
  title: string;
  time: string;
}

export const fetchAIHistorySessions = async (): Promise<AIHistorySession[]> => {
  await delay(800);
  return [
    { id: 's1', title: '貓咪突然不吃飯怎麼辦？', time: '2025-03-25 10:30' },
    { id: 's2', title: '推薦適合布偶貓的貓糧', time: '2025-03-24 15:45' },
    { id: 's3', title: '幾個月需要驅蟲一次？', time: '2025-03-20 09:00' },
  ];
};

export const fetchAIHistoryMessages = async (sessionId: string): Promise<any[]> => {
  await delay(1000);
  // 模擬不同對話的回傳消息
  if (sessionId === 's1') {
    return [
      { id: 'm1', type: 'USER', text: '貓咪突然不吃飯怎麼辦？', time: '10:30' },
      { id: 'm2', type: 'AI', text: '主子食慾不振可能是由多種原因引起的喔。首先請觀察它是否有發燒、嘔吐或腹瀉的情況。如果只是單純挑食，可以嘗試加熱濕糧以增加香味 ✨', time: '10:31' }
    ];
  }
  if (sessionId === 's2') {
    return [
      { id: 'm1', type: 'USER', text: '推薦適合布偶貓的貓糧', time: '15:45' },
      { id: 'm2', type: 'AI', text: '布偶貓屬於長毛大型貓，腸胃較為嬌貴。建議選擇高蛋白且含有益生菌、美毛成分的配方。', time: '15:46' },
      { 
        id: 'm3', 
        type: 'AI', 
        text: '', 
        time: '15:46', 
        cardData: { 
          type: 'PRODUCT', 
          title: '皇家全價成貓糧 2kg', 
          content: '專為腸胃嬌貴貓咪設計。', 
          productId: 'prod1', 
          price: 280, 
          imageUrl: 'https://picsum.photos/seed/catfood/600/400' 
        } 
      }
    ];
  }
  return [
    { id: 'm1', type: 'USER', text: '歷史對話示例', time: '09:00' },
    { id: 'm2', type: 'AI', text: '這是一段很久以前的對話記錄。', time: '09:01' }
  ];
};

export const deleteAIHistorySession = async (sessionId: string): Promise<boolean> => {
  await delay(600);
  return true;
};
