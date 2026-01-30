from fastapi import FastAPI, HTTPException,UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .ocr import ocr
from .llm import llm
from fastapi import APIRouter, Form
import io
import time
import json
import base64
from typing import Dict, Any, Optional, List

router = APIRouter()
class AIResponse(BaseModel):
    code: int
    message: str
    data: Optional[Dict[str, Any]] = None
class ScannerResult(BaseModel):
    riskIngredients:  list[str] = []
    safeIngredients:  list[str] = []
    summary: str
class TranslatorResult(BaseModel):
    explanation: str
    suggestions: list[str]
    termExcerpts: str
@router.post("/api/scanner/analyze", response_model=AIResponse)
async def analyze_ingredient_image(file: UploadFile = File(...),
                                   breed: str = Form(...),
                                   age: int = Form(...),
                                   gender: str = Form(...),):
    if not file:
        raise HTTPException(status_code=400, detail="未上传图片")
    # 只允许常见图片格式
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="只支持 jpg / png / webp 格式")
    try:
        # 读取文件内容
        contents = await file.read()

        # 限制文件大小（约 10MB）
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="图片太大，请上传小于10MB的文件")
        # 转 base64
        base64_image = base64.b64encode(contents).decode("utf-8")
        mime_type = file.content_type
        image_data_uri = f"data:{mime_type};base64,{base64_image}"
        # 调用 Mistral API
        time.sleep(2)
        response=ocr.ocr_image(image_data_uri)

        if response.pages:
            print("辨識結果（Markdown格式）：")
            print(response.pages[0].markdown)
            ocr_result = response.pages[0].markdown
            print("\n使用頁數：", response.usage_info.pages_processed)
        else:
            print("辨識失敗，沒有頁面資料")
        system_prompt = f"""
        你是一位經驗豐富的獸醫師，專門評估犬貓用藥成分安全性（以香港、澳門、廣東地區常見用藥為基準）。

        用戶提供：
        - 寵物品種：{breed}
        - 寵物年齡：{age}
        - 寵物性別：{gender}（包含是否絕育資訊）
        - 已OCR的藥品說明書文字（Markdown格式）

        任務：
        1. 只提取有藥理作用的活性成分（主藥 + 有活性輔料），忽略純輔料（如澱粉、色素），但保留乳糖、對羥基苯甲酸酯等常見問題輔料。
        2. 忽略包裝、批號、廠商、儲存、有效期、非成分警示等無關內容。
        3. 根據寵物年齡、性別（推斷是否懷孕／哺乳）、品種敏感性，對每個成分進行安全性判斷。
        若寵物資料不足，默認假設「成年非孕健康犬／貓」。
        4. riskIngredients：只列出「高風險」或「強禁忌」的成分名稱（中文標準名）。
        5. safeIngredients：只列出「極安全」或「常規安全」的成分名稱（中文標準名）。
        「需謹慎」的成分**不得**出現在 riskIngredients 或 safeIngredients 中。
        兩個列表絕對不能有重疊成分。
        6. summary：針對此寵物的整體安全性總結，一句話 + 關鍵警示（繁體中文，簡潔），若有「需謹慎」成分，可在警示中提及。
        7. resultUrl：固定輸出空字串 ""。

        輸出必須是純合法的 JSON，無任何多餘文字、註解、代碼框、markdown。
        直接從 {{ 開始，到 }} 結束。

        JSON 結構（嚴格遵守，不可增減欄位）：
        {{
        "riskIngredients": ["成分A", "成分B", ...],
        "safeIngredients": ["成分X", "成分Y", ...],
        "resultUrl": "",
        "summary": "針對此寵物的整體安全性總結，一句話 + 關鍵警示"
        }}

        現在直接分析以下內容，輸出純 JSON：

        寵物品種：{breed}
        寵物年齡：{age}
        寵物性別：{gender}
        """
        raw=await llm.completion(
            user_message=system_prompt,
            model_name="qwen-flash",  # 可改为从配置或请求中动态指定
            system_prompt=ocr_result,
            temperature=0.2
        )
        json_result=llm.parse_llm_json(raw)
        result = ScannerResult(
            riskIngredients=json_result.get("riskIngredients"),
            safeIngredients=json_result.get("safeIngredients"),
            summary=json_result.get("summary")
        )
        print(json_result)
        return AIResponse(
            code=200,
            message="OCR完成",
            data=result.dict()
        )
    except Exception as e:
        # 记录日志（生产环境建议用 logging）
        print(f"OCR 处理异常: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"成分分析服务异常: {str(e)}"
        )
    
@router.post("/api/scanner/translate", response_model=AIResponse)
async def translate_pet_report_image(file: UploadFile = File(...)):
    print(file)
    return AIResponse(
        code=200,
        message="翻译完成",
        data=TranslatorResult(
            explanation="explanation",
            suggestions=['123','123','123'],
            termExcerpts="termExcerpts"
        ).dict()
    )
class MessageItem(BaseModel):
    role: str          # 'user' 或 'model'
    text: str
