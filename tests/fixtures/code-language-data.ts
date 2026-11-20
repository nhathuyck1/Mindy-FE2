import { assignment } from './assignment-data';

export const enabledCodeLanguages = [
  {
    key: 'javascript',
    displayName: 'JavaScript',
    runtimeVersion: 'Node.js 22',
    editorMode: 'javascript',
  },
  { key: 'java21', displayName: 'Java', runtimeVersion: 'Java 21', editorMode: 'java' },
  { key: 'python3', displayName: 'Python', runtimeVersion: 'Python 3.13', editorMode: 'python' },
  { key: 'csharp', displayName: 'C#', runtimeVersion: '.NET 10', editorMode: 'csharp' },
];

export const fourLanguageAuthoring = {
  assignment: { ...assignment, type: 'CODE' },
  problem: null,
  languages: enabledCodeLanguages.map((language) => ({
    languageKey: language.key,
    starterCode: '',
  })),
  tests: [],
  references: enabledCodeLanguages.map((language) => ({
    languageKey: language.key,
    sourceCode: '',
    validatedAt: null,
    lastValidation: null,
  })),
  validatedRevision: null,
  publishBlockers: ['CODE_PROBLEM_REQUIRED'],
  availableLanguages: enabledCodeLanguages,
};

export const fourLanguageStarters = {
  javascript: 'function solve(nums) {\n  return 0;\n}',
  java21: 'class Solution {\n    public int solve(int[] nums) { return 0; }\n}',
  python3: 'class Solution:\n    def solve(self, nums):\n        return 0',
  csharp: 'public class Solution {\n    public int solve(int[] nums) { return 0; }\n}',
};
