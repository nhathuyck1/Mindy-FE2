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
  // ─── LeetCode phổ biến · EASY ───
  {
    key: 'validParentheses',
    title: 'Valid Parentheses',
    difficulty: 'EASY',
    statementMd:
      'Cho chuỗi `s` chỉ gồm các ký tự `()[]{}`. Trả về `true` nếu mọi dấu mở đều được đóng bằng đúng loại và đúng thứ tự, ngược lại `false`.',
    constraintsMd: '1 ≤ s.length ≤ 10^4',
    signature: {
      functionName: 'isValid',
      params: [{ name: 's', type: 'string' }],
      returnType: 'boolean',
    },
    referenceJs: `function isValid(s) {
    const pair = { ')': '(', ']': '[', '}': '{' };
    const stack = [];
    for (const c of s) {
        if (c in pair) {
            if (stack.pop() !== pair[c]) return false;
        } else stack.push(c);
    }
    return stack.length === 0;
}
`,
    inputs: [['()[]{}'], ['(]'], ['()'], ['([)]'], ['{[]}'], ['(('], [']']],
  },
  {
    key: 'mergeSorted',
    title: 'Merge Sorted Array',
    difficulty: 'EASY',
    statementMd:
      'Cho hai mảng `nums1` và `nums2` đã sắp xếp tăng dần. Trả về mảng gộp của cả hai, cũng sắp xếp tăng dần.',
    constraintsMd: '0 ≤ nums1.length, nums2.length ≤ 200',
    signature: {
      functionName: 'mergeSorted',
      params: [
        { name: 'nums1', type: 'int[]' },
        { name: 'nums2', type: 'int[]' },
      ],
      returnType: 'int[]',
    },
    referenceJs: `function mergeSorted(nums1, nums2) {
    const out = [];
    let i = 0, j = 0;
    while (i < nums1.length || j < nums2.length) {
        if (j >= nums2.length || (i < nums1.length && nums1[i] <= nums2[j])) out.push(nums1[i++]);
        else out.push(nums2[j++]);
    }
    return out;
}
`,
    inputs: [
      [
        [1, 2, 3],
        [2, 5, 6],
      ],
      [[1], []],
      [[], [1]],
      [
        [-3, 0, 7],
        [-5, -3, 8, 9],
      ],
      [[4, 4], [4]],
    ],
  },
  {
    key: 'maxProfit',
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'EASY',
    statementMd:
      'Cho mảng `prices`, `prices[i]` là giá cổ phiếu ngày `i`. Chọn một ngày mua và một ngày bán sau đó. Trả về lợi nhuận lớn nhất (trả về `0` nếu không thể có lãi).',
    constraintsMd: '1 ≤ prices.length ≤ 10^5, 0 ≤ prices[i] ≤ 10^4',
    signature: {
      functionName: 'maxProfit',
      params: [{ name: 'prices', type: 'int[]' }],
      returnType: 'int',
    },
    referenceJs: `function maxProfit(prices) {
    let low = Infinity, best = 0;
    for (const p of prices) {
        low = Math.min(low, p);
        best = Math.max(best, p - low);
    }
    return best;
}
`,
    inputs: [
      [[7, 1, 5, 3, 6, 4]],
      [[7, 6, 4, 3, 1]],
      [[1]],
      [[2, 4, 1]],
      [[3, 3, 5, 0, 0, 3, 1, 4]],
    ],
  },
  {
    key: 'containsDuplicate',
    title: 'Contains Duplicate',
    difficulty: 'EASY',
    statementMd:
      'Cho mảng `nums`. Trả về `true` nếu có giá trị xuất hiện ít nhất hai lần, ngược lại `false`.',
    constraintsMd: '1 ≤ nums.length ≤ 10^5',
    signature: {
      functionName: 'containsDuplicate',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'boolean',
    },
    referenceJs: `function containsDuplicate(nums) {
    return new Set(nums).size !== nums.length;
}
`,
    inputs: [[[1, 2, 3, 1]], [[1, 2, 3, 4]], [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], [[0]], [[-1, -1]]],
  },
  {
    key: 'validAnagram',
    title: 'Valid Anagram',
    difficulty: 'EASY',
    statementMd:
      'Cho hai chuỗi `s` và `t`. Trả về `true` nếu `t` là hoán vị các ký tự của `s` (anagram), ngược lại `false`.',
    constraintsMd: '1 ≤ s.length, t.length ≤ 5·10^4, chỉ gồm chữ thường a-z',
    signature: {
      functionName: 'isAnagram',
      params: [
        { name: 's', type: 'string' },
        { name: 't', type: 'string' },
      ],
      returnType: 'boolean',
    },
    referenceJs: `function isAnagram(s, t) {
    return s.length === t.length && [...s].sort().join('') === [...t].sort().join('');
}
`,
    inputs: [
      ['anagram', 'nagaram'],
      ['rat', 'car'],
      ['a', 'a'],
      ['ab', 'a'],
      ['listen', 'silent'],
    ],
  },
  {
    key: 'majorityElement',
    title: 'Majority Element',
    difficulty: 'EASY',
    statementMd:
      'Cho mảng `nums` độ dài `n`. Trả về phần tử xuất hiện nhiều hơn `n / 2` lần (luôn tồn tại).',
    constraintsMd: '1 ≤ n ≤ 5·10^4',
    signature: {
      functionName: 'majorityElement',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'int',
    },
    referenceJs: `function majorityElement(nums) {
    let candidate = 0, count = 0;
    for (const x of nums) {
        if (count === 0) candidate = x;
        count += x === candidate ? 1 : -1;
    }
    return candidate;
}
`,
    inputs: [[[3, 2, 3]], [[2, 2, 1, 1, 1, 2, 2]], [[1]], [[-1, -1, 2]], [[6, 5, 5]]],
  },
  {
    key: 'moveZeroes',
    title: 'Move Zeroes',
    difficulty: 'EASY',
    statementMd:
      'Cho mảng `nums`. Dồn tất cả số `0` về cuối, giữ nguyên thứ tự tương đối của các phần tử khác 0, rồi trả về mảng kết quả.',
    constraintsMd: '1 ≤ nums.length ≤ 10^4',
    signature: {
      functionName: 'moveZeroes',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'int[]',
    },
    referenceJs: `function moveZeroes(nums) {
    const rest = nums.filter((x) => x !== 0);
    return rest.concat(new Array(nums.length - rest.length).fill(0));
}
`,
    inputs: [[[0, 1, 0, 3, 12]], [[0]], [[1, 2, 3]], [[0, 0, 1]], [[4, 0, -2, 0, 0, 5]]],
  },
  {
    key: 'climbStairs',
    title: 'Climbing Stairs',
    difficulty: 'EASY',
    statementMd:
      'Cầu thang có `n` bậc, mỗi lần bạn leo 1 hoặc 2 bậc. Trả về số cách khác nhau để lên tới đỉnh.',
    constraintsMd: '1 ≤ n ≤ 45',
    signature: {
      functionName: 'climbStairs',
      params: [{ name: 'n', type: 'int' }],
      returnType: 'int',
    },
    referenceJs: `function climbStairs(n) {
    let a = 1, b = 1;
    for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
    return b;
}
`,
    inputs: [[2], [3], [1], [5], [10], [45]],
  },
  {
    key: 'missingNumber',
    title: 'Missing Number',
    difficulty: 'EASY',
    statementMd:
      'Cho mảng `nums` gồm `n` số phân biệt trong đoạn `[0, n]`. Trả về số duy nhất trong đoạn đó bị thiếu.',
    constraintsMd: '1 ≤ n ≤ 10^4',
    signature: {
      functionName: 'missingNumber',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'int',
    },
    referenceJs: `function missingNumber(nums) {
    let x = nums.length;
    nums.forEach((v, i) => (x += i - v));
    return x;
}
`,
    inputs: [[[3, 0, 1]], [[0, 1]], [[9, 6, 4, 2, 3, 5, 7, 0, 1]], [[0]], [[1]]],
  },
  {
    key: 'singleNumber',
    title: 'Single Number',
    difficulty: 'EASY',
    statementMd:
      'Cho mảng `nums`, mọi phần tử xuất hiện đúng hai lần trừ một phần tử xuất hiện một lần. Trả về phần tử đó. Thử giải với O(n) thời gian và O(1) bộ nhớ.',
    constraintsMd: '1 ≤ nums.length ≤ 3·10^4',
    signature: {
      functionName: 'singleNumber',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'int',
    },
    referenceJs: `function singleNumber(nums) {
    return nums.reduce((a, b) => a ^ b, 0);
}
`,
    inputs: [[[2, 2, 1]], [[4, 1, 2, 1, 2]], [[1]], [[-3, 7, 7]], [[0, 5, 5]]],
  },
  {
    key: 'binarySearch',
    title: 'Binary Search',
    difficulty: 'EASY',
    statementMd:
      'Cho mảng `nums` tăng dần (các phần tử phân biệt) và số `target`. Trả về chỉ số của `target` trong `nums`, hoặc `-1` nếu không có. Yêu cầu O(log n).',
    constraintsMd: '1 ≤ nums.length ≤ 10^4',
    signature: {
      functionName: 'search',
      params: [
        { name: 'nums', type: 'int[]' },
        { name: 'target', type: 'int' },
      ],
      returnType: 'int',
    },
    referenceJs: `function search(nums, target) {
    let lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
`,
    inputs: [
      [[-1, 0, 3, 5, 9, 12], 9],
      [[-1, 0, 3, 5, 9, 12], 2],
      [[5], 5],
      [[5], -5],
      [[1, 3, 5, 7, 9, 11], 1],
    ],
  },
  {
    key: 'romanToInt',
    title: 'Roman to Integer',
    difficulty: 'EASY',
    statementMd:
      'Cho chuỗi số La Mã `s` (gồm `I V X L C D M`). Trả về giá trị số nguyên tương ứng. Ví dụ `IV = 4`, `IX = 9`, `MCMXCIV = 1994`.',
    constraintsMd: '1 ≤ s.length ≤ 15, giá trị trong [1, 3999]',
    signature: {
      functionName: 'romanToInt',
      params: [{ name: 's', type: 'string' }],
      returnType: 'int',
    },
    referenceJs: `function romanToInt(s) {
    const v = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let total = 0;
    for (let i = 0; i < s.length; i++) total += v[s[i]] < (v[s[i + 1]] ?? 0) ? -v[s[i]] : v[s[i]];
    return total;
}
`,
    inputs: [['III'], ['LVIII'], ['MCMXCIV'], ['IV'], ['MMMCMXCIX']],
  },
  {
    key: 'longestCommonPrefix',
    title: 'Longest Common Prefix',
    difficulty: 'EASY',
    statementMd:
      'Cho mảng chuỗi `strs`. Trả về tiền tố chung dài nhất của tất cả các chuỗi, hoặc chuỗi rỗng nếu không có.',
    constraintsMd: '1 ≤ strs.length ≤ 200, 0 ≤ strs[i].length ≤ 200',
    signature: {
      functionName: 'longestCommonPrefix',
      params: [{ name: 'strs', type: 'string[]' }],
      returnType: 'string',
    },
    referenceJs: `function longestCommonPrefix(strs) {
    let p = strs[0];
    for (const s of strs) while (!s.startsWith(p)) p = p.slice(0, -1);
    return p;
}
`,
    inputs: [
      [['flower', 'flow', 'flight']],
      [['dog', 'racecar', 'car']],
      [['a']],
      [['', 'b']],
      [['interview', 'internet', 'interval']],
    ],
  },
  {
    key: 'plusOne',
    title: 'Plus One',
    difficulty: 'EASY',
    statementMd:
      'Mảng `digits` biểu diễn một số nguyên không âm (chữ số hàng cao nhất ở đầu, không có số 0 thừa ở đầu). Trả về mảng chữ số của số đó cộng thêm 1.',
    constraintsMd: '1 ≤ digits.length ≤ 100, 0 ≤ digits[i] ≤ 9',
    signature: {
      functionName: 'plusOne',
      params: [{ name: 'digits', type: 'int[]' }],
      returnType: 'int[]',
    },
    referenceJs: `function plusOne(digits) {
    const d = [...digits];
    for (let i = d.length - 1; i >= 0; i--) {
        if (d[i] < 9) {
            d[i]++;
            return d;
        }
        d[i] = 0;
    }
    return [1, ...d];
}
`,
    inputs: [[[1, 2, 3]], [[4, 3, 2, 1]], [[9]], [[9, 9, 9]], [[1, 0, 9]]],
  },
  {
    key: 'removeDuplicates',
    title: 'Remove Duplicates from Sorted Array',
    difficulty: 'EASY',
    statementMd:
      'Cho mảng `nums` đã sắp xếp tăng dần. Trả về mảng gồm các giá trị phân biệt, giữ nguyên thứ tự.',
    constraintsMd: '1 ≤ nums.length ≤ 3·10^4',
    signature: {
      functionName: 'removeDuplicates',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'int[]',
    },
    referenceJs: `function removeDuplicates(nums) {
    return nums.filter((x, i) => i === 0 || x !== nums[i - 1]);
}
`,
    inputs: [
      [[1, 1, 2]],
      [[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]],
      [[1]],
      [[-1, 0, 0, 0, 3, 3]],
      [[2, 2, 2]],
    ],
  },
  {
    key: 'pascalTriangle',
    title: "Pascal's Triangle",
    difficulty: 'EASY',
    statementMd:
      'Cho số nguyên `numRows`. Trả về `numRows` hàng đầu tiên của tam giác Pascal (mỗi số bằng tổng hai số ngay phía trên nó).',
    constraintsMd: '1 ≤ numRows ≤ 30',
    signature: {
      functionName: 'generate',
      params: [{ name: 'numRows', type: 'int' }],
      returnType: 'int[][]',
    },
    referenceJs: `function generate(numRows) {
    const rows = [[1]];
    while (rows.length < numRows) {
        const prev = rows[rows.length - 1];
        rows.push(prev.map((x, i) => x + (prev[i - 1] ?? 0)).concat(1));
    }
    return rows;
}
`,
    inputs: [[5], [1], [2], [10], [30]],
  },
  {
    key: 'validPalindrome',
    title: 'Valid Palindrome',
    difficulty: 'EASY',
    statementMd:
      'Cho chuỗi `s`. Chỉ xét chữ cái và chữ số (bỏ qua mọi ký tự khác), không phân biệt hoa thường. Trả về `true` nếu chuỗi thu được đọc xuôi ngược như nhau.',
    constraintsMd: '1 ≤ s.length ≤ 2·10^5, ký tự ASCII in được',
    signature: {
      functionName: 'isPalindromeText',
      params: [{ name: 's', type: 'string' }],
      returnType: 'boolean',
    },
    referenceJs: `function isPalindromeText(s) {
    const t = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    return t === [...t].reverse().join('');
}
`,
    inputs: [
      ['A man, a plan, a canal: Panama'],
      ['race a car'],
      [' '],
      ['0P'],
      ['No lemon, no melon'],
    ],
  },
  {
    key: 'happyNumber',
    title: 'Happy Number',
    difficulty: 'EASY',
    statementMd:
      'Một số là "happy" nếu lặp lại phép thay số bằng tổng bình phương các chữ số của nó cuối cùng ra `1`. Cho `n`, trả về `true` nếu `n` là happy number.',
    constraintsMd: '1 ≤ n ≤ 2^31 - 1',
    signature: {
      functionName: 'isHappy',
      params: [{ name: 'n', type: 'int' }],
      returnType: 'boolean',
    },
    referenceJs: `function isHappy(n) {
    const seen = new Set();
    while (n !== 1 && !seen.has(n)) {
        seen.add(n);
        n = String(n).split('').reduce((s, d) => s + d * d, 0);
    }
    return n === 1;
}
`,
    inputs: [[19], [2], [1], [7], [2147483647]],
  },
  {
    key: 'countBits',
    title: 'Counting Bits',
    difficulty: 'EASY',
    statementMd:
      'Cho số nguyên `n`. Trả về mảng `ans` độ dài `n + 1`, với `ans[i]` là số bit `1` trong biểu diễn nhị phân của `i`.',
    constraintsMd: '0 ≤ n ≤ 10^5',
    signature: {
      functionName: 'countBits',
      params: [{ name: 'n', type: 'int' }],
      returnType: 'int[]',
    },
    referenceJs: `function countBits(n) {
    const out = [0];
    for (let i = 1; i <= n; i++) out.push(out[i >> 1] + (i & 1));
    return out;
}
`,
    inputs: [[2], [5], [0], [1], [16]],
  },
  {
    key: 'mySqrt',
    title: 'Sqrt(x)',
    difficulty: 'EASY',
    statementMd:
      'Cho số nguyên không âm `x`. Trả về phần nguyên của căn bậc hai của `x`, không dùng hàm `sqrt` hay lũy thừa có sẵn.',
    constraintsMd: '0 ≤ x ≤ 2^31 - 1',
    signature: {
      functionName: 'mySqrt',
      params: [{ name: 'x', type: 'int' }],
      returnType: 'int',
    },
    referenceJs: `function mySqrt(x) {
    let lo = 0, hi = x;
    while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        if (mid * mid <= x) lo = mid;
        else hi = mid - 1;
    }
    return lo;
}
`,
    inputs: [[4], [8], [0], [1], [2147483647]],
  },
  // ─── LeetCode phổ biến · MEDIUM ───
  {
    key: 'maxSubArray',
    title: 'Maximum Subarray',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho mảng `nums`. Tìm đoạn con liên tiếp (ít nhất 1 phần tử) có tổng lớn nhất và trả về tổng đó.',
    constraintsMd: '1 ≤ nums.length ≤ 10^5, -10^4 ≤ nums[i] ≤ 10^4',
    signature: {
      functionName: 'maxSubArray',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'int',
    },
    referenceJs: `function maxSubArray(nums) {
    let cur = nums[0], best = nums[0];
    for (let i = 1; i < nums.length; i++) {
        cur = Math.max(nums[i], cur + nums[i]);
        best = Math.max(best, cur);
    }
    return best;
}
`,
    inputs: [
      [[-2, 1, -3, 4, -1, 2, 1, -5, 4]],
      [[1]],
      [[5, 4, -1, 7, 8]],
      [[-3, -1, -2]],
      [[0, -1, 0]],
    ],
  },
  {
    key: 'productExceptSelf',
    title: 'Product of Array Except Self',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho mảng `nums`. Trả về mảng `answer` với `answer[i]` là tích mọi phần tử của `nums` trừ `nums[i]`. Không dùng phép chia, yêu cầu O(n).',
    constraintsMd: '2 ≤ nums.length ≤ 10^5, -30 ≤ nums[i] ≤ 30, kết quả vừa kiểu int',
    signature: {
      functionName: 'productExceptSelf',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'int[]',
    },
    referenceJs: `function productExceptSelf(nums) {
    const out = new Array(nums.length).fill(1);
    let left = 1, right = 1;
    for (let i = 0; i < nums.length; i++) {
        out[i] *= left;
        left *= nums[i];
    }
    for (let i = nums.length - 1; i >= 0; i--) {
        out[i] *= right;
        right *= nums[i];
    }
    return out.map((x) => x || 0); // turns -0 into 0
}
`,
    inputs: [[[1, 2, 3, 4]], [[-1, 1, 0, -3, 3]], [[2, 3]], [[0, 0]], [[5, -2, 1, 4]]],
  },
  {
    key: 'longestSubstring',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho chuỗi `s`. Trả về độ dài của chuỗi con liên tiếp dài nhất không có ký tự nào lặp lại.',
    constraintsMd: '0 ≤ s.length ≤ 5·10^4',
    signature: {
      functionName: 'lengthOfLongestSubstring',
      params: [{ name: 's', type: 'string' }],
      returnType: 'int',
    },
    referenceJs: `function lengthOfLongestSubstring(s) {
    const last = new Map();
    let start = 0, best = 0;
    for (let i = 0; i < s.length; i++) {
        if (last.get(s[i]) >= start) start = last.get(s[i]) + 1;
        last.set(s[i], i);
        best = Math.max(best, i - start + 1);
    }
    return best;
}
`,
    inputs: [['abcabcbb'], ['bbbbb'], ['pwwkew'], [''], ['dvdf'], ['abba']],
  },
  {
    key: 'threeSum',
    title: '3Sum',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho mảng `nums`. Trả về mọi bộ ba **không trùng nhau** `[a, b, c]` lấy từ ba vị trí khác nhau sao cho `a + b + c = 0`. Mỗi bộ sắp tăng dần, danh sách các bộ sắp theo thứ tự từ điển.',
    constraintsMd: '3 ≤ nums.length ≤ 3000, -10^5 ≤ nums[i] ≤ 10^5',
    signature: {
      functionName: 'threeSum',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'int[][]',
    },
    referenceJs: `function threeSum(nums) {
    const a = [...nums].sort((x, y) => x - y);
    const out = [];
    for (let i = 0; i < a.length - 2; i++) {
        if (i > 0 && a[i] === a[i - 1]) continue;
        let l = i + 1, r = a.length - 1;
        while (l < r) {
            const s = a[i] + a[l] + a[r];
            if (s < 0) l++;
            else if (s > 0) r--;
            else {
                out.push([a[i], a[l], a[r]]);
                while (l < r && a[l] === a[l + 1]) l++;
                l++;
                r--;
            }
        }
    }
    return out;
}
`,
    inputs: [
      [[-1, 0, 1, 2, -1, -4]],
      [[0, 1, 1]],
      [[0, 0, 0]],
      [[-2, 0, 1, 1, 2]],
      [[1, 2, -2, -1]],
    ],
  },
  {
    key: 'maxArea',
    title: 'Container With Most Water',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho mảng `height`, mỗi phần tử là chiều cao một cột đứng tại vị trí `i`. Chọn hai cột tạo với trục hoành một bể chứa nước. Trả về lượng nước lớn nhất có thể chứa.',
    constraintsMd: '2 ≤ height.length ≤ 10^5, 0 ≤ height[i] ≤ 10^4',
    signature: {
      functionName: 'maxArea',
      params: [{ name: 'height', type: 'int[]' }],
      returnType: 'int',
    },
    referenceJs: `function maxArea(height) {
    let l = 0, r = height.length - 1, best = 0;
    while (l < r) {
        best = Math.max(best, Math.min(height[l], height[r]) * (r - l));
        if (height[l] < height[r]) l++;
        else r--;
    }
    return best;
}
`,
    inputs: [
      [[1, 8, 6, 2, 5, 4, 8, 3, 7]],
      [[1, 1]],
      [[4, 3, 2, 1, 4]],
      [[1, 2, 1]],
      [[2, 3, 10, 5, 7, 8, 9]],
    ],
  },
  {
    key: 'groupAnagrams',
    title: 'Group Anagrams',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho mảng chuỗi `strs`. Gom các chuỗi là anagram của nhau vào cùng nhóm. Chuỗi trong mỗi nhóm sắp tăng dần; các nhóm sắp theo chuỗi đầu tiên của nhóm (so sánh theo mã ký tự).',
    constraintsMd: '1 ≤ strs.length ≤ 10^4, 0 ≤ strs[i].length ≤ 100, chữ thường a-z',
    signature: {
      functionName: 'groupAnagrams',
      params: [{ name: 'strs', type: 'string[]' }],
      returnType: 'string[][]',
    },
    referenceJs: `function groupAnagrams(strs) {
    const groups = new Map();
    for (const s of strs) {
        const key = [...s].sort().join('');
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(s);
    }
    return [...groups.values()]
        .map((g) => g.sort())
        .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}
`,
    inputs: [
      [['eat', 'tea', 'tan', 'ate', 'nat', 'bat']],
      [['']],
      [['a']],
      [['abc', 'bca', 'cab', 'xyz', 'zyx', 'b']],
      [['', 'b', '']],
    ],
  },
  {
    key: 'topKFrequent',
    title: 'Top K Frequent Elements',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho mảng `nums` và số `k`. Trả về `k` phần tử xuất hiện nhiều nhất, sắp theo tần suất giảm dần; cùng tần suất thì giá trị nhỏ hơn đứng trước.',
    constraintsMd: '1 ≤ nums.length ≤ 10^5, 1 ≤ k ≤ số giá trị phân biệt',
    signature: {
      functionName: 'topKFrequent',
      params: [
        { name: 'nums', type: 'int[]' },
        { name: 'k', type: 'int' },
      ],
      returnType: 'int[]',
    },
    referenceJs: `function topKFrequent(nums, k) {
    const freq = new Map();
    for (const x of nums) freq.set(x, (freq.get(x) ?? 0) + 1);
    return [...freq.entries()]
        .sort((a, b) => b[1] - a[1] || a[0] - b[0])
        .slice(0, k)
        .map((e) => e[0]);
}
`,
    inputs: [
      [[1, 1, 1, 2, 2, 3], 2],
      [[1], 1],
      [[4, 4, -1, -1, 7], 2],
      [[5, 3, 5, 3, 9, 9, 9], 3],
      [[1, 2], 2],
    ],
  },
  {
    key: 'numIslands',
    title: 'Number of Islands',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho lưới `grid` gồm `"1"` (đất) và `"0"` (nước). Một đảo là nhóm ô đất nối nhau theo chiều ngang hoặc dọc. Trả về số đảo.',
    constraintsMd: '1 ≤ m, n ≤ 100',
    signature: {
      functionName: 'numIslands',
      params: [{ name: 'grid', type: 'string[][]' }],
      returnType: 'int',
    },
    referenceJs: `function numIslands(grid) {
    const g = grid.map((row) => [...row]);
    let count = 0;
    const sink = (r, c) => {
        if (r < 0 || c < 0 || r >= g.length || c >= g[0].length || g[r][c] !== '1') return;
        g[r][c] = '0';
        sink(r + 1, c);
        sink(r - 1, c);
        sink(r, c + 1);
        sink(r, c - 1);
    };
    for (let r = 0; r < g.length; r++)
        for (let c = 0; c < g[0].length; c++)
            if (g[r][c] === '1') {
                count++;
                sink(r, c);
            }
    return count;
}
`,
    inputs: [
      [
        [
          ['1', '1', '1', '1', '0'],
          ['1', '1', '0', '1', '0'],
          ['1', '1', '0', '0', '0'],
          ['0', '0', '0', '0', '0'],
        ],
      ],
      [
        [
          ['1', '1', '0', '0', '0'],
          ['1', '1', '0', '0', '0'],
          ['0', '0', '1', '0', '0'],
          ['0', '0', '0', '1', '1'],
        ],
      ],
      [[['0']]],
      [
        [
          ['1', '0', '1'],
          ['0', '1', '0'],
          ['1', '0', '1'],
        ],
      ],
      [[['1']]],
    ],
  },
  {
    key: 'coinChange',
    title: 'Coin Change',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho mảng mệnh giá `coins` (mỗi loại dùng không giới hạn) và số tiền `amount`. Trả về số đồng xu ít nhất để tạo đúng `amount`, hoặc `-1` nếu không thể.',
    constraintsMd: '1 ≤ coins.length ≤ 12, 0 ≤ amount ≤ 10^4',
    signature: {
      functionName: 'coinChange',
      params: [
        { name: 'coins', type: 'int[]' },
        { name: 'amount', type: 'int' },
      ],
      returnType: 'int',
    },
    referenceJs: `function coinChange(coins, amount) {
    const dp = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    for (let a = 1; a <= amount; a++)
        for (const c of coins) if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    return dp[amount] === Infinity ? -1 : dp[amount];
}
`,
    inputs: [
      [[1, 2, 5], 11],
      [[2], 3],
      [[1], 0],
      [[186, 419, 83, 408], 6249],
      [[2, 5, 10, 1], 27],
    ],
  },
  {
    key: 'longestPalindrome',
    title: 'Longest Palindromic Substring',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho chuỗi `s`. Trả về chuỗi con liên tiếp đối xứng dài nhất. Nếu có nhiều đáp án cùng độ dài, trả về chuỗi bắt đầu sớm nhất.',
    constraintsMd: '1 ≤ s.length ≤ 1000',
    signature: {
      functionName: 'longestPalindrome',
      params: [{ name: 's', type: 'string' }],
      returnType: 'string',
    },
    referenceJs: `function longestPalindrome(s) {
    let start = 0, len = 0;
    for (let c = 0; c < s.length; c++)
        for (const [l0, r0] of [[c, c], [c, c + 1]]) {
            let l = l0, r = r0;
            while (l >= 0 && r < s.length && s[l] === s[r]) {
                l--;
                r++;
            }
            if (r - l - 1 > len) {
                start = l + 1;
                len = r - l - 1;
            }
        }
    return s.slice(start, start + len);
}
`,
    inputs: [['babad'], ['cbbd'], ['a'], ['ac'], ['forgeeksskeegfor'], ['aaaa']],
  },
  {
    key: 'searchRotated',
    title: 'Search in Rotated Sorted Array',
    difficulty: 'MEDIUM',
    statementMd:
      'Mảng `nums` (phân biệt) vốn tăng dần nhưng đã bị xoay tại một vị trí nào đó, ví dụ `[4,5,6,7,0,1,2]`. Trả về chỉ số của `target`, hoặc `-1`. Yêu cầu O(log n).',
    constraintsMd: '1 ≤ nums.length ≤ 5000',
    signature: {
      functionName: 'searchRotated',
      params: [
        { name: 'nums', type: 'int[]' },
        { name: 'target', type: 'int' },
      ],
      returnType: 'int',
    },
    referenceJs: `function searchRotated(nums, target) {
    let lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] === target) return mid;
        if (nums[lo] <= nums[mid]) {
            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
`,
    inputs: [
      [[4, 5, 6, 7, 0, 1, 2], 0],
      [[4, 5, 6, 7, 0, 1, 2], 3],
      [[1], 0],
      [[3, 1], 1],
      [[5, 1, 3], 5],
    ],
  },
  {
    key: 'mergeIntervals',
    title: 'Merge Intervals',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho mảng đoạn `intervals[i] = [start, end]`. Gộp mọi đoạn chồng lấn (kể cả chạm nhau) và trả về các đoạn kết quả, sắp theo `start` tăng dần.',
    constraintsMd: '1 ≤ intervals.length ≤ 10^4, 0 ≤ start ≤ end ≤ 10^4',
    signature: {
      functionName: 'merge',
      params: [{ name: 'intervals', type: 'int[][]' }],
      returnType: 'int[][]',
    },
    referenceJs: `function merge(intervals) {
    const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
    const out = [];
    for (const [s, e] of sorted) {
        const last = out[out.length - 1];
        if (last && s <= last[1]) last[1] = Math.max(last[1], e);
        else out.push([s, e]);
    }
    return out;
}
`,
    inputs: [
      [
        [
          [1, 3],
          [2, 6],
          [8, 10],
          [15, 18],
        ],
      ],
      [
        [
          [1, 4],
          [4, 5],
        ],
      ],
      [[[1, 4]]],
      [
        [
          [1, 4],
          [0, 4],
        ],
      ],
      [
        [
          [2, 3],
          [4, 5],
          [6, 7],
          [8, 9],
          [1, 10],
        ],
      ],
    ],
  },
  {
    key: 'houseRobber',
    title: 'House Robber',
    difficulty: 'MEDIUM',
    statementMd:
      'Mảng `nums` là số tiền trong từng ngôi nhà xếp thành hàng. Không được lấy ở hai nhà liền kề. Trả về tổng tiền lớn nhất có thể lấy.',
    constraintsMd: '1 ≤ nums.length ≤ 100, 0 ≤ nums[i] ≤ 400',
    signature: {
      functionName: 'rob',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'int',
    },
    referenceJs: `function rob(nums) {
    let prev = 0, cur = 0;
    for (const x of nums) [prev, cur] = [cur, Math.max(cur, prev + x)];
    return cur;
}
`,
    inputs: [[[1, 2, 3, 1]], [[2, 7, 9, 3, 1]], [[5]], [[2, 1, 1, 2]], [[0, 0, 0]]],
  },
  {
    key: 'lengthOfLIS',
    title: 'Longest Increasing Subsequence',
    difficulty: 'MEDIUM',
    statementMd: 'Cho mảng `nums`. Trả về độ dài dãy con (không cần liên tiếp) tăng ngặt dài nhất.',
    constraintsMd: '1 ≤ nums.length ≤ 2500',
    signature: {
      functionName: 'lengthOfLIS',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'int',
    },
    referenceJs: `function lengthOfLIS(nums) {
    const tails = [];
    for (const x of nums) {
        let lo = 0, hi = tails.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (tails[mid] < x) lo = mid + 1;
            else hi = mid;
        }
        tails[lo] = x;
    }
    return tails.length;
}
`,
    inputs: [
      [[10, 9, 2, 5, 3, 7, 101, 18]],
      [[0, 1, 0, 3, 2, 3]],
      [[7, 7, 7, 7]],
      [[1]],
      [[4, 10, 4, 3, 8, 9]],
    ],
  },
  {
    key: 'uniquePaths',
    title: 'Unique Paths',
    difficulty: 'MEDIUM',
    statementMd:
      'Robot ở góc trên-trái lưới `m × n`, mỗi bước chỉ đi sang phải hoặc xuống dưới. Trả về số đường đi khác nhau tới góc dưới-phải.',
    constraintsMd: '1 ≤ m, n ≤ 100, đáp án ≤ 2·10^9',
    signature: {
      functionName: 'uniquePaths',
      params: [
        { name: 'm', type: 'int' },
        { name: 'n', type: 'int' },
      ],
      returnType: 'int',
    },
    referenceJs: `function uniquePaths(m, n) {
    const row = new Array(n).fill(1);
    for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) row[j] += row[j - 1];
    return row[n - 1];
}
`,
    inputs: [
      [3, 7],
      [3, 2],
      [1, 1],
      [10, 10],
      [23, 12],
    ],
  },
  {
    key: 'canJump',
    title: 'Jump Game',
    difficulty: 'MEDIUM',
    statementMd:
      'Bạn đứng ở vị trí 0 của mảng `nums`; `nums[i]` là bước nhảy xa nhất từ vị trí `i`. Trả về `true` nếu có thể tới vị trí cuối cùng.',
    constraintsMd: '1 ≤ nums.length ≤ 10^4, 0 ≤ nums[i] ≤ 10^5',
    signature: {
      functionName: 'canJump',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'boolean',
    },
    referenceJs: `function canJump(nums) {
    let reach = 0;
    for (let i = 0; i < nums.length; i++) {
        if (i > reach) return false;
        reach = Math.max(reach, i + nums[i]);
    }
    return true;
}
`,
    inputs: [[[2, 3, 1, 1, 4]], [[3, 2, 1, 0, 4]], [[0]], [[2, 0, 0]], [[1, 0, 1, 0]]],
  },
  {
    key: 'dailyTemperatures',
    title: 'Daily Temperatures',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho mảng nhiệt độ hằng ngày `temperatures`. Trả về mảng `answer`, `answer[i]` là số ngày phải chờ sau ngày `i` để có nhiệt độ cao hơn (`0` nếu không có).',
    constraintsMd: '1 ≤ temperatures.length ≤ 10^5, 30 ≤ temperatures[i] ≤ 100',
    signature: {
      functionName: 'dailyTemperatures',
      params: [{ name: 'temperatures', type: 'int[]' }],
      returnType: 'int[]',
    },
    referenceJs: `function dailyTemperatures(temperatures) {
    const out = new Array(temperatures.length).fill(0);
    const stack = [];
    temperatures.forEach((t, i) => {
        while (stack.length && temperatures[stack[stack.length - 1]] < t) {
            const j = stack.pop();
            out[j] = i - j;
        }
        stack.push(i);
    });
    return out;
}
`,
    inputs: [
      [[73, 74, 75, 71, 69, 72, 76, 73]],
      [[30, 40, 50, 60]],
      [[30, 60, 90]],
      [[90]],
      [[50, 40, 30, 60]],
    ],
  },
  {
    key: 'subarraySum',
    title: 'Subarray Sum Equals K',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho mảng `nums` và số `k`. Trả về số đoạn con liên tiếp (không rỗng) có tổng bằng `k`.',
    constraintsMd: '1 ≤ nums.length ≤ 2·10^4, -1000 ≤ nums[i] ≤ 1000',
    signature: {
      functionName: 'subarraySum',
      params: [
        { name: 'nums', type: 'int[]' },
        { name: 'k', type: 'int' },
      ],
      returnType: 'int',
    },
    referenceJs: `function subarraySum(nums, k) {
    const seen = new Map([[0, 1]]);
    let sum = 0, count = 0;
    for (const x of nums) {
        sum += x;
        count += seen.get(sum - k) ?? 0;
        seen.set(sum, (seen.get(sum) ?? 0) + 1);
    }
    return count;
}
`,
    inputs: [
      [[1, 1, 1], 2],
      [[1, 2, 3], 3],
      [[1], 0],
      [[1, -1, 0], 0],
      [[3, 4, 7, 2, -3, 1, 4, 2], 7],
    ],
  },
  {
    key: 'rotateImage',
    title: 'Rotate Image',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho ma trận vuông `matrix` kích thước `n × n`. Trả về ma trận sau khi xoay 90° theo chiều kim đồng hồ.',
    constraintsMd: '1 ≤ n ≤ 20',
    signature: {
      functionName: 'rotate',
      params: [{ name: 'matrix', type: 'int[][]' }],
      returnType: 'int[][]',
    },
    referenceJs: `function rotate(matrix) {
    const n = matrix.length;
    return matrix.map((_, i) => matrix.map((__, j) => matrix[n - 1 - j][i]));
}
`,
    inputs: [
      [
        [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
      ],
      [
        [
          [5, 1, 9, 11],
          [2, 4, 8, 10],
          [13, 3, 6, 7],
          [15, 14, 12, 16],
        ],
      ],
      [[[1]]],
      [
        [
          [1, 2],
          [3, 4],
        ],
      ],
      [
        [
          [-1, 0],
          [0, -1],
        ],
      ],
    ],
  },
  {
    key: 'spiralOrder',
    title: 'Spiral Matrix',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho ma trận `matrix` kích thước `m × n`. Trả về mọi phần tử theo thứ tự xoắn ốc, bắt đầu từ góc trên-trái và đi theo chiều kim đồng hồ.',
    constraintsMd: '1 ≤ m, n ≤ 10',
    signature: {
      functionName: 'spiralOrder',
      params: [{ name: 'matrix', type: 'int[][]' }],
      returnType: 'int[]',
    },
    referenceJs: `function spiralOrder(matrix) {
    const out = [];
    let top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1;
    while (top <= bottom && left <= right) {
        for (let j = left; j <= right; j++) out.push(matrix[top][j]);
        for (let i = top + 1; i <= bottom; i++) out.push(matrix[i][right]);
        if (top < bottom) for (let j = right - 1; j >= left; j--) out.push(matrix[bottom][j]);
        if (left < right) for (let i = bottom - 1; i > top; i--) out.push(matrix[i][left]);
        top++;
        bottom--;
        left++;
        right--;
    }
    return out;
}
`,
    inputs: [
      [
        [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
      ],
      [
        [
          [1, 2, 3, 4],
          [5, 6, 7, 8],
          [9, 10, 11, 12],
        ],
      ],
      [[[1]]],
      [[[1], [2], [3]]],
      [[[1, 2, 3]]],
    ],
  },
  {
    key: 'wordBreak',
    title: 'Word Break',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho chuỗi `s` và từ điển `wordDict`. Trả về `true` nếu `s` có thể tách thành dãy các từ trong từ điển (mỗi từ dùng được nhiều lần).',
    constraintsMd: '1 ≤ s.length ≤ 300, 1 ≤ wordDict.length ≤ 1000',
    signature: {
      functionName: 'wordBreak',
      params: [
        { name: 's', type: 'string' },
        { name: 'wordDict', type: 'string[]' },
      ],
      returnType: 'boolean',
    },
    referenceJs: `function wordBreak(s, wordDict) {
    const words = new Set(wordDict);
    const ok = [true];
    for (let i = 1; i <= s.length; i++) {
        ok[i] = false;
        for (let j = 0; j < i && !ok[i]; j++) ok[i] = ok[j] && words.has(s.slice(j, i));
    }
    return ok[s.length];
}
`,
    inputs: [
      ['leetcode', ['leet', 'code']],
      ['applepenapple', ['apple', 'pen']],
      ['catsandog', ['cats', 'dog', 'sand', 'and', 'cat']],
      ['a', ['b']],
      ['aaaaaaa', ['aaaa', 'aaa']],
    ],
  },
  {
    key: 'longestConsecutive',
    title: 'Longest Consecutive Sequence',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho mảng `nums` chưa sắp xếp. Trả về độ dài dãy số nguyên liên tiếp dài nhất có thể tạo từ các phần tử của mảng. Yêu cầu O(n).',
    constraintsMd: '0 ≤ nums.length ≤ 10^5',
    signature: {
      functionName: 'longestConsecutive',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'int',
    },
    referenceJs: `function longestConsecutive(nums) {
    const set = new Set(nums);
    let best = 0;
    for (const x of set) {
        if (set.has(x - 1)) continue;
        let len = 1;
        while (set.has(x + len)) len++;
        best = Math.max(best, len);
    }
    return best;
}
`,
    inputs: [
      [[100, 4, 200, 1, 3, 2]],
      [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]],
      [[]],
      [[1, 2, 0, 1]],
      [[-1, -2, 5]],
    ],
  },
  {
    key: 'findKthLargest',
    title: 'Kth Largest Element in an Array',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho mảng `nums` và số `k`. Trả về phần tử lớn thứ `k` (theo thứ tự đã sắp, không phải phần tử phân biệt thứ `k`).',
    constraintsMd: '1 ≤ k ≤ nums.length ≤ 10^5',
    signature: {
      functionName: 'findKthLargest',
      params: [
        { name: 'nums', type: 'int[]' },
        { name: 'k', type: 'int' },
      ],
      returnType: 'int',
    },
    referenceJs: `function findKthLargest(nums, k) {
    return [...nums].sort((a, b) => b - a)[k - 1];
}
`,
    inputs: [
      [[3, 2, 1, 5, 6, 4], 2],
      [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4],
      [[1], 1],
      [[-1, -1], 2],
      [[7, 10, 4, 3, 20, 15], 3],
    ],
  },
  {
    key: 'generateParenthesis',
    title: 'Generate Parentheses',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho số `n`. Trả về mọi chuỗi gồm `n` cặp ngoặc `()` hợp lệ, sắp tăng dần theo thứ tự từ điển (`(` đứng trước `)`).',
    constraintsMd: '1 ≤ n ≤ 8',
    signature: {
      functionName: 'generateParenthesis',
      params: [{ name: 'n', type: 'int' }],
      returnType: 'string[]',
    },
    referenceJs: `function generateParenthesis(n) {
    const out = [];
    const go = (s, open, close) => {
        if (s.length === 2 * n) return out.push(s);
        if (open < n) go(s + '(', open + 1, close);
        if (close < open) go(s + ')', open, close + 1);
    };
    go('', 0, 0);
    return out;
}
`,
    inputs: [[3], [1], [2], [4], [5]],
  },
  {
    key: 'permutations',
    title: 'Permutations',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho mảng `nums` gồm các số phân biệt. Trả về mọi hoán vị, sắp theo thứ tự từ điển.',
    constraintsMd: '1 ≤ nums.length ≤ 6',
    signature: {
      functionName: 'permute',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'int[][]',
    },
    referenceJs: `function permute(nums) {
    const a = [...nums].sort((x, y) => x - y);
    const out = [];
    const used = [];
    const go = (cur) => {
        if (cur.length === a.length) return out.push([...cur]);
        a.forEach((x, i) => {
            if (used[i]) return;
            used[i] = true;
            cur.push(x);
            go(cur);
            cur.pop();
            used[i] = false;
        });
    };
    go([]);
    return out;
}
`,
    inputs: [[[1, 2, 3]], [[0, 1]], [[1]], [[3, -1, 2]], [[1, 2, 3, 4]]],
  },
  {
    key: 'reverseWords',
    title: 'Reverse Words in a String',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho chuỗi `s`. Trả về chuỗi các từ theo thứ tự ngược lại, các từ cách nhau đúng một dấu cách, không có khoảng trắng ở đầu/cuối.',
    constraintsMd: '1 ≤ s.length ≤ 10^4, có ít nhất một từ',
    signature: {
      functionName: 'reverseWords',
      params: [{ name: 's', type: 'string' }],
      returnType: 'string',
    },
    referenceJs: `function reverseWords(s) {
    return s.trim().split(/\\s+/).reverse().join(' ');
}
`,
    inputs: [
      ['the sky is blue'],
      ['  hello world  '],
      ['a good   example'],
      ['one'],
      ['  Bob    Loves  Alice   '],
    ],
  },
  {
    key: 'findMinRotated',
    title: 'Find Minimum in Rotated Sorted Array',
    difficulty: 'MEDIUM',
    statementMd:
      'Mảng `nums` (phân biệt) vốn tăng dần nhưng đã bị xoay. Trả về phần tử nhỏ nhất. Yêu cầu O(log n).',
    constraintsMd: '1 ≤ nums.length ≤ 5000',
    signature: {
      functionName: 'findMin',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'int',
    },
    referenceJs: `function findMin(nums) {
    let lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] > nums[hi]) lo = mid + 1;
        else hi = mid;
    }
    return nums[lo];
}
`,
    inputs: [[[3, 4, 5, 1, 2]], [[4, 5, 6, 7, 0, 1, 2]], [[11, 13, 15, 17]], [[1]], [[2, 1]]],
  },
  {
    key: 'longestCommonSubsequence',
    title: 'Longest Common Subsequence',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho hai chuỗi `text1` và `text2`. Trả về độ dài dãy con chung dài nhất (giữ thứ tự, không cần liên tiếp).',
    constraintsMd: '1 ≤ text1.length, text2.length ≤ 1000',
    signature: {
      functionName: 'longestCommonSubsequence',
      params: [
        { name: 'text1', type: 'string' },
        { name: 'text2', type: 'string' },
      ],
      returnType: 'int',
    },
    referenceJs: `function longestCommonSubsequence(text1, text2) {
    const dp = new Array(text2.length + 1).fill(0);
    for (const a of text1) {
        let prev = 0;
        for (let j = 1; j <= text2.length; j++) {
            const tmp = dp[j];
            dp[j] = a === text2[j - 1] ? prev + 1 : Math.max(dp[j], dp[j - 1]);
            prev = tmp;
        }
    }
    return dp[text2.length];
}
`,
    inputs: [
      ['abcde', 'ace'],
      ['abc', 'abc'],
      ['abc', 'def'],
      ['a', 'a'],
      ['bsbininm', 'jmjkbkjkv'],
    ],
  },
  {
    key: 'jumpGame2',
    title: 'Jump Game II',
    difficulty: 'MEDIUM',
    statementMd:
      'Bạn đứng ở vị trí 0 của mảng `nums`; `nums[i]` là bước nhảy xa nhất từ vị trí `i`. Trả về số lần nhảy ít nhất để tới vị trí cuối (luôn tới được).',
    constraintsMd: '1 ≤ nums.length ≤ 10^4, 0 ≤ nums[i] ≤ 1000',
    signature: {
      functionName: 'jump',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'int',
    },
    referenceJs: `function jump(nums) {
    let jumps = 0, end = 0, far = 0;
    for (let i = 0; i < nums.length - 1; i++) {
        far = Math.max(far, i + nums[i]);
        if (i === end) {
            jumps++;
            end = far;
        }
    }
    return jumps;
}
`,
    inputs: [[[2, 3, 1, 1, 4]], [[2, 3, 0, 1, 4]], [[0]], [[1, 2]], [[1, 1, 1, 1]]],
  },
  {
    key: 'gasStation',
    title: 'Gas Station',
    difficulty: 'MEDIUM',
    statementMd:
      'Có `n` trạm xăng trên đường vòng; trạm `i` cho `gas[i]` lít, đi từ trạm `i` sang `i + 1` tốn `cost[i]` lít. Xe bắt đầu với bình rỗng. Trả về chỉ số trạm xuất phát để đi hết một vòng, hoặc `-1` (đáp án nếu có là duy nhất).',
    constraintsMd: '1 ≤ n ≤ 10^5, 0 ≤ gas[i], cost[i] ≤ 10^4',
    signature: {
      functionName: 'canCompleteCircuit',
      params: [
        { name: 'gas', type: 'int[]' },
        { name: 'cost', type: 'int[]' },
      ],
      returnType: 'int',
    },
    referenceJs: `function canCompleteCircuit(gas, cost) {
    let total = 0, tank = 0, start = 0;
    for (let i = 0; i < gas.length; i++) {
        const d = gas[i] - cost[i];
        total += d;
        tank += d;
        if (tank < 0) {
            start = i + 1;
            tank = 0;
        }
    }
    return total < 0 ? -1 : start;
}
`,
    inputs: [
      [
        [1, 2, 3, 4, 5],
        [3, 4, 5, 1, 2],
      ],
      [
        [2, 3, 4],
        [3, 4, 3],
      ],
      [[5], [4]],
      [
        [5, 1, 2, 3, 4],
        [4, 4, 1, 5, 1],
      ],
      [
        [3, 1, 1],
        [1, 2, 2],
      ],
    ],
  },
  {
    key: 'sortColors',
    title: 'Sort Colors',
    difficulty: 'MEDIUM',
    statementMd:
      'Mảng `nums` chỉ gồm `0` (đỏ), `1` (trắng), `2` (xanh). Trả về mảng đã sắp tăng dần. Thử không dùng hàm sort có sẵn và chỉ duyệt mảng một lần.',
    constraintsMd: '1 ≤ nums.length ≤ 300',
    signature: {
      functionName: 'sortColors',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'int[]',
    },
    referenceJs: `function sortColors(nums) {
    const count = [0, 0, 0];
    for (const x of nums) count[x]++;
    return [...Array(count[0]).fill(0), ...Array(count[1]).fill(1), ...Array(count[2]).fill(2)];
}
`,
    inputs: [[[2, 0, 2, 1, 1, 0]], [[2, 0, 1]], [[0]], [[1, 1]], [[2, 2, 0, 0, 1]]],
  },
  {
    key: 'searchMatrix',
    title: 'Search a 2D Matrix',
    difficulty: 'MEDIUM',
    statementMd:
      'Ma trận `matrix` có mỗi hàng tăng dần và phần tử đầu mỗi hàng lớn hơn phần tử cuối hàng trước. Trả về `true` nếu `target` có trong ma trận. Yêu cầu O(log(m·n)).',
    constraintsMd: '1 ≤ m, n ≤ 100',
    signature: {
      functionName: 'searchMatrix',
      params: [
        { name: 'matrix', type: 'int[][]' },
        { name: 'target', type: 'int' },
      ],
      returnType: 'boolean',
    },
    referenceJs: `function searchMatrix(matrix, target) {
    const n = matrix[0].length;
    let lo = 0, hi = matrix.length * n - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const v = matrix[Math.floor(mid / n)][mid % n];
        if (v === target) return true;
        if (v < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return false;
}
`,
    inputs: [
      [
        [
          [1, 3, 5, 7],
          [10, 11, 16, 20],
          [23, 30, 34, 60],
        ],
        3,
      ],
      [
        [
          [1, 3, 5, 7],
          [10, 11, 16, 20],
          [23, 30, 34, 60],
        ],
        13,
      ],
      [[[1]], 1],
      [[[1, 3]], 3],
      [[[1], [3]], 2],
    ],
  },
  {
    key: 'decodeWays',
    title: 'Decode Ways',
    difficulty: 'MEDIUM',
    statementMd:
      'Chữ cái được mã hóa `A → "1"`, `B → "2"`, …, `Z → "26"`. Cho chuỗi chữ số `s`, trả về số cách giải mã (`"06"` không hợp lệ vì có số 0 ở đầu).',
    constraintsMd: '1 ≤ s.length ≤ 100',
    signature: {
      functionName: 'numDecodings',
      params: [{ name: 's', type: 'string' }],
      returnType: 'int',
    },
    referenceJs: `function numDecodings(s) {
    let prev = 1, cur = s[0] === '0' ? 0 : 1;
    for (let i = 1; i < s.length; i++) {
        let next = s[i] === '0' ? 0 : cur;
        const two = Number(s.slice(i - 1, i + 1));
        if (two >= 10 && two <= 26) next += prev;
        [prev, cur] = [cur, next];
    }
    return cur;
}
`,
    inputs: [['12'], ['226'], ['06'], ['0'], ['11106'], ['2611055971756562']],
  },
  {
    key: 'canPartition',
    title: 'Partition Equal Subset Sum',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho mảng số dương `nums`. Trả về `true` nếu có thể chia mảng thành hai tập con có tổng bằng nhau.',
    constraintsMd: '1 ≤ nums.length ≤ 200, 1 ≤ nums[i] ≤ 100',
    signature: {
      functionName: 'canPartition',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'boolean',
    },
    referenceJs: `function canPartition(nums) {
    const total = nums.reduce((a, b) => a + b, 0);
    if (total % 2) return false;
    const half = total / 2;
    const can = new Array(half + 1).fill(false);
    can[0] = true;
    for (const x of nums) for (let s = half; s >= x; s--) can[s] = can[s] || can[s - x];
    return can[half];
}
`,
    inputs: [[[1, 5, 11, 5]], [[1, 2, 3, 5]], [[1]], [[2, 2]], [[3, 3, 3, 4, 5]]],
  },
  {
    key: 'maxProduct',
    title: 'Maximum Product Subarray',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho mảng `nums`. Tìm đoạn con liên tiếp (không rỗng) có tích lớn nhất và trả về tích đó.',
    constraintsMd: '1 ≤ nums.length ≤ 2·10^4, -10 ≤ nums[i] ≤ 10, kết quả vừa kiểu int',
    signature: {
      functionName: 'maxProduct',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'int',
    },
    referenceJs: `function maxProduct(nums) {
    let hi = nums[0], lo = nums[0], best = nums[0];
    for (let i = 1; i < nums.length; i++) {
        const x = nums[i];
        [hi, lo] = [Math.max(x, hi * x, lo * x), Math.min(x, hi * x, lo * x)];
        best = Math.max(best, hi);
    }
    return best || 0; // turns -0 into 0
}
`,
    inputs: [[[2, 3, -2, 4]], [[-2, 0, -1]], [[-2]], [[-2, 3, -4]], [[0, 2]]],
  },
  {
    key: 'characterReplacement',
    title: 'Longest Repeating Character Replacement',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho chuỗi chữ hoa `s` và số `k`. Bạn được đổi tối đa `k` ký tự thành bất kỳ chữ hoa nào. Trả về độ dài chuỗi con dài nhất chỉ gồm một loại ký tự sau khi đổi.',
    constraintsMd: '1 ≤ s.length ≤ 10^5, 0 ≤ k ≤ s.length',
    signature: {
      functionName: 'characterReplacement',
      params: [
        { name: 's', type: 'string' },
        { name: 'k', type: 'int' },
      ],
      returnType: 'int',
    },
    referenceJs: `function characterReplacement(s, k) {
    const count = {};
    let start = 0, top = 0, best = 0;
    for (let i = 0; i < s.length; i++) {
        count[s[i]] = (count[s[i]] ?? 0) + 1;
        top = Math.max(top, count[s[i]]);
        while (i - start + 1 - top > k) count[s[start++]]--;
        best = Math.max(best, i - start + 1);
    }
    return best;
}
`,
    inputs: [
      ['ABAB', 2],
      ['AABABBA', 1],
      ['A', 0],
      ['ABCDE', 1],
      ['AAAA', 0],
    ],
  },
  {
    key: 'findAnagrams',
    title: 'Find All Anagrams in a String',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho hai chuỗi `s` và `p`. Trả về (tăng dần) mọi chỉ số bắt đầu của các chuỗi con trong `s` là anagram của `p`.',
    constraintsMd: '1 ≤ s.length, p.length ≤ 3·10^4, chữ thường a-z',
    signature: {
      functionName: 'findAnagrams',
      params: [
        { name: 's', type: 'string' },
        { name: 'p', type: 'string' },
      ],
      returnType: 'int[]',
    },
    referenceJs: `function findAnagrams(s, p) {
    const key = (t) => [...t].sort().join('');
    const target = key(p);
    const out = [];
    for (let i = 0; i + p.length <= s.length; i++)
        if (key(s.slice(i, i + p.length)) === target) out.push(i);
    return out;
}
`,
    inputs: [
      ['cbaebabacd', 'abc'],
      ['abab', 'ab'],
      ['a', 'ab'],
      ['aaaa', 'aa'],
      ['baa', 'aa'],
    ],
  },
  {
    key: 'evalRPN',
    title: 'Evaluate Reverse Polish Notation',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho biểu thức ký pháp Ba Lan ngược `tokens` gồm số nguyên và các toán tử `+ - * /`. Phép chia lấy phần nguyên làm tròn về 0. Trả về giá trị biểu thức.',
    constraintsMd: '1 ≤ tokens.length ≤ 10^4, biểu thức luôn hợp lệ, không chia cho 0',
    signature: {
      functionName: 'evalRPN',
      params: [{ name: 'tokens', type: 'string[]' }],
      returnType: 'int',
    },
    referenceJs: `function evalRPN(tokens) {
    const ops = {
        '+': (a, b) => a + b,
        '-': (a, b) => a - b,
        '*': (a, b) => a * b,
        '/': (a, b) => Math.trunc(a / b),
    };
    const stack = [];
    for (const t of tokens) {
        if (t in ops) {
            const b = stack.pop();
            const a = stack.pop();
            stack.push(ops[t](a, b));
        } else stack.push(Number(t));
    }
    return stack[0] || 0; // turns -0 into 0
}
`,
    inputs: [
      [['2', '1', '+', '3', '*']],
      [['4', '13', '5', '/', '+']],
      [['10', '6', '9', '3', '+', '-11', '*', '/', '*', '17', '+', '5', '+']],
      [['7']],
      [['3', '-4', '-']],
    ],
  },
  {
    key: 'asteroidCollision',
    title: 'Asteroid Collision',
    difficulty: 'MEDIUM',
    statementMd:
      'Mảng `asteroids`: giá trị tuyệt đối là kích thước, dấu là hướng (dương sang phải, âm sang trái). Khi hai thiên thạch va nhau, cái nhỏ hơn nổ; bằng nhau thì cả hai nổ. Trả về trạng thái cuối cùng.',
    constraintsMd: '2 ≤ asteroids.length ≤ 10^4, asteroids[i] ≠ 0',
    signature: {
      functionName: 'asteroidCollision',
      params: [{ name: 'asteroids', type: 'int[]' }],
      returnType: 'int[]',
    },
    referenceJs: `function asteroidCollision(asteroids) {
    const stack = [];
    for (const a of asteroids) {
        let alive = true;
        while (alive && a < 0 && stack.length && stack[stack.length - 1] > 0) {
            const top = stack[stack.length - 1];
            if (top < -a) stack.pop();
            else {
                if (top === -a) stack.pop();
                alive = false;
            }
        }
        if (alive) stack.push(a);
    }
    return stack;
}
`,
    inputs: [[[5, 10, -5]], [[8, -8]], [[10, 2, -5]], [[-2, -1, 1, 2]], [[1, -2, -2, -2]]],
  },
  {
    key: 'minPathSum',
    title: 'Minimum Path Sum',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho lưới `grid` số không âm. Đi từ góc trên-trái tới góc dưới-phải, mỗi bước sang phải hoặc xuống dưới. Trả về tổng nhỏ nhất của các ô trên đường đi.',
    constraintsMd: '1 ≤ m, n ≤ 200, 0 ≤ grid[i][j] ≤ 200',
    signature: {
      functionName: 'minPathSum',
      params: [{ name: 'grid', type: 'int[][]' }],
      returnType: 'int',
    },
    referenceJs: `function minPathSum(grid) {
    const dp = [...grid[0]];
    for (let j = 1; j < dp.length; j++) dp[j] += dp[j - 1];
    for (let i = 1; i < grid.length; i++) {
        dp[0] += grid[i][0];
        for (let j = 1; j < dp.length; j++) dp[j] = Math.min(dp[j], dp[j - 1]) + grid[i][j];
    }
    return dp[dp.length - 1];
}
`,
    inputs: [
      [
        [
          [1, 3, 1],
          [1, 5, 1],
          [4, 2, 1],
        ],
      ],
      [
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
      ],
      [[[0]]],
      [[[1], [2], [3]]],
      [
        [
          [5, 1, 0],
          [2, 8, 1],
          [9, 3, 0],
        ],
      ],
    ],
  },
  {
    key: 'wordSearch',
    title: 'Word Search',
    difficulty: 'MEDIUM',
    statementMd:
      'Cho bảng chữ `board` và từ `word`. Trả về `true` nếu `word` được tạo từ các ô kề nhau theo chiều ngang/dọc, mỗi ô dùng tối đa một lần.',
    constraintsMd: '1 ≤ m, n ≤ 6, 1 ≤ word.length ≤ 15',
    signature: {
      functionName: 'exist',
      params: [
        { name: 'board', type: 'string[][]' },
        { name: 'word', type: 'string' },
      ],
      returnType: 'boolean',
    },
    referenceJs: `function exist(board, word) {
    const rows = board.length, cols = board[0].length;
    const seen = board.map((row) => row.map(() => false));
    const dfs = (r, c, k) => {
        if (k === word.length) return true;
        if (r < 0 || c < 0 || r >= rows || c >= cols || seen[r][c] || board[r][c] !== word[k]) return false;
        seen[r][c] = true;
        const found = dfs(r + 1, c, k + 1) || dfs(r - 1, c, k + 1) || dfs(r, c + 1, k + 1) || dfs(r, c - 1, k + 1);
        seen[r][c] = false;
        return found;
    };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (dfs(r, c, 0)) return true;
    return false;
}
`,
    inputs: [
      [
        [
          ['A', 'B', 'C', 'E'],
          ['S', 'F', 'C', 'S'],
          ['A', 'D', 'E', 'E'],
        ],
        'ABCCED',
      ],
      [
        [
          ['A', 'B', 'C', 'E'],
          ['S', 'F', 'C', 'S'],
          ['A', 'D', 'E', 'E'],
        ],
        'SEE',
      ],
      [
        [
          ['A', 'B', 'C', 'E'],
          ['S', 'F', 'C', 'S'],
          ['A', 'D', 'E', 'E'],
        ],
        'ABCB',
      ],
      [[['a']], 'a'],
      [
        [
          ['a', 'b'],
          ['c', 'd'],
        ],
        'abdc',
      ],
    ],
  },
  {
    key: 'courseSchedule',
    title: 'Course Schedule',
    difficulty: 'MEDIUM',
    statementMd:
      'Có `numCourses` môn học đánh số từ `0`. `prerequisites[i] = [a, b]` nghĩa là phải học `b` trước `a`. Trả về `true` nếu có thể học hết mọi môn.',
    constraintsMd: '1 ≤ numCourses ≤ 2000, 0 ≤ prerequisites.length ≤ 5000',
    signature: {
      functionName: 'canFinish',
      params: [
        { name: 'numCourses', type: 'int' },
        { name: 'prerequisites', type: 'int[][]' },
      ],
      returnType: 'boolean',
    },
    referenceJs: `function canFinish(numCourses, prerequisites) {
    const indeg = new Array(numCourses).fill(0);
    const next = Array.from({ length: numCourses }, () => []);
    for (const [a, b] of prerequisites) {
        next[b].push(a);
        indeg[a]++;
    }
    const queue = [];
    indeg.forEach((d, i) => d === 0 && queue.push(i));
    let done = 0;
    while (queue.length) {
        const c = queue.pop();
        done++;
        for (const n of next[c]) if (--indeg[n] === 0) queue.push(n);
    }
    return done === numCourses;
}
`,
    inputs: [
      [2, [[1, 0]]],
      [
        2,
        [
          [1, 0],
          [0, 1],
        ],
      ],
      [1, []],
      [
        4,
        [
          [1, 0],
          [2, 1],
          [3, 2],
        ],
      ],
      [
        3,
        [
          [0, 1],
          [1, 2],
          [2, 0],
        ],
      ],
    ],
  },
  {
    key: 'orangesRotting',
    title: 'Rotting Oranges',
    difficulty: 'MEDIUM',
    statementMd:
      'Lưới `grid`: `0` ô trống, `1` cam tươi, `2` cam thối. Mỗi phút, cam tươi kề (ngang/dọc) cam thối sẽ bị thối. Trả về số phút ít nhất để không còn cam tươi, hoặc `-1` nếu không thể.',
    constraintsMd: '1 ≤ m, n ≤ 10',
    signature: {
      functionName: 'orangesRotting',
      params: [{ name: 'grid', type: 'int[][]' }],
      returnType: 'int',
    },
    referenceJs: `function orangesRotting(grid) {
    const g = grid.map((row) => [...row]);
    let fresh = 0, queue = [];
    g.forEach((row, r) =>
        row.forEach((v, c) => {
            if (v === 1) fresh++;
            if (v === 2) queue.push([r, c]);
        }),
    );
    let minutes = 0;
    while (queue.length && fresh) {
        const next = [];
        for (const [r, c] of queue)
            for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nr = r + dr, nc = c + dc;
                if (g[nr]?.[nc] === 1) {
                    g[nr][nc] = 2;
                    fresh--;
                    next.push([nr, nc]);
                }
            }
        queue = next;
        minutes++;
    }
    return fresh ? -1 : minutes;
}
`,
    inputs: [
      [
        [
          [2, 1, 1],
          [1, 1, 0],
          [0, 1, 1],
        ],
      ],
      [
        [
          [2, 1, 1],
          [0, 1, 1],
          [1, 0, 1],
        ],
      ],
      [[[0, 2]]],
      [[[1]]],
      [
        [
          [2, 2],
          [1, 1],
          [0, 0],
          [2, 0],
        ],
      ],
    ],
  },
  // ─── LeetCode phổ biến · HARD ───
  {
    key: 'trappingRainWater',
    title: 'Trapping Rain Water',
    difficulty: 'HARD',
    statementMd:
      'Mảng `height` mô tả bản đồ độ cao, mỗi cột rộng 1. Trả về tổng lượng nước mưa có thể đọng lại giữa các cột.',
    constraintsMd: '1 ≤ height.length ≤ 2·10^4, 0 ≤ height[i] ≤ 10^5',
    signature: {
      functionName: 'trap',
      params: [{ name: 'height', type: 'int[]' }],
      returnType: 'int',
    },
    referenceJs: `function trap(height) {
    let l = 0, r = height.length - 1, lmax = 0, rmax = 0, water = 0;
    while (l < r) {
        if (height[l] < height[r]) {
            lmax = Math.max(lmax, height[l]);
            water += lmax - height[l++];
        } else {
            rmax = Math.max(rmax, height[r]);
            water += rmax - height[r--];
        }
    }
    return water;
}
`,
    inputs: [
      [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]],
      [[4, 2, 0, 3, 2, 5]],
      [[1]],
      [[3, 0, 3]],
      [[5, 4, 3, 2, 1]],
    ],
  },
  {
    key: 'medianSortedArrays',
    title: 'Median of Two Sorted Arrays',
    difficulty: 'HARD',
    statementMd:
      'Cho hai mảng tăng dần `nums1` và `nums2`. Trả về trung vị của mảng gộp. Thử đạt O(log(m + n)).',
    constraintsMd: '0 ≤ m, n ≤ 1000, 1 ≤ m + n',
    signature: {
      functionName: 'findMedianSortedArrays',
      params: [
        { name: 'nums1', type: 'int[]' },
        { name: 'nums2', type: 'int[]' },
      ],
      returnType: 'double',
    },
    referenceJs: `function findMedianSortedArrays(nums1, nums2) {
    const a = [...nums1, ...nums2].sort((x, y) => x - y);
    const mid = a.length >> 1;
    return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}
`,
    inputs: [
      [[1, 3], [2]],
      [
        [1, 2],
        [3, 4],
      ],
      [[], [1]],
      [
        [0, 0],
        [0, 0],
      ],
      [
        [-5, 3, 6, 12, 15],
        [-12, -10, -6, -3, 4, 10],
      ],
    ],
  },
  {
    key: 'editDistance',
    title: 'Edit Distance',
    difficulty: 'HARD',
    statementMd:
      'Cho hai chuỗi `word1` và `word2`. Mỗi thao tác được chèn, xóa hoặc thay một ký tự. Trả về số thao tác ít nhất để biến `word1` thành `word2`.',
    constraintsMd: '0 ≤ word1.length, word2.length ≤ 500',
    signature: {
      functionName: 'minDistance',
      params: [
        { name: 'word1', type: 'string' },
        { name: 'word2', type: 'string' },
      ],
      returnType: 'int',
    },
    referenceJs: `function minDistance(word1, word2) {
    let prev = Array.from({ length: word2.length + 1 }, (_, j) => j);
    for (let i = 1; i <= word1.length; i++) {
        const cur = [i];
        for (let j = 1; j <= word2.length; j++)
            cur[j] = word1[i - 1] === word2[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j - 1], prev[j], cur[j - 1]);
        prev = cur;
    }
    return prev[word2.length];
}
`,
    inputs: [
      ['horse', 'ros'],
      ['intention', 'execution'],
      ['', ''],
      ['abc', ''],
      ['kitten', 'sitting'],
    ],
  },
  {
    key: 'longestValidParentheses',
    title: 'Longest Valid Parentheses',
    difficulty: 'HARD',
    statementMd:
      'Cho chuỗi `s` chỉ gồm `(` và `)`. Trả về độ dài chuỗi con liên tiếp dài nhất là dãy ngoặc hợp lệ.',
    constraintsMd: '0 ≤ s.length ≤ 3·10^4',
    signature: {
      functionName: 'longestValidParentheses',
      params: [{ name: 's', type: 'string' }],
      returnType: 'int',
    },
    referenceJs: `function longestValidParentheses(s) {
    const stack = [-1];
    let best = 0;
    for (let i = 0; i < s.length; i++) {
        if (s[i] === '(') stack.push(i);
        else {
            stack.pop();
            if (stack.length) best = Math.max(best, i - stack[stack.length - 1]);
            else stack.push(i);
        }
    }
    return best;
}
`,
    inputs: [['(()'], [')()())'], [''], ['()(())'], ['(()(((()']],
  },
  {
    key: 'minWindow',
    title: 'Minimum Window Substring',
    difficulty: 'HARD',
    statementMd:
      'Cho hai chuỗi `s` và `t`. Trả về chuỗi con ngắn nhất của `s` chứa mọi ký tự của `t` (tính cả số lần lặp), hoặc chuỗi rỗng nếu không có. Nếu nhiều đáp án cùng độ dài, trả về đoạn xuất hiện sớm nhất.',
    constraintsMd: '1 ≤ s.length, t.length ≤ 10^5, chữ hoa và chữ thường',
    signature: {
      functionName: 'minWindow',
      params: [
        { name: 's', type: 'string' },
        { name: 't', type: 'string' },
      ],
      returnType: 'string',
    },
    referenceJs: `function minWindow(s, t) {
    const need = new Map();
    for (const c of t) need.set(c, (need.get(c) ?? 0) + 1);
    let missing = t.length, start = 0, bestStart = 0, bestLen = Infinity;
    for (let i = 0; i < s.length; i++) {
        if (need.has(s[i])) {
            if (need.get(s[i]) > 0) missing--;
            need.set(s[i], need.get(s[i]) - 1);
        }
        while (missing === 0) {
            if (i - start + 1 < bestLen) {
                bestLen = i - start + 1;
                bestStart = start;
            }
            const c = s[start++];
            if (need.has(c)) {
                need.set(c, need.get(c) + 1);
                if (need.get(c) > 0) missing++;
            }
        }
    }
    return bestLen === Infinity ? '' : s.slice(bestStart, bestStart + bestLen);
}
`,
    inputs: [
      ['ADOBECODEBANC', 'ABC'],
      ['a', 'a'],
      ['a', 'aa'],
      ['ab', 'b'],
      ['aaflslflsldkalskaaa', 'aaa'],
    ],
  },
  {
    key: 'largestRectangle',
    title: 'Largest Rectangle in Histogram',
    difficulty: 'HARD',
    statementMd:
      'Mảng `heights` là chiều cao các cột của biểu đồ, mỗi cột rộng 1. Trả về diện tích hình chữ nhật lớn nhất nằm trọn trong biểu đồ.',
    constraintsMd: '1 ≤ heights.length ≤ 10^5, 0 ≤ heights[i] ≤ 10^4',
    signature: {
      functionName: 'largestRectangleArea',
      params: [{ name: 'heights', type: 'int[]' }],
      returnType: 'int',
    },
    referenceJs: `function largestRectangleArea(heights) {
    const stack = [];
    let best = 0;
    for (let i = 0; i <= heights.length; i++) {
        const h = i === heights.length ? 0 : heights[i];
        while (stack.length && heights[stack[stack.length - 1]] >= h) {
            const height = heights[stack.pop()];
            const left = stack.length ? stack[stack.length - 1] + 1 : 0;
            best = Math.max(best, height * (i - left));
        }
        stack.push(i);
    }
    return best;
}
`,
    inputs: [[[2, 1, 5, 6, 2, 3]], [[2, 4]], [[1]], [[2, 2, 2, 2]], [[6, 2, 5, 4, 5, 1, 6]]],
  },
  {
    key: 'maxSlidingWindow',
    title: 'Sliding Window Maximum',
    difficulty: 'HARD',
    statementMd:
      'Cho mảng `nums` và cửa sổ độ dài `k` trượt từ trái sang phải từng bước một. Trả về mảng giá trị lớn nhất trong mỗi vị trí cửa sổ. Yêu cầu O(n).',
    constraintsMd: '1 ≤ k ≤ nums.length ≤ 10^5',
    signature: {
      functionName: 'maxSlidingWindow',
      params: [
        { name: 'nums', type: 'int[]' },
        { name: 'k', type: 'int' },
      ],
      returnType: 'int[]',
    },
    referenceJs: `function maxSlidingWindow(nums, k) {
    const dq = [], out = [];
    let head = 0;
    for (let i = 0; i < nums.length; i++) {
        while (dq.length > head && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();
        dq.push(i);
        if (dq[head] <= i - k) head++;
        if (i >= k - 1) out.push(nums[dq[head]]);
    }
    return out;
}
`,
    inputs: [
      [[1, 3, -1, -3, 5, 3, 6, 7], 3],
      [[1], 1],
      [[1, -1], 1],
      [[9, 11], 2],
      [[4, -2], 2],
      [[7, 2, 4], 2],
    ],
  },
  {
    key: 'firstMissingPositive',
    title: 'First Missing Positive',
    difficulty: 'HARD',
    statementMd:
      'Cho mảng `nums` chưa sắp xếp. Trả về số nguyên dương nhỏ nhất không có trong mảng. Thử đạt O(n) thời gian và O(1) bộ nhớ phụ.',
    constraintsMd: '1 ≤ nums.length ≤ 10^5',
    signature: {
      functionName: 'firstMissingPositive',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'int',
    },
    referenceJs: `function firstMissingPositive(nums) {
    const set = new Set(nums);
    let x = 1;
    while (set.has(x)) x++;
    return x;
}
`,
    inputs: [[[1, 2, 0]], [[3, 4, -1, 1]], [[7, 8, 9, 11, 12]], [[1]], [[2, 1]]],
  },
  {
    key: 'nQueens',
    title: 'N-Queens II',
    difficulty: 'HARD',
    statementMd:
      'Đặt `n` quân hậu lên bàn cờ `n × n` sao cho không hai quân nào ăn được nhau (cùng hàng, cột hoặc đường chéo). Trả về số cách đặt khác nhau.',
    constraintsMd: '1 ≤ n ≤ 9',
    signature: {
      functionName: 'totalNQueens',
      params: [{ name: 'n', type: 'int' }],
      returnType: 'int',
    },
    referenceJs: `function totalNQueens(n) {
    let count = 0;
    const cols = new Set(), d1 = new Set(), d2 = new Set();
    const place = (r) => {
        if (r === n) return void count++;
        for (let c = 0; c < n; c++) {
            if (cols.has(c) || d1.has(r - c) || d2.has(r + c)) continue;
            cols.add(c);
            d1.add(r - c);
            d2.add(r + c);
            place(r + 1);
            cols.delete(c);
            d1.delete(r - c);
            d2.delete(r + c);
        }
    };
    place(0);
    return count;
}
`,
    inputs: [[4], [1], [2], [3], [8], [9]],
  },
  {
    key: 'candy',
    title: 'Candy',
    difficulty: 'HARD',
    statementMd:
      '`n` em nhỏ đứng thành hàng, `ratings[i]` là điểm của em thứ `i`. Mỗi em nhận ít nhất 1 kẹo, em có điểm cao hơn bạn đứng cạnh phải nhận nhiều kẹo hơn bạn đó. Trả về tổng số kẹo ít nhất.',
    constraintsMd: '1 ≤ n ≤ 2·10^4, 0 ≤ ratings[i] ≤ 2·10^4',
    signature: {
      functionName: 'candy',
      params: [{ name: 'ratings', type: 'int[]' }],
      returnType: 'int',
    },
    referenceJs: `function candy(ratings) {
    const c = ratings.map(() => 1);
    for (let i = 1; i < c.length; i++) if (ratings[i] > ratings[i - 1]) c[i] = c[i - 1] + 1;
    for (let i = c.length - 2; i >= 0; i--) if (ratings[i] > ratings[i + 1]) c[i] = Math.max(c[i], c[i + 1] + 1);
    return c.reduce((a, b) => a + b, 0);
}
`,
    inputs: [[[1, 0, 2]], [[1, 2, 2]], [[5]], [[1, 3, 2, 2, 1]], [[1, 2, 87, 87, 87, 2, 1]]],
  },
  {
    key: 'burstBalloons',
    title: 'Burst Balloons',
    difficulty: 'HARD',
    statementMd:
      'Có `n` quả bóng, quả `i` ghi số `nums[i]`. Bắn quả `i` được `nums[i - 1] · nums[i] · nums[i + 1]` xu (quả ngoài biên coi như số 1), sau đó hai quả hai bên trở thành kề nhau. Trả về số xu lớn nhất khi bắn hết bóng.',
    constraintsMd: '1 ≤ n ≤ 300, 0 ≤ nums[i] ≤ 100',
    signature: {
      functionName: 'maxCoins',
      params: [{ name: 'nums', type: 'int[]' }],
      returnType: 'int',
    },
    referenceJs: `function maxCoins(nums) {
    const a = [1, ...nums, 1], n = a.length;
    const dp = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let len = 2; len < n; len++)
        for (let l = 0; l + len < n; l++) {
            const r = l + len;
            for (let k = l + 1; k < r; k++) dp[l][r] = Math.max(dp[l][r], dp[l][k] + dp[k][r] + a[l] * a[k] * a[r]);
        }
    return dp[0][n - 1];
}
`,
    inputs: [[[3, 1, 5, 8]], [[1, 5]], [[7]], [[9, 76, 64, 21]], [[2, 3]]],
  },
  {
    key: 'regexMatching',
    title: 'Regular Expression Matching',
    difficulty: 'HARD',
    statementMd:
      'Cho chuỗi `s` và mẫu `p`, trong đó `.` khớp một ký tự bất kỳ và `*` khớp 0 hoặc nhiều lần ký tự đứng ngay trước nó. Trả về `true` nếu mẫu khớp **toàn bộ** chuỗi.',
    constraintsMd: '0 ≤ s.length ≤ 20, 1 ≤ p.length ≤ 20, mẫu luôn hợp lệ',
    signature: {
      functionName: 'isMatch',
      params: [
        { name: 's', type: 'string' },
        { name: 'p', type: 'string' },
      ],
      returnType: 'boolean',
    },
    referenceJs: `function isMatch(s, p) {
    const dp = Array.from({ length: s.length + 1 }, () => new Array(p.length + 1).fill(false));
    dp[s.length][p.length] = true;
    for (let i = s.length; i >= 0; i--)
        for (let j = p.length - 1; j >= 0; j--) {
            const first = i < s.length && (p[j] === s[i] || p[j] === '.');
            dp[i][j] = p[j + 1] === '*' ? dp[i][j + 2] || (first && dp[i + 1][j]) : first && dp[i + 1][j + 1];
        }
    return dp[0][0];
}
`,
    inputs: [
      ['aa', 'a'],
      ['aa', 'a*'],
      ['ab', '.*'],
      ['aab', 'c*a*b'],
      ['mississippi', 'mis*is*p*.'],
      ['', 'a*'],
    ],
  },
];
