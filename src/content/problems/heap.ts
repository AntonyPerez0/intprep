import { py, type CategoryContent } from '../types';

const content: CategoryContent = {
  guide: {
    category: 'heap',
    summary: `A **heap** (also called a **priority queue**) is a structure that always knows its **smallest** item. Peeking at it is O(1). Adding an item or removing the smallest is O(log n). It does not keep everything sorted, just enough order to find the top fast.

In Python, a heap is a plain list managed by the \`heapq\` module: \`heapq.heappush(h, x)\` adds, \`heapq.heappop(h)\` removes the smallest, \`h[0]\` peeks, and \`heapq.heapify(h)\` turns a whole list into a heap in O(n).

Python's \`heapq\` is a **min-heap**. For a **max-heap**, push **negated** values (\`-x\`) and flip the sign back when you read them.

The big trick: when you only need the top **k** of many items, keep a heap of size k instead of sorting everything. That turns O(n log n) into **O(n log k)**.`,
    analogy:
      'A heap is a hospital waiting room run by triage. The most urgent patient is always seen next, no matter when they arrived, and a new patient slots into place quickly without re-sorting the whole room.',
    whenToUse: [
      '"k-th largest", "top k", "k closest" → a heap capped at size **k**',
      'You repeatedly need the current smallest or largest while items keep arriving → heap',
      'Merging several sorted lists or streams → a heap of their front items',
      'Scheduling: always pick the most urgent, most frequent or cheapest next item → heap',
      'A running **median** → two heaps, one for each half',
      'You would sort everything but only ever use the top few → a heap does less work',
    ],
    template: py`
import heapq


def kth_largest(nums, k):
    heap = []                       # min-heap of the k largest seen so far
    for x in nums:
        heapq.heappush(heap, x)     # O(log k)
        if len(heap) > k:
            heapq.heappop(heap)     # drop the smallest: it cannot be in the top k
    return heap[0]                  # smallest of the top k = k-th largest


def biggest_first(nums):
    max_heap = [-x for x in nums]   # negate: the biggest becomes the smallest
    heapq.heapify(max_heap)         # O(n)
    order = []
    while max_heap:
        order.append(-heapq.heappop(max_heap))  # negate back when you pop
    return order                    # biggest to smallest`,
    templateNotes: [
      '`heapq` only builds **min**-heaps. For a max-heap, store `-x` and flip the sign back when you read it. (Python 3.14 added `heappush_max` and friends, but many judges run older versions, so learn the negation trick.)',
      '`h[0]` peeks at the smallest in O(1). `heappush` and `heappop` are O(log n). `heapify(list)` rearranges a list into a heap in O(n).',
      'Push tuples like `(priority, item)` to order by priority. Ties fall through to the next field, so add a unique counter if the items themselves cannot be compared.',
      'A heap is only partly sorted: `h[0]` is the smallest, but `h[1]` is **not** necessarily the second smallest and `h[-1]` is not the largest.',
    ],
    complexity: 'O(log n) per push or pop, O(1) to peek. Top-k over n items: O(n log k) time, O(k) space.',
    quiz: [
      {
        q: 'What does `heapq.heappop(h)` return?',
        options: ['The largest item', 'The smallest item', 'The item pushed most recently', 'The item at the end of the list'],
        answer: 1,
        explain: 'Python heaps are min-heaps: popping always gives the smallest item.',
      },
      {
        q: 'How do you get max-heap behavior from `heapq`?',
        options: [
          'Call `heapq.maxheap(h)` first',
          'Push negated values and negate them again when you pop',
          'Sort the list in reverse before every pop',
          'Pop from the end of the list with `h.pop()`',
        ],
        answer: 1,
        explain: 'Negating flips the order: the biggest original value becomes the smallest stored value, so it pops first.',
      },
      {
        q: 'To find the k-th **largest** of n numbers with a heap of size k, which kind of heap do you keep?',
        options: [
          'A min-heap, so the weakest of your k candidates is on top and easy to evict',
          'A max-heap, so the largest number is on top',
          'Either one; it makes no difference',
          'A sorted Python list instead of a heap',
        ],
        answer: 0,
        explain:
          'The candidate you will throw out is the smallest of the k, so it belongs on top: a min-heap. At the end its top is exactly the k-th largest.',
      },
      {
        q: 'How long does `h[0]` take on a heap of n items?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        answer: 0,
        explain: 'The smallest item always lives at index 0, so peeking is a plain list lookup.',
      },
    ],
  },

  problems: [
    {
      id: 'kth-largest-element-in-a-stream',
      num: 703,
      title: 'Kth Largest Element in a Stream',
      difficulty: 'Easy',
      category: 'heap',
      pattern: 'Min-heap of size k',
      prompt:
        'Design a class that is created with a number `k` and a starting list of scores. Each call to `add(val)` records a new score and returns the **k-th largest** score seen so far.',
      examples: [
        {
          input: 'KthLargest(2, [5, 1, 8]), add(4), add(9), add(2)',
          output: 'add(4) → 5, add(9) → 8, add(2) → 8',
          note: 'With k = 2, each answer is the second-biggest score so far.',
        },
      ],
      signals: ['"k-th largest"', 'numbers arrive one at a time (a stream)', 'many queries, each must be fast'],
      hints: [
        'Do you need to keep every number, or only some of them?',
        'Only the k largest numbers can ever matter. Which one of those is the answer?',
        'Keep a min-heap of exactly k numbers. Its top (the smallest) is the k-th largest; a bigger newcomer pushes the top out.',
      ],
      brute: 'Append each new number to a list and sort it on every `add`: **O(n log n)** per call.',
      insight:
        'Keep only the **k largest** numbers in a **min-heap**. The smallest of them sits at `heap[0]`, and that is exactly the k-th largest overall.',
      mnemonic: 'Keep the k biggest; the smallest of them is the answer.',
      steps: [
        'Store k and turn nums into a min-heap.',
        'Pop the smallest until the heap holds at most k numbers.',
        'In add, push the new value.',
        'If the heap now holds more than k numbers, pop the smallest.',
        'Return heap[0], the k-th largest.',
      ],
      solution: py`
class KthLargest:

    def __init__(self, k: int, nums: List[int]):
        #@ A min-heap will hold only the k largest numbers seen so far.
        self.k = k
        self.heap = nums
        heapq.heapify(self.heap)
        #@ Trim it down to k numbers by popping the smallest extras.
        while len(self.heap) > k:
            heapq.heappop(self.heap)

    #@ add: push the new number. If we now have k + 1 numbers, evict the smallest.
    def add(self, val: int) -> int:
        heapq.heappush(self.heap, val)
        if len(self.heap) > self.k:  #!
            heapq.heappop(self.heap)
        #@ The smallest of the k largest is exactly the k-th largest.
        return self.heap[0]  #!`,
      time: 'O(log k) per add',
      space: 'O(k)',
      complexityWhy:
        'Each add is one push and at most one pop on a heap of about k items. Setting up costs O(n log n) at worst, once, for the starting list.',
      pitfalls: [
        'Using a **max**-heap instead: you would have to dig k items deep on every call.',
        'The starting list may hold fewer than k numbers. The `> k` checks handle that, so never pop blindly.',
        'Reading `heap[-1]`: a heap is only partly sorted, so only `heap[0]` is meaningful.',
      ],
    },
    {
      id: 'last-stone-weight',
      num: 1046,
      title: 'Last Stone Weight',
      difficulty: 'Easy',
      category: 'heap',
      pattern: 'Max-heap simulation (negated values)',
      prompt:
        'You have a pile of stones with given weights. Each turn, take the two **heaviest** stones and smash them: if they weigh the same, both are destroyed; otherwise the lighter one is destroyed and the heavier one loses that much weight. When at most one stone is left, return its weight, or 0 if none remain.',
      examples: [
        { input: 'stones = [3, 9, 4, 2]', output: '0', note: '9 and 4 → 5; then 5 and 3 → 2; then 2 and 2 → nothing left.' },
        { input: 'stones = [6, 1]', output: '5' },
      ],
      signals: ['repeatedly take the **largest** items', 'items go back in after they change', 'simulate until one or zero remain'],
      hints: [
        'Each turn you need the two biggest stones. Sorting every turn is slow, so what structure keeps the max handy?',
        'A max-heap. Python only has a min-heap, so how can you flip it?',
        'Store negated weights. Pop twice, and if the difference is not zero, push it back (negated).',
      ],
      brute: 'Sort the list every turn and smash the last two: **O(n² log n)** overall.',
      insight:
        'A **max-heap** hands you the two heaviest stones in O(log n) each. With `heapq`, store **negated** weights so the heaviest stone is the smallest number.',
      mnemonic: 'Negate for a max-heap; pop two, push the difference.',
      steps: [
        'Build a heap of the negated weights.',
        'While two or more stones remain, pop the two heaviest.',
        'If they differ, push the difference back, negated.',
        'Return the last weight, or 0 if the heap is empty.',
      ],
      solution: py`
class Solution:
    def lastStoneWeight(self, stones: List[int]) -> int:
        #@ heapq is a min-heap, so store negative weights: the heaviest stone becomes the smallest number.
        heap = [-s for s in stones]  #!
        heapq.heapify(heap)
        #@ While two or more stones remain, take out the two heaviest (flipping the sign back).
        while len(heap) > 1:
            first = -heapq.heappop(heap)
            second = -heapq.heappop(heap)
            #@ Different weights leave a smaller stone, which goes back into the heap.
            if first > second:
                heapq.heappush(heap, -(first - second))  #!
        #@ One stone left, or none.
        return -heap[0] if heap else 0`,
      time: 'O(n log n)',
      space: 'O(n)',
      complexityWhy:
        'Each smash removes at least one stone, so there are at most n rounds of O(log n) heap work. The heap holds up to n weights.',
      pitfalls: [
        'Forgetting to flip the sign when popping, so you compare negative numbers and subtract the wrong way.',
        'Pushing back a 0 when two stones are equal; only push when they differ.',
        'Reading `heap[0]` without first checking that the heap is not empty.',
      ],
    },
    {
      id: 'k-closest-points-to-origin',
      num: 973,
      title: 'K Closest Points to Origin',
      difficulty: 'Medium',
      category: 'heap',
      pattern: 'Max-heap of size k',
      prompt:
        'Given a list of points `[x, y]` on a flat plane and a number `k`, return the `k` points nearest to the origin `(0, 0)` by ordinary straight-line distance. The answer may be in any order.',
      examples: [
        {
          input: 'points = [[2, 2], [-1, 3], [0, -1]], k = 2',
          output: '[[2, 2], [0, -1]]',
          note: 'Squared distances are 8, 10 and 1, so the two smallest win. Any order is accepted.',
        },
        { input: 'points = [[4, 0]], k = 1', output: '[[4, 0]]' },
      ],
      signals: ['"k closest" or "k smallest"', 'only k items needed out of many', 'any order allowed'],
      hints: [
        'You do not need all the points sorted, only the k nearest.',
        'Keep a heap of k candidates. Which candidate should be kicked out when a new point arrives?',
        'Use a max-heap by distance (negate it). When it grows past k, pop the farthest. What remains are the k closest.',
      ],
      brute: 'Sort all points by distance and take the first k: **O(n log n)**.',
      insight:
        'Keep the k closest points so far in a **max-heap** keyed on distance, so the farthest of them is on top and easy to evict. Compare **squared** distances; the square root never changes the order.',
      mnemonic: 'Keep k nearest; the farthest sits on top, ready to go.',
      steps: [
        'Create an empty heap.',
        'For each point, compute its squared distance from the origin.',
        'Push (negative distance, x, y) onto the heap.',
        'If the heap holds more than k points, pop the farthest.',
        'Return the points left in the heap.',
      ],
      solution: py`
class Solution:
    def kClosest(self, points: List[List[int]], k: int) -> List[List[int]]:
        #@ A max-heap (negated distances) of the k closest points so far. The farthest of them is on top.
        heap = []
        for x, y in points:
            #@ Squared distance is enough for comparing; no square root needed.
            dist = x * x + y * y  #!
            heapq.heappush(heap, (-dist, x, y))
            #@ More than k points? Throw out the farthest.
            if len(heap) > k:
                heapq.heappop(heap)  #!
        #@ The points left in the heap are the k closest.
        return [[x, y] for _, x, y in heap]`,
      time: 'O(n log k)',
      space: 'O(k)',
      complexityWhy: 'Each of the n points costs one push and at most one pop on a heap that never exceeds k + 1 items.',
      pitfalls: [
        'Forgetting to negate: a plain min-heap would evict the **closest** point instead of the farthest.',
        'Taking `math.sqrt` is unnecessary and adds floating-point noise; squared distances compare the same way.',
        'Alternative: `heapify` all n points by distance and pop k times, **O(n + k log n)**. Also fine in an interview.',
      ],
    },
    {
      id: 'kth-largest-element-in-an-array',
      num: 215,
      title: 'Kth Largest Element in an Array',
      difficulty: 'Medium',
      category: 'heap',
      pattern: 'Min-heap of size k',
      prompt:
        'Return the **k-th largest** value in an unsorted array `nums`. Positions count, so duplicates count separately: it is the k-th largest in sorted order, not the k-th largest *distinct* value. Try to beat a full sort.',
      examples: [
        { input: 'nums = [7, 2, 9, 4, 5], k = 2', output: '7' },
        { input: 'nums = [6, 6, 3, 6], k = 3', output: '6', note: 'Sorted from biggest: 6, 6, 6, 3. The 3rd is 6.' },
      ],
      signals: ['"k-th largest"', 'unsorted input', 'only one rank is needed, not the full order'],
      hints: [
        'Sorting works in O(n log n). Do you really need everything in order?',
        'Only the k largest numbers matter. How can you keep just those?',
        'Stream the numbers through a min-heap capped at size k. At the end, its top is the answer.',
      ],
      brute:
        'Sort and return `nums[-k]`: **O(n log n)**. Quickselect (the partition step from quicksort) averages **O(n)**, but its worst case is O(n²) and it is trickier to write correctly.',
      insight:
        'A **min-heap of size k** holds the k largest values seen so far. Anything smaller than its top can never be the answer, and after the last number the top *is* the answer.',
      mnemonic: 'Cap a min-heap at k; its top is the answer.',
      steps: [
        'Create an empty min-heap.',
        'Push each number onto the heap.',
        'Whenever the heap holds more than k numbers, pop the smallest.',
        'After all numbers, return the top of the heap.',
      ],
      solution: py`
class Solution:
    def findKthLargest(self, nums: List[int], k: int) -> int:
        #@ A min-heap that holds the k largest numbers seen so far.
        heap = []
        for n in nums:
            heapq.heappush(heap, n)
            #@ Too many? Pop the smallest; it can never be among the k largest.
            if len(heap) > k:  #!
                heapq.heappop(heap)
        #@ The smallest of the k largest is the k-th largest.
        return heap[0]  #!`,
      time: 'O(n log k)',
      space: 'O(k)',
      complexityWhy: 'Each number costs at most one push and one pop on a heap of at most k + 1 items.',
      pitfalls: [
        'Treating duplicates as one value: in `[6, 6, 3]` with k = 2 the answer is 6, not 3.',
        'Quickselect is the O(n)-average follow-up. Mention it, but the heap is safer to code under pressure.',
        'Shortcut in real code: `heapq.nlargest(k, nums)[-1]` does the same thing in one line.',
      ],
    },
    {
      id: 'task-scheduler',
      num: 621,
      title: 'Task Scheduler',
      difficulty: 'Medium',
      category: 'heap',
      pattern: 'Max-heap + cooldown queue',
      alsoAccept: ['greedy'],
      prompt:
        'A CPU must run a list of tasks, each labeled with a letter. Every task takes one time unit. After a task runs, the **same** letter must wait at least `n` units before it runs again; the CPU may sit idle meanwhile. Return the **minimum** number of time units needed to finish every task.',
      examples: [
        { input: 'tasks = ["X", "X", "X", "Y"], n = 1', output: '5', note: 'X → Y → X → idle → X.' },
        { input: 'tasks = ["P", "Q", "P", "R", "Q", "P"], n = 2', output: '7', note: 'P → Q → R → P → Q → idle → P.' },
      ],
      signals: ['a cooldown: "must wait n units"', 'minimum total time', 'always do the most frequent task that is ready'],
      hints: [
        'Which task is the most dangerous to leave until the end?',
        'Always run the ready task with the most copies left. A max-heap of counts gives you that instantly.',
        'After a task runs, park it in a queue together with the time it becomes ready again; move it back into the heap when that time arrives.',
      ],
      brute: 'Try every possible order of the tasks: factorial time, hopeless beyond a handful of tasks.',
      insight:
        'Greedy works: running the task with the **most copies left** first stops one letter from piling up at the end. A **max-heap** picks that task; a **queue** holds tasks that are cooling down until they may return.',
      mnemonic: 'Run the most frequent; cool it down in a queue.',
      steps: [
        'Count each task and put the counts into a max-heap (negated).',
        'Each loop is one time unit, so add 1 to time.',
        'If the heap has tasks, pop the most frequent and use up one copy.',
        'If copies remain, add it to the cooldown queue with the time it becomes ready.',
        'If nothing is ready, jump time forward to when the first queued task is ready.',
        'When the front of the queue is ready, push it back onto the heap; return time once both are empty.',
      ],
      solution: py`
class Solution:
    def leastInterval(self, tasks: List[str], n: int) -> int:
        #@ Only the number of copies of each task matters. Put the counts in a max-heap (negated).
        counts = collections.Counter(tasks)
        heap = [-c for c in counts.values()]
        heapq.heapify(heap)
        #@ cooldown holds (copies left as a negative number, time it is ready again), oldest first.
        cooldown = collections.deque()
        time = 0
        #@ Each loop is one time unit. Stop when nothing is ready and nothing is cooling down.
        while heap or cooldown:
            time += 1
            #@ Run the task with the most copies left. Adding 1 to its negative count uses up one copy.
            if heap:
                left = heapq.heappop(heap) + 1  #!
                if left:
                    cooldown.append((left, time + n))  #!
            #@ Nothing is ready: the CPU would idle, so jump straight to when the first task is ready.
            else:
                time = cooldown[0][1]
            #@ A task whose wait is over goes back into the heap, ready to run next unit.
            if cooldown and cooldown[0][1] == time:
                heapq.heappush(heap, cooldown.popleft()[0])  #!
        #@ time now counts every unit, idle ones included.
        return time`,
      time: 'O(t)',
      space: 'O(1)',
      complexityWhy:
        'There are at most 26 task letters, so the heap and queue stay tiny and each heap operation is effectively O(1). Every loop either runs a task or skips idle time just before one, so there are at most about 2t loops for t tasks.',
      pitfalls: [
        'Checking the cooldown queue *before* running a task lets a task return one unit too early.',
        'Without the idle jump the answer is still right, but a large n makes the loop crawl through every idle unit.',
        'Math shortcut: with f = the highest count and m = how many letters share it, the answer is `max(len(tasks), (f - 1) * (n + 1) + m)`. Great to know, hard to discover under pressure.',
      ],
    },
    {
      id: 'design-twitter',
      num: 355,
      title: 'Design Twitter',
      difficulty: 'Medium',
      category: 'heap',
      pattern: 'Heap merge of sorted feeds',
      prompt:
        'Build a tiny Twitter. Users can `postTweet(userId, tweetId)`, `follow` and `unfollow` other users, and call `getNewsFeed(userId)` to get the IDs of the **10 most recent** tweets posted by that user or by anyone they follow, newest first.',
      examples: [
        {
          input: 'postTweet(1, 50), postTweet(2, 60), getNewsFeed(1), follow(1, 2), getNewsFeed(1), unfollow(1, 2), getNewsFeed(1)',
          output: '[50], [60, 50], [50]',
          note: 'These are the three getNewsFeed results in order. Following user 2 brings tweet 60 into the feed of user 1.',
        },
      ],
      signals: ['"10 most recent" from many sources', 'each user has their own time-ordered list', 'merge several sorted lists but only need the first few'],
      hints: [
        "Each user's tweets are already in time order. Which earlier problem does getting the newest overall remind you of?",
        'It is Merge K Sorted Lists, except you stop after 10 items.',
        "Put the newest tweet of every relevant user into a max-heap keyed on time. Pop the newest, then push that user's next-older tweet. Repeat up to 10 times.",
      ],
      brute:
        'Collect every tweet from the user and all followees, sort them all by time, and take 10: **O(T log T)** per feed request, where T is the number of those tweets.',
      insight:
        "Every user's tweet list is already sorted by time, so the feed is a **k-way merge** that stops after 10 items. A **max-heap** holding one newest-unread tweet per user does exactly that.",
      mnemonic: 'Newest tweet from each followee into a heap; pop ten.',
      steps: [
        'Keep a global clock, a dict of user to list of (time, tweetId), and a dict of user to set of followees.',
        'postTweet: append (time, tweetId) to that user list and tick the clock.',
        'getNewsFeed: push the newest tweet of the user and of each followee into a max-heap keyed on time.',
        'Pop the newest tweet into the feed, then push the next-older tweet from the same user.',
        'Stop at 10 tweets or when the heap is empty.',
        'follow adds to the followee set; unfollow discards from it.',
      ],
      solution: py`
class Twitter:

    def __init__(self):
        #@ A global clock stamps every tweet, so newer tweets get bigger times.
        self.time = 0
        #@ tweets: user to a list of (time, tweetId), oldest first. following: user to a set of followees.
        self.tweets = collections.defaultdict(list)
        self.following = collections.defaultdict(set)

    #@ postTweet: record the tweet with the current time, then tick the clock.
    def postTweet(self, userId: int, tweetId: int) -> None:
        self.tweets[userId].append((self.time, tweetId))
        self.time += 1

    #@ getNewsFeed: look at the user and everyone they follow, and find each one's newest tweet.
    def getNewsFeed(self, userId: int) -> List[int]:
        heap = []
        for uid in self.following[userId] | {userId}:
            if self.tweets[uid]:
                idx = len(self.tweets[uid]) - 1
                #@ Heap entries are (negated time, tweetId, user, index), so the newest tweet pops first.
                t, tid = self.tweets[uid][idx]
                heap.append((-t, tid, uid, idx))  #!
        heapq.heapify(heap)
        #@ Pop the newest remaining tweet into the feed, up to 10 tweets.
        feed = []
        while heap and len(feed) < 10:
            _, tid, uid, idx = heapq.heappop(heap)
            feed.append(tid)
            #@ That user may have older tweets: push the next one so it can compete.
            if idx > 0:
                t, older_tid = self.tweets[uid][idx - 1]
                heapq.heappush(heap, (-t, older_tid, uid, idx - 1))  #!
        #@ The feed was built newest first, as required.
        return feed

    #@ follow just adds the followee to the follower's set.
    def follow(self, followerId: int, followeeId: int) -> None:
        self.following[followerId].add(followeeId)

    #@ unfollow removes them with discard, which is safe even if they never followed.
    def unfollow(self, followerId: int, followeeId: int) -> None:
        self.following[followerId].discard(followeeId)`,
      time: 'O(F + 10 log F) per feed',
      space: 'O(T + E)',
      complexityWhy:
        'For a user following F people, building the heap is O(F) and each of the 10 pops and pushes is O(log F). Posting and following are O(1). We store T tweets and E follow links.',
      pitfalls: [
        'A user always sees their own tweets, even though they do not follow themselves.',
        '`set.remove` raises an error when unfollowing someone you never followed; `discard` does not.',
        'Use a global counter for time, not the tweet ID: IDs are not guaranteed to grow over time.',
        'Sorting all relevant tweets on every request works, but it wastes time once users have long histories.',
      ],
    },
    {
      id: 'find-median-from-data-stream',
      num: 295,
      title: 'Find Median from Data Stream',
      difficulty: 'Hard',
      category: 'heap',
      pattern: 'Two heaps (max-heap + min-heap)',
      prompt:
        'Design a `MedianFinder` that receives numbers one at a time with `addNum(num)` and can report the **median** of everything so far with `findMedian()`. The median is the middle value in sorted order, or the average of the two middle values when the count is even.',
      examples: [
        {
          input: 'addNum(5), addNum(9), findMedian(), addNum(1), findMedian()',
          output: 'findMedian() → 7.0, then 5.0',
          note: '[5, 9] gives (5 + 9) / 2 = 7.0; [1, 5, 9] gives 5.0.',
        },
      ],
      signals: ['running or streaming median', 'numbers keep arriving, with queries in between', 'need the middle of a changing collection'],
      hints: [
        'The median only depends on the values right around the middle. Do you need the rest in order?',
        'Split the numbers into a lower half and an upper half. What do you need to know about each half?',
        'Keep the lower half in a max-heap and the upper half in a min-heap, with equal sizes or the lower half one bigger. The median comes from their tops.',
      ],
      brute:
        'Keep a sorted list and insert each number in its place (`bisect.insort`). Finding the spot is fast, but inserting shifts elements: **O(n)** per add.',
      insight:
        'Two heaps split the numbers in half: a **max-heap** for the smaller half and a **min-heap** for the larger half. Their tops are the middle values, ready in O(1).',
      mnemonic: 'Small half max-heap, big half min-heap; median at the tops.',
      steps: [
        'Create small (a max-heap via negation) and large (a min-heap).',
        'addNum: push the number into small.',
        'Move the largest of small over to large, so every value in small is at most every value in large.',
        'If large now has more items than small, move its smallest back to small.',
        'findMedian: if small is bigger, return its top; otherwise average the two tops.',
      ],
      solution: py`
class MedianFinder:

    def __init__(self):
        #@ small is a max-heap (negated) for the lower half. large is a min-heap for the upper half.
        self.small, self.large = [], []

    #@ addNum: push into small, then move small's biggest to large. Every value in small stays at most every value in large.
    def addNum(self, num: int) -> None:
        heapq.heappush(self.small, -num)
        heapq.heappush(self.large, -heapq.heappop(self.small))  #!
        #@ Rebalance so small holds the same number of items as large, or one more.
        if len(self.large) > len(self.small):
            heapq.heappush(self.small, -heapq.heappop(self.large))  #!

    #@ findMedian: an odd count returns the top of small. An even count returns the average of the two tops.
    def findMedian(self) -> float:
        if len(self.small) > len(self.large):
            return float(-self.small[0])
        return (-self.small[0] + self.large[0]) / 2  #!`,
      time: 'O(log n) per add',
      space: 'O(n)',
      complexityWhy:
        'addNum does a few heap pushes and pops, O(log n) each. findMedian only peeks at the tops, O(1). All n numbers are stored.',
      pitfalls: [
        'Forgetting that `small` stores negatives: flip the sign whenever you read `small[0]`.',
        'Skipping the pass-through-small step can leave a big number in the lower half and break the ordering.',
        'Use `/ 2`, not `// 2`: the median of 5 and 8 is 6.5.',
      ],
    },
  ],
};

export default content;
