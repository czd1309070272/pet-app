/** 將描述拆成普通文字與 #標籤，用於 TikTok 風格高亮 */
export function parseDescription(
  description: string
): { type: 'text' | 'tag'; value: string }[] {
  const parts: { type: 'text' | 'tag'; value: string }[] = [];
  const tagRegex = /#[\w\u4e00-\u9fa5]+/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(description)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ type: 'text', value: description.slice(lastIndex, m.index) });
    }
    parts.push({ type: 'tag', value: m[0] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < description.length) {
    parts.push({ type: 'text', value: description.slice(lastIndex) });
  }
  return parts.length ? parts : [{ type: 'text', value: description }];
}
