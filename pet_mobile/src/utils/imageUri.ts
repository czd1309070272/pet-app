/** 占位图，避免 Image source.uri 为空导致 RN 报错 */
const PLACEHOLDER = 'https://picsum.photos/seed/placeholder/200';

/**
 * 确保返回非空可用的图片 URI，避免 source.uri should not be an empty string 警告
 */
export function ensureImageUri(
  uri: string | undefined | null,
  placeholder = PLACEHOLDER
): string {
  const s = uri != null ? String(uri).trim() : '';
  return s !== '' ? s : placeholder;
}
