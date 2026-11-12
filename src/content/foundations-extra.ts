// ─────────────────────────────────────────────────────────────────────────────
// Foundations lessons kept in their own file. Each names the lesson of
// foundations.ts it comes after; foundations.ts builds the track from both.
// Same slide format and rules as foundations.ts (docs/CONTENT_GUIDE.md).
// ─────────────────────────────────────────────────────────────────────────────
import { py, type Lesson } from './types';

// ── After Lists and Strings ────────────────────────────────────────────────
// Only uses what Python Basics, Decisions and Loops and Lists and Strings taught:
// no dicts, sets, functions or classes yet.
const GRIDS_AND_POINTERS: Lesson = {
  id: 'grids-and-pointers',
  title: 'Grids and Pointers',
  icon: '🏁',
  blurb: 'Conditions with and/or, loops that move an index, two pointers, stacks and 2-D grids.',
  minutes: 47,
  slides: [
    {
      kind: 'text',
      title: 'Loops you steer yourself',
      body: `So far your loops have visited every item in order, or counted down to zero. Interview solutions often steer a loop by hand: an index you move yourself, two indexes that walk toward each other, a list used as a stack, a grid of rows and columns.

All of them lean on conditions that test two things at once, like \`i < len(nums) and nums[i] == 0\`. This lesson gives you practice with each shape, one at a time. Every one of them comes back in dozens of problems.`,
    },
    {
      kind: 'code',
      title: 'A loop that moves its own index',
      body: 'A `for` loop moves to the next item by itself. With `while`, **you** hold the index: set it before the loop, test it at the top, and move it inside. It is more typing, but you decide when the index moves and how far.',
      code: py`
nums = [4, 8, 15]
i = 0                    # start at the first index
while i < len(nums):     # stop once i is past the last index
    print(i, nums[i])
    i += 1               # move on: without this, the loop never ends`,
      output: py`
0 4
1 8
2 15`,
    },
    {
      kind: 'quiz',
      q: 'Trace it. What does `total` hold right after the **second** pass of the loop?',
      code: py`
nums = [3, 8, 1, 9, 4]
i = 0
total = 0
while i < len(nums):
    total += nums[i]
    i += 2`,
      options: ['11', '4', '8', '12'],
      answer: 1,
      explain:
        'Write down `i` and `total` pass by pass. Pass 1: `i` is 0, so `total` becomes 3, and `i` jumps to 2. Pass 2: `nums[2]` is 1, so `total` is **4**, and `i` becomes 4. A third pass adds `nums[4]` and makes it 8; then `i` is 6, `6 < 5` is false, and the loop stops. Because you move `i` yourself, it can step by 2, or by a different amount on every pass.',
    },
    {
      kind: 'code',
      title: 'and, or, not',
      body: 'You met these three in *Python Basics*: `and` is true when **both** sides are true, `or` when **at least one** is, and `not` flips a test. What is new: Python reads the sides left to right and **stops as soon as the answer is certain**. `and` stops at the first false side, `or` at the first true one. So the order matters: a first test can guard a second one that would crash.',
      code: py`
nums = [3, 0, 5]
i = 1
print(i < len(nums) and nums[i] == 0)   # both sides are true
print(nums[i] < 0 or nums[i] > 4)       # neither side is true
print(not nums[i] == 3)                 # not flips False to True
i = 3                                   # one past the last index
print(i < len(nums) and nums[i] == 0)   # False: nums[3] is never read
# print(nums[i] == 0 and i < len(nums))   would stop with an IndexError`,
      output: py`
True
False
True
False`,
    },
    {
      kind: 'type',
      title: 'Count the zeros at the front',
      prompt: 'Count the zeros at the front of `nums`: move `i` forward for as long as it is inside the list **and** `nums[i]` is `0`. Then print `i`.',
      starter: py`
nums = [0, 0, 0]
i = 0`,
      answer: py`
while i < len(nums) and nums[i] == 0:
    i += 1
print(i)`,
      accept: [
        py`
while i < len(nums) and nums[i] == 0:
    i = i + 1
print(i)`,
      ],
      pick: [
        py`
while nums[i] == 0 and i < len(nums):
    i += 1
print(i)`,
        py`
while i < len(nums) or nums[i] == 0:
    i += 1
print(i)`,
        py`
while nums[i] == 0 or i < len(nums):
    i += 1
print(i)`,
      ],
      ideas: ['and'],
      hint: 'Two tests joined by `and`. Put the one about `i` first: it has to be true before `nums[i]` is safe to read.',
      explain:
        'Every item is 0, so `i` climbs to 3, one past the last index. Then `i < len(nums)` is false, `and` stops right there, and `nums[3]` is never read. With the two tests the other way round, or with `or`, Python would go on to read `nums[3]` and stop with an `IndexError`. The first test guards the second: you will write this shape again and again.',
      output: '3',
    },
    {
      kind: 'type',
      title: 'Skip the bad spots',
      prompt: 'Loop over `spots` with `i`. Skip a spot with `continue` when it is off the list (`i < 0` or `i >= len(nums)`) or when `nums[i]` is `0`. For every other spot, print `i` and `nums[i]`.',
      starter: py`
nums = [7, 0, 4]
spots = [2, 5, 1, -1, 0]`,
      answer: py`
for i in spots:
    if i < 0 or i >= len(nums) or nums[i] == 0:
        continue
    print(i, nums[i])`,
      accept: [
        py`
for i in spots:
    if i >= len(nums) or i < 0 or nums[i] == 0:
        continue
    print(i, nums[i])`,
      ],
      pick: [
        py`
for i in spots:
    if i < 0 and i >= len(nums) and nums[i] == 0:
        continue
    print(i, nums[i])`,
        py`
for i in spots:
    if i < 0 or i >= len(nums) or nums[i] == 0:
        break
    print(i, nums[i])`,
        py`
for i in spots:
    if i < 0 and i >= len(nums) and nums[i] == 0:
        break
    print(i, nums[i])`,
      ],
      ideas: ['or', 'continue'],
      hint: 'Three tests joined by `or`, with `nums[i] == 0` last. `continue` goes inside the `if`; the `print` lines up with the `if`.',
      explain:
        '`or` is true as soon as one side is, and it stops there. For spot 5, `i >= len(nums)` is already true, so `nums[5]` is never read: the two range tests guard the last one. With `and`, all three would have to be true at once, which never happens. `continue` jumps to the next spot, where `break` would end the whole loop at the first bad one. The `i < 0` test matters too: `nums[-1]` would not crash, it would quietly read the last item.',
      output: py`
2 4
0 7`,
    },
    {
      kind: 'type',
      title: 'One digit, two digits, more',
      prompt: '`elif` adds a test that runs only when every test above it was false. Print `one digit` when `n` is under `10`, `two digits` when it is under `100`, and `three or more` otherwise.',
      starter: 'n = 7',
      answer: py`
if n < 10:
    print("one digit")
elif n < 100:
    print("two digits")
else:
    print("three or more")`,
      pick: [
        py`
if n < 10:
    print("one digit")
if n < 100:
    print("two digits")
else:
    print("three or more")`,
        py`
if n < 100:
    print("two digits")
if n < 10:
    print("one digit")
else:
    print("three or more")`,
      ],
      ideas: ['elif'],
      hint: 'Three branches: `if`, then `elif` with its own test, then `else` with none. Test the smallest limit first.',
      explain:
        'Python runs only the **first** branch whose test is true: 7 is under 10, so it prints `one digit` and skips the rest. That is what `elif` buys you. With a second plain `if`, the test `n < 100` would run as well, and 7 would also be called two digits. The order matters too: test `n < 100` first and every one-digit number stops there.',
      output: 'one digit',
    },
    {
      kind: 'code',
      title: 'Two pointers',
      body: 'Many solutions keep **two** indexes, one at each end, and walk them toward each other until they meet. `left, right = 0, len(s) - 1` sets both names in one line (solutions often shorten them to `l` and `r`). This program checks for a **palindrome**: text that reads the same in both directions.',
      code: py`
s = "level"
left, right = 0, len(s) - 1     # the first and the last index
ok = True
while left < right:             # stop when the pointers meet
    print(left, right, s[left], s[right])
    if s[left] != s[right]:
        ok = False
        break
    left += 1                   # one step in from each end
    right -= 1
print(ok)`,
      output: py`
0 4 l l
1 3 e e
True`,
    },
    {
      kind: 'type',
      title: 'Reverse a list in place',
      prompt: 'Reverse `nums` without making a new list. While `left` is less than `right`, swap the two items they point at in one line, then move both pointers one step inward. Print `nums` after the loop.',
      starter: py`
nums = [1, 2, 3, 4, 5]
left, right = 0, len(nums) - 1`,
      answer: py`
while left < right:
    nums[left], nums[right] = nums[right], nums[left]
    left += 1
    right -= 1
print(nums)`,
      accept: [
        py`
while left < right:
    nums[left], nums[right] = nums[right], nums[left]
    right -= 1
    left += 1
print(nums)`,
        py`
while left < right:
    nums[left], nums[right] = nums[right], nums[left]
    left = left + 1
    right = right - 1
print(nums)`,
        py`
while left < right:
    nums[right], nums[left] = nums[left], nums[right]
    left += 1
    right -= 1
print(nums)`,
      ],
      pick: [
        py`
while left < right:
    nums[left] = nums[right]
    nums[right] = nums[left]
    left += 1
    right -= 1
print(nums)`,
        py`
while left < right:
    nums[left], nums[right] = nums[right], nums[left]
    left += 1
print(nums)`,
        py`
while left < right:
    nums[left] = nums[right]
    nums[right] = nums[left]
    left += 1
print(nums)`,
      ],
      ideas: ['two pointers', 'swap'],
      hint: 'The swap is one line: both items on the left of `=`, the same two in the other order on the right. Then `left += 1` and `right -= 1`, still inside the loop.',
      explain:
        'Python works out the whole right side first and then stores both values, so `nums[left], nums[right] = nums[right], nums[left]` swaps without losing anything. As two separate lines, the first one overwrites `nums[left]` before it has been saved. Each pass moves **both** pointers one step in; leave `right` where it is and the loop pairs the wrong items. The pointers meet after two swaps, and the middle item stays put.',
      output: '[5, 4, 3, 2, 1]',
    },
    {
      kind: 'type',
      title: 'Zeros to the front',
      prompt: '`nums` holds only 0s and 1s. Move every `0` in front of every `1`, in place. Start `left` and `right` at the two ends. While `left < right`: if `nums[left]` is `0`, it is already in place, so move `left` up by one; `elif` `nums[right]` is `1`, move `right` down by one; `else` swap the two items. Print `nums` after the loop.',
      starter: 'nums = [1, 0, 1, 0, 0]',
      answer: py`
left, right = 0, len(nums) - 1
while left < right:
    if nums[left] == 0:
        left += 1
    elif nums[right] == 1:
        right -= 1
    else:
        nums[left], nums[right] = nums[right], nums[left]
print(nums)`,
      accept: [
        py`
left, right = 0, len(nums) - 1
while left < right:
    if nums[left] == 0:
        left += 1
    elif nums[right] == 1:
        right -= 1
    else:
        nums[right], nums[left] = nums[left], nums[right]
print(nums)`,
        py`
left, right = 0, len(nums) - 1
while left < right:
    if nums[left] == 0:
        left = left + 1
    elif nums[right] == 1:
        right = right - 1
    else:
        nums[left], nums[right] = nums[right], nums[left]
print(nums)`,
      ],
      check: py`
assert nums == [0, 0, 0, 1, 1]
assert left >= right  # the two pointers should have met`,
      ideas: ['two pointers', 'swap', 'elif'],
      hint: 'The first line is `left, right = 0, len(nums) - 1`. Inside the loop there are three branches: `if`, `elif`, `else`. Only the `else` branch swaps, and it moves no pointer: the next pass looks at the new items.',
      explain:
        '`left` walks past zeros that are already at the front, and `right` walks past ones that are already at the back. When neither can move, `left` sits on a 1 and `right` on a 0, the wrong way round, so they are swapped. Because of `elif`, each pass does exactly one of the three things. This is the two-pointer shape: two indexes, one loop, and a decision about which one moves.',
      output: '[0, 0, 0, 1, 1]',
    },
    {
      kind: 'code',
      title: 'A stack with a guarded loop',
      body: 'A list makes a **stack**: `append` puts an item on top, `pop()` takes the top one off, and `stack[-1]` looks at it. On an empty list `stack[-1]` raises an `IndexError`, so solutions test `stack` first: an empty list counts as false. Here each new number removes every smaller number from the top before it goes on.',
      code: py`
stack = []
for x in [5, 3, 8, 6]:
    while stack and stack[-1] < x:   # not empty, and the top is smaller
        stack.pop()
    stack.append(x)
    print(x, stack)`,
      output: py`
5 [5]
3 [5, 3]
8 [8]
6 [8, 6]`,
    },
    {
      kind: 'quiz',
      q: 'Trace it. What does `stack` hold right after the pass where `x` is `4`?',
      code: py`
stack = []
for x in [6, 2, 1, 4, 9]:
    while stack and stack[-1] < x:
        stack.pop()
    stack.append(x)`,
      options: ['`[6, 2, 1, 4]`', '`[6, 2, 4]`', '`[6, 4]`', '`[4]`'],
      answer: 2,
      explain:
        'After the first three passes the stack is `[6, 2, 1]`: nothing on top was smaller than the number arriving. When `x` is 4, the `while` loop pops 1, then 2, and stops at 6, which is not smaller. Then 4 goes on top: **`[6, 4]`**. `[6, 2, 4]` is what an `if` would give, because it pops only once. On the last pass 9 pops everything; the stack runs empty, and `while stack and ...` stops there instead of crashing.',
    },
    {
      kind: 'type',
      title: 'Keep the prices rising',
      prompt: 'Go through `prices` with `p`. Before `p` goes on the stack, pop every price on top that is **greater** than `p`: loop `while` the stack is not empty and its top, `stack[-1]`, is greater than `p`. Then `append` `p`. Print `stack` after the loop.',
      starter: py`
prices = [4, 7, 2, 9, 6]
stack = []`,
      answer: py`
for p in prices:
    while stack and stack[-1] > p:
        stack.pop()
    stack.append(p)
print(stack)`,
      accept: [
        py`
for p in prices:
    while stack and p < stack[-1]:
        stack.pop()
    stack.append(p)
print(stack)`,
        py`
for p in prices:
    while len(stack) > 0 and stack[-1] > p:
        stack.pop()
    stack.append(p)
print(stack)`,
      ],
      check: 'assert stack == [2, 6]',
      ideas: ['and'],
      hint: 'The `while` line tests `stack` first, then `stack[-1] > p`. `stack.pop()` is inside the `while`; `stack.append(p)` lines up with the `while`, inside the `for`.',
      explain:
        'When 2 arrives it pops 7 and then 4, and the stack is empty. An empty `stack` counts as false, so `and` never reads `stack[-1]`, which would crash on an empty list. Later 6 pops 9, and what is left only ever rises from bottom to top: `[2, 6]`. A stack kept in order like this solves several problems in the Stack unit.',
      output: '[2, 6]',
    },
    {
      kind: 'code',
      title: 'A grid is a list of rows',
      body: 'A 2-D **grid** (LeetCode also says *matrix* or *board*) is a list whose items are lists: one inner list for each row. `grid[r]` is row `r`, so `grid[r][c]` is the cell in row `r`, column `c`. The row comes first, then the column, and both count from 0.',
      code: py`
grid = [
    [1, 0, 1],
    [0, 1, 1],
]
print(grid[0])                          # the first row
print(grid[1][2])                       # row 1, column 2
rows, cols = len(grid), len(grid[0])    # how many rows, how long one row is
print(rows, cols)
grid[0][1] = 9                          # change one cell
print(grid)`,
      output: py`
[1, 0, 1]
1
2 3
[[1, 9, 1], [0, 1, 1]]`,
    },
    {
      kind: 'type',
      title: 'The bottom-right cell',
      prompt: 'Store the number of rows in `rows` and the number of columns in `cols`, in one line. Then use them to print the cell in the last row and the last column.',
      starter: py`
grid = [
    [1, 2, 3],
    [4, 5, 6],
]`,
      answer: py`
rows, cols = len(grid), len(grid[0])
print(grid[rows - 1][cols - 1])`,
      accept: [
        py`
rows = len(grid)
cols = len(grid[0])
print(grid[rows - 1][cols - 1])`,
      ],
      pick: [
        py`
rows, cols = len(grid), len(grid)
print(grid[rows - 1][cols - 1])`,
        py`
rows, cols = len(grid), len(grid[0])
print(grid[rows][cols])`,
        py`
rows, cols = len(grid), len(grid)
print(grid[rows][cols])`,
      ],
      ideas: ['grid index'],
      hint: 'The number of rows is `len(grid)`; the number of columns is the length of one row, `len(grid[0])`. The last index is always one less than the length.',
      explain:
        '`len(grid)` counts the inner lists, so there are 2 rows; `len(grid[0])` is the length of the first row, so 3 columns. `len(grid)` twice would say 2 columns, which is only right for a square grid. Indexes start at 0, so the last row is `rows - 1` and the last column is `cols - 1`: `grid[1][2]` is 6, and `grid[2][3]` is off the grid. `rows, cols = len(grid), len(grid[0])` is the first line of almost every grid solution.',
      output: '6',
    },
    {
      kind: 'code',
      title: 'Visit every cell',
      body: 'Two nested loops visit every cell: the outer one picks a row, and the inner one walks along it. `r` and `c` are the usual names. Almost every grid solution has this pair of loops in it somewhere.',
      code: py`
grid = [
    [1, 0, 1],
    [0, 1, 1],
]
rows, cols = len(grid), len(grid[0])
count = 0
for r in range(rows):              # each row...
    for c in range(cols):          # ...and each column in it
        print(r, c, grid[r][c])
        if grid[r][c] == 1:
            count += 1
print(count)`,
      output: py`
0 0 1
0 1 0
0 2 1
1 0 0
1 1 1
1 2 1
4`,
    },
    {
      kind: 'type',
      title: 'Add up the grid',
      prompt: 'Add every cell of `grid` to `total`: visit each row with `r` and, inside that loop, each column with `c`. Print `total` after the loops.',
      starter: py`
grid = [
    [1, 2, 3],
    [4, 5, 6],
]
rows, cols = len(grid), len(grid[0])
total = 0`,
      answer: py`
for r in range(rows):
    for c in range(cols):
        total += grid[r][c]
print(total)`,
      accept: [
        py`
for r in range(rows):
    for c in range(cols):
        total = total + grid[r][c]
print(total)`,
      ],
      pick: [
        py`
for r in range(rows):
    for c in range(rows):
        total += grid[r][c]
print(total)`,
        py`
for r in range(rows):
    for c in range(cols):
        total += grid[c][r]
print(total)`,
        py`
for r in range(rows):
    for c in range(rows):
        total += grid[c][r]
print(total)`,
      ],
      ideas: ['grid loop'],
      hint: 'Two loops, one inside the other: `for r in range(rows):`, then `for c in range(cols):`. The `+=` line is inside both, and the `print` is back at the left edge.',
      explain:
        'The outer loop picks a row and the inner loop walks along it, so `total += grid[r][c]` runs for all 2 × 3 cells: 21. The inner loop has to count **columns**: with `range(rows)` it stops after two cells and never reaches column 2. And the row index comes first: `grid[c][r]` asks for row 2 as soon as `c` is 2, and there is no such row.',
      output: '21',
    },
    {
      kind: 'type',
      title: 'Stay on the grid',
      prompt: 'Each item of `steps` is a row and a column. Loop over `steps` with `r` and `c`: two names in the `for` unpack each pair, as they did with `enumerate`. Skip a step with `continue` when it is off the grid or its cell holds `0`: join five tests with `or`, in this order: `r < 0`, `c < 0`, `r >= rows`, `c >= cols`, and last `grid[r][c] == 0`. For every other step, print `r`, `c` and the cell.',
      starter: py`
grid = [
    [3, 0, 8],
    [5, 4, 0],
]
rows, cols = len(grid), len(grid[0])
steps = [[0, 0], [0, -1], [1, 1], [2, 1], [0, 1]]`,
      answer: py`
for r, c in steps:
    if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] == 0:
        continue
    print(r, c, grid[r][c])`,
      accept: [
        py`
for r, c in steps:
    if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] == 0:
        continue
    print(r, c, grid[r][c])`,
      ],
      ideas: ['or', 'continue', 'grid index'],
      hint: 'The loop line is `for r, c in steps:`, which unpacks each pair. Then one long `if` with the five tests, `continue` inside it, and the `print` lined up with the `if`.',
      explain:
        'The four range tests come first, so `grid[r][c]` is only read for a step that is on the grid: `or` stops at the first true test. `[2, 1]` is caught by `r >= rows` before `grid[2]` can raise an error, and `[0, -1]` by `c < 0` before `grid[0][-1]` can quietly read the *last* cell of the row. `[0, 1]` is on the grid, but its cell is 0. Many grid solutions open with this very line, to turn back from a cell they should not visit.',
      output: py`
0 0 3
1 1 4`,
    },
    {
      kind: 'code',
      title: 'The four neighbors',
      body: 'Grid problems keep asking about the cells next to a cell: down, up, right, left. Each direction is a pair of changes in parentheses, `(dr, dc)`; such a pair is called a **tuple**, and the loop unpacks it into two names. Add the changes to `r` and `c` to get the neighbor, then check that it is on the grid. `0 <= nr < rows` is two comparisons chained into one: `0 <= nr and nr < rows`.',
      code: py`
grid = [
    [1, 2, 3],
    [4, 5, 6],
]
rows, cols = len(grid), len(grid[0])
r, c = 0, 2                                  # the top-right corner
for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
    nr, nc = r + dr, c + dc                  # the neighbor's row and column
    if 0 <= nr < rows and 0 <= nc < cols:    # is it on the grid?
        print(nr, nc, grid[nr][nc])`,
      output: py`
1 2 6
0 1 2`,
    },
    {
      kind: 'type',
      title: 'The neighbors of a corner',
      prompt: 'Print the value of every neighbor of the cell at `r`, `c` that is on the grid. Loop over the four directions with `dr` and `dc`, store the position of the neighbor in `nr` and `nc`, and print `grid[nr][nc]` only when `nr` and `nc` are both in range.',
      starter: py`
grid = [
    [7, 8, 9],
    [1, 2, 3],
]
rows, cols = len(grid), len(grid[0])
r, c = 1, 0`,
      answer: py`
for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
    nr, nc = r + dr, c + dc
    if 0 <= nr < rows and 0 <= nc < cols:
        print(grid[nr][nc])`,
      pick: [
        py`
for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
    nr, nc = r + dr, c + dc
    if 0 <= nr <= rows and 0 <= nc <= cols:
        print(grid[nr][nc])`,
        py`
for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
    nr, nc = r + dr, c + dc
    if nr < rows and nc < cols:
        print(grid[nr][nc])`,
        py`
for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
    nr, nc = r + dr, c + dc
    if nr <= rows and nc <= cols:
        print(grid[nr][nc])`,
      ],
      ideas: ['neighbors', 'in bounds'],
      hint: 'The four directions are `(1, 0)`, `(-1, 0)`, `(0, 1)` and `(0, -1)`. The check is `0 <= nr < rows and 0 <= nc < cols`.',
      explain:
        'The cell is the bottom-left corner, so two of its four neighbors are off the grid. Row 2 fails `nr < rows`; a `<=` there would let it through, and `grid[2]` raises an `IndexError`. Column -1 fails `0 <= nc`; without that half of the test, `grid[1][-1]` would not crash, it would quietly print the last item of the row. Both halves are needed, for the row and for the column.',
      output: py`
7
2`,
    },
    {
      kind: 'code',
      title: 'A grid of your own',
      body: 'Solutions often need a second grid of the same size: which cells were visited, or a table of answers. `[0] * 3` builds a list of three zeros, and a comprehension stacks one such row for each row (`_` is a loop variable that nobody reads). Never take the shortcut `[[0] * cols] * rows`: it repeats the **same** row, so changing one cell changes its whole column.',
      code: py`
print([0] * 3)

rows, cols = 2, 3
table = [[0] * cols for _ in range(rows)]   # a new row on every pass
table[0][1] = 7
print(table)

bad = [[0] * cols] * rows                   # one row, listed twice
bad[0][1] = 7
print(bad)`,
      output: py`
[0, 0, 0]
[[0, 7, 0], [0, 0, 0]]
[[0, 7, 0], [0, 7, 0]]`,
    },
    {
      kind: 'type',
      title: 'A grid of False',
      prompt: 'Build `seen`, a grid with `rows` rows and `cols` columns that holds `False` everywhere, with a new list for every row. Then set the cell in row `1`, column `2` to `True`, and print `seen`.',
      starter: 'rows, cols = 2, 3',
      answer: py`
seen = [[False] * cols for _ in range(rows)]
seen[1][2] = True
print(seen)`,
      pick: [
        py`
seen = [[False] * cols] * rows
seen[1][2] = True
print(seen)`,
        py`
seen = [[False] * rows for _ in range(cols)]
seen[1][2] = True
print(seen)`,
        py`
seen = [[False] * rows] * cols
seen[1][2] = True
print(seen)`,
      ],
      ideas: ['build grid'],
      hint: 'The shape is `[[False] * cols for _ in range(rows)]`: one row of `cols` values, made again for each of the `rows` rows.',
      explain:
        'The comprehension runs `[False] * cols` once for each row, so the two rows are separate lists and only one cell changes. With `[[False] * cols] * rows`, both rows are the same list, and `True` would show up in both. And the inner list is one **row**, so it is `cols` long: with `rows` and `cols` the other way round, the grid is 3 rows of 2, and column 2 does not exist.',
      output: '[[False, False, False], [False, False, True]]',
    },
    {
      kind: 'type',
      title: 'Mark the neighbors',
      prompt: 'Build `seen`, a grid of `False` with `rows` rows and `cols` columns. Then mark every neighbor of the cell at `r`, `c` that is on the grid: loop over the four directions `(1, 0)`, `(-1, 0)`, `(0, 1)` and `(0, -1)` with `dr` and `dc`, store the neighbor in `nr` and `nc`, and set `seen[nr][nc]` to `True` when both are in range. Print `seen`.',
      starter: py`
rows, cols = 2, 3
r, c = 0, 1`,
      answer: py`
seen = [[False] * cols for _ in range(rows)]
for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
    nr, nc = r + dr, c + dc
    if 0 <= nr < rows and 0 <= nc < cols:
        seen[nr][nc] = True
print(seen)`,
      check: 'assert seen == [[True, False, True], [False, True, False]]',
      ideas: ['neighbors', 'in bounds', 'build grid'],
      hint: 'Start with `seen = [[False] * cols for _ in range(rows)]`. The loop is the four-neighbors loop from before, with `seen[nr][nc] = True` in place of the `print`.',
      explain:
        'The cell `(0, 1)` is in the top row, so the neighbor above it is off the grid and is skipped; the other three are marked. Because the comprehension made a new row on each pass, marking `seen[1][1]` leaves row 0 alone. A grid of `False` that fills up with `True` is how grid solutions remember which cells they have already visited.',
      output: '[[True, False, True], [False, True, False]]',
    },
    {
      kind: 'type',
      title: 'Count the pairs',
      prompt: `Count the cells of \`grid\` that hold \`1\` and have another \`1\` directly to their right. Store the answer in \`count\` and print it.

The cell to the right of row \`r\`, column \`c\` is \`grid[r][c + 1]\`. The last column has no cell to its right, so make sure \`c + 1\` is still a column before you read it.`,
      starter: py`
grid = [
    [1, 1, 0, 1],
    [0, 1, 1, 1],
    [1, 0, 0, 1],
]`,
      answer: py`
rows, cols = len(grid), len(grid[0])
count = 0
for r in range(rows):
    for c in range(cols):
        if grid[r][c] == 1 and c + 1 < cols and grid[r][c + 1] == 1:
            count += 1
print(count)`,
      accept: [
        py`
rows, cols = len(grid), len(grid[0])
count = 0
for r in range(rows):
    for c in range(cols - 1):
        if grid[r][c] == 1 and grid[r][c + 1] == 1:
            count += 1
print(count)`,
      ],
      check: 'assert count == 3',
      ideas: ['grid loop', 'and'],
      hint: 'Start with `rows, cols` and `count = 0`, then the two loops. One `if` with three tests joined by `and`: the cell is 1, `c + 1 < cols`, and the cell to the right is 1.',
      explain:
        'The loops visit all 12 cells. For each one, `and` checks three things in order: the cell is 1, there *is* a column to its right, and that neighbor is 1. The middle test is the guard: in the last column `c + 1 < cols` is false, so `grid[r][c + 1]` is never read and nothing crashes. Three cells pass. A grid loop, a guarded condition and a counter: that is the skeleton of most grid solutions.',
      output: '3',
    },
  ],
};

