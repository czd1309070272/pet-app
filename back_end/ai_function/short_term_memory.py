# -*- coding: utf-8 -*-
"""
短期记忆模块：最近 5 轮对话窗口 + 上下文压缩（不依赖 Milvus）。
固定带上下文，不再规则初筛。
"""
from typing import List, Tuple


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
