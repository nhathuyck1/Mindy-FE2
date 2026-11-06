import type { CodeLanguageKey } from '../schemas/code-contracts';

/** Lightweight syntax highlighting for the code editor (JavaScript and Java). */

export type TokenKind =
  | 'keyword'
  | 'control'
  | 'string'
  | 'number'
  | 'literal'
  | 'function'
  | 'type'
  | 'property'
  | 'comment'
  | 'doctag'
  | 'operator'
  | 'bracket'
  | 'plain';

export type Token = { kind: TokenKind; text: string; from: number };

const words = (text: string) => new Set(text.split(' '));

const control = words(
  'if else for while do return break continue switch case default try catch finally throw yield await',
);
const keywords: Record<CodeLanguageKey, Set<string>> = {
  javascript: words(
    'const let var function class extends new delete typeof instanceof in of async static get set import export from as void with debugger',
  ),
  java21: words(
    'public private protected static final abstract class interface enum record extends implements new instanceof import package var void throws synchronized volatile transient native strictfp sealed permits non-sealed assert',
  ),
};
const literals: Record<CodeLanguageKey, Set<string>> = {
  javascript: words('true false null undefined this super NaN Infinity arguments'),
  java21: words('true false null this super'),
};
const javaTypes = words('int long double float boolean char byte short');

const pattern = new RegExp(
  [
    String.raw`(?<comment>\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))`,
    String.raw`(?<string>"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|\x60(?:\\[\s\S]|[^\x60\\])*\x60?)`,
    String.raw`(?<number>(?:0[xX][\da-fA-F_]+|0[bB][01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)[lLfFdDn]?(?![\w$]))`,
    String.raw`(?<annotation>@[A-Za-z_]\w*)`,
    String.raw`(?<word>[A-Za-z_$][\w$]*)`,
    String.raw`(?<space>\s+)`,
    String.raw`(?<bracket>[()[\]{}])`,
    String.raw`(?<other>[\s\S])`,
  ].join('|'),
  'g',
);

function nextChar(source: string, from: number) {
  for (let i = from; i < source.length; i++) if (!/\s/.test(source[i])) return source[i];
  return '';
}
function prevChar(tokens: Token[]) {
  for (let i = tokens.length - 1; i >= 0; i--)
    if (tokens[i].kind !== 'plain' || tokens[i].text.trim()) return tokens[i];
  return undefined;
}

export function tokenize(source: string, language: CodeLanguageKey): Token[] {
  const tokens: Token[] = [];
  const push = (kind: TokenKind, text: string, from: number) => {
    const last = tokens[tokens.length - 1];
    if (last && last.kind === kind && (kind === 'plain' || kind === 'operator')) last.text += text;
    else tokens.push({ kind, text, from });
  };
  for (const match of source.matchAll(pattern)) {
    const text = match[0];
    const from = match.index;
    const g = match.groups ?? {};
    if (g.comment !== undefined) {
      // JSDoc / Javadoc tags inside block comments get their own colour.
      let offset = 0;
      for (const part of text.split(/(@[a-zA-Z]+)/)) {
        if (part)
          push(
            part.startsWith('@') && text.startsWith('/**') ? 'doctag' : 'comment',
            part,
            from + offset,
          );
        offset += part.length;
      }
    } else if (g.string !== undefined) push('string', text, from);
    else if (g.number !== undefined) push('number', text, from);
    else if (g.annotation !== undefined) push(language === 'java21' ? 'type' : 'plain', text, from);
    else if (g.word !== undefined) {
      const before = prevChar(tokens);
      const after = nextChar(source, from + text.length);
      let kind: TokenKind = 'plain';
      if (control.has(text)) kind = 'control';
      else if (keywords[language].has(text)) kind = 'keyword';
      else if (literals[language].has(text)) kind = 'literal';
      else if (language === 'java21' && javaTypes.has(text)) kind = 'type';
      else if (after === '(') kind = 'function';
      else if (before?.text.endsWith('.') && before.kind === 'operator') kind = 'property';
      else if (/^[A-Z]/.test(text)) kind = 'type';
      else if (before?.kind === 'keyword' && before.text === 'function') kind = 'function';
      push(kind, text, from);
    } else if (g.space !== undefined) push('plain', text, from);
    else if (g.bracket !== undefined) push('bracket', text, from);
    else push('operator', text, from);
  }
  return tokens;
}

const pairs: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
  ')': '(',
  ']': '[',
  '}': '{',
};

/**
 * Offsets of the bracket next to the caret and its partner (ignoring brackets inside strings and
 * comments), or null when the caret is not touching a bracket.
 */
export function matchBracket(tokens: Token[], caret: number): [number, number] | null {
  const brackets = tokens.filter((t) => t.kind === 'bracket');
  const at =
    brackets.find((t) => t.from === caret - 1 && ')]}'.includes(t.text)) ??
    brackets.find((t) => t.from === caret) ??
    brackets.find((t) => t.from === caret - 1);
  if (!at) return null;
  const opening = '([{'.includes(at.text);
  const index = brackets.indexOf(at);
  let depth = 0;
  for (
    let i = index + (opening ? 1 : -1);
    opening ? i < brackets.length : i >= 0;
    i += opening ? 1 : -1
  ) {
    const b = brackets[i];
    if (b.text === at.text) depth++;
    else if (b.text === pairs[at.text]) {
      if (depth === 0) return [at.from, b.from];
      depth--;
    }
  }
  return null;
}

/** Tokens split into lines (block comments and template strings may span several lines). */
export function tokenLines(source: string, language: CodeLanguageKey): Omit<Token, 'from'>[][] {
  const lines: Omit<Token, 'from'>[][] = [[]];
  for (const token of tokenize(source, language))
    token.text.split('\n').forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part) lines[lines.length - 1]?.push({ kind: token.kind, text: part });
    });
  return lines;
}
