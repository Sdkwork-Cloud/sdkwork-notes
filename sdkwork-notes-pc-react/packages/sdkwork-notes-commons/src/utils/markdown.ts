export function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function estimateWordCount(value: string) {
  const cjk = (value.match(/[\u4e00-\u9fff]/g) || []).length;
  const latin = value.replace(/[\u4e00-\u9fff]/g, ' ');
  const words = latin.trim().split(/\s+/).filter(Boolean).length;
  return cjk + words;
}
