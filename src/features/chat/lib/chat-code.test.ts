import { describe, expect, it } from 'vitest';
import { codeFence, parseChatBody } from './chat-code';

describe('parseChatBody', () => {
  it('keeps plain messages as one text segment', () => {
    expect(parseChatBody('Chào thầy')).toEqual([{ kind: 'text', text: 'Chào thầy' }]);
  });

  it('splits text and fenced code, reading the language label', () => {
    expect(parseChatBody('Xem đoạn này:\n```js\nreturn a + b;\n```\nĐúng chưa?')).toEqual([
      { kind: 'text', text: 'Xem đoạn này:' },
      { kind: 'code', code: 'return a + b;', language: 'javascript', label: 'js' },
      { kind: 'text', text: 'Đúng chưa?' },
    ]);
    expect(parseChatBody('```java\nint x = 1;\n```')).toEqual([
      { kind: 'code', code: 'int x = 1;', language: 'java21', label: 'java' },
    ]);
  });

  it('shows unknown languages without colours and leaves an unclosed fence as text', () => {
    expect(parseChatBody('```py\nprint(1)\n```')[0]).toMatchObject({ language: null, label: 'py' });
    expect(parseChatBody('```js\nchưa đóng')).toEqual([{ kind: 'text', text: '```js\nchưa đóng' }]);
  });
});

describe('codeFence', () => {
  it('round-trips through parseChatBody', () => {
    const body = codeFence('function sum(a, b) {\n  return a + b;\n}\n\n', 'javascript');
    expect(body).toBe('```js\nfunction sum(a, b) {\n  return a + b;\n}\n```');
    expect(parseChatBody(body)).toEqual([
      {
        kind: 'code',
        code: 'function sum(a, b) {\n  return a + b;\n}',
        language: 'javascript',
        label: 'js',
      },
    ]);
  });
});
