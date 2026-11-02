import { py, type CategoryContent } from '../types';

const content: CategoryContent = {
  guide: {
    category: 'sliding-window',
    summary: `A **window** is a run of neighboring items: \`s[l..r]\`, from a left edge \`l\` to a right edge \`r\`. Many problems ask for the longest, shortest or best such run.

The brute force tries every start and every end and recounts each piece from scratch — O(n²) or worse. A **sliding window** never starts over. Move \`r\` right to **add** one item; move \`l\` right to **drop** one item. Keep a small summary of what is inside (a count, a set, a sum) and update it by just those two items.

Each item enters the window once and leaves at most once, so the whole scan is **O(n)**.

Two flavors: a **fixed-size** window (always \`k\` long: add one, drop one) and a **variable-size** window (grow until the rule breaks, then shrink until it holds again).`,
    analogy:
      'Reading a long scroll through a cardboard frame. You slide the frame along: one word appears on the right as one disappears on the left. You never re-read the whole scroll to know what is in the frame.',
    whenToUse: [
      'The answer is a **contiguous** subarray or substring (neighboring items, no skipping)',
      'The question says **longest / shortest / maximum / minimum** run that follows a rule',
      'There is a fixed size: "every block of `k` items" → **fixed window**',
      'A rule about what is inside: "no repeats", "at most k changes", "contains all of t" → **variable window**',
      'Your brute force loops over every `(start, end)` pair and recomputes → slide instead of restarting',
    ],
    template: py`
def longest_valid_window(s):
    window = {}                      # what is inside s[l..r]: counts, a set, a sum...
    l = 0
    best = 0
    for r in range(len(s)):          # 1. grow: bring s[r] into the window
        add(window, s[r])
        while not is_valid(window):  # 2. shrink: drop s[l] until the rule holds again
            remove(window, s[l])
            l += 1
        best = max(best, r - l + 1)  # 3. record: s[l..r] is a valid window
    return best`,
    templateNotes: [
      'Both edges only move **forward**. Each item is added once and removed at most once, so the `while` inside the `for` is still O(n) in total.',
      'The window `s[l..r]` holds `r - l + 1` items.',
      'For the **longest** window, record after shrinking. For the **shortest**, record *inside* the shrink loop, while the window is still valid.',
      'Fixed size `k`: once the window holds more than `k` items, drop `s[r - k]` — an `if`, not a `while`.',
      'Update the window summary by the one item that enters and the one that leaves. Never recount the whole window.',
    ],
    complexity: 'Usually O(n) time, with O(1) or O(k) extra space for the window summary.',
    quiz: [
      {
        q: 'The template has a `while` loop inside a `for` loop. Why is it still O(n) and not O(n²)?',
        options: [
          'The `while` loop runs at most once per step',
          'Each item is added once and removed at most once, so `l` and `r` each move at most n times',
          'Python makes nested loops faster',
          'It is actually O(n²)',
        ],
        answer: 1,
        explain: 'Count the total moves, not the loops: `r` moves n times and `l` can move at most n times overall.',
      },
      {
        q: 'Which problem is a natural fit for a sliding window?',
        options: [
          'Find the longest substring with no repeated characters',
          'Find two numbers anywhere in a list that add up to a target',
          'Sort a list of numbers',
          'Count how many times each word appears in a book',
        ],
        answer: 0,
        explain: 'It asks for the longest **contiguous** run that obeys a rule — the classic variable window.',
      },
      {
        q: 'A window runs from `l = 3` to `r = 7`, both included. How many items are inside?',
        options: ['4', '5', '7', '10'],
        answer: 1,
        explain: 'The length is `r - l + 1 = 7 - 3 + 1 = 5`.',
      },
    ],
  },

  problems: [
    {
      id: 'best-time-to-buy-and-sell-stock',
      num: 121,
      title: 'Best Time to Buy and Sell Stock',
      difficulty: 'Easy',
      category: 'sliding-window',
      pattern: 'Track the minimum price so far',
      alsoAccept: ['greedy'],
      prompt:
        '`prices[i]` is the price of a stock on day `i`. You may buy once and then sell once on a **later** day. Return the biggest profit you can make, or `0` if no trade makes money.',
      examples: [
        { input: 'prices = [8, 3, 6, 1, 5, 2]', output: '4', note: 'Buy at 1 (day 3), sell at 5 (day 4).' },
        { input: 'prices = [9, 7, 4, 2]', output: '0', note: 'Prices only fall, so do not trade.' },
      ],
      signals: ['"buy on one day, sell on a later day"', 'biggest difference where the smaller value comes first', 'a single pass over a timeline'],
      hints: [
        'Pretend you must sell today. Which earlier day would you want to have bought on?',
        'The best day to have bought is simply the cheapest day so far.',
        'Walk the prices once, keeping the lowest price seen so far and the best profit so far.',
      ],
      brute:
        'Try every buy day `i` with every later sell day `j` and keep the largest `prices[j] - prices[i]` — **O(n²)** time.',
      insight:
        'For any selling day, the best buying day is the **cheapest day before it**. Keep that minimum as you scan. It is the left edge of the window, and it jumps forward whenever a new low appears.',
      mnemonic: 'Remember the cheapest day; sell today against it.',
      steps: [
        'Set min_price to the first price and best to 0.',
        'Loop over each price as a possible selling day.',
        'If price - min_price beats best, update best.',
        'If today is cheaper than min_price, make it the new min_price.',
        'Return best.',
      ],
      solution: py`
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        #@ The cheapest price so far is the best day to have bought. No trade yet means 0 profit.
        min_price = prices[0]
        best = 0
        #@ Treat every day as a possible selling day.
        for price in prices:
            #@ Profit if we sell today after buying at the cheapest earlier price.
            best = max(best, price - min_price)  #!
            #@ A new low becomes the buying day for all later days.
            min_price = min(min_price, price)  #!
        #@ best is the largest profit found (still 0 if prices only fell).
        return best`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy: 'One pass over the prices, keeping just two numbers no matter how many days there are.',
      pitfalls: [
        '`max(prices) - min(prices)` is wrong: the highest price may come **before** the lowest one.',
        'If prices only fall, return `0` (do not trade), never a negative number.',
        'Starting `min_price` at `0` would fake huge profits. Start it at `prices[0]` (or infinity).',
      ],
    },
    {
      id: 'longest-substring-without-repeating-characters',
      num: 3,
      title: 'Longest Substring Without Repeating Characters',
      difficulty: 'Medium',
      category: 'sliding-window',
      pattern: 'Variable window with a set',
      prompt:
        'Given a string `s`, return the length of the longest **substring** (a run of neighboring characters) in which no character appears twice.',
      examples: [
        { input: 's = "abcbda"', output: '4', note: '"cbda" has four different characters.' },
        { input: 's = "zzzz"', output: '1' },
        { input: 's = ""', output: '0' },
      ],
      signals: ['"longest substring"', '"without repeating characters"', 'a contiguous run with a rule about what is inside'],
      hints: [
        'Suppose the run from `l` to `r` has no repeats. What can go wrong when you add the next character?',
        'If the new character is already inside, move the left edge forward until the old copy has left.',
        'Keep a set of the characters in the window: add on the right, remove on the left.',
      ],
      brute:
        'Check every start and every end, and test each substring for repeats — **O(n³)**, or **O(n²)** if each start stops at its first repeat.',
      insight:
        'Keep a window with **no repeats**. Grow it on the right; when the new character is already inside, shrink from the left until it is not. Every character enters and leaves once, so it is O(n).',
      mnemonic: 'Duplicate walks in? Shrink from the left until it leaves.',
      steps: [
        'Start with an empty set, l = 0 and best = 0.',
        'Move r across the string one character at a time.',
        'While s[r] is already in the set, remove s[l] and move l right.',
        'Add s[r] to the set.',
        'Update best with the window length r - l + 1.',
      ],
      solution: py`
class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        #@ The set holds exactly the characters inside the window s[l..r].
        window = set()
        l = 0
        best = 0
        #@ Grow the window one character at a time with the right edge r.
        for r in range(len(s)):
            #@ s[r] is already inside? Drop characters from the left until its old copy is gone.
            while s[r] in window:  #!
                window.remove(s[l])
                l += 1
            #@ Now s[r] is unique in the window, so let it in.
            window.add(s[r])
            #@ The window has no repeats: keep its length if it is the longest so far. Return the best after the loop.
            best = max(best, r - l + 1)  #!
        return best`,
      time: 'O(n)',
      space: 'O(k)',
      complexityWhy:
        'Each character is added once and removed at most once. The set holds at most k characters, where k is the number of different characters (bounded by the alphabet).',
      pitfalls: [
        'Shrinking with `if` instead of `while`: the old copy may be several places in, so you may need to drop several characters.',
        'The window length is `r - l + 1`, not `r - l`.',
        'An empty string should return `0` — the loop simply never runs.',
      ],
    },
    {
      id: 'longest-repeating-character-replacement',
      num: 424,
      title: 'Longest Repeating Character Replacement',
      difficulty: 'Medium',
      category: 'sliding-window',
      pattern: 'Variable window: length − max count ≤ k',
      prompt:
        'You get a string `s` of uppercase letters and a number `k`. You may change **at most k** characters into any other uppercase letter. Return the length of the longest substring you can turn into **one repeated letter**.',
      examples: [
        { input: 's = "ABBCB", k = 1', output: '4', note: 'Change the C in "BBCB" to get "BBBB".' },
        { input: 's = "AABCA", k = 1', output: '3', note: 'For example "AAB" becomes "AAA".' },
      ],
      signals: ['"at most k replacements / changes"', 'longest substring of one repeated letter', 'uppercase letters only, so at most 26 counts'],
      hints: [
        'Inside one window, which letter should you keep, and how many characters must you change?',
        'Keep the most common letter. You must change `window length - max count` characters.',
        'Grow the window. Whenever `window length - max count > k`, shrink it from the left.',
      ],
      brute:
        'For every substring, count its letters and check whether `length - max count <= k` — **O(n²)** substrings, each needing counts.',
      insight:
        'A window can be fixed when **window length − count of its most common letter ≤ k**: those other letters are exactly the ones you must change. Slide a window that keeps this rule true.',
      mnemonic: 'Length minus top count must not exceed k.',
      steps: [
        'Keep a count of each letter in the window and the highest count seen, max_count.',
        'Move r forward, count s[r] and update max_count.',
        'While the window length minus max_count is more than k, uncount s[l] and move l right.',
        'Record the window length if it is the best so far.',
        'Return the best length.',
      ],
      solution: py`
class Solution:
    def characterReplacement(self, s: str, k: int) -> int:
        #@ count = letters inside the window; max_count = the most copies of one letter we have seen.
        count = {}
        max_count = 0
        l = 0
        best = 0
        #@ Grow the window: add s[r] to the counts and update max_count.
        for r in range(len(s)):
            count[s[r]] = count.get(s[r], 0) + 1
            max_count = max(max_count, count[s[r]])  #!
            #@ Letters other than the most common one must be changed. More than k of them? Shrink from the left.
            while (r - l + 1) - max_count > k:  #!
                count[s[l]] -= 1
                l += 1
            #@ The window is fixable now, so keep the longest one, and return it after the loop.
            best = max(best, r - l + 1)
        return best`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy:
        'Each letter enters and leaves the window at most once. The count dict holds at most 26 uppercase letters.',
      pitfalls: [
        'The number of changes is `length - max_count`, not `length - k` or the count of one fixed letter.',
        '`max_count` is never lowered when the window shrinks. That is safe: the answer can only grow when some letter beats the old `max_count`. If that feels uneasy, use `max(count.values())` — only 26 letters, still O(n).',
        'Decrease `count[s[l]]` *before* moving `l` forward, or you uncount the wrong letter.',
      ],
    },
    {
      id: 'permutation-in-string',
      num: 567,
      title: 'Permutation in String',
      difficulty: 'Medium',
      category: 'sliding-window',
      pattern: 'Fixed-size window with a "missing" counter',
      prompt:
        'Given two strings `s1` and `s2`, return `True` if some substring of `s2` is a **rearrangement** of `s1` (same letters, same counts). Otherwise return `False`.',
      examples: [
        { input: 's1 = "cat", s2 = "doactg"', output: 'True', note: '"act" (positions 2 to 4) uses the same letters as "cat".' },
        { input: 's1 = "ab", s2 = "axxb"', output: 'False' },
      ],
      signals: ['"permutation" or "anagram" of one string inside another', 'the window size is fixed: len(s1)', 'compare letter counts'],
      hints: [
        'A rearrangement of `s1` has exactly `len(s1)` letters. How long must the window be?',
        'Two strings are rearrangements of each other when their letter counts match.',
        'Slide a window of size `len(s1)` and track how many letters of `s1` are still missing. Each slide only changes one letter in and one letter out.',
      ],
      brute:
        'For every window of length `len(s1)` in `s2`, count or sort its letters and compare with `s1` — **O(n · m)**. Generating every permutation of `s1` is far worse: **O(m!)**.',
      insight:
        'Use a **fixed-size window**. Keep `need` (how many of each letter the window still lacks) and one number, `missing`. One letter enters and one leaves per slide, so `missing` updates in O(1). `missing == 0` means a match.',
      mnemonic: 'Fixed window, count what is missing; zero missing means found.',
      steps: [
        'Count the letters of s1 into need and set missing to len(s1).',
        'Move r across s2: if s2[r] is still needed, lower missing, then lower need[s2[r]].',
        'Once the window is longer than s1, give back the letter that slid out on the left.',
        'If missing is 0, return True.',
        'If the loop ends without a match, return False.',
      ],
      solution: py`
class Solution:
    def checkInclusion(self, s1: str, s2: str) -> bool:
        #@ need[c] = how many more c's the window still lacks; missing = total letters still lacking.
        need = collections.Counter(s1)
        missing = len(s1)
        #@ Slide r across s2 and add the new letter. If s1 still needed it, one fewer letter is missing.
        for r in range(len(s2)):
            if need[s2[r]] > 0:
                missing -= 1
            need[s2[r]] -= 1
            #@ Keep the window exactly len(s1) long: give back the letter that just slid out on the left.
            if r >= len(s1):  #!
                gone = s2[r - len(s1)]
                need[gone] += 1
                if need[gone] > 0:
                    missing += 1
            #@ Nothing missing means the window holds exactly the letters of s1.
            if missing == 0:  #!
                return True
        #@ No window matched.
        return False`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy:
        'One pass over s2 (plus counting s1) with O(1) work per step. The counter holds at most 26 lowercase letters.',
      pitfalls: [
        'Off-by-one on the left edge: the letter leaving is `s2[r - len(s1)]`, and only once `r >= len(s1)`.',
        '`need` can go negative — that just means the window has extra copies. Only change `missing` when a count crosses zero.',
        'If `s1` is longer than `s2`, the answer is `False`. The code handles it: `missing` never reaches 0.',
      ],
    },
    {
      id: 'minimum-window-substring',
      num: 76,
      title: 'Minimum Window Substring',
      difficulty: 'Hard',
      category: 'sliding-window',
      pattern: 'Variable window: expand to valid, shrink while valid',
      prompt:
        'Given strings `s` and `t`, return the **shortest substring of s** that contains every character of `t`, including repeats. If there is none, return `""`. When an answer exists it is unique.',
      examples: [
        { input: 's = "CBDACB", t = "ABC"', output: '"ACB"', note: 'Other windows like "CBDA" also cover A, B and C, but are longer.' },
        { input: 's = "xyz", t = "xx"', output: '""', note: 's has only one x.' },
      ],
      signals: ['"minimum window" or shortest substring containing all of t', 'duplicates in t count', 'grow until valid, then shrink'],
      hints: [
        'Grow the window until it contains everything in `t`. Then how could you make it shorter?',
        'While the window is still valid, record it and drop letters from the left.',
        'Track `missing` = how many letters of `t` the window still lacks, so "is it valid?" is just `missing == 0`.',
      ],
      brute:
        'Check every substring of `s` and test whether it covers `t` — **O(n²)** substrings, each needing a count comparison.',
      insight:
        'Grow the right edge until the window covers `t` (`missing == 0`). Then, **while it still covers t**, record it and shrink from the left. Each character enters and leaves once: O(n).',
      mnemonic: 'Expand until valid, shrink while valid, record the shortest.',
      steps: [
        'Count the letters of t into need and set missing to len(t).',
        'Move r across s: if s[r] is still needed, lower missing, then lower need[s[r]].',
        'While missing is 0, record the window if it is the shortest so far.',
        'Then remove s[l]: raise its need, raise missing if it is needed again, and move l right.',
        'Return the shortest window, or an empty string if none was found.',
      ],
      solution: py`
class Solution:
    def minWindow(self, s: str, t: str) -> str:
        #@ need[c] = how many more c's the window still lacks; missing = total letters still lacking.
        need = collections.Counter(t)
        missing = len(t)
        l = 0
        best_start, best_len = 0, float("inf")
        #@ Grow the window to the right. A letter that was still needed lowers missing.
        for r in range(len(s)):
            if need[s[r]] > 0:
                missing -= 1
            need[s[r]] -= 1
            #@ While the window covers all of t, it is a candidate: keep it if it is the shortest.
            while missing == 0:  #!
                if r - l + 1 < best_len:
                    best_start, best_len = l, r - l + 1
                #@ Shrink from the left. Losing a letter we truly needed makes the window invalid again.
                need[s[l]] += 1
                if need[s[l]] > 0:  #!
                    missing += 1
                l += 1
        #@ Return the best window, or "" if no window ever covered t.
        if best_len == float("inf"):
            return ""
        return s[best_start:best_start + best_len]`,
      time: 'O(n + m)',
      space: 'O(1)',
      complexityWhy:
        'Counting t is O(m); then each character of s enters and leaves the window at most once. The counter holds at most 52 upper- and lowercase letters.',
      pitfalls: [
        'Record the window **inside** the shrink loop, before removing `s[l]` — afterwards it may no longer be valid.',
        'Duplicates matter: `t = "AAB"` needs two As. A count (not a set) handles this.',
        'Only raise `missing` when a count goes from 0 to 1 (a truly needed letter left), not when an extra copy leaves.',
        'Start the best length at infinity so you can tell "nothing found" apart and return `""`.',
      ],
    },
    {
      id: 'sliding-window-maximum',
      num: 239,
      title: 'Sliding Window Maximum',
      difficulty: 'Hard',
      category: 'sliding-window',
      pattern: 'Monotonic decreasing deque',
      alsoAccept: ['stack', 'heap'],
      prompt:
        'You get a list `nums` and a window size `k`. A window covering `k` neighboring numbers starts at the left end and slides right one step at a time. Return a list of the **largest number in each window position**.',
      examples: [
        { input: 'nums = [2, 5, 1, 3, 4, 0], k = 3', output: '[5, 5, 4, 4]', note: 'Windows: [2, 5, 1], [5, 1, 3], [1, 3, 4], [3, 4, 0].' },
        { input: 'nums = [9, 8, 7, 6], k = 2', output: '[9, 8, 7]' },
      ],
      signals: ['"maximum of every window of size k"', 'a fixed-size window sliding one step at a time', 'O(n · k) is too slow'],
      hints: [
        'If a new number is bigger than an older number in the window, can that older number ever be the maximum again?',
        'No — so throw it away. What is left decreases from front to back.',
        'Keep indices in a deque with decreasing values: pop smaller values off the back, pop expired indices off the front, read the max at the front.',
      ],
      brute:
        'For each of the `n - k + 1` windows, scan all `k` numbers for the max — **O(n · k)**. A max-heap with lazy removal reaches **O(n log n)**.',
      insight:
        'Keep a **deque of indices whose values decrease** from front to back. A new number evicts every smaller number behind it (they can never be a max again), so the front is always the current window maximum.',
      mnemonic: 'Bigger newcomer evicts the smaller ones; the front is the max.',
      steps: [
        'Create an empty deque of indices and an empty result list.',
        'For each index r, pop indices off the back while their values are smaller than nums[r].',
        'Append r to the back of the deque.',
        'If the front index has slid out of the window, pop it off the front.',
        'Once the first full window exists, append the value at the front index to the result.',
      ],
      solution: py`
class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        #@ The deque holds indices whose values decrease from front to back. The front is the window max.
        dq = collections.deque()
        result = []
        #@ Slide the right edge r across the list.
        for r in range(len(nums)):
            #@ Smaller values behind nums[r] can never be a max again, so pop them off the back.
            while dq and nums[dq[-1]] < nums[r]:  #!
                dq.pop()
            dq.append(r)
            #@ If the front index has slid out of the window, remove it.
            if dq[0] <= r - k:  #!
                dq.popleft()
            #@ Once the first full window is formed, the front of the deque is its maximum. Return the maximums after the loop.
            if r >= k - 1:
                result.append(nums[dq[0]])  #!
        return result`,
      time: 'O(n)',
      space: 'O(k)',
      complexityWhy:
        'Each index is pushed once and popped at most once, so all the deque work adds up to O(n). The deque never holds more than k indices.',
      pitfalls: [
        'Store **indices**, not values — you need them to know when the front has slid out of the window.',
        'Only start recording once the first full window exists (`r >= k - 1`).',
        'The inner `while` looks nested, but each index is popped at most once overall: still O(n).',
      ],
    },
  ],
};

export default content;
