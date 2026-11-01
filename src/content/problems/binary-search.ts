import { py, type CategoryContent } from '../types';

const content: CategoryContent = {
  guide: {
    category: 'binary-search',
    summary: `**Binary search** finds a value in a **sorted** list by looking at the middle. If the middle is too small, the answer must be to the right, so the whole left half is thrown away (and the other way round). Every step halves what is left: a million items need only about **20** checks. That is **O(log n)**.

The real requirement is not "a sorted array". It is a **yes/no question about the middle that tells you which half to keep**. That is why binary search also works on rotated lists, on grids and on timestamps.

**Binary search on the answer.** Sometimes you are not searching a list at all. You want the *smallest* value (a speed, a capacity, a size) that works, and whenever a value works, every bigger value works too. Then the possible answers are themselves "sorted" — no, no, …, yes, yes — and you binary search for the first yes.`,
    analogy:
      'Guessing a secret number from 1 to 100 while a friend says "higher" or "lower". If you always guess the middle, even 1 to 1,000,000 takes at most about 20 guesses.',
    whenToUse: [
      'The input is **sorted** (or sorted in pieces, like a rotated list) and you need to find something in it',
      'The problem demands **O(log n)** time',
      '"Find the **smallest / largest** value that still works", and a bigger value always works if a smaller one does → **binary search on the answer**',
      'You can ask a yes/no question at any position, and the answers look like no, no, …, yes, yes',
      'You need the latest record at or before some time in a history that is kept in time order',
    ],
    template: py`
def binary_search(nums, target):
    l, r = 0, len(nums) - 1
    while l <= r:                  # [l, r] still holds candidates
        m = (l + r) // 2           # look at the middle
        if nums[m] == target:
            return m
        elif nums[m] < target:     # too small: target can only be to the right
            l = m + 1
        else:                      # too big: target can only be to the left
            r = m - 1
    return -1                      # range is empty: not found


def smallest_that_works(lo, hi):
    # Binary search on the answer: works(x) is False, ..., False, True, ..., True
    answer = hi
    while lo <= hi:
        mid = (lo + hi) // 2
        if works(mid):
            answer = mid           # mid works: save it, then try smaller values
            hi = mid - 1
        else:
            lo = mid + 1           # mid fails: the answer must be bigger
    return answer`,
    templateNotes: [
      '`while l <= r` means "the range `[l, r]` still has a candidate". Once `l` passes `r`, everything has been ruled out.',
      'Always move **past** the middle (`l = m + 1` or `r = m - 1`). Writing `l = m` can loop forever.',
      'For the **first** value that works, save it and keep searching **left**. For the **last** value that works, save it and keep searching **right**.',
      'The yes/no check must be **monotonic**: once it turns True it stays True. That is what makes throwing away half safe.',
      'Python integers never overflow, so `(l + r) // 2` is fine. In Java or C++ write `l + (r - l) / 2`.',
    ],
    complexity: 'O(log n) time and O(1) space. Binary search on the answer costs O(log(range) × the cost of one check).',
    quiz: [
      {
        q: 'Roughly how many checks does binary search need to search 1,000,000 sorted items?',
        options: ['About 20', 'About 1,000', 'About 500,000', '1,000,000'],
        answer: 0,
        explain: 'Each check halves the range, and 2²⁰ is about a million, so about 20 halvings are enough.',
      },
      {
        q: 'Using the `l <= r` template, you find `nums[m] < target`. What should you do next?',
        options: ['`l = m`', '`l = m + 1`', '`r = m - 1`', '`r = m`'],
        answer: 1,
        explain: 'The middle is too small and already checked, so the next candidate is just to its right.',
      },
      {
        q: 'You need the **smallest** speed that finishes a job in time, and any faster speed also finishes in time. What fits best?',
        options: [
          'Try every speed from 1 upward',
          'Binary search over the possible speeds',
          'Sort the input first',
          'Use a hash map of speeds',
        ],
        answer: 1,
        explain: '"Fast enough?" goes no, no, …, yes, yes as speed grows, so binary search finds the first yes in O(log range) checks.',
      },
    ],
  },

  problems: [
    {
      id: 'binary-search',
      num: 704,
      title: 'Binary Search',
      difficulty: 'Easy',
      category: 'binary-search',
      pattern: 'Classic binary search',
      prompt:
        'You get a list `nums` of distinct integers sorted from smallest to largest, and a `target`. Return the index of `target`, or `-1` if it is not in the list. Your solution must run in O(log n) time.',
      examples: [
        { input: 'nums = [-4, 0, 2, 7, 11, 15], target = 7', output: '3' },
        { input: 'nums = [1, 3, 5], target = 4', output: '-1' },
      ],
      signals: ['"sorted in ascending order"', '"must run in O(log n)"', 'find the position of one value'],
      hints: [
        'Look at the middle element. What does comparing it with the target tell you?',
        'If the middle is smaller than the target, could the target be on the left?',
        'Keep a range `[l, r]`. Check the middle, then move `l` or `r` past it until the range is empty.',
      ],
      brute:
        'Scan from left to right until you find the target — **O(n)**. It ignores the fact that the list is sorted.',
      insight:
        'Because the list is sorted, one comparison with the middle tells you which half **cannot** hold the target. Throw that half away and repeat: O(log n).',
      mnemonic: 'Check the middle, throw away half, repeat until empty.',
      steps: [
        'Set l to 0 and r to the last index.',
        'While l <= r, compute the middle index m.',
        'If nums[m] equals the target, return m.',
        'If nums[m] is smaller than the target, move l to m + 1.',
        'Otherwise move r to m - 1.',
        'When the range is empty, return -1.',
      ],
      solution: py`
class Solution:
    def search(self, nums: List[int], target: int) -> int:
        #@ If the target exists, it is somewhere in nums[l..r]. Start with the whole list.
        l, r = 0, len(nums) - 1
        #@ Keep going while the range still holds at least one candidate, and look at its middle.
        while l <= r:  #!
            m = (l + r) // 2
            #@ Found it.
            if nums[m] == target:
                return m
            #@ The middle is too small, so the target can only be to its right.
            elif nums[m] < target:
                l = m + 1  #!
            #@ The middle is too big, so the target can only be to its left.
            else:
                r = m - 1  #!
        #@ The range became empty: the target is not in the list.
        return -1`,
      time: 'O(log n)',
      space: 'O(1)',
      complexityWhy: 'Each loop halves the range, so at most about log₂(n) loops run. Only a few index variables are stored.',
      pitfalls: [
        '`while l < r` skips the last remaining candidate — use `<=` with this template.',
        'Writing `l = m` instead of `l = m + 1` can loop forever on a two-element range.',
        'Starting `r` at `len(nums)` instead of `len(nums) - 1` can read past the end.',
      ],
    },
    {
      id: 'search-a-2d-matrix',
      num: 74,
      title: 'Search a 2D Matrix',
      difficulty: 'Medium',
      category: 'binary-search',
      pattern: 'Binary search on a flattened grid',
      prompt:
        'You get a grid `matrix` where every row is sorted left to right, and each row starts with a number bigger than the last number of the row above. Return `True` if `target` is in the grid. Aim for O(log(rows · cols)) time.',
      examples: [
        { input: 'matrix = [[2, 4, 7], [10, 13, 15], [21, 30, 41]], target = 13', output: 'True' },
        { input: 'matrix = [[2, 4, 7], [10, 13, 15], [21, 30, 41]], target = 8', output: 'False' },
      ],
      signals: ['each row is sorted, and each row continues where the last one ended', '"O(log(m · n))"', 'search for one value in a grid'],
      hints: [
        'If you read the grid row by row, left to right, what does the sequence of numbers look like?',
        'It is one long sorted list. Can you binary search positions `0` to `rows * cols - 1`?',
        'Position `m` lives at row `m // cols`, column `m % cols`.',
      ],
      brute:
        'Check every cell — **O(m · n)**. Binary searching each row separately is **O(m log n)**. We can do better.',
      insight:
        'Read row by row, the grid is **one sorted list** of `rows * cols` numbers. Binary search that imaginary list, turning each position `m` into the cell `(m // cols, m % cols)`.',
      mnemonic: 'Flatten it: row is m // cols, column is m % cols.',
      steps: [
        'Get the number of rows and columns.',
        'Binary search positions from 0 to rows * cols - 1.',
        'Turn the middle position m into row m // cols and column m % cols.',
        'If that value is the target, return True.',
        'Move l or r past m, depending on whether the value is too small or too big.',
        'Return False once the range is empty.',
      ],
      solution: py`
class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        #@ Read row by row, the grid is one sorted list with rows * cols positions.
        rows, cols = len(matrix), len(matrix[0])
        l, r = 0, rows * cols - 1
        #@ An ordinary binary search over those positions.
        while l <= r:
            m = (l + r) // 2
            #@ Turn the flat position back into a row and a column.
            value = matrix[m // cols][m % cols]  #!
            #@ Compare, and throw away the half that cannot hold the target.
            if value == target:
                return True
            elif value < target:
                l = m + 1
            else:
                r = m - 1
        #@ Range is empty: the target is not in the grid.
        return False`,
      time: 'O(log(m · n))',
      space: 'O(1)',
      complexityWhy: 'One binary search over m · n positions takes log(m · n) steps, and each step is O(1) arithmetic.',
      pitfalls: [
        'Divide by the number of **columns** (not rows) to get the row: `m // cols`.',
        'The last position is `rows * cols - 1`, not `rows * cols`.',
        'Another valid approach: one binary search to find the row, then one inside that row. Same O(log(m · n)).',
      ],
    },
    {
      id: 'koko-eating-bananas',
      num: 875,
      title: 'Koko Eating Bananas',
      difficulty: 'Medium',
      category: 'binary-search',
      pattern: 'Binary search on the answer',
      prompt:
        'Pile `i` has `piles[i]` bananas. Koko picks a speed `k`: each hour she chooses one pile and eats `k` bananas from it (if the pile has fewer, she finishes it and rests for the rest of that hour). Return the **smallest** `k` that lets her eat everything within `h` hours.',
      examples: [
        { input: 'piles = [4, 9, 6], h = 5', output: '5', note: 'Speed 5 takes 1 + 2 + 2 = 5 hours; speed 4 would take 1 + 3 + 2 = 6.' },
        { input: 'piles = [10, 10], h = 2', output: '10' },
      ],
      signals: ['"minimum speed / capacity / size such that…"', 'if a speed works, every faster speed works too', 'the answer lies in a known range (1 to the biggest pile)'],
      hints: [
        'If speed `k` is fast enough, is speed `k + 1` also fast enough?',
        'So the speeds go: too slow, too slow, …, OK, OK. You want the first OK.',
        'Binary search speeds from 1 to `max(piles)`. For a guess `k`, the hours are the sum of `ceil(pile / k)`.',
      ],
      brute:
        'Try speeds 1, 2, 3, … and stop at the first that finishes in time — **O(max(piles) · n)**. Far too slow when a pile can hold a billion bananas.',
      insight:
        'You are not searching an array, you are searching the **answer**. "Is speed k fast enough?" goes no, no, …, yes, yes as k grows, so binary search for the first yes.',
      mnemonic: 'Guess a speed: fast enough, go slower; too slow, go faster.',
      steps: [
        'Set the speed range from 1 to the largest pile.',
        'Pick the middle speed k.',
        'Add up the hours needed: ceil(pile / k) for every pile.',
        'If the hours fit within h, save k and search the slower half.',
        'Otherwise search the faster half.',
        'Return the smallest speed that worked.',
      ],
      solution: py`
class Solution:
    def minEatingSpeed(self, piles: List[int], h: int) -> int:
        #@ The speed is between 1 and the biggest pile (faster never helps: one pile per hour is the limit).
        l, r = 1, max(piles)
        answer = r
        #@ Binary search over speeds, not over the list.
        while l <= r:
            k = (l + r) // 2
            #@ Hours needed at speed k: each pile takes ceil(pile / k) hours.
            hours = sum(math.ceil(p / k) for p in piles)  #!
            #@ Fast enough? Remember k, then see if an even slower speed works.
            if hours <= h:  #!
                answer = k
                r = k - 1
            #@ Too slow: Koko must eat faster.
            else:
                l = k + 1
        return answer`,
      time: 'O(n log m)',
      space: 'O(1)',
      complexityWhy:
        'Binary search tries about log m speeds (m = the biggest pile), and checking one speed sums over all n piles.',
      pitfalls: [
        'Each pile takes **ceil**(pile / k) hours, not pile / k — Koko cannot switch piles in the middle of an hour.',
        'The upper bound is `max(piles)`: at that speed every pile takes exactly one hour, and faster cannot do better.',
        'Save the answer *before* moving `r = k - 1`, or you lose the last speed that worked.',
      ],
    },
    {
      id: 'find-minimum-in-rotated-sorted-array',
      num: 153,
      title: 'Find Minimum in Rotated Sorted Array',
      difficulty: 'Medium',
      category: 'binary-search',
      pattern: 'Binary search for the rotation point',
      prompt:
        'A sorted list of **distinct** numbers was rotated: some numbers from the front were moved, in order, to the back (for example `[1, 2, 3, 4]` → `[3, 4, 1, 2]`). Return the **smallest** number in O(log n) time.',
      examples: [
        { input: 'nums = [6, 8, 9, 1, 3]', output: '1' },
        { input: 'nums = [2, 4, 7, 9]', output: '2', note: 'Not rotated at all (or rotated all the way around).' },
      ],
      signals: ['"sorted and rotated"', '"must run in O(log n)"', 'find the minimum, which is where the rotation happened'],
      hints: [
        'A rotated sorted list is two sorted runs glued together. Where is the minimum?',
        'Compare any value with the **last** value. What does that tell you about which run it is in?',
        'Values `<= nums[-1]` are in the second run. Binary search for the first such index.',
      ],
      brute: 'Scan for the smallest value (or call `min(nums)`) — **O(n)**. It ignores the sorted structure.',
      insight:
        'Every value in the second run is **≤ the last value**, and every value in the first run is bigger. So "is nums[m] ≤ nums[-1]?" goes no, no, …, yes, yes, and the minimum sits at the **first yes**.',
      mnemonic: 'Compare with the last; find the first value not bigger.',
      steps: [
        'Remember the last value and set l and r to the two ends.',
        'Compute the middle index m.',
        'If nums[m] <= last, it is in the second run: save it and search left.',
        'Otherwise nums[m] is in the first run: search right.',
        'Return the saved value.',
      ],
      solution: py`
class Solution:
    def findMin(self, nums: List[int]) -> int:
        #@ The list is two sorted runs. Values in the second run are <= the last value; values in the first run are bigger.
        last = nums[-1]
        l, r = 0, len(nums) - 1
        answer = last
        #@ Binary search for the FIRST index whose value is <= last. That is where the minimum is.
        while l <= r:
            m = (l + r) // 2
            #@ nums[m] is in the second run: a candidate. An earlier one may exist, so look left.
            if nums[m] <= last:  #!
                answer = nums[m]
                r = m - 1
            #@ nums[m] is in the first, bigger run: the minimum must be to the right.
            else:
                l = m + 1  #!
        return answer`,
      time: 'O(log n)',
      space: 'O(1)',
      complexityWhy: 'Each step halves the range, and only a few variables are kept.',
      pitfalls: [
        'Compare with the **last** value, not the first: a list that is not rotated at all would fool a first-value check.',
        'Do not stop at the first value `<= last` you meet — keep searching left for an earlier one.',
        'This relies on distinct values. With duplicates (a harder follow-up), the comparison can be a tie and tell you nothing.',
      ],
    },
    {
      id: 'search-in-rotated-sorted-array',
      num: 33,
      title: 'Search in Rotated Sorted Array',
      difficulty: 'Medium',
      category: 'binary-search',
      pattern: 'Binary search: find the sorted half',
      prompt:
        'A sorted list of **distinct** integers has been rotated at an unknown point (some numbers from the front moved, in order, to the back). Given `target`, return its index, or `-1` if it is not there, in O(log n) time.',
      examples: [
        { input: 'nums = [5, 7, 9, 0, 2, 3], target = 2', output: '4' },
        { input: 'nums = [5, 7, 9, 0, 2, 3], target = 6', output: '-1' },
      ],
      signals: ['"rotated sorted array"', '"must run in O(log n)"', 'return the index of a target'],
      hints: [
        'Cut the list at the middle. Is at least one of the two halves guaranteed to be in sorted order?',
        'Yes. Compare `nums[l]` with `nums[m]` to learn which half is sorted.',
        'In the sorted half you can check whether the target fits inside its range. If it does, search there; if not, search the other half.',
      ],
      brute:
        'Scan every element — **O(n)**. Finding the rotation point first and then binary searching one run also works, but takes two passes.',
      insight:
        'At any middle point, **one half is always sorted**. Check whether the target fits inside the range of that sorted half: if yes, go there; if not, it can only be in the other half.',
      mnemonic: 'Find the sorted half; is the target inside it?',
      steps: [
        'Set l and r to the two ends and compute the middle m.',
        'If nums[m] is the target, return m.',
        'If nums[l] <= nums[m], the left half is sorted: go left if the target lies between nums[l] and nums[m], else go right.',
        'Otherwise the right half is sorted: go right if the target lies between nums[m] and nums[r], else go left.',
        'Return -1 once the range is empty.',
      ],
      solution: py`
class Solution:
    def search(self, nums: List[int], target: int) -> int:
        #@ Standard binary search setup over the whole list.
        l, r = 0, len(nums) - 1
        while l <= r:
            m = (l + r) // 2
            #@ Lucky hit: the middle is the target.
            if nums[m] == target:
                return m
            #@ One half is always sorted. If nums[l] <= nums[m], it is the left half nums[l..m].
            if nums[l] <= nums[m]:  #!
                #@ Target inside the sorted left half? Search left. Otherwise it must be on the right.
                if nums[l] <= target < nums[m]:  #!
                    r = m - 1
                else:
                    l = m + 1
            #@ Otherwise the right half nums[m..r] is sorted: same idea using its range.
            else:
                if nums[m] < target <= nums[r]:  #!
                    l = m + 1
                else:
                    r = m - 1
        #@ The range became empty: the target is not in the list.
        return -1`,
      time: 'O(log n)',
      space: 'O(1)',
      complexityWhy: 'Every step throws away half of the remaining range, and only a few indices are stored.',
      pitfalls: [
        'Use `nums[l] <= nums[m]` (with the `=`): when `l == m` the left half is a single element, which still counts as sorted.',
        'The range checks must leave out `nums[m]` itself (already checked), so get each `<` and `<=` right.',
        'Comparing the target with `nums[m]` alone, as in plain binary search, fails because the order wraps around.',
      ],
    },
    {
      id: 'time-based-key-value-store',
      num: 981,
      title: 'Time Based Key-Value Store',
      difficulty: 'Medium',
      category: 'binary-search',
      pattern: 'Binary search over timestamps',
      prompt:
        'Design a `TimeMap` class. `set(key, value, timestamp)` stores `value` under `key` at that time. `get(key, timestamp)` returns the value stored for `key` at the **latest time ≤ timestamp**, or `""` if there is none. Calls to `set` always use increasing timestamps.',
      examples: [
        {
          input:
            'tm = TimeMap(); tm.set("color", "red", 3); tm.set("color", "blue", 8); tm.get("color", 5); tm.get("color", 10); tm.get("color", 1)',
          output: '"red", "blue", ""',
          note: 'The three get results in order. At time 5 the newest value set at or before 5 is "red"; nothing was set by time 1.',
        },
      ],
      signals: ['"latest value at or before a given time"', 'timestamps arrive in increasing order (already sorted)', 'many lookups, so a linear scan per call is too slow'],
      hints: [
        'For one key, what would a list of `(timestamp, value)` pairs look like if you appended on every `set`?',
        'It is sorted by timestamp for free, because timestamps only increase.',
        'For `get`, binary search for the **last** pair whose timestamp is `<=` the one asked for.',
      ],
      brute:
        'For `get`, scan every pair stored for that key and keep the newest one that is not after the asked time — **O(n)** per call.',
      insight:
        'Append each `set` to a list for its key. Because timestamps increase, every list is **already sorted**, so a `get` is a binary search for the last timestamp ≤ the asked one.',
      mnemonic: 'Append in time order; binary search the last time not after.',
      steps: [
        'Keep a dict that maps each key to a list of (timestamp, value) pairs.',
        'On set, append (timestamp, value) to the list for that key.',
        'On get, fetch the list for the key (empty if missing) and start with an answer of "".',
        'Binary search: if the middle timestamp is <= the asked time, save its value and search right.',
        'Otherwise search left, and finally return the saved answer.',
      ],
      solution: py`
class TimeMap:
    def __init__(self):
        #@ Each key maps to a list of (timestamp, value) pairs, kept in time order.
        self.store = {}

    #@ Timestamps only increase, so appending keeps every list sorted for free.
    def set(self, key: str, value: str, timestamp: int) -> None:
        if key not in self.store:
            self.store[key] = []
        self.store[key].append((timestamp, value))  #!

    #@ To answer get, look at that key's history ("" if the key was never set).
    def get(self, key: str, timestamp: int) -> str:
        pairs = self.store.get(key, [])
        answer = ""
        l, r = 0, len(pairs) - 1
        #@ Binary search for the LAST pair whose time is <= timestamp: save it, then look right for a later one.
        while l <= r:
            m = (l + r) // 2
            if pairs[m][0] <= timestamp:  #!
                answer = pairs[m][1]
                l = m + 1
            #@ That pair is from the future: look left.
            else:
                r = m - 1
        return answer`,
      time: 'O(1) set, O(log n) get',
      space: 'O(n)',
      complexityWhy:
        'set is a single append. get binary searches the n pairs stored for one key. All pairs ever set are stored.',
      pitfalls: [
        'Search for the **last** timestamp `<=` the asked one: after a match, keep going right, not left.',
        'A key that was never set must return `""`, not raise a KeyError.',
        'Do not sort on every `set` — timestamps already arrive in order.',
      ],
    },
    {
      id: 'median-of-two-sorted-arrays',
      num: 4,
      title: 'Median of Two Sorted Arrays',
      difficulty: 'Hard',
      category: 'binary-search',
      pattern: 'Binary search the cut in the shorter list',
      prompt:
        'You get two sorted lists `nums1` and `nums2`. Return the **median** of all their numbers combined (the middle value, or the average of the two middle values when the total count is even). Aim for O(log(m + n)) time.',
      examples: [
        { input: 'nums1 = [1, 4, 9], nums2 = [2, 3]', output: '3.0', note: 'Combined: [1, 2, 3, 4, 9].' },
        { input: 'nums1 = [5, 8], nums2 = [1, 7]', output: '6.0', note: 'Combined: [1, 5, 7, 8], so (5 + 7) / 2.' },
      ],
      signals: ['two **sorted** lists', '"O(log(m + n))"', 'a median splits everything into a smaller half and a bigger half'],
      hints: [
        'The median splits all numbers into a left (smaller) half and a right (bigger) half. If the left half takes `i` numbers from the first list, how many must it take from the second?',
        '`j = half - i`. The split is right when every left number is ≤ every right number — you only need to check the numbers next to each cut.',
        'Binary search `i` on the **shorter** list. If `A[i - 1] > B[j]`, A gave too many; if `B[j - 1] > A[i]`, A gave too few.',
      ],
      brute:
        'Merge the two lists (like in merge sort) and pick the middle — **O(m + n)** time and space. Simple, but not logarithmic.',
      insight:
        'Do not merge — **cut**. Choose how many numbers `i` the left half takes from the shorter list A; the rest, `j = half - i`, come from B. Binary search `i` until every left number is ≤ every right number. Then the median sits right at the cut.',
      mnemonic: 'Cut both lists; left maxes ≤ right mins; search the shorter.',
      steps: [
        'Make A the shorter list and compute half = (total + 1) // 2.',
        'Binary search i, how many numbers A gives to the left half, and set j = half - i.',
        'Read the four numbers beside the two cuts, using minus and plus infinity past the ends.',
        'If both left numbers are <= both right numbers, compute the median from them.',
        'If the left number in A is too big, move i left; otherwise move i right.',
      ],
      solution: py`
class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        #@ Binary search the shorter list A. The left half must hold half = (total + 1) // 2 numbers.
        A, B = nums1, nums2
        if len(A) > len(B):
            A, B = B, A
        total = len(A) + len(B)
        half = (total + 1) // 2
        #@ i = how many numbers A gives to the left half; B gives the rest.
        l, r = 0, len(A)
        while l <= r:
            i = (l + r) // 2
            j = half - i  #!
            #@ The numbers right beside each cut. Past either end, use -infinity or +infinity.
            a_left = A[i - 1] if i > 0 else float("-inf")
            a_right = A[i] if i < len(A) else float("inf")
            b_left = B[j - 1] if j > 0 else float("-inf")
            b_right = B[j] if j < len(B) else float("inf")
            #@ Correct cut: every left number is <= every right number. The median sits at the cut.
            if a_left <= b_right and b_left <= a_right:  #!
                if total % 2 == 1:
                    return float(max(a_left, b_left))
                return (max(a_left, b_left) + min(a_right, b_right)) / 2
            #@ A gave too many numbers: move its cut left.
            elif a_left > b_right:
                r = i - 1
            #@ A gave too few numbers: move its cut right.
            else:
                l = i + 1`,
      time: 'O(log(min(m, n)))',
      space: 'O(1)',
      complexityWhy:
        'The binary search runs over the cut positions of the shorter list only, and each step does O(1) work.',
      pitfalls: [
        'Binary search the **shorter** list. Otherwise `j` can go negative or past the end of B.',
        'Use minus/plus infinity for a missing neighbor when a cut is at the very start or end of a list.',
        'With an odd total, the median is the bigger of the two left numbers. That is why `half` rounds up: `(total + 1) // 2`.',
      ],
    },
  ],
};

export default content;
