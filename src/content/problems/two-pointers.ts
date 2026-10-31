import { py, type CategoryContent } from '../types';

const content: CategoryContent = {
  guide: {
    category: 'two-pointers',
    summary: `**Two pointers** means keeping two indices into the same list (or string) and moving them cleverly, instead of trying every possible pair.

The most common shape puts one pointer at each **end** and walks them **toward each other**. At every step you look at the two values and decide which pointer to move. Each move rules out a whole batch of answers you no longer need to check.

Why it is fast: the pointers only ever move inward, so together they take at most n steps. That turns an **O(n²)** "try every pair" into **O(n)**.

It shines when the input is **sorted** (or you are allowed to sort it), or when you compare things in mirror order, like the two ends of a palindrome.`,
    analogy:
      'Two friends stand at opposite ends of a shelf of books sorted by price, looking for two books that cost exactly 20 dollars together. Too expensive? The friend at the pricey end steps left. Too cheap? The friend at the cheap end steps right. They meet in the middle without ever walking back.',
    whenToUse: [
      'The list is **sorted** (or sorting is allowed) and you need a pair with a certain sum or difference',
      'You compare elements from **both ends** — palindromes, reversing, mirror checks',
      'You need **triplets**: fix one element, then run two pointers on the rest',
      'The answer depends on a pair of positions (a left wall and a right wall), and moving the "worse" side is the only way to improve',
      'You must use **O(1) extra space**, so a hash map is off the table',
    ],
    template: py`
def solve(nums, target):
    nums.sort()                      # skip if already sorted, or if indices matter
    left, right = 0, len(nums) - 1
    while left < right:              # stop when the pointers meet
        current = nums[left] + nums[right]
        if current == target:
            return [left, right]
        elif current < target:
            left += 1                # need bigger: move the small side up
        else:
            right -= 1               # need smaller: move the big side down
    return []`,
    templateNotes: [
      'Use `while left < right`: once the pointers meet, there is no pair left to look at.',
      'Every pass through the loop must move at least one pointer, or it never ends.',
      'The real skill is knowing **which pointer to move**. Ask: "which pointer, if it stays, can never be part of a better answer?" Move that one.',
      'Sorting costs O(n log n) and scrambles the original indices. If you must return original positions, a hash map (as in Two Sum) is usually the better tool.',
    ],
    complexity: 'O(n) time for the pointer walk (O(n log n) if you sort first), O(1) extra space.',
    quiz: [
      {
        q: 'In a **sorted** list, `nums[left] + nums[right]` is **smaller** than the target. What should you do?',
        options: [
          'Move `right` one step left',
          'Move `left` one step right',
          'Move both pointers inward',
          'Start over with `left = 0`',
        ],
        answer: 1,
        explain:
          'Moving `left` right picks a bigger (or equal) number, the only way to raise the sum. Moving `right` left could only lower it.',
      },
      {
        q: 'Why does the opposite-ends two-pointer walk run in O(n)?',
        options: [
          'It only looks at half of the list',
          'It secretly uses a hash map',
          'Each step moves a pointer inward, so there are at most n steps in total',
          'Python lists are very fast',
        ],
        answer: 2,
        explain: 'The gap between the pointers shrinks by at least 1 every step, and it starts at n − 1.',
      },
      {
        q: 'Two Sum (unsorted list, return the original indices) is usually solved with a hash map instead of two pointers. Why?',
        options: [
          'Two pointers need sorted values, and sorting costs O(n log n) and scrambles the original indices',
          'Two pointers cannot handle negative numbers',
          'A hash map uses less memory',
          'Two pointers are O(n²)',
        ],
        answer: 0,
        explain:
          'You could sort (value, index) pairs, but that is O(n log n). The hash map does it in O(n) without sorting.',
      },
    ],
  },

  problems: [
    {
      id: 'valid-palindrome',
      num: 125,
      title: 'Valid Palindrome',
      difficulty: 'Easy',
      category: 'two-pointers',
      pattern: 'Opposite-ends pointers, skip non-alphanumerics',
      prompt:
        'A phrase is a **palindrome** if it reads the same forwards and backwards once you lowercase every letter and **ignore everything that is not a letter or a digit**. Given a string `s`, return `True` if it is a palindrome and `False` otherwise.',
      examples: [
        { input: 's = "Taco cat!"', output: 'True', note: 'Cleaned up it is "tacocat", the same both ways.' },
        { input: 's = "Top spots"', output: 'False', note: '"topspots" backwards is "stopspot".' },
        { input: 's = "?!"', output: 'True', note: 'Nothing is left after cleaning, and an empty string is a palindrome.' },
      ],
      signals: ['"reads the same forward and backward"', 'ignore case and punctuation', 'compare mirror positions'],
      hints: [
        'A palindrome matches its first character with its last, its second with its second-to-last, and so on.',
        'Put one pointer at each end and walk them toward each other.',
        'Before comparing, move each pointer past characters where `isalnum()` is False, and compare with `.lower()`.',
      ],
      brute:
        'Build a cleaned, lowercased copy and compare it with its reverse: `t == t[::-1]`. That is **O(n)** time too, but it needs **O(n)** extra memory for the copies. Two pointers need only O(1).',
      insight:
        'Check the string from **both ends at once**, skipping characters that do not count. No cleaned copy is needed.',
      mnemonic: 'Outside in: skip junk, compare lowercase, step inward.',
      steps: [
        'Put left at index 0 and right at the last index.',
        'While left < right, move left forward past characters that are not letters or digits.',
        'Move right backward past characters that are not letters or digits.',
        'If the lowercased characters differ, return False.',
        'Otherwise step both pointers inward.',
        'When the pointers meet, return True.',
      ],
      solution: py`
class Solution:
    def isPalindrome(self, s: str) -> bool:
        #@ Start one pointer at each end of the string.
        left, right = 0, len(s) - 1
        #@ Keep going until the pointers meet in the middle.
        while left < right:
            #@ Skip anything that is not a letter or digit, on both sides.
            while left < right and not s[left].isalnum():  #!
                left += 1
            while left < right and not s[right].isalnum():
                right -= 1
            #@ Compare the two characters, ignoring upper/lower case.
            if s[left].lower() != s[right].lower():  #!
                return False
            #@ They match, so step both pointers inward.
            left += 1
            right -= 1
        #@ Every mirrored pair matched: it is a palindrome.
        return True`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy:
        'The pointers only move inward, so together they visit each character at most once. Only two index variables are stored.',
      pitfalls: [
        'The inner skip loops also need `left < right`, or a string like `"?!"` runs off the end.',
        'Lowercase **both** sides before comparing: `"A"` and `"a"` must count as equal.',
        'Digits count too: `"1a2"` is **not** a palindrome. Use `isalnum()`, not `isalpha()`.',
      ],
    },
    {
      id: 'two-sum-ii-input-array-is-sorted',
      num: 167,
      title: 'Two Sum II - Input Array Is Sorted',
      difficulty: 'Medium',
      category: 'two-pointers',
      pattern: 'Opposite-ends pointers on a sorted list',
      prompt:
        'You get a list `numbers` that is **sorted in increasing order**, and a `target`. Find the two different positions whose values add up to `target`, and return them **counting from 1** (the first element is position 1). Exactly one answer exists, and you may only use O(1) extra space.',
      examples: [
        {
          input: 'numbers = [2, 3, 5, 9, 14], target = 12',
          output: '[2, 4]',
          note: '3 + 9 = 12, at positions 2 and 4 (counting from 1).',
        },
        { input: 'numbers = [-4, -1, 0, 6], target = -5', output: '[1, 2]' },
      ],
      signals: ['the input is already **sorted**', 'find a pair with a given sum', 'O(1) extra space required'],
      hints: [
        'The smallest and largest numbers sit at the two ends. What does their sum tell you?',
        'If even the smallest number plus the largest is too big, can the largest ever be part of the answer?',
        'Pointers at both ends: sum too big → move `right` left; sum too small → move `left` right.',
      ],
      brute:
        'Try every pair with nested loops — **O(n²)**. The Two Sum hash map is O(n) time but uses O(n) extra space, which this problem forbids.',
      insight:
        'Because the list is sorted, a sum that is too big can only be fixed by moving `right` down, and a sum that is too small only by moving `left` up. Each step throws one number away for good.',
      mnemonic: 'Too big, right steps left. Too small, left steps right.',
      steps: [
        'Put left at the first index and right at the last.',
        'Add the two values the pointers point at.',
        'If the sum is bigger than target, move right one step left.',
        'If the sum is smaller than target, move left one step right.',
        'If it equals target, return [left + 1, right + 1].',
      ],
      solution: py`
class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        #@ One pointer on the smallest number, one on the largest.
        left, right = 0, len(numbers) - 1
        #@ Look at the sum of the pair the pointers point at.
        while left < right:
            total = numbers[left] + numbers[right]
            #@ Too big: the only way to shrink the sum is a smaller right number.
            if total > target:
                right -= 1  #!
            #@ Too small: the only way to grow the sum is a bigger left number.
            elif total < target:
                left += 1  #!
            #@ Exactly right. Positions count from 1, so add 1 to each index.
            else:
                return [left + 1, right + 1]  #!`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy:
        'Every pass through the loop moves one pointer inward, so there are at most n passes. Only a few variables are stored.',
      pitfalls: [
        'The answer is **1-indexed**: return `[left + 1, right + 1]`.',
        'Use `left < right`, not `<=`: the same element cannot be used twice.',
        'Do not reach for a hash map out of habit. It works, but it breaks the O(1) space rule and ignores the sorted order.',
      ],
    },
    {
      id: '3sum',
      num: 15,
      title: '3Sum',
      difficulty: 'Medium',
      category: 'two-pointers',
      pattern: 'Sort, fix one, two pointers on the rest',
      prompt:
        'Given a list `nums`, return **every unique triplet** `[a, b, c]` of values from three different positions where `a + b + c == 0`. The answer must not contain the same triplet twice.',
      examples: [
        { input: 'nums = [-2, 0, 1, 1, 2]', output: '[[-2, 0, 2], [-2, 1, 1]]' },
        {
          input: 'nums = [3, -3, 0, 0, 0]',
          output: '[[-3, 0, 3], [0, 0, 0]]',
          note: 'Three different 0s make one triplet, and [-3, 0, 3] is listed only once even though there are three 0s to pick from.',
        },
        { input: 'nums = [1, 2, -1]', output: '[]' },
      ],
      signals: ['"three numbers that sum to zero"', '"unique triplets", no duplicates', 'return values, not indices (so sorting is fine)'],
      hints: [
        'If you fix the first number `a`, what must the other two add up to?',
        'Fixing `a` leaves a Two Sum problem with target `-a`. Sort first so you can solve it with two pointers.',
        'To avoid duplicate triplets, skip an `a` equal to the one before it, and after a match move `left` past equal values.',
      ],
      brute:
        'Three nested loops try every triplet — **O(n³)** — and you still need a set to throw away duplicate triplets.',
      insight:
        '**Sort**, then fix each number in turn and run Two Sum II (two pointers) on the numbers to its right. Sorting also puts equal values side by side, so skipping duplicates is just "same as the one before? skip".',
      mnemonic: 'Sort. Fix one. Squeeze the rest. Skip repeats.',
      steps: [
        'Sort the list.',
        'Loop i over each index as the first number of the triplet.',
        'Skip i if its value equals the previous value.',
        'Set left to i + 1 and right to the last index.',
        'Move right down if the sum is too big, or left up if it is too small.',
        'On a zero sum, record the triplet and move left past equal values.',
      ],
      solution: py`
class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        #@ Sort first: it enables two pointers and puts duplicates next to each other.
        nums.sort()
        res = []
        #@ Fix the first number of the triplet, one index at a time.
        for i in range(len(nums) - 2):
            #@ Same first number as last time? Skip it, or we would repeat triplets.
            if i > 0 and nums[i] == nums[i - 1]:  #!
                continue
            #@ Two Sum II on the rest: find two numbers after i that add up to -nums[i].
            left, right = i + 1, len(nums) - 1
            while left < right:
                total = nums[i] + nums[left] + nums[right]
                #@ Too big: move right inward. Too small: move left inward.
                if total > 0:
                    right -= 1
                elif total < 0:
                    left += 1
                #@ Found one! Save it, then move left past every copy of the same value.
                else:
                    res.append([nums[i], nums[left], nums[right]])
                    left += 1
                    while left < right and nums[left] == nums[left - 1]:  #!
                        left += 1
        #@ Every unique triplet has been collected.
        return res`,
      time: 'O(n²)',
      space: 'O(1)',
      complexityWhy:
        'Sorting is O(n log n). Then for each of the n first numbers, the two pointers sweep the rest in O(n), giving O(n²). Apart from the output (and the memory Python uses while sorting), only a few variables are stored.',
      pitfalls: [
        'Without the duplicate skips you get repeated triplets, like `[-2, 1, 1]` twice.',
        'After a match you must still move a pointer, or the loop never ends.',
        'Skip a repeated first number by comparing with `nums[i - 1]`, not `nums[i + 1]`. Looking ahead would wrongly skip triplets like `[-1, -1, 2]`.',
      ],
    },
    {
      id: 'container-with-most-water',
      num: 11,
      title: 'Container With Most Water',
      difficulty: 'Medium',
      category: 'two-pointers',
      pattern: 'Opposite-ends pointers, move the shorter wall',
      prompt:
        '`height[i]` is the height of a vertical wall standing at position `i`. Pick **two walls**: together with the ground they form a container holding `(distance between the walls) × (height of the shorter wall)` units of water. Return the **most water** any pair can hold.',
      examples: [
        {
          input: 'height = [2, 5, 4, 8, 3, 7]',
          output: '20',
          note: 'The walls of height 5 (index 1) and 7 (index 5): width 4 × height 5 = 20.',
        },
        { input: 'height = [4, 4]', output: '4' },
      ],
      signals: ['choose **two positions** to maximise something', 'area = width × the smaller height', 'O(n) wanted, not every pair'],
      hints: [
        'Start with the widest container possible: the first and last walls.',
        'Moving either wall inward makes the container narrower. Which wall should move so the height has a chance to grow?',
        'Always move the **shorter** wall. Keeping it can never give a bigger area, because it already caps the water level.',
      ],
      brute: 'Try every pair of walls and keep the biggest area — **O(n²)**.',
      insight:
        'The shorter wall caps the water level. Any container that keeps it and uses a closer wall is narrower **and** no taller, so the shorter wall is useless from now on: move it inward.',
      mnemonic: 'Start wide; the shorter wall always moves.',
      steps: [
        'Put left at the first wall and right at the last wall.',
        'Compute the area: the shorter height times the distance between the walls.',
        'Update the best area seen so far.',
        'Move whichever pointer has the shorter wall one step inward.',
        'Stop when the pointers meet and return the best area.',
      ],
      solution: py`
class Solution:
    def maxArea(self, height: List[int]) -> int:
        #@ Start with the widest container: one wall at each end.
        left, right = 0, len(height) - 1
        best = 0
        #@ Until the walls meet, measure the current container. Water rises only as high as the SHORTER wall.
        while left < right:
            area = min(height[left], height[right]) * (right - left)  #!
            best = max(best, area)
            #@ Move the shorter wall inward. Moving the taller one can never help.
            if height[left] < height[right]:  #!
                left += 1
            else:
                right -= 1
        #@ The biggest area seen along the way is the answer.
        return best`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy: 'Each step moves one pointer inward, so there are at most n − 1 steps, each O(1).',
      pitfalls: [
        'Moving the *taller* wall never helps: the height stays capped by the short wall while the width shrinks.',
        'The width is `right - left`, not `right - left + 1`: it is the gap between the walls.',
        'When both walls are equal it does not matter which one moves.',
      ],
    },
    {
      id: 'trapping-rain-water',
      num: 42,
      title: 'Trapping Rain Water',
      difficulty: 'Hard',
      category: 'two-pointers',
      pattern: 'Two pointers with left_max and right_max',
      alsoAccept: ['stack'],
      prompt:
        '`height` describes a row of bars, each 1 unit wide. After it rains, water collects in the dips between taller bars. Return the **total amount of water** trapped.',
      examples: [
        {
          input: 'height = [3, 0, 1, 0, 4]',
          output: '8',
          note: 'The water level between the 3 and the 4 is 3, so the three dips hold 3 + 2 + 3.',
        },
        { input: 'height = [2, 1, 0, 3, 1, 2]', output: '4' },
      ],
      signals: [
        '"how much water is trapped"',
        'each spot is limited by the tallest bar on its left and on its right',
        'O(1) extra space is a bonus',
      ],
      hints: [
        'Water above bar i = min(tallest bar on its left, tallest bar on its right) − height[i].',
        'You could precompute "tallest so far from the left" and "tallest so far from the right" arrays. Can two pointers avoid storing them?',
        'Move inward from the side whose max is smaller. That max is the true water level there, because the other side is guaranteed to be at least as tall.',
      ],
      brute:
        'For every bar, scan left and right for the tallest bar on each side — **O(n²)**. Precomputing `max_left` and `max_right` arrays brings it to **O(n)** time, but **O(n)** extra space.',
      insight:
        'Water at a spot is `min(max_left, max_right) - height`. Whenever `left_max < right_max`, the limit on the left side is already certain, so fill that spot and move on without knowing the exact right max.',
      mnemonic: 'Smaller max moves inward, filling water up to itself.',
      steps: [
        'Put pointers at both ends and set left_max and right_max to the end heights.',
        'While left < right, compare left_max with right_max.',
        'If left_max is smaller, move left inward and update left_max.',
        'Add left_max minus the new left height to the water.',
        'Otherwise do the same on the right side using right_max.',
        'Return the total water.',
      ],
      solution: py`
class Solution:
    def trap(self, height: List[int]) -> int:
        #@ One pointer at each end, each remembering the tallest bar seen on its side so far.
        left, right = 0, len(height) - 1
        left_max, right_max = height[left], height[right]
        water = 0
        #@ Work inward until the pointers meet.
        while left < right:
            #@ The left max is lower, so it is the real limit here: the right side is at least that tall.
            if left_max < right_max:  #!
                left += 1
                left_max = max(left_max, height[left])
                water += left_max - height[left]  #!
            #@ Otherwise the right side is the bottleneck. Same steps, mirrored.
            else:
                right -= 1
                right_max = max(right_max, height[right])
                water += right_max - height[right]
        #@ Every spot has been filled up to its water level.
        return water`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy:
        'Each step moves one pointer inward, so there are n steps in total. Only four numbers are tracked instead of two helper arrays.',
      pitfalls: [
        'Update the max **before** adding water, so the amount added is never negative.',
        'Using the *bigger* max as the water level overfills: the water would spill over the lower side.',
        'When the two maxes are equal either side may move; the `else` branch handles it.',
      ],
    },
  ],
};

export default content;