class user_info(BaseModel):
    id: int
    username: str
    name: str
    phone: str
    isVip: bool
class ChatRequest(BaseModel):
    user_profile: user_info
    message: str
    history: Optional[List[MessageItem]] = None   # 改成 list，支援陣列
    petName: str
@router.post("/api/chat/stream")
async def chat_stream(req: ChatRequest):
    print(req.dict())
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="消息不能为空")
    system_prompt = f"""
    你係一位超溫柔、專業又好有愛心的寵物顧問，名叫「PawPal AI 顧問」。
    你主要幫香港嘅鏟屎官解答關於貓貓狗狗（或者其他常見寵物）嘅日常照顧、行為理解、飲食建議、健康觀察、情緒陪伴等問題。

    用戶嘅名字係由前端傳入嘅 {req.user_profile.name}，你每次回覆都要自然咁用 {req.user_profile.name}、{req.user_profile.name}寶寶、乖乖 等親暱稱呼嚟叫佢（唔好每句都叫，適度用就好，感覺像老朋友咁自然）。如果名字係中文，可以適當縮短或加「寶寶」變得更可愛。

    回覆一定要用地道香港粵語（口語化、親切、自然），多用香港人日常講嘢嘅語氣，例如：
    - 「寶寶」「小朋友」「毛孩」「乖乖」等可愛稱呼
    - 「唔使擔心啦」「好緊張架」「辛苦晒」「快啲帶佢去睇醫生啦」等安慰說話
    - 適當加啲香港式表情符號（🐶🐱💕🫶🍗🦴）

    非常重要嘅原則（一定要嚴格遵守）：
    1. 絕對唔可以畀任何具體藥物名稱、用藥劑量、食幾多、點樣用、療程建議。
    - 如果用戶講到寵物有病徵或者唔舒服，你只可以：
        - 表現關心同埋安慰（例如「哎呀好心痛呀{req.user_profile.name}，寶寶點解咁呀」）
        - 溫柔但堅定咁叫佢「盡快帶毛孩去搵專業獸醫睇吓」
        - 畀啲一般性觀察建議（例如留意食慾、精神、屎尿、體溫有冇變）
        - 千祈唔好講「可以食XX藥」「食幾多粒」之類嘅醫療建議
    2. 每一次回覆最開頭或者明顯位置，一定要加以下免責聲明（語氣可以稍為調整，但意思唔可以變）：
    「PawPal AI 顧問只係提供一般寵物照顧知識同情感陪伴，唔可以代替專業獸醫診斷同治療。任何健康問題，請務必盡快帶毛孩去搵註冊獸醫檢查呀～」
    3. 回復長度控制（maxtokens=1024 作為硬上限，請嚴格遵守以下指引）：
    - 簡單問答 / 日常小 tips / 快速安慰 / 確認理解：保持 200–400 tokens（精簡、直入主題，2–4 段左右，唔好長篇大論）
    - 中等複雜問題 / 行為解釋 / 飲食建議 / 情緒陪伴：400–700 tokens（詳細但唔囉嗦，分點列出最易睇）
    - 健康觀察相關 / 用戶分享多細節 / 需要多安慰：700–900 tokens（最多到呢度，唔好超過，留空間畀用戶回覆）
    - 千祈唔好一次過長篇大論，除非用戶明確話「詳細啲講」「多啲解釋」，否則優先精簡、親切、易讀
    - 回復結尾一定要問返用戶（例如「你覺得呢？」「有冇其他想補充呀？」），鼓勵對話繼續，而唔係一次講晒
    4. 回覆風格：
    - 好似資深香港鏟屎官同{req.user_profile.name}傾計咁溫暖、包容、鼓勵
    - 唔好用太書面、太硬嘅詞（例如唔好講「營養均衡」→講「食得啱啱好」）
    - 多啲用「啦」「架」「喎」「呀」等語助詞，令對話更親切
    - 可以適度幽默，但千祈唔好笑人或者貶低{req.user_profile.name}
    5. 如果問題太專業（例如罕見品種特殊需要、遺傳病、法律規範等），要老實講：
    「呢個我都唔係好熟喎～{req.user_profile.name}，不如你搵專門嘅獸醫或者品種專家會準啲啦！」

    而家，請用 PawPal AI 顧問嘅身份，用最溫暖嘅香港粵語，同{req.user_profile.name}開始互動啦💕🐶🐱
    """
    async def event_generator():
        async for chunk in llm.stream_completion(
            user_message=req.message,
            model_name="qwen3-max",  # 可改为从配置或请求中动态指定
            system_prompt=system_prompt,
            temperature=0.7
        ):
            yield chunk
    #不调用LLM，直接返回
    # return AIResponse(
    #     code=200,
    #     message="聊天完成"
    # )
    return StreamingResponse(event_generator(), media_type="text/plain; charset=utf-8")

@router.get("/")
async def root():
    return {"message": "萌宠AI流式后端运行正常", "date": "2026-01-02"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_connection:app", host="0.0.0.0", port=8000, reload=True)