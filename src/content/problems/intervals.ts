import { py, type CategoryContent } from '../types';

const content: CategoryContent = {
  guide: {
    category: 'intervals',
    summary: `An **interval** is a pair \`[start, end]\`: a meeting from 9 to 11, a hotel booking, a range of numbers. Interval problems ask which ones overlap, how to merge them, or how many are happening at once.

Unsorted intervals are a mess: an overlap could be hiding anywhere in the list. So the first move is almost always to **sort by start time**. After sorting, an interval can only overlap the ones just before it.

Then walk the list once and compare each interval with the **last one you kept**. In general, two intervals overlap when each one starts before the other ends: \`a.start <= b.end and b.start <= a.end\`. After sorting, half of that is automatic, so you only check \`new.start <= last.end\`.

If they overlap, merge them (stretch the end) or count a clash. If not, the new interval starts a fresh group. When you need to know how many intervals are active **at the same time**, add a **min-heap of end times**.`,
    analogy:
      'Think of a paper calendar. If you write every appointment in order of start time, you can spot a double-booking by looking at each appointment and the one right before it. You never need to compare every pair.',
    whenToUse: [
      'The input is a list of `[start, end]` pairs (meetings, bookings, ranges) → **sort by start** first',
      'You must **merge**, **insert** or **remove** overlapping ranges → sort, then compare with the last kept interval',
      'You need the most things happening **at the same moment** (rooms, platforms, CPUs) → **min-heap of end times**',
      'You want to keep as many non-clashing intervals as possible → greedy: keep the one that **ends first**',
      'Many queries ask "which interval covers this point?" → sort the queries too and sweep both lists together',
    ],
    template: py`
def merge_sweep(intervals):
    intervals.sort(key=lambda iv: iv[0])   # 1. sort by start time
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        last = merged[-1]
        if start <= last[1]:                # 2. overlaps the last kept interval
            last[1] = max(last[1], end)     #    so stretch it to cover both
        else:
            merged.append([start, end])     # 3. a gap: start a new group
    return merged`,
    templateNotes: [
      'Sorting costs O(n log n) and is usually the slowest step. The sweep after it is a single O(n) pass.',
      'Decide whether touching intervals like `[1, 3]` and `[3, 5]` overlap. Merge Intervals says yes (use `<=`); meeting problems usually say no (use `<`).',
      '`intervals.sort()` with no key also works: lists compare by first element, then second.',
      'Compare against `merged[-1]` (the last *kept* interval), not the previous input interval: the last kept one may have been stretched.',
    ],
    complexity: 'O(n log n) time for the sort, then O(n) for the sweep. O(n) space for the output.',
    quiz: [
      {
        q: 'The intervals are sorted by start. When does `[s, e]` overlap the last kept interval `[ls, le]`?',
        options: ['`s <= le`', '`e <= ls`', '`s >= le`', '`e >= le`'],
        answer: 0,
        explain: 'Sorting already guarantees `ls <= s`. The only question left is whether the new one starts before the last one ends.',
      },
      {
        q: 'Why do most interval solutions begin by sorting by start time?',
        options: [
          'It makes the output look tidy',
          'Overlapping intervals end up next to each other, so one pass finds them all',
          'It lets you use binary search on the ends',
          'Python can only compare sorted lists',
        ],
        answer: 1,
        explain: 'Once sorted, an interval can only overlap its neighbors, so you never need to compare every pair.',
      },
      {
        q: 'You are assigning meetings to rooms and want the room that frees up soonest. What should you keep?',
        options: ['A stack of start times', 'A min-heap of end times', 'A set of room numbers', 'A sorted list of durations'],
        answer: 1,
        explain: 'A min-heap always has the smallest end time on top, so the earliest-free room is one lookup away.',
      },
      {
        q: 'Merge `[[1, 4], [2, 6], [8, 9]]`. What do you get?',
        options: ['`[[1, 6], [8, 9]]`', '`[[1, 9]]`', '`[[1, 4], [2, 6], [8, 9]]`', '`[[2, 4], [8, 9]]`'],
        answer: 0,
        explain: '`[2, 6]` starts before `[1, 4]` ends, so they merge into `[1, 6]`. `[8, 9]` starts after 6, so it stays separate.',
      },
    ],
  },

  problems: [
    {
      id: 'insert-interval',
      num: 57,
      title: 'Insert Interval',
      difficulty: 'Medium',
      category: 'intervals',
      pattern: 'Three-phase sweep: before, overlap, after',
      prompt:
        'You get a list of non-overlapping intervals that is already **sorted by start**, plus one `newInterval`. Insert it so the list stays sorted with no overlaps, merging it with any intervals it touches or overlaps. Return the new list.',
      examples: [
        { input: 'intervals = [[1, 2], [4, 6], [9, 11]], newInterval = [5, 9]', output: '[[1, 2], [4, 11]]', note: '[5, 9] overlaps [4, 6] and touches [9, 11], so all three merge.' },
        { input: 'intervals = [[2, 3], [7, 8]], newInterval = [4, 5]', output: '[[2, 3], [4, 5], [7, 8]]', note: 'No overlap: it just slots into the gap.' },
        { input: 'intervals = [], newInterval = [3, 4]', output: '[[3, 4]]' },
      ],
      signals: ['list is already sorted and non-overlapping', '"insert" one new interval', '"merge if necessary"'],
      hints: [
        'The old intervals fall into three groups: completely before the new one, overlapping it, and completely after it.',
        'An old interval is completely before the new one if it ends before the new one starts.',
        'Copy the "before" group, swallow the overlapping group into one stretched interval (smallest start, largest end), then copy the "after" group.',
      ],
      brute:
        'Append `newInterval`, sort everything again and run Merge Intervals. That is **O(n log n)** and ignores the fact that the list is already sorted, which lets us finish in one **O(n)** pass.',
      insight:
        'Because the list is sorted, the intervals split into three runs: **before**, **overlapping**, **after**. Only the middle run needs work: squash it into one interval using the smallest start and the largest end.',
      mnemonic: 'Copy the left, swallow the middle, copy the right.',
      steps: [
        'Copy every interval that ends before the new interval starts.',
        'While an interval starts at or before the new end, merge it in.',
        'Merging means keeping the smaller start and the larger end.',
        'Append the merged interval exactly once.',
        'Copy all the remaining intervals.',
      ],
      solution: py`
class Solution:
    def insert(self, intervals: List[List[int]], newInterval: List[int]) -> List[List[int]]:
        #@ Build the answer in a new list. i walks through the sorted intervals once.
        result = []
        i, n = 0, len(intervals)
        #@ Phase 1: intervals that end before the new one starts cannot touch it. Copy them as they are.
        while i < n and intervals[i][1] < newInterval[0]:  #!
            result.append(intervals[i])
            i += 1
        #@ Phase 2: every interval that starts before the new one ends overlaps it. Swallow each one by stretching the new interval.
        start, end = newInterval
        while i < n and intervals[i][0] <= end:  #!
            start = min(start, intervals[i][0])
            end = max(end, intervals[i][1])  #!
            i += 1
        #@ The merged block is complete, so add it once.
        result.append([start, end])
        #@ Phase 3: everything left starts after the merged block ends. Copy the rest.
        result.extend(intervals[i:])
        return result`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy: 'Each interval is looked at once. The output list holds up to n + 1 intervals.',
      pitfalls: [
        'Phase 1 needs a strict `<`: an interval ending exactly where the new one starts touches it and must be merged.',
        'Forgetting to append the merged interval when nothing overlapped. It must always be added, even on its own.',
        'Empty `intervals`: both loops are skipped and the answer is just `[newInterval]`. Make sure your code allows that.',
      ],
    },
    {
      id: 'merge-intervals',
      num: 56,
      title: 'Merge Intervals',
      difficulty: 'Medium',
      category: 'intervals',
      pattern: 'Sort by start, merge with the last kept interval',
      prompt:
        'You get a list of intervals `[start, end]` in **any order**. Merge every group of overlapping intervals into one and return the merged list. Intervals that just touch, like `[1, 3]` and `[3, 4]`, count as overlapping.',
      examples: [
        { input: 'intervals = [[8, 10], [1, 3], [2, 5], [9, 12]]', output: '[[1, 5], [8, 12]]', note: '[1, 3] and [2, 5] overlap, and so do [8, 10] and [9, 12].' },
        { input: 'intervals = [[4, 6], [6, 7]]', output: '[[4, 7]]', note: 'They touch at 6, which counts.' },
        { input: 'intervals = [[1, 10], [2, 3]]', output: '[[1, 10]]', note: '[2, 3] sits completely inside [1, 10].' },
      ],
      signals: ['"merge all overlapping intervals"', 'intervals arrive unsorted', 'output has fewer intervals than input'],
      hints: [
        'If the intervals were in order of start time, where could an overlap for a given interval be?',
        'After sorting, each interval can only overlap the last merged interval you have built so far.',
        'Sort by start. If the next start is at most the last end, stretch the last end to the larger of the two ends; otherwise start a new interval.',
      ],
      brute:
        'Compare every interval with every other one and merge overlapping pairs, repeating until nothing changes. That is at least **O(n²)** and fiddly to get right.',
      insight:
        'Sort by start time. Then overlapping intervals sit **next to each other**, and you only ever compare the current interval with the **last merged one**.',
      mnemonic: 'Sort by start. Overlaps the last? Stretch it. Else append.',
      steps: [
        'Sort the intervals by start time.',
        'Put the first interval into the merged list.',
        'For each next interval, look at the last merged interval.',
        'If it starts at or before that end, stretch the end to the larger of the two.',
        'Otherwise, append it as a new merged interval.',
      ],
      solution: py`
class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        #@ Sort by start time so any overlapping intervals end up side by side.
        intervals.sort(key=lambda iv: iv[0])  #!
        #@ The first interval starts our answer list.
        merged = [intervals[0]]
        #@ Compare each remaining interval with the last one we kept.
        for start, end in intervals[1:]:
            last = merged[-1]
            #@ It starts before (or exactly when) the last one ends: they overlap, so stretch the last one. Use max in case it was already longer.
            if start <= last[1]:  #!
                last[1] = max(last[1], end)  #!
            #@ There is a gap, so this interval begins a brand-new merged block.
            else:
                merged.append([start, end])
        #@ Every interval has now been absorbed or added.
        return merged`,
      time: 'O(n log n)',
      space: 'O(n)',
      complexityWhy: 'Sorting is O(n log n) and the merge pass is O(n). The merged list can hold all n intervals.',
      pitfalls: [
        'Writing `last[1] = end` instead of `max(last[1], end)` breaks when one interval sits inside another, like `[1, 10]` and `[2, 3]`.',
        'Forgetting to sort first: overlapping intervals might not be neighbors.',
        'Using `<` instead of `<=` fails to merge touching intervals like `[1, 3]` and `[3, 4]`.',
      ],
    },
    {
      id: 'non-overlapping-intervals',
      num: 435,
      title: 'Non-overlapping Intervals',
      difficulty: 'Medium',
      category: 'intervals',
      pattern: 'Sort, on a clash keep the interval that ends first',
      alsoAccept: ['greedy'],
      prompt:
        'Given a list of intervals, return the **fewest intervals you must delete** so that none of the remaining ones overlap. Intervals that only touch at an end point, like `[1, 3]` and `[3, 6]`, do *not* count as overlapping.',
      examples: [
        { input: 'intervals = [[1, 4], [2, 3], [3, 5], [6, 7]]', output: '1', note: 'Delete [1, 4]; the rest only touch or are apart.' },
        { input: 'intervals = [[2, 5], [2, 5], [2, 5]]', output: '2' },
        { input: 'intervals = [[1, 2], [2, 4]]', output: '0', note: 'Touching is allowed.' },
      ],
      signals: ['"minimum number of intervals to remove"', 'same as: keep as many as possible', 'touching end points are allowed'],
      hints: [
        'Removing as few as possible is the same as keeping as many as possible.',
        'When two intervals clash, one of them has to go. Which one is less likely to cause clashes later?',
        'Sort by start. On a clash, delete the one that ends later, and remember the smaller end.',
      ],
      brute:
        'Try every subset of intervals and keep the largest one with no overlaps. That is **O(2ⁿ)**, hopeless even for 40 intervals.',
      insight:
        'When two intervals clash, always keep the one that **ends first**. It leaves the most room for everything after it, so this greedy choice is never worse.',
      mnemonic: 'Clash? Drop the one that ends later.',
      steps: [
        'Sort the intervals by start time.',
        'Track the end of the last kept interval and a removal count.',
        'If the next interval starts at or after that end, keep it and move the end forward.',
        'Otherwise, count one removal.',
        'After a clash, keep the smaller of the two ends.',
      ],
      solution: py`
class Solution:
    def eraseOverlapIntervals(self, intervals: List[List[int]]) -> int:
        #@ Sort by start so clashes show up next to each other.
        intervals.sort(key=lambda iv: iv[0])
        #@ removed counts deletions. prev_end is where the last kept interval ends.
        removed = 0
        prev_end = intervals[0][1]
        #@ Walk the rest of the intervals in start order.
        for start, end in intervals[1:]:
            #@ No clash (touching is fine): keep it, and it becomes the last kept interval.
            if start >= prev_end:  #!
                prev_end = end
            #@ A clash: one of the two must go. Delete the one that ends later by keeping the smaller end. It leaves more room for what comes next.
            else:
                removed += 1
                prev_end = min(prev_end, end)  #!
        #@ The number of deletions is the answer.
        return removed`,
      time: 'O(n log n)',
      space: 'O(1)',
      complexityWhy: 'Sorting dominates at O(n log n); the sweep is O(n). Besides the sort, we only keep two variables.',
      pitfalls: [
        'Treating touching intervals like `[1, 3]` and `[3, 6]` as a clash. Here they are allowed, so keep when `start >= prev_end`.',
        'On a clash, keeping the *later* end instead of `min(prev_end, end)` can make you delete far more than needed.',
        'An equally good classic: sort by **end** and keep every interval that starts at or after the last kept end.',
      ],
    },
    {
      id: 'meeting-rooms',
      num: 252,
      title: 'Meeting Rooms',
      difficulty: 'Easy',
      category: 'intervals',
      premium: true,
      pattern: 'Sort by start, compare neighbors',
      prompt:
        'Each meeting is a pair `[start, end]`. Can one person attend **all** of them? Return `True` if no two meetings overlap. A meeting that ends at 5 and another that starts at 5 do not clash.',
      examples: [
        { input: 'intervals = [[9, 12], [1, 4], [3, 6]]', output: 'False', note: '[1, 4] and [3, 6] overlap between 3 and 4.' },
        { input: 'intervals = [[6, 8], [1, 3], [3, 5]]', output: 'True', note: 'Back-to-back meetings are fine.' },
      ],
      signals: ['"attend all meetings"', 'yes/no: is there any overlap at all?', 'list of start and end times'],
      hints: [
        'Comparing every pair works but is slow. Is there an order that makes clashes easy to spot?',
        'After sorting by start time, a meeting can only clash with the one right before it.',
        'Sort, then return False if any meeting starts before the previous one ends.',
      ],
      brute: 'Compare every pair of meetings to see if they overlap: **O(n²)**.',
      insight:
        'Sort by start time. Then you only need to compare **neighbors**: if any meeting starts before the previous one ends, there is a clash.',
      mnemonic: 'Sort by start; any start before the previous end? Clash.',
      steps: [
        'Sort the meetings by start time.',
        'Loop from the second meeting to the last.',
        'If a meeting starts before the previous one ends, return False.',
        'If no neighbors clash, return True.',
      ],
      solution: py`
class Solution:
    def canAttendMeetings(self, intervals: List[List[int]]) -> bool:
        #@ Sort meetings by start time so we only need to compare neighbors.
        intervals.sort(key=lambda iv: iv[0])  #!
        #@ Check each meeting against the one right before it.
        for i in range(1, len(intervals)):
            #@ Starting before the previous meeting ends means being in two places at once.
            if intervals[i][0] < intervals[i - 1][1]:  #!
                return False
        #@ No neighbors clash, so every meeting fits.
        return True`,
      time: 'O(n log n)',
      space: 'O(1)',
      complexityWhy: 'Sorting is O(n log n); the neighbor check is one O(n) pass with no extra storage.',
      pitfalls: [
        'Using `<=` wrongly rejects back-to-back meetings like `[1, 3]` and `[3, 5]`.',
        'Forgetting to sort: in the original order, two clashing meetings may be far apart in the list.',
        'An empty list or a single meeting is always fine. The loop simply does not run.',
      ],
    },
    {
      id: 'meeting-rooms-ii',
      num: 253,
      title: 'Meeting Rooms II',
      difficulty: 'Medium',
      category: 'intervals',
      premium: true,
      pattern: 'Sort by start + min-heap of end times',
      alsoAccept: ['heap'],
      prompt:
        'Given a list of meeting times `[start, end]`, return the **fewest conference rooms** needed so every meeting gets a room. A room freed at time 5 can be used again by a meeting that starts at 5.',
      examples: [
        { input: 'intervals = [[1, 10], [2, 6], [3, 5], [7, 9]]', output: '3', note: 'At time 4 the first three meetings are all running.' },
        { input: 'intervals = [[2, 7], [4, 9], [8, 12], [1, 3]]', output: '2' },
        { input: 'intervals = [[4, 9], [9, 12]]', output: '1', note: 'The second meeting reuses the room the first one just left.' },
      ],
      signals: ['"minimum number of rooms"', 'how many intervals overlap at the same moment', 'reuse a resource once it frees up'],
      hints: [
        'Handle meetings in order of start time. When a new meeting starts, which busy room should you try to reuse?',
        'The room that frees up soonest is the best one to check. What structure gives you the smallest end time quickly?',
        'Keep a min-heap of end times. If the smallest end is at or before the new start, pop it (reuse that room). Always push the new end. The heap size at the end is the answer.',
      ],
      brute:
        'For every meeting start time, count how many meetings are running at that moment and take the maximum: **O(n²)**.',
      insight:
        'Sort by start and keep a **min-heap of end times**, one per room. The top is the room that frees up first: reuse it if it is already free, otherwise open a new room.',
      mnemonic: 'Earliest-ending room free? Reuse it. Otherwise open a new one.',
      steps: [
        'Sort the meetings by start time.',
        'Create an empty min-heap of room end times.',
        'For each meeting, if the earliest end time is at or before its start, pop it.',
        'Push the meeting end time onto the heap.',
        'Return the size of the heap.',
      ],
      solution: py`
class Solution:
    def minMeetingRooms(self, intervals: List[List[int]]) -> int:
        #@ Handle meetings in the order they start.
        intervals.sort(key=lambda iv: iv[0])
        #@ A min-heap of end times: one entry per room, with the room that frees up soonest on top.
        ends = []
        #@ Place each meeting in turn.
        for start, end in intervals:
            #@ If the soonest-free room is already free when this meeting starts, reuse it by dropping its old end time.
            if ends and ends[0] <= start:  #!
                heapq.heappop(ends)
            #@ This meeting now holds a room until its end time.
            heapq.heappush(ends, end)  #!
        #@ Rooms are never closed, so the heap size is the number of rooms we had to open.
        return len(ends)`,
      time: 'O(n log n)',
      space: 'O(n)',
      complexityWhy: 'Sorting is O(n log n), and each meeting is pushed and popped at most once at O(log n) each. The heap can hold n end times.',
      pitfalls: [
        'Using `<` instead of `<=` gives a meeting that starts exactly when another ends a room it does not need.',
        'If you pop *every* finished room with a `while` loop, the final heap size is no longer the answer; you must track the largest size seen.',
        'Alternative: sort the start times and end times separately and sweep them with two pointers. Also O(n log n).',
      ],
    },
    {
      id: 'minimum-interval-to-include-each-query',
      num: 1851,
      title: 'Minimum Interval to Include Each Query',
      difficulty: 'Hard',
      category: 'intervals',
      pattern: 'Sort intervals and queries, min-heap of (size, end)',
      alsoAccept: ['heap'],
      prompt:
        'You get a list of intervals `[left, right]` (both ends included) and a list of query numbers. For each query, find the **size of the smallest interval that contains it**, where size is `right - left + 1`. If no interval contains the query, its answer is `-1`. Return the answers in the original query order.',
      examples: [
        { input: 'intervals = [[2, 5], [1, 8], [6, 7]], queries = [3, 6, 9]', output: '[4, 2, -1]', note: '3 is in [2, 5] (size 4) and [1, 8] (size 8); 6 is in [6, 7] (size 2); 9 is in none.' },
        { input: 'intervals = [[1, 1], [1, 3]], queries = [1, 2, 1]', output: '[1, 3, 1]' },
      ],
      signals: ['many queries against many intervals', '"smallest interval that contains" a point', 'answers can be found in any order, then put back'],
      hints: [
        'Answering queries in sorted order helps: an interval that starts before a small query also starts before every bigger query.',
        'Keep the intervals that might contain the current query in a structure that always hands you the smallest one.',
        'Sort intervals and queries. For each query, push every interval that has started onto a min-heap of (size, right), pop the ones whose right end is before the query, and read the top.',
      ],
      brute:
        'For every query, scan every interval and keep the smallest one that contains it: **O(n · q)**. With 100,000 of each, that is 10 billion checks.',
      insight:
        'Process the queries **from small to large**. Then each interval is added once (when it starts) and removed once (when it has ended), and a **min-heap keyed by size** gives the smallest live interval instantly.',
      mnemonic: 'Sorted queries: push started intervals, pop ended ones, read the top.',
      steps: [
        'Sort the intervals by their left end.',
        'Visit the queries in increasing order.',
        'Push every interval that starts at or before the query onto a min-heap of (size, right).',
        'Pop intervals from the top whose right end is before the query.',
        'Record the top size as the answer for that query, or -1 if the heap is empty.',
        'Return the answers in the original query order.',
      ],
      solution: py`
class Solution:
    def minInterval(self, intervals: List[List[int]], queries: List[int]) -> List[int]:
        #@ Sort intervals by left end. answers maps each query value to its result; heap holds (size, right) of intervals that have started.
        intervals.sort()
        answers = {}
        heap = []
        i = 0
        #@ Visit each distinct query from smallest to largest.
        for q in sorted(set(queries)):
            #@ Push every interval that starts at or before q, keyed by its size.
            while i < len(intervals) and intervals[i][0] <= q:  #!
                left, right = intervals[i]
                heapq.heappush(heap, (right - left + 1, right))  #!
                i += 1
            #@ Drop intervals on top that ended before q. They cannot contain any later, bigger query either.
            while heap and heap[0][1] < q:  #!
                heapq.heappop(heap)
            #@ Now the top of the heap is the smallest interval containing q.
            answers[q] = heap[0][0] if heap else -1
        #@ Report the answers in the original query order.
        return [answers[q] for q in queries]`,
      time: 'O(n log n + q log q)',
      space: 'O(n + q)',
      complexityWhy: 'Sorting both lists dominates. Each interval is pushed and popped at most once (O(log n) each). The heap and the answers dict hold up to n + q items.',
      pitfalls: [
        'Trying to delete ended intervals from the middle of the heap. You do not need to: a stale interval only matters once it reaches the top, and then it gets popped.',
        'Queries can repeat and arrive unsorted, so store answers by query value (or sort query indices) to return them in the original order.',
        'Size is `right - left + 1`, not `right - left`, because both ends are included.',
      ],
    },
  ],
};

export default content;
