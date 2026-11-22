import type { PracticeProblem } from '../types/academy.ts';

export const PRACTICE_PROBLEMS: PracticeProblem[] = [
  // ==================== PYTHON (1 - 10) ====================
  {
    id: 'py-1',
    number: 1,
    title: 'Sum of Even Numbers',
    language: 'python',
    difficulty: 'Beginner',
    xp: 100,
    category: 'Arrays & Loops',
    description:
      'Write a function `sum_evens(nums)` that returns the sum of all even integers in the list `nums`. Return `0` if none exist.',
    entryFunction: 'sum_evens',
    starterCode: `def sum_evens(nums):
    # Return the sum of all even integers in nums
    pass

print(sum_evens([1, 2, 3, 4, 6]))`,
    solutionCode: `def sum_evens(nums):
    total = 0
    for n in nums:
        if n % 2 == 0:
            total = total + n
    return total

print(sum_evens([1, 2, 3, 4, 6]))`,
    hints: [
      'Initialize a running total variable at 0.',
      'Use `n % 2 == 0` to check if an integer is even.',
    ],
    testCases: [
      { label: 'Mixed list [1,2,3,4,6]', inputExpr: 'sum_evens([1, 2, 3, 4, 6])', expectedOutput: '12' },
      { label: 'All odds [1,3,5]', inputExpr: 'sum_evens([1, 3, 5])', expectedOutput: '0' },
      { label: 'Negatives & zero [-4, 0, 5, 8]', inputExpr: 'sum_evens([-4, 0, 5, 8])', expectedOutput: '4' },
    ],
  },
  {
    id: 'py-2',
    number: 2,
    title: 'Palindrome Normalizer',
    language: 'python',
    difficulty: 'Beginner',
    xp: 100,
    category: 'Strings',
    description:
      'Write `is_palindrome(text)` returning `True` if `text` reads the same forward and backward after converting to lowercase and removing spaces.',
    entryFunction: 'is_palindrome',
    starterCode: `def is_palindrome(text):
    # Ignore spaces and letter casing
    pass

print(is_palindrome("Never Odd Or Even"))`,
    solutionCode: `def is_palindrome(text):
    cleaned = text.lower().replace(" ", "")
    return cleaned == cleaned[::-1]

print(is_palindrome("Never Odd Or Even"))`,
    hints: [
      'Normalize casing with `.lower()` and strip spaces using `.replace(" ", "")`.',
      'Compare the cleaned string against its reverse `cleaned[::-1]`.',
    ],
    testCases: [
      { label: 'Spaced phrase', inputExpr: 'is_palindrome("Never Odd Or Even")', expectedOutput: 'True' },
      { label: 'Single word', inputExpr: 'is_palindrome("Racecar")', expectedOutput: 'True' },
      { label: 'Non-palindrome', inputExpr: 'is_palindrome("LearnTech")', expectedOutput: 'False' },
    ],
  },
  {
    id: 'py-3',
    number: 3,
    title: 'Word Frequency Counter',
    language: 'python',
    difficulty: 'Beginner',
    xp: 100,
    category: 'Hash Maps',
    description:
      'Write `count_words(sentence)` that splits a sentence on whitespace, lowercases each word, and returns a dictionary mapping each word to its occurrence count.',
    entryFunction: 'count_words',
    starterCode: `def count_words(sentence):
    # Return a dict of lowercase word counts
    pass

print(count_words("Go fast go far"))`,
    solutionCode: `def count_words(sentence):
    counts = {}
    for word in sentence.lower().split():
        counts[word] = counts.get(word, 0) + 1
    return counts

print(count_words("Go fast go far"))`,
    hints: [
      'Use `sentence.lower().split()` to normalize words into a list.',
      'Use `counts.get(word, 0) + 1` to increment safely.',
    ],
    testCases: [
      { label: 'Repeated word', inputExpr: 'count_words("Go fast go far")', expectedOutput: '{"go":2,"fast":1,"far":1}' },
      { label: 'Empty string', inputExpr: 'count_words("")', expectedOutput: '{}' },
    ],
  },
  {
    id: 'py-4',
    number: 4,
    title: 'Two Sum Indices',
    language: 'python',
    difficulty: 'Intermediate',
    xp: 150,
    category: 'Hash Maps',
    description:
      'Given a list `nums` and integer `target`, write `two_sum(nums, target)` returning the two indices `[i, j]` whose values add up to `target` in O(n) time.',
    entryFunction: 'two_sum',
    starterCode: `def two_sum(nums, target):
    # Return [i, j] such that nums[i] + nums[j] == target
    pass

print(two_sum([2, 7, 11, 15], 9))`,
    solutionCode: `def two_sum(nums, target):
    seen = {}
    for idx, val in enumerate(nums):
        need = target - val
        if need in seen:
            return [seen[need], idx]
        seen[val] = idx
    return []

print(two_sum([2, 7, 11, 15], 9))`,
    hints: [
      'Track previously seen values mapped to their index in a dict.',
      'At each step, check whether `target - val` is already in `seen`.',
    ],
    testCases: [
      { label: '[2,7,11,15], 9', inputExpr: 'two_sum([2, 7, 11, 15], 9)', expectedOutput: '[0,1]' },
      { label: '[3,2,4], 6', inputExpr: 'two_sum([3, 2, 4], 6)', expectedOutput: '[1,2]' },
    ],
  },
  {
    id: 'py-5',
    number: 5,
    title: 'FizzBuzz Sequence Builder',
    language: 'python',
    difficulty: 'Beginner',
    xp: 100,
    category: 'Control Flow',
    description:
      'Write `fizzbuzz(n)` returning a list from `1` to `n` replacing multiples of 3 with `"Fizz"`, multiples of 5 with `"Buzz"`, and multiples of both with `"FizzBuzz"`.',
    entryFunction: 'fizzbuzz',
    starterCode: `def fizzbuzz(n):
    # Return list of strings/numbers from 1 to n
    pass

print(fizzbuzz(5))`,
    solutionCode: `def fizzbuzz(n):
    result = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            result.append("FizzBuzz")
        elif i % 3 == 0:
            result.append("Fizz")
        elif i % 5 == 0:
            result.append("Buzz")
        else:
            result.append(str(i))
    return result

print(fizzbuzz(5))`,
    hints: [
      'Check divisibility by 15 (both 3 and 5) before checking 3 or 5 individually.',
      'Convert integers with `str(i)` for consistent string list output.',
    ],
    testCases: [
      { label: 'n = 5', inputExpr: 'fizzbuzz(5)', expectedOutput: '["1","2","Fizz","4","Buzz"]' },
      { label: 'n = 15 tail', inputExpr: 'fizzbuzz(15)[14]', expectedOutput: 'FizzBuzz' },
    ],
  },
  {
    id: 'py-6',
    number: 6,
    title: 'Valid Parentheses Stack',
    language: 'python',
    difficulty: 'Intermediate',
    xp: 150,
    category: 'Stacks',
    description:
      'Write `is_valid_brackets(s)` returning `True` if every opening bracket `(`, `{`, `[` in string `s` is closed in the exact matching order.',
    entryFunction: 'is_valid_brackets',
    starterCode: `def is_valid_brackets(s):
    # Use a stack to verify matching brackets
    pass

print(is_valid_brackets("{[()]}"))`,
    solutionCode: `def is_valid_brackets(s):
    pairs = {")": "(", "}": "{", "]": "["}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return len(stack) == 0

print(is_valid_brackets("{[()]}"))`,
    hints: [
      'Push opening brackets onto a list acting as a stack.',
      'When encountering a closing bracket, pop from the stack and verify it matches the expected opener.',
    ],
    testCases: [
      { label: 'Nested valid', inputExpr: 'is_valid_brackets("{[()]}")', expectedOutput: 'True' },
      { label: 'Mismatched', inputExpr: 'is_valid_brackets("([)]")', expectedOutput: 'False' },
      { label: 'Unclosed', inputExpr: 'is_valid_brackets("((")', expectedOutput: 'False' },
    ],
  },
  {
    id: 'py-7',
    number: 7,
    title: 'Binary Search Index',
    language: 'python',
    difficulty: 'Intermediate',
    xp: 150,
    category: 'Searching',
    description:
      'Implement `binary_search(nums, target)` on a sorted list `nums`, returning the index of `target` or `-1` if absent in O(log n) time.',
    entryFunction: 'binary_search',
    starterCode: `def binary_search(nums, target):
    # Perform binary search without linear scanning
    pass

print(binary_search([1, 4, 7, 12, 19, 25], 19))`,
    solutionCode: `def binary_search(nums, target):
    left = 0
    right = len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

print(binary_search([1, 4, 7, 12, 19, 25], 19))`,
    hints: [
      'Maintain `left` and `right` inclusive bounds and compute `mid = (left + right) // 2`.',
      'Shift `left = mid + 1` or `right = mid - 1` cleanly to avoid infinite loops.',
    ],
    testCases: [
      { label: 'Target found', inputExpr: 'binary_search([1, 4, 7, 12, 19, 25], 19)', expectedOutput: '4' },
      { label: 'Target missing', inputExpr: 'binary_search([1, 4, 7, 12, 19, 25], 10)', expectedOutput: '-1' },
    ],
  },
  {
    id: 'py-8',
    number: 8,
    title: 'Merge Overlapping Intervals',
    language: 'python',
    difficulty: 'Advanced',
    xp: 200,
    category: 'Intervals',
    description:
      'Write `merge_intervals(intervals)` given pairs `[start, end]` and return a sorted list of merged non-overlapping intervals.',
    entryFunction: 'merge_intervals',
    starterCode: `def merge_intervals(intervals):
    # Sort by start and merge overlapping ranges
    pass

print(merge_intervals([[1, 3], [2, 6], [8, 10], [15, 18]]))`,
    solutionCode: `def merge_intervals(intervals):
    if not intervals:
        return []
    ordered = sorted(intervals)
    merged = [ordered[0][:]]
    for pair in ordered[1:]:
        last = merged[-1]
        if pair[0] <= last[1]:
            if pair[1] > last[1]:
                last[1] = pair[1]
        else:
            merged.append(pair[:])
    return merged

print(merge_intervals([[1, 3], [2, 6], [8, 10], [15, 18]]))`,
    hints: [
      'Sort intervals first so potentially overlapping spans are adjacent.',
      'If `current[0] <= last_merged[1]`, extend `last_merged[1]` to `max(last_merged[1], current[1])`.',
    ],
    testCases: [
      {
        label: 'Standard overlap',
        inputExpr: 'merge_intervals([[1, 3], [2, 6], [8, 10], [15, 18]])',
        expectedOutput: '[[1,6],[8,10],[15,18]]',
      },
      {
        label: 'Touching bounds',
        inputExpr: 'merge_intervals([[1, 4], [4, 5]])',
        expectedOutput: '[[1,5]]',
      },
    ],
  },
  {
    id: 'py-9',
    number: 9,
    title: 'Maximum Subarray (Kadane)',
    language: 'python',
    difficulty: 'Intermediate',
    xp: 150,
    category: 'Dynamic Programming',
    description:
      'Write `max_subarray(nums)` returning the largest sum of any contiguous non-empty subarray.',
    entryFunction: 'max_subarray',
    starterCode: `def max_subarray(nums):
    # Kadane's algorithm in O(n)
    pass

print(max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]))`,
    solutionCode: `def max_subarray(nums):
    current = nums[0]
    best = nums[0]
    for n in nums[1:]:
        current = max(n, current + n)
        best = max(best, current)
    return best

print(max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]))`,
    hints: [
      'At each element `n`, decide whether starting fresh at `n` beats extending `current + n`.',
      'Initialize both `current` and `best` to `nums[0]` so all-negative inputs work too.',
    ],
    testCases: [
      { label: 'Classic mixed', inputExpr: 'max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4])', expectedOutput: '6' },
      { label: 'All negative', inputExpr: 'max_subarray([-5, -2, -9])', expectedOutput: '-2' },
    ],
  },
  {
    id: 'py-10',
    number: 10,
    title: 'Run-Length String Compression',
    language: 'python',
    difficulty: 'Advanced',
    xp: 200,
    category: 'Strings',
    description:
      'Write `compress_rle(text)` encoding consecutive identical characters as `<char><count>` (e.g. `"aaabbc"` -> `"a3b2c1"`).',
    entryFunction: 'compress_rle',
    starterCode: `def compress_rle(text):
    # Encode runs of identical characters
    pass

print(compress_rle("aaabbbcc"))`,
    solutionCode: `def compress_rle(text):
    if not text:
        return ""
    parts = []
    count = 1
    for i in range(1, len(text)):
        if text[i] == text[i - 1]:
            count = count + 1
        else:
            parts.append(text[i - 1] + str(count))
            count = 1
    parts.append(text[-1] + str(count))
    return "".join(parts)

print(compress_rle("aaabbbcc"))`,
    hints: [
      'Track the current run length as you scan from index 1 to end.',
      'Do not forget to flush the final character run after the loop exits.',
    ],
    testCases: [
      { label: 'aaabbbcc', inputExpr: 'compress_rle("aaabbbcc")', expectedOutput: 'a3b3c2' },
      { label: 'Single chars abc', inputExpr: 'compress_rle("abc")', expectedOutput: 'a1b1c1' },
      { label: 'Empty', inputExpr: 'compress_rle("")', expectedOutput: '' },
    ],
  },

  // ==================== JAVASCRIPT (11 - 20) ====================
  {
    id: 'js-1',
    number: 11,
    title: 'Array Deduplication Preserving Order',
    language: 'javascript',
    difficulty: 'Beginner',
    xp: 100,
    category: 'Arrays',
    description:
      'Write `uniqueOrder(arr)` returning a new array with duplicate values removed while preserving first-seen order.',
    entryFunction: 'uniqueOrder',
    starterCode: `function uniqueOrder(arr) {
  // Return unique items preserving original order
}

console.log(uniqueOrder(["react", "ts", "react", "node", "ts"]));`,
    solutionCode: `function uniqueOrder(arr) {
  return [...new Set(arr)];
}

console.log(uniqueOrder(["react", "ts", "react", "node", "ts"]));`,
    hints: [
      'JavaScript `Set` preserves insertion order automatically.',
      'Spread `[...new Set(arr)]` back into a clean array.',
    ],
    testCases: [
      { label: 'Strings', inputExpr: 'uniqueOrder(["react", "ts", "react", "node", "ts"])', expectedOutput: '["react","ts","node"]' },
      { label: 'Numbers', inputExpr: 'uniqueOrder([4, 1, 4, 2, 1])', expectedOutput: '[4,1,2]' },
    ],
  },
  {
    id: 'js-2',
    number: 12,
    title: 'Deep Array Flatten',
    language: 'javascript',
    difficulty: 'Beginner',
    xp: 100,
    category: 'Recursion',
    description:
      'Write `flattenAll(nested)` recursively flattening an arbitrarily nested array into a single 1D array without calling `.flat(Infinity)`.',
    entryFunction: 'flattenAll',
    starterCode: `function flattenAll(nested) {
  // Recursively flatten nested arrays
}

console.log(flattenAll([1, [2, [3, 4]], 5]));`,
    solutionCode: `function flattenAll(nested) {
  const out = [];
  for (const item of nested) {
    if (Array.isArray(item)) {
      out.push(...flattenAll(item));
    } else {
      out.push(item);
    }
  }
  return out;
}

console.log(flattenAll([1, [2, [3, 4]], 5]));`,
    hints: [
      'Check `Array.isArray(item)` on every element.',
      'Recursively spread flattened subarrays into your accumulator.',
    ],
    testCases: [
      { label: '3 levels deep', inputExpr: 'flattenAll([1, [2, [3, 4]], 5])', expectedOutput: '[1,2,3,4,5]' },
      { label: 'Empty nested', inputExpr: 'flattenAll([[], [1], [[2]]])', expectedOutput: '[1,2]' },
    ],
  },
  {
    id: 'js-3',
    number: 13,
    title: 'Group Records by Key',
    language: 'javascript',
    difficulty: 'Beginner',
    xp: 100,
    category: 'Data Transform',
    description:
      'Write `groupByKey(items, key)` grouping an array of objects into a lookup object keyed by `item[key]`.',
    entryFunction: 'groupByKey',
    starterCode: `function groupByKey(items, key) {
  // Group objects by the property name in key
}

console.log(groupByKey([{ role: "dev", name: "Ada" }, { role: "ops", name: "Lin" }], "role"));`,
    solutionCode: `function groupByKey(items, key) {
  return items.reduce((acc, item) => {
    const group = String(item[key]);
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
}

console.log(groupByKey([{ role: "dev", name: "Ada" }, { role: "ops", name: "Lin" }], "role"));`,
    hints: [
      'Use `items.reduce` starting with an empty `{}` object.',
      'Initialize `acc[group] = []` if the bucket does not exist yet.',
    ],
    testCases: [
      {
        label: 'Group by role',
        inputExpr: 'groupByKey([{ role: "dev", name: "Ada" }, { role: "ops", name: "Lin" }, { role: "dev", name: "Sam" }], "role")',
        expectedOutput: '{"dev":[{"role":"dev","name":"Ada"},{"role":"dev","name":"Sam"}],"ops":[{"role":"ops","name":"Lin"}]}',
      },
    ],
  },
  {
    id: 'js-4',
    number: 14,
    title: 'Anagram Checker',
    language: 'javascript',
    difficulty: 'Beginner',
    xp: 100,
    category: 'Strings',
    description:
      'Write `areAnagrams(a, b)` returning `true` if strings `a` and `b` contain the exact same letters (ignoring case and spaces).',
    entryFunction: 'areAnagrams',
    starterCode: `function areAnagrams(a, b) {
  // Compare normalized character frequencies
}

console.log(areAnagrams("Listen", "Silent"));`,
    solutionCode: `function areAnagrams(a, b) {
  const norm = (s) => s.toLowerCase().replace(/\\s+/g, '').split('').sort().join('');
  return norm(a) === norm(b);
}

console.log(areAnagrams("Listen", "Silent"));`,
    hints: [
      'Normalize lowercase and strip whitespace before comparing.',
      'Sorting characters or counting character frequencies works cleanly.',
    ],
    testCases: [
      { label: 'Listen / Silent', inputExpr: 'areAnagrams("Listen", "Silent")', expectedOutput: 'true' },
      { label: 'Astronomer / Moon starer', inputExpr: 'areAnagrams("Astronomer", "Moon starer")', expectedOutput: 'true' },
      { label: 'Mismatch', inputExpr: 'areAnagrams("Code", "Node")', expectedOutput: 'false' },
    ],
  },
  {
    id: 'js-5',
    number: 15,
    title: 'Chunk Array into Batches',
    language: 'javascript',
    difficulty: 'Beginner',
    xp: 100,
    category: 'Arrays',
    description:
      'Write `chunkArray(arr, size)` splitting `arr` into subarrays of length at most `size`.',
    entryFunction: 'chunkArray',
    starterCode: `function chunkArray(arr, size) {
  // Split arr into batches of length size
}

console.log(chunkArray([1, 2, 3, 4, 5], 2));`,
    solutionCode: `function chunkArray(arr, size) {
  if (size <= 0) return [];
  const res = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

console.log(chunkArray([1, 2, 3, 4, 5], 2));`,
    hints: [
      'Step your loop index by `i += size`.',
      'Use `arr.slice(i, i + size)` to extract each batch.',
    ],
    testCases: [
      { label: '5 items, size 2', inputExpr: 'chunkArray([1, 2, 3, 4, 5], 2)', expectedOutput: '[[1,2],[3,4],[5]]' },
      { label: 'Exact fit', inputExpr: 'chunkArray(["a","b","c","d"], 2)', expectedOutput: '[["a","b"],["c","d"]]' },
    ],
  },
  {
    id: 'js-6',
    number: 16,
    title: 'Memoized Fibonacci Cache',
    language: 'javascript',
    difficulty: 'Intermediate',
    xp: 150,
    category: 'Dynamic Programming',
    description:
      'Write `fib(n)` returning the n-th Fibonacci number (`fib(0)=0, fib(1)=1`) efficiently for `n` up to `50` without exponential slowdown.',
    entryFunction: 'fib',
    starterCode: `function fib(n) {
  // Compute n-th Fibonacci in O(n) time
}

console.log(fib(10));`,
    solutionCode: `function fib(n) {
  if (n <= 1) return n;
  let prev = 0;
  let curr = 1;
  for (let i = 2; i <= n; i++) {
    const next = prev + curr;
    prev = curr;
    curr = next;
  }
  return curr;
}

console.log(fib(10));`,
    hints: [
      'Naive recursion takes O(2^n) time; iterate bottom-up with two rolling variables.',
      'Handle base cases `n <= 1` first.',
    ],
    testCases: [
      { label: 'fib(10)', inputExpr: 'fib(10)', expectedOutput: '55' },
      { label: 'fib(35)', inputExpr: 'fib(35)', expectedOutput: '9227465' },
      { label: 'fib(0)', inputExpr: 'fib(0)', expectedOutput: '0' },
    ],
  },
  {
    id: 'js-7',
    number: 17,
    title: 'URL Query String Parser',
    language: 'javascript',
    difficulty: 'Intermediate',
    xp: 150,
    category: 'Parsing',
    description:
      'Write `parseQuery(qs)` converting a query string like `"?track=ai&level=pro"` into a plain object `{ track: "ai", level: "pro" }`.',
    entryFunction: 'parseQuery',
    starterCode: `function parseQuery(qs) {
  // Parse key=value pairs safely
}

console.log(parseQuery("?track=ai&level=pro"));`,
    solutionCode: `function parseQuery(qs) {
  const clean = qs.startsWith('?') ? qs.slice(1) : qs;
  if (!clean) return {};
  const result = {};
  for (const part of clean.split('&')) {
    if (!part) continue;
    const eq = part.indexOf('=');
    const key = eq === -1 ? part : part.slice(0, eq);
    const val = eq === -1 ? '' : part.slice(eq + 1);
    result[decodeURIComponent(key)] = decodeURIComponent(val);
  }
  return result;
}

console.log(parseQuery("?track=ai&level=pro"));`,
    hints: [
      'Strip a leading `?` if present and handle empty query strings cleanly.',
      'Decode keys and values using `decodeURIComponent`.',
    ],
    testCases: [
      { label: 'Standard query', inputExpr: 'parseQuery("?track=ai&level=pro")', expectedOutput: '{"track":"ai","level":"pro"}' },
      { label: 'Empty query', inputExpr: 'parseQuery("")', expectedOutput: '{}' },
    ],
  },
  {
    id: 'js-8',
    number: 18,
    title: 'Function Memoizer Higher-Order Utility',
    language: 'javascript',
    difficulty: 'Intermediate',
    xp: 150,
    category: 'Closures',
    description:
      'Write `memoize(fn)` returning a cached wrapper that stores results keyed by serialized arguments (`JSON.stringify(args)`).',
    entryFunction: 'memoize',
    starterCode: `function memoize(fn) {
  // Return a memoized function caching results by arguments
}

let calls = 0;
const square = memoize((x) => { calls++; return x * x; });
console.log(square(5), square(5), calls);`,
    solutionCode: `function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const value = fn(...args);
    cache.set(key, value);
    return value;
  };
}

let calls = 0;
const square = memoize((x) => { calls++; return x * x; });
console.log(square(5), square(5), calls);`,
    hints: [
      'Create a `Map` inside `memoize` closure so each wrapped function keeps its own cache.',
      'Remember `cache.has(key)` works accurately even if `fn` returns `0` or `false`!',
    ],
    testCases: [
      {
        label: 'Caches repeated invocation',
        inputExpr: '(() => { let c = 0; const m = memoize((a, b) => { c++; return a + b; }); return [m(2,3), m(2,3), c]; })()',
        expectedOutput: '[5,5,1]',
      },
    ],
  },
  {
    id: 'js-9',
    number: 19,
    title: 'LRU Cache Class',
    language: 'javascript',
    difficulty: 'Advanced',
    xp: 200,
    category: 'Data Structures',
    description:
      'Implement `class LRUCache` with `constructor(capacity)`, `get(key)` (returns `-1` if missing), and `put(key, val)` evicting the least-recently-used key when full.',
    entryFunction: 'LRUCache',
    starterCode: `class LRUCache {
  constructor(capacity) {
    // Initialize capacity and ordered storage
  }
  get(key) {}
  put(key, value) {}
}

const lru = new LRUCache(2);
lru.put(1, 10);
lru.put(2, 20);
lru.get(1);
lru.put(3, 30);
console.log(lru.get(2), lru.get(1));`,
    solutionCode: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }
  get(key) {
    if (!this.map.has(key)) return -1;
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }
  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
  }
}

