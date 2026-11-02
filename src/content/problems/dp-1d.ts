import { py, type CategoryContent } from '../types';

const content: CategoryContent = {
  guide: {
    category: 'dp-1d',
    summary: `**Dynamic programming (DP)** is recursion with a memory. Many problems break into smaller versions of themselves, and the same small versions come up again and again. DP solves each one **once**, stores the answer, and reuses it.

Always start by **defining \`dp[i]\` in words**, for example "\`dp[i]\` = number of ways to reach step \`i\`". Then ask: how does \`dp[i]\` depend on *smaller* indices? That relationship is the **recurrence**. Add the base cases and you are nearly done.

Most 1-D DP solutions grow through four stages, each a small upgrade of the last:
- **Recursion**: write the recurrence directly. Correct, but often exponential because it repeats work.
- **Memoization** (top-down): the same recursion plus a cache, so each subproblem is solved once.
- **Bottom-up table**: fill \`dp[0], dp[1], ...\` in a loop from small to big. No recursion needed.
- **Rolling variables**: if \`dp[i]\` only looks back one or two steps, keep just those values for O(1) space.`,
    analogy:
      'Write "1 + 1 + 1 + 1 + 1" on paper and a friend counts: 5. Add "+ 1" and they say 6 instantly, without recounting, because they remembered the 5. DP is exactly that: remember earlier answers and build on them.',
    whenToUse: [
      'The question asks for a **count of ways**, a **minimum / maximum**, or **is it possible?**',
      'At each item you make a choice (take or skip, 1 step or 2 steps) and that choice affects what comes next',
      'Drawing the brute-force recursion tree shows the **same subproblem** many times',
      'The answer for the first `i` items can be built from the answers for shorter prefixes',
      'Greedy breaks on a small counterexample, so you need to consider every option',
      'Substrings or subarrays with a property (palindrome, product) → think "best **ending at** `i`" or "grow from a center"',
    ],
    template: py`
from functools import cache

# Step 0: say it in words.  dp(i) = number of ways to reach step i

# 1) Recursion: write the recurrence directly (exponential: repeats work).
def ways_recursive(i):
    if i <= 1:                        # base cases
        return 1
    return ways_recursive(i - 1) + ways_recursive(i - 2)

# 2) Memoization: the same code plus a cache. Each i is computed once.
@cache
def ways_memo(i):
    if i <= 1:
        return 1
    return ways_memo(i - 1) + ways_memo(i - 2)

# 3) Bottom-up table: fill from small i to big i.
def ways_table(n):
    dp = [1] * (n + 1)                # dp[0] and dp[1] are base cases
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]  # the recurrence
    return dp[n]

# 4) Rolling variables: dp[i] only looks back 2 steps, so keep 2 numbers.
def ways_rolling(n):
    prev, cur = 1, 1                  # dp[i - 2], dp[i - 1]
    for _ in range(2, n + 1):
        prev, cur = cur, cur + prev
    return cur`,
    templateNotes: [
      '**Define `dp[i]` in words first.** If you cannot say what it means in one sentence, the recurrence will not come.',
      'Base cases are the smallest inputs you can answer without the recurrence (here `dp[0]` and `dp[1]`).',
      '`@cache` (from `functools`) memoizes a function: the first call with an argument computes it, later calls return the stored answer.',
      'Bottom-up must fill entries in an order where everything `dp[i]` needs is **already filled**, usually left to right.',
      'Tuple assignment `prev, cur = cur, cur + prev` updates both variables from the **old** values at once.',
    ],
    complexity:
      'Usually O(n) or O(n²) time (number of states × work per state). O(n) space for the table, often reducible to O(1).',
    quiz: [
      {
        q: 'Plain recursion `ways(n) = ways(n - 1) + ways(n - 2)` is very slow for n = 40. Why?',
        options: [
          'It uses too much memory',
          'It solves the same subproblems over and over (exponential time)',
          'Recursion is always slower than loops',
          'It has no base case',
        ],
        answer: 1,
        explain:
          '`ways(38)` is computed inside both `ways(40)` and `ways(39)`, and the repeats multiply all the way down. Caching fixes that.',
      },
      {
        q: 'What does **memoization** add to a recursive solution?',
        options: [
          'A cache, so each subproblem is computed only once',
          'A loop that replaces the recursion',
          'Sorting of the input',
          'A heap for the smallest answer',
        ],
        answer: 0,
        explain: 'Same recursion, but the first answer for each argument is stored and reused. Exponential becomes linear here.',
      },
      {
        q: 'Your recurrence is `dp[i] = max(dp[i - 1], dp[i - 2] + nums[i])`. How much extra space do you really need?',
        options: ['O(n²)', 'O(n)', 'O(1): two rolling variables', 'O(log n)'],
        answer: 2,
        explain: 'Each entry only looks back two steps, so two variables can replace the whole list.',
      },
      {
        q: 'What should you write down **before** coding any DP solution?',
        options: [
          'The Big-O of the final answer',
          'What `dp[i]` means, in words',
          'Which sorting algorithm to use',
          'The answer for the largest input',
        ],
        answer: 1,
        explain: 'A clear meaning for `dp[i]` makes the recurrence, the base cases and the final answer much easier to find.',
      },
    ],
  },

  problems: [
    {
      id: 'climbing-stairs',
      num: 70,
      title: 'Climbing Stairs',
      difficulty: 'Easy',
      category: 'dp-1d',
      pattern: 'Fibonacci-style DP with two rolling variables',
      prompt:
        'A staircase has `n` steps. Each move, you climb either **1 or 2** steps. In how many different ways can you reach the top?',
      examples: [
        { input: 'n = 4', output: '5', note: '1+1+1+1, 1+1+2, 1+2+1, 2+1+1 and 2+2.' },
        { input: 'n = 1', output: '1' },
      ],
      signals: [
        '"how many distinct ways"',
        'each move has a small fixed set of choices (1 or 2)',
        'the answer for n depends on the answers for n − 1 and n − 2',
      ],
      hints: [
        'Think about your **last** move onto step n. Where could you have been just before it?',
        'You were on step n − 1 (then took 1) or on step n − 2 (then took 2). So ways(n) = ways(n − 1) + ways(n − 2).',
        'That is the Fibonacci pattern. Keep only the last two values and loop up to n.',
      ],
      brute:
        'Recursively try both moves from every step: `ways(n) = ways(n - 1) + ways(n - 2)`. With no memory, the same steps are recomputed again and again: **O(2ⁿ)** time.',
      insight:
        'Every route to step n ends with a 1-step from n − 1 or a 2-step from n − 2, so `ways(n) = ways(n - 1) + ways(n - 2)`. Build it from the bottom, keeping only two numbers.',
      mnemonic: 'Last move was 1 or 2: add the two before.',
      steps: [
        'Define ways(i) as the number of ways to reach step i.',
        'Set the base values: one way to stand at the bottom and one way to reach step 1.',
        'For each step from 2 to n, the new count is the sum of the previous two; slide both variables forward.',
        'Return the count for step n.',
      ],
      solution: py`
class Solution:
    def climbStairs(self, n: int) -> int:
        #@ prev = ways to reach step 0 (just stand there), cur = ways to reach step 1.
        prev, cur = 1, 1
        #@ ways(i) = ways(i - 1) + ways(i - 2). Slide the pair forward one step at a time.
        for _ in range(2, n + 1):
            prev, cur = cur, cur + prev  #!
        #@ cur now holds the number of ways to reach step n.
        return cur`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy: 'One loop of n − 1 steps, and only two numbers are stored at any time.',
      pitfalls: [
        'Plain recursion without a cache times out: n = 45 means over a billion calls.',
        'Getting the base cases wrong. ways(1) = 1 and ways(2) = 2; setting ways(0) = 1 makes the recurrence work from i = 2.',
        'Updating `prev` and `cur` on two separate lines (without a temp variable) loses the old value. Use tuple assignment.',
      ],
    },
    {
      id: 'min-cost-climbing-stairs',
      num: 746,
      title: 'Min Cost Climbing Stairs',
      difficulty: 'Easy',
      category: 'dp-1d',
      pattern: 'Min-cost DP over the two previous steps',
      prompt:
        'You are climbing stairs. Leaving stair `i` costs `cost[i]`, and from there you may climb **1 or 2** stairs. You may begin on stair `0` or stair `1`. Return the minimum total cost to reach the **top**, which is one step past the last stair.',
      examples: [
        {
          input: 'cost = [5, 2, 8, 1]',
          output: '3',
          note: 'Begin on stair 1 (pay 2), jump to stair 3 (pay 1), then step to the top.',
        },
        { input: 'cost = [7, 3]', output: '3', note: 'Begin on stair 1, pay 3 and climb to the top.' },
      ],
      signals: ['"minimum cost" to reach the end', 'each move: 1 or 2 steps', 'a cost attached to each position'],
      hints: [
        'Let `dp[i]` = cheapest total cost to be standing on stair i. What are `dp[0]` and `dp[1]`?',
        'To stand on stair i you came from i − 1 (paying `cost[i - 1]`) or from i − 2 (paying `cost[i - 2]`).',
        '`dp[i] = min(dp[i - 1] + cost[i - 1], dp[i - 2] + cost[i - 2])`. The top is index `len(cost)`, and two variables are enough.',
      ],
      brute:
        'Recursively try both moves from every stair. The same stairs are solved over and over: **O(2ⁿ)** time.',
      insight:
        'The cheapest way to stand on stair i comes from one of the two stairs below it, plus the cost of leaving that stair. Fill this from left to right and keep only the last two values.',
      mnemonic: 'Cheaper of: one below plus its cost, two below plus its cost.',
      steps: [
        'Define dp[i] as the cheapest cost to stand on stair i; dp[0] and dp[1] are both 0.',
        'For each i from 2 up to len(cost), compare arriving from i − 1 and from i − 2.',
        'Keep the smaller total and slide the two variables forward.',
        'Return the value for index len(cost), which is the top.',
      ],
      solution: py`
class Solution:
    def minCostClimbingStairs(self, cost: List[int]) -> int:
        #@ dp[i] = cheapest cost to stand on stair i. Starting on stair 0 or 1 is free.
        prev2, prev1 = 0, 0
        #@ Reach stair i from i - 1 or i - 2, paying for the stair you leave. Keep the cheaper.
        for i in range(2, len(cost) + 1):
            prev2, prev1 = prev1, min(prev1 + cost[i - 1], prev2 + cost[i - 2])  #!
        #@ Index len(cost) is the top, one past the last stair.
        return prev1`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy: 'One pass over the stairs, keeping only the two most recent dp values.',
      pitfalls: [
        'The top is **past** the last stair (index `len(cost)`), not the last stair itself.',
        'Starting on stair 0 or 1 is free, so do not add `cost[0]` or `cost[1]` up front.',
        'Mixing up "pay to step onto a stair" with "pay to leave it". Pick one meaning for `dp[i]` and stick with it.',
      ],
    },
    {
      id: 'house-robber',
      num: 198,
      title: 'House Robber',
      difficulty: 'Medium',
      category: 'dp-1d',
      pattern: 'Take-or-skip DP with two rolling variables',
      prompt:
        'Houses stand in a row, and `nums[i]` is the money in house `i`. You cannot rob two **neighboring** houses, or the alarm goes off. Return the most money you can rob.',
      examples: [
        { input: 'nums = [3, 10, 4, 2, 9]', output: '19', note: 'Rob houses 1 and 4: 10 + 9.' },
        { input: 'nums = [6, 1, 1, 6]', output: '12', note: 'Rob the first and the last house.' },
      ],
      signals: [
        '"cannot pick two adjacent elements"',
        'maximize a sum by choosing items',
        'each item: take it or skip it',
      ],
      hints: [
        'At each house you have two choices. What are they, and what does each one cost you?',
        'Best up to house i = the larger of: skip it (best up to i − 1), or rob it (best up to i − 2, plus `nums[i]`).',
        'Keep two running values: the best total up to the previous house, and up to the house before that.',
      ],
      brute:
        'Recursively decide rob-or-skip for every house and keep the best valid total: **O(2ⁿ)** time.',
      insight:
        'At house i, either skip it (keep the best so far) or rob it (best from two houses back plus this money). `dp[i] = max(dp[i - 1], dp[i - 2] + nums[i])`, and two variables are enough.',
      mnemonic: 'Skip it, or rob it plus two back. Take the max.',
      steps: [
        'Set prev and curr to 0: the best totals two houses back and one house back.',
        'Loop over the money in each house.',
        'The new best is the larger of curr (skip this house) and prev + money (rob it).',
        'Slide forward: prev becomes the old curr, and curr becomes the new best.',
        'Return curr after the last house.',
      ],
      solution: py`
class Solution:
    def rob(self, nums: List[int]) -> int:
        #@ prev = best total up to two houses back, curr = best total up to the last house.
        prev, curr = 0, 0
        #@ For each house: skip it (curr) or rob it (prev + money). Keep the bigger, then slide.
        for money in nums:
            prev, curr = curr, max(curr, prev + money)  #!
        #@ curr is the best total over all the houses.
        return curr`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy: 'One pass over the houses, storing just two numbers.',
      pitfalls: [
        'Greedy "rob every other house" fails: `[6, 1, 1, 6]` needs houses 0 and 3, which are three apart.',
        'Updating `prev` before computing the new `curr` (without tuple assignment) uses the wrong value.',
        'Starting both variables at 0 means an empty street or a single house works with no special case.',
      ],
    },
    {
      id: 'house-robber-ii',
      num: 213,
      title: 'House Robber II',
      difficulty: 'Medium',
      category: 'dp-1d',
      pattern: 'House Robber twice: skip first / skip last',
      prompt:
        'Same as House Robber, but the houses stand in a **circle**, so the first and last houses are neighbors too. Return the most money you can rob without robbing two neighboring houses.',
      examples: [
        {
          input: 'nums = [5, 1, 1, 5]',
          output: '6',
          note: 'Houses 0 and 3 are now neighbors, so 5 + 5 is not allowed. Best is 5 + 1.',
        },
        { input: 'nums = [4, 9, 3]', output: '9' },
      ],
      signals: [
        'House Robber, but "arranged in a circle"',
        'the first and last elements count as neighbors',
        'one extra rule that ties the two ends together',
      ],
      hints: [
        'The circle adds just one extra rule. Which two houses can now never both be robbed?',
        'Either the first house is left out, or the last house is left out. Each case is an ordinary straight row.',
        'Answer = max(rob(nums[1:]), rob(nums[:-1])) with the normal House Robber. Watch out for a single house.',
      ],
      brute: 'Try every subset of houses and reject any with two neighbors (including first + last): **O(2ⁿ)**.',
      insight:
        'You can never rob both the first and the last house, so solve two ordinary House Robber rows, one **without the first house** and one **without the last**, and take the better.',
      mnemonic: 'Break the circle twice: drop first, drop last, take max.',
      steps: [
        'If there is only one house, return its money.',
        'Write the normal House Robber for a straight row of houses.',
        'Run it on every house except the first, and on every house except the last.',
        'Return the larger of the two results.',
      ],
      solution: py`
class Solution:
    def rob(self, nums: List[int]) -> int:
        #@ A single house has no neighbors, so just take it. (Both slices below would be empty.)
        if len(nums) == 1:
            return nums[0]
        #@ The ordinary House Robber for a straight row, returning the best total.
        def rob_row(houses):
            prev, curr = 0, 0
            for money in houses:
                prev, curr = curr, max(curr, prev + money)  #!
            return curr
        #@ First and last are neighbors, so never use both: drop one, then the other.
        return max(rob_row(nums[1:]), rob_row(nums[:-1]))  #!`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy:
        'Two linear passes. The slices copy the list, which costs O(n) space; passing start and end indices instead would make it O(1).',
      pitfalls: [
        'With one house both slices are empty and return 0, so handle `len(nums) == 1` first.',
        'Running House Robber on the whole list ignores the circle and may rob both the first and the last house.',
        'You do not need a third case "drop both ends": it is already covered by each of the two rows.',
      ],
    },
    {
      id: 'longest-palindromic-substring',
      num: 5,
      title: 'Longest Palindromic Substring',
      difficulty: 'Medium',
      category: 'dp-1d',
      pattern: 'Expand around every center',
      alsoAccept: ['two-pointers'],
      prompt:
        'Given a string `s`, return its longest substring that reads the same forwards and backwards (a **palindrome**). If there is a tie, any one of the longest is fine.',
      examples: [
        { input: 's = "zracecarq"', output: '"racecar"' },
        { input: 's = "xbbz"', output: '"bb"', note: 'Even-length palindromes count too.' },
      ],
      signals: [
        '"longest palindromic substring"',
        'a contiguous piece that mirrors itself',
        'length up to about 1000, so O(n²) is fine',
      ],
      hints: [
        'A palindrome mirrors around its middle. What if you started from the middle and grew outward?',
        'Every palindrome has a center: one letter (odd length, like "aba") or the gap between two letters (even length, like "abba").',
        'For each of the 2n − 1 centers, expand while both ends match, and keep the longest result.',
      ],
      brute:
        'Check every substring (O(n²) of them) and test each one for being a palindrome (O(n)): **O(n³)** total.',
      insight:
        'Grow palindromes from their **center**. There are only 2n − 1 centers (each letter and each gap), and expanding from one costs O(n), so the whole search is O(n²) with O(1) extra space.',
      mnemonic: 'Every palindrome has a middle; expand from all of them.',
      steps: [
        'Track the start and the length of the best palindrome found so far.',
        'Write expand(left, right): step outward while both ends are in bounds and equal.',
        'When the ends stop matching, return the start and length of the palindrome just inside them.',
        'For each index i, expand from the odd center (i, i) and the even center (i, i + 1).',
        'If a result is longer than the best, make it the new best.',
        'Slice the best palindrome out of s and return it.',
      ],
      solution: py`
class Solution:
    def longestPalindrome(self, s: str) -> str:
        #@ Remember where the best palindrome starts and how long it is.
        best_start, best_len = 0, 0
        #@ Grow outward while both ends are inside the string and match.
        def expand(left, right):
            while left >= 0 and right < len(s) and s[left] == s[right]:  #!
                left -= 1
                right += 1
            #@ The loop stops one step too far on each side, so the palindrome is s[left + 1:right].
            return left + 1, right - left - 1
        #@ Every index is an odd center (i, i) and the left half of an even center (i, i + 1).
        for i in range(len(s)):
            for left, right in ((i, i), (i, i + 1)):  #!
                start, length = expand(left, right)
                #@ Keep the longest palindrome seen so far.
                if length > best_len:
                    best_start, best_len = start, length
        #@ Slice the winner out of the string.
        return s[best_start:best_start + best_len]`,
      time: 'O(n²)',
      space: 'O(1)',
      complexityWhy:
        'There are 2n − 1 centers and each expansion takes up to O(n) steps. Only a few index variables are stored.',
      pitfalls: [
        'Forgetting **even-length** palindromes like "abba": they have no middle letter, so you must also expand from `(i, i + 1)`.',
        'Off-by-one after the loop: `left` and `right` end one step **past** the palindrome, so it is `s[left + 1:right]`.',
        'The 2-D DP table version (`dp[i][j]` = is `s[i..j]` a palindrome) is also O(n²) time but needs O(n²) memory.',
      ],
    },
    {
      id: 'palindromic-substrings',
      num: 647,
      title: 'Palindromic Substrings',
      difficulty: 'Medium',
      category: 'dp-1d',
      pattern: 'Expand around every center and count',
      alsoAccept: ['two-pointers'],
      prompt:
        'Given a string `s`, count how many of its substrings are palindromes. Substrings at different positions count separately, even if they contain the same letters.',
      examples: [
        { input: 's = "abba"', output: '6', note: '"a", "b", "b", "a", "bb" and "abba".' },
        { input: 's = "xyx"', output: '4', note: '"x", "y", "x" and "xyx".' },
      ],
      signals: [
        '"count" the palindromic substrings',
        'every contiguous substring is a candidate',
        'the same mirror idea as Longest Palindromic Substring',
      ],
      hints: [
        'Every palindrome has a center. If you expand from a center and the two ends match, have you just found a new palindrome?',
        'Yes: every successful expansion step is one more palindrome. Count them.',
        'For each index, expand from (i, i) and from (i, i + 1), adding 1 every time the ends match.',
      ],
      brute: 'List all O(n²) substrings and check each one in O(n): **O(n³)**.',
      insight:
        'Expanding from a center finds palindromes from small to large, and **each successful step is a new palindrome**. Summing over all 2n − 1 centers counts every one in O(n²).',
      mnemonic: 'Expand from every center; each match is one more.',
      steps: [
        'Start a counter at 0.',
        'Write expand(left, right): while the ends are in bounds and equal, count one palindrome and step outward.',
        'For each index i, add the count from the odd center (i, i).',
        'Also add the count from the even center (i, i + 1).',
        'Return the total count.',
      ],
      solution: py`
class Solution:
    def countSubstrings(self, s: str) -> int:
        #@ Count the palindromes that share one center, growing outward.
        def expand(left, right):
            found = 0
            #@ Every step where both ends match is one more palindrome. Return how many were found.
            while left >= 0 and right < len(s) and s[left] == s[right]:
                found += 1  #!
                left -= 1
                right += 1
            return found
        #@ Try every center: each letter (odd lengths) and each gap (even lengths).
        count = 0
        for i in range(len(s)):
            count += expand(i, i)  #!
            count += expand(i, i + 1)  #!
        #@ The sum over all centers is the total count.
        return count`,
      time: 'O(n²)',
      space: 'O(1)',
      complexityWhy: '2n − 1 centers, each expanding up to O(n) steps. Only counters and indices are stored.',
      pitfalls: [
        'Skipping the even centers misses palindromes like "bb".',
        'Counting distinct strings instead of positions: "aa" has three palindromic substrings ("a", "a", "aa").',
        'A 2-D DP table also works in O(n²) time but needs O(n²) memory.',
      ],
    },
    {
      id: 'decode-ways',
      num: 91,
      title: 'Decode Ways',
      difficulty: 'Medium',
      category: 'dp-1d',
      pattern: 'Prefix DP with one- and two-digit steps',
      prompt:
        'Letters are encoded as numbers: `A` → `"1"`, `B` → `"2"`, ..., `Z` → `"26"`. Given a string of digits `s`, return how many different ways it can be decoded back into letters. A piece with a leading zero, like `"06"`, is **not** valid.',
      examples: [
        { input: 's = "121"', output: '3', note: '"1 2 1" (ABA), "12 1" (LA) and "1 21" (AU).' },
        { input: 's = "2610"', output: '2', note: '"2 6 10" (BFJ) and "26 10" (ZJ). The 0 must pair with the 1.' },
        { input: 's = "30"', output: '0', note: '"30" is too big, and "0" alone is not a letter.' },
      ],
      signals: [
        '"number of ways to decode / split" a string',
        'each piece uses 1 or 2 characters',
        'rules on which pieces are valid (1–9 alone, 10–26 as a pair)',
      ],
      hints: [
        'Look at the end of the string. The last letter came from either the last digit alone or the last two digits together.',
        'Let `dp[i]` = ways to decode the first `i` characters. When can you add `dp[i - 1]`? When can you add `dp[i - 2]`?',
        'Add `dp[i - 1]` if `s[i - 1]` is not "0"; add `dp[i - 2]` if `s[i - 2:i]` is between 10 and 26. Start with `dp[0] = 1`.',
      ],
      brute:
        'Recursively split off 1 digit or 2 digits at each position. The same suffixes are solved over and over: **O(2ⁿ)**.',
      insight:
        'This is Climbing Stairs with rules: a 1-digit step is allowed only if the digit is 1–9, and a 2-digit step only if the pair is 10–26. `dp[i]` adds up the allowed steps.',
      mnemonic: 'Stairs with rules: one digit if not 0, two if 10–26.',
      steps: [
        'Create dp of length n + 1 with dp[0] = 1 for the empty prefix.',
        'Loop i from 1 to n over the prefix lengths.',
        'If the last digit s[i - 1] is not "0", add dp[i - 1].',
        'If the last two digits form a number from 10 to 26, add dp[i - 2].',
        'Return dp[n].',
      ],
      solution: py`
class Solution:
    def numDecodings(self, s: str) -> int:
        #@ dp[i] = ways to decode the first i characters. There is one way to decode nothing.
        dp = [0] * (len(s) + 1)
        dp[0] = 1
        #@ Fill in longer and longer prefixes.
        for i in range(1, len(s) + 1):
            #@ The last digit on its own is a letter if it is 1-9.
            if s[i - 1] != "0":
                dp[i] += dp[i - 1]  #!
            #@ The last two digits together are a letter if they form 10-26.
            if i >= 2 and 10 <= int(s[i - 2:i]) <= 26:
                dp[i] += dp[i - 2]  #!
        #@ The whole string is the prefix of length n.
        return dp[len(s)]`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy:
        'One pass with constant work per character. The dp list has n + 1 entries (two rolling variables would make it O(1)).',
      pitfalls: [
        '"0" can never stand alone. It must be the second digit of "10" or "20".',
        'Pieces with a leading zero like "05" are invalid; checking `10 <= value <= 26` rejects them automatically.',
        '`dp[0] = 1` looks odd, but it means "one way to have decoded nothing", which lets the first valid piece count once.',
      ],
    },
    {
      id: 'coin-change',
      num: 322,
      title: 'Coin Change',
      difficulty: 'Medium',
      category: 'dp-1d',
      pattern: 'Bottom-up min-coins DP over amounts',
      prompt:
        'You have an unlimited supply of coins with the values in `coins`. Return the **fewest** coins needed to make exactly `amount`. If it cannot be done, return `-1`.',
      examples: [
        {
          input: 'coins = [1, 4, 6], amount = 8',
          output: '2',
          note: '4 + 4. Greedy (6 + 1 + 1) would use 3 coins.',
        },
        { input: 'coins = [5, 10], amount = 3', output: '-1' },
      ],
      signals: [
        '"fewest coins / items" to reach an exact total',
        'each item can be reused any number of times',
        'greedy fails on a small example',
      ],
      hints: [
        'Try greedy (biggest coin first) on coins [1, 4, 6] and amount 8. Why does it fail?',
        'Let `dp[a]` = fewest coins that make amount `a`. If the **last** coin used is `c`, the rest is `dp[a - c]`.',
        '`dp[a] = 1 + min(dp[a - c])` over every coin `c <= a`, with `dp[0] = 0`. Fill `a` from 1 up to `amount`.',
      ],
      brute:
        'Recursively try every coin at every step until the amount hits 0. The same leftover amounts are solved again and again: **exponential** time.',
      insight:
        'Whatever the best way to make `a` is, it ends with some coin `c`, and the rest must be a best way to make `a - c`. So `dp[a] = 1 + min(dp[a - c])`, built from 0 up to `amount`.',
      mnemonic: 'Last coin c: one plus the best for a − c.',
      steps: [
        'Create dp of size amount + 1 filled with a too-big value, and set dp[0] = 0.',
        'Loop a from 1 up to amount.',
        'For each coin that fits in a, try dp[a - coin] + 1 and keep the smaller value.',
        'If dp[amount] is still the too-big value, return -1; otherwise return it.',
      ],
      solution: py`
class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        #@ dp[a] = fewest coins that make a. amount + 1 means "impossible" (no answer is that big).
        dp = [amount + 1] * (amount + 1)
        dp[0] = 0  #!
        #@ Build up from small amounts to the target.
        for a in range(1, amount + 1):
            #@ Try each coin as the LAST coin: one coin plus the best way to make the rest.
            for coin in coins:
                if coin <= a:
                    dp[a] = min(dp[a], dp[a - coin] + 1)  #!
        #@ Still at the "impossible" value means no combination works.
        return dp[amount] if dp[amount] <= amount else -1`,
      time: 'O(amount · k)',
      space: 'O(amount)',
      complexityWhy: 'For each of the `amount` values we try all k coins. The dp list has amount + 1 entries.',
      pitfalls: [
        'Greedy (always the biggest coin) is wrong: `[1, 4, 6]` with 8 gives 3 coins instead of 2.',
        'Use a sentinel bigger than any real answer (`amount + 1` or `float("inf")`) and turn it into -1 at the end.',
        '`dp[0] = 0`: making 0 needs no coins. Forgetting it leaves every amount "impossible".',
      ],
    },
    {
      id: 'maximum-product-subarray',
      num: 152,
      title: 'Maximum Product Subarray',
      difficulty: 'Medium',
      category: 'dp-1d',
      pattern: 'Track max and min product ending here',
      alsoAccept: ['greedy'],
      prompt:
        'Given a list of integers `nums` (it may contain negatives and zeros), find the non-empty contiguous subarray with the **largest product** and return that product.',
      examples: [
        { input: 'nums = [-2, 3, -4]', output: '24', note: 'The whole list: two negatives make a positive.' },
        { input: 'nums = [0, -3, 1]', output: '1' },
      ],
      signals: [
        '"contiguous subarray" with the "largest product"',
        'negative numbers can flip the sign',
        'zeros wipe the product out',
      ],
      hints: [
        'For the largest **sum** you track the best sum ending at each index. Why is a product trickier?',
        'A very negative product can become the biggest one after multiplying by another negative. So track the smallest product too.',
        'At each x: new max = max(x, max · x, min · x) and new min = min of the same three. Update the answer with the new max.',
      ],
      brute: 'Try every start and end, multiplying as you go: **O(n²)**.',
      insight:
        'Keep **both** the largest and the smallest product of a subarray ending at the current index. A negative number swaps their roles, and the "start fresh at x" option handles zeros.',
      mnemonic: 'Track the max and the min; negatives swap them.',
      steps: [
        'Start best, cur_max and cur_min at nums[0].',
        'Loop over the remaining numbers.',
        'Build three candidates: x alone, cur_max times x, and cur_min times x.',
        'Set cur_max to the largest candidate and cur_min to the smallest.',
        'Update best with cur_max, and return best at the end.',
      ],
      solution: py`
class Solution:
    def maxProduct(self, nums: List[int]) -> int:
        #@ The best and worst products of a subarray ending at index 0 are just nums[0].
        best = cur_max = cur_min = nums[0]
        #@ For each next number, the subarray ending here starts fresh at x or extends the previous one.
        for x in nums[1:]:
            #@ A negative x turns the smallest product into the biggest, so try all three options.
            candidates = (x, cur_max * x, cur_min * x)  #!
            cur_max = max(candidates)  #!
            cur_min = min(candidates)  #!
            #@ Record the best product seen at any ending position, and return it at the end.
            best = max(best, cur_max)
        return best`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy: 'One pass with constant work per number, keeping only three variables.',
      pitfalls: [
        'Updating `cur_max` first and then using the **new** value to compute `cur_min`. Build both from the old values (the tuple does that).',
        'Leaving out the "start fresh" option `x` breaks on zeros: after a 0, both products would stay stuck at 0.',
        'Starting `best` at 0 is wrong for `[-5]`. Start from `nums[0]`.',
      ],
    },
    {
      id: 'word-break',
      num: 139,
      title: 'Word Break',
      difficulty: 'Medium',
      category: 'dp-1d',
      pattern: 'Boolean DP over end positions',
      prompt:
        'Given a string `s` and a list of words `wordDict`, return `True` if `s` can be cut into a sequence of one or more dictionary words (each word may be used many times). Otherwise return `False`.',
      examples: [
        {
          input: 's = "sunflower", wordDict = ["sun", "flower", "flow"]',
          output: 'True',
          note: '"sun" + "flower".',
        },
        {
          input: 's = "dogsat", wordDict = ["dogs", "dog", "sa"]',
          output: 'False',
          note: '"dog" + "sa" leaves "t", and "dogs" leaves "at".',
        },
      ],
      signals: [
        '"can the string be segmented into dictionary words"',
        'words can be reused',
        'a yes/no answer that depends on prefixes',
      ],
      hints: [
        'Suppose you already know which **prefixes** of `s` can be cut into words. How could you decide about a longer prefix?',
        '`s[:i]` can be cut if there is a split point `j` where `s[:j]` can be cut **and** `s[j:i]` is a word.',
        'Let `dp[i]` = can `s[:i]` be cut into words, with `dp[0] = True`. For each i, check every j < i.',
      ],
      brute:
        'Recursively try every word that matches the start of the remaining string. Inputs like "aaaa...ab" re-check the same suffixes over and over: **exponential** time.',
      insight:
        '`dp[i]` asks "can the first `i` letters be cut into words?". It is True when some earlier split point `j` is True and the piece `s[j:i]` is a word. Fill it from left to right over **end positions**.',
      mnemonic: 'Good prefix + dictionary word = a longer good prefix.',
      steps: [
        'Put the dictionary words into a set.',
        'Create dp of length n + 1, all False except dp[0] = True.',
        'For each end position i, try every split point j before it.',
        'If dp[j] is True and s[j:i] is a word, set dp[i] to True and stop trying.',
        'Return dp[n].',
      ],
      solution: py`
class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:
        #@ A set makes "is this a word?" an O(1) question.
        words = set(wordDict)
        #@ dp[i] = True if the first i letters can be cut into words. The empty prefix always can.
        dp = [False] * (len(s) + 1)
        dp[0] = True
        #@ For every end position i, look for a split point j.
        for i in range(1, len(s) + 1):
            for j in range(i):
                #@ s[:j] cuts fine AND s[j:i] is a word, so s[:i] cuts fine too.
                if dp[j] and s[j:i] in words:  #!
                    dp[i] = True  #!
                    break
        #@ Can the whole string be cut?
        return dp[len(s)]`,
      time: 'O(n³)',
      space: 'O(n + w)',
      complexityWhy:
        'There are O(n²) pairs (j, i), and slicing and hashing each piece costs up to O(n). The dp list has n + 1 entries and the set holds the w dictionary characters.',
      pitfalls: [
        'Greedy (always take the longest matching word) fails: for "penny" with ["pen", "penn", "ny"] it takes "penn" and gets stuck on "y".',
        'Checking `in` on a list instead of a set makes every lookup slow.',
        'Speed-up: only try split points where `i - j` is at most the length of the longest word.',
        'Forgetting `dp[0] = True` makes every entry False.',
      ],
    },
    {
      id: 'longest-increasing-subsequence',
      num: 300,
      title: 'Longest Increasing Subsequence',
      difficulty: 'Medium',
      category: 'dp-1d',
      pattern: 'DP: longest run ending at each index',
      alsoAccept: ['binary-search'],
      prompt:
        'Given a list `nums`, return the length of its longest **strictly increasing subsequence**. A subsequence keeps the original order but may skip elements.',
      examples: [
        { input: 'nums = [3, 1, 8, 2, 5]', output: '3', note: 'For example [1, 2, 5].' },
        { input: 'nums = [5, 4, 3]', output: '1', note: 'Any single element is increasing on its own.' },
      ],
      signals: [
        '"longest increasing subsequence"',
        '"subsequence": you may skip elements but must keep the order',
        'length up to a few thousand, so O(n²) is fine',
      ],
      hints: [
        'Ask a smaller question: what is the longest increasing subsequence that **ends exactly at** index i?',
        'If `nums[j] < nums[i]` for some earlier j, you can extend the best subsequence ending at j by one.',
        '`dp[i] = 1 + max(dp[j])` over all j < i with `nums[j] < nums[i]` (or just 1 if there is none). The answer is `max(dp)`.',
      ],
      brute: 'Generate all 2ⁿ subsequences and keep the longest increasing one: **O(2ⁿ · n)**.',
      insight:
        'Define `dp[i]` = length of the longest increasing subsequence **ending at** `nums[i]`. It extends the best earlier ending with a smaller value. The answer can end anywhere, so return `max(dp)`.',
      mnemonic: 'Ending here: one more than the best smaller one before me.',
      steps: [
        'Create dp with a 1 for every index (each element alone).',
        'For each index i, look at every earlier index j.',
        'If nums[j] < nums[i], set dp[i] to the larger of dp[i] and dp[j] + 1.',
        'Return the largest value in dp.',
      ],
      solution: py`
class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        #@ dp[i] = length of the longest increasing subsequence that ENDS at nums[i]. Alone, it is 1.
        dp = [1] * len(nums)
        #@ For each i, look back at every earlier element j.
        for i in range(len(nums)):
            for j in range(i):
                #@ A smaller earlier value can be extended by nums[i].
                if nums[j] < nums[i]:
                    dp[i] = max(dp[i], dp[j] + 1)  #!
        #@ The best subsequence can end anywhere, so take the max over all endings.
        return max(dp)  #!`,
      time: 'O(n²)',
      space: 'O(n)',
      complexityWhy: 'Two nested loops over the list. The dp list has one entry per element.',
      pitfalls: [
        'Returning `dp[-1]` instead of `max(dp)`: the longest subsequence does not have to end at the last element.',
        'Using `<=` would count equal values, but the problem asks for **strictly** increasing.',
        'Follow-up: the O(n log n) "patience sorting" version keeps a list `tails` and uses `bisect_left` to place each number. Worth knowing, but O(n²) is a fine first answer.',
      ],
    },
    {
      id: 'partition-equal-subset-sum',
      num: 416,
      title: 'Partition Equal Subset Sum',
      difficulty: 'Medium',
      category: 'dp-1d',
      pattern: 'Subset-sum DP (set of reachable sums)',
      prompt:
        'Given a list of positive integers `nums`, return `True` if you can split it into **two groups with equal sums**, and `False` otherwise. Every number must go into exactly one group.',
      examples: [
        { input: 'nums = [3, 1, 4, 2]', output: 'True', note: '3 + 2 = 1 + 4 = 5.' },
        { input: 'nums = [2, 3, 7]', output: 'False', note: 'The total is 12, but no group adds up to 6.' },
      ],
      signals: [
        '"split into two subsets with equal sum"',
        'each element is used once: in or out',
        'a yes/no question about hitting an exact target sum (0/1 knapsack)',
      ],
      hints: [
        'If the two groups are equal, what must each one add up to?',
        'Each group sums to total / 2. So the real question is: does some subset add up to exactly total / 2?',
        'Keep a set of every sum you can reach. For each number, add it to every sum already in the set.',
      ],
      brute: 'Try all 2ⁿ ways to put each number in group A or group B: **O(2ⁿ)**.',
      insight:
        'Equal halves means one group sums to exactly `total / 2`. Track every **reachable subset sum**: each new number either stays out (the old sums) or joins (old sums + x).',
      mnemonic: 'Half the total; grow the set of reachable sums.',
      steps: [
        'Compute the total; if it is odd, return False.',
        'Set the target to half of the total.',
        'Start a set of reachable sums containing only 0.',
        'For each number, add number + s for every reachable s that stays at most the target.',
        'Return True as soon as the target is reachable, or False after the last number.',
      ],
      solution: py`
class Solution:
    def canPartition(self, nums: List[int]) -> bool:
        #@ Two equal halves need an even total.
        total = sum(nums)
        if total % 2 == 1:
            return False
        #@ The real question: can some subset add up to exactly half?
        target = total // 2  #!
        #@ reachable = every subset sum we can make from the numbers seen so far.
        reachable = {0}
        for x in nums:
            #@ x stays out (old sums) or joins (old sums + x). New sums are built from the OLD set.
            reachable |= {s + x for s in reachable if s + x <= target}  #!
            #@ Stop as soon as half is reachable.
            if target in reachable:
                return True
        #@ We used every number and never hit half.
        return False`,
      time: 'O(n · target)',
      space: 'O(target)',
      complexityWhy:
        'The set never holds more than target + 1 sums, and each of the n numbers scans it once.',
      pitfalls: [
        'Odd totals can never split evenly, so check that first.',
        'Adding to the set while looping over it would let one number be used twice. Build the new sums from the **old** set first.',
        'The 1-D boolean list version (`dp[s] = dp[s] or dp[s - x]`) must loop `s` from **high to low** for the same reason.',
        'Capping sums at the target keeps the set small.',
      ],
    },
  ],
};

export default content;
