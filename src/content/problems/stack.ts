import { py, type CategoryContent } from '../types';

const content: CategoryContent = {
  guide: {
    category: 'stack',
    summary: `A **stack** is a pile where you only ever touch the **top**. *Push* puts something on top; *pop* takes the top thing off. The last thing in is the first thing out (**LIFO**).

In Python a plain list is a perfect stack: \`stack.append(x)\` pushes, \`stack.pop()\` pops, and \`stack[-1]\` peeks at the top. All three are **O(1)**.

Reach for a stack whenever the **most recent unfinished thing** matters: the last opening bracket that still needs closing, the last two numbers waiting for an operator, the last choice you might need to undo.

A powerful variation is the **monotonic stack**: keep the items in sorted order (for example, decreasing from bottom to top). When a new item breaks that order, pop the items it beats — the new item is *their* answer ("next warmer day", "next shorter bar"). Every item is pushed once and popped at most once, so the whole thing is **O(n)**.`,
    analogy:
      'A stack is a pile of plates in a cafeteria. Clean plates go on top, and you always take the top one. To reach a plate further down, everything above it has to come off first.',
    whenToUse: [
      'Pairs that must **nest** correctly — brackets, tags, start/end markers',
      'Evaluating expressions or undoing actions, where the **most recent** item is handled first',
      '"Next greater / next smaller element" or "how many days until warmer" → **monotonic stack**',
      'You need the min (or max) of a changing pile at every moment → store extra info with each item',
      'Building something step by step and backing up when a choice fails (backtracking)',
    ],
    template: py`
# Plain stack: check that brackets nest correctly
def balanced(s):
    stack = []
    for ch in s:
        if ch == "(":
            stack.append(ch)           # push: wait for a partner
        elif not stack:
            return False               # a ")" with nothing to close
        else:
            stack.pop()                # pop: the most recent "(" is matched
    return not stack

# Monotonic stack: for each item, find the next bigger item to its right
def next_greater(nums):
    res = [-1] * len(nums)
    stack = []                         # indices still waiting; their values decrease
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            res[stack.pop()] = x       # x answers every smaller item on top
        stack.append(i)
    return res`,
    templateNotes: [
      '`append(x)`, `pop()` and `stack[-1]` are all O(1) on a Python list. Never use `pop(0)` or `insert(0, x)` for a stack: those are O(n).',
      'Check that the stack is not empty (`if stack`, `while stack and ...`) before peeking or popping. Popping an empty list raises an error.',
      'In a monotonic stack, store **indices** rather than values when the answer needs distances or positions.',
      'Every index is pushed once and popped at most once, so the nested `while` loop still adds up to O(n) in total.',
    ],
    complexity: 'Usually O(n) time and O(n) space for the stack.',
    quiz: [
      {
        q: 'Starting with an empty stack you do: push 1, push 2, pop, push 3. What is on top now?',
        options: ['1', '2', '3', 'Nothing, the stack is empty'],
        answer: 2,
        explain: 'The pop removes 2 (the most recent push), leaving [1]. Then 3 goes on top: [1, 3].',
      },
      {
        q: 'Which pair of Python list operations gives an O(1) push and an O(1) pop?',
        options: ['`insert(0, x)` and `pop(0)`', '`append(x)` and `pop()`', '`append(x)` and `pop(0)`', '`add(x)` and `remove(x)`'],
        answer: 1,
        explain: 'Working at the end of a list is O(1). Working at the front shifts every other element, which is O(n).',
      },
      {
        q: 'While checking brackets, you read `]` and the top of the stack is `(`. What does that mean?',
        options: ['Push `]` and keep going', 'Pop the `(` and keep going', 'The string is invalid', 'Skip the character'],
        answer: 2,
        explain: 'A closing bracket must match the most recent unmatched opener. `(` is still open, so `]` closes the wrong thing.',
      },
      {
        q: 'You keep a stack of days that have not seen a warmer day yet. Today is warmer than the day on top. What do you do?',
        options: [
          'Push today and move on',
          'Clear the whole stack',
          'Pop only if the stack has more than one item',
          'Pop the top day, record today as its answer, and keep checking the new top',
        ],
        answer: 3,
        explain:
          'Today answers every colder day sitting on top, so keep popping until the top is at least as warm. Then push today.',
      },
    ],
  },

  problems: [
    {
      id: 'valid-parentheses',
      num: 20,
      title: 'Valid Parentheses',
      difficulty: 'Easy',
      category: 'stack',
      pattern: 'Stack of unmatched openers',
      prompt:
        'A string `s` contains only the brackets `( ) [ ] { }`. Return `True` if every bracket is closed by the **same type** of bracket, in the **right order** (the most recently opened one closes first), and nothing is left open.',
      examples: [
        { input: 's = "[{}()]"', output: 'True' },
        { input: 's = "{(})"', output: 'False', note: 'The "}" arrives while "(" is still open.' },
        { input: 's = "(("', output: 'False', note: 'Neither bracket is ever closed.' },
      ],
      signals: ['brackets that must **nest** correctly', '"closed in the correct order"', 'the most recent opener must close first'],
      hints: [
        'When you meet a closing bracket, which opening bracket must it match?',
        'Keep the openers that are still waiting in a stack. The top is always the most recent one.',
        'On a closer: the stack must be non-empty and its top must be the matching opener, so pop it. At the end the stack must be empty.',
      ],
      brute:
        'Repeatedly delete adjacent pairs like `"()"`, `"[]"` and `"{}"` until nothing changes, then check that the string is empty. Each sweep is O(n) and there can be n/2 sweeps: **O(n²)**.',
      insight:
        'A closing bracket must match the **most recent** opener that is still unmatched. "Most recent" means the top of a stack.',
      mnemonic: 'Openers go on the stack; closers must match the top.',
      steps: [
        'Make a dict from each closing bracket to its opening bracket.',
        'Loop over each character with an empty stack ready.',
        'If the character is a closer and the stack is empty or its top does not match, return False.',
        'If the closer matches the top, pop the top.',
        'If the character is an opener, push it.',
        'At the end, return True only if the stack is empty.',
      ],
      solution: py`
class Solution:
    def isValid(self, s: str) -> bool:
        #@ Map each closing bracket to the opening bracket it must match.
        pairs = {")": "(", "]": "[", "}": "{"}
        #@ The stack holds opening brackets that are still waiting for their partner.
        stack = []
        for ch in s:
            #@ A closer must match the MOST RECENT unmatched opener: the top of the stack.
            if ch in pairs:
                if not stack or stack[-1] != pairs[ch]:  #!
                    return False
                stack.pop()  #!
            #@ An opener just waits on the stack.
            else:
                stack.append(ch)
        #@ Valid only if nothing is left unmatched.
        return not stack  #!`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy:
        'One pass with an O(1) push or pop per character. In the worst case (all openers) the stack holds n characters.',
      pitfalls: [
        'Peeking at `stack[-1]` on an empty stack crashes. Check `not stack` first (think of an input like `")"`).',
        'Forgetting the final empty check: `"(("` never fails inside the loop, but it is still invalid.',
        'Counting brackets is not enough: `"[(])"` has matching counts but closes in the wrong order.',
      ],
    },
    {
      id: 'min-stack',
      num: 155,
      title: 'Min Stack',
      difficulty: 'Medium',
      category: 'stack',
      pattern: 'Second stack of running minimums',
      prompt:
        'Design a `MinStack` class with `push(val)`, `pop()`, `top()` and `getMin()`, where `getMin()` returns the **smallest value currently in the stack**. Every method must run in **O(1)** time.',
      examples: [
        {
          input: 'push(4), push(2), push(7), getMin(), pop(), pop(), getMin(), top()',
          output: 'getMin() → 2, getMin() → 4, top() → 4',
          note: 'After popping 7 and then 2, only 4 is left.',
        },
      ],
      signals: ['"retrieve the minimum in constant time"', 'design a class with push and pop', 'the minimum must stay correct after pops'],
      hints: [
        'Keeping one `min` variable is not enough. What happens when you pop the minimum?',
        'What if every position in the stack remembered "the minimum of everything at or below me"?',
        'Keep a second stack. On push, push `min(val, current minimum)` onto it; on pop, pop both stacks.',
      ],
      brute: 'Store the values in a list and compute `min(stack)` whenever `getMin()` is called — **O(n)** per call.',
      insight:
        'The minimum only changes on a push or a pop, so **record it at every height**. A second stack holds the minimum of everything at or below each position, and its top is always the current answer.',
      mnemonic: 'Every push also pushes the minimum so far.',
      steps: [
        'Create two empty stacks: one for values and one for minimums.',
        'On push, append the value to the value stack.',
        'Also append the smaller of the value and the current minimum to the min stack.',
        'On pop, pop from both stacks so they stay the same height.',
        'top returns the last value, and getMin returns the last minimum.',
      ],
      solution: py`
class MinStack:
    def __init__(self):
        #@ Two stacks of equal height: the values, and the minimum at or below each position.
        self.stack = []
        self.min_stack = []

    #@ Push the value, and also push the new minimum: the smaller of this value and the old minimum.
    def push(self, val: int) -> None:
        self.stack.append(val)
        new_min = min(val, self.min_stack[-1]) if self.min_stack else val  #!
        self.min_stack.append(new_min)

    #@ Pop from both stacks together so they stay in step.
    def pop(self) -> None:
        self.stack.pop()
        self.min_stack.pop()  #!

    #@ The top value is the last item of the main stack.
    def top(self) -> int:
        return self.stack[-1]

    #@ The current minimum waits on top of min_stack: O(1), no searching.
    def getMin(self) -> int:
        return self.min_stack[-1]  #!`,
      time: 'O(1) per operation',
      space: 'O(n)',
      complexityWhy:
        'Every method only touches the end of a list, which is O(1). The second stack doubles the memory, which is still O(n).',
      pitfalls: [
        'A single `self.min` variable breaks after you pop the minimum: you no longer know the next smallest value.',
        'On the very first push the min stack is empty, so the new minimum is just `val`.',
        'Pop from **both** stacks, or they drift out of step.',
      ],
    },
    {
      id: 'evaluate-reverse-polish-notation',
      num: 150,
      title: 'Evaluate Reverse Polish Notation',
      difficulty: 'Medium',
      category: 'stack',
      pattern: 'Operand stack',
      prompt:
        'You get an arithmetic expression in **Reverse Polish Notation**: a list of tokens where each operator (`+`, `-`, `*`, `/`) comes **after** its two numbers, so `["2", "5", "+"]` means 2 + 5. Evaluate it and return the integer result. Division **truncates toward zero**, and the expression is always valid.',
      examples: [
        { input: 'tokens = ["3", "4", "+", "2", "*"]', output: '14', note: '(3 + 4) × 2 = 14.' },
        {
          input: 'tokens = ["10", "-7", "2", "/", "+"]',
          output: '7',
          note: '-7 / 2 truncates toward zero to -3, then 10 + (-3) = 7.',
        },
      ],
      signals: ['operators come **after** their operands (postfix)', 'evaluate an expression left to right', 'each operator uses the two most recent values'],
      hints: [
        'Read the tokens left to right. Where can numbers wait until an operator arrives?',
        'An operator always uses the two most recent values that have not been used yet. That is the top of a stack.',
        'Pop `b` first, then `a`, compute `a op b`, and push the result back.',
      ],
      brute:
        'Repeatedly scan the list for the first operator, replace it and its two numbers with the result, and start over. Each rescan is O(n), so it is **O(n²)** overall.',
      insight:
        'Numbers wait on a **stack**. An operator pops the top two, combines them, and pushes the result back, where it is ready for the next operator.',
      mnemonic: 'Numbers push. Operators pop two, compute, push one.',
      steps: [
        'Create an empty stack.',
        'If the token is a number, push it as an int.',
        'If the token is an operator, pop b (the right operand) and then a (the left operand).',
        'Compute a op b, using int(a / b) for division, and push the result.',
        'After the last token, return the single value left on the stack.',
      ],
      solution: py`
class Solution:
    def evalRPN(self, tokens: List[str]) -> int:
        #@ The stack holds numbers waiting for an operator.
        stack = []
        for token in tokens:
            #@ An operator uses the two most recent numbers. The FIRST pop is the right-hand number.
            if token in {"+", "-", "*", "/"}:
                b = stack.pop()  #!
                a = stack.pop()
                #@ Apply the operator. Division must truncate toward zero, so use int(a / b), not a // b.
                if token == "+":
                    stack.append(a + b)
                elif token == "-":
                    stack.append(a - b)
                elif token == "*":
                    stack.append(a * b)
                else:
                    stack.append(int(a / b))  #!
            #@ A number just waits on the stack.
            else:
                stack.append(int(token))
        #@ After all tokens, the one number left is the answer.
        return stack[0]`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy:
        'Each token is handled once with O(1) stack work. The stack can hold about half of the tokens at once.',
      pitfalls: [
        'Pop order matters: the **first** pop is the right operand. `a - b` and `a / b` give wrong answers the other way round.',
        'Python `//` rounds down toward minus infinity (`-7 // 2` is `-4`). Use `int(a / b)` to truncate toward zero (`-3`).',
        'Negative numbers like `"-7"` are numbers, not operators. Compare the whole token with the operator set instead of checking its first character.',
      ],
    },
    {
      id: 'generate-parentheses',
      num: 22,
      title: 'Generate Parentheses',
      difficulty: 'Medium',
      category: 'stack',
      pattern: 'Backtracking with open/close counts',
      alsoAccept: ['backtracking'],
      prompt:
        'Given `n` pairs of parentheses, return **every** string of length 2n made of `(` and `)` that is **well-formed**: each bracket is opened before it is closed, and nothing is left open. Any order is fine.',
      examples: [
        { input: 'n = 2', output: '["(())", "()()"]', note: 'With two pairs there are exactly two valid strings.' },
      ],
      signals: ['"generate all" valid combinations', 'build a string one character at a time, following rules', 'small n, so an exponential number of answers is expected'],
      hints: [
        'Build the string one character at a time. When is it legal to add `(`? When is it legal to add `)`?',
        'You may add `(` while fewer than n have been used. You may add `)` only while fewer `)` than `(` have been used.',
        'Write a recursive function that takes the open and close counts. Push a character, recurse, then pop it to try the other option.',
      ],
      brute:
        'Generate all 2^(2n) strings of `(` and `)` and keep the valid ones, checking each in O(n) — **O(2^(2n) · n)**. Most of those strings are invalid and never needed to be built.',
      insight:
        'Only build strings that can still become valid: add `(` if `open_count < n`, and add `)` if `close_count < open_count`. When both counts reach n, the string is complete.',
      mnemonic: 'Open if you can; close only what is open.',
      steps: [
        'Keep a stack of characters and a list of results.',
        'Write a recursive function that takes the open and close counts.',
        'If both counts equal n, join the stack into a string and save it.',
        'If open < n, push "(", recurse with open + 1, then pop.',
        'If close < open, push ")", recurse with close + 1, then pop.',
        'Call the function with 0 opens and 0 closes, then return the results.',
      ],
      solution: py`
class Solution:
    def generateParenthesis(self, n: int) -> List[str]:
        #@ stack holds the string being built; res collects the finished strings.
        stack = []
        res = []

        #@ open_count and close_count say how many of each bracket we have used so far.
        def backtrack(open_count, close_count):
            #@ Used n of each? The string is complete and valid.
            if open_count == close_count == n:
                res.append("".join(stack))
                return
            #@ We may add "(" as long as we have not used all n of them.
            if open_count < n:  #!
                stack.append("(")
                backtrack(open_count + 1, close_count)
                stack.pop()
            #@ We may add ")" only if it closes something: fewer closes than opens so far.
            if close_count < open_count:  #!
                stack.append(")")
                backtrack(open_count, close_count + 1)
                stack.pop()

        #@ Start from an empty string with nothing used.
        backtrack(0, 0)
        return res`,
      time: 'O(4^n / √n)',
      space: 'O(n)',
      complexityWhy:
        'The number of valid strings is the n-th Catalan number, roughly 4^n / (n√n), and each one takes O(n) to build. The recursion is at most 2n calls deep (not counting the output).',
      pitfalls: [
        'Allowing `)` whenever `close_count < n` (instead of `< open_count`) builds invalid strings like `")("`.',
        'Forgetting `stack.pop()` after a recursive call leaves extra characters behind for the next branch.',
        'Save `"".join(stack)`, not the stack itself: the list keeps changing after you save it.',
      ],
    },
    {
      id: 'daily-temperatures',
      num: 739,
      title: 'Daily Temperatures',
      difficulty: 'Medium',
      category: 'stack',
      pattern: 'Monotonic decreasing stack',
      prompt:
        '`temperatures[i]` is the temperature on day `i`. For every day, return **how many days you have to wait** for a strictly warmer day. If no warmer day ever comes, use `0`.',
      examples: [
        {
          input: 'temperatures = [60, 62, 61, 59, 64]',
          output: '[1, 3, 2, 1, 0]',
          note: 'Day 1 (62) waits until day 4 (64): 3 days.',
        },
        { input: 'temperatures = [90, 80, 80]', output: '[0, 0, 0]', note: 'It only gets colder or stays the same.' },
      ],
      signals: ['"next warmer / next greater" element', '"how many days until"', 'for **every** element, look to its right'],
      hints: [
        'The brute force scans forward from each day. Could one warm day answer several earlier days at once?',
        'Keep the days that are still waiting for a warmer day. From bottom to top, their temperatures never increase. Why?',
        'Stack of indices: while today is warmer than the day on top, pop it and set its answer to `i - popped_index`. Then push today.',
      ],
      brute:
        'For each day, scan forward until you find a warmer one — **O(n²)** in the worst case, such as temperatures that keep falling.',
      insight:
        'Keep a stack of days still waiting for a warmer day. When a warmer day arrives, it is the answer for **every colder day on top** of the stack, so pop and resolve them all.',
      mnemonic: 'A warmer day pops the colder days and records the gaps.',
      steps: [
        'Create an answer list of zeros and an empty stack of indices.',
        'Loop over each day i with its temperature.',
        'While the stack is not empty and today is warmer than the day on top, pop that day.',
        'Set the answer for the popped day to i minus its index.',
        'Push index i onto the stack to wait for its own warmer day.',
      ],
      solution: py`
class Solution:
    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:
        #@ Answers default to 0 (no warmer day). The stack holds indices of days still waiting.
        res = [0] * len(temperatures)
        stack = []
        #@ Walk through the days in order.
        for i, temp in enumerate(temperatures):
            #@ Today is warmer than the day on top? Then today is that day's answer. Keep popping while true.
            while stack and temperatures[stack[-1]] < temp:  #!
                j = stack.pop()
                res[j] = i - j  #!
            #@ Today now waits for its own warmer day.
            stack.append(i)
        #@ Days still on the stack never got warmer, so their answer stays 0.
        return res`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy:
        'Each index is pushed once and popped at most once, so the inner while loop does O(n) work in total. The stack can hold n indices.',
      pitfalls: [
        'Store **indices** on the stack, not temperatures: you need the index to count the days in between.',
        'Use `<` so only a strictly warmer day counts. An equally warm day is not an answer.',
        'Days left on the stack at the end never got warmer. Their answer stays 0, which is why `res` starts as all zeros.',
      ],
    },
    {
      id: 'car-fleet',
      num: 853,
      title: 'Car Fleet',
      difficulty: 'Medium',
      category: 'stack',
      pattern: 'Sort by position, stack of arrival times',
      prompt:
        'Cars drive toward `target` on a one-lane road; car `i` starts at `position[i]` with speed `speed[i]`. A faster car can never pass: when it catches up, it slows down and they continue together as one **fleet** (catching up exactly at `target` also counts). Return the **number of fleets** that arrive.',
      examples: [
        {
          input: 'target = 10, position = [0, 4, 6], speed = [2, 1, 2]',
          output: '2',
          note: 'The car at 6 arrives alone after 2 hours. The car at 0 (5 hours alone) catches the car at 4 (6 hours), and they arrive together.',
        },
        {
          input: 'target = 8, position = [6, 2, 4], speed = [1, 3, 2]',
          output: '1',
          note: 'All three cars would reach 8 at the same moment, so they arrive as one fleet.',
        },
      ],
      signals: ['cars that "cannot pass" each other', 'things merging into groups (fleets)', 'compare arrival times, starting closest to the target'],
      hints: [
        'Work out how long each car would take to reach the target on an empty road: `(target - position) / speed`.',
        'Look at the cars from the one closest to the target backwards. When does a car end up stuck behind the one ahead?',
        'Sort by position, descending. Keep a stack of fleet arrival times: a car starts a new fleet only if its time is **greater** than the time on top.',
      ],
      brute:
        'Simulate the road hour by hour, moving every car and merging cars that meet. That is **O(n × steps)**, fiddly to get right, and the number of steps depends on distances and speeds rather than on n.',
      insight:
        'Sort the cars from **closest to the target** backwards. A car that would arrive no later than the fleet ahead catches up and merges; a car that would arrive **later** can never catch up and becomes a new fleet.',
      mnemonic: 'Closest first: arrives later than the top? New fleet.',
      steps: [
        'Pair each position with its speed.',
        'Sort the pairs by position, closest to the target first.',
        'For each car, compute its arrival time: (target - position) / speed.',
        'If the stack is empty or this time is greater than the top, push it as a new fleet.',
        'Otherwise the car merges with the fleet ahead, so push nothing.',
        'Return the number of times on the stack.',
      ],
      solution: py`
class Solution:
    def carFleet(self, target: int, position: List[int], speed: List[int]) -> int:
        #@ Pair each position with its speed, sorted so the car closest to the target comes first.
        cars = sorted(zip(position, speed), reverse=True)  #!
        #@ The stack holds the arrival time of each fleet, the front fleet at the bottom.
        stack = []
        for pos, spd in cars:
            #@ How long would this car take to reach the target on an empty road?
            time = (target - pos) / spd
            #@ Arrives later than the fleet just ahead? It can never catch up, so it leads a new fleet. Otherwise it merges.
            if not stack or time > stack[-1]:  #!
                stack.append(time)
        #@ Each time left on the stack is one fleet.
        return len(stack)`,
      time: 'O(n log n)',
      space: 'O(n)',
      complexityWhy:
        'Sorting the cars dominates at O(n log n); the stack pass is O(n). The sorted pairs and the stack use O(n) memory.',
      pitfalls: [
        'Sort by position **descending**. Starting from the back of the road gives the wrong merges.',
        'Use `>`, not `>=`: a car that arrives at exactly the same time joins the fleet ahead.',
        'Use real division `/` for the times. Integer division `//` can make different times look equal.',
      ],
    },
    {
      id: 'largest-rectangle-in-histogram',
      num: 84,
      title: 'Largest Rectangle in Histogram',
      difficulty: 'Hard',
      category: 'stack',
      pattern: 'Monotonic increasing stack with start indices',
      prompt:
        '`heights` describes a histogram: bar `i` is 1 unit wide and `heights[i]` tall, and the bars stand side by side. Return the **area of the largest rectangle** that fits completely inside the histogram.',
      examples: [
        { input: 'heights = [3, 1, 3, 2, 2]', output: '6', note: 'Height 2 across the last three bars: 2 × 3 = 6.' },
        { input: 'heights = [6, 7, 2]', output: '12', note: 'Height 6 across the first two bars.' },
      ],
      signals: ['largest rectangle or area under bars', 'each bar stretches left and right until a **shorter** bar', 'large input, so O(n²) is too slow'],
      hints: [
        'A rectangle that uses bar i at its full height stretches left and right until it hits a shorter bar.',
        'While the bars keep getting taller, no rectangle has ended yet. A **shorter** bar ends every taller rectangle before it.',
        'Keep a stack of (start index, height) with increasing heights. When a shorter bar comes, pop the taller ones and measure them, then let the new bar start where the last popped bar started.',
      ],
      brute:
        'Try every pair of start and end bars, using the shortest bar in between as the height — **O(n²)** even when you track the minimum as you go.',
      insight:
        'Keep bars on a stack in **increasing height**. A shorter bar means each taller bar on top can stretch no further right, so pop it and measure it. The shorter bar inherits the start index of the last bar it popped, because it can stretch back that far.',
      mnemonic: 'Shorter bar pops taller bars, measures them, inherits their start.',
      steps: [
        'Create an empty stack of (start index, height) pairs and set best to 0.',
        'For each bar, set start to its own index.',
        'While the top of the stack is taller than the current bar, pop it.',
        'Measure the popped bar as height times (i minus its start) and update best.',
        'Move start back to the popped start index.',
        'Push (start, current height) onto the stack.',
        'After the loop, measure the bars left on the stack up to the end of the histogram.',
      ],
      solution: py`
class Solution:
    def largestRectangleArea(self, heights: List[int]) -> int:
        #@ The stack holds (start index, height) pairs, heights increasing from bottom to top.
        stack = []
        best = 0
        #@ Visit each bar. By default, a rectangle of this bar's height starts right here.
        for i, h in enumerate(heights):
            start = i
            #@ A shorter bar ends every taller rectangle on top. Pop each one and measure it: it ran from its start up to i.
            while stack and stack[-1][1] > h:  #!
                index, height = stack.pop()
                best = max(best, height * (i - index))  #!
                #@ The shorter bar can stretch back to where the popped bar started.
                start = index  #!
            #@ Push this bar with the earliest start it can reach.
            stack.append((start, h))
        #@ Bars still on the stack stretch all the way to the end of the histogram. Then return the best area.
        for index, height in stack:
            best = max(best, height * (len(heights) - index))
        return best`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy:
        'Each bar is pushed once and popped at most once, so all the while loops together do O(n) work. The stack holds up to n pairs.',
      pitfalls: [
        'Forgetting the bars still on the stack after the loop. They stretch all the way to the end: `len(heights) - index`.',
        'Pushing the current bar with its own index instead of the inherited `start` underestimates how far left it reaches.',
        'Pop while the top is **taller** (`>`). Equal heights can stay, because the earlier bar already covers the same rectangle.',
      ],
    },
  ],
};

export default content;
