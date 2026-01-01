
import { GoogleGenAI, Type } from "@google/genai";
import { HealthScanResult, ScannerResult, TranslatorResult } from "../types";

// 實例化 Gemini API 客戶端
// 使用環境變量中的 API KEY 進行初始化
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- 輔助函數 ---

/**
 * 將文件轉換為 Gemini 可識別的生成內容部分 (Base64)
 * @param file 上傳的文件對象
 * @returns 包含 inlineData 的對象
 */
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

/**
 * 1. AI 健康檢測 (Health Scan)
 * 通過分析寵物的糞便或皮膚照片，初步判斷健康狀況並給出建議。
 * 
 * @param mode 檢測模式：'STOOL' (糞便) 或 'SKIN' (皮膚)
 * @param petName 寵物名稱
 * @param file 上傳的照片文件
 * @returns 包含健康狀態、描述和建議的結構化數據
 */
export const performAIHealthScan = async (mode: 'STOOL' | 'SKIN', petName: string, file: File): Promise<HealthScanResult> => {
  const ai = getAI();
  const imagePart = await fileToGenerativePart(file);
  const prompt = mode === 'STOOL' 
    ? `這是寵物${petName}的糞便照片。請進行健康檢測分析，並提供具體的健康描述和護理建議。`
    : `這是寵物${petName}的皮膚照片。請進行皮膚健康檢測分析，檢查是否有真菌、濕疹 or 寄生蟲跡象。`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [imagePart, { text: prompt }] },
    config: {
      systemInstruction: "你是一位專業的寵物健康 AI 助手。請分析圖片並給出結構化結果。狀態只能是 'Healthy' 或 'Observation'。",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING, description: "健康狀態: Healthy 或 Observation" },
          desc: { type: Type.STRING, description: "對當前狀況的通俗描述" },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "給主人的後續建議清單" },
        },
        required: ["status", "desc", "suggestions"],
      },
    },
  });

  const result = JSON.parse(response.text || "{}");
  return {
    status: (result.status as 'Healthy' | 'Observation') || 'Healthy',
    desc: result.desc || '分析完成，未發現明顯異常。',
    suggestions: result.suggestions || ['持續觀察寵物精神狀況'],
    resultUrl: URL.createObjectURL(file)
  };
};

/**
 * 2. AI 萌寵顧問 (AI Consultant)
 * 模擬專業寵物顧問，提供實時的問答諮詢服務，支持上下文對話。
 * 
 * @param message 用戶發送的消息
 * @param history 歷史對話記錄
 * @param petName 當前諮詢的寵物名稱
 * @returns AI 的回覆文本
 */
export const chatWithAI = async (message: string, history: {role: 'user' | 'model', text: string}[], petName: string = '毛孩子'): Promise<string> => {
  const ai = getAI();
  
  // 轉換歷史記錄為 Gemini API 格式
  const contents = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));
  
  // 添加當前消息
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: contents,
    config: {
      systemInstruction: `你是一位全能的寵物專家，名字叫「PawPal AI 顧問」。你說話語氣溫柔、專業且富有同理心。目前正在為寵物 ${petName} 提供諮詢。
      
      風格規範：
      1. **簡約易懂**：不堆砌術語，像朋友一樣交流。
      2. **結構清晰**：使用 Markdown 格式排版（如：**粗體**標題、無序列表）。
      3. **要點突出**：核心建議置於首位，每條建議不超過 3 個重點。
      4. **溫暖親切**：適當使用表情符號（如 🐾, ✨, 💖）。
      5. **保持對話性**：記住之前的對話內容，提供連續的建議。`,
      temperature: 0.7,
    },
  });
  
  return response.text || "抱歉，我現在有點走神，請再跟我說一次。";
};

/**
 * 3. 成分分析 (Ingredient Scanner)
 * 識別寵物食品或用品的成分表，分析是否存在風險成分。
 * 
 * @param file 成分表的照片文件
 * @returns 包含風險評估、安全成分列表和總結的數據
 */
export const performScannerAnalysis = async (file: File): Promise<ScannerResult> => {
  const ai = getAI();
  const imagePart = await fileToGenerativePart(file);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [imagePart, { text: "請分析這張寵物食品成分表。是否有有害添加劑或過敏風險？列出安全成分和摘要。" }] },
    config: {
      systemInstruction: "你是一位寵物營養專家。請識別成分表中的安全成分與潛在風險。",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hasRisk: { type: Type.BOOLEAN, description: "是否含有風險成分" },
          safeIngredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "識別出的安全、健康成分" },
          summary: { type: Type.STRING, description: "成分分析總結與風險說明" },
        },
        required: ["hasRisk", "safeIngredients", "summary"],
      },
    },
  });

  const result = JSON.parse(response.text || "{}");
  return {
    hasRisk: !!result.hasRisk,
    safeIngredients: result.safeIngredients || [],
    summary: result.summary || '無法解析成分表內容。',
    resultUrl: URL.createObjectURL(file)
  };
};

/**
 * 4. 報告翻譯官 (Report Translator)
 * 解讀複雜的寵物醫療報告或化驗單，將專業術語翻譯為通俗易懂的語言。
 * 
 * @param petName 寵物名稱
 * @param file 醫療報告的照片文件
 * @returns 包含解釋、建議和術語摘錄的數據
 */
export const performTranslatorAnalysis = async (petName: string, file: File): Promise<TranslatorResult> => {
  const ai = getAI();
  const imagePart = await fileToGenerativePart(file);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [imagePart, { text: `請解讀這份寵物${petName}的化驗單或診療報告，用「大白話」解釋給主人聽。` }] },
    config: {
      systemInstruction: "你是一位溫柔的寵物醫生助手。你的任務是將晦澀的醫療術語翻譯成通俗易懂的文字。",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING, description: "通俗易懂的報告解釋" },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "後續護理建議" },
          termExcerpts: { type: Type.STRING, description: "原文中的關鍵醫療術語片段" },
        },
        required: ["explanation", "suggestions", "termExcerpts"],
      },
    },
  });

  const result = JSON.parse(response.text || "{}");
  return {
    explanation: result.explanation || '報告內容較為複雜，建議諮詢線下醫師。',
    suggestions: result.suggestions || ['定期複檢'],
    termExcerpts: result.termExcerpts || '無'
  };
};

// --- 其他 AI 輔助功能 ---

/**
 * 日記美化
 * 使用 AI 將普通的日記文本轉換為溫暖治癒的風格。
 */
export const beautifyDiary = async (content: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `請將這段寵物日記內容進行美化，語氣要充滿「台式療癒風」，多用「啦、喔、嗚嗚、💖、✨」等詞彙，讓文字更有情緒價值和畫面感。原文：${content}`,
    config: {
      systemInstruction: "你是一位資長的寵物博主，擅長撰寫溫塊、治癒的台式簡體/繁體中文內容。你的回覆應該簡短有力，富有情感。",
      temperature: 0.8,
    },
  });
  return response.text || content;
};