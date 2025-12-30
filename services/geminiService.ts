
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const beautifyDiary = async (content: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `請將這段寵物日記內容進行美化，語氣要充滿「台式療癒風」，多用「啦、喔、嗚嗚、💖、✨」等詞彙，讓文字更有情緒價值和畫面感。原文：${content}`,
    config: {
      systemInstruction: "你是一位資深的寵物博主，擅長撰寫溫暖、治癒的台式簡體/繁體中文內容。你的回覆應該簡短有力，富有情感。",
      temperature: 0.8,
    },
  });
  return response.text || content;
};

export const translateReport = async (reportText: string): Promise<{ explanation: string; suggestions: string[] }> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `請解讀這段寵物醫療術語，用「大白話」解釋給主人聽，並提供具體的行動建議。術語：${reportText}`,
    config: {
      systemInstruction: "你是一位溫柔的寵物醫生助手。你的任務是將晦澀的醫療術語翻譯成通俗易懂的文字，並給出科學的護理建議。",
      responseMimeType: "application/json",
      // Configure responseSchema as recommended by guidelines for robust JSON output.
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: {
            type: Type.STRING,
            description: "對醫療術語的通俗易懂解釋",
          },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description: "給主人的後續建議清單",
          },
        },
        required: ["explanation", "suggestions"],
      },
    },
  });
  
  try {
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr || "{}");
  } catch {
    // Fallback logic if JSON parsing fails
    return { 
      explanation: response.text || "無法解析報告內容。", 
      suggestions: ["諮詢專業獸醫師", "保持寵物心情愉快"] 
    };
  }
};
