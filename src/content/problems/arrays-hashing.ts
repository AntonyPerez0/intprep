import { py, type CategoryContent } from '../types';

const content: CategoryContent = {
  guide: {
    category: 'arrays-hashing',
    summary: `An **array** is a row of boxes you can jump to by position: \`nums[5]\` is instant. But *finding* a value means checking box after box — that is O(n).

A **hash map** (\`dict\` in Python) and a **hash set** (\`set\`) fix that. They answer "have I seen this?" or "what is stored under this key?" in **O(1)** on average.

The whole pattern is one trade: **spend O(n) extra memory to turn repeated O(n) searches into O(1) lookups.** That usually turns an O(n²) brute force into O(n).`,
    analogy:
      'A hash map is a coat check. Instead of searching every hanger for your coat, you hand over a ticket number and get your coat back instantly.',
    whenToUse: [
      'You need to know "have I seen this value before?" → **set**',
      'You need to count how many times things appear → **dict / Counter**',
      'You are looking for a pair that adds up to something → store each value, look up its **complement**',
      'You need to group items that share a property (same letters, same remainder…) → dict of **key → list**',
      'The brute force has a nested loop where the inner loop is just *searching* → replace the inner loop with a lookup',
    ],
    template: py`
def solve(nums):
    seen = {}                  # value -> whatever you need (index, count, ...)
    for i, x in enumerate(nums):
        need = some_key(x)      # what would complete / match x?
        if need in seen:        # O(1) lookup instead of an inner loop
            return answer(seen[need], i)
        seen[x] = i             # remember x for later elements
    return default`,
    templateNotes: [
      '`in` on a `set` or `dict` is O(1) on average; `in` on a `list` is O(n). This one fact is the whole pattern.',
      'Check *before* you insert when an element must not pair with itself (Two Sum).',
      '`collections.Counter(s)` builds a frequency map in one line; `defaultdict(list)` makes grouping painless.',
      'A key must be hashable: use a `tuple`, not a `list`, when the key has several parts.',
    ],
    complexity: 'Usually O(n) time and O(n) extra space.',
    quiz: [
      {
        q: 'What is the average time to check `x in s` when `s` is a Python **set**?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        answer: 0,
        explain: 'Sets and dicts are hash tables: the hash of `x` points straight at its bucket.',
      },
      {
        q: 'Your brute force is two nested loops, and the inner loop only *searches* for a matching value. What is the usual upgrade?',
        options: [
          'Sort the array first',
          'Store values in a hash map and look the match up in O(1)',
          'Use recursion',
          'Use a stack',
        ],
        answer: 1,
        explain: 'Replacing the inner search with a hash lookup turns O(n²) into O(n).',
      },
      {
        q: 'Which of these can be used as a dictionary key in Python?',
        options: ['[1, 2, 3]', '{1, 2}', '(1, 2, 3)', '{"a": 1}'],
        answer: 2,
        explain: 'Keys must be hashable (immutable). Tuples are; lists, sets and dicts are not.',
      },
    ],
  },

  problems: [
    {
      id: 'contains-duplicate',
      num: 217,
      title: 'Contains Duplicate',
      difficulty: 'Easy',
      category: 'arrays-hashing',
      pattern: 'Hash set membership',
      prompt:
        'You get a list of integers. Return `True` if any value shows up **at least twice**, and `False` if every value is unique.',
      examples: [
        { input: 'nums = [4, 7, 1, 7]', output: 'True', note: '7 appears twice.' },
        { input: 'nums = [3, 9, 2]', output: 'False' },
      ],
      signals: ['"appears at least twice"', 'only need yes/no about repeats', 'order does not matter'],
      hints: [
        'As you walk the list, what do you need to remember about the numbers you have already passed?',
        'Which data structure answers "have I seen this before?" in O(1)?',
        'Keep a set. If the current number is already in it, you found a duplicate.',
      ],
      brute:
        'Compare every pair `(i, j)` with two nested loops — **O(n²)** time. Sorting first and checking neighbors is **O(n log n)**: better, but we can do linear.',
      insight:
        'Remember every number you have seen in a **set**. The first time a number is already in the set, it is a duplicate.',
      mnemonic: 'Seen it before? Duplicate. Otherwise, remember it.',
      steps: [
        'Create an empty set called seen.',
        'Loop over each number in nums.',
        'If the number is already in seen, return True.',
        'Otherwise add the number to seen.',
        'If the loop finishes, return False.',
      ],
      solution: py`
class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        #@ A set remembers every number we have walked past, with O(1) lookups.
        seen = set()
        #@ Visit each number once.
        for n in nums:
            #@ Already in the set? Then this number appeared before — a duplicate.
            if n in seen:  #!
                return True
            #@ First time seeing it: remember it for later numbers.
            seen.add(n)  #!
        #@ We checked everything without a repeat, so all values are unique.
        return False`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy: 'One pass over n numbers with O(1) set operations; the set may hold all n numbers.',
      pitfalls: [
        'Using a list instead of a set makes `n in seen` O(n) and the whole thing O(n²).',
        'One-liner alternative: `return len(set(nums)) != len(nums)` — fine, but it cannot stop early.',
      ],
    },
    {
      id: 'valid-anagram',
      num: 242,
      title: 'Valid Anagram',
      difficulty: 'Easy',
      category: 'arrays-hashing',
      pattern: 'Character frequency count',
      prompt:
        'Given two strings `s` and `t`, return `True` if `t` uses **exactly the same letters, the same number of times**, as `s` (just rearranged). Otherwise return `False`.',
      examples: [
        { input: 's = "listen", t = "silent"', output: 'True' },
        { input: 's = "rat", t = "car"', output: 'False', note: '"t" is not in "car" and "c" is not in "rat".' },
      ],
      signals: ['"rearrange the letters"', 'same characters, same counts', 'order does not matter'],
      hints: [
        'If two words are anagrams, what must be true about how many times each letter appears?',
        'Count letters in both strings and compare the counts.',
        'A dict (or Counter) mapping letter → count does the counting in one pass.',
      ],
      brute:
        'Sort both strings and compare: `sorted(s) == sorted(t)`. It works and is short, but costs **O(n log n)**.',
      insight:
        'Two strings are anagrams exactly when their **letter counts match**. Count with a hash map in O(n).',
      mnemonic: 'Same letters, same counts — count them and compare.',
      steps: [
        'If the lengths differ, return False.',
        'Count each character of s in a dict.',
        'Count each character of t in another dict.',
        'Return whether the two dicts are equal.',
      ],
      solution: py`
class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        #@ Different lengths can never be anagrams — a cheap early exit.
        if len(s) != len(t):
            return False
        #@ Count how many times each character appears in each string.
        count_s, count_t = {}, {}
        for i in range(len(s)):
            count_s[s[i]] = count_s.get(s[i], 0) + 1  #!
            count_t[t[i]] = count_t.get(t[i], 0) + 1
        #@ Anagrams have identical counts for every character.
        return count_s == count_t  #!`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy:
        'One pass over the strings. The dicts hold at most 26 lowercase letters, so their size is constant.',
      pitfalls: [
        'Forgetting the length check — it is a free early exit.',
        '`dict.get(key, 0)` avoids a KeyError the first time you see a letter.',
        'Shortcut in real code: `return Counter(s) == Counter(t)`.',
      ],
    },
    {
      id: 'two-sum',
      num: 1,
      title: 'Two Sum',
      difficulty: 'Easy',
      category: 'arrays-hashing',
      pattern: 'Hash map complement lookup',
      prompt:
        'Given a list `nums` and a number `target`, return the **indices** of the two different elements that add up to `target`. Exactly one such pair exists.',
      examples: [
        { input: 'nums = [3, 8, 11, 4], target = 7', output: '[0, 3]', note: 'nums[0] + nums[3] = 3 + 4 = 7.' },
        { input: 'nums = [5, 5], target = 10', output: '[0, 1]' },
      ],
      signals: ['"two numbers that add up to target"', 'return indices (so do not sort)', 'exactly one answer'],
      hints: [
        'For a number x, which *other* number would complete the pair?',
        'The partner of x is target - x. How can you check if you have already seen it, instantly?',
        'Store value → index in a dict as you go, and look up target - x before inserting x.',
      ],
      brute:
        'Try every pair with two nested loops and check if they sum to `target` — **O(n²)** time.',
      insight:
        'For each number `x`, the partner you need is `target - x`. Keep a dict of **value → index** for numbers already seen, so finding the partner is O(1).',
      mnemonic: 'Need = target − x. Seen the need? Done. Else store x.',
      steps: [
        'Create an empty dict mapping value to index.',
        'Loop over the list with both index i and value x.',
        'Compute the partner: need = target - x.',
        'If need is in the dict, return [dict[need], i].',
        'Otherwise store x → i in the dict.',
      ],
      solution: py`
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        #@ Remember each value we have seen and the index where we saw it.
        seen = {}
        #@ Walk the list once, keeping both the index and the value.
        for i, x in enumerate(nums):
            #@ The partner that would complete the pair.
            need = target - x  #!
            #@ Seen the partner earlier? Its index plus ours is the answer.
            if need in seen:  #!
                return [seen[need], i]
            #@ Store x AFTER checking, so x never pairs with itself.
            seen[x] = i  #!`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy: 'Each element is visited once with an O(1) dict lookup; the dict can hold up to n entries.',
      pitfalls: [
        'Inserting `x` before checking can pair an element with itself (e.g. target = 6, x = 3).',
        'Sorting destroys the original indices — that is why we use a hash map here, not two pointers.',
        'Return indices, not values.',
      ],
    },
    {
      id: 'group-anagrams',
      num: 49,
      title: 'Group Anagrams',
      difficulty: 'Medium',
      category: 'arrays-hashing',
      pattern: 'Hash map keyed by letter counts',
      prompt:
        'You get a list of lowercase words. Put words that are **anagrams of each other** (same letters, same counts) into the same group, and return the list of groups. The groups, and the words inside each group, can be in any order.',
      examples: [
        {
          input: 'strs = ["tab", "bat", "cat", "act", "dog"]',
          output: '[["tab", "bat"], ["cat", "act"], ["dog"]]',
        },
        {
          input: 'strs = ["ab", "ba", "ab"]',
          output: '[["ab", "ba", "ab"]]',
          note: 'Repeated words are kept. They are anagrams of each other too.',
        },
      ],
      signals: ['"group" items that share a property', 'anagrams: same letters in a different order', 'return a list of lists, any order'],
      hints: [
        'Two words are anagrams when their letter counts match. Can you turn those counts into one value that is identical for both words?',
        'If every anagram produced the same "signature", you could use that signature as a dict key.',
        'Count the 26 letters of each word, turn the counts into a tuple, and use the tuple as the key of a dict of lists.',
      ],
      brute:
        'Compare every word with every other word using the Valid Anagram check — **O(n² · k)** for n words of length k. Using the sorted word as the key is a good step up at **O(n · k log k)**.',
      insight:
        'Anagrams share the same **letter counts**. Use those counts (as a tuple) as a dict key, and every word drops into its group in a single pass.',
      mnemonic: 'Same counts, same key, same group.',
      steps: [
        'Create a dict that maps a signature to a list of words.',
        'For each word, count how many times each of the 26 letters appears.',
        'Turn the 26 counts into a tuple so it can be a dict key.',
        'Append the word to the list stored under that tuple.',
        'Return all the lists stored in the dict.',
      ],
      solution: py`
class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        #@ Map each letter-count signature to the list of words that share it.
        groups = defaultdict(list)
        #@ Build each word's signature: how many a's, b's, ... z's it contains.
        for word in strs:
            count = [0] * 26
            for ch in word:
                count[ord(ch) - ord("a")] += 1  #!
            #@ Lists cannot be dict keys, so freeze the counts into a tuple. Anagrams get the same tuple.
            groups[tuple(count)].append(word)  #!
        #@ Each list in the dict is one finished group.
        return list(groups.values())`,
      time: 'O(n · k)',
      space: 'O(n · k)',
      complexityWhy:
        'Each of the n words is scanned once (k letters each), and turning 26 counts into a tuple is constant work. The dict stores every word once.',
      pitfalls: [
        'A list cannot be a dict key because it can change. Convert the counts with `tuple(count)`.',
        'Using `"".join(sorted(word))` as the key also works and is shorter, at O(k log k) per word.',
        '`defaultdict(list)` saves you from checking whether a key exists before appending.',
      ],
    },
    {
      id: 'top-k-frequent-elements',
      num: 347,
      title: 'Top K Frequent Elements',
      difficulty: 'Medium',
      category: 'arrays-hashing',
      pattern: 'Count, then bucket sort by frequency',
      alsoAccept: ['heap'],
      prompt:
        'Given a list of integers `nums` and a number `k`, return the `k` values that appear **most often**. The answer is guaranteed to be unique, and you may return it in any order.',
      examples: [
        {
          input: 'nums = [4, 4, 4, 6, 6, 9], k = 2',
          output: '[4, 6]',
          note: '4 appears 3 times and 6 appears twice; 9 appears only once.',
        },
        { input: 'nums = [7, 3, 7], k = 1', output: '[7]' },
      ],
      signals: ['"k most frequent"', 'you need a count for each value', 'answer in any order', 'asked to beat O(n log n)'],
      hints: [
        'Step one is easy: count how many times each number appears.',
        'Sorting by count costs O(n log n). But a count is always between 1 and n — could you use the count itself as a list index?',
        'Make n + 1 buckets where bucket f holds the numbers that appear exactly f times. Read the buckets from the top down.',
      ],
      brute:
        'Count with a dict, sort the distinct numbers by count, and take the first k — **O(n log n)**. A min-heap of size k improves that to **O(n log k)**.',
      insight:
        'A frequency is always between 1 and n, so use it as an **index**: drop each number into `buckets[freq]`, then walk from the highest bucket down until you have k numbers.',
      mnemonic: 'Count them, bucket by count, read from the top.',
      steps: [
        'Count how often each number appears using a dict.',
        'Create n + 1 empty buckets, one for each possible frequency.',
        'Put each number into the bucket whose index equals its count.',
        'Walk the buckets from the highest frequency down to 1.',
        'Add numbers to the result and stop once it holds k of them.',
      ],
      solution: py`
class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:
        #@ Count how often each number appears.
        count = {}
        for n in nums:
            count[n] = count.get(n, 0) + 1
        #@ buckets[f] will hold every number that appears exactly f times. No count can exceed len(nums).
        buckets = [[] for _ in range(len(nums) + 1)]
        for n, freq in count.items():
            buckets[freq].append(n)  #!
        #@ Walk the buckets from the highest frequency down, collecting numbers.
        res = []
        for freq in range(len(buckets) - 1, 0, -1):  #!
            for n in buckets[freq]:
                res.append(n)
                #@ Stop as soon as we have k numbers.
                if len(res) == k:
                    return res`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy:
        'Counting is one pass, filling the buckets touches each distinct number once, and reading n + 1 buckets is O(n). The dict and the buckets hold at most n numbers.',
      pitfalls: [
        'Make n + 1 buckets, not n: a number that fills the whole list has frequency n, so index n must exist.',
        'Build the buckets with `[[] for _ in range(n + 1)]`. Writing `[[]] * (n + 1)` makes every bucket the *same* list.',
        'Return as soon as you have k numbers, or values from lower buckets sneak in.',
      ],
    },
    {
      id: 'encode-and-decode-strings',
      num: 271,
      title: 'Encode and Decode Strings',
      difficulty: 'Medium',
      category: 'arrays-hashing',
      premium: true,
      pattern: 'Length-prefix encoding',
      prompt:
        'Write two methods. `encode` turns a list of strings into **one single string**, and `decode` turns that string back into the **exact original list**. The strings may contain any character, including digits, `#` and anything else you might want to use as a separator.',
      examples: [
        {
          input: 'strs = ["hi", "a#b", ""]',
          output: '["hi", "a#b", ""]',
          note: 'encode gives "2#hi3#a#b0#", and decode turns that back into the same list.',
        },
        {
          input: 'strs = ["4#", "x"]',
          output: '["4#", "x"]',
          note: 'Encoded as "2#4#1#x". The length says how far to read, so the "4#" inside is just data.',
        },
      ],
      signals: [
        'turn a list of strings into one string and back again',
        'strings may contain any character, so no separator is safe on its own',
        '"serialize" / "deserialize"',
      ],
      hints: [
        'Joining with a separator like "," breaks as soon as a string contains a comma. What extra information would make the separator unnecessary?',
        'If you knew how long the next string is, you could simply read that many characters.',
        'Write each string as its length, then "#", then the string. To decode, read the digits up to "#", then slice exactly that many characters.',
      ],
      brute:
        'Join the strings with a separator and split on it. That is **O(n)** but **wrong**: it breaks as soon as a string contains the separator, and escaping every special character gets messy fast.',
      insight:
        "Put each string's **length** in front of it, followed by a `#` marker. The decoder reads the number, then jumps exactly that many characters ahead, so nothing inside a string can confuse it.",
      mnemonic: 'Length, hash, word. Read the length, jump that far.',
      steps: [
        'To encode, write each string as its length, a `#`, then the string.',
        'Join all those pieces into one string.',
        'To decode, start an index i at 0 and find the next `#` after it.',
        'Read the digits between i and the `#` as the length.',
        'Slice that many characters after the `#` and add them to the result.',
        'Move i just past the slice and repeat until the end.',
      ],
      solution: py`
class Codec:
    def encode(self, strs: List[str]) -> str:
        #@ For every string, write its length, a "#" marker, then the string itself.
        parts = []
        for word in strs:
            parts.append(str(len(word)) + "#" + word)  #!
        #@ Glue the pieces together into one string.
        return "".join(parts)

    #@ To decode, walk the encoded string with an index i that always sits at the start of a length.
    def decode(self, s: str) -> List[str]:
        res, i = [], 0
        while i < len(s):
            #@ Move j forward to the "#" that ends the length digits.
            j = i
            while s[j] != "#":
                j += 1
            #@ The digits say exactly how many characters to read after the "#".
            length = int(s[i:j])  #!
            res.append(s[j + 1 : j + 1 + length])
            #@ Jump past this string; i now points at the next length.
            i = j + 1 + length  #!
        #@ Every string is back, in its original order.
        return res`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy:
        'Both methods touch each character a constant number of times, where n is the total length of all the strings. The encoded string and the decoded list are O(n) in size.',
      pitfalls: [
        'Lengths can have several digits (like `12#`), so scan to the `#` instead of reading one character.',
        'Empty strings must survive: they encode as `0#`, and slicing zero characters correctly gives `""`.',
        'Never search for `#` inside the string itself. Always jump by the length.',
      ],
    },
    {
      id: 'product-of-array-except-self',
      num: 238,
      title: 'Product of Array Except Self',
      difficulty: 'Medium',
      category: 'arrays-hashing',
      pattern: 'Prefix and suffix products',
      prompt:
        'Given a list `nums`, return a list `answer` where `answer[i]` is the product of **every element except** `nums[i]`. You may **not use division**, and the solution should run in O(n) time.',
      examples: [
        {
          input: 'nums = [2, 3, 4, 5]',
          output: '[60, 40, 30, 24]',
          note: 'answer[0] = 3 × 4 × 5 = 60, answer[1] = 2 × 4 × 5 = 40, and so on.',
        },
        {
          input: 'nums = [3, 0, 2, -1]',
          output: '[0, -6, 0, 0]',
          note: 'Only the slot of the 0 avoids multiplying by 0.',
        },
      ],
      signals: ['"product of all elements except" the current one', 'division is not allowed', 'O(n) time, ideally O(1) extra space'],
      hints: [
        'The product of everything except `nums[i]` = (product of everything to its left) × (product of everything to its right).',
        'You can get every "left product" in one pass from the left, and every "right product" in one pass from the right.',
        'Store the left products in the answer list, then sweep from the right with a running product and multiply it in.',
      ],
      brute:
        'For each index, multiply all the other elements with an inner loop — **O(n²)**. Multiplying everything once and dividing by `nums[i]` is O(n), but division is not allowed and it breaks when a value is 0.',
      insight:
        'Everything except `nums[i]` is just **the left part times the right part**. A left-to-right pass fills in prefix products, and a right-to-left pass multiplies in suffix products.',
      mnemonic: 'Left products in, right products times. No division.',
      steps: [
        'Create an answer list of 1s, the same length as nums.',
        'Walk left to right keeping a running prefix product.',
        'Write the prefix into answer[i] first, then multiply the prefix by nums[i].',
        'Walk right to left keeping a running suffix product.',
        'Multiply answer[i] by the suffix, then multiply the suffix by nums[i].',
        'Return the answer list.',
      ],
      solution: py`
class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        #@ The answer list doubles as storage, so the only extra memory is two running products.
        n = len(nums)
        res = [1] * n
        #@ Left-to-right pass: res[i] becomes the product of everything to the LEFT of i.
        prefix = 1
        for i in range(n):
            res[i] = prefix  #!
            prefix *= nums[i]
        #@ Right-to-left pass: multiply in the product of everything to the RIGHT of i.
        suffix = 1
        for i in range(n - 1, -1, -1):
            res[i] *= suffix  #!
            suffix *= nums[i]
        #@ Each slot now holds left product × right product.
        return res`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy:
        'Two passes over n numbers. The output list does not count as extra space, and apart from it we only keep two running products.',
      pitfalls: [
        'Write `res[i]` *before* updating the running product, or `nums[i]` ends up in its own answer.',
        'The backward loop is `range(n - 1, -1, -1)`. Stopping at 0 instead of -1 skips the first element.',
        'Zeros need no special case here — that is exactly why the division trick is a trap.',
      ],
    },
    {
      id: 'valid-sudoku',
      num: 36,
      title: 'Valid Sudoku',
      difficulty: 'Medium',
      category: 'arrays-hashing',
      pattern: 'Hash sets per row, column and box',
      prompt:
        'You get a partly filled 9 × 9 Sudoku board as a grid of strings: a digit `"1"`–`"9"`, or `"."` for an empty cell. Return `True` if **no digit repeats** within any row, any column, or any of the nine 3 × 3 boxes. Only check the filled cells; the puzzle does not have to be solvable.',
      examples: [
        {
          input: 'board = all "." except row 0, which is ["8", ".", ".", ".", ".", ".", ".", ".", "8"]',
          output: 'False',
          note: 'Row 0 contains two 8s.',
        },
        {
          input: 'board = all "." except board[0][0] = "3" and board[2][1] = "3"',
          output: 'False',
          note: 'Different rows and columns, but both sit in the top-left 3 × 3 box.',
        },
        { input: 'board = all "." except board[0][0] = "3" and board[4][4] = "3"', output: 'True' },
      ],
      signals: ['"no repeats" inside several groups at once', 'a fixed-size grid (9 × 9)', 'only validate, do not solve'],
      hints: [
        'Each row, each column and each box needs its own "have I seen this digit?" memory.',
        'Keep 9 sets for the rows, 9 for the columns and 9 for the boxes.',
        'Cell (r, c) belongs to box `(r // 3) * 3 + c // 3`. Check all three sets before adding the digit.',
      ],
      brute:
        'For every filled cell, scan its whole row, column and box looking for the same digit — about 27 checks per cell. The board is always 9 × 9, but on an n × n board that would be **O(n³)**. One pass with sets needs only O(n²).',
      insight:
        'Give every row, column and 3 × 3 box its **own set**. The trick is the box number: `(r // 3) * 3 + c // 3` sends each cell to one of 9 boxes, so a single pass checks everything.',
      mnemonic: 'Row, column, box sets; box = (r//3)*3 + c//3.',
      steps: [
        'Create 9 sets for rows, 9 for columns and 9 for boxes.',
        'Loop over every cell, skipping the empty "." cells.',
        'Compute the box index as (r // 3) * 3 + c // 3.',
        'If the digit is already in its row, column or box set, return False.',
        'Otherwise add the digit to all three sets.',
        'After checking every cell, return True.',
      ],
      solution: py`
class Solution:
    def isValidSudoku(self, board: List[List[str]]) -> bool:
        #@ One set per row, per column and per 3x3 box, remembering the digits already placed there.
        rows = [set() for _ in range(9)]
        cols = [set() for _ in range(9)]
        boxes = [set() for _ in range(9)]
        #@ Visit every cell. Empty cells (".") have nothing to check.
        for r in range(9):
            for c in range(9):
                val = board[r][c]
                if val == ".":
                    continue
                #@ Number the boxes 0-8: three boxes per band of rows, plus which band of columns.
                b = (r // 3) * 3 + c // 3  #!
                #@ Already seen this digit in the same row, column or box? The board is invalid.
                if val in rows[r] or val in cols[c] or val in boxes[b]:  #!
                    return False
                #@ Otherwise record the digit in all three places.
                rows[r].add(val)
                cols[c].add(val)
                boxes[b].add(val)
        #@ No clashes anywhere, so the filled cells are valid.
        return True`,
      time: 'O(1)',
      space: 'O(1)',
      complexityWhy:
        'The board always has 81 cells and the sets hold at most 81 digits, so the work is constant. On a general n × n board it would be O(n²).',
      pitfalls: [
        'Getting the box index wrong. `r // 3` picks the band of rows and `c // 3` the band of columns; combine them as `(r // 3) * 3 + c // 3`.',
        'Forgetting to skip `"."` makes every empty cell look like a repeat.',
        'A dict keyed by the tuple `(r // 3, c // 3)` works just as well as numbering the boxes 0–8.',
      ],
    },
    {
      id: 'longest-consecutive-sequence',
      num: 128,
      title: 'Longest Consecutive Sequence',
      difficulty: 'Medium',
      category: 'arrays-hashing',
      pattern: 'Hash set, count only from run starts',
      prompt:
        'Given an **unsorted** list of integers, return the length of the longest run of **consecutive values** (like 7, 8, 9, 10) you can form from its numbers. The values can be anywhere in the list. Aim for O(n) time.',
      examples: [
        {
          input: 'nums = [9, 1, 7, 3, 8, 2, 10, 30]',
          output: '4',
          note: 'The run 7, 8, 9, 10 has length 4 (1, 2, 3 is only 3 long).',
        },
        { input: 'nums = [5, 5, 6]', output: '2', note: 'Duplicates do not make a run longer: just 5, 6.' },
        { input: 'nums = []', output: '0' },
      ],
      signals: ['"consecutive" values in an unsorted list', 'must be O(n), so no sorting', 'the order in the list does not matter'],
      hints: [
        'Sorting makes this easy but costs O(n log n). Which structure lets you ask "is x + 1 here?" in O(1)?',
        'Put everything in a set. From any number you can walk upward: x + 1, x + 2, ...',
        'Only start walking from numbers whose left neighbor `x - 1` is **not** in the set. Those are the starts of runs.',
      ],
      brute:
        'Sort the list and scan for runs — **O(n log n)**. Or walk upward with a set from *every* number, which repeats the same walks again and again and can reach **O(n²)**.',
      insight:
        'Put all numbers in a set and only start counting at a number `x` whose `x - 1` is missing — the **start** of a run. Every number is then walked over at most once, so the total is O(n).',
      mnemonic: 'No left neighbor? Start of a run — count upward.',
      steps: [
        'Put every number into a set.',
        'Loop over the numbers in the set.',
        'Skip any number whose x - 1 is also in the set.',
        'From a run start, count upward while x + length is in the set.',
        'Keep the longest length seen and return it.',
      ],
      solution: py`
class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        #@ A set gives O(1) "is x present?" checks, and duplicates collapse into one.
        num_set = set(nums)
        longest = 0
        #@ Only start counting from a number that BEGINS a run: its left neighbor is missing.
        for n in num_set:
            if n - 1 not in num_set:  #!
                #@ Walk right while the next number exists, measuring the run.
                length = 1
                while n + length in num_set:  #!
                    length += 1
                #@ Keep the best run found so far.
                longest = max(longest, length)
        return longest`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy:
        'Building the set is O(n). The inner while loop only runs from run starts, so each number is stepped over at most once across all runs. The set holds up to n numbers.',
      pitfalls: [
        'Without the `n - 1 not in num_set` check, a long run is re-counted from every number in it: O(n²).',
        'Loop over the **set**, not the original list. A run start repeated thousands of times would otherwise re-walk the same run each time.',
        'An empty list must return 0, which happens naturally because `longest` starts at 0.',
      ],
    },
  ],
};

export default content;
