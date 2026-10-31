import { py, type CategoryContent } from '../types';

const content: CategoryContent = {
  guide: {
    category: 'greedy',
    summary: `A **greedy** algorithm builds the answer one step at a time and always takes the move that looks best **right now**. It never goes back to change its mind. That makes greedy solutions short and fast, usually a single pass.

The catch: "best right now" is not always best overall. Paying 6 with coins worth 1, 3 and 4, greedy grabs the 4 first and needs 4 + 1 + 1 (three coins), while 3 + 3 needs only two. When greedy fails like this, you need DP.

So how do you know greedy is safe? Use an **exchange argument**. In plain words: *"Take any best answer. If it made a different choice here, I could swap in my greedy choice and the answer would be no worse."* If that holds at every step, greedy is optimal.

Most problems in this unit share one template: **walk the input once, keep a running value** (a sum, the farthest reach, fuel in the tank), **reset it when it becomes useless**, and **remember the best** you have seen.`,
    analogy:
      'A cashier making change hands over the biggest coin that fits, again and again. With everyday coins that always gives the fewest coins, but invent odd coins (1, 3, 4) and it breaks. Greedy is a great shortcut once you know the shortcut is safe.',
    whenToUse: [
      'One left-to-right pass with a **running value** looks like enough (best sum so far, farthest reach, fuel left)',
      'A running total that turns **negative** can only hurt what comes next → drop it and start fresh',
      '"Can you reach the end?" or "fewest jumps" → track the farthest index you can reach',
      'Sorting first makes the next choice obvious (smallest card first, earliest finish first)',
      'Large inputs (n up to 10^5) rule out O(n²) DP, so an O(n) or O(n log n) pass is expected',
      'You can explain why the best move now never blocks a better answer later (an exchange argument)',
    ],
    template: py`
def solve(nums):
    best = float("-inf")             # best answer seen so far
    current = 0                      # running state: a sum, a reach, a tank...
    for x in nums:
        current = update(current, x)     # take the greedy step
        if is_useless(current):          # e.g. a negative sum or an empty tank
            current = fresh_start()      # drop the bad prefix and start over
        best = max(best, current)        # remember the best moment
    return best`,
    templateNotes: [
      'Greedy looks at each element once and never backtracks, so it is usually **O(n)** time and **O(1)** space, plus O(n log n) if you sort first.',
      'Before trusting greedy, hunt for a tiny counter-example with 2–4 elements. If you find one, switch to DP.',
      'The **reset** is where the insight lives: Kadane drops a negative sum, Gas Station restarts after an empty tank, Partition Labels cuts when the current part closes.',
      'Initialise `best` with care: starting at `0` makes an all-negative input wrongly return 0. Start from the first element or `-inf`.',
    ],
    complexity: 'Usually O(n) time and O(1) extra space; O(n log n) when you sort first.',
    quiz: [
      {
        q: 'Coins are worth 1, 3 and 4. Greedy (biggest coin first) pays 6 as 4 + 1 + 1. What does this example teach?',
        options: [
          'Greedy is always optimal for coins',
          'You should sort the coins in increasing order',
          'Greedy can fail, so you need a reason it is safe (or use DP)',
          'Coin problems have no efficient solution',
        ],
        answer: 2,
        explain:
          '3 + 3 uses only 2 coins. A choice that looks best now can block a better answer later, so check (or prove) that greedy is safe.',
      },
      {
        q: "Kadane's running sum is -5 and the next number is 3. What should it do?",
        options: [
          'Drop the -5 and start a new subarray at 3',
          'Add 3 to get -2',
          'Stop: the answer is found',
          'Reset the best answer to 0 as well',
        ],
        answer: 0,
        explain:
          'A negative prefix can only make any subarray that continues it smaller, so start fresh. The running sum becomes 3.',
      },
      {
        q: 'Which sentence is an **exchange argument**?',
        options: [
          '"I tried a few examples and greedy worked."',
          '"Any best answer that chose differently here can swap in my choice without getting worse."',
          '"Greedy is fast, so it must be right."',
          '"I sorted the input, so the answer is correct."',
        ],
        answer: 1,
        explain:
          'An exchange argument shows the greedy choice can always replace another choice inside an optimal answer. Trying examples is good practice, but it is not a proof.',
      },
    ],
  },

  problems: [
    {
      id: 'maximum-subarray',
      num: 53,
      title: 'Maximum Subarray',
      difficulty: 'Medium',
      category: 'greedy',
      pattern: "Kadane's algorithm",
      alsoAccept: ['dp-1d'],
      prompt:
        'Given a list of integers `nums`, find the **contiguous**, non-empty slice with the largest sum and return that sum.',
      examples: [
        { input: 'nums = [-3, 4, -1, 2, -5, 3]', output: '5', note: '[4, -1, 2] adds up to 5.' },
        { input: 'nums = [-4, -2, -7]', output: '-2', note: 'All negative: the best slice is the single largest number.' },
      ],
      signals: [
        '"contiguous subarray" with the largest sum',
        'negative numbers mixed in',
        'only the best sum is needed, not every subarray',
      ],
      hints: [
        'Suppose the subarray ending just before `x` has a negative sum. Would you want to keep it in front of `x`?',
        'Track the best sum of a subarray **ending at the current position**.',
        'If the running sum is below 0, reset it to 0 before adding `x`. Keep a separate `best`.',
      ],
      brute:
        'Try every start and end and add up the slice: **O(n²)** with a running sum, O(n³) if you re-add each slice from scratch.',
      insight:
        'A **negative running sum** can only make whatever comes after it smaller, so throw it away and start fresh. Otherwise keep extending. The answer is the best running sum ever seen.',
      mnemonic: 'Negative prefix? Drop it. Keep adding, keep the best.',
      steps: [
        'Set best to the first number and the running sum to 0.',
        'Walk through each number x.',
        'If the running sum is negative, reset it to 0.',
        'Add x to the running sum.',
        'Update best with the running sum; return best at the end.',
      ],
      solution: py`
class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        #@ best = largest sum seen so far; starting at nums[0] (not 0) keeps all-negative lists correct. current = sum of the subarray that ends at the current number.
        best = nums[0]
        current = 0
        #@ One pass over the numbers.
        for x in nums:
            #@ A negative running sum can only drag the next numbers down, so drop it and start a new subarray here.
            if current < 0:  #!
                current = 0
            #@ Extend the current subarray with x.
            current += x
            #@ Remember the best sum we have ever had.
            best = max(best, current)  #!
        return best`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy: 'One pass over the list, keeping just two numbers.',
      pitfalls: [
        'Starting with `best = 0` returns 0 for an all-negative list, but the slice must be non-empty.',
        'Dropping a negative **number** is wrong: in [4, -1, 2] the -1 is worth keeping because 4 − 1 + 2 = 5. Only a negative **running sum** gets dropped.',
        'Same idea in one line: `current = max(x, current + x)`. This is also the 1-D DP view of the problem.',
      ],
    },
    {
      id: 'jump-game',
      num: 55,
      title: 'Jump Game',
      difficulty: 'Medium',
      category: 'greedy',
      pattern: 'Move the goal post backwards',
      prompt:
        'You start at index 0 of `nums`. From index `i` you may jump forward **up to** `nums[i]` steps. Return `True` if you can reach the last index, otherwise `False`.',
      examples: [
        { input: 'nums = [1, 3, 0, 0, 2]', output: 'True', note: 'Jump to index 1, then 3 steps lands on index 4.' },
        { input: 'nums = [2, 1, 0, 3]', output: 'False', note: 'Every route gets stuck on the 0 at index 2.' },
      ],
      signals: [
        '"can you reach the last index?"',
        'each value is a **maximum** jump length',
        'only a yes/no answer is needed',
      ],
      hints: [
        'Work backwards: which indices can reach the last index in a single jump?',
        'If index `i` can reach the goal, then reaching `i` is just as good as reaching the goal.',
        'Walk from right to left; whenever `i + nums[i] >= goal`, move the goal to `i`. At the end, is the goal 0?',
      ],
      brute:
        'Try every jump length from every index (DFS or DP): **O(n²)** with memoization, exponential without it.',
      insight:
        'If index `i` can jump to the current goal, then `i` becomes the new goal: getting to `i` is enough. Sweep from right to left moving the goal post; you win if it reaches index 0.',
      mnemonic: 'Can reach the goal? Then you are the new goal.',
      steps: [
        'Set the goal to the last index.',
        'Walk i from the second-to-last index down to 0.',
        'If i + nums[i] reaches the goal, move the goal to i.',
        'Return whether the goal ended at index 0.',
      ],
      solution: py`
class Solution:
    def canJump(self, nums: List[int]) -> bool:
        #@ The goal starts at the last index.
        goal = len(nums) - 1
        #@ Walk backwards, starting just before the goal.
        for i in range(len(nums) - 2, -1, -1):
            #@ If index i can jump far enough to reach the goal, reaching i is as good as reaching the goal. Move the goal post back to i.
            if i + nums[i] >= goal:  #!
                goal = i  #!
        #@ Success if the goal post made it all the way back to the start.
        return goal == 0`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy: 'One backwards pass with a single variable.',
      pitfalls: [
        'Jumps can be **shorter** than `nums[i]`, which is why the test is `>= goal`, not `== goal`.',
        'A 0 is only a trap if nothing before it can jump over it.',
        'Forward version, also O(n): keep `farthest = max(farthest, i + nums[i])`, and fail as soon as `i > farthest`.',
      ],
    },
    {
      id: 'jump-game-ii',
      num: 45,
      title: 'Jump Game II',
      difficulty: 'Medium',
      category: 'greedy',
      pattern: 'BFS-style jump windows',
      prompt:
        'From index `i` of `nums` you may jump forward up to `nums[i]` steps. Starting at index 0, return the **fewest jumps** needed to reach the last index. You are promised it can be reached.',
      examples: [
        { input: 'nums = [1, 2, 1, 1, 1]', output: '3', note: '0 → 1 → 3 → 4.' },
        { input: 'nums = [4, 1, 1, 1, 1]', output: '1', note: 'One big jump from index 0.' },
        { input: 'nums = [0]', output: '0', note: 'You already stand on the last index.' },
      ],
      signals: [
        '"minimum number of jumps"',
        'each value is a maximum jump length',
        'reaching the end is guaranteed',
      ],
      hints: [
        'Which indices can you reach with 0 jumps? With exactly 1 jump? With 2?',
        'Each of those groups is a contiguous window, like the levels of a BFS.',
        'Keep a window `[l, r]`. The next window is `[r + 1, farthest]`, where farthest is the max of `i + nums[i]` inside the window. Count windows until `r` reaches the end.',
      ],
      brute:
        'DP: for each index, try every jump and keep the minimum, which is **O(n²)**. A real BFS over indices has O(n²) edges too.',
      insight:
        'All the indices you can reach in exactly k jumps form one **contiguous window**. The next window ends at the farthest point any index in the current window can reach. Count the windows you pass through: BFS levels without a queue.',
      mnemonic: 'Window by window: the farthest reach sets the next window.',
      steps: [
        'Start with jumps = 0 and the window l = r = 0.',
        'Keep going while the window does not yet include the last index.',
        'Scan the window to find the farthest index one more jump can reach.',
        'Move the window to [r + 1, farthest] and add 1 to jumps.',
        'Return jumps.',
      ],
      solution: py`
class Solution:
    def jump(self, nums: List[int]) -> int:
        #@ Think in BFS levels: the window [l, r] holds every index reachable with exactly "jumps" jumps. At first that is just index 0, with 0 jumps.
        jumps = 0
        l = r = 0
        #@ Keep going until the window covers the last index.
        while r < len(nums) - 1:
            #@ From any index in the window, find the farthest index that one more jump can reach.
            farthest = 0
            for i in range(l, r + 1):
                farthest = max(farthest, i + nums[i])  #!
            #@ The next window starts right after this one and ends at that farthest reach. Getting there cost one more jump.
            l, r = r + 1, farthest  #!
            jumps += 1
        return jumps`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy: 'The windows never overlap, so every index is scanned exactly once.',
      pitfalls: [
        'Looping while `r < len(nums)` instead of `len(nums) - 1` counts one jump too many.',
        'Always jumping to the farthest index is wrong. What matters is which landing spot reaches farthest **next**, and scanning the whole window handles that.',
        'A list of length 1 needs 0 jumps; the while loop correctly never runs.',
      ],
    },
    {
      id: 'gas-station',
      num: 134,
      title: 'Gas Station',
      difficulty: 'Medium',
      category: 'greedy',
      pattern: 'Total check + reset the start',
      prompt:
        'Stations sit on a circular road. Station `i` gives you `gas[i]` fuel, and driving from station `i` to the next one costs `cost[i]`. Starting with an empty tank, return the index of the station where you can start and drive **once all the way around**, or `-1` if no start works. When an answer exists it is unique.',
      examples: [
        {
          input: 'gas = [2, 5, 1], cost = [3, 2, 2]',
          output: '1',
          note: 'Start at 1: the tank holds 3, then 2, then 1 as you arrive back home.',
        },
        { input: 'gas = [1, 2], cost = [2, 2]', output: '-1', note: 'Only 3 fuel in total, but the loop costs 4.' },
      ],
      signals: [
        'a circular route',
        '"which starting point" lets you finish the loop',
        'a running balance (gas minus cost) must never drop below zero',
      ],
      hints: [
        'If the total gas is less than the total cost, can any start work?',
        'Start at 0 and drive. If the tank goes negative at station `i`, could any station between your start and `i` have worked?',
        'No. So restart at `i + 1` with an empty tank. If the totals are fine, the last restart point is the answer.',
      ],
      brute: 'Simulate a full loop from every station: **O(n²)**.',
      insight:
        'If the tank runs dry on the way out of station `i`, then **every** station from `start` to `i` fails too, because each would arrive at `i` with no more fuel than you had. So jump the start to `i + 1`. And if total gas ≥ total cost, the last start you pick is guaranteed to work.',
      mnemonic: 'Enough gas overall? Restart after every empty tank.',
      steps: [
        'If the sum of gas is less than the sum of cost, return -1.',
        'Set start = 0 and tank = 0.',
        'At each station i, add gas[i] − cost[i] to the tank.',
        'If the tank is negative, move start to i + 1 and empty the tank.',
        'Return start.',
      ],
      solution: py`
class Solution:
    def canCompleteCircuit(self, gas: List[int], cost: List[int]) -> int:
        #@ If the loop needs more fuel in total than exists, no start can work.
        if sum(gas) < sum(cost):  #!
            return -1
        #@ Otherwise some start works. Try station 0 first, with an empty tank.
        start = 0
        tank = 0
        for i in range(len(gas)):
            #@ Fill up at station i and pay for the drive to the next station.
            tank += gas[i] - cost[i]
            #@ Tank went negative: no station from start to i can be the answer. Restart just after i with an empty tank.
            if tank < 0:  #!
                start = i + 1  #!
                tank = 0
        #@ The total check guarantees this last start makes it all the way around.
        return start`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy: 'Two sums and one pass over the stations, with two variables.',
      pitfalls: [
        'Forgetting the total check: the reset loop alone always returns some index, even when the trip is impossible.',
        'Resetting `tank` to 0 matters as much as moving `start`: the new attempt begins with an empty tank.',
        'No need to wrap around and re-check the stations before `start`; the total check already covers them.',
      ],
    },
    {
      id: 'hand-of-straights',
      num: 846,
      title: 'Hand of Straights',
      difficulty: 'Medium',
      category: 'greedy',
      pattern: 'Smallest card starts a run',
      alsoAccept: ['heap'],
      prompt:
        'You hold cards with integer values in `hand`. Can you split **all** of them into groups of exactly `groupSize` cards, where each group is a run of **consecutive** values (like 4, 5, 6)? Return `True` or `False`.',
      examples: [
        { input: 'hand = [1, 2, 3, 3, 4, 5], groupSize = 3', output: 'True', note: '[1, 2, 3] and [3, 4, 5].' },
        { input: 'hand = [1, 2, 4, 5, 6, 7], groupSize = 3', output: 'False', note: 'The 1 must start a run, but there is no 3.' },
      ],
      signals: [
        'split everything into groups of consecutive values',
        'duplicate values allowed, so counts matter',
        'the smallest value has only one possible role',
      ],
      hints: [
        'Look at the smallest card. Which position in its run must it take?',
        'It must be the **start** of a run, so the next `groupSize - 1` values must all exist.',
        'Count the cards, walk the values in sorted order, and for a value still left `c` times, take `c` copies of every value in its run.',
      ],
      brute: 'Try every way to form the groups with backtracking: **exponential** time.',
      insight:
        'The smallest card left cannot sit in the middle or at the end of a run (nothing smaller is left), so it **must start** one, which forces the whole run. Repeat with the next smallest card. There is never a real choice, so greedy is safe.',
      mnemonic: 'Smallest card must start a run; take the whole run.',
      steps: [
        'If len(hand) is not divisible by groupSize, return False.',
        'Count how many cards of each value you have.',
        'Walk the distinct values in increasing order, skipping values whose count is already 0.',
        'For a value v with count c, check that every value from v to v + groupSize − 1 has at least c copies.',
        'Subtract c from each of those counts; if every run succeeds, return True.',
      ],
      solution: py`
class Solution:
    def isNStraightHand(self, hand: List[int], groupSize: int) -> bool:
        #@ The cards must split into equal groups, so the total has to divide evenly.
        if len(hand) % groupSize != 0:
            return False
        #@ Count how many copies of each card value we hold.
        count = collections.Counter(hand)
        #@ Visit values from smallest to largest. The smallest card still left can only be the START of a run.
        for start in sorted(count):  #!
            need = count[start]
            #@ All copies already used by earlier runs? Nothing starts here.
            if need == 0:
                continue
            #@ Start "need" runs at once: every value from start to start + groupSize - 1 must have at least need copies left. Use them up.
            for card in range(start, start + groupSize):
                if count[card] < need:  #!
                    return False
                count[card] -= need
        #@ Every card found a place in a run.
        return True`,
      time: 'O(n log n)',
      space: 'O(n)',
      complexityWhy:
        'Sorting the distinct values costs O(n log n). Each run we build uses up groupSize cards, so the inner loops add up to O(n).',
      pitfalls: [
        'Processing values in any order other than smallest-first breaks the logic: a middle card really does have a choice of which run to join.',
        'Duplicates matter: with two 3s you need two runs through 3, which is why we keep counts instead of a set.',
        'Min-heap version: push the distinct values into a heap and always start a run from the smallest value whose count is above 0. Same idea, same O(n log n).',
      ],
    },
    {
      id: 'merge-triplets-to-form-target-triplet',
      num: 1899,
      title: 'Merge Triplets to Form Target Triplet',
      difficulty: 'Medium',
      category: 'greedy',
      pattern: 'Filter out overshooting triplets',
      prompt:
        'You have a list of `triplets` and a `target` triplet. **Merging** two triplets keeps the larger value in each position: merging `[2, 5, 3]` with `[4, 1, 3]` gives `[4, 5, 3]`. You may repeatedly pick two triplets and overwrite one with their merge. Return `True` if `target` can end up in the list.',
      examples: [
        {
          input: 'triplets = [[1, 4, 2], [3, 1, 5], [3, 6, 1]], target = [3, 4, 5]',
          output: 'True',
          note: 'Merge [1, 4, 2] with [3, 1, 5]. [3, 6, 1] is useless because 6 > 4.',
        },
        {
          input: 'triplets = [[2, 5, 3], [1, 2, 4]], target = [2, 3, 4]',
          output: 'False',
          note: 'The only triplet with a 2 in front also has a 5, which overshoots the 3.',
        },
      ],
      signals: [
        'combining by taking the maximum in each position',
        'values can only grow, never shrink',
        'a yes/no question: can you hit an exact target?',
      ],
      hints: [
        'Merging uses max, so values only go up. What does that mean for a triplet with any value above the target?',
        'Such a triplet can never be used. Every other triplet is safe to merge in, because it can never overshoot.',
        'Among the safe triplets, check whether each of the three positions is matched exactly by at least one of them.',
      ],
      brute: 'Try every subset of triplets and merge it: **O(2^n)**.',
      insight:
        'Max only grows, so a triplet with **any** value above the target poisons the result: ignore it. Merging all the other triplets can never hurt, so just check whether together they hit all three target values exactly.',
      mnemonic: 'Toss every overshooter; the rest must cover all three spots.',
      steps: [
        'Create an empty set of matched target positions.',
        'Loop over every triplet.',
        'Skip the triplet if any of its values is greater than the target value in that position.',
        'For a safe triplet, add each position i where it equals target[i] to the set.',
        'Return whether all three positions were matched.',
      ],
      solution: py`
class Solution:
    def mergeTriplets(self, triplets: List[List[int]], target: List[int]) -> bool:
        #@ The positions (0, 1, 2) of target that some usable triplet matches exactly.
        found = set()
        for t in triplets:
            #@ A triplet with ANY value above the target can never be used: merging only takes maximums, so it would overshoot forever.
            if t[0] > target[0] or t[1] > target[1] or t[2] > target[2]:  #!
                continue
            #@ A safe triplet never hurts to merge in. Record every position where it hits the target exactly.
            for i in range(3):
                if t[i] == target[i]:
                    found.add(i)  #!
        #@ Merging all the safe triplets gives target exactly when all three positions were hit.
        return len(found) == 3`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy: 'One pass over the triplets; the set never holds more than 3 positions.',
      pitfalls: [
        'Counting matches from a triplet that overshoots in another position: it can never be used, so its matches do not count.',
        'The three matches may come from **different** triplets; one triplet does not have to match everything.',
        'There is no need to actually perform merges. Tracking which positions are hit is enough.',
      ],
    },
    {
      id: 'partition-labels',
      num: 763,
      title: 'Partition Labels',
      difficulty: 'Medium',
      category: 'greedy',
      pattern: 'Last occurrence + stretch the cut',
      prompt:
        'Split the string `s` into as **many parts as possible** so that each letter appears in **only one part**. Return the sizes of the parts, in order.',
      examples: [
        { input: 's = "abacdcd"', output: '[3, 4]', note: '"aba" and "cdcd".' },
        { input: 's = "xyz"', output: '[1, 1, 1]' },
        { input: 's = "abcab"', output: '[5]', note: 'The a and b at the end tie everything together.' },
      ],
      signals: [
        'each letter may appear in only one part',
        '"as many parts as possible"',
        'cut points depend on where each letter appears for the last time',
      ],
      hints: [
        'If a part contains the letter "a", what is the earliest place that part can end?',
        "It cannot end before the last \"a\" in the whole string. Precompute every letter's last index.",
        'Walk the string, stretching `end` to the farthest last index seen so far. When `i == end`, cut.',
      ],
      brute:
        'Try cut positions and check whether any letter appears on both sides of a cut: **O(n²)** or worse.',
      insight:
        "A part that contains a letter must stretch at least to that letter's **last** occurrence. Walk left to right, pushing the end of the current part out to the farthest last occurrence seen. When you reach that end, nothing inside appears later, so cut.",
      mnemonic: 'Stretch to the last appearance; cut when you arrive.',
      steps: [
        'Record the last index of every letter.',
        'Set start and end of the current part to 0.',
        'For each index i, stretch end to the larger of end and the last index of s[i].',
        'When i equals end, record the size end − start + 1 and start the next part at i + 1.',
        'Return the list of sizes.',
      ],
      solution: py`
class Solution:
    def partitionLabels(self, s: str) -> List[int]:
        #@ First pass: remember the LAST index where each letter appears.
        last = {}
        for i, ch in enumerate(s):
            last[ch] = i
        #@ The current part runs from start to end, and end may still grow.
        sizes = []
        start = end = 0
        #@ Second pass: every letter we meet forces the part to reach at least its last appearance.
        for i, ch in enumerate(s):
            end = max(end, last[ch])  #!
            #@ Reached the end: no letter in this part appears later, so cut here and start the next part.
            if i == end:  #!
                sizes.append(end - start + 1)
                start = i + 1
        return sizes`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy: 'Two passes over the string. The last-index map holds at most 26 letters.',
      pitfalls: [
        "Cutting as soon as the current letter's last index is reached. You must wait for the farthest end of **all** letters in the part.",
        'Return the sizes, not the substrings themselves.',
        'Forgetting to move `start` to `i + 1` makes every size after the first too big.',
      ],
    },
    {
      id: 'valid-parenthesis-string',
      num: 678,
      title: 'Valid Parenthesis String',
      difficulty: 'Medium',
      category: 'greedy',
      pattern: 'Track the range of open counts',
      alsoAccept: ['stack'],
      prompt:
        'The string `s` contains only `(`, `)` and `*`. Each `*` can act as `(`, as `)`, or as nothing at all. Return `True` if some choice for the stars makes `s` a **balanced** bracket string.',
      examples: [
        { input: 's = "((*)"', output: 'True', note: 'Use the * as ")" to get "(())".' },
        { input: 's = "*))"', output: 'False', note: 'Two ")" but at most one "(" before them.' },
        { input: 's = "(*()"', output: 'True', note: 'Use the * as ")" to get "()()".' },
      ],
      signals: [
        'balanced parentheses',
        'a wildcard character with several possible meanings',
        'only a yes/no answer is needed',
      ],
      hints: [
        'Without stars, you would count open brackets, make sure the count never goes negative, and check it ends at 0.',
        'With stars, the open count is not one number but a **range** of possible numbers.',
        'Track `left_min` and `left_max`. A star lowers the min and raises the max. Fail if the max goes below 0, never let the min go below 0, and succeed if the min ends at 0.',
      ],
      brute: 'Try all 3^k meanings of the k stars and check each resulting string: **O(3^k · n)**.',
      insight:
        'Do not guess what each star is. Keep the **range** of possible open-bracket counts: `left_max` assumes stars open, `left_min` assumes they close. If even `left_max` goes negative it is hopeless; at the end, 0 must be inside the range.',
      mnemonic: 'Track the range of open counts; a star widens it.',
      steps: [
        'Set left_min and left_max to 0.',
        'For "(", add 1 to both; for ")", subtract 1 from both.',
        'For "*", subtract 1 from left_min and add 1 to left_max.',
        'If left_max drops below 0, return False.',
        'Clamp left_min so it never goes below 0.',
        'At the end, return whether left_min is 0.',
      ],
      solution: py`
class Solution:
    def checkValidString(self, s: str) -> bool:
        #@ We do not know what each star is, so track the RANGE of possible open-bracket counts: left_min (fewest) to left_max (most).
        left_min = left_max = 0
        for ch in s:
            #@ "(" and ")" change the count the same way in every scenario.
            if ch == '(':
                left_min += 1
                left_max += 1
            elif ch == ')':
                left_min -= 1
                left_max -= 1
            #@ A star could close one (the min goes down) or open one (the max goes up). Leaving it empty sits in between.
            else:
                left_min -= 1  #!
                left_max += 1  #!
            #@ Even the scenario with the most open brackets has too many ")": impossible.
            if left_max < 0:  #!
                return False
            #@ A real count can never be negative, so scenarios below 0 are dead. Clamp the minimum at 0.
            left_min = max(left_min, 0)  #!
        #@ Valid if some scenario ends with every bracket closed.
        return left_min == 0`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy: 'One pass over the string, keeping two counters.',
      pitfalls: [
        'Forgetting to clamp `left_min` at 0. Without it, "(*)" ends with left_min = -1 and is wrongly rejected.',
        'The `left_max < 0` check must happen inside the loop: too many ")" early on can never be fixed by later characters.',
        'Two-stack alternative: push indices of "(" and "*", match each ")" against them, then pair leftover "(" with later stars. Also O(n), but O(n) space.',
      ],
    },
  ],
};

export default content;
