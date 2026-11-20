import type { CodeLanguageKey } from '../schemas/code-contracts';

export function codeLanguageLabel(key: string) {
  switch (key) {
    case 'javascript':
      return 'JavaScript';
    case 'java21':
      return 'Java';
    case 'python3':
      return 'Python';
    case 'csharp':
      return 'C#';
    default:
      return key;
  }
}

export function codeIndent(key: CodeLanguageKey) {
  return key === 'javascript' ? '  ' : '    ';
}
