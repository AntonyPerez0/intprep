// ─────────────────────────────────────────────────────────────────────────────
// How each dynamic-programming solution is reached.
//
// A problem's `solution` is the finished answer. The stages here are the versions that come
// before it, in order: plain recursion, the same recursion with a cache, and (when the solution
// goes one step further) the table. The lesson shows them and then teaches the solution, so the
// solution itself is never a stage.
//
// Every stage is a complete answer in the problem's own signature and is tested against the
// solution on the problem's examples and on random inputs. Each stage changes as little as
// possible from the one before it: the cache stage is the recursion plus one line, and a table
// uses the same indices and the same recurrence as the recursion it replaces.
// ─────────────────────────────────────────────────────────────────────────────

import { py, type DerivationStage } from './types';

/** Problem id → the stages that lead up to its `solution`, in order. */
export const DERIVATIONS: Record<string, DerivationStage[]> = {
  // ── 1-D dynamic programming ────────────────────────────────────────────────

  'climbing-stairs': [
    {
      title: 'Plain recursion',
      note: "The **state** is one number, the step `i`, and `ways(i)` is the number of ways to reach it. The **choice** is your last move, a 1-step from `i - 1` or a 2-step from `i - 2`, so the ways to reach `i` are the ways to reach `i - 1` plus the ways to reach `i - 2`; the **base cases** are steps 0 and 1, with one way each. It is correct but slow: `ways(n - 2)` is worked out twice, `ways(n - 3)` three times, and the repeats keep multiplying until there are O(2ⁿ) calls.",
      code: py`
class Solution:
    def climbStairs(self, n: int) -> int:
        # ways(i) = number of ways to reach step i
        def ways(i):
            if i <= 1:                  # step 0 or step 1: exactly one way
                return 1
            # the last move was a 1-step from i - 1 or a 2-step from i - 2
            return ways(i - 1) + ways(i - 2)
        return ways(n)`,
      time: 'O(2^n)',
    },
    {
      title: 'Add a cache',
      note: "`@cache` is the memo dict from the recursion lesson in one line: the first call with a given `i` runs the function and stores the result, and every later call with that `i` gets the stored result back. Each step from 0 to n is now solved once, about n additions in place of all those repeated calls, but the calls still stack up n deep before the first one can finish.",
      code: py`
class Solution:
    def climbStairs(self, n: int) -> int:
        # ways(i) = number of ways to reach step i
        @cache                          # new: remembers the answer for each i
        def ways(i):
            if i <= 1:                  # step 0 or step 1: exactly one way
                return 1
            # the last move was a 1-step from i - 1 or a 2-step from i - 2
            return ways(i - 1) + ways(i - 2)
        return ways(n)`,
      time: 'O(n)',
    },
    {
      title: 'Turn it into a table',
      note: "The cache ended up holding one answer per step, so store those answers in a list: `dp[i]` means exactly what `ways(i)` meant. Fill it from the base cases upward, so `dp[i - 1]` and `dp[i - 2]` are ready when `dp[i]` needs them, and the recursion is gone. It is still wasteful: each cell reads only the two cells before it, yet the whole list is kept.",
      code: py`
class Solution:
    def climbStairs(self, n: int) -> int:
        # dp[i] = number of ways to reach step i
        dp = [1] * (n + 1)              # dp[0] and dp[1] are the base cases
        for i in range(2, n + 1):
            # the last move was a 1-step from i - 1 or a 2-step from i - 2
            dp[i] = dp[i - 1] + dp[i - 2]
        return dp[n]`,
      time: 'O(n)',
    },
  ],

  'min-cost-climbing-stairs': [
    {
      title: 'Plain recursion',
      note: "The **state** is the stair `i`, and `cheapest(i)` is the lowest total cost to be standing on it. The **choice** is the stair you came from, `i - 1` or `i - 2`, paying for the stair you left, so take the cheaper of `cheapest(i - 1) + cost[i - 1]` and `cheapest(i - 2) + cost[i - 2]`; the **base cases** are stairs 0 and 1, where you may start for free. Every call makes two more calls, so the same stairs are solved again and again: O(2ⁿ) calls.",
      code: py`
class Solution:
    def minCostClimbingStairs(self, cost: List[int]) -> int:
        # cheapest(i) = lowest total cost to stand on stair i
        def cheapest(i):
            if i <= 1:                  # you may start on stair 0 or 1 for free
                return 0
            # arrive from one stair below or two below, paying for the stair you leave
            return min(cheapest(i - 1) + cost[i - 1], cheapest(i - 2) + cost[i - 2])
        return cheapest(len(cost))      # the top is one past the last stair`,
      time: 'O(2^n)',
    },
    {
      title: 'Add a cache',
      note: "The same recursion with `@cache` on top: each `cheapest(i)` is computed once and looked up after that. That is n + 1 answers instead of O(2ⁿ) calls, at the price of a cache with n + 1 entries and calls stacked n deep.",
      code: py`
class Solution:
    def minCostClimbingStairs(self, cost: List[int]) -> int:
        # cheapest(i) = lowest total cost to stand on stair i
        @cache                          # new: remembers the answer for each i
        def cheapest(i):
            if i <= 1:                  # you may start on stair 0 or 1 for free
                return 0
            # arrive from one stair below or two below, paying for the stair you leave
            return min(cheapest(i - 1) + cost[i - 1], cheapest(i - 2) + cost[i - 2])
        return cheapest(len(cost))      # the top is one past the last stair`,
      time: 'O(n)',
    },
    {
      title: 'Turn it into a table',
      note: "One list cell per cached call: `dp[i]` is `cheapest(i)`, filled from stair 2 up to the top, so both cells it reads are already there. Each cell looks back only two places, so everything older than that is memory you no longer need.",
      code: py`
class Solution:
    def minCostClimbingStairs(self, cost: List[int]) -> int:
        # dp[i] = lowest total cost to stand on stair i
        dp = [0] * (len(cost) + 1)      # dp[0] and dp[1] stay 0: starting there is free
        for i in range(2, len(cost) + 1):
            # arrive from one stair below or two below, paying for the stair you leave
            dp[i] = min(dp[i - 1] + cost[i - 1], dp[i - 2] + cost[i - 2])
        return dp[len(cost)]            # the top is one past the last stair`,
      time: 'O(n)',
    },
  ],

  'house-robber': [
    {
      title: 'Plain recursion',
      note: "The **state** is how many houses you may use: `best(i)` is the most money from the first `i` houses. The **choice** is about the last of them, `nums[i - 1]`: skip it and keep `best(i - 1)`, or rob it and add its money to `best(i - 2)`, because the house beside it is then off limits; the **base cases** are no houses (0) and one house (rob it). Each call makes two more, so the same groups of houses are solved over and over: O(2ⁿ) calls.",
      code: py`
class Solution:
    def rob(self, nums: List[int]) -> int:
        # best(i) = most money from the first i houses
        def best(i):
            if i == 0:                  # no houses: nothing to rob
                return 0
            if i == 1:                  # one house: rob it
                return nums[0]
            # skip the last house, nums[i - 1], or rob it and add the best from two back
            return max(best(i - 1), best(i - 2) + nums[i - 1])
        return best(len(nums))`,
      time: 'O(2^n)',
    },
    {
      title: 'Add a cache',
      note: "The same code plus `@cache`. `i` can only be 0 to n, so there are only n + 1 answers to work out, and every other call is a lookup. It still keeps n + 1 cached answers and stacks the calls n deep.",
      code: py`
class Solution:
    def rob(self, nums: List[int]) -> int:
        # best(i) = most money from the first i houses
        @cache                          # new: remembers the answer for each i
        def best(i):
            if i == 0:                  # no houses: nothing to rob
                return 0
            if i == 1:                  # one house: rob it
                return nums[0]
            # skip the last house, nums[i - 1], or rob it and add the best from two back
            return max(best(i - 1), best(i - 2) + nums[i - 1])
        return best(len(nums))`,
      time: 'O(n)',
    },
    {
      title: 'Turn it into a table',
      note: "`dp[i]` is `best(i)`: the two base cases go in first, then a loop fills the rest from left to right with the same skip-or-rob line. Each cell reads only `dp[i - 1]` and `dp[i - 2]`, so two variables could do the work of the whole list.",
      code: py`
class Solution:
    def rob(self, nums: List[int]) -> int:
        # dp[i] = most money from the first i houses
        dp = [0] * (len(nums) + 1)      # dp[0] = 0: no houses, nothing to rob
        dp[1] = nums[0]                 # one house: rob it
        for i in range(2, len(nums) + 1):
            # skip the last house, nums[i - 1], or rob it and add the best from two back
            dp[i] = max(dp[i - 1], dp[i - 2] + nums[i - 1])
        return dp[len(nums)]`,
      time: 'O(n)',
    },
  ],

  'house-robber-ii': [
    {
      title: 'Plain recursion',
      note: "The circle is handled by the last line: the first and the last house can never both be robbed, so leave one out, then the other, and each case is a straight row. Inside `rob_row`, the **state**, the **choice** and the **base cases** are House Robber's: `best(i)`, the most money from the first `i` houses of the row, is the larger of skipping the last one (`best(i - 1)`) and robbing it (`best(i - 2)` plus its money), with 0 for no houses and the house itself for one. That is O(2ⁿ) calls for each of the two rows.",
      code: py`
class Solution:
    def rob(self, nums: List[int]) -> int:
        if len(nums) == 1:              # a single house has no neighbors
            return nums[0]
        # the ordinary House Robber for a straight row
        def rob_row(houses):
            # best(i) = most money from the first i houses of this row
            def best(i):
                if i == 0:              # no houses: nothing to rob
                    return 0
                if i == 1:              # one house: rob it
                    return houses[0]
                # skip the last house, or rob it plus the best from two back
                return max(best(i - 1), best(i - 2) + houses[i - 1])
            return best(len(houses))
        # first and last are neighbors: drop one, then the other
        return max(rob_row(nums[1:]), rob_row(nums[:-1]))`,
      time: 'O(2^n)',
    },
    {
      title: 'Add a cache',
      note: "`@cache` goes on `best`, inside `rob_row`. Each call of `rob_row` defines a fresh `best` with its own empty cache, so answers for one row never leak into the other. Each row is now solved once per value of `i`, with a cache of n entries for each row.",
      code: py`
class Solution:
    def rob(self, nums: List[int]) -> int:
        if len(nums) == 1:              # a single house has no neighbors
            return nums[0]
        # the ordinary House Robber for a straight row
        def rob_row(houses):
            # best(i) = most money from the first i houses of this row
            @cache                      # new: remembers the answer for each i
            def best(i):
                if i == 0:              # no houses: nothing to rob
                    return 0
                if i == 1:              # one house: rob it
                    return houses[0]
                # skip the last house, or rob it plus the best from two back
                return max(best(i - 1), best(i - 2) + houses[i - 1])
            return best(len(houses))
        # first and last are neighbors: drop one, then the other
        return max(rob_row(nums[1:]), rob_row(nums[:-1]))`,
      time: 'O(n)',
    },
    {
      title: 'Turn it into a table',
      note: "Each row gets its own list, where `dp[i]` is `best(i)` for that row, filled from left to right. A cell reads only the two cells before it, so the list can shrink to two variables.",
      code: py`
class Solution:
    def rob(self, nums: List[int]) -> int:
        if len(nums) == 1:              # a single house has no neighbors
            return nums[0]
        # the ordinary House Robber for a straight row
        def rob_row(houses):
            # dp[i] = most money from the first i houses of this row
            dp = [0] * (len(houses) + 1)
            dp[1] = houses[0]           # one house: rob it
            for i in range(2, len(houses) + 1):
                # skip the last house, or rob it plus the best from two back
                dp[i] = max(dp[i - 1], dp[i - 2] + houses[i - 1])
            return dp[len(houses)]
        # first and last are neighbors: drop one, then the other
        return max(rob_row(nums[1:]), rob_row(nums[:-1]))`,
      time: 'O(n)',
    },
  ],

  'decode-ways': [
    {
      title: 'Plain recursion',
      note: "The **state** is how much of the string is decoded: `ways(i)` is the number of ways to decode the first `i` characters. The **choice** is how the last letter was written: the last digit alone (allowed if it is not `0`) or the last two digits together (allowed if they form 10 to 26), so add `ways(i - 1)` and `ways(i - 2)` for whichever is allowed; the **base case** is `ways(0) = 1`, one way to decode nothing. On a string like `1111` both are always allowed, so every call makes two more: O(2ⁿ) calls.",
      code: py`
class Solution:
    def numDecodings(self, s: str) -> int:
        # ways(i) = number of ways to decode the first i characters
        def ways(i):
            if i == 0:                  # nothing to decode: one way
                return 1
            total = 0
            # the last digit on its own is a letter if it is 1-9
            if s[i - 1] != "0":
                total += ways(i - 1)
            # the last two digits together are a letter if they form 10-26
            if i >= 2 and 10 <= int(s[i - 2:i]) <= 26:
                total += ways(i - 2)
            return total
        return ways(len(s))`,
      time: 'O(2^n)',
    },
    {
      title: 'Add a cache',
      note: "The recursion plus `@cache`: `i` only takes the values 0 to n, so there are n + 1 answers to compute and the rest are lookups. The table is now easy to see: one cell per distinct call, `dp[i] = ways(i)`, and since `ways(i)` only asks for smaller `i`, it fills from `dp[0]` upward.",
      code: py`
class Solution:
    def numDecodings(self, s: str) -> int:
        # ways(i) = number of ways to decode the first i characters
        @cache                          # new: remembers the answer for each i
        def ways(i):
            if i == 0:                  # nothing to decode: one way
                return 1
            total = 0
            # the last digit on its own is a letter if it is 1-9
            if s[i - 1] != "0":
                total += ways(i - 1)
            # the last two digits together are a letter if they form 10-26
            if i >= 2 and 10 <= int(s[i - 2:i]) <= 26:
                total += ways(i - 2)
            return total
        return ways(len(s))`,
      time: 'O(n)',
    },
  ],

  'coin-change': [
    {
      title: 'Plain recursion',
      note: "The **state** is the amount still to make: `fewest(a)` is the fewest coins that add up to `a`. The **choice** is the last coin: whatever the best way is, it ends with some coin, so try every coin that fits and take 1 plus the best for what is left, `fewest(a - coin)`; the **base case** is `fewest(0) = 0`, and `amount + 1` stands for impossible because no real answer is that big. Every call branches once per coin, and the same leftover amount comes up through many different orders of coins: exponential time.",
      code: py`
class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        # fewest(a) = fewest coins that make a (amount + 1 means "impossible")
        def fewest(a):
            if a == 0:                  # making 0 needs no coins
                return 0
            best = amount + 1
            # try each coin as the LAST coin: one coin plus the best way to make the rest
            for coin in coins:
                if coin <= a:
                    best = min(best, fewest(a - coin) + 1)
            return best
        answer = fewest(amount)
        return answer if answer <= amount else -1`,
      time: 'O(k^amount)',
    },
    {
      title: 'Add a cache',
      note: "With `@cache`, each amount from 0 to `amount` is solved once, trying all k coins: amount × k steps. A large amount with a 1-coin still stacks thousands of calls, more than Python allows by default. The table avoids that: one cell per distinct call, `dp[a] = fewest(a)`, filled from `dp[0]` upward because `fewest(a)` only asks about smaller amounts.",
      code: py`
class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        # fewest(a) = fewest coins that make a (amount + 1 means "impossible")
        @cache                          # new: remembers the answer for each a
        def fewest(a):
            if a == 0:                  # making 0 needs no coins
                return 0
            best = amount + 1
            # try each coin as the LAST coin: one coin plus the best way to make the rest
            for coin in coins:
                if coin <= a:
                    best = min(best, fewest(a - coin) + 1)
            return best
        answer = fewest(amount)
        return answer if answer <= amount else -1`,
      time: 'O(amount · k)',
    },
  ],

  'maximum-product-subarray': [
    {
      title: 'Plain recursion',
      note: "The **state** is where the subarray ends: `ending_at(i)` gives the largest and the smallest product of a subarray that ends exactly at index `i`. The **choice** is to start fresh at `nums[i]` or to extend the subarray ending at `i - 1` by `nums[i]`, and the smallest is kept because a negative `nums[i]` turns it into the largest; the **base case** is index 0, where both are `nums[0]`. Each call makes only one more call, so this is not exponential, but the loop asks for every ending index and each ask walks all the way back to index 0: O(n²), no faster than trying every start and end.",
      code: py`
class Solution:
    def maxProduct(self, nums: List[int]) -> int:
        # ending_at(i) = (largest, smallest) product of a subarray that ends at index i
        def ending_at(i):
            if i == 0:                  # only one subarray ends at index 0
                return nums[0], nums[0]
            prev_max, prev_min = ending_at(i - 1)
            x = nums[i]
            # start fresh at x, or extend the subarray that ended at i - 1
            candidates = (x, prev_max * x, prev_min * x)
            return max(candidates), min(candidates)
        # the best subarray can end anywhere
        best = nums[0]
        for i in range(1, len(nums)):
            largest, smallest = ending_at(i)
            best = max(best, largest)
        return best`,
      time: 'O(n²)',
    },
    {
      title: 'Add a cache',
      note: "`@cache` stores the pair for each `i`, so by the time the loop asks for `ending_at(i)`, `ending_at(i - 1)` is a lookup. That is n pairs computed once each, O(n) time, with all n pairs kept in memory.",
      code: py`
class Solution:
    def maxProduct(self, nums: List[int]) -> int:
        # ending_at(i) = (largest, smallest) product of a subarray that ends at index i
        @cache                          # new: remembers the pair for each i
        def ending_at(i):
            if i == 0:                  # only one subarray ends at index 0
                return nums[0], nums[0]
            prev_max, prev_min = ending_at(i - 1)
            x = nums[i]
            # start fresh at x, or extend the subarray that ended at i - 1
            candidates = (x, prev_max * x, prev_min * x)
            return max(candidates), min(candidates)
        # the best subarray can end anywhere
        best = nums[0]
        for i in range(1, len(nums)):
            largest, smallest = ending_at(i)
            best = max(best, largest)
        return best`,
      time: 'O(n)',
    },
    {
      title: 'Turn it into a table',
      note: "Two lists hold what the cache held: `max_end[i]` and `min_end[i]` are the pair that `ending_at(i)` returned, filled from left to right. Index `i` reads only index `i - 1`, so each list could be a single variable, with the best product kept up to date along the way.",
      code: py`
class Solution:
    def maxProduct(self, nums: List[int]) -> int:
        # largest and smallest product of a subarray that ends at index i
        max_end = [nums[0]] * len(nums)     # index 0: only one subarray ends there
        min_end = [nums[0]] * len(nums)
        for i in range(1, len(nums)):
            x = nums[i]
            # start fresh at x, or extend the subarray that ended at i - 1
            candidates = (x, max_end[i - 1] * x, min_end[i - 1] * x)
            max_end[i] = max(candidates)
            min_end[i] = min(candidates)
        # the best subarray can end anywhere
        return max(max_end)`,
      time: 'O(n)',
    },
  ],

  'word-break': [
    {
      title: 'Plain recursion',
      note: "The **state** is a prefix length: `can_cut(i)` says whether the first `i` letters can be cut into words. The **choice** is where the last cut goes: it works if, for some `j`, the first `j` letters can be cut and the piece `s[j:i]` is a word; the **base case** is the empty prefix, which needs no words. `can_cut(i)` may call `can_cut(j)` for every smaller `j`, and each of those does the same, so the calls can double with every extra letter: about 2ⁿ.",
      code: py`
class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:
        words = set(wordDict)
        # can_cut(i) = can the first i letters be cut into words?
        def can_cut(i):
            if i == 0:                  # the empty prefix needs no words
                return True
            # try every place j for the last cut: s[:j] cuts fine and s[j:i] is a word
            for j in range(i):
                if can_cut(j) and s[j:i] in words:
                    return True
            return False
        return can_cut(len(s))`,
      time: 'O(2^n)',
    },
    {
      title: 'Add a cache',
      note: "With `@cache`, each prefix length is decided once. What is left is about n²/2 pairs `(j, i)`, each slicing out a piece of up to n letters. The table is one cell per distinct call, `dp[i] = can_cut(i)`, filled from `dp[0]` upward because `can_cut(i)` only asks about shorter prefixes.",
      code: py`
class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:
        words = set(wordDict)
        # can_cut(i) = can the first i letters be cut into words?
        @cache                          # new: remembers the answer for each i
        def can_cut(i):
            if i == 0:                  # the empty prefix needs no words
                return True
            # try every place j for the last cut: s[:j] cuts fine and s[j:i] is a word
            for j in range(i):
                if can_cut(j) and s[j:i] in words:
                    return True
            return False
        return can_cut(len(s))`,
      time: 'O(n³)',
    },
  ],

  'longest-increasing-subsequence': [
    {
      title: 'Plain recursion',
      note: "The **state** is the index where the subsequence ends: `ending_at(i)` is the length of the longest increasing subsequence whose last number is `nums[i]`. The **choice** is the number just before it: any earlier, smaller `nums[j]`, which gives `ending_at(j) + 1`; with no such number the answer is 1, `nums[i]` on its own, and that is the **base case** (the loop simply finds nothing). On an increasing list every call asks for every earlier index, so the calls double with each number: about 2ⁿ.",
      code: py`
class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        # ending_at(i) = length of the longest increasing subsequence that ENDS at nums[i]
        def ending_at(i):
            best = 1                    # nums[i] on its own
            # a smaller earlier value can be extended by nums[i]
            for j in range(i):
                if nums[j] < nums[i]:
                    best = max(best, ending_at(j) + 1)
            return best
        # the best subsequence can end anywhere
        return max(ending_at(i) for i in range(len(nums)))`,
      time: 'O(2^n)',
    },
    {
      title: 'Add a cache',
      note: "With `@cache`, each ending index is solved once, with one loop over the indices before it: about n²/2 steps. The table is one cell per distinct call, `dp[i] = ending_at(i)`, filled from left to right because `ending_at(i)` only asks about earlier indices, and the answer is still the largest cell.",
      code: py`
class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        # ending_at(i) = length of the longest increasing subsequence that ENDS at nums[i]
        @cache                          # new: remembers the answer for each i
        def ending_at(i):
            best = 1                    # nums[i] on its own
            # a smaller earlier value can be extended by nums[i]
            for j in range(i):
                if nums[j] < nums[i]:
                    best = max(best, ending_at(j) + 1)
            return best
        # the best subsequence can end anywhere
        return max(ending_at(i) for i in range(len(nums)))`,
      time: 'O(n²)',
    },
  ],

  'partition-equal-subset-sum': [
    {
      title: 'Plain recursion',
      note: "Two equal groups means one group adds up to half the total, so ask: can some of the numbers add up to `target`? The **state** is a pair: `can_make(i, s)` says whether some of the first `i` numbers add up to exactly `s`, and the **choice** is about the last of them, `x`: leave it out (`can_make(i - 1, s)`) or, if it fits, put it in (`can_make(i - 1, s - x)`); the **base cases** are `s == 0` (yes) and no numbers left (no). Two calls per number means up to 2ⁿ calls, one for every way to choose a group.",
      code: py`
class Solution:
    def canPartition(self, nums: List[int]) -> bool:
        total = sum(nums)
        if total % 2 == 1:              # two equal halves need an even total
            return False
        target = total // 2
        # can_make(i, s) = can some of the first i numbers add up to exactly s?
        def can_make(i, s):
            if s == 0:                  # nothing left to add up
                return True
            if i == 0:                  # no numbers left, and s is not 0
                return False
            x = nums[i - 1]
            # leave x out, or (if it fits) put x in
            return can_make(i - 1, s) or (x <= s and can_make(i - 1, s - x))
        return can_make(len(nums), target)`,
      time: 'O(2^n)',
    },
    {
      title: 'Add a cache',
      note: "`@cache` remembers the answer for each pair `(i, s)`. `i` runs from 0 to n and `s` from 0 to `target`, so there are at most (n + 1) × (target + 1) pairs, however many ways lead to each one: about n × target steps instead of 2ⁿ.",
      code: py`
class Solution:
    def canPartition(self, nums: List[int]) -> bool:
        total = sum(nums)
        if total % 2 == 1:              # two equal halves need an even total
            return False
        target = total // 2
        # can_make(i, s) = can some of the first i numbers add up to exactly s?
        @cache                          # new: remembers the answer for each (i, s)
        def can_make(i, s):
            if s == 0:                  # nothing left to add up
                return True
            if i == 0:                  # no numbers left, and s is not 0
                return False
            x = nums[i - 1]
            # leave x out, or (if it fits) put x in
            return can_make(i - 1, s) or (x <= s and can_make(i - 1, s - x))
        return can_make(len(nums), target)`,
      time: 'O(n · target)',
    },
    {
      title: 'Turn it into a table',
      note: "A grid with one cell per pair: `dp[i][s]` is `can_make(i, s)`, and row `i` stands for the first `i` numbers. Row `i` reads only row `i - 1`, so the rows fill from top to bottom. Most cells are `False` and only the row above is ever read, so one row is enough, and all it has to remember is **which sums are reachable**.",
      code: py`
class Solution:
    def canPartition(self, nums: List[int]) -> bool:
        total = sum(nums)
        if total % 2 == 1:              # two equal halves need an even total
            return False
        target = total // 2
        # dp[i][s] = can some of the first i numbers add up to exactly s?
        dp = [[False] * (target + 1) for _ in range(len(nums) + 1)]
        for i in range(len(nums) + 1):
            dp[i][0] = True             # nothing left to add up
        for i in range(1, len(nums) + 1):
            x = nums[i - 1]
            for s in range(1, target + 1):
                # leave x out, or (if it fits) put x in
                dp[i][s] = dp[i - 1][s] or (x <= s and dp[i - 1][s - x])
        return dp[len(nums)][target]`,
      time: 'O(n · target)',
    },
  ],

  'longest-palindromic-substring': [
    {
      title: 'Brute force',
      note: "Try every start and every end, and keep the longest piece that reads the same reversed. There is no recursion to cache here: this problem sits in the DP unit, but the lesson's answer is not a table. There are about n²/2 pieces and comparing one with its reverse takes up to n steps, and every piece is checked from scratch, even though a palindrome is just a shorter palindrome with the same letter added on both sides.",
      code: py`
class Solution:
    def longestPalindrome(self, s: str) -> str:
        best = ""
        # try every start and every end
        for start in range(len(s)):
            for end in range(start + 1, len(s) + 1):
                piece = s[start:end]
                # a palindrome equals its own reverse
                if piece == piece[::-1] and len(piece) > len(best):
                    best = piece
        return best`,
      time: 'O(n³)',
    },
  ],

  'palindromic-substrings': [
    {
      title: 'Brute force',
      note: "Try every start and every end, and count the pieces that read the same reversed. There is no recursion to cache here: this problem sits in the DP unit, but the lesson's answer is not a table. There are about n²/2 pieces, each compared with its reverse in up to n steps, and nothing learned about one piece is reused for the next.",
      code: py`
class Solution:
    def countSubstrings(self, s: str) -> int:
        count = 0
        # try every start and every end
        for start in range(len(s)):
            for end in range(start + 1, len(s) + 1):
                piece = s[start:end]
                # a palindrome equals its own reverse
                if piece == piece[::-1]:
                    count += 1
        return count`,
      time: 'O(n³)',
    },
  ],

  // ── 2-D dynamic programming ────────────────────────────────────────────────

  'unique-paths': [
    {
      title: 'Plain recursion',
      note: "The **state** is a cell: `ways(r, c)` is the number of routes from the top-left corner to cell `(r, c)`. The **choice** is the last move, down from the cell above or right from the cell on its left, so the routes to a cell are the routes to the cell above plus the routes to the cell on its left; the **base case** is any cell in the top row or the left column, which has exactly one straight route. Every call makes two more, and a cell in the middle is asked for once for every route that leads on from it to the corner: O(2^(m+n)) calls.",
      code: py`
class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        # ways(r, c) = number of routes from the top-left cell to cell (r, c)
        def ways(r, c):
            if r == 0 or c == 0:        # top row or left column: one straight route
                return 1
            # the last move came from the cell above or from the cell on the left
            return ways(r - 1, c) + ways(r, c - 1)
        return ways(m - 1, n - 1)`,
      time: 'O(2^(m+n))',
    },
    {
      title: 'Add a cache',
      note: "`@cache` is the memo dict from the recursion lesson in one line, and with two arguments its key is the pair `(r, c)`: the first call for a cell computes its count and every later call looks it up. There are only m × n cells, so m × n additions replace an exponential number of calls. The cache is now a whole grid of answers, on top of the stack of waiting calls.",
      code: py`
class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        # ways(r, c) = number of routes from the top-left cell to cell (r, c)
        @cache                          # new: remembers the answer for each (r, c)
        def ways(r, c):
            if r == 0 or c == 0:        # top row or left column: one straight route
                return 1
            # the last move came from the cell above or from the cell on the left
            return ways(r - 1, c) + ways(r, c - 1)
        return ways(m - 1, n - 1)`,
      time: 'O(m · n)',
    },
    {
      title: 'Turn it into a table',
      note: "Write the cache down as a grid: `dp[r][c]` is `ways(r, c)`. Every cell starts at 1, which is already right for the top row and the left column, and the others fill row by row, so the cell above and the cell on the left are ready when they are read. Each row reads only the row above it, so keeping all m rows is more memory than you need.",
      code: py`
class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        # dp[r][c] = number of routes from the top-left cell to cell (r, c)
        dp = [[1] * n for _ in range(m)]    # top row and left column stay 1
        for r in range(1, m):
            for c in range(1, n):
                # the last move came from the cell above or from the cell on the left
                dp[r][c] = dp[r - 1][c] + dp[r][c - 1]
        return dp[m - 1][n - 1]`,
      time: 'O(m · n)',
    },
  ],

  'longest-common-subsequence': [
    {
      title: 'Plain recursion',
      note: "The **state** is a pair of positions: `dp(i, j)` is the LCS length of what is left of each string, `text1[i:]` and `text2[j:]`. Compare their first characters: if they are equal, pair them and add 1 to the answer for the rest of both; if not, at least one of the two is unused, so **choose** between dropping one or the other and keep the larger answer. The **base case** is an empty suffix (LCS 0); the trouble is that `dp(i + 1, j + 1)` is reached by dropping in either order, and those repeats grow to O(2^(m+n)) calls.",
      code: py`
class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        # dp(i, j) = LCS length of the suffixes text1[i:] and text2[j:]
        def dp(i, j):
            if i == len(text1) or j == len(text2):      # an empty suffix: LCS is 0
                return 0
            # same character: pair them up, then solve the rest of both strings
            if text1[i] == text2[j]:
                return 1 + dp(i + 1, j + 1)
            # different: skip a character from one string or the other, keep the better
            return max(dp(i + 1, j), dp(i, j + 1))
        return dp(0, 0)`,
      time: 'O(2^(m+n))',
    },
    {
      title: 'Add a cache',
      note: "`@cache` keys on the pair `(i, j)`, and there are only (m + 1) × (n + 1) pairs. The table is one cell per pair, `dp[i][j]`, with the same meaning as `dp(i, j)`. Every call asks for `i + 1` or `j + 1`, which is the cell below, to the right or on the diagonal, so those cells must be filled first: that is why the table starts at the bottom-right and works backwards.",
      code: py`
class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        # dp(i, j) = LCS length of the suffixes text1[i:] and text2[j:]
        @cache                          # new: remembers the answer for each (i, j)
        def dp(i, j):
            if i == len(text1) or j == len(text2):      # an empty suffix: LCS is 0
                return 0
            # same character: pair them up, then solve the rest of both strings
            if text1[i] == text2[j]:
                return 1 + dp(i + 1, j + 1)
            # different: skip a character from one string or the other, keep the better
            return max(dp(i + 1, j), dp(i, j + 1))
        return dp(0, 0)`,
      time: 'O(m · n)',
    },
  ],

  'target-sum': [
    {
      title: 'Plain recursion',
      note: "The **state** is how far you are and the sum so far: `count(i, total)` is the number of ways to finish from index `i` and land exactly on `target`, when the signs chosen so far add up to `total`. The **choice** is the sign of `nums[i]`, plus or minus, and the two counts add up; the **base case** is no numbers left, which counts 1 if `total == target` and 0 if not. That is all 2ⁿ sign patterns, one by one, yet different patterns reach the same index with the same total (+2 +1 −1 and +2 −1 +1) and the rest is identical from there: the pair `(i, total)` is the cache key.",
      code: py`
class Solution:
    def findTargetSumWays(self, nums: List[int], target: int) -> int:
        # count(i, total) = ways to finish from index i and land on target,
        # when the signs chosen so far add up to total
        def count(i, total):
            if i == len(nums):          # every number has a sign
                return 1 if total == target else 0
            # two choices for nums[i]: add it or subtract it
            return count(i + 1, total + nums[i]) + count(i + 1, total - nums[i])
        return count(0, 0)`,
      time: 'O(2^n)',
    },
  ],

  'best-time-to-buy-and-sell-stock-with-cooldown': [
    {
      title: 'Plain recursion',
      note: "The **state** is the day plus whether you may buy: `dfs(i, buying)` is the best profit from day `i` onward. Each day you **choose** to rest (day `i + 1`, same state) or to act: buy if you may (pay `prices[i]`, now holding a share), sell if you hold one (earn `prices[i]`, then jump to day `i + 2`); the **base case** is past the last day, profit 0. Many different histories reach the same day in the same state and each one solves the remaining days again, O(2ⁿ) calls, though what lies ahead depends only on `(i, buying)`: that pair is the cache key.",
      code: py`
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        # dfs(i, buying) = best profit from day i onward; buying means we hold no share
        def dfs(i, buying):
            if i >= len(prices):        # past the last day: nothing more to earn
                return 0
            rest = dfs(i + 1, buying)   # do nothing today, same state tomorrow
            if buying:
                buy = dfs(i + 1, False) - prices[i]     # pay today, then hold a share
                return max(buy, rest)
            sell = dfs(i + 2, True) + prices[i]         # earn today, then skip a day
            return max(sell, rest)
        return dfs(0, True)`,
      time: 'O(2^n)',
    },
    {
      title: 'The same thing as a table',
      note: "Optional: the lesson's solution is the cached recursion. Here the two states become two lists, `can_buy[i] = dfs(i, True)` and `holding[i] = dfs(i, False)`, filled from the last day backwards because day `i` reads days `i + 1` and `i + 2`. With no recursion there is no limit on the number of days.",
      code: py`
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        n = len(prices)
        # can_buy[i] = dfs(i, True), holding[i] = dfs(i, False)
        can_buy = [0] * (n + 2)         # the two extra cells are "past the last day": 0
        holding = [0] * (n + 2)
        for i in range(n - 1, -1, -1):
            # may buy: rest, or pay today and hold a share
            can_buy[i] = max(can_buy[i + 1], holding[i + 1] - prices[i])
            # holding: rest, or earn today and skip a day
            holding[i] = max(holding[i + 1], can_buy[i + 2] + prices[i])
        return can_buy[0]`,
      time: 'O(n)',
    },
  ],

  'coin-change-ii': [
    {
      title: 'Plain recursion',
      note: "The **state** is a pair: `ways(i, a)` is the number of combinations that make amount `a` using only the first `i` coins. The **choice** is about the last allowed coin: stop using it (`ways(i - 1, a)`) or use it once more (`ways(i, a - coin)`, where `i` stays so it can repeat), and the two counts add up; the **base cases** are amount 0 (one way: take nothing) and no coins for a positive amount (no way). Deciding coin by coin is what keeps 1 + 2 and 2 + 1 from being counted twice, but the same `(i, a)` is reached along many paths: exponential time.",
      code: py`
class Solution:
    def change(self, amount: int, coins: List[int]) -> int:
        # ways(i, a) = number of combinations that make a using only the first i coins
        def ways(i, a):
            if a == 0:                  # one way to make 0: take nothing
                return 1
            if i == 0:                  # no coins allowed, and a is not 0
                return 0
            coin = coins[i - 1]
            total = ways(i - 1, a)      # stop using this coin
            if coin <= a:
                total += ways(i, a - coin)      # use it once more (i stays)
            return total
        return ways(len(coins), amount)`,
      time: 'O(2^(n+amount))',
    },
    {
      title: 'Add a cache',
      note: "`@cache` keys on the pair `(i, a)`: at most (n + 1) × (amount + 1) answers, each one addition. The cache is now a grid, with a row for each number of coins allowed and a column for each amount, and a big amount can stack thousands of calls.",
      code: py`
class Solution:
    def change(self, amount: int, coins: List[int]) -> int:
        # ways(i, a) = number of combinations that make a using only the first i coins
        @cache                          # new: remembers the answer for each (i, a)
        def ways(i, a):
            if a == 0:                  # one way to make 0: take nothing
                return 1
            if i == 0:                  # no coins allowed, and a is not 0
                return 0
            coin = coins[i - 1]
            total = ways(i - 1, a)      # stop using this coin
            if coin <= a:
                total += ways(i, a - coin)      # use it once more (i stays)
            return total
        return ways(len(coins), amount)`,
      time: 'O(n · amount)',
    },
    {
      title: 'Turn it into a table',
      note: "The grid written out: `dp[i][a]` is `ways(i, a)`. Stopping reads the row above, and using the coin again reads the same row `coin` columns to the left, so fill row by row, each row from left to right. Row `i` never looks further up than row `i - 1`, so the whole grid can fold into a single row.",
      code: py`
class Solution:
    def change(self, amount: int, coins: List[int]) -> int:
        # dp[i][a] = number of combinations that make a using only the first i coins
        dp = [[0] * (amount + 1) for _ in range(len(coins) + 1)]
        for i in range(len(coins) + 1):
            dp[i][0] = 1                # one way to make 0: take nothing
        for i in range(1, len(coins) + 1):
            coin = coins[i - 1]
            for a in range(1, amount + 1):
                dp[i][a] = dp[i - 1][a]             # stop using this coin
                if coin <= a:
                    dp[i][a] += dp[i][a - coin]     # use it once more (same row)
        return dp[len(coins)][amount]`,
      time: 'O(n · amount)',
    },
  ],

  'interleaving-string': [
    {
      title: 'Plain recursion',
      note: "The **state** is how many letters of each string are used: `can(i, j)` says whether the rest of `s3` can be built from `s1[i:]` and `s2[j:]`. The next letter to produce is `s3[i + j]`, and the **choice** is which string it comes from: `s1` if `s1[i]` matches, `s2` if `s2[j]` matches; the **base case** is both strings used up, which is success. When both strings offer the same letter the recursion tries both, up to 2^(m+n) paths, but taking a letter from `s1` and then one from `s2` reaches the same `(i, j)` as the other order: that pair is the cache key.",
      code: py`
class Solution:
    def isInterleave(self, s1: str, s2: str, s3: str) -> bool:
        if len(s1) + len(s2) != len(s3):        # every letter must be used exactly once
            return False
        # can(i, j) = can the rest of s3 be built from s1[i:] and s2[j:]?
        def can(i, j):
            if i == len(s1) and j == len(s2):   # both used up: s3 is fully built
                return True
            k = i + j                           # the next letter to produce is s3[k]
            # take it from s1, if it matches and the rest works out
            if i < len(s1) and s1[i] == s3[k] and can(i + 1, j):
                return True
            # take it from s2, if it matches and the rest works out
            if j < len(s2) and s2[j] == s3[k] and can(i, j + 1):
                return True
            return False
        return can(0, 0)`,
      time: 'O(2^(m+n))',
    },
    {
      title: 'The same thing as a table',
      note: "Optional: the lesson's solution is the cached recursion. The table has one cell per pair, `dp[i][j] = can(i, j)`, and because every call asks for `i + 1` or `j + 1`, it fills backwards from the bottom-right cell, which is the base case.",
      code: py`
class Solution:
    def isInterleave(self, s1: str, s2: str, s3: str) -> bool:
        if len(s1) + len(s2) != len(s3):        # every letter must be used exactly once
            return False
        m, n = len(s1), len(s2)
        # dp[i][j] = can the rest of s3 be built from s1[i:] and s2[j:]?
        dp = [[False] * (n + 1) for _ in range(m + 1)]
        dp[m][n] = True                         # both used up: s3 is fully built
        # each cell reads the cell below and the cell to the right: fill backwards
        for i in range(m, -1, -1):
            for j in range(n, -1, -1):
                k = i + j                       # the next letter to produce is s3[k]
                if i < m and s1[i] == s3[k] and dp[i + 1][j]:
                    dp[i][j] = True
                if j < n and s2[j] == s3[k] and dp[i][j + 1]:
                    dp[i][j] = True
        return dp[0][0]`,
      time: 'O(m · n)',
    },
  ],

  'longest-increasing-path-in-a-matrix': [
    {
      title: 'Plain recursion',
      note: "The **state** is a cell: `longest(r, c)` is the length of the longest increasing path that **starts** at `(r, c)`. The **choice** is the first step, to any neighbor with a strictly larger value, which gives 1 plus that neighbor's `longest`; a cell with no larger neighbor is the **base case**, a path of length 1. A cell is asked for again from each smaller neighbor and from every starting cell, and every ask explores all the paths out of it again (exponential on a grid of rising numbers), yet its answer never depends on how you got there: `(r, c)` is the cache key.",
      code: py`
class Solution:
    def longestIncreasingPath(self, matrix: List[List[int]]) -> int:
        rows, cols = len(matrix), len(matrix[0])
        # longest(r, c) = length of the longest increasing path that STARTS at (r, c)
        def longest(r, c):
            best = 1                    # the cell by itself
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                # step only to a neighbor inside the grid with a strictly bigger value
                if 0 <= nr < rows and 0 <= nc < cols and matrix[nr][nc] > matrix[r][c]:
                    best = max(best, 1 + longest(nr, nc))
            return best
        # the best path could start anywhere
        return max(longest(r, c) for r in range(rows) for c in range(cols))`,
      time: 'O(2^(m+n))',
    },
  ],

  'distinct-subsequences': [
    {
      title: 'Plain recursion',
      note: "The **state** is a pair of positions: `dp(i, j)` is the number of ways to spell `t[j:]` using letters from `s[i:]`. The **choice** is what to do with `s[i]`: skipping it is always allowed (`dp(i + 1, j)`), and if it equals `t[j]` you may also use it (`dp(i + 1, j + 1)`); the two choices give different ways, so add them. The **base cases** are all of `t` spelled (1 way) and `s` running out first (0 ways); on strings like `aaaa` and `aa` both branches open at every letter, so the calls can double with every letter of `s`: O(2^m) for m letters.",
      code: py`
class Solution:
    def numDistinct(self, s: str, t: str) -> int:
        # dp(i, j) = number of ways to spell t[j:] using letters from s[i:]
        def dp(i, j):
            if j == len(t):             # all of t is spelled: exactly one way
                return 1
            if i == len(s):             # s ran out with letters of t still to spell
                return 0
            ways = dp(i + 1, j)         # choice 1: skip s[i], always allowed
            if s[i] == t[j]:
                ways += dp(i + 1, j + 1)        # choice 2: use s[i] for t[j]
            return ways
        return dp(0, 0)`,
      time: 'O(2^m)',
    },
    {
      title: 'Add a cache',
      note: "`@cache` keys on the pair `(i, j)`: (m + 1) × (n + 1) answers instead of O(2^m) calls. The table is one cell per pair with the same meaning. Every call asks for row `i + 1`, so the base cases go in first (the column for `j == len(t)` is all 1s, the rest of the last row is 0) and everything else fills from the bottom-right backwards.",
      code: py`
class Solution:
    def numDistinct(self, s: str, t: str) -> int:
        # dp(i, j) = number of ways to spell t[j:] using letters from s[i:]
        @cache                          # new: remembers the answer for each (i, j)
        def dp(i, j):
            if j == len(t):             # all of t is spelled: exactly one way
                return 1
            if i == len(s):             # s ran out with letters of t still to spell
                return 0
            ways = dp(i + 1, j)         # choice 1: skip s[i], always allowed
            if s[i] == t[j]:
                ways += dp(i + 1, j + 1)        # choice 2: use s[i] for t[j]
            return ways
        return dp(0, 0)`,
      time: 'O(m · n)',
    },
  ],

  'edit-distance': [
    {
      title: 'Plain recursion',
      note: "The **state** is a pair of positions: `dp(i, j)` is the fewest edits that turn `word1[i:]` into `word2[j:]`. If the first letters match, move on in both for free; if not, pay 1 and **choose** an edit: delete `word1[i]` (`i + 1`), insert `word2[j]` (`j + 1`), or replace one with the other (both + 1). The **base cases** are a used-up word, which costs the number of letters left in the other one; three branches at every mismatch add up to O(3^(m+n)) calls, nearly all of them for a pair `(i, j)` that was already solved.",
      code: py`
class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        # dp(i, j) = fewest edits to turn word1[i:] into word2[j:]
        def dp(i, j):
            if j == len(word2):         # word2 is used up: delete the rest of word1
                return len(word1) - i
            if i == len(word1):         # word1 is used up: insert the rest of word2
                return len(word2) - j
            # the letters already match: no edit needed, move on in both words
            if word1[i] == word2[j]:
                return dp(i + 1, j + 1)
            # otherwise pay 1 for the cheapest edit: delete, insert or replace
            return 1 + min(dp(i + 1, j), dp(i, j + 1), dp(i + 1, j + 1))
        return dp(0, 0)`,
      time: 'O(3^(m+n))',
    },
    {
      title: 'Add a cache',
      note: "`@cache` keys on the pair `(i, j)`, so each of the (m + 1) × (n + 1) pairs is solved once. The table is one cell per pair with the same meaning: the base cases fill the last column and the last row, and because every call asks for `i + 1` or `j + 1` (below, right or diagonal), the rest fills from the bottom-right corner backwards.",
      code: py`
class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        # dp(i, j) = fewest edits to turn word1[i:] into word2[j:]
        @cache                          # new: remembers the answer for each (i, j)
        def dp(i, j):
            if j == len(word2):         # word2 is used up: delete the rest of word1
                return len(word1) - i
            if i == len(word1):         # word1 is used up: insert the rest of word2
                return len(word2) - j
            # the letters already match: no edit needed, move on in both words
            if word1[i] == word2[j]:
                return dp(i + 1, j + 1)
            # otherwise pay 1 for the cheapest edit: delete, insert or replace
            return 1 + min(dp(i + 1, j), dp(i, j + 1), dp(i + 1, j + 1))
        return dp(0, 0)`,
      time: 'O(m · n)',
    },
  ],

  'burst-balloons': [
    {
      title: 'Brute force',
      note: "Try every order: pick the balloon to burst **first**, score it against its current neighbors, close the gap and solve the shorter row the same way. The state is the whole list of balloons still standing, far too many lists to cache, and the two sides of a burst never become separate problems, because the burst makes them neighbors. That is n choices, then n − 1, then n − 2: n! orders.",
      code: py`
class Solution:
    def maxCoins(self, nums: List[int]) -> int:
        # burst(row) = most coins from bursting every balloon in row
        def burst(row):
            best = 0                    # an empty row earns nothing
            # try each balloon as the FIRST one to burst
            for i in range(len(row)):
                left = row[i - 1] if i > 0 else 1
                right = row[i + 1] if i < len(row) - 1 else 1
                coins = left * row[i] * right
                # the row closes up, and the rest is a shorter row
                best = max(best, coins + burst(row[:i] + row[i + 1:]))
            return best
        return burst(nums)`,
      time: 'O(n · n!)',
    },
    {
      title: 'Plain recursion',
      note: "Turn the question around and **choose** the balloon that bursts **last**. `best(l, r)` is the most coins from bursting everything strictly between two standing walls `l` and `r` (a 1 is added at each end as the outer walls): if `k` goes last, its neighbors are exactly `l` and `r`, and the gaps `(l, k)` and `(k, r)` are solved on their own; the **base case** is an empty gap, worth 0. The **state** is now just two indices, but the same gap is still solved again and again, about 3ⁿ calls, so the pair `(l, r)` is the cache key.",
      code: py`
class Solution:
    def maxCoins(self, nums: List[int]) -> int:
        balloons = [1] + nums + [1]     # pad with walls that are never burst
        # best(l, r) = most coins from bursting every balloon strictly BETWEEN l and r
        def best(l, r):
            coins = 0                   # an empty gap earns nothing
            # try each k as the LAST balloon to burst in this gap
            for k in range(l + 1, r):
                last = balloons[l] * balloons[k] * balloons[r]
                # the gaps on each side of k are solved separately
                coins = max(coins, best(l, k) + last + best(k, r))
            return coins
        return best(0, len(balloons) - 1)`,
      time: 'O(3^n)',
    },
    {
      title: 'The same thing as a table',
      note: "Optional: the lesson's solution is the cached recursion. `dp[l][r]` is `best(l, r)`; a gap only reads narrower gaps inside it, so the table fills by width, narrowest first. It does the same O(n³) work without the recursion.",
      code: py`
class Solution:
    def maxCoins(self, nums: List[int]) -> int:
        balloons = [1] + nums + [1]     # pad with walls that are never burst
        n = len(balloons)
        # dp[l][r] = most coins from bursting every balloon strictly BETWEEN l and r
        dp = [[0] * n for _ in range(n)]
        # a gap only reads narrower gaps, so fill the narrow ones first
        for width in range(2, n):
            for l in range(n - width):
                r = l + width
                # try each k as the LAST balloon to burst in this gap
                for k in range(l + 1, r):
                    last = balloons[l] * balloons[k] * balloons[r]
                    dp[l][r] = max(dp[l][r], dp[l][k] + last + dp[k][r])
        return dp[0][n - 1]`,
      time: 'O(n³)',
    },
  ],

  'regular-expression-matching': [
    {
      title: 'Plain recursion',
      note: "The **state** is a pair of positions: `match(i, j)` says whether the rest of the string, `s[i:]`, matches the rest of the pattern, `p[j:]`. If `p[j]` is followed by `*`, **choose**: skip the starred pair (`j + 2`), or, if the current character fits, eat it and stay on the pair (`i + 1`); with no star the character must fit and both move on. The **base case** is a used-up pattern, which matches only a used-up string; a pattern like `a*a*a*b` reaches the same `(i, j)` through many ways of sharing the letters among its stars (exponential time), so `(i, j)` is the cache key.",
      code: py`
class Solution:
    def isMatch(self, s: str, p: str) -> bool:
        # match(i, j) = does s[i:] (rest of the string) match p[j:] (rest of the pattern)?
        def match(i, j):
            if j == len(p):             # pattern used up: the string must be used up too
                return i == len(s)
            # does the current character fit the current pattern character?
            first = i < len(s) and (p[j] == s[i] or p[j] == '.')
            # a star comes next: skip the starred pair, or eat one character and stay
            if j + 1 < len(p) and p[j + 1] == '*':
                return match(i, j + 2) or (first and match(i + 1, j))
            # no star: the current character must fit, then move on in both
            return first and match(i + 1, j + 1)
        return match(0, 0)`,
      time: 'O(2^(m+n))',
    },
    {
      title: 'The same thing as a table',
      note: "Optional: the lesson's solution is the cached recursion. `dp[i][j]` is `match(i, j)`; a call asks for row `i + 1` or for columns `j + 1` and `j + 2`, so the table fills backwards from the bottom-right cell, the only base case that is `True`.",
      code: py`
class Solution:
    def isMatch(self, s: str, p: str) -> bool:
        m, n = len(s), len(p)
        # dp[i][j] = does s[i:] (rest of the string) match p[j:] (rest of the pattern)?
        dp = [[False] * (n + 1) for _ in range(m + 1)]
        dp[m][n] = True                 # pattern used up and string used up
        # each cell reads row i + 1 and columns j + 1 and j + 2: fill backwards
        for i in range(m, -1, -1):
            for j in range(n - 1, -1, -1):
                # does the current character fit the current pattern character?
                first = i < m and (p[j] == s[i] or p[j] == '.')
                # a star comes next: skip the starred pair, or eat one character and stay
                if j + 1 < n and p[j + 1] == '*':
                    dp[i][j] = dp[i][j + 2] or (first and dp[i + 1][j])
                # no star: the current character must fit, then move on in both
                else:
                    dp[i][j] = first and dp[i + 1][j + 1]
        return dp[0][0]`,
      time: 'O(m · n)',
    },
  ],
};
