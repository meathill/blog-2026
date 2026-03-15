const MARKDOWN_BLOCK_PATTERNS = [
  /^\s{0,3}#{1,6}\s+\S/m,
  /^\s{0,3}>+\s+\S/m,
  /^\s{0,3}[-*+]\s+\S/m,
  /^\s{0,3}\d+\.\s+\S/m,
  /(?:^|\n)```[\w-]*\n[\s\S]*?\n```(?:\n|$)/m,
  /(?:^|\n)~~~[\w-]*\n[\s\S]*?\n~~~(?:\n|$)/m,
  /^\|.+\|\s*$/m,
  /^\s*([-*_]\s*){3,}$/m,
];

const MARKDOWN_INLINE_PATTERNS = [
  /\[[^\]]+\]\([^)]+\)/,
  /!\[[^\]]*]\([^)]+\)/,
  /`[^`\n]+`/,
  /(\*\*|__|~~)[^\n]+?(\*\*|__|~~)/,
];

export function looksLikeMarkdownDocument(value: string | null | undefined): boolean {
  const text = value?.trim() || '';
  if (!text) {
    return false;
  }

  if (/\n\s*\n/.test(text)) {
    return true;
  }

  if (MARKDOWN_BLOCK_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }

  return MARKDOWN_INLINE_PATTERNS.some((pattern) => pattern.test(text));
}
