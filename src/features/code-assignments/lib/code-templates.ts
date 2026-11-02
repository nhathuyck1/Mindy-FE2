import type { CodeSignature } from '../schemas/code-contracts';

/**
 * Ready-made problems for the "Bắt đầu nhanh" step. Expected outputs are not stored here: applying
 * a template runs the JavaScript reference on the inputs, exactly like a mentor-written problem.
 */
export interface CodeTemplate {
  readonly key: string;
  readonly title: string;
  readonly difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  readonly statementMd: string;
  readonly constraintsMd: string;
  readonly signature: CodeSignature;
  readonly referenceJs: string;
  /** First two are examples (SAMPLE), the rest hidden. */
  readonly inputs: readonly (readonly unknown[])[];
}

export const codeTemplates: readonly CodeTemplate[] = [
  {
    key: 'sum',
    title: 'Tổng hai số',
    difficulty: 'EASY',
    statementMd: 'Cho hai số nguyên `a` và `b`. Trả về tổng `a + b`.',
    constraintsMd: '-10^9 ≤ a, b ≤ 10^9',
    signature: {
      functionName: 'sum',
      params: [
        { name: 'a', type: 'int' },
        { name: 'b', type: 'int' },
      ],
      returnType: 'long',
    },
    referenceJs: 'function sum(a, b) {\n    return a + b;\n}\n',
    inputs: [
      [1, 2],
      [-5, 5],
      [0, 0],
      [1000000000, 1000000000],
      [-7, -8],
    ],
  },
  {
    key: 'max',
    title: 'Số lớn nhất trong mảng',
    difficulty: 'EASY',
    statementMd: 'Cho mảng số nguyên `nums` (ít nhất 1 phần tử). Trả về giá trị lớn nhất.',
    constraintsMd: '1 ≤ nums.length ≤ 10^5',
    signature: {
      functionName: 'maxOf',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'int',
    },
    referenceJs:
      'function maxOf(nums) {\n    let best = nums[0];\n    for (const x of nums) if (x > best) best = x;\n    return best;\n}\n',
    inputs: [[[3, 1, 4, 1, 5]], [[-2, -9]], [[7]], [[0, 0, 0]], [[-1, 100, 99, 100]]],
  },
  {
    key: 'reverse',
    title: 'Đảo ngược chuỗi',
    difficulty: 'EASY',
    statementMd: 'Cho chuỗi `s`. Trả về chuỗi đảo ngược của `s`.',
    constraintsMd: '0 ≤ s.length ≤ 10^4, chỉ gồm ký tự ASCII',
    signature: {
      functionName: 'reverseString',
      params: [{ name: 's', type: 'string' }],
      returnType: 'string',
    },
    referenceJs: "function reverseString(s) {\n    return s.split('').reverse().join('');\n}\n",
    inputs: [['hello'], ['abc'], [''], ['a'], ['racecar'], ['Mindy 2026']],
  },
  {
    key: 'palindrome',
    title: 'Chuỗi đối xứng',
    difficulty: 'EASY',
    statementMd:
      'Cho chuỗi `s`. Trả về `true` nếu `s` đọc xuôi và ngược giống nhau (phân biệt hoa thường), ngược lại `false`.',
    constraintsMd: '0 ≤ s.length ≤ 10^4',
    signature: {
      functionName: 'isPalindrome',
      params: [{ name: 's', type: 'string' }],
      returnType: 'boolean',
    },
    referenceJs:
      'function isPalindrome(s) {\n    for (let i = 0, j = s.length - 1; i < j; i++, j--) if (s[i] !== s[j]) return false;\n    return true;\n}\n',
    inputs: [['aba'], ['abc'], [''], ['abba'], ['Aa'], ['x']],
  },
  {
    key: 'prime',
    title: 'Kiểm tra số nguyên tố',
    difficulty: 'EASY',
    statementMd: 'Cho số nguyên `n`. Trả về `true` nếu `n` là số nguyên tố, ngược lại `false`.',
    constraintsMd: '-10^6 ≤ n ≤ 10^9',
    signature: {
      functionName: 'isPrime',
      params: [{ name: 'n', type: 'int' }],
      returnType: 'boolean',
    },
    referenceJs:
      'function isPrime(n) {\n    if (n < 2) return false;\n    for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;\n    return true;\n}\n',
    inputs: [[7], [10], [1], [2], [-3], [97], [999999937]],
  },
  {
    key: 'twoSum',
    title: 'Two Sum',
    difficulty: 'EASY',
    statementMd:
      'Cho mảng `nums` và số `target`. Trả về chỉ số `[i, j]` (i < j) của hai phần tử có tổng bằng `target`. Luôn có đúng một đáp án.',
    constraintsMd: '2 ≤ nums.length ≤ 10^4',
    signature: {
      functionName: 'twoSum',
      params: [
        { name: 'nums', type: 'int[]' },
        { name: 'target', type: 'int' },
      ],
      returnType: 'int[]',
    },
    referenceJs:
      'function twoSum(nums, target) {\n    const seen = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i];\n        seen.set(nums[i], i);\n    }\n    return [];\n}\n',
    inputs: [
      [[2, 7, 11, 15], 9],
      [[3, 2, 4], 6],
      [[3, 3], 6],
      [[-1, -2, -3, -4, -5], -8],
      [[0, 4, 3, 0], 0],
    ],
  },
  {
    key: 'fizzBuzz',
    title: 'FizzBuzz',
    difficulty: 'EASY',
    statementMd:
      'Cho số nguyên `n`. Trả về mảng gồm các chuỗi từ 1 đến `n`: số chia hết cho 3 thay bằng `"Fizz"`, chia hết cho 5 thay bằng `"Buzz"`, chia hết cho cả hai thay bằng `"FizzBuzz"`, còn lại là chính số đó.',
    constraintsMd: '1 ≤ n ≤ 10^4',
    signature: {
      functionName: 'fizzBuzz',
      params: [{ name: 'n', type: 'int' }],
      returnType: 'string[]',
    },
    referenceJs:
      "function fizzBuzz(n) {\n    const out = [];\n    for (let i = 1; i <= n; i++)\n        out.push(i % 15 === 0 ? 'FizzBuzz' : i % 3 === 0 ? 'Fizz' : i % 5 === 0 ? 'Buzz' : String(i));\n    return out;\n}\n",
    inputs: [[5], [15], [1], [3], [30]],
  },
];
