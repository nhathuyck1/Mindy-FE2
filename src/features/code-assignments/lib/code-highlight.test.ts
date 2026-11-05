import { describe, expect, it } from 'vitest';
import { matchBracket, tokenize } from './code-highlight';

const kinds = (source: string, language: 'javascript' | 'java21' = 'javascript') =>
  tokenize(source, language)
    .filter((t) => t.text.trim())
    .map((t) => `${t.kind}:${t.text.trim()}`);

describe('tokenize', () => {
  it('keeps every character so the coloured layer lines up with the textarea', () => {
    const source = '/** @param {number} a */\nfunction sum(a, b) {\n  return `x${a}` + "y";\n}\n';
    expect(
      tokenize(source, 'javascript')
        .map((t) => t.text)
        .join(''),
    ).toBe(source);
  });

  it('colours JavaScript keywords, calls, properties, literals and doc tags', () => {
    expect(kinds('const n = Math.max(a, 1.5) ?? null; // hi')).toEqual([
      'keyword:const',
      'plain:n',
      'operator:=',
      'type:Math',
      'operator:.',
      'function:max',
      'bracket:(',
      'plain:a',
      'operator:,',
      'number:1.5',
      'bracket:)',
      'operator:??',
      'literal:null',
      'operator:;',
      'comment:// hi',
    ]);
    expect(kinds('/** @return {number} */')).toContain('doctag:@return');
    expect(kinds('if (x) return y.length;')).toEqual([
      'control:if',
      'bracket:(',
      'plain:x',
      'bracket:)',
      'control:return',
      'plain:y',
      'operator:.',
      'property:length',
      'operator:;',
    ]);
  });

  it('colours Java primitive types, annotations and escaped strings', () => {
    expect(kinds('@Override public long sum(int[] a) { String s = "a\\"b"; }', 'java21')).toEqual([
      'type:@Override',
      'keyword:public',
      'type:long',
      'function:sum',
      'bracket:(',
      'type:int',
      'bracket:[',
      'bracket:]',
      'plain:a',
      'bracket:)',
      'bracket:{',
      'type:String',
      'plain:s',
      'operator:=',
      'string:"a\\"b"',
      'operator:;',
      'bracket:}',
    ]);
  });
});

describe('matchBracket', () => {
  const source = 'f(a[1], "(", { b: (c) })';
  const tokens = tokenize(source, 'javascript');

  it('finds the partner of the bracket touching the caret, skipping strings', () => {
    expect(matchBracket(tokens, 1)).toEqual([1, source.length - 1]);
    expect(matchBracket(tokens, source.length)).toEqual([source.length - 1, 1]);
    expect(matchBracket(tokens, source.indexOf('{'))).toEqual([
      source.indexOf('{'),
      source.length - 2,
    ]);
  });

  it('returns null away from brackets', () => {
    expect(matchBracket(tokens, source.indexOf('b'))).toBeNull();
  });
});
