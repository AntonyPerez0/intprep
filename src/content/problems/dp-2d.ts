import { py, type CategoryContent } from '../types';

const content: CategoryContent = {
  guide: {
    category: 'dp-2d',
    summary: `In **1-D DP** the answer depended on one changing thing: "the best answer from index \`i\` onward". In **2-D DP**, **two things change independently**, so the state is a pair \`(i, j)\` and your memo becomes a **grid**.

Common pairs: a position in each of two strings, a row and a column, an index and an amount still to make, or a day and a "mode" (holding a stock or not).

**Draw the grid.** Each cell \`dp[i][j]\` is one small subproblem. The recurrence says which neighboring cells it is built from (below, right, diagonal...), and the final answer sits in a corner.

There are two ways to fill it. **Top-down:** write the recursive function \`dp(i, j)\` and put \`@cache\` on it, so each cell is computed only once. **Bottom-up:** make a 2-D list and fill it with two loops, in an order where every cell the formula reads is already filled.`,
    analogy:
      'A 2-D DP table is a spreadsheet where every cell holds a formula pointing at its neighbors. Fill the cells in an order where the neighbors are already done, and the corner cell holds your answer.',
    whenToUse: [
      'Two strings or arrays are compared letter by letter (common subsequence, edit distance, interleaving) → state `(i, j)` = position in each',
      'You move through a grid, usually only right or down → state `(row, col)`',
      'An index plus an amount left or a running total (coins, target sums) → state `(i, amount)`',
      'An index plus a mode such as "holding a stock" → state `(i, holding)`',
      'You pick something inside a range and it splits the range in two (Burst Balloons) → interval state `(left, right)`',
      '1-D DP *almost* works, "if only I also knew X" → make X the second dimension',
    ],
    template: py`
from functools import cache

# Top-down: describe the answer for state (i, j); @cache remembers it.
def solve(a, b):
    @cache
    def dp(i, j):                         # best answer for a[i:] and b[j:]
        if i == len(a) or j == len(b):    # walked off an edge of the grid
            return BASE
        # try each choice; every choice moves to a smaller state
        return best(dp(i + 1, j), dp(i, j + 1), dp(i + 1, j + 1))
    return dp(0, 0)

# Bottom-up: the same recurrence written into a table.
def solve_table(a, b):
    m, n = len(a), len(b)
    dp = [[BASE] * (n + 1) for _ in range(m + 1)]   # extra row/col = base cases
    for i in range(m - 1, -1, -1):                  # dp[i][j] reads row i + 1 ...
        for j in range(n - 1, -1, -1):              # ... and column j + 1: go backwards
            dp[i][j] = best(dp[i + 1][j], dp[i][j + 1], dp[i + 1][j + 1])
    return dp[0][0]`,
    templateNotes: [
      'Say the state out loud before coding: "`dp(i, j)` is the answer for `a[i:]` and `b[j:]`". If you cannot finish that sentence, you do not have a state yet.',
      '`@cache` remembers the result for every `(i, j)`, so each of the m × n states is computed once. LeetCode pre-imports it; in your own files write `from functools import cache`.',
      '**Iteration order:** look at which cells the recurrence reads. Reads row `i + 1`? Loop `i` from the bottom up. Reads row `i - 1`? Loop from the top down. Interval problems loop by gap **length**, short gaps first.',
      'The extra row and column (an `(m + 1) × (n + 1)` grid) hold the base cases such as "one string is empty", so the main loops need no special cases.',
      'If each row only reads the row next to it, keep one or two rows instead of the whole grid: O(n) space instead of O(m · n).',
    ],
    complexity: 'Usually O(m · n) time and space: one O(1) step per cell. A rolling row cuts space to O(n).',
    quiz: [
      {
        q: 'Why does Longest Common Subsequence need a **2-D** state?',
        options: [
          'Because the strings contain letters',
          'Because the answer can be larger than 9',
          'Because two positions, one in each string, move independently',
          'Because it uses recursion',
        ],
        answer: 2,
        explain:
          'A subproblem is "text1 from `i` onward" paired with "text2 from `j` onward". Two independent indices give a grid of states.',
      },
      {
        q: 'A bottom-up table uses `dp[i][j] = dp[i + 1][j] + dp[i][j + 1]`. In which order should you fill it?',
        options: [
          '`i` and `j` both from the end down to 0',
          '`i` and `j` both from 0 upward',
          'Any order works',
          'Only along the main diagonal',
        ],
        answer: 0,
        explain:
          'Each cell reads the cell below (`i + 1`) and the cell to the right (`j + 1`), so those must already be filled: loop backwards in both.',
      },
      {
        q: 'What does putting `@cache` on a recursive function `dp(i, j)` do?',
        options: [
          'Runs the recursive calls in parallel',
          'Remembers the result for each `(i, j)` so it is computed only once',
          'Sorts the inputs first',
          'Removes the need for a base case',
        ],
        answer: 1,
        explain:
          'Without the cache the same `(i, j)` is solved again and again (exponential time). With it, each state is solved once: about m × n work.',
      },
      {
        q: 'Row `r` of your grid only ever reads row `r - 1`. How much memory do you really need?',
        options: ['The whole m × n grid', 'Nothing extra: O(1)', 'A hash map of every path', 'One row (or two): O(n)'],
        answer: 3,
        explain:
          'Once row `r` is built, row `r - 1` is never read again, so you can overwrite it. This is the rolling-row trick from Unique Paths.',
      },
    ],
  },

  problems: [
    {
      id: 'unique-paths',
      num: 62,
      title: 'Unique Paths',
      difficulty: 'Medium',
      category: 'dp-2d',
      pattern: 'Grid DP with a rolling row',
      prompt:
        'A robot stands in the top-left cell of a grid with `m` rows and `n` columns. Each move goes **one cell right or one cell down**. Count how many different routes take it to the bottom-right cell.',
      examples: [
        { input: 'm = 3, n = 3', output: '6' },
        { input: 'm = 2, n = 4', output: '4', note: 'The single "down" move can happen in any of the 4 columns.' },
        { input: 'm = 1, n = 5', output: '1', note: 'One row: the only route is straight right.' },
      ],
      signals: [
        '"count the number of paths / ways"',
        'grid where you only move right or down',
        'each cell is entered from the cell above or the cell to its left',
      ],
      hints: [
        'How many routes reach a cell in the top row? In the left column?',
        'To arrive at a cell you must come from above or from the left. How do those two counts combine?',
        '`ways(r, c) = ways(r - 1, c) + ways(r, c - 1)`. You only need the previous row, so keep one row and update it in place.',
      ],
      brute:
        'Recursively try both moves from every cell and count the routes that reach the corner. Every route has m + n − 2 moves with 2 choices each, so this is about **O(2^(m+n))**.',
      insight:
        'The number of routes to a cell = routes to the cell **above** + routes to the cell on the **left**. Fill the grid row by row; one row of memory is enough.',
      mnemonic: 'Routes here = routes from above + routes from the left.',
      steps: [
        'Create a row of n ones: every top-row cell has exactly one route.',
        'Repeat for each of the remaining m − 1 rows.',
        'For every column except the first, add the count on its left to the count already there (from above).',
        'Return the last value in the row.',
      ],
      solution: py`
class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        #@ row[c] = number of routes to column c of the current row. In the top row there is exactly one route to each cell: keep moving right.
        row = [1] * n
        #@ Build the remaining m - 1 rows one at a time, reusing the same list.
        for _ in range(1, m):
            #@ Column 0 stays 1 (you can only come straight down). For every other cell, row[c] still holds the count from the cell ABOVE; add the count from the cell to the LEFT.
            for c in range(1, n):
                row[c] += row[c - 1]  #!
        #@ After the last row, the final cell is the bottom-right corner.
        return row[n - 1]`,
      time: 'O(m · n)',
      space: 'O(n)',
      complexityWhy: 'Every cell is filled once with one addition, and we only store one row of n numbers.',
      pitfalls: [
        'Starting the inner loop at column 0 reads `row[-1]`, which in Python is the **last** element, and corrupts the counts.',
        'Building the full m × n grid also works, but the row above is all you ever read.',
        'Math shortcut: the answer is the binomial coefficient `math.comb(m + n - 2, m - 1)` (choose which moves go down).',
      ],
    },
    {
      id: 'longest-common-subsequence',
      num: 1143,
      title: 'Longest Common Subsequence',
      difficulty: 'Medium',
      category: 'dp-2d',
      pattern: 'Two-string DP table',
      prompt:
        'Given two strings `text1` and `text2`, return the length of their **longest common subsequence**: the longest string you can get from both by deleting some characters (or none) **without reordering** the rest. If they share nothing, return 0.',
      examples: [
        { input: 'text1 = "badge", text2 = "bridge"', output: '4', note: '"bdge" can be formed from both.' },
        { input: 'text1 = "cat", text2 = "dog"', output: '0' },
      ],
      signals: [
        'two strings compared character by character',
        '"subsequence": order kept, gaps allowed',
        '"longest" common part',
      ],
      hints: [
        'Look at the first character of each string. What can you do if they are equal? What if they differ?',
        'If they are equal, it is safe to pair them and move on in both. If not, at least one of them is not in the answer, so try dropping each.',
        '`dp[i][j] = 1 + dp[i + 1][j + 1]` when the characters match, otherwise `max(dp[i + 1][j], dp[i][j + 1])`. Fill from the bottom-right.',
      ],
      brute:
        'Generate every subsequence of `text1` (2^m of them) and check each one against `text2`. That is **O(2^m · n)**, hopeless beyond about 20 characters.',
      insight:
        'Compare the first characters of the two remaining suffixes. If they match, pair them: **1 + the answer for the rest of both**. If not, one of them is unused: **take the better of skipping either one**. Every `(i, j)` pair is one cell in a grid.',
      mnemonic: 'Match: 1 + diagonal. No match: max of below and right.',
      steps: [
        'Make an (m + 1) × (n + 1) grid of zeros; the extra row and column mean "empty suffix".',
        'Loop i from the end of text1 back to 0, and j from the end of text2 back to 0.',
        'If text1[i] equals text2[j], set the cell to 1 + the diagonal cell dp[i + 1][j + 1].',
        'Otherwise set it to the larger of the cell below and the cell to the right.',
        'Return the top-left cell dp[0][0].',
      ],
      solution: py`
class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        #@ dp[i][j] = LCS length of the suffixes text1[i:] and text2[j:]. The extra last row and column stand for an empty suffix, whose LCS is 0.
        m, n = len(text1), len(text2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        #@ Each cell reads the cells below and to the right, so fill from the bottom-right corner backwards.
        for i in range(m - 1, -1, -1):
            for j in range(n - 1, -1, -1):
                #@ Same character: pair them up, then solve the rest of both strings (the diagonal cell).
                if text1[i] == text2[j]:
                    dp[i][j] = 1 + dp[i + 1][j + 1]  #!
                #@ Different: skip a character from one string or the other, and keep the better result.
                else:
                    dp[i][j] = max(dp[i + 1][j], dp[i][j + 1])  #!
        #@ The full strings start at the top-left cell.
        return dp[0][0]`,
      time: 'O(m · n)',
      space: 'O(m · n)',
      complexityWhy:
        'There are (m + 1) × (n + 1) cells, each filled in O(1) from cells already computed. Keeping only two rows would cut space to O(n).',
      pitfalls: [
        'Building the grid with `[[0] * (n + 1)] * (m + 1)` makes every row the **same list**, so editing one row edits them all. Use a list comprehension.',
        'Without the extra row and column, `dp[i + 1][j + 1]` runs off the end of the grid.',
        'Subsequence is not substring: the matched characters may have gaps between them.',
      ],
    },
    {
      id: 'best-time-to-buy-and-sell-stock-with-cooldown',
      num: 309,
      title: 'Best Time to Buy and Sell Stock with Cooldown',
      difficulty: 'Medium',
      category: 'dp-2d',
      pattern: 'State-machine DP on (day, can buy)',
      alsoAccept: ['dp-1d'],
      prompt:
        '`prices[i]` is the price of a stock on day `i`. You may buy and sell as many times as you like, but you can hold **at most one share** at a time, and on the **day right after you sell** you must rest (no buying). Return the maximum total profit.',
      examples: [
        {
          input: 'prices = [1, 4, 2, 7]',
          output: '6',
          note: 'Selling at 4 and rebuying at 2 is blocked by the cooldown, so buy at 1 and sell at 7.',
        },
        { input: 'prices = [3, 1, 5, 0, 0, 4]', output: '8', note: 'Buy 1, sell 5, rest, buy 0, sell 4.' },
        { input: 'prices = [9, 7, 2]', output: '0', note: 'Prices only fall, so never buy.' },
      ],
      signals: [
        'buy and sell many times, one share at a time',
        'a "cooldown" or waiting rule after an action',
        'what you may do today depends on what you did before (a state)',
      ],
      hints: [
        'On any day, what are your options? Do they depend on whether you currently own a share?',
        'The state is (day, are you allowed to buy?). Each day you either act or rest.',
        'Selling on day `i` means the next day you could buy is `i + 2`. Memoize `dfs(i, buying)`.',
      ],
      brute:
        'Try every choice (buy, sell or rest) on every day: roughly **O(2^n)** branches, far too slow for thousands of days.',
      insight:
        'Each day you are in one of two states, **able to buy** or **holding a share**, and you either act or rest. Selling jumps you **two** days ahead because of the cooldown. Caching the pair `(day, state)` leaves only 2n subproblems.',
      mnemonic: 'Buy, sell, or wait; selling skips a day.',
      steps: [
        'Define dfs(i, buying) as the best profit from day i onward in that state, and cache it.',
        'If i is past the last day, return 0.',
        'Work out the profit of resting today: dfs(i + 1, buying).',
        'If you may buy, take the better of resting and buying: dfs(i + 1, False) − prices[i].',
        'If you hold a share, take the better of resting and selling: dfs(i + 2, True) + prices[i].',
        'Return dfs(0, True).',
      ],
      solution: py`
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        #@ State = (day i, are we allowed to buy?). dfs(i, buying) = best profit from day i onward. @cache remembers every state.
        @cache
        def dfs(i, buying):
            #@ Past the last day: nothing more to earn.
            if i >= len(prices):
                return 0
            #@ Option 1: rest today. We stay in the same state.
            rest = dfs(i + 1, buying)
            #@ Option 2a: if we may buy, pay today's price and move on holding a share.
            if buying:
                buy = dfs(i + 1, False) - prices[i]  #!
                return max(buy, rest)
            #@ Option 2b: if we hold a share, sell at today's price. The cooldown blocks tomorrow, so jump to day i + 2.
            sell = dfs(i + 2, True) + prices[i]  #!
            return max(sell, rest)
        #@ Day 0, holding nothing, so we are allowed to buy.
        return dfs(0, True)`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy:
        'There are n days × 2 states = 2n cached subproblems, each doing O(1) work. The cache and the recursion stack take O(n).',
      pitfalls: [
        'Selling must jump to `i + 2`, not `i + 1`: that single character is the cooldown.',
        'The base case must be `i >= len(prices)`, not `==`, because `i + 2` can step past the end.',
        'Thousands of days means thousands of nested calls. If you hit a recursion limit, use the O(1)-space state machine: keep `hold`, `sold` and `rest` profits and update all three each day.',
      ],
    },
    {
      id: 'coin-change-ii',
      num: 518,
      title: 'Coin Change II',
      difficulty: 'Medium',
      category: 'dp-2d',
      pattern: 'Unbounded knapsack: count combinations',
      alsoAccept: ['dp-1d'],
      prompt:
        'You have an unlimited supply of each coin value in `coins`. Return **how many different combinations** of coins add up to exactly `amount`. Order does not matter: 1 + 2 and 2 + 1 are the same combination. If nothing works, return 0.',
      examples: [
        { input: 'amount = 4, coins = [1, 2]', output: '3', note: '1+1+1+1, 1+1+2 and 2+2.' },
        { input: 'amount = 3, coins = [2]', output: '0' },
        { input: 'amount = 0, coins = [4, 7]', output: '1', note: 'Taking no coins is one way to make 0.' },
      ],
      signals: [
        '"number of combinations" that make an amount',
        'each coin can be used **unlimited** times',
        'order does not matter (combinations, not sequences)',
      ],
      hints: [
        'If you count 1+2 and 2+1 separately, you are counting orders. How can you force every combination into one fixed order?',
        'Allow the coins one at a time: first count the ways using only the first coin, then also allow the second coin, and so on.',
        'Coins in the outer loop, amounts in the inner loop: `ways[a] += ways[a - coin]`.',
      ],
      brute:
        'Recursively decide how many of each coin to take. With many coins and a large amount the branches explode: **exponential** time.',
      insight:
        'Picture a grid: rows = coins allowed so far, columns = amounts. A cell either **skips the new coin** (the value from the row above) or **uses it once more** (the value `coin` columns to the left in the same row). Each row only needs itself and the row above, so one list updated in place is enough.',
      mnemonic: 'Coins outside, amounts inside: ways[a] += ways[a − coin].',
      steps: [
        'Make a list ways of size amount + 1 filled with 0, and set ways[0] = 1.',
        'Loop over each coin in the outer loop.',
        'For every amount a from that coin up to the target, add ways[a − coin] to ways[a].',
        'Return ways[amount].',
      ],
      solution: py`
class Solution:
    def change(self, amount: int, coins: List[int]) -> int:
        #@ ways[a] = number of combinations that make amount a with the coins allowed so far. There is exactly one way to make 0: take nothing.
        ways = [0] * (amount + 1)
        ways[0] = 1
        #@ Coins go in the OUTER loop. Each coin joins the toolbox once, so every combination is built in one fixed coin order and never counted twice.
        for coin in coins:  #!
            #@ Walk amounts upward. ways[a] already counts the ways WITHOUT this coin; add the ways that use it at least once (ways[a - coin], which already includes this coin, so it can repeat).
            for a in range(coin, amount + 1):
                ways[a] += ways[a - coin]  #!
        #@ All coins allowed: the count for the target amount.
        return ways[amount]`,
      time: 'O(n · amount)',
      space: 'O(amount)',
      complexityWhy: 'For each of the n coins we sweep every amount once. Only one list of size amount + 1 is kept.',
      pitfalls: [
        'Swapping the loops (amounts outside, coins inside) counts **orderings**: 1+2 and 2+1 would be two ways.',
        'Forgetting `ways[0] = 1`: every count is built from it, so everything stays 0.',
        'Looping the amounts **downward** lets each coin be used at most once. That is the 0/1 knapsack, a different problem.',
      ],
    },
    {
      id: 'target-sum',
      num: 494,
      title: 'Target Sum',
      difficulty: 'Medium',
      category: 'dp-2d',
      pattern: 'Memo on (index, running total)',
      prompt:
        'You are given a list `nums` and a number `target`. Put a `+` or a `-` sign in front of **every** number, then add them all up. Count how many sign choices give exactly `target`.',
      examples: [
        { input: 'nums = [2, 1, 1], target = 2', output: '2', note: '+2 +1 −1 and +2 −1 +1.' },
        { input: 'nums = [1, 2, 3], target = 0', output: '2', note: '+1 +2 −3 and −1 −2 +3.' },
        { input: 'nums = [5], target = 3', output: '0' },
      ],
      signals: [
        'each element gets one of two choices (+ or −)',
        '"count the number of ways" to reach a target',
        'the running total can only take a limited range of values',
      ],
      hints: [
        'The brute force is a decision tree: at each number, go + or −. How big does it get?',
        'Many branches arrive at the same index with the same running total. Do they need to be solved separately?',
        'Memoize `count(i, total)` = number of ways to finish from index `i` when the sum so far is `total`.',
      ],
      brute:
        'Try all 2^n sign patterns: **O(2^n)**. With 20 numbers that is a million paths, many repeating the same work.',
      insight:
        'What happens next depends only on **where you are** (`i`) and **the sum so far** (`total`). Cache that pair and the exponential tree collapses to at most n × (number of possible totals) states.',
      mnemonic: 'Plus or minus each; cache (index, total); add the ways.',
      steps: [
        'Define a cached count(i, total).',
        'If i equals len(nums), return 1 when total equals target, otherwise 0.',
        'Otherwise add the ways using +nums[i] to the ways using −nums[i].',
        'Return count(0, 0).',
      ],
      solution: py`
class Solution:
    def findTargetSumWays(self, nums: List[int], target: int) -> int:
        #@ State = (index i, running total so far). count(i, total) = number of ways to finish from here and land exactly on target.
        @cache
        def count(i, total):
            #@ Every number has a sign: this path counts only if the total hit the target.
            if i == len(nums):
                return 1 if total == target else 0  #!
            #@ Two choices for nums[i], add it or subtract it. Different choices are different ways, so add the counts.
            return count(i + 1, total + nums[i]) + count(i + 1, total - nums[i])  #!
        #@ Start before the first number with a total of 0.
        return count(0, 0)`,
      time: 'O(n · S)',
      space: 'O(n · S)',
      complexityWhy:
        'S is the sum of all the numbers, so the running total is always between −S and S. That gives at most n × (2S + 1) cached states, each O(1).',
      pitfalls: [
        'The base case must check `total == target`; returning 1 for every finished path just counts all 2^n patterns.',
        'Without `@cache` this is plain backtracking and times out.',
        'A 0 in `nums` doubles the count (+0 and −0 are different choices). The recursion handles this automatically.',
        'Faster trick: the plus-numbers must sum to `(sum(nums) + target) / 2`, turning this into a 1-D counting subset-sum.',
      ],
    },
    {
      id: 'interleaving-string',
      num: 97,
      title: 'Interleaving String',
      difficulty: 'Medium',
      category: 'dp-2d',
      pattern: 'Two-string DP on (i, j)',
      prompt:
        "Given strings `s1`, `s2` and `s3`, decide whether `s3` can be built by **interleaving** `s1` and `s2`: using all of their characters, keeping each string's own order, but switching between them as often as you like.",
      examples: [
        { input: 's1 = "ab", s2 = "cd", s3 = "acbd"', output: 'True', note: 'a (s1), c (s2), b (s1), d (s2).' },
        { input: 's1 = "ab", s2 = "cd", s3 = "adbc"', output: 'False', note: 'The d of s2 cannot come before its c.' },
        {
          input: 's1 = "aa", s2 = "ab", s3 = "aaba"',
          output: 'True',
          note: 'a (s1), a (s2), b (s2), a (s1). Always taking from s1 first would get stuck.',
        },
      ],
      signals: [
        'three strings, one built from the other two',
        'both sources must keep their own order',
        'when both strings offer the same next letter, you must try both',
      ],
      hints: [
        'Why does a simple two-pointer walk fail? Try s1 = "aa", s2 = "ab", s3 = "aaba".',
        'If you have used `i` letters of s1 and `j` letters of s2, which letter of s3 comes next?',
        'Memoize `can(i, j)`: the next letter is `s3[i + j]`; try taking it from s1 or from s2.',
      ],
      brute:
        'At every step, branch on taking the next letter from s1 or from s2: up to **O(2^(m+n))** paths, re-exploring the same positions over and over.',
      insight:
        'Once you know how many letters you have taken from each string (`i` and `j`), your position in `s3` is fixed at `i + j`. So the whole situation is just the pair `(i, j)`: memoize it.',
      mnemonic: 'Next letter is s3[i + j]: take it from s1 or s2.',
      steps: [
        'If len(s1) + len(s2) is not len(s3), return False.',
        'Define a cached can(i, j): can the rest of s3 be built from s1[i:] and s2[j:]?',
        'If both strings are used up, return True.',
        'If s1[i] matches s3[i + j] and can(i + 1, j) works, return True.',
        'If s2[j] matches s3[i + j] and can(i, j + 1) works, return True.',
        'Otherwise return False; the answer is can(0, 0).',
      ],
      solution: py`
class Solution:
    def isInterleave(self, s1: str, s2: str, s3: str) -> bool:
        #@ Every letter must be used exactly once, so the lengths have to add up.
        if len(s1) + len(s2) != len(s3):
            return False
        #@ can(i, j) = can the rest of s3 be built from s1[i:] and s2[j:]?
        @cache
        def can(i, j):
            #@ Both strings fully used means s3 is fully built: success.
            if i == len(s1) and j == len(s2):
                return True
            #@ We have used i letters of s1 and j of s2, so the next letter to produce is s3[i + j].
            k = i + j  #!
            #@ Option 1: the next letter of s1 matches, and the rest works out.
            if i < len(s1) and s1[i] == s3[k] and can(i + 1, j):  #!
                return True
            #@ Option 2: the next letter of s2 matches, and the rest works out.
            if j < len(s2) and s2[j] == s3[k] and can(i, j + 1):  #!
                return True
            #@ Neither choice leads to a full match from here.
            return False
        #@ Start with nothing used from either string.
        return can(0, 0)`,
      time: 'O(m · n)',
      space: 'O(m · n)',
      complexityWhy: 'There are (m + 1)(n + 1) pairs (i, j), and the cache makes each one cost O(1) the first time and nothing after.',
      pitfalls: [
        'Greedily preferring one string breaks when both offer the same letter. You must be able to try both.',
        'Skipping the length check lets leftover letters of s3 slip through unnoticed.',
        'Check `i < len(s1)` before reading `s1[i]`, or you get an IndexError once s1 is used up.',
      ],
    },
    {
      id: 'longest-increasing-path-in-a-matrix',
      num: 329,
      title: 'Longest Increasing Path in a Matrix',
      difficulty: 'Hard',
      category: 'dp-2d',
      pattern: 'DFS + memo on a grid',
      alsoAccept: ['graphs'],
      prompt:
        'Given a grid of integers, return the length of the longest path in which every step moves **up, down, left or right** to a **strictly larger** number. No diagonal moves and no leaving the grid.',
      examples: [
        {
          input: 'matrix = [[3, 4, 5], [2, 1, 6], [9, 8, 7]]',
          output: '9',
          note: '1 → 2 → 3 → … → 9 spirals through every cell.',
        },
        { input: 'matrix = [[7, 7], [7, 7]]', output: '1', note: 'Equal values do not count as increasing.' },
      ],
      signals: [
        'grid with 4-directional moves',
        '"strictly increasing" path, so it can never loop',
        '"longest path" that may start at any cell',
      ],
      hints: [
        'Can a strictly increasing path ever visit the same cell twice? What does that mean for a visited set?',
        'The longest path starting at a cell does not depend on how you got there. Compute it once and reuse it.',
        'Memoize `longest(r, c)` = 1 + the best `longest` of any bigger neighbor, then try every cell as a start.',
      ],
      brute:
        'Run a fresh DFS from every cell that explores every increasing path. Paths overlap heavily, so the same cells are explored again and again: **exponential** in the worst case.',
      insight:
        'Every step goes strictly **uphill**, so a path can never loop back. That makes `longest(r, c)` a fixed number with no visited set needed. Cache it and each cell is solved exactly once.',
      mnemonic: "Only climb uphill; remember each cell's best climb.",
      steps: [
        'Define a cached longest(r, c): the longest increasing path that starts at cell (r, c).',
        'Start with best = 1, the cell on its own.',
        'For each of the four neighbors inside the grid with a larger value, update best with 1 + longest(neighbor).',
        'Return best from longest(r, c).',
        'Answer with the maximum of longest(r, c) over every cell.',
      ],
      solution: py`
class Solution:
    def longestIncreasingPath(self, matrix: List[List[int]]) -> int:
        #@ Grid size, for bounds checks.
        rows, cols = len(matrix), len(matrix[0])
        #@ longest(r, c) = length of the longest increasing path that STARTS at (r, c). Steps only go uphill, so a path never loops back and this value never changes: safe to cache.
        @cache
        def longest(r, c):
            #@ The cell by itself is a path of length 1.
            best = 1
            #@ Look at the four neighbors: down, up, right, left.
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                #@ Step only to a neighbor inside the grid with a strictly bigger value, and extend that neighbor's best path by this cell.
                if 0 <= nr < rows and 0 <= nc < cols and matrix[nr][nc] > matrix[r][c]:  #!
                    best = max(best, 1 + longest(nr, nc))  #!
            return best
        #@ The best path could start anywhere, so try every cell.
        return max(longest(r, c) for r in range(rows) for c in range(cols))`,
      time: 'O(m · n)',
      space: 'O(m · n)',
      complexityWhy:
        'Each cell is computed once and looks at 4 neighbors. The cache, and in the worst case the recursion stack, holds m × n entries.',
      pitfalls: [
        'Using `>=` instead of `>` lets the path step onto equal neighbors, and the recursion can bounce between them forever.',
        'Try **every** cell as a start; the longest path need not begin at (0, 0).',
        'A long snake-shaped path recurses thousands of levels deep. In Python you may need `sys.setrecursionlimit`, or a topological-sort (peel the grid layer by layer) version.',
      ],
    },
    {
      id: 'distinct-subsequences',
      num: 115,
      title: 'Distinct Subsequences',
      difficulty: 'Hard',
      category: 'dp-2d',
      pattern: 'Two-string counting DP',
      prompt:
        'Given strings `s` and `t`, count how many **different ways** you can pick characters of `s` (keeping their order) that spell exactly `t`. Two ways are different if they use a different set of positions in `s`.',
      examples: [
        { input: 's = "banana", t = "ban"', output: '3', note: 'The b is fixed; then pick an a and an n after it: 3 pairs work.' },
        { input: 's = "aabb", t = "ab"', output: '4', note: 'Either a with either b.' },
        { input: 's = "xyz", t = "q"', output: '0' },
      ],
      signals: [
        '"number of distinct subsequences" that equal a target string',
        'two strings walked with two indices',
        'counting ways (add the choices), not finding a best (max/min)',
      ],
      hints: [
        'Look at `s[i]` and `t[j]`. Can you always skip `s[i]`? When are you allowed to use it?',
        'If the letters match there are two choices, use `s[i]` for `t[j]` or skip it, and both count.',
        '`dp[i][j] = dp[i + 1][j]` (skip) plus `dp[i + 1][j + 1]` when `s[i] == t[j]` (use). An empty `t` can be spelled in exactly 1 way.',
      ],
      brute:
        'Generate all 2^n subsequences of `s` and count the ones equal to `t`: **O(2^n · m)**.',
      insight:
        'At every letter of `s` you either **skip it** or, if it matches the next letter you need in `t`, **use it**. The number of ways is the sum of both choices, and it depends only on `(i, j)`: a grid just like LCS, but adding instead of taking a max.',
      mnemonic: 'Always skip; if letters match, also use. Add both.',
      steps: [
        'Make an (m + 1) × (n + 1) grid of zeros, where m = len(s) and n = len(t).',
        'Set the last column to 1: an empty t can be spelled in exactly one way.',
        'Fill i and j from the end backwards.',
        'Start each cell with the skip count, dp[i + 1][j].',
        'If s[i] equals t[j], add the use count dp[i + 1][j + 1].',
        'Return dp[0][0].',
      ],
      solution: py`
class Solution:
    def numDistinct(self, s: str, t: str) -> int:
        #@ dp[i][j] = number of ways to spell t[j:] using letters from s[i:]. The extra row and column stand for "no letters left".
        m, n = len(s), len(t)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        #@ Base case: once all of t is spelled (j == n) that is exactly one way, whatever is left of s.
        for i in range(m + 1):
            dp[i][n] = 1
        #@ Each cell reads the row below, so fill from the bottom up (and right to left).
        for i in range(m - 1, -1, -1):
            for j in range(n - 1, -1, -1):
                #@ Choice 1: skip s[i]. This is always allowed.
                dp[i][j] = dp[i + 1][j]  #!
                #@ Choice 2: if s[i] matches t[j], use it and move on in both strings. The choices give different ways, so add them.
                if s[i] == t[j]:
                    dp[i][j] += dp[i + 1][j + 1]  #!
        #@ All of s is available and all of t still has to be spelled.
        return dp[0][0]`,
      time: 'O(m · n)',
      space: 'O(m · n)',
      complexityWhy: 'One O(1) update for each of the (m + 1)(n + 1) cells. Two rows would be enough to cut space to O(n).',
      pitfalls: [
        'The base case is `dp[i][n] = 1` for **every** i, including i = m (empty s, empty t).',
        'When the letters match you must still add the skip option: a later copy of the same letter could be used instead.',
        'This is counting, so you **add** the options. Using `max` like LCS gives the wrong answer.',
      ],
    },
    {
      id: 'edit-distance',
      num: 72,
      title: 'Edit Distance',
      difficulty: 'Medium',
      category: 'dp-2d',
      pattern: 'Two-string DP: insert, delete, replace',
      prompt:
        'Return the **fewest single-character edits** needed to turn `word1` into `word2`. One edit is inserting a character, deleting a character, or replacing one character with another.',
      examples: [
        { input: 'word1 = "cat", word2 = "cut"', output: '1', note: 'Replace a with u.' },
        { input: 'word1 = "rain", word2 = "shine"', output: '3', note: 'Replace r→s and a→h, then insert e.' },
        { input: 'word1 = "", word2 = "abc"', output: '3' },
      ],
      signals: [
        'turn one string into another',
        '"minimum number of operations"',
        'the operations are insert, delete and replace one character',
      ],
      hints: [
        'Compare the first characters. If they are equal, do you need to touch them?',
        'If they differ, each edit shrinks the problem: delete moves on in word1, insert moves on in word2, replace moves on in both.',
        '`dp[i][j] = dp[i + 1][j + 1]` on a match, otherwise `1 + min(dp[i + 1][j], dp[i][j + 1], dp[i + 1][j + 1])`. When one word is used up, the cost is the number of letters left in the other.',
      ],
      brute:
        'Recursively try all three edits whenever the characters differ: about **O(3^(m+n))**.',
      insight:
        'Look at `word1[i]` and `word2[j]`. Equal? Free: move on in both. Different? Pay 1 for the cheapest of **delete** (`i + 1`), **insert** (`j + 1`) or **replace** (both + 1). Each cell depends on its lower, right and diagonal neighbors.',
      mnemonic: 'Match is free; else 1 + min(delete, insert, replace).',
      steps: [
        'Make an (m + 1) × (n + 1) grid.',
        'Fill the edges: the last column gets m − i and the last row gets n − j, because an empty word means deleting or inserting everything left.',
        'Loop i and j backwards from the end of each word.',
        'If the characters match, copy the diagonal cell dp[i + 1][j + 1].',
        'Otherwise set the cell to 1 + the minimum of the lower, right and diagonal cells.',
        'Return dp[0][0].',
      ],
      solution: py`
class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        #@ dp[i][j] = fewest edits to turn word1[i:] into word2[j:].
        m, n = len(word1), len(word2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        #@ Edges: if word2 is used up, delete the m - i letters left in word1; if word1 is used up, insert the n - j letters left of word2.
        for i in range(m + 1):
            dp[i][n] = m - i
        for j in range(n + 1):
            dp[m][j] = n - j
        #@ Each cell reads below, right and diagonal, so fill from the bottom-right corner backwards.
        for i in range(m - 1, -1, -1):
            for j in range(n - 1, -1, -1):
                #@ The letters already match: no edit needed, move on in both words.
                if word1[i] == word2[j]:
                    dp[i][j] = dp[i + 1][j + 1]  #!
                #@ Otherwise pay 1 for the cheapest edit: delete word1[i] (below), insert word2[j] (right), or replace one with the other (diagonal).
                else:
                    dp[i][j] = 1 + min(dp[i + 1][j], dp[i][j + 1], dp[i + 1][j + 1])  #!
        #@ The answer for the two full words.
        return dp[0][0]`,
      time: 'O(m · n)',
      space: 'O(m · n)',
      complexityWhy: 'One O(1) minimum over three neighbors for each of the (m + 1)(n + 1) cells.',
      pitfalls: [
        'Forgetting the edge base cases (cost = letters left over) makes answers too small.',
        'All three edits must be in the `min`; dropping one (say, replace) can only make answers worse.',
        "An empty word is valid input: the answer is then the other word's length, which the edges already handle.",
      ],
    },
    {
      id: 'burst-balloons',
      num: 312,
      title: 'Burst Balloons',
      difficulty: 'Hard',
      category: 'dp-2d',
      pattern: 'Interval DP: choose the last balloon',
      prompt:
        'Balloons in a row carry the numbers in `nums`. Bursting a balloon earns `left × value × right` coins, where left and right are its **current** neighbors (use 1 if a side has none). After a burst, its two neighbors become next to each other. Burst every balloon and return the **maximum** total coins.',
      examples: [
        { input: 'nums = [2, 4, 3]', output: '33', note: 'Burst 4 (2·4·3 = 24), then 2 (1·2·3 = 6), then 3 (1·3·1 = 3).' },
        { input: 'nums = [6]', output: '6' },
      ],
      signals: [
        'the value of an action depends on neighbors that change as you go',
        '"maximum coins" over every possible order',
        'small n (a few hundred) hints at O(n³)',
      ],
      hints: [
        'If you choose which balloon to burst FIRST, why are the left and right sides still tangled together afterwards?',
        'Flip it: choose which balloon bursts LAST between two walls. When it finally pops, who are its neighbors?',
        'Pad with 1s and memoize `best(l, r)` = the max over k of `best(l, k) + a[l] * a[k] * a[r] + best(k, r)`.',
      ],
      brute: 'Try every order of bursting: **O(n!)** orders.',
      insight:
        'Choose which balloon `k` bursts **last** in the gap between `l` and `r`. Everything else in the gap is gone by then, so its neighbors are exactly `l` and `r`, and `k` splits the gap into two **independent** smaller gaps.',
      mnemonic: 'Pick the last to pop; its neighbors are the walls.',
      steps: [
        'Add a 1 to both ends of nums.',
        'Define a cached best(l, r): the most coins from bursting every balloon strictly between l and r.',
        'Start with 0 coins, which is the answer for an empty gap.',
        'For each k between l and r, treat k as the last balloon in the gap: it earns a[l] × a[k] × a[r].',
        'Add the best of the left gap (l, k) and the right gap (k, r), and keep the maximum.',
        'Return best(0, last index).',
      ],
      solution: py`
class Solution:
    def maxCoins(self, nums: List[int]) -> int:
        #@ Pad both ends with a 1: a missing neighbor counts as 1, and the pads act as walls that are never burst.
        balloons = [1] + nums + [1]
        #@ best(l, r) = most coins from bursting every balloon strictly BETWEEN l and r, while l and r are still standing.
        @cache
        def best(l, r):
            #@ An empty gap earns nothing; this is also our starting value.
            coins = 0
            #@ Try each k as the LAST balloon to burst in this gap. By then everything else in the gap is gone, so its neighbors are exactly l and r.
            for k in range(l + 1, r):
                last = balloons[l] * balloons[k] * balloons[r]  #!
                #@ Before k pops, the left gap (l, k) and the right gap (k, r) are solved separately, because k stands between them the whole time.
                coins = max(coins, best(l, k) + last + best(k, r))  #!
            return coins
        #@ The whole row is the gap between the two padding 1s.
        return best(0, len(balloons) - 1)`,
      time: 'O(n³)',
      space: 'O(n²)',
      complexityWhy: 'There are about n²/2 gaps (l, r), and each one tries up to n choices of k.',
      pitfalls: [
        'Choosing the FIRST balloon to burst does not split the problem: its neighbors later depend on what else is gone.',
        'Forgetting the padding 1s makes the edge balloons awkward to score.',
        'O(n³) is slow in Python. A bottom-up table filled by gap length (short gaps first) runs faster than recursion for n = 300.',
      ],
    },
    {
      id: 'regular-expression-matching',
      num: 10,
      title: 'Regular Expression Matching',
      difficulty: 'Hard',
      category: 'dp-2d',
      pattern: 'Memo on (string index, pattern index)',
      prompt:
        'Implement pattern matching where `.` matches **any single character** and `*` means **zero or more copies of the character just before it**. Return `True` only if the pattern `p` matches the **entire** string `s`.',
      examples: [
        { input: 's = "moon", p = "mo*n"', output: 'True', note: '"o*" covers both o letters.' },
        { input: 's = "cab", p = ".a"', output: 'False', note: 'The pattern must cover the whole string, not just the start.' },
        { input: 's = "xyz", p = "x.*"', output: 'True', note: '".*" matches any run of characters.' },
      ],
      signals: [
        'match a string against a pattern with wildcards',
        '`*` means "repeat the previous thing zero or more times"',
        'a star can be used in several ways, so you must try them all',
      ],
      hints: [
        'Without `*`, this is easy: walk both strings comparing one character at a time (`.` matches anything).',
        'When the NEXT pattern character is `*`, the pair "x*" can match nothing, or match one character and stay where it is.',
        'Memoize `match(i, j)`: with a star, `match(i, j + 2) or (first and match(i + 1, j))`; otherwise `first and match(i + 1, j + 1)`.',
      ],
      brute:
        'Plain recursion tries every way to use every `*`, which is **exponential** on patterns like `a*a*a*a*b`.',
      insight:
        'A pattern element is either one character or a character followed by `*`. A starred element can be **skipped** (`j + 2`), or, if the current characters match, it can **eat one character** (`i + 1`) and stay on the same element. The state is just `(i, j)`, so cache it.',
      mnemonic: 'Star: skip the pair, or eat one and stay.',
      steps: [
        'Define a cached match(i, j): does s[i:] match p[j:]?',
        'If the pattern is used up, succeed only if the string is used up too.',
        'Compute first: a character is left and p[j] is that character or a dot.',
        'If p[j + 1] is a star, return match(i, j + 2) or (first and match(i + 1, j)).',
        'Otherwise return first and match(i + 1, j + 1).',
        'Answer with match(0, 0).',
      ],
      solution: py`
class Solution:
    def isMatch(self, s: str, p: str) -> bool:
        #@ match(i, j) = does the rest of the string, s[i:], match the rest of the pattern, p[j:]?
        @cache
        def match(i, j):
            #@ Pattern used up: it is a match only if the string is used up too.
            if j == len(p):
                return i == len(s)
            #@ Does the current character fit the current pattern character? A dot fits anything, but a character must be left to fit.
            first = i < len(s) and (p[j] == s[i] or p[j] == '.')  #!
            #@ The NEXT pattern character is a star. Either use "p[j] repeated" zero times (skip both pattern characters), or, if the current character fits, eat it and stay on the same starred pair.
            if j + 1 < len(p) and p[j + 1] == '*':
                return match(i, j + 2) or (first and match(i + 1, j))  #!
            #@ No star: the current character must fit, then move on in both.
            return first and match(i + 1, j + 1)  #!
        #@ Start at the beginning of both.
        return match(0, 0)`,
      time: 'O(m · n)',
      space: 'O(m · n)',
      complexityWhy:
        'There are (m + 1)(n + 1) states (i, j). Each does O(1) work on top of its cached recursive calls.',
      pitfalls: [
        'Looking for the star at `p[j]` instead of `p[j + 1]`: the star belongs to the character **before** it, so you must look ahead.',
        'Reading `s[i]` when `i == len(s)`. A pattern like "a*" can still match an empty remainder, so guard with `i < len(s)`.',
        'Only "pattern used up" is a base case. When the string runs out first, keep recursing, since starred pairs may still match nothing.',
      ],
    },
  ],
};

export default content;