const lru = new LRUCache(2);
lru.put(1, 10);
lru.put(2, 20);
lru.get(1);
lru.put(3, 30);
console.log(lru.get(2), lru.get(1));`,
    hints: [
      'JavaScript `Map` maintains insertion order in O(1), and `map.keys().next().value` gives the oldest key.',
      'Delete and re-insert on `get` to refresh recency.',
    ],
    testCases: [
      {
        label: 'Evicts LRU key 2',
        inputExpr: '(() => { const c = new LRUCache(2); c.put(1,10); c.put(2,20); c.get(1); c.put(3,30); return [c.get(2), c.get(1), c.get(3)]; })()',
        expectedOutput: '[-1,10,30]',
      },
    ],
  },
  {
    id: 'js-10',
    number: 20,
    title: 'Longest Substring Without Repeating Characters',
    language: 'javascript',
    difficulty: 'Advanced',
    xp: 200,
    category: 'Sliding Window',
    description:
      'Write `lengthOfLongestUnique(s)` returning the length of the longest substring with all unique characters in O(n) time.',
    entryFunction: 'lengthOfLongestUnique',
    starterCode: `function lengthOfLongestUnique(s) {
  // Sliding window with last-seen character map
}

console.log(lengthOfLongestUnique("abcabcbb"));`,
    solutionCode: `function lengthOfLongestUnique(s) {
  const lastSeen = new Map();
  let left = 0;
  let maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (lastSeen.has(ch) && lastSeen.get(ch) >= left) {
      left = lastSeen.get(ch) + 1;
    }
    lastSeen.set(ch, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}

console.log(lengthOfLongestUnique("abcabcbb"));`,
    hints: [
      'Maintain a sliding window `[left, right]` and store the latest index of each character.',
      'Only move `left` forward if the previous occurrence falls inside the active window (`>= left`).',
    ],
    testCases: [
      { label: 'abcabcbb', inputExpr: 'lengthOfLongestUnique("abcabcbb")', expectedOutput: '3' },
      { label: 'pwwkew', inputExpr: 'lengthOfLongestUnique("pwwkew")', expectedOutput: '3' },
      { label: 'bbbbb', inputExpr: 'lengthOfLongestUnique("bbbbb")', expectedOutput: '1' },
    ],
  },

  // ==================== HTML / CSS (21 - 30) ====================
  {
    id: 'html-1',
    number: 21,
    title: 'Semantic Hero Section Card',
    language: 'html',
    difficulty: 'Beginner',
    xp: 100,
    category: 'Semantic HTML',
    description:
      'Build a responsive dark hero banner inside `<section class="hero">` containing an `<h1>`, a `<p>` summary, and an `<a class="cta">` button.',
    starterCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; padding: 24px; }
  /* Style your .hero and .cta below */
</style>
<section class="hero">
  <h1>Build Production Software</h1>
  <p>Master engineering with interactive code sandboxes.</p>
</section>`,
    solutionCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; padding: 24px; }
  .hero {
    max-width: 640px;
    padding: 32px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(37,99,235,0.2), rgba(6,182,212,0.12));
    border: 1px solid rgba(148,163,184,0.2);
  }
  .cta {
    display: inline-block;
    margin-top: 16px;
    padding: 10px 20px;
    border-radius: 10px;
    background: linear-gradient(135deg, #2563eb, #06b6d4);
    color: #fff;
    text-decoration: none;
    font-weight: 600;
  }
</style>
<section class="hero">
  <h1>Build Production Software</h1>
  <p>Master engineering with interactive code sandboxes.</p>
  <a href="#courses" class="cta">Explore Courses</a>
</section>`,
    hints: [
      'Make sure `<section class="hero">` wraps `<h1>`, `<p>`, and `<a class="cta">`.',
      'Give `.cta` clean padding (`10px 20px`) and `display: inline-block`.',
    ],
    testCases: [],
    domChecks: [
      { selector: 'section.hero h1', description: 'Section .hero contains an <h1> heading' },
      { selector: 'section.hero p', description: 'Section .hero contains a <p> description' },
      { selector: 'section.hero a.cta', description: 'Section .hero contains an <a class="cta"> link' },
    ],
  },
  {
    id: 'html-2',
    number: 22,
    title: 'Flexbox 3-Zone Navigation Bar',
    language: 'html',
    difficulty: 'Beginner',
    xp: 100,
    category: 'Flexbox',
    description:
      'Create a `<header class="navbar">` using Flexbox with a brand `<span>`, a `<nav>` containing 3 links, and a `<button class="action">`.',
    starterCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; margin: 0; }
  .navbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.1); }
</style>
<header class="navbar">
  <span class="brand">LearnTech</span>
  <!-- Add <nav> with 3 links and a <button class="action"> -->
</header>`,
    solutionCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; margin: 0; }
  .navbar { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.1); }
  nav { display: flex; gap: 20px; }
  nav a { color: #cbd5e1; text-decoration: none; font-size: 14px; }
  .action { padding: 8px 16px; border-radius: 8px; border: 0; background: #2563eb; color: #fff; font-weight: 600; cursor: pointer; }
</style>
<header class="navbar">
  <span class="brand">LearnTech</span>
  <nav>
    <a href="#courses">Courses</a>
    <a href="#practice">Practice</a>
    <a href="#pricing">Pricing</a>
  </nav>
  <button class="action" type="button">Sign In</button>
</header>`,
    hints: [
      'Nest 3 `<a>` links inside `<nav>`.',
      'Include a `<button class="action">` as the third zone.',
    ],
    testCases: [],
    domChecks: [
      { selector: 'header.navbar .brand', description: 'Brand element present inside navbar' },
      { selector: 'header.navbar nav a', description: 'At least 3 navigation links inside <nav>', minCount: 3 },
      { selector: 'header.navbar button.action', description: 'Primary action button present' },
    ],
  },
  {
    id: 'html-3',
    number: 23,
    title: 'CSS Grid 3-Column Feature Layout',
    language: 'html',
    difficulty: 'Beginner',
    xp: 100,
    category: 'CSS Grid',
    description:
      'Render `<div class="feature-grid">` using CSS Grid (`grid-template-columns: repeat(3, 1fr)`) with 3 `<article class="card">` items.',
    starterCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; padding: 24px; }
  .feature-grid { display: grid; gap: 16px; }
</style>
<div class="feature-grid">
  <article class="card"><h3>Interactive Labs</h3><p>Run code live.</p></article>
</div>`,
    solutionCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; padding: 24px; }
  .feature-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
  .card { padding: 20px; border-radius: 14px; background: rgba(15,23,42,0.7); border: 1px solid rgba(148,163,184,0.16); }
  .card h3 { margin: 0 0 8px; font-size: 16px; }
  .card p { margin: 0; color: #94a3b8; font-size: 14px; }
</style>
<div class="feature-grid">
  <article class="card"><h3>Interactive Labs</h3><p>Run code live in browser.</p></article>
  <article class="card"><h3>Structured Tracks</h3><p>8 engineering domains.</p></article>
  <article class="card"><h3>AI Mentor</h3><p>Guided debugging anytime.</p></article>
</div>`,
    hints: [
      'Add `grid-template-columns: repeat(3, minmax(0, 1fr))` on `.feature-grid`.',
      'Include 3 `<article class="card">` elements inside `.feature-grid`.',
    ],
    testCases: [],
    domChecks: [
      { selector: '.feature-grid article.card', description: 'Contains 3 .card articles', minCount: 3 },
      { selector: '.feature-grid article.card h3', description: 'Each card has an <h3> heading', minCount: 3 },
    ],
  },
  {
    id: 'html-4',
    number: 24,
    title: 'Accessible Sign-Up Form',
    language: 'html',
    difficulty: 'Beginner',
    xp: 100,
    category: 'Accessibility',
    description:
      'Build an accessible `<form class="signup-form">` with `<label>` + `<input>` pairs for Name, Email (`type="email"`), and Password (`type="password"`), plus a submit `<button>`.',
    starterCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; padding: 24px; }
</style>
<form class="signup-form">
  <!-- Add accessible labels and inputs -->
</form>`,
    solutionCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; padding: 24px; }
  .signup-form { max-width: 360px; display: flex; flex-direction: column; gap: 12px; padding: 24px; border-radius: 16px; background: #0f172a; border: 1px solid rgba(148,163,184,0.18); }
  label { font-size: 13px; color: #cbd5e1; display: block; margin-bottom: 4px; }
  input { width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(148,163,184,0.25); background: #020617; color: #fff; }
  button { padding: 10px 16px; border-radius: 8px; border: 0; background: #3b82f6; color: #fff; font-weight: 600; cursor: pointer; }
</style>
<form class="signup-form">
  <div><label for="name">Full Name</label><input id="name" type="text" required /></div>
  <div><label for="email">Email</label><input id="email" type="email" required /></div>
  <div><label for="pw">Password</label><input id="pw" type="password" required /></div>
  <button type="submit">Create Account</button>
</form>`,
    hints: [
      'Connect each `<label for="...">` to its `<input id="...">`.',
      'Include `type="email"`, `type="password"`, and `<button type="submit">`.',
    ],
    testCases: [],
    domChecks: [
      { selector: 'form.signup-form label', description: 'At least 3 <label> tags', minCount: 3 },
      { selector: 'form.signup-form input[type="email"]', description: 'Email input present' },
      { selector: 'form.signup-form input[type="password"]', description: 'Password input present' },
      { selector: 'form.signup-form button[type="submit"]', description: 'Submit button present' },
    ],
  },
  {
    id: 'html-5',
    number: 25,
    title: 'Glassmorphism Pricing Card',
    language: 'html',
    difficulty: 'Intermediate',
    xp: 150,
    category: 'Visual Design',
    description:
      'Create a `<div class="pricing-card">` with plan title `<h2>`, numeric price `<p class="price">`, a `<ul>` with at least 3 `<li>` benefits, and a `<button>` CTA.',
    starterCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; padding: 24px; }
</style>
<div class="pricing-card">
  <h2>Pro Track</h2>
</div>`,
    solutionCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; padding: 24px; }
  .pricing-card { max-width: 320px; padding: 28px; border-radius: 18px; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(16px); border: 1px solid rgba(56, 189, 248, 0.25); }
  .price { font-size: 36px; font-weight: 700; margin: 12px 0; font-variant-numeric: tabular-nums; }
  ul { padding-left: 18px; color: #cbd5e1; line-height: 1.8; }
  button { width: 100%; margin-top: 16px; padding: 10px 16px; border-radius: 10px; border: 0; background: linear-gradient(135deg, #2563eb, #06b6d4); color: #fff; font-weight: 600; }
</style>
<div class="pricing-card">
  <h2>Pro Track</h2>
  <p class="price">$29/mo</p>
  <ul>
    <li>All 8 Engineering Tracks</li>
    <li>30 Interactive Code Labs</li>
    <li>Unlimited AI Mentor Help</li>
  </ul>
  <button type="button">Start Pro</button>
</div>`,
    hints: [
      'Use `backdrop-filter: blur(16px)` and translucent rgba background for glassmorphism.',
      'Ensure `.pricing-card` contains `h2`, `p.price`, `ul li` (x3), and `button`.',
    ],
    testCases: [],
    domChecks: [
      { selector: '.pricing-card h2', description: 'Plan heading <h2> present' },
      { selector: '.pricing-card .price', description: 'Price element .price present' },
      { selector: '.pricing-card ul li', description: 'At least 3 benefit list items', minCount: 3 },
      { selector: '.pricing-card button', description: 'Action button present' },
    ],
  },
  {
    id: 'html-6',
    number: 26,
    title: 'Data Table with Tabular Numerals',
    language: 'html',
    difficulty: 'Intermediate',
    xp: 150,
    category: 'Tables',
    description:
      'Build an accessible `<table>` with `<thead>` column headers (`Course`, `Lessons`, `XP`) and `<tbody>` containing at least 3 rows (`<tr>`).',
    starterCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; padding: 24px; }
</style>
<table>
  <!-- Add thead and tbody with 3 rows -->
</table>`,
    solutionCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; padding: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { padding: 12px 16px; border-bottom: 1px solid rgba(148,163,184,0.15); text-align: left; }
  th.num, td.num { text-align: right; font-variant-numeric: tabular-nums; }
  th { color: #94a3b8; font-weight: 600; }
</style>
<table>
  <thead>
    <tr><th>Course</th><th class="num">Lessons</th><th class="num">XP</th></tr>
  </thead>
  <tbody>
    <tr><td>AI Engineering</td><td class="num">12</td><td class="num">600</td></tr>
    <tr><td>Backend Systems</td><td class="num">11</td><td class="num">550</td></tr>
    <tr><td>Cyber Security</td><td class="num">11</td><td class="num">550</td></tr>
  </tbody>
</table>`,
    hints: [
      'Use `<thead>` with `<th>` headers and `<tbody>` with `<td>` cells.',
      'Apply `font-variant-numeric: tabular-nums` and right alignment on numeric columns.',
    ],
    testCases: [],
    domChecks: [
      { selector: 'table thead th', description: 'At least 3 header cells in <thead>', minCount: 3 },
      { selector: 'table tbody tr', description: 'At least 3 data rows in <tbody>', minCount: 3 },
    ],
  },
  {
    id: 'html-7',
    number: 27,
    title: 'Interactive CSS Accordion Component',
    language: 'html',
    difficulty: 'Intermediate',
    xp: 150,
    category: 'Interactive HTML',
    description:
      'Use native semantic `<details>` and `<summary>` elements inside `<div class="faq">` to create 2 zero-JS expandable curriculum modules.',
    starterCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; padding: 24px; }
</style>
<div class="faq">
  <!-- Add 2 <details> with <summary> and <p> -->
</div>`,
    solutionCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; padding: 24px; }
  .faq { display: flex; flex-direction: column; gap: 10px; max-width: 520px; }
  details { padding: 14px 18px; border-radius: 12px; background: #0f172a; border: 1px solid rgba(148,163,184,0.18); }
  summary { font-weight: 600; cursor: pointer; }
  details p { margin: 10px 0 0; color: #94a3b8; font-size: 14px; }
</style>
<div class="faq">
  <details open>
    <summary>Module 1: Foundations</summary>
    <p>Covers threading, type safety, and core architecture.</p>
  </details>
  <details>
    <summary>Module 2: Production Systems</summary>
    <p>Covers caching, observability, and security testing.</p>
  </details>
</div>`,
    hints: [
      'Native `<details>` + `<summary>` gives keyboard-accessible toggling without JavaScript.',
      'Include at least 2 `<details>` items inside `.faq`.',
    ],
    testCases: [],
    domChecks: [
      { selector: '.faq details', description: 'At least 2 <details> elements', minCount: 2 },
      { selector: '.faq details summary', description: 'Each <details> has a <summary>', minCount: 2 },
    ],
  },
  {
    id: 'html-8',
    number: 28,
    title: 'CSS Progress Bar Indicator',
    language: 'html',
    difficulty: 'Intermediate',
    xp: 150,
    category: 'Components',
    description:
      'Build a course progress widget `.progress-wrap` containing a label, percentage text, and `.progress-track > .progress-fill` styled with an electric gradient.',
    starterCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; padding: 24px; }
</style>
<div class="progress-wrap">
  <!-- Add label, .progress-track, and .progress-fill -->
</div>`,
    solutionCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; padding: 24px; }
  .progress-wrap { max-width: 420px; padding: 20px; border-radius: 14px; background: #0f172a; border: 1px solid rgba(148,163,184,0.16); }
  .row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 10px; }
  .progress-track { height: 10px; border-radius: 999px; background: rgba(148,163,184,0.18); overflow: hidden; }
  .progress-fill { height: 100%; width: 72%; border-radius: 999px; background: linear-gradient(90deg, #2563eb, #06b6d4); }
</style>
<div class="progress-wrap">
  <div class="row"><span>AI Engineering</span><span>72%</span></div>
  <div class="progress-track"><div class="progress-fill"></div></div>
</div>`,
    hints: [
      'Give `.progress-track` `overflow: hidden` and rounded ends.',
      'Nest `.progress-fill` inside `.progress-track` with percentage width.',
    ],
    testCases: [],
    domChecks: [
      { selector: '.progress-wrap .progress-track .progress-fill', description: 'Nested .progress-fill inside .progress-track' },
    ],
  },
  {
    id: 'html-9',
    number: 29,
    title: 'Keyframes Gradient Shimmer Button',
    language: 'html',
    difficulty: 'Advanced',
    xp: 200,
    category: 'CSS Animation',
    description:
      'Create a `<button class="glow-btn">` with smooth hover transform (`translateY(-2px)`), focus-visible outline ring, and `@keyframes` gradient shift.',
    starterCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; padding: 40px; }
</style>
<button class="glow-btn" type="button">Launch Sandbox</button>`,
    solutionCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; padding: 40px; }
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .glow-btn {
    padding: 12px 24px;
    border: 0;
    border-radius: 12px;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    background: linear-gradient(120deg, #2563eb, #7c3aed, #06b6d4);
    background-size: 200% 200%;
    animation: gradientShift 5s ease infinite;
    transition: transform 180ms ease;
  }
  .glow-btn:hover { transform: translateY(-2px); }
  .glow-btn:focus-visible { outline: 2px solid #22d3ee; outline-offset: 3px; }
</style>
<button class="glow-btn" type="button">Launch Sandbox</button>`,
    hints: [
      'Animate `background-position` on a `200% 200%` gradient.',
      'Include `:focus-visible` outline for keyboard accessibility.',
    ],
    testCases: [],
    domChecks: [
      { selector: 'button.glow-btn', description: 'Button .glow-btn exists' },
    ],
  },
  {
    id: 'html-10',
    number: 30,
    title: 'Responsive Dashboard Bento Layout',
    language: 'html',
    difficulty: 'Advanced',
    xp: 200,
    category: 'CSS Grid',
    description:
      'Construct `<main class="dashboard">` with a `<aside class="sidebar">` and `<section class="metrics">` containing 4 `.kpi` stat blocks.',
    starterCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
</style>
<main class="dashboard">
  <!-- Add sidebar and metrics with 4 .kpi blocks -->
</main>`,
    solutionCode: `<style>
  body { background: #05070b; color: #f8fafc; font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
  .dashboard { display: grid; grid-template-columns: 200px 1fr; gap: 16px; }
  .sidebar { padding: 16px; border-radius: 14px; background: #0f172a; border: 1px solid rgba(148,163,184,0.16); }
  .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .kpi { padding: 16px; border-radius: 14px; background: #0f172a; border: 1px solid rgba(148,163,184,0.16); font-variant-numeric: tabular-nums; }
  .kpi strong { display: block; font-size: 24px; margin-top: 6px; }
</style>
<main class="dashboard">
  <aside class="sidebar">LearnTech Menu</aside>
  <section class="metrics">
    <div class="kpi"><span>Enrolled</span><strong>4</strong></div>
    <div class="kpi"><span>Completed</span><strong>28</strong></div>
    <div class="kpi"><span>Total XP</span><strong>2,450</strong></div>
    <div class="kpi"><span>Streak</span><strong>9d</strong></div>
  </section>
</main>`,
    hints: [
      'Use CSS Grid `grid-template-columns: 200px 1fr` on `.dashboard`.',
      'Nest 4 `.kpi` elements inside `section.metrics`.',
    ],
    testCases: [],
    domChecks: [
      { selector: 'main.dashboard aside.sidebar', description: 'Sidebar present inside dashboard' },
      { selector: 'main.dashboard section.metrics .kpi', description: '4 KPI blocks inside metrics section', minCount: 4 },
    ],
  },
];
