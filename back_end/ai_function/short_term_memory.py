# -*- coding: utf-8 -*-
"""
短期记忆模块：规则初筛 + 最近 N 轮对话窗口 + 上下文压缩（不依赖 Milvus）。
"""
from typing import List, Optional, Tuple

# 规则初筛：是否需要上下文的触发模式
# 指代、延续、追问、极短句 等 → 需要上下文
CONTEXT_NEEDED_KEYWORDS = (
    "继续", "还有呢", "还有吗", "然后呢", "接着", "再说", "详细", "多讲", "多說",
    "刚才", "剛剛", "上面", "之前", "你說的", "你说的", "你講的", "你讲的",
    "它", "牠", "这个", "這個", "那个", "那個", "这样", "這樣", "那样", "那樣",
    "呢", "嗎", "吗", "呀", "啊", "哦", "嗯", "對", "对", "是", "好", "唔",
)
# 若消息以这些结尾或整句很短，可能是追问
CONTEXT_NEEDED_ENDINGS = ("呢", "嗎", "吗", "呀", "啊", "哦", "對", "对", "是", "好", "唔")
# 极短消息长度阈值（字符数），短于此次数且存在 history 时倾向需要上下文
SHORT_MESSAGE_MAX_LEN = 4


def need_context(current_message: str, history: Optional[List[dict]]) -> bool:
    """
    规则初筛：判断当前问题是否真的需要用到对话上下文。
    - 无历史 → 不需要
    - 有历史 + （含指代/延续关键词 或 以追问语气结尾 或 消息极短）→ 需要
    """
    if not history or len(history) == 0:
        return False
    msg = (current_message or "").strip()
    if not msg:
        return False

    # 极短句且已有对话 → 多为延续
    if len(msg) <= SHORT_MESSAGE_MAX_LEN:
        return True

    # 含明确“需要上下文”关键词
    for kw in CONTEXT_NEEDED_KEYWORDS:
        if kw in msg:
            return True

    # 以追问/确认类结尾
    for end in CONTEXT_NEEDED_ENDINGS:
        if msg.endswith(end) or msg.rstrip().endswith(end):
            return True

    return False


def get_last_n_rounds(
    history: List[dict],
    n: int = 5,
    role_key: str = "role",
    text_key: str = "text",
) -> List[Tuple[str, str]]:
    """
    从 history 中取最近 n 轮对话。每轮为 (user_text, model_text)。
    history 项格式：{"role": "user"|"model", "text": "..."}
    """
    if not history or n <= 0:
        return []
    rounds = []
    i = len(history) - 1
    while i >= 0 and len(rounds) < n:
        # 找一对：先找 model，再找 user
        model_text = ""
        user_text = ""
        if (history[i].get(role_key) or "").lower() in ("model", "assistant", "ai"):
            model_text = (history[i].get(text_key) or "").strip()
            i -= 1
        while i >= 0 and (history[i].get(role_key) or "").lower() not in ("user",):
            i -= 1
        if i >= 0:
            user_text = (history[i].get(text_key) or "").strip()
            i -= 1
        if user_text or model_text:
            rounds.append((user_text, model_text))
    rounds.reverse()
    return rounds


def format_rounds_as_document(rounds: List[Tuple[str, str]]) -> str:
    """把若干轮对话格式化成一段可给 LLM 压缩的文本。"""
    lines = []
    for i, (u, m) in enumerate(rounds, 1):
        if u:
            lines.append(f"用户：{u}")
        if m:
            lines.append(f"助手：{m}")
    return "\n".join(lines) if lines else ""
