from fastapi import FastAPI, HTTPException,UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .ocr import ocr
from .llm import llm
from .short_term_memory import get_last_n_rounds, format_rounds_as_document
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
    riskIngredients: list[str] = []
    safeIngredients: list[str] = []
    summary: str
    resultUrl: str = ""  # 前端展示用，后端返回空串，前端用本地图片 uri 覆盖
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
        # --- 先使用模擬數據，不調用真實 API（以下已注釋）---
        # contents = await file.read()
        # if len(contents) > 10 * 1024 * 1024:
        #     raise HTTPException(status_code=400, detail="图片太大，请上传小于10MB的文件")
        # base64_image = base64.b64encode(contents).decode("utf-8")
        # mime_type = file.content_type
        # image_data_uri = f"data:{mime_type};base64,{base64_image}"
        # time.sleep(2)
        # response = ocr.ocr_image(image_data_uri)
        # if response.pages:
        #     ocr_result = response.pages[0].markdown
        # else:
        #     ocr_result = ""
        # system_prompt = f"""..."""  # 見上方原 prompt
        # raw = await llm.completion(...)
        # json_result = llm.parse_llm_json(raw)
        # result = ScannerResult(...)

        # 模擬返回，供前端聯調
        result = ScannerResult(
            riskIngredients=[],
            safeIngredients=["雞肉", "維生素 E", "牛磺酸", "Omega-3"],
            summary=f"該產品成分整體適合當前寵物（品種：{breed}，年齡：{age}），無明顯過敏風險。（模擬數據）",
            resultUrl="",
        )
        return AIResponse(code=200, message="OCR完成", data=result.dict())
    except Exception as e:
        print(f"OCR 处理异常: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"成分分析服务异常: {str(e)}"
        )
class TranslatorResult(BaseModel):
    explanation: str
    suggestions: List[str] = []
    termExcerpts: str


@router.post("/api/scanner/translate", response_model=AIResponse)
async def translate_pet_report_image(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="未上传图片")
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="只支持 jpg / png / webp 格式")
    try:
        # --- 先使用模擬數據，不調用真實 API（以下已注釋）---
        # contents = await file.read()
        # if len(contents) > 10 * 1024 * 1024:
        #     raise HTTPException(status_code=400, detail="图片太大，请上传小于10MB的文件")
        # base64_image = base64.b64encode(contents).decode("utf-8")
        # image_data_uri = f"data:{mime_type};base64,{base64_image}"
        # response = ocr.ocr_image(image_data_uri)
        # ocr_result = response.pages[0].markdown if response.pages else ""
        # raw = await llm.completion(user_message=ocr_result, ...)
        # json_result = llm.parse_pet_translate_json(raw)
        # result = TranslatorResult(...)

        # 模擬返回，供前端聯調
        result = TranslatorResult(
            explanation="報告解讀：各項指標在正常範圍內，未見明顯異常。建議定期追蹤。（模擬數據）",
            suggestions=[
                "一週後可複查血常規",
                "注意飲食與休息",
                "若有異常症狀請就醫",
            ],
            termExcerpts="WBC (白細胞)：偏高可能表示輕微發炎或感染\nRBC (紅細胞)：在正常範圍內",
        )
        return AIResponse(code=200, message="翻译完成", data=result.dict())
    except Exception as e:
        print(f"诊疗报告 异常: {str(e)}")
        raise HTTPException(status_code=500, detail=f"报告识别异常: {str(e)}")
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

    # 短期记忆：固定带最近 5 轮对话的压缩上下文（不再初筛）
    history_list = req.history or []
    user_message = req.message
    if history_list:
        history_for_rules = [{"role": m.role, "text": m.text} for m in history_list]
        rounds = get_last_n_rounds(history_for_rules, n=5)
        if rounds:
            doc = format_rounds_as_document(rounds)
            compressed = await llm.compress_conversation_context(
                doc, req.message, model_name="qwen-flash"
            )
            if compressed:
                user_message = f"【近期对话摘要】\n{compressed}\n\n【用户当前问题】\n{req.message}"

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

    若用戶消息中包含「近期對話摘要」同「用戶當前問題」，請結合摘要理解上文，再針對「用戶當前問題」作答。

    而家，請用 PawPal AI 顧問嘅身份，用最溫暖嘅香港粵語，同{req.user_profile.name}開始互動啦💕🐶🐱
    """
    async def event_generator():
        # 使用 LangChain 實現的流式輸出（見 llm.stream_completion_langchain）
        async for chunk in llm.stream_completion_langchain(
            user_message=user_message,
            model_name="qwen-flash",  # 可改为从配置或请求中动态指定
            system_prompt=system_prompt,
            temperature=0.7,
        ):
            yield chunk
    # 流式輸出：禁止緩存與代理緩衝，確保打字機效果
    # 注意：使用 application/octet-stream 可避免 iOS URLSession 緩衝首 ~512 字節
    # 見 https://github.com/expo/expo/issues/32950
    return StreamingResponse(
        event_generator(),
        media_type="application/octet-stream",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
            "Content-Type": "application/octet-stream",
        },
    )

@router.get("/")
async def root():
    return {"message": "萌宠AI流式后端运行正常", "date": "2026-01-02"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_connection:app", host="0.0.0.0", port=8000, reload=True)