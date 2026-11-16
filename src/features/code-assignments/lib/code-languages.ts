import type { CodeLanguageKey } from '../schemas/code-contracts';

/** Display/editor facts per judge language. Mindy-BE owns which languages exist and are enabled. */
export const codeLanguageMeta: Record<
  CodeLanguageKey,
  { label: string; indent: string; lineComment: string }
> = {
  javascript: { label: 'JavaScript', indent: '  ', lineComment: '//' },
  java21: { label: 'Java', indent: '    ', lineComment: '//' },
  python3: { label: 'Python', indent: '    ', lineComment: '#' },
  csharp: { label: 'C#', indent: '    ', lineComment: '//' },
};

/** Accepts plain strings too: the code library lists languages as strings. */
export const languageName = (key: string) => codeLanguageMeta[key as CodeLanguageKey]?.label ?? key;
export const languageIndent = (key: CodeLanguageKey) => codeLanguageMeta[key].indent;
/** Narrows untrusted strings (drag-and-drop payloads) to a judge language. */
export const isCodeLanguage = (value: string): value is CodeLanguageKey =>
  Object.hasOwn(codeLanguageMeta, value);
