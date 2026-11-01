import { py, type CategoryContent } from '../types';

const content: CategoryContent = {
  guide: {
    category: 'backtracking',
    summary: `**Backtracking** is an organized way to try *every* possibility. You build an answer one piece at a time, and as soon as a piece leads nowhere you take it back and try the next option.

Picture a **decision tree**. The root is an empty answer. Each branch is one choice ("add 3", "skip 3", "put a queen in column 2"). A path from the root down to a leaf is one complete candidate. Backtracking is simply a depth-first walk over that tree.

Every backtracking step repeats the same three moves: **choose** an option (append it to the path), **explore** (recurse to make the next choice), **un-choose** (pop it off so the path is clean for the next option).

**Pruning** is what keeps it fast enough: when a partial path already breaks the rules (the sum is too big, two queens attack), stop right there instead of growing it further. One early \`continue\` can cut off a whole subtree.`,
    analogy:
      'Exploring a maze with a ball of string. At each fork you pick a corridor and unroll string as you walk. Dead end? Wind the string back to the last fork and try the next corridor. The string is your `path`; winding it back is the un-choose step.',
    whenToUse: [
      'The problem asks for **all** subsets, combinations, permutations or arrangements',
      'You build an answer piece by piece and each piece has a few options → a **decision tree**',
      '"Return every way to…" or "find all valid…" in the prompt',
      'Small input limits (n ≤ 10–20) hint that exponential time is expected',
      'Placing things under rules (queens, letters along a grid path) → **try, check, undo**',
      'Duplicates in the input but the answer must not repeat → **sort, then skip equal values at the same level**',
    ],
    template: py`
def solve(choices):
    res = []
    path = []

    def backtrack(start):
        if is_complete(path):          # base case: one full answer
            res.append(path[:])        # store a COPY of the path
            return
        for i in range(start, len(choices)):
            if not is_valid(choices[i], path):
                continue               # prune: skip this whole subtree
            path.append(choices[i])    # 1. choose
            backtrack(i + 1)           # 2. explore what can follow
            path.pop()                 # 3. un-choose

    backtrack(0)
    return res`,
    templateNotes: [
      'Save `path[:]` (a copy). Saving `path` itself stores a reference to one list that later pops will empty.',
      '`start` stops you from picking earlier items again, so `[1, 2]` and `[2, 1]` are not both produced. Permutations drop `start` and use a `used` array instead, because there order matters.',
      'Every `append` needs a matching `pop` after the recursive call. That un-choose step resets the path for the next option.',
      'Recurse with `i + 1` when each item may be used once, and with `i` when an item may be reused (Combination Sum).',
      'Duplicates? Sort first and skip `nums[i]` when `i > start and nums[i] == nums[i - 1]`: equal values at the same level would grow identical subtrees.',
    ],
    complexity:
      'Exponential: about O(n · 2ⁿ) for subsets and O(n · n!) for permutations (the extra n is copying each answer). Extra space is O(n) for the path and the recursion.',
    quiz: [
      {
        q: 'What are the three moves inside every backtracking step?',
        options: ['Choose, explore, un-choose', 'Sort, search, return', 'Push, pop, peek', 'Split, solve, merge'],
        answer: 0,
        explain:
          'Append a choice, recurse to explore everything that can follow it, then pop it so the next option starts from a clean path.',
      },
      {
        q: 'This Subsets code returns `[[], [], [], []]` for `nums = [1, 2]`. What is the bug?',
        code: py`
def backtrack(start):
    res.append(path)
    for i in range(start, len(nums)):
        path.append(nums[i])
        backtrack(i + 1)
        path.pop()`,
        options: [
          'The loop should start at 0',
          'It saves `path` itself instead of a copy `path[:]`',
          'It should recurse with `i` instead of `i + 1`',
          '`path.pop()` should come before the recursive call',
        ],
        answer: 1,
        explain:
          'All four entries are the *same* list object. After the final pop it is empty, so every saved subset looks empty. Save `path[:]`.',
      },
      {
        q: 'In Subsets II the numbers are sorted to `[1, 2, 2]`. Which line stops `[1, 2]` from being produced twice?',
        options: [
          '`if i > start and nums[i] == nums[i - 1]: continue`',
          '`if nums[i] in path: continue`',
          '`if i > 0: break`',
          '`res = list(set(res))`',
        ],
        answer: 0,
        explain:
          'At one level of the tree only the first of several equal values may start a branch. The second `2` would grow exactly the same subtree as the first.',
      },
      {
        q: 'Which problem drops the `start` index and tracks a `used` array instead?',
        options: ['Subsets', 'Combination Sum', 'Permutations', 'Palindrome Partitioning'],
        answer: 2,
        explain:
          'In a permutation order matters, so any unused number may come next, even one that appears earlier in the list.',
      },
    ],
  },

  problems: [
    {
      id: 'subsets',
      num: 78,
      title: 'Subsets',
      difficulty: 'Medium',
      category: 'backtracking',
      pattern: 'Backtracking over a decision tree',
      prompt:
        'You get a list of **distinct** integers `nums`. Return **every possible subset** of it, including the empty subset and the whole list. The subsets may come in any order, but none may appear twice.',
      examples: [
        { input: 'nums = [5, 8]', output: '[[], [5], [5, 8], [8]]', note: 'Each number is either in or out: 2 × 2 = 4 subsets.' },
        { input: 'nums = [3, 1, 4]', output: '[[], [3], [3, 1], [3, 1, 4], [3, 4], [1], [1, 4], [4]]' },
      ],
      signals: ['"all subsets" or "power set"', 'every element is either in or out', 'small n (around 10), so a huge output is expected'],
      hints: [
        'For each number you make one yes/no decision. How many different sets of decisions are there?',
        'Build subsets one number at a time. Every partial list you build along the way is itself a subset.',
        'backtrack(start): save a copy of the path, then for each i from start, append nums[i], recurse with i + 1, and pop.',
      ],
      brute:
        'Count from 0 to 2ⁿ − 1 and use the bits of each number to pick elements. That is also **O(n · 2ⁿ)**, which is fine because the output itself has 2ⁿ subsets, but the trick does not stretch to the harder problems in this unit. Backtracking does.',
      insight:
        'Walk a decision tree: at each level, add one more number chosen from those **after** the last one you picked. Every node of the tree, not just the leaves, is a subset, so save the path each time you enter the function.',
      mnemonic: 'Save the path, then add each later number, recurse, pop.',
      steps: [
        'Create an empty result list and an empty path.',
        'On entering backtrack(start), save a copy of the path.',
        'Loop i from start to the end of nums.',
        'Choose: append nums[i] to the path.',
        'Explore: recurse with start = i + 1.',
        'Un-choose: pop nums[i] off the path.',
        'Call backtrack(0) and return the result.',
      ],
      solution: py`
class Solution:
    def subsets(self, nums: List[int]) -> List[List[int]]:
        #@ res collects every subset; path is the subset we are building right now.
        res = []
        path = []

        #@ start is the first index we may still pick, so we never look backwards.
        def backtrack(start):
            #@ Every path we reach is a valid subset, so save a COPY on entry.
            res.append(path[:])  #!
            #@ Try each remaining number as the next element.
            for i in range(start, len(nums)):
                #@ Choose nums[i], explore everything that can follow it, then un-choose.
                path.append(nums[i])
                backtrack(i + 1)  #!
                path.pop()  #!

        #@ Begin with the empty path at index 0.
        backtrack(0)
        return res`,
      time: 'O(n · 2ⁿ)',
      space: 'O(n)',
      complexityWhy:
        'There are 2ⁿ subsets and copying each one takes up to O(n). Apart from the output, the path and the recursion stack are at most n deep.',
      pitfalls: [
        'Saving `path` instead of `path[:]`: every stored subset is the same list, which ends up empty.',
        'Recursing with `i` instead of `i + 1` picks the same number again and again, forever.',
        'The empty subset counts. Saving on entry includes it automatically.',
      ],
    },
    {
      id: 'combination-sum',
      num: 39,
      title: 'Combination Sum',
      difficulty: 'Medium',
      category: 'backtracking',
      pattern: 'Backtracking with reuse (recurse on the same index)',
      prompt:
        'Given a list of **distinct positive** integers `candidates` and a number `target`, return every **unique combination** of candidates that adds up to `target`. You may use a number **as many times as you like**. Two combinations are the same if they use the same numbers the same number of times, whatever the order.',
      examples: [
        { input: 'candidates = [3, 4, 5], target = 8', output: '[[3, 5], [4, 4]]', note: '4 may be used twice.' },
        { input: 'candidates = [6], target = 4', output: '[]', note: 'Every candidate is bigger than the target.' },
      ],
      signals: [
        '"all unique combinations" that sum to a target',
        '"the same number may be chosen an unlimited number of times"',
        'positive numbers, so the running sum only grows (easy pruning)',
      ],
      hints: [
        'Think of subtracting each pick from the target. When what remains hits 0, you have a combination.',
        'To avoid getting both [3, 5] and [5, 3], only allow picks at the current index or later.',
        'Recurse with the **same** index i (not i + 1) so a number can be reused, and skip any candidate bigger than what remains.',
      ],
      brute:
        'Build every sequence of picks, in every order, until the sum reaches or passes the target, then remove orderings of the same combination. With t = target and m = the smallest candidate, that is **O(n^(t/m))** sequences, most of them repeats.',
      insight:
        'Track the **remaining** amount. Pick candidates from index `start` onward and recurse with the **same** index, so a number can repeat. Never going back to earlier indices means each combination is built in only one order.',
      mnemonic: 'Subtract and recurse on the same i; save at zero.',
      steps: [
        'Start backtracking at index 0 with the whole target remaining.',
        'If remaining is 0, save a copy of the path.',
        'Loop i from start, skipping any candidate bigger than remaining.',
        'Choose: append candidates[i] to the path.',
        'Explore with the same index i and remaining minus candidates[i].',
        'Un-choose: pop the last number.',
      ],
      solution: py`
class Solution:
    def combinationSum(self, candidates: List[int], target: int) -> List[List[int]]:
        #@ res collects finished combinations; path is the one being built.
        res = []
        path = []

        #@ remaining is how much we still need to add to reach the target.
        def backtrack(start, remaining):
            #@ Hit the target exactly: save a copy of this combination.
            if remaining == 0:  #!
                res.append(path[:])
                return
            #@ Only candidates from start onward, so no combination appears in two orders.
            for i in range(start, len(candidates)):
                #@ Too big? It would push the sum past the target, so skip it.
                if candidates[i] > remaining:
                    continue
                #@ Choose it, explore from the SAME index (reuse allowed), then un-choose.
                path.append(candidates[i])
                backtrack(i, remaining - candidates[i])  #!
                path.pop()

        #@ Begin with every candidate available and the whole target still needed.
        backtrack(0, target)
        return res`,
      time: 'O(n^(t/m))',
      space: 'O(t/m)',
      complexityWhy:
        'With t = target and m = the smallest candidate, the tree is at most t/m levels deep and each level branches up to n ways. The path and the recursion are at most t/m deep.',
      pitfalls: [
        'Recursing with `i + 1` forbids reuse, so `[4, 4]` would be missed.',
        'Starting the loop at 0 instead of `start` produces the same combination in different orders, like `[3, 5]` and `[5, 3]`.',
        'Saving `path` without copying it: later pops would empty every stored answer.',
      ],
    },
    {
      id: 'permutations',
      num: 46,
      title: 'Permutations',
      difficulty: 'Medium',
      category: 'backtracking',
      pattern: 'Backtracking with a used array',
      prompt:
        'Given a list of **distinct** integers `nums`, return **every possible ordering** (permutation) of them. The orderings may come in any order.',
      examples: [
        { input: 'nums = [7, 2]', output: '[[7, 2], [2, 7]]' },
        {
          input: 'nums = [4, 5, 6]',
          output: '[[4, 5, 6], [4, 6, 5], [5, 4, 6], [5, 6, 4], [6, 4, 5], [6, 5, 4]]',
          note: '3 numbers give 3 × 2 × 1 = 6 orderings.',
        },
      ],
      signals: ['"all possible orderings" or "arrangements"', 'every element used exactly once', 'order matters: [1, 2] differs from [2, 1]'],
      hints: [
        'Fill the answer one position at a time. How many choices do you have for the first position? For the second?',
        'Unlike Subsets, any unused number may come next, even one that appears earlier in nums. How do you know which ones are still free?',
        'Keep a used[] array. Loop over every index, skip used ones, mark, recurse, unmark. Save when the path holds all n numbers.',
      ],
      brute:
        'Try all nⁿ ways to fill n positions and throw away the ones that repeat a number: **O(n · nⁿ)**, far more work than the n! real answers.',
      insight:
        'At each position, any number not used yet can go next. A **used** marker (instead of a `start` index) lets every unused number be chosen, so different orders are all produced. A path of length n is one permutation.',
      mnemonic: 'Any unused number can go next: mark, recurse, unmark.',
      steps: [
        'Keep a path and a used flag for every index.',
        'If the path holds every number, save a copy.',
        'Loop over all indices, skipping ones already used.',
        'Choose: mark the index used and append its number.',
        'Explore: recurse to fill the next position.',
        'Un-choose: pop the number and mark the index unused.',
      ],
      solution: py`
class Solution:
    def permute(self, nums: List[int]) -> List[List[int]]:
        #@ res holds answers, path the ordering so far, used[i] whether nums[i] is in it.
        res = []
        path = []
        used = [False] * len(nums)

        #@ Each call fills the next position of the ordering.
        def backtrack():
            #@ The path contains every number: one complete permutation.
            if len(path) == len(nums):  #!
                res.append(path[:])
                return
            #@ Any number not yet used may take this position.
            for i in range(len(nums)):
                if used[i]:  #!
                    continue
                #@ Choose nums[i] and mark it, so deeper levels skip it.
                used[i] = True
                path.append(nums[i])
                #@ Explore the remaining positions, then undo both changes.
                backtrack()
                path.pop()
                used[i] = False  #!

        #@ Start with an empty ordering.
        backtrack()
        return res`,
      time: 'O(n · n!)',
      space: 'O(n)',
      complexityWhy:
        'There are n! permutations and copying each one costs O(n). The path, the used array and the recursion stack are each O(n).',
      pitfalls: [
        'Forgetting `used[i] = False` after the call: later branches think the number is still taken and you get too few results.',
        'Looping from a `start` index (as in Subsets) loses orderings such as `[2, 7]`.',
        'Saving `path` instead of a copy `path[:]`.',
      ],
    },
    {
      id: 'subsets-ii',
      num: 90,
      title: 'Subsets II',
      difficulty: 'Medium',
      category: 'backtracking',
      pattern: 'Sort, then skip duplicates at the same level',
      prompt:
        'Like Subsets, but `nums` **may contain duplicates**. Return every possible subset, listing each **distinct** subset only once. The subsets may come in any order.',
      examples: [
        { input: 'nums = [3, 3]', output: '[[], [3], [3, 3]]', note: 'Picking either 3 alone gives the same subset [3], so it is listed once.' },
        { input: 'nums = [5, 1, 5]', output: '[[], [1], [1, 5], [1, 5, 5], [5], [5, 5]]' },
      ],
      signals: [
        '"all subsets" but the input **contains duplicates**',
        '"the answer must not contain duplicate subsets"',
        'equal values are interchangeable',
      ],
      hints: [
        'Sort the numbers first. Where do equal values end up?',
        'A duplicate subset appears when two equal numbers each start a branch at the same level of the tree.',
        'Inside the loop, skip nums[i] when i > start and nums[i] == nums[i - 1].',
      ],
      brute:
        'Generate all 2ⁿ subsets, sort each one, and drop repeats with a set of tuples: **O(n log n · 2ⁿ)** plus extra memory, and it still builds every duplicate before throwing it away.',
      insight:
        'Sort so equal values sit together. At any one level of the decision tree, only the **first** of a run of equal values may start a branch; the others would grow an identical subtree. Deeper levels may still take the copies.',
      mnemonic: 'Sort, then skip a repeat at the same level.',
      steps: [
        'Sort nums so equal values are next to each other.',
        'On entering backtrack(start), save a copy of the path.',
        'Loop i from start to the end of nums.',
        'Skip nums[i] if i > start and it equals nums[i - 1].',
        'Append nums[i], recurse with i + 1, then pop.',
      ],
      solution: py`
class Solution:
    def subsetsWithDup(self, nums: List[int]) -> List[List[int]]:
        #@ Sorting puts equal values side by side, so repeats are easy to spot.
        nums.sort()  #!
        res = []
        path = []

        #@ Same shape as Subsets: every path we reach is a subset, so save a copy.
        def backtrack(start):
            res.append(path[:])
            #@ Try each remaining number as the next element.
            for i in range(start, len(nums)):
                #@ A repeat at the SAME level would grow an identical branch: skip it.
                if i > start and nums[i] == nums[i - 1]:  #!
                    continue
                #@ Choose, explore with i + 1, un-choose.
                path.append(nums[i])
                backtrack(i + 1)
                path.pop()

        #@ Begin with the empty subset at index 0.
        backtrack(0)
        return res`,
      time: 'O(n · 2ⁿ)',
      space: 'O(n)',
      complexityWhy:
        'In the worst case (no duplicates) there are 2ⁿ subsets, each copied in O(n); sorting adds only O(n log n). The path and the recursion are at most n deep.',
      pitfalls: [
        'Writing `i > 0` instead of `i > start` also skips copies that are allowed deeper down, so `[3, 3]` would be lost.',
        'Forgetting to sort: duplicates are only next to each other after sorting.',
        'Deduplicating with a set of tuples works, but it hides the idea interviewers want to see.',
      ],
    },
    {
      id: 'combination-sum-ii',
      num: 40,
      title: 'Combination Sum II',
      difficulty: 'Medium',
      category: 'backtracking',
      pattern: 'Sort, skip same-level duplicates, recurse on i + 1',
      prompt:
        'Given a list `candidates` that **may contain duplicates** and a number `target`, return every unique combination that adds up to `target`. Each list element may be used **at most once**, and no combination may be listed twice.',
      examples: [
        {
          input: 'candidates = [4, 1, 3, 1, 2], target = 5',
          output: '[[1, 1, 3], [1, 4], [2, 3]]',
          note: 'The two 1s may both be used in one combination, but [1, 4] is listed once.',
        },
        { input: 'candidates = [2, 2, 2], target = 4', output: '[[2, 2]]' },
      ],
      signals: [
        '"each number may only be used once"',
        'the input **has duplicates** but combinations must be unique',
        'positive numbers adding up to a target',
      ],
      hints: [
        'This is Combination Sum with two changes: no reuse, and duplicate values in the input.',
        'No reuse means recursing with i + 1. Unique answers means the Subsets II trick.',
        'Sort, skip candidates[i] when i > start and it equals candidates[i - 1], and stop the loop once a candidate is bigger than what remains.',
      ],
      brute:
        'Generate all 2ⁿ subsets, keep those that hit the target, and remove repeats with a set of sorted tuples: **O(n · 2ⁿ)** with no pruning, so it keeps growing sums that already overshot.',
      insight:
        'Sort first. Then (1) recurse with `i + 1` so each element is used once, (2) skip equal values at the same level so no combination repeats, and (3) **break** as soon as a candidate is too big, because every later one is even bigger.',
      mnemonic: 'Sort; skip same-level repeats; break when too big.',
      steps: [
        'Sort the candidates.',
        'If remaining is 0, save a copy of the path.',
        'Loop i from start; skip a value equal to the previous one at this level.',
        'Stop the loop once a candidate is bigger than remaining.',
        'Append the candidate, recurse with i + 1 and the smaller remainder, then pop.',
      ],
      solution: py`
class Solution:
    def combinationSum2(self, candidates: List[int], target: int) -> List[List[int]]:
        #@ Sort so duplicates are adjacent and big values come last.
        candidates.sort()
        res = []
        path = []

        #@ remaining is how much of the target is still unfilled.
        def backtrack(start, remaining):
            #@ Exactly hit the target: save this combination.
            if remaining == 0:
                res.append(path[:])
                return
            #@ Try each candidate from start onward as the next pick.
            for i in range(start, len(candidates)):
                #@ Same value as the previous choice at this level? It would repeat a branch.
                if i > start and candidates[i] == candidates[i - 1]:  #!
                    continue
                #@ Sorted, so if this one is too big, every later one is too: stop.
                if candidates[i] > remaining:  #!
                    break
                #@ Use it once: explore from i + 1, then un-choose.
                path.append(candidates[i])
                backtrack(i + 1, remaining - candidates[i])  #!
                path.pop()

        #@ Start at index 0 with the full target to fill.
        backtrack(0, target)
        return res`,
      time: 'O(n · 2ⁿ)',
      space: 'O(n)',
      complexityWhy:
        'Each element is either used or not, so there are at most 2ⁿ paths, and copying an answer costs O(n). The recursion is at most n deep.',
      pitfalls: [
        'Skipping with `i > 0` instead of `i > start` forbids real answers such as `[1, 1, 3]`.',
        'Recursing with `i` (as in Combination Sum) lets one element be used twice.',
        '`break` is only safe because the list is sorted. Without sorting, both the duplicate skip and the early stop break.',
      ],
    },
    {
      id: 'word-search',
      num: 79,
      title: 'Word Search',
      difficulty: 'Medium',
      category: 'backtracking',
      alsoAccept: ['graphs'],
      pattern: 'Grid DFS backtracking with in-place marking',
      prompt:
        'You get a grid of letters `board` and a string `word`. Return `True` if the word can be spelled along a path of cells where each step moves **up, down, left or right** and **no cell is used twice**. Otherwise return `False`.',
      examples: [
        {
          input: 'board = [["C", "A", "T"], ["X", "R", "S"], ["D", "O", "G"]], word = "CARS"',
          output: 'True',
          note: 'C (top left) → A (right) → R (down) → S (right).',
        },
        {
          input: 'board = [["C", "A", "T"], ["X", "R", "S"], ["D", "O", "G"]], word = "SRS"',
          output: 'False',
          note: 'The only S would have to be used twice.',
        },
      ],
      signals: [
        'a 2-D grid of letters',
        '"adjacent" cells (up, down, left, right)',
        '"the same cell may not be used more than once"',
        'does some path spell the word?',
      ],
      hints: [
        'The word must start somewhere. Try every cell as the starting point.',
        'From a matching cell, the next letter must be in one of the four neighbors. That is a recursive search.',
        'Mark the current cell as used (overwrite it with a placeholder), search the four neighbors for the next letter, then put the letter back before returning.',
      ],
      brute:
        'List every path in the grid and compare its letters to the word: exponential in the size of the grid, roughly **O(4^(m·n))**. Backtracking only follows a path while its letters keep matching.',
      insight:
        'Start a DFS from every cell. Each step must land on the next letter of the word. Mark the cell as used while you explore its neighbors, and **restore it on the way back** so other paths may use it.',
      mnemonic: 'Match, mark, search four ways, unmark.',
      steps: [
        'In dfs(r, c, k), return True once k equals the length of the word.',
        'Return False if the cell is off the grid or does not match word[k].',
        'Temporarily overwrite the cell so this path cannot reuse it.',
        'Search the four neighbors for letter k + 1.',
        'Restore the cell and return whether any neighbor succeeded.',
        'Try every cell of the board as the starting point.',
      ],
      solution: py`
class Solution:
    def exist(self, board: List[List[str]], word: str) -> bool:
        #@ Grid size, used for bounds checks.
        rows, cols = len(board), len(board[0])

        #@ dfs(r, c, k) answers: can we spell word[k:] starting at cell (r, c)?
        def dfs(r, c, k):
            #@ Every letter matched: the whole word is spelled.
            if k == len(word):
                return True
            #@ Off the grid, or not the letter we need (cells on our path never match).
            if r < 0 or c < 0 or r >= rows or c >= cols or board[r][c] != word[k]:
                return False
            #@ Choose: mark this cell as used for the rest of this path.
            board[r][c] = "*"  #!
            #@ Explore: look for the next letter in the four neighbors.
            found = (dfs(r + 1, c, k + 1) or dfs(r - 1, c, k + 1) or
                     dfs(r, c + 1, k + 1) or dfs(r, c - 1, k + 1))
            #@ Un-choose: put the letter back so other paths can use this cell.
            board[r][c] = word[k]  #!
            return found

        #@ The word could start at any cell.
        for r in range(rows):
            for c in range(cols):
                if dfs(r, c, 0):
                    return True
        return False`,
      time: 'O(m · n · 4^L)',
      space: 'O(L)',
      complexityWhy:
        'Each of the m·n cells can start a search that branches up to 4 ways for each of the L letters (really 3, since you never step back onto your own path). The recursion is at most L deep.',
      pitfalls: [
        'Forgetting to restore the cell: searches from later starting points see a damaged board.',
        'Doing the bounds check before `k == len(word)`: the final call may be off the grid, so a word ending on an edge (or a 1 × 1 board) is wrongly rejected.',
        'Without marking cells, a path can loop back and reuse a letter, for example spelling "SRS" with one S.',
      ],
    },
    {
      id: 'palindrome-partitioning',
      num: 131,
      title: 'Palindrome Partitioning',
      difficulty: 'Medium',
      category: 'backtracking',
      pattern: 'Backtracking over where to cut',
      prompt:
        'Given a string `s`, cut it into pieces so that **every piece is a palindrome** (reads the same forwards and backwards). Return **all** the ways to do this.',
      examples: [
        { input: 's = "noon"', output: '[["n", "o", "o", "n"], ["n", "oo", "n"], ["noon"]]' },
        { input: 's = "xyx"', output: '[["x", "y", "x"], ["xyx"]]', note: '"xy" and "yx" are not palindromes, so they never appear as pieces.' },
      ],
      signals: ['"partition the string" so every piece obeys a rule', '"return all possible partitions"', 'palindromes'],
      hints: [
        'Decide where the first piece ends. Which first pieces are allowed?',
        'Once the first piece is chosen, the rest of the string is the same problem again, just shorter.',
        'backtrack(start): for each end from start, if s[start:end + 1] is a palindrome, append it, recurse from end + 1, pop. Save the path when start reaches len(s).',
      ],
      brute:
        'There are 2ⁿ⁻¹ ways to place cuts between letters. Generating all of them and then checking every piece costs **O(n · 2ⁿ)**. Backtracking has the same worst case but abandons a branch the moment one piece is not a palindrome.',
      insight:
        'Choose the **first piece**: any prefix that is a palindrome. Then solve the rest of the string the same way. When the start index reaches the end of the string, the path is one complete partition.',
      mnemonic: 'Cut a palindrome prefix, recurse on the rest.',
      steps: [
        'Keep a path of the pieces chosen so far.',
        'If start equals the length of s, save a copy of the path.',
        'Try every end index from start to the last character.',
        'Skip the piece s[start:end + 1] if it is not a palindrome.',
        'Append the piece, recurse from end + 1, then pop it.',
        'Start with backtrack(0) and return all partitions.',
      ],
      solution: py`
class Solution:
    def partition(self, s: str) -> List[List[str]]:
        #@ res collects full partitions; path holds the pieces chosen so far.
        res = []
        path = []

        #@ start is the index where the next piece must begin.
        def backtrack(start):
            #@ Reached the end of the string: every piece so far is a palindrome.
            if start == len(s):  #!
                res.append(path[:])
                return
            #@ Try every possible end for the next piece.
            for end in range(start, len(s)):
                piece = s[start:end + 1]
                #@ Only palindromes are allowed; otherwise prune this branch.
                if piece != piece[::-1]:  #!
                    continue
                #@ Choose the piece, partition the rest, then un-choose.
                path.append(piece)
                backtrack(end + 1)  #!
                path.pop()

        #@ The first piece starts at index 0.
        backtrack(0)
        return res`,
      time: 'O(n · 2ⁿ)',
      space: 'O(n)',
      complexityWhy:
        'A string like "aaaa…" has 2ⁿ⁻¹ partitions, and each palindrome check or copy costs O(n). The path and the recursion are at most n deep.',
      pitfalls: [
        'Off-by-one in the slice: the piece from start to end *inclusive* is `s[start:end + 1]`.',
        'Recursing with `start + 1` instead of `end + 1` re-reads letters that are already inside the piece.',
        'Saving `path` without copying it.',
      ],
    },
    {
      id: 'letter-combinations-of-a-phone-number',
      num: 17,
      title: 'Letter Combinations of a Phone Number',
      difficulty: 'Medium',
      category: 'backtracking',
      pattern: 'Backtracking: one level per digit',
      prompt:
        'On a phone keypad, each digit 2–9 stands for a few letters (2 → "abc", 3 → "def", 4 → "ghi", 5 → "jkl", 6 → "mno", 7 → "pqrs", 8 → "tuv", 9 → "wxyz"). Given a string `digits`, return **every letter string** those digits could spell. If `digits` is empty, return an empty list.',
      examples: [
        { input: 'digits = "84"', output: '["tg", "th", "ti", "ug", "uh", "ui", "vg", "vh", "vi"]' },
        { input: 'digits = "7"', output: '["p", "q", "r", "s"]', note: '7 is one of the two keys with four letters.' },
      ],
      signals: ['"all possible letter combinations"', 'each position has a small, fixed set of options', 'every answer has one letter per digit'],
      hints: [
        'Each digit is one position in the answer, and each position has 3 or 4 letter options.',
        'Fill the positions left to right: pick a letter for digit 0, then for digit 1, and so on.',
        'backtrack(i): if i == len(digits), save the joined path; otherwise loop over the letters of digits[i], append, recurse with i + 1, pop.',
      ],
      brute:
        'Write one nested loop per digit. That only works if you know how many digits there will be. Recursion is a nested loop of any depth. Either way there are up to 4ⁿ strings, so **O(n · 4ⁿ)** is unavoidable.',
      insight:
        'Recursion acts like a variable number of nested loops: level `i` loops over the letters of `digits[i]`. When every digit has a letter, join the path into one answer.',
      mnemonic: 'One level per digit, one branch per letter.',
      steps: [
        'Return an empty list right away if digits is empty.',
        'Map each digit to its letters with a dict.',
        'If i equals the number of digits, join the path and save it.',
        'Loop over the letters for digits[i].',
        'Append the letter, recurse with i + 1, then pop.',
      ],
      solution: py`
class Solution:
    def letterCombinations(self, digits: str) -> List[str]:
        #@ No digits means no combinations at all (not one empty string).
        if not digits:
            return []
        #@ The letters printed on each phone key.
        keypad = {"2": "abc", "3": "def", "4": "ghi", "5": "jkl",
                  "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}
        #@ res collects finished strings; path holds the letters chosen so far.
        res = []
        path = []

        #@ i is the digit we are choosing a letter for.
        def backtrack(i):
            #@ A letter for every digit: join the path into one string.
            if i == len(digits):  #!
                res.append("".join(path))
                return
            #@ Branch once for each letter on this key: choose, explore, un-choose.
            for letter in keypad[digits[i]]:  #!
                path.append(letter)
                backtrack(i + 1)  #!
                path.pop()

        #@ Start with the first digit.
        backtrack(0)
        return res`,
      time: 'O(n · 4ⁿ)',
      space: 'O(n)',
      complexityWhy:
        'Each of the n digits has at most 4 letters, so there are up to 4ⁿ strings, and joining each one costs O(n). The recursion is n deep.',
      pitfalls: [
        'Returning `[""]` for empty input: the expected answer is `[]`.',
        'Keys 7 and 9 have **four** letters. Assuming three per key misses answers.',
        'A common variation passes `path + letter` down instead of append/pop. New strings mean there is nothing to undo.',
      ],
    },
    {
      id: 'n-queens',
      num: 51,
      title: 'N-Queens',
      difficulty: 'Hard',
      category: 'backtracking',
      pattern: 'Row-by-row backtracking with column and diagonal sets',
      prompt:
        'Place `n` chess queens on an `n × n` board so that **no two attack each other**: no two share a row, a column or a diagonal. Return **every** such board, each drawn as a list of strings where `"Q"` is a queen and `"."` is an empty square.',
      examples: [
        {
          input: 'n = 5',
          output: '10 boards; the first is ["Q....", "..Q..", "....Q", ".Q...", "...Q."]',
          note: 'Row 0 uses column 0, row 1 column 2, row 2 column 4, and so on.',
        },
        { input: 'n = 3', output: '[]', note: 'On a 3 × 3 board some pair of queens always attacks, so there is no solution.' },
      ],
      signals: [
        '"place n things so that none conflict"',
        '"return all distinct solutions"',
        'exactly one item per row and per column',
        'diagonal rules on a board',
      ],
      hints: [
        "Each row must hold exactly one queen. So go row by row: in which column does this row's queen go?",
        'A new queen is safe if its column and both of its diagonals are free. Can you name a diagonal with a single number?',
        'Squares on the same down-right diagonal share r - c; squares on the same down-left diagonal share r + c. Keep three sets: columns, r - c and r + c.',
      ],
      brute:
        'Try every way to put n queens on the n² squares and check each board: **C(n², n)** boards, over 4 billion for n = 8. Even "one queen per row" alone still leaves nⁿ boards. Backtracking drops a placement the moment it is attacked.',
      insight:
        'Place one queen per row. Keep the used **columns**, **r − c** diagonals and **r + c** diagonals in sets, so checking whether a square is safe is O(1). Only safe squares are explored.',
      mnemonic: 'One queen per row; guard columns and both diagonals.',
      steps: [
        'Track used columns, r − c diagonals and r + c diagonals in three sets.',
        'If the row index reaches n, save the board as strings.',
        'For each column in this row, skip it if the column or a diagonal is taken.',
        'Place the queen: add to all three sets and mark the board.',
        'Recurse to place a queen in the next row.',
        'Remove the queen from the board and from all three sets.',
      ],
      solution: py`
class Solution:
    def solveNQueens(self, n: int) -> List[List[str]]:
        #@ Taken columns and diagonals. Squares on one diagonal share r - c (or r + c).
        cols = set()
        diag = set()
        anti_diag = set()
        #@ The board being built, plus the list of finished boards.
        board = [["."] * n for _ in range(n)]
        res = []

        #@ Place exactly one queen in row r.
        def backtrack(r):
            #@ Every row has a queen: save a snapshot of the board as strings.
            if r == n:
                res.append(["".join(row) for row in board])
                return
            #@ Try each column of this row; skip squares that are attacked.
            for c in range(n):
                if c in cols or (r - c) in diag or (r + c) in anti_diag:  #!
                    continue
                #@ Choose: place the queen and claim its column and both diagonals.
                cols.add(c)
                diag.add(r - c)  #!
                anti_diag.add(r + c)  #!
                board[r][c] = "Q"
                #@ Explore the next row, then un-choose everything.
                backtrack(r + 1)
                cols.remove(c)
                diag.remove(r - c)
                anti_diag.remove(r + c)
                board[r][c] = "."

        #@ Start at the top row.
        backtrack(0)
        return res`,
      time: 'O(n!)',
      space: 'O(n²)',
      complexityWhy:
        'Row 0 has n choices, row 1 at most n − 1 safe columns, and so on, so roughly n! placements are tried. The board takes n² squares; the sets and the recursion take O(n).',
      pitfalls: [
        'Mixing up the diagonals: down-right diagonals share `r - c`, down-left ones share `r + c`.',
        'Forgetting to remove the queen from all three sets *and* to reset the board square when backtracking.',
        'Saving `board` itself instead of joined strings: later changes would overwrite the saved answers.',
      ],
    },
  ],
};

export default content;
