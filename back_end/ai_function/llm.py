from openai import AsyncOpenAI  # 改为异步客户端
import os
import json
import logging
import asyncio
import re
from typing import Optional
from typing import List, Dict, AsyncGenerator

# LangChain 流式輸出（AI 顧問聊天）
try:
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import SystemMessage, HumanMessage
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False

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
    # def parse_llm_json(self,raw_response):
    #     try:
    #         # 1. 嘗試直接解析
    #         return json.loads(raw_response)
    #     except json.JSONDecodeError:
    #         # 2. 如果失敗，嘗試提取 ```json { ... } ``` 內部的內容
    #         match = re.search(r'\{.*\}', raw_response, re.DOTALL)
    #         if match:
    #             try:
    #                 return json.loads(match.group())
    #             except:
    #                 pass
    #         return None

    # def parse_pet_drug_json(self, raw_response: str) -> Optional[Dict]:
    #     """
    #     專門解析更新後的簡化 JSON 格式（ScannerResult 對應結構）
    #     """
    #     if not raw_response or not isinstance(raw_response, str):
    #         return None
    #     cleaned = re.sub(r'^```(?:json)?\s*|\s*```$', '', raw_response.strip(), flags=re.IGNORECASE | re.MULTILINE)
    #     cleaned = re.sub(r'^```|\s*```$', '', cleaned.strip())
    #     cleaned = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', lambda m: f'\\u{ord(m.group(0)):04x}', cleaned)
    #     cleaned = re.sub(r',\s*([}\]])', r'\1', cleaned)
    #     try:
    #         data = json.loads(cleaned)
    #         required_keys = {"riskIngredients", "safeIngredients", "resultUrl", "summary"}
    #         if required_keys.issubset(data.keys()):
    #             if (isinstance(data["riskIngredients"], list) and
    #                 isinstance(data["safeIngredients"], list) and
    #                 isinstance(data["resultUrl"], str) and
    #                 isinstance(data["summary"], str)):
    #                 return data
    #     except json.JSONDecodeError:
    #         pass
    #     match = re.search(r'\{[\s\S]*\}', cleaned, re.DOTALL)
    #     if match:
    #         try:
    #             data = json.loads(match.group(0))
    #             required_keys = {"riskIngredients", "safeIngredients", "resultUrl", "summary"}
    #             if required_keys.issubset(data.keys()):
    #                 return data
    #         except json.JSONDecodeError:
    #             pass
    #     return None

    # def parse_pet_translate_json(self,raw_str):
    #     fixed_str = re.sub(r'(?<=[:"\[,])\s*\n\s*(?=[^\]}])', r'\\n', raw_str)
    #     try:
    #         return json.loads(fixed_str, strict=False)
    #     except json.JSONDecodeError:
    #         sanitized = raw_str.replace('\n', ' ').replace('\r', ' ')
    #         return json.loads(sanitized, strict=False)

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

    async def stream_completion_langchain(
            self,
            user_message: str,
            model_name: str,
            system_prompt: str = "",
            temperature: float | None = None,
    ) -> AsyncGenerator[str, None]:
        """
        使用 LangChain ChatOpenAI 的流式輸出，供 API 層轉發給前端（如 AI 顧問聊天）。
        若 LangChain 未安裝或調用失敗，會回退到原有 stream_completion。
        """
        if temperature is not None:
            self.temperature = temperature

        if not LANGCHAIN_AVAILABLE:
            logger.warning("LangChain 未安裝，回退到原有 stream_completion")
            async for chunk in self.stream_completion(
                user_message=user_message,
                model_name=model_name,
                system_prompt=system_prompt,
                temperature=temperature,
            ):
                yield chunk
            return

        candidates = [item for item in self.key_pool if item["model"] == model_name]
        if not candidates:
            yield "【错误】未找到模型 {} 的可用配置".format(model_name)
            return

        for idx, resource in enumerate(candidates):
            api_key = resource["api_key"]
            base_url = resource["base_url"]
            provider = resource.get("provider", "openai")

            for attempt in range(1, 4):
                try:
                    logger.info(
                        "[LangChain] {} 模型 {} (第 {}/{}) 第 {} 次尝试".format(
                            provider, model_name, idx + 1, len(candidates), attempt
                        )
                    )
                    chat = ChatOpenAI(
                        model=model_name,
                        api_key=api_key,
                        base_url=base_url,
                        temperature=self.temperature,
                        max_tokens=self.max_tokens,
                    )
                    messages = [
                        SystemMessage(content=system_prompt or "你是专业的助手。"),
                        HumanMessage(content=user_message),
                    ]
                    async for chunk in chat.astream(messages):
                        if hasattr(chunk, "content") and chunk.content:
                            yield chunk.content
                    return
                except Exception as e:
                    error_str = str(e).lower()
                    if any(
                        k in error_str
                        for k in [
                            "authentication",
                            "invalid api key",
                            "insufficient_quota",
                            "quota exceeded",
                            "rate limit",
                            "billing",
                            "not found",
                        ]
                    ):
                        logger.warning("LangChain 永久性错误，切换下一配置: %s", e)
                        break
                    logger.warning("LangChain 第 %s 次失败: %s", attempt, e)
                    if attempt < 3:
                        await asyncio.sleep(2 ** attempt)

        yield "【系统错误】所有模型配置均调用失败，请检查密钥或网络"

    async def compress_conversation_context(
            self,
            history_document: str,
            current_query: str,
            model_name: str,
    ) -> str:
        """
        上下文压缩：根据用户当前问题，从对话历史中提取与之直接相关的要点，
        用 2～4 句话概括，供主对话使用（不流式，一次调用）。
        """
        if not (history_document or "").strip():
            return ""
        prompt = f"""你是一位助手。请根据用户当前的提问，从下面这段对话历史中只提取与问题直接相关的信息，用 2～4 句话简要概括。不要编造、不要泛泛而谈，只保留对回答当前问题有用的要点。使用与对话相同的语言（粤语/中文）。

【用户当前问题】
{current_query}

【对话历史】
{history_document}

请直接输出概括内容，不要加「概括：」等前缀。"""
        try:
            result = await self.completion(
                user_message=prompt,
                model_name=model_name,
                system_prompt="你只输出对上述对话的简要概括，与当前问题无关的内容不要写。",
                temperature=0.3,
            )
            return (result or "").strip()
        except Exception as e:
            logger.warning("上下文压缩调用失败，将不使用压缩: %s", e)
            return ""

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
                            f"[{provider}] 模型 {model_name} (第 {idx+1}/{len(candidates)} 配置) "
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
# if __name__ == '__main__':
    # llm=LanguageModel()
    # async def event_generator():
    #     async for chunk in llm.stream_completion(
    #         user_message="hello",
    #         model_name="qwen3-max",  # 可改为从配置或请求中动态指定
    #         system_prompt='你是一个宠物专家',
    #         temperature=0.7
    #     ):
    #         yield chunk
    # result_from_llm="""
    # {
    # "explanation": "根據電腦斷層掃描報告，您的小貓（6個月大，公貓）頭部出現一些異常情況。首先，雙側鼻腔、蝶狀竇及左側額竇內有不正常的軟組織物質積聚，尤其左邊較多， 這通常表示有鼻炎（鼻腔發炎），可能由病毒或細菌感染引起，會導致流鼻水、打噴嚏或呼吸困難等症狀。其次，左耳的鼓泡（中耳部位）完全被不均勻的軟組織填滿，右耳則是部分填滿，這提示可能存在中耳息肉或中耳炎伴積液，這類問題會影響聽力，甚至引發耳朵疼痛或平衡感失調。第三，左側下頜淋巴結稍大，但沒有發現腫瘤或其他嚴重問題，考慮是身體對感染產生的反應性腫大，屬於常見現象，通常會隨著感染改善而恢復正常。腦部結構和顱骨對稱，沒有發現異常，這是好消息。整體而言，問題主要集中在鼻子和耳朵，與感染有關的可能性較高，但需進一步檢查以確認診斷。",
    # "suggestion": [
    #     "盡快帶寶貝到獸醫診所做耳內鏡檢查，以明確中耳是否有息肉或積液",
    #     "按醫生建議進行鼻炎治療，可能需要抗生素或抗炎藥物",
    #     "觀察寶貝是否有持續流鼻水、打噴嚏、耳朵抓癢或搖頭等行為，如有惡化立即回診",
    #     "保持環境清潔，避免接觸其他生病的貓，減少感染風險",
    #     "暫時避免自行用滴耳液或藥物，以免加重病情",
    #     "定期回診追蹤淋巴結大小變化及症狀改善情況"
    # ],
    # "termExcerpts": "鼓泡 (鼓室)：中耳的空間，若充滿液體或異物會影響聽力與平衡\n軟組織衰減 (Soft tissue attenuation)：影像上顯示的非骨骼、非氣體的組織密度，代表有分泌物或炎症\n蝶窦 (Sphenoid sinus)：位於頭骨深處的鼻竇之一，易受感染影響\n額竇 (Frontal sinus)：位於額頭後方的鼻竇，發炎時會導致局部壓力感\n鼻甲骨 (Nasal turbinate)：鼻腔內的骨性結構，發炎時會腫脹模糊\n下頜淋巴結 (Submandibular lymph node)：位於下巴下方的淋巴結，感染時會腫大\n反應性淋巴結病 (Reactive lymphadenopathy)：因感 染或炎症導致的淋巴結輕度腫大，屬良性反應\n中耳炎 (Otitis media)：中耳發炎，可能伴隨積液或息肉，會影響聽力與平衡"
    # }
    # """
    # result=llm.super_safe_json_load(result_from_llm)
    # print(result.get('explanation'))
