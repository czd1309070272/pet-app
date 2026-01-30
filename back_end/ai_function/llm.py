from openai import AsyncOpenAI  # 改为异步客户端
import os
import json
import logging
import asyncio
import re
from typing import Optional
from typing import List, Dict, AsyncGenerator,Literal
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
current_dir = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(current_dir, "key_pool.json")
class LanguageModel:
    def __init__(self):
        self.temperature = 0.7
        self.key_pool = self._load_key_pool()
        self.max_tokens = 1024

    def _load_key_pool(self) -> List[Dict]:
        if not os.path.exists(CONFIG_FILE):
            logger.error(f"❌ 配置文件不存在: {CONFIG_FILE}")
            return []
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
                return config.get("key_pool", [])
        except Exception as e:
            logger.error(f"❌ 加载密钥池失败: {e}")
            return []
    def parse_llm_json(self,raw_response):
        try:
            # 1. 嘗試直接解析
            return json.loads(raw_response)
        except json.JSONDecodeError:
            # 2. 如果失敗，嘗試提取 ```json { ... } ``` 內部的內容
            match = re.search(r'\{.*\}', raw_response, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except:
                    pass
            return None
    def parse_pet_drug_json(self, raw_response: str) -> Optional[Dict]:
        """
        專門解析更新後的簡化 JSON 格式（ScannerResult 對應結構）
        {
        "riskIngredients": ["成分A", ...],
        "safeIngredients": ["成分X", ...],
        "resultUrl": "",
        "summary": "總結文字"
        }
        """
        if not raw_response or not isinstance(raw_response, str):
            return None

        # 步驟1: 去除常見的 markdown 代碼塊包裹（最常見的 LLM 輸出格式）
        cleaned = re.sub(r'^```(?:json)?\s*|\s*```$', '', raw_response.strip(), flags=re.IGNORECASE | re.MULTILINE)
        cleaned = re.sub(r'^```|\s*```$', '', cleaned.strip())

        # 步驟2: 強制處理控制字元（避免 Invalid control character 錯誤）
        cleaned = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', lambda m: f'\\u{ord(m.group(0)):04x}', cleaned)

        # 步驟3: 移除常見的尾隨逗號（LLM 常犯錯誤）
        cleaned = re.sub(r',\s*([}\]])', r'\1', cleaned)

        # 步驟4: 嘗試直接解析
        try:
            data = json.loads(cleaned)
            required_keys = {"riskIngredients", "safeIngredients", "resultUrl", "summary"}
            if required_keys.issubset(data.keys()):
                # 可選：簡單類型驗證
                if (isinstance(data["riskIngredients"], list) and
                    isinstance(data["safeIngredients"], list) and
                    isinstance(data["resultUrl"], str) and
                    isinstance(data["summary"], str)):
                    return data
        except json.JSONDecodeError as e:
            print(f"直接解析失敗: {e}")
            print(f"位置: line {e.lineno} col {e.colno} (char {e.pos})")

        # 步驟5: 更寬鬆提取（找第一個完整 { ... }）
        match = re.search(r'\{[\s\S]*\}', cleaned, re.DOTALL)
        if match:
            json_part = match.group(0)
            try:
                data = json.loads(json_part)
                required_keys = {"riskIngredients", "safeIngredients", "resultUrl", "summary"}
                if required_keys.issubset(data.keys()):
                    if (isinstance(data["riskIngredients"], list) and
                        isinstance(data["safeIngredients"], list) and
                        isinstance(data["resultUrl"], str) and
                        isinstance(data["summary"], str)):
                        return data
            except json.JSONDecodeError as e:
                print(f"提取後仍失敗: {e}")
                print(f"提取片段前200字: {json_part[:200]}...")

        # 步驟6: 最終失敗，返回 None
        return None
    async def stream_completion(
            self,
            user_message: str,
            model_name: str,
            system_prompt: str = "",
            temperature: float | None = None,
        ) -> AsyncGenerator[str, None]:
            """
            核心流式调用方法：返回 AsyncGenerator[str]
            供 API 层直接转发给前端
            """
            if temperature is not None:
                self.temperature = temperature

            candidates = [item for item in self.key_pool if item["model"] == model_name]
            if not candidates:
                yield f"【错误】未找到模型 {model_name} 的可用配置"
                return

            for idx, resource in enumerate(candidates):
                api_key = resource["api_key"]
                base_url = resource["base_url"]
                provider = resource["provider"]
                client = AsyncOpenAI(api_key=api_key, base_url=base_url, timeout=60.0)

                for attempt in range(1, 4):
                    try:
                        logger.info(
                            f"[{provider}] 使用模型 {model_name} (第 {idx+1}/{len(candidates)} 配置) "
                            f"第 {attempt} 次尝试"
                        )

                        completion = await client.chat.completions.create(
                            model=model_name,
                            messages=[
                                {"role": "system", "content": system_prompt or "你是专业的助手。"},
                                {"role": "user", "content": user_message},
                            ],
                            temperature=self.temperature,
                            max_tokens=self.max_tokens,
                            stream=True
                        )

                        async for chunk in completion:
                            if chunk.choices[0].delta.content is not None:
                                yield chunk.choices[0].delta.content

                        await client.close()
                        return  # 成功后直接返回，不再尝试其他密钥

                    except Exception as e:
                        error_str = str(e).lower()
                        # 永久性错误：立即切换下一个密钥，不重试
                        if any(k in error_str for k in ["authentication", "invalid api key", "insufficient_quota",
                                                    "quota exceeded", "rate limit", "billing", "not found"]):
                            logger.warning(f"永久性错误，切换下一个配置: {e}")
                            break

                        logger.warning(f"临时性错误，第 {attempt} 次失败: {e}")
                        if attempt < 3:
                            await asyncio.sleep(2 ** attempt)  # 指数退避

                await client.close()  # 确保关闭

            yield "【系统错误】所有模型配置均调用失败，请检查密钥或网络"
    async def completion(
            self,
            user_message: str,
            model_name: str,
            system_prompt: str = "",
            temperature: Optional[float] = None,
        ) -> str:
            """
            非流式呼叫，返回完整的回應字符串（一次性）
            如果全部失敗，返回錯誤訊息字符串
            """
            if temperature is not None:
                self.temperature = temperature

            candidates = [item for item in self.key_pool if item["model"] == model_name]
            if not candidates:
                return f"【錯誤】未找到模型 {model_name} 的可用配置"

            full_response = ""

            for idx, resource in enumerate(candidates):
                api_key = resource["api_key"]
                base_url = resource["base_url"]
                provider = resource["provider"]

                client = AsyncOpenAI(api_key=api_key, base_url=base_url, timeout=60.0)

                for attempt in range(1, 4):
                    try:
                        logger.info(
                            f"[{provider}] 非流式 - 模型 {model_name} (第 {idx+1}/{len(candidates)} 配置) "
                            f"第 {attempt} 次嘗試"
                        )

                        completion = await client.chat.completions.create(
                            model=model_name,
                            messages=[
                                {"role": "system", "content": system_prompt or "你是專業的助手。"},
                                {"role": "user", "content": user_message},
                            ],
                            temperature=self.temperature,
                            stream=False   # ← 關鍵：關閉 stream
                        )

                        if completion.choices and completion.choices[0].message.content:
                            full_response = completion.choices[0].message.content
                            await client.close()
                            return full_response.strip()

                    except Exception as e:
                        error_str = str(e).lower()
                        if any(k in error_str for k in [
                            "authentication", "invalid api key", "insufficient_quota",
                            "quota exceeded", "rate limit", "billing", "not found"
                        ]):
                            logger.warning(f"永久性錯誤，切換下一個配置: {e}")
                            break

                        logger.warning(f"臨時性錯誤，第 {attempt} 次失敗: {e}")
                        if attempt < 3:
                            await asyncio.sleep(2 ** attempt)

                await client.close()

            return "【系統錯誤】所有模型配置均調用失敗，請檢查密鑰或網絡"
llm=LanguageModel()
if __name__ == '__main__':
    # llm=LanguageModel()
    # async def event_generator():
    #     async for chunk in llm.stream_completion(
    #         user_message="hello",
    #         model_name="qwen3-max",  # 可改为从配置或请求中动态指定
    #         system_prompt='你是一个宠物专家',
    #         temperature=0.7
    #     ):
    #         yield chunk
    result_from_llm="""
    {
        "riskIngredients": [],
        "safeIngredients": ["吡虫啉", "莫昔克丁"],
        "resultUrl": "",
        "summary": "金毛犬3歲雄性，使用本品整體安全性高，無已知禁忌；關鍵警示：避免犬隻舔舐藥液，以免引發神經系統反應。"
    }
    """
    result=llm.parse_pet_drug_json(result_from_llm)
    print(result)