// ── After A Tour of Data Structures ────────────────────────────────────────
// The small pieces of Python the 150 solutions use, often on their key lines.
const PYTHON_IDIOMS: Lesson = {
  id: 'python-idioms',
  title: 'Python You Will Meet',
  icon: '🔩',
  blurb: 'The small idioms solutions rely on: one-line if/else, infinity, key=, copies, heaps of tuples, @cache and bit operators.',
  minutes: 62,
  slides: [
    {
      kind: 'text',
      title: 'The small pieces',
      body: `You know the big pieces now: loops, lists, dicts, functions, classes, recursion. Real solutions also use a couple of dozen **small idioms**: a one-line \`if\`, a starting value of infinity, a sort with a \`key\`, a copy of a list.

None of them is hard, but each is a line you will have to write yourself, and often it is the most important line of a solution. This lesson goes through them a few at a time, and you write most of them.`,
    },
    {
      kind: 'code',
      title: 'A one-line if/else',
      body: 'A **conditional expression** picks one of two values: `a if condition else b` is `a` when the condition is true, and `b` when it is not. The whole thing is a value, so it can go anywhere a value can: after `=`, after `return`, inside a call.',
      code: py`
x = -7
sign = -1 if x < 0 else 1
print(sign)

def first_or_zero(nums):
    return nums[0] if nums else 0      # 0 when the list is empty

print(first_or_zero([4, 9]), first_or_zero([]))`,
      output: py`
-1
4 0`,
    },
    {
      kind: 'type',
      title: 'Even or odd, in one line',
      prompt: 'Store `"even"` in `kind` when `n` is even and `"odd"` when it is not, with a one-line `if`/`else`. Then print `kind`.',
      starter: 'n = 7',
      answer: py`
kind = "even" if n % 2 == 0 else "odd"
print(kind)`,
      accept: [
        py`
kind = "odd" if n % 2 == 1 else "even"
print(kind)`,
        py`
kind = "odd" if n % 2 != 0 else "even"
print(kind)`,
      ],
      pick: [
        py`
kind = if n % 2 == 0 "even" else "odd"
print(kind)`,
        py`
kind = "odd" if n % 2 == 0 else "even"
print(kind)`,
        py`
kind = if n % 2 == 0 "odd" else "even"
print(kind)`,
      ],
      ideas: ['conditional expression'],
      hint: 'The shape is `value_if_true if test else value_if_false`, all on the right of the `=`.',
      explain:
        'The value for *true* comes first, then `if` and the test, then `else` and the other value. 7 is not even, so `kind` is `"odd"`. Starting with `if`, the way an `if` statement starts, is a syntax error here, and with the two values the other way round every number gets the wrong label. Solutions use this for small choices, like `sign = -1 if x < 0 else 1`.',
      output: 'odd',
    },
    {
      kind: 'code',
      title: 'not in, is None, and a value from or',
      body: '`not in` is the opposite of `in`. `is None` and `is not None` are the exact way to ask about `None` (a plain `if node:` also treats `0` and `[]` as missing). And `or` does more than give `True` or `False`: `a or b` gives `a` when `a` counts as true, and `b` otherwise.',
      code: py`
seen = {3, 5}
print(4 not in seen)

node = None
print(node is None, node is not None)

print(0 or 5)              # 0 counts as false, so the answer is 5
print([1, 2] or [9])       # the first list is not empty: it wins
name = ""
print(name or "anonymous")`,
      output: py`
True
True False
5
[1, 2]
anonymous`,
    },
    {
      kind: 'quiz',
      q: 'What does this print?',
      code: py`
def rest(a, b):
    return a or b

print(rest([], [4, 5]), rest([7], [4, 5]), rest([], []))`,
      options: ['`True True False`', '`[4, 5] [7, 4, 5] []`', '`[4, 5] [7] []`', '`[] [7] []`'],
      answer: 2,
      explain:
        '`a or b` gives `a` when it counts as true and `b` otherwise; it never joins the two, and it does not turn them into `True` or `False`. An empty list counts as false, so the first call returns `b`, the second returns `a`, and the third returns `b`, which is empty too. Merging two linked lists ends with exactly this: `tail.next = list1 or list2` attaches whichever list still has nodes.',
    },
    {
      kind: 'code',
      title: 'max, min, sum, abs and infinity',
      body: '`max`, `min` and `sum` take a whole list (`max` and `min` also take a few separate values), and `abs` gives the distance from zero. To find a smallest value in a loop, start the running best at `float("inf")`, **infinity**: it is larger than every number, so the first real value always replaces it. `float("-inf")` is the start for a running maximum.',
      code: py`
nums = [4, -9, 2]
print(max(nums), min(nums), sum(nums))
print(max(3, 8, 5), abs(-9), abs(4 - 9))

best = float("inf")              # larger than any number
for n in nums:
    best = min(best, abs(n))     # keep the smaller of the two
print(best)
print(float("-inf") < -1000000)`,
      output: py`
4 -9 -3
8 9 5
2
True`,
    },
    {
      kind: 'type',
      title: 'The smallest number over the limit',
      prompt: 'Find the smallest number in `nums` that is greater than `limit`. Start `best` at infinity, loop over `nums` with `n`, and whenever `n` is greater than `limit`, keep the `min` of `best` and `n` in `best`. Print `best` after the loop.',
      starter: py`
nums = [12, 40, 7, 25]
limit = 10`,
      answer: py`
best = float("inf")
for n in nums:
    if n > limit:
        best = min(best, n)
print(best)`,
      accept: [
        py`
best = float("inf")
for n in nums:
    if n > limit:
        best = min(n, best)
print(best)`,
      ],
      pick: [
        py`
best = 0
for n in nums:
    if n > limit:
        best = min(best, n)
print(best)`,
        py`
best = float("-inf")
for n in nums:
    if n > limit:
        best = min(best, n)
print(best)`,
        py`
best = "inf"
for n in nums:
    if n > limit:
        best = min(best, n)
print(best)`,
      ],
      ideas: ['float inf'],
      hint: 'Infinity is written `float("inf")`: the text `"inf"` in quotes, inside `float(...)`.',
      explain:
        'A running minimum has to start above every value it may meet, and `float("inf")` is above them all, so the first number over the limit replaces it. A start of `0` would never be replaced, because `min(0, n)` stays 0. `float("-inf")` is the start for a running *maximum*, and `"inf"` on its own is just text, which `min` cannot compare with a number. If nothing passes the test, `best` is still infinity afterward, which tells you there was no answer.',
      output: '12',
    },
    {
      kind: 'type',
      title: 'The closest number',
      prompt: 'Finish `closest(nums, target)`: it returns the smallest distance between `target` and a number in `nums`, or `-1` when `nums` is empty. Start `best` at infinity. Loop with `n`, keeping in `best` the `min` of `best` and the distance `abs(n - target)`. Return with a one-line `if`/`else`: `-1` if `best` is still `float("inf")`, else `best`.',
      starter: 'def closest(nums, target):',
      answer: py`
    best = float("inf")
    for n in nums:
        best = min(best, abs(n - target))
    return -1 if best == float("inf") else best`,
      accept: [
        py`
    best = float("inf")
    for n in nums:
        best = min(best, abs(target - n))
    return -1 if best == float("inf") else best`,
        py`
    best = float("inf")
    for n in nums:
        best = min(abs(n - target), best)
    return -1 if best == float("inf") else best`,
      ],
      check: py`
assert closest([4, 9, 15], 10) == 1
assert closest([-3, 8], 2) == 5
assert closest([], 7) == -1`,
      ideas: ['conditional expression', 'float inf'],
      hint: 'Four lines inside the function: `best = float("inf")`, the loop, the `min` line inside it, and `return -1 if best == float("inf") else best` after the loop.',
      explain:
        '`abs(n - target)` is how far `n` is from `target`, whichever side it is on. `best` starts at infinity, so the first distance replaces it, and each later one only if it is smaller. With an empty list the loop never runs and `best` is still infinity, so the last line returns `-1` instead. Start at infinity, loop with `min`, then turn *still infinity* into *no answer*: several solutions end this way.',
    },
    {
      kind: 'code',
      title: 'Comprehensions for dicts and sets',
      body: 'The comprehension you know builds a list. Change the brackets and it builds something else: `{key: value for ...}` makes a dict, and `{value for ...}` makes a set.',
      code: py`
words = ["fig", "kiwi", "plum"]
lengths = {w: len(w) for w in words}      # a dict: word -> length
print(lengths)
print(lengths["kiwi"])
print({len(w) for w in words})            # a set: 4 is kept once`,
      output: py`
{'fig': 3, 'kiwi': 4, 'plum': 4}
4
{3, 4}`,
    },
    {
      kind: 'code',
      title: 'Comprehensions with no brackets',
      body: 'Inside a call like `sum(...)`, a comprehension needs no brackets of its own. It is then a **generator expression**: the values are handed over one at a time, and no list is built. `any(...)` asks whether at least one value is true, and `all(...)` whether every one is.',
      code: py`
words = ["fig", "kiwi", "plum"]
print(sum(len(w) for w in words))             # add up the lengths
print(sum(1 for w in words if len(w) > 3))    # count the ones that pass a test
print(max(len(w) for w in words))             # the longest length
print(any(len(w) > 4 for w in words))         # is at least one that long?
print(all(len(w) > 2 for w in words))         # is every one that long?`,
      output: py`
11
2
4
False
True`,
    },
    {
      kind: 'type',
      title: 'Where is each name?',
      prompt: 'Build a dict `where` that maps each name in `names` to its index, with a dict comprehension over `enumerate(names)` that uses `i` and `name`. Then print two things with one `print`: `where["cy"]`, and the total length of all the names, with `sum(...)` over `len(name)`.',
      starter: 'names = ["ann", "bo", "cy"]',
      answer: py`
where = {name: i for i, name in enumerate(names)}
print(where["cy"], sum(len(name) for name in names))`,
      pick: [
        py`
where = {i: name for i, name in enumerate(names)}
print(where["cy"], sum(len(name) for name in names))`,
        py`
where = {name: i for i, name in enumerate(names)}
print(where["cy"], sum(len(names)))`,
        py`
where = {i: name for i, name in enumerate(names)}
print(where["cy"], sum(len(names)))`,
      ],
      ideas: ['dict comprehension', 'generator expression'],
      hint: 'The dict comprehension is `{name: i for i, name in enumerate(names)}`: the key, a colon, the value, then the `for` part. Inside `sum(...)`, write `len(name) for name in names`.',
      explain:
        'A dict comprehension has `key: value` before the `for`. Here each name is the key and its index is the value, so `where["cy"]` is 2; the other way round, the keys would be 0, 1 and 2, and there would be no key `"cy"`. Inside `sum(...)`, the generator expression hands over `len(name)` for each name: 3 + 2 + 2. It needs its `for` part: `len(names)` is a single number, and `sum` cannot loop over that. A value-to-index dict like `where` turns a slow search into an instant lookup.',
      output: '2 7',
    },
    {
      kind: 'code',
      title: 'lambda: a key function written in place',
      body: 'You met `key=` in `sorted(words, key=len)`: it takes a function that turns each item into the value to sort by. When no ready-made function fits, `lambda` writes a tiny one on the spot: `lambda x: x[0]` takes `x` and returns `x[0]`. In interview code you will see `lambda` almost only after `key=`. `max` and `min` take a `key` as well.',
      code: py`
intervals = [[5, 8], [1, 9], [3, 4]]
intervals.sort(key=lambda x: x[0])      # sort by the first number
print(intervals)
intervals.sort(key=lambda x: x[1])      # sort by the second number
print(intervals)
print(max(intervals, key=lambda x: x[1] - x[0]))   # the longest one
words = ["pear", "fig", "banana"]
print(max(words, key=len))              # a ready-made function needs no lambda`,
      output: py`
[[1, 9], [3, 4], [5, 8]]
[[3, 4], [5, 8], [1, 9]]
[1, 9]
banana`,
    },
    {
      kind: 'type',
      title: 'Sort meetings by end time',
      prompt: 'Each meeting is a `[start, end]` pair. Sort `meetings` in place by **end** time, the second number of each pair, with a `lambda` as the `key`. Then print `meetings`.',
      starter: 'meetings = [[9, 10], [7, 12], [8, 9]]',
      answer: py`
meetings.sort(key=lambda m: m[1])
print(meetings)`,
      pick: [
        py`
meetings.sort(key=m[1])
print(meetings)`,
        py`
meetings.sort(key=lambda m: m[0])
print(meetings)`,
        py`
meetings.sort(key=m[0])
print(meetings)`,
      ],
      ideas: ['lambda key'],
      hint: 'Inside the parentheses of `.sort(...)`: `key=`, then `lambda m:`, then what to sort by, `m[1]`.',
      explain:
        '`lambda m: m[1]` is a tiny function: give it a meeting and it returns the end time, and `sort` orders the meetings by that. Without `lambda`, `key=m[1]` is not a function, only a lookup in a variable `m` that does not exist. `m[0]` would sort by start time, which a plain `meetings.sort()` already does with pairs. Interval problems start by sorting like this.',
      output: '[[8, 9], [9, 10], [7, 12]]',
    },
    {
      kind: 'type',
      title: 'The longest word, with its length',
      prompt: 'Build a dict `size` that maps each word of `words` to its length, with a dict comprehension over `w`. Then store in `longest` the key with the largest value: call `max` on `size` with `key=lambda w: size[w]`. Print `longest` and `size[longest]`.',
      starter: 'words = ["kiwi", "banana", "fig"]',
      answer: py`
size = {w: len(w) for w in words}
longest = max(size, key=lambda w: size[w])
print(longest, size[longest])`,
      check: py`
assert size == {"kiwi": 4, "banana": 6, "fig": 3}
assert longest == "banana"`,
      ideas: ['dict comprehension', 'lambda key'],
      hint: 'Line one: `{w: len(w) for w in words}`. Line two: `max(size, key=lambda w: size[w])`, which goes through the keys and compares them by their values.',
      explain:
        '`max(size, ...)` goes through the keys of the dict, and the `key` function tells it to compare them by their value, `size[w]`, instead of alphabetically. Without `key`, `max` would return `"kiwi"`, the last word in alphabetical order. The same line finds the most common item in a dict of counts.',
      output: 'banana 6',
    },
    {
      kind: 'code',
      title: 'Copy a list before you store it',
      body: 'You saw that `b = a` gives one list two names. Appending a list to another list does the same: it stores **the list itself**, not a snapshot. Change it later and the stored one changes too. To keep a snapshot, append a copy: `path[:]` (a slice of everything) or `list(path)`.',
      code: py`
path = [1]
res = []
res.append(path)         # the list itself
res.append(path[:])      # a copy of it, as it is now
path.append(2)
print(res)

rows = []
row = []
for x in [1, 2, 3]:
    row.append(x)
    rows.append(row)     # the same list, three times
print(rows)`,
      output: py`
[[1, 2], [1]]
[[1, 2, 3], [1, 2, 3], [1, 2, 3]]`,
    },
    {
      kind: 'type',
      title: 'Save every step',
      prompt: 'Go through `nums` with `n`. When `n` is `not in` `path`, append it to `path`, then append a **copy** of `path` to `res`, so that each saved step stays as it was. Print `res` after the loop.',
      starter: py`
nums = [3, 1, 3, 2]
path = []
res = []`,
      answer: py`
for n in nums:
    if n not in path:
        path.append(n)
        res.append(path[:])
print(res)`,
      accept: [
        py`
for n in nums:
    if n not in path:
        path.append(n)
        res.append(list(path))
print(res)`,
        py`
for n in nums:
    if n not in path:
        path.append(n)
        res.append(path.copy())
print(res)`,
      ],
      check: py`
assert res == [[3], [3, 1], [3, 1, 2]]
assert path == [3, 1, 2]`,
      hint: 'The test is `if n not in path:`. Both appends go inside it, and the second one stores `path[:]`, not `path`.',
      explain:
        'Each `path[:]` is a new list holding what `path` holds at that moment, so the three saved steps stay different. With `res.append(path)`, `res` would hold the same list three times, and all three would show its final contents, `[3, 1, 2]`. The second 3 is skipped by `not in`. Backtracking solutions save every answer they find with exactly this line.',
      output: '[[3], [3, 1], [3, 1, 2]]',
    },
    {
      kind: 'code',
      title: 'Tuples in a heap, and heapify',
      body: 'A heap can hold tuples. Python compares them by their **first** item (then the second, on a tie), so put the number you want smallest first. `heapq.heapify(items)` turns a whole list into a heap in place, in one O(n) step. And since `heapq` only has a min-heap, store `-x` to get the largest first.',
      code: py`
import heapq

h = []
heapq.heappush(h, (5, "pay rent"))
heapq.heappush(h, (1, "wake up"))
heapq.heappush(h, (3, "eat"))
cost, task = heapq.heappop(h)       # the smallest first item wins
print(cost, task)

nums = [4, 9, 2, 7]
heapq.heapify(nums)                 # the list is now a heap
print(heapq.heappop(nums))
big = [-x for x in [4, 9, 2, 7]]    # negated: a max-heap
heapq.heapify(big)
print(-heapq.heappop(big))`,
      output: py`
1 wake up
2
9`,
    },
    {
      kind: 'type',
      title: 'The nearest stop',
      prompt: 'Each stop is a `(distance, name)` tuple. Turn `stops` into a heap, pop the nearest stop into `dist` and `name`, and print them.',
      starter: py`
import heapq

stops = [(7, "park"), (2, "cafe"), (5, "gym")]`,
      answer: py`
heapq.heapify(stops)
dist, name = heapq.heappop(stops)
print(dist, name)`,
      pick: [
        py`
stops = heapq.heapify(stops)
dist, name = heapq.heappop(stops)
print(dist, name)`,
        py`
heapq.heapify(stops)
name, dist = heapq.heappop(stops)
print(dist, name)`,
        py`
stops = heapq.heapify(stops)
name, dist = heapq.heappop(stops)
print(dist, name)`,
      ],
      ideas: ['heap of tuples', 'heapify'],
      hint: '`heapq.heapify(stops)` goes on a line of its own. The pop hands back one tuple, which `dist, name = ...` unpacks.',
      explain:
        '`heapify` rearranges the list in place and returns `None`, like `.sort()`, so what it returns must not be stored back in `stops`. Tuples are compared by their first item, the distance, so the pop gives `(2, "cafe")`, and `dist, name` unpacks it in that order. Shortest-path solutions keep `(distance, node)` tuples in a heap just like this.',
      output: '2 cafe',
    },
    {
      kind: 'type',
      title: 'The farthest stop',
      prompt: 'This time each stop is a `(name, distance)` pair, and you want the **farthest** one. Build a list `h` of `(-dist, name)` tuples with a comprehension over `name, dist`, turn it into a heap, and pop into `neg` and `name`. Print `name` and the real distance, `-neg`.',
      starter: py`
import heapq

stops = [("park", 7), ("cafe", 2), ("gym", 5)]`,
      answer: py`
h = [(-dist, name) for name, dist in stops]
heapq.heapify(h)
neg, name = heapq.heappop(h)
print(name, -neg)`,
      check: py`
assert name == "park" and neg == -7
assert len(h) == 2  # one stop should have been popped off the heap`,
      ideas: ['heap of tuples', 'heapify'],
      hint: 'The comprehension is `[(-dist, name) for name, dist in stops]`. Then `heapq.heapify(h)` on its own line, and `neg, name = heapq.heappop(h)`.',
      explain:
        'A min-heap pops the smallest first item, and the smallest of -7, -2 and -5 is -7: negating the distances turns *smallest first* into *largest first*. The distance has to be the first item of each tuple, because that is what the heap compares. Flip the sign back when you use the value.',
      output: 'park 7',
    },
    {
      kind: 'code',
      title: '@cache: memoization in one line',
      body: 'In the recursion lesson, `fib` became fast by storing each answer in a `memo` dict. `@cache`, from the module `functools`, does that for you: put it on the line above `def`, and Python remembers the result for every set of arguments it has seen. The body stays the plain recursive version. The arguments must be values a dict key could be: numbers, strings and tuples, but not lists.',
      code: py`
from functools import cache

@cache
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)    # each n is worked out only once

print(fib(50))`,
      output: '12586269025',
    },
    {
      kind: 'type',
      title: 'Cache the stairs',
      prompt: '`ways(n)` counts the ways to climb `n` stairs taking 1 or 2 steps at a time: 1 way when `n` is `0` or `1`, otherwise the ways to reach the two stairs below, added together. Define it with `@cache`, then print `ways(40)`.',
      starter: 'from functools import cache',
      answer: py`
@cache
def ways(n):
    if n <= 1:
        return 1
    return ways(n - 1) + ways(n - 2)

print(ways(40))`,
      pick: [
        py`
cache
def ways(n):
    if n <= 1:
        return 1
    return ways(n - 1) + ways(n - 2)

print(ways(40))`,
        py`
def ways(n):
    @cache
    if n <= 1:
        return 1
    return ways(n - 1) + ways(n - 2)

print(ways(40))`,
        py`
def ways(n):
    cache
    if n <= 1:
        return 1
    return ways(n - 1) + ways(n - 2)

print(ways(40))`,
      ],
      ideas: ['@cache'],
      hint: '`@cache` goes on its own line, directly above `def ways(n):`, with no indentation.',
      explain:
        '`@cache` sits on its own line directly above `def`, at the same indentation. With it, each `ways(n)` is worked out once and then looked up, so `ways(40)` needs only 41 results. Without the `@`, the line does nothing at all, and the plain recursion makes over 300 million calls. Inside the function, `@cache` is a syntax error. Top-down dynamic programming is exactly this: write the recursion, then add `@cache`.',
      output: '165580141',
    },
    {
      kind: 'code',
      title: 'Characters as numbers',
      body: 'Every character has a number, and `ord(c)` gives it. The lowercase letters are numbered in a row, so `ord(c) - ord("a")` turns `"a"` to `"z"` into 0 to 25: an index into a list of 26 counters. `c.isalnum()` is `True` for a letter or a digit, and `c.lower()` gives the lowercase version of a letter.',
      code: py`
print(ord("a"), ord("b"), ord("z"))
print(ord("c") - ord("a"))              # c is letter number 2

count = [0] * 26                        # one counter per letter
for c in "banana":
    count[ord(c) - ord("a")] += 1
print(count[0], count[1], count[13])    # a, b, n

print("x".isalnum(), "7".isalnum(), "!".isalnum(), " ".isalnum())
print("A".lower(), "".join(["h", "i"]))`,
      output: py`
97 98 122
2
3 1 2
True True False False
a hi`,
    },
    {
      kind: 'type',
      title: 'Letter positions',
      prompt: 'Loop over `word` with `c`. For every character that is a letter or a digit, print it together with its position in the alphabet, counting `"a"` as 0.',
      starter: 'word = "a-c!e"',
      answer: py`
for c in word:
    if c.isalnum():
        print(c, ord(c) - ord("a"))`,
      pick: [
        py`
for c in word:
    if c.isalnum:
        print(c, ord(c) - ord("a"))`,
        py`
for c in word:
    if c.isalnum():
        print(c, ord("c") - ord("a"))`,
        py`
for c in word:
    if c.isalnum:
        print(c, ord("c") - ord("a"))`,
      ],
      ideas: ['ord', 'isalnum'],
      hint: 'The test is `c.isalnum()`, with its parentheses. The position is `ord(c) - ord("a")`: `c` is a variable, `"a"` is the letter.',
      explain:
        '`c.isalnum()` needs its parentheses to run. Without them the `if` looks at the method itself, which always counts as true, so nothing is skipped. `ord(c)` uses the variable `c`; `ord("c")` in quotes is always the letter c. Subtracting `ord("a")` shifts the numbers so that `a` is 0, `c` is 2 and `e` is 4.',
      output: py`
a 0
c 2
e 4`,
    },
    {
      kind: 'type',
      title: 'Clean, then count',
      prompt: 'First clean `text`: build `clean` by joining, with `"".join(...)`, the lowercase version of every character `c` of `text` that passes `c.isalnum()`. Then make `count`, a list of 26 zeros, and loop over `clean` with `c`, adding 1 to `count[ord(c) - ord("a")]`. Print `clean` and `count[0]`.',
      starter: 'text = "A man, a plan"',
      answer: py`
clean = "".join(c.lower() for c in text if c.isalnum())
count = [0] * 26
for c in clean:
    count[ord(c) - ord("a")] += 1
print(clean, count[0])`,
      accept: [
        py`
clean = "".join([c.lower() for c in text if c.isalnum()])
count = [0] * 26
for c in clean:
    count[ord(c) - ord("a")] += 1
print(clean, count[0])`,
      ],
      check: py`
assert clean == "amanaplan"
assert len(count) == 26 and sum(count) == 9
assert count[0] == 4 and count[13] == 2`,
      ideas: ['ord', 'isalnum', 'generator expression'],
      hint: 'Inside `"".join(...)`, write `c.lower() for c in text if c.isalnum()`. A list of 26 zeros is `[0] * 26`.',
      explain:
        'The generator expression inside `join` keeps only the letters and digits and lowercases each one, so `clean` is `amanaplan`: *Valid Palindrome* prepares its text this way. Then every letter adds 1 at its own index, 0 for `a` up to 25 for `z`, and `a` appears 4 times. The index only makes sense for lowercase letters, which is why problems promise *lowercase English letters*.',
      output: 'amanaplan 4',
    },
    {
      kind: 'code',
      title: 'Backward loops, endless loops, rounding up',
      body: 'Three small ones. `range(n - 1, -1, -1)` walks the indexes from the last one down to 0; the stop is `-1` because the stop is never included. `while True:` has no test of its own: it runs until a `break` (or a `return`). And `math.ceil(x)`, from the module `math`, rounds **up**; with whole numbers, `(a + b - 1) // b` does the same job without leaving integers.',
      code: py`
import math

nums = [4, 8, 15]
for i in range(len(nums) - 1, -1, -1):     # 2, 1, 0
    print(i, nums[i])

n = 37
while True:                  # runs until the break
    if n % 2 == 0:
        break
    n += 3
print(n)

print(math.ceil(7 / 2), (7 + 2 - 1) // 2)   # 7 items, 2 per box: 4 boxes`,
      output: py`
2 15
1 8
0 4
40
4 4`,
    },
    {
      kind: 'type',
      title: 'The last even number',
      prompt: 'Find the **last** even number in `nums` by walking the indexes backward: loop `i` from the last index down to `0` with `range(len(nums) - 1, -1, -1)`. At the first even `nums[i]`, print `i` and `nums[i]`, then `break`.',
      starter: 'nums = [4, 7, 10, 3, 5]',
      answer: py`
for i in range(len(nums) - 1, -1, -1):
    if nums[i] % 2 == 0:
        print(i, nums[i])
        break`,
      check: 'assert i == 2  # the loop should stop at index 2',
      hint: 'The loop line is `for i in range(len(nums) - 1, -1, -1):`. The `print` and the `break` both go inside the `if`.',
      explain:
        'The loop visits the indexes 4, 3 and 2. Index 2 holds 10, the first even number met from the back, so it is printed and `break` ends the search. The stop value `-1` is what lets `i` reach 0: `range(len(nums) - 1, 0, -1)` would never look at the first item. Many dynamic-programming solutions fill their table from the back with this loop.',
      output: '2 10',
    },
    {
      kind: 'code',
      title: 'Bit operators',
      body: 'Inside the computer a whole number is a row of **bits**, 0s and 1s: 6 is `110` and 3 is `011`. Five operators work on those bits directly. `&` keeps a 1 where **both** numbers have one, `|` where **either** has one, and `^` (XOR) where they **differ**. `<<` and `>>` slide the bits left or right. The Bit Manipulation unit teaches the tricks; for now, learn to read the symbols.',
      code: py`
print(6 & 3)          # 110 & 011 = 010
print(6 | 3)          # 110 | 011 = 111
print(6 ^ 3)          # 110 ^ 011 = 101
print(1 << 3)         # 1 becomes 1000: each step to the left doubles
print(6 >> 1)         # 110 becomes 11: each step to the right halves
print(6 & 1, 7 & 1)   # the last bit: 0 for an even number, 1 for an odd one
print(5 ^ 5, 5 ^ 0)   # a number XOR itself is 0; XOR 0 changes nothing`,
      output: py`
2
7
5
8
3
0 1
0 5`,
    },
    {
      kind: 'quiz',
      q: 'What does this print?',
      code: py`
x = 0
for n in [4, 7, 4]:
    x = x ^ n
print(x, 12 & 1, 1 << 4)`,
      options: ['`7 0 16`', '`15 0 16`', '`7 1 8`', '`0 0 16`'],
      answer: 0,
      explain:
        'XOR-ing the same number twice cancels it out, in any order: the two 4s vanish and only **7** is left. That is the whole idea behind *Single Number*. 12 is even, so its last bit, `12 & 1`, is 0. And `1 << 4` slides the single 1 four places to the left, doubling four times: 16.',
    },
    {
      kind: 'type',
      title: 'Count the routes',
      prompt: `A robot stands in the top-left cell of a grid and can only step right or down. Write \`paths(r, c)\`: the number of different routes to the cell \`r\` rows down and \`c\` columns across.

There is 1 route when \`r\` or \`c\` is \`0\` (a straight line). Otherwise, add the routes to the cell above, \`paths(r - 1, c)\`, and the routes to the cell on the left, \`paths(r, c - 1)\`. Put \`@cache\` on it: without it, \`paths(14, 14)\` would take about 80 million calls.`,
      starter: 'from functools import cache',
      answer: py`
@cache
def paths(r, c):
    if r == 0 or c == 0:
        return 1
    return paths(r - 1, c) + paths(r, c - 1)`,
      accept: [
        py`
@cache
def paths(r, c):
    if r == 0 or c == 0:
        return 1
    return paths(r, c - 1) + paths(r - 1, c)`,
        py`
@cache
def paths(r, c):
    if c == 0 or r == 0:
        return 1
    return paths(r - 1, c) + paths(r, c - 1)`,
      ],
      check: py`
assert paths(0, 5) == 1
assert paths(2, 2) == 6
assert hasattr(paths, "cache_info")  # is @cache on the line above def?
assert paths(14, 14) == 40116600`,
      ideas: ['@cache'],
      hint: '`@cache` on its own line, then `def paths(r, c):`. The base case is `if r == 0 or c == 0:`, and the last line adds two recursive calls.',
      explain:
        'Every route into a cell arrives from the cell above or from the cell on the left, so the two counts add up; along the top row and the left column there is only one way to go. Plain recursion would work out the same cells millions of times. `@cache` stores the answer for each `(r, c)` the first time, so only a couple of hundred cells are ever worked out. This is *Unique Paths*, and top-down dynamic programming on a grid always has this shape: a recursive function of two numbers with `@cache` on top.',
    },
  ],
};

export const EXTRA_LESSONS: { after: string; lesson: Lesson }[] = [
  { after: 'lists-and-strings', lesson: GRIDS_AND_POINTERS },
  { after: 'data-structures-tour', lesson: PYTHON_IDIOMS },
];
