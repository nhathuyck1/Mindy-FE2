/**
 * Code in chat messages travels as plain TEXT with a markdown fence (```js … ```), so older
 * clients still show readable text and the backend needs no new message type.
 */
export type ChatCodeLanguage = 'javascript' | 'java21';

export type ChatSegment =
  | { kind: 'text'; text: string }
  | { kind: 'code'; code: string; language: ChatCodeLanguage | null; label: string };

const fenceLabel: Record<ChatCodeLanguage, string> = { javascript: 'js', java21: 'java' };
const fromLabel: Record<string, ChatCodeLanguage> = {
  js: 'javascript',
  javascript: 'javascript',
  jsx: 'javascript',
  ts: 'javascript',
  typescript: 'javascript',
  java: 'java21',
};

/** Same limit as a chat TEXT message. */
export const CHAT_TEXT_MAX = 4000;

export function codeFence(code: string, language: ChatCodeLanguage): string {
  return `\`\`\`${fenceLabel[language]}\n${code.replace(/\s+$/, '')}\n\`\`\``;
}

/** Splits a message body into text and fenced code blocks (an unclosed fence stays text). */
export function parseChatBody(body: string): ChatSegment[] {
  const segments: ChatSegment[] = [];
  const fence = /```([\w+-]*)[ \t]*\n([\s\S]*?)\n?```/g;
  let last = 0;
  for (const match of body.matchAll(fence)) {
    const before = body.slice(last, match.index).replace(/\n+$/, '');
    if (before.trim()) segments.push({ kind: 'text', text: before });
    const label = (match[1] ?? '').toLowerCase();
    segments.push({
      kind: 'code',
      code: match[2] ?? '',
      language: fromLabel[label] ?? null,
      label: label || 'code',
    });
    last = match.index + match[0].length;
  }
  const rest = body.slice(last).replace(/^\n+/, '');
  if (rest.trim() || !segments.length) segments.push({ kind: 'text', text: rest });
  return segments;
}
