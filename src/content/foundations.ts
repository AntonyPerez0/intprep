// ─────────────────────────────────────────────────────────────────────────────
// Foundations: the beginner track.
//
// Takes a learner from zero Python to ready-for-the-pattern-units. Every code
// slide is real Python; when it prints, `output` is exactly what python3 prints.
// Quizzes are spread through each lesson so learners retrieve as they go.
// ─────────────────────────────────────────────────────────────────────────────
import { py, type Lesson } from './types';

export const FOUNDATIONS: Lesson[] = [
  // ── 1 ────────────────────────────────────────────────────────────────────
  {
    id: 'how-to-learn',
    title: 'How IntPrep Works',
    icon: '🧭',
    blurb: 'Learn a pattern, practice it, then drill it a little every day.',
    minutes: 5,
    slides: [
      {
        kind: 'text',
        title: 'Welcome to IntPrep',
        body: `Coding interviews can feel like a test of genius. They aren't. The 150 classic problems are built from about **16 reusable patterns**, and once you know a pattern, the problems that use it start to look familiar.

This beginner track gives you just enough Python and computer-science basics to begin. No experience needed, and you will write real code in every lesson, starting now.`,
      },
      {
        kind: 'type',
        title: 'Your first line of Python',
        prompt: 'Type this line exactly as it is written, then check it:\n\n`print("Hello, IntPrep")`',
        answer: 'print("Hello, IntPrep")',
        hint: 'Type `print`, an opening parenthesis, the text inside double quotes, then a closing parenthesis.',
        explain:
          '`print(...)` shows whatever is inside the parentheses, and the quotes mark `Hello, IntPrep` as text. The next lessons explain every piece of it.',
        output: 'Hello, IntPrep',
      },
      {
        kind: 'text',
        title: 'The IntPrep loop',
        body: `Everything here follows one loop:

- **Learn a pattern.** A short guide explains the idea, when to reach for it, and a reusable code template.
- **Solve guided problems.** Hints first, then a chunk-by-chunk walkthrough of a clean solution.
- **Drill daily.** Quick spaced-repetition reviews bring each problem back just before you would forget it.`,
      },
      {
        kind: 'text',
        title: "Test yourself, don't reread",
        body: `Rereading feels productive because the page looks familiar. But *recognizing* an answer is not the same as *recalling* it, and in an interview there is no page.

Every time you pull an idea out of memory (writing a line of code, filling in a missing line, rebuilding a solution) that memory gets stronger. A little struggle is the point. That is why IntPrep quizzes you constantly, starting now.`,
      },
      {
        kind: 'quiz',
        q: 'You just read a solution and it all makes sense. What is the most effective next step?',
        options: [
          'Read it two more times',
          'Close it and try to write it from memory',
          'Move straight on to the next problem',
          'Highlight the important lines',
        ],
        answer: 1,
        explain:
          'Recalling without looking is **retrieval practice**. Any gap you discover now is a gap you will not discover in the interview.',
      },
      {
        kind: 'text',
        title: 'Spaced repetition',
        body: `Memories fade on a predictable curve, but each time you successfully recall something, it fades more slowly.

So IntPrep spaces your reviews out. Nail a drill and its next review moves further away: a day, then a few days, then a week or more. Miss it and it comes back sooner. You never have to plan what to review. Just clear today's drills.`,
      },
      {
        kind: 'text',
        title: 'Little and often',
        body: `Twenty minutes every day beats a three-hour cram on Sunday. Spreading practice out gives your brain time (and sleep) to lock things in.

That is what **streaks** are for. A visible chain of days is motivating, and it turns practice into a habit you don't have to negotiate with yourself. Busy day? Just do your drills. Five minutes still keeps the chain alive.`,
      },
      {
        kind: 'quiz',
        q: 'Which plan will help you remember the most a month from now?',
        options: [
          'One 4-hour session every Sunday',
          'About 25 minutes a day, with quick self-tests',
          'Reading all 150 solutions in one week',
          'Watching solution videos at double speed',
        ],
        answer: 1,
        explain:
          'Short, spaced sessions that make you **recall** beat long, passive cramming, even when the total time is the same.',
      },
      {
        kind: 'type',
        title: 'From memory: print some math',
        prompt:
          'Write a `print` line from memory, the same shape as your first one. This time, put the math `25 * 30` inside the parentheses, with no quotes: 25 minutes a day for 30 days.',
        answer: 'print(25 * 30)',
        accept: ['print(30 * 25)'],
        hint: 'Same shape as before: `print(`, then what to show, then `)`. Numbers and math need no quotes.',
        explain:
          'Without quotes, Python works out `25 * 30` and prints the result: 750 minutes, over 12 hours a month, with no cramming. Pulling the `print(...)` shape out of memory instead of looking it up is retrieval practice, the same move every drill here uses.',
        output: '750',
      },
      {
        kind: 'text',
        title: 'Getting stuck is part of it',
        body: `You will get stuck, often. Everyone does. A good rule: give a problem an honest 15–25 minutes, then open a hint. Still stuck? Read the walkthrough until it makes sense, then close it and write the solution yourself.

The problem then joins your drills, so you will meet it again in a few days. Solving it from memory *then* is what really counts.`,
      },
      {
        kind: 'quiz',
        q: 'You have been stuck on a problem for 30 minutes with no new ideas. What should you do?',
        options: [
          'Keep staring at it, because hints are cheating',
          'Take a hint, study the solution, then rebuild it yourself',
          'Skip every problem in that unit',
          'Copy the solution, submit it and move on',
        ],
        answer: 1,
        explain:
          'A short struggle helps you learn; hours of it mostly waste time. Learn the idea, then prove you own it by writing it from memory, and again when the drill comes back.',
      },
    ],
  },

  // ── 2 ────────────────────────────────────────────────────────────────────
  {
    id: 'python-basics',
    title: 'Python Basics',
    icon: '🐍',
    blurb: 'Values, variables, types, arithmetic, comparisons and printing.',
    minutes: 16,
    slides: [
      {
        kind: 'text',
        title: 'What is a program?',
        body: `A program is a list of instructions that the computer runs **top to bottom**, one line at a time.

We use **Python**: it reads almost like English, it is short to write, and every major company accepts it in interviews. Each code box in these lessons shows exactly what it prints underneath. Read the code, predict the output, then check.

After almost every new idea it is **your turn**: you write the code yourself, and IntPrep checks it line by line. Writing code, not just reading it, is what makes it stick.`,
      },
      {
        kind: 'code',
        title: 'print shows a value',
        body: '`print(...)` displays a value. Text goes in quotes; numbers and math do not.',
        code: py`
print("Hello, IntPrep!")
print(42)
print(3 + 4)
# A line starting with # is a comment. Python ignores it.`,
        output: py`
Hello, IntPrep!
42
7`,
      },
      {
        kind: 'type',
        title: 'Your first line of code',
        prompt: 'Write one line that prints the text `Hi there`. Remember that text goes inside quotes.',
        answer: 'print("Hi there")',
        hint: 'Start with `print(`, put the text inside quotes, then close the parenthesis.',
        explain:
          '`print(...)` shows whatever is inside the parentheses. The quotes tell Python that `Hi there` is text, not a name. Single and double quotes both work.',
        output: 'Hi there',
      },
      {
        kind: 'code',
        title: 'Variables',
        body: 'A **variable** is a name for a value. `=` means *store the value on the right under the name on the left*. It is not math equality.',
        code: py`
score = 10
score = score + 5   # read the old value, add 5, store it back
score += 1          # shortcut for: score = score + 1
print(score)
lives = 3
print(score, lives)`,
        output: py`
16
16 3`,
      },
      {
        kind: 'type',
        title: 'Store and update a value',
        prompt: 'Create a variable called `score` that holds `10`. On the next line, add `5` to it with `+=`. Then print `score`.',
        answer: py`
score = 10
score += 5
print(score)`,
        accept: [
          py`
score = 10
score = score + 5
print(score)`,
        ],
        hint: '`score += 5` is short for `score = score + 5`. Press Enter to start a new line.',
        explain:
          'The first line stores 10 under the name `score`. `+=` reads the old value, adds 5 and stores the result back, so `print` shows 15.',
        output: '15',
      },
      {
        kind: 'text',
        title: 'Four basic types',
        body: `Every value has a **type**:

- \`int\`: whole numbers like \`7\`, \`-3\`, \`0\`
- \`float\`: decimals like \`2.5\`, \`0.1\`
- \`str\`: text in quotes, \`"cat"\` or \`'cat'\`
- \`bool\`: \`True\` or \`False\` (capital letters!)

There is also \`None\`, which means *no value at all*. Python works out types by itself; you never have to declare them.`,
      },
      {
        kind: 'code',
        title: 'Checking and converting types',
        code: py`
print(type(7))
print(type(2.5))
print(type("hi"))
print(type(True))
print(int("42") + 1)   # text -> number
print(str(42) + "!")   # number -> text
print(int(3.9))        # chops off the decimals`,
        output: py`
<class 'int'>
<class 'float'>
<class 'str'>
<class 'bool'>
43
42!
3`,
      },
      {
        kind: 'type',
        title: 'Turn text into a number',
        prompt: '`age_text` holds the text `"41"`. Convert it to a number with `int` and store it in `age`. Then print `age + 1`.',
        starter: 'age_text = "41"',
        answer: py`
age = int(age_text)
print(age + 1)`,
        accept: [
          py`
age = int(age_text)
print(1 + age)`,
        ],
        hint: '`int(...)` turns text that looks like a number into a real number you can do math with.',
        explain:
          'Text in quotes is a `str`, even when it looks like a number, so `"41" + 1` would be an error. `int(age_text)` gives the number 41, and `age + 1` is 42.',
        output: '42',
      },
      {
        kind: 'code',
        title: 'Arithmetic',
        body: '`/` always gives a float. `//` is **floor division**: divide, then round *down*. `%` gives the **remainder**. You will use `//` and `%` constantly.',
        code: py`
print(7 + 2, 7 - 2, 7 * 2)
print(7 / 2)     # true division
print(7 // 2)    # floor division
print(7 % 2)     # remainder
print(2 ** 10)   # power
print(-7 // 2)   # rounds down, toward minus infinity`,
        output: py`
9 5 14
3.5
3
1
1024
-4`,
      },
      {
        kind: 'quiz',
        q: 'What does this print?',
        code: py`
print(17 // 5, 17 % 5)`,
        options: ['3.4 2', '3 2', '3 3', '4 2'],
        answer: 1,
        explain:
          '17 = 5 × 3 + 2. `//` gives the 3 and `%` gives the leftover 2. Printing two values puts a space between them.',
      },
      {
        kind: 'code',
        title: 'Why // and % matter',
        body: 'These two operators show up all over interview code:',
        code: py`
n = 4721
print(n % 10)        # last digit
print(n // 10)       # drop the last digit
print(n % 2 == 0)    # is n even?
left, right = 3, 10  # two variables at once
print((left + right) // 2)   # middle index (binary search)
cols = 4
print(9 // cols, 9 % cols)   # cell 9 of a 4-wide grid: row, col`,
        output: py`
1
472
False
6
2 1`,
      },
      {
        kind: 'type',
        title: 'Split off the last digit',
        prompt: '`n` holds a number. Print its **last digit**, then on the next line print `n` **without** its last digit. Use `%` and `//`.',
        starter: 'n = 917',
        answer: py`
print(n % 10)
print(n // 10)`,
        hint: 'Divide by 10: the remainder (`%`) is the last digit, and floor division (`//`) drops it.',
        explain:
          '`917 % 10` is the remainder after dividing by 10, which is always the last digit: `7`. `917 // 10` divides and rounds down, which drops that digit: `91`.',
        output: py`
7
91`,
      },
      {
        kind: 'code',
        title: 'Comparisons give booleans',
        body: 'Comparisons produce `True` or `False`. Combine them with `and`, `or` and `not`.',
        code: py`
x = 5
print(x > 3, x < 3)
print(x == 5, x != 5)     # == compares; = assigns
print(1 <= x < 10)        # chained: is x between 1 and 10?
print(x > 3 and x < 4)    # both sides must be true
print(x < 0 or x > 3)     # at least one side true
print(not x == 5)`,
        output: py`
True False
True False
True
False
True
False`,
      },
      {
        kind: 'type',
        title: 'Compare with ==',
        prompt: 'Store in `is_ten` whether `x` equals `10`. Then print `is_ten`.',
        starter: 'x = 10',
        answer: py`
is_ten = x == 10
print(is_ten)`,
        accept: [
          py`
is_ten = (x == 10)
print(is_ten)`,
          py`
is_ten = 10 == x
print(is_ten)`,
          py`
is_ten = (10 == x)
print(is_ten)`,
        ],
        hint: 'The first line needs both: a single `=` to store, and a double `==` to compare.',
        explain:
          '`x == 10` **compares** and gives `True` or `False`; the single `=` then **stores** that answer in `is_ten`. (`===` is JavaScript, not Python.)',
        output: 'True',
      },
      {
        kind: 'code',
        title: 'f-strings',
        body: 'Put `f` before a string and anything inside `{}` is worked out and dropped in. It is the cleanest way to build messages.',
        code: py`
name = "Ada"
solved = 12
print(f"{name} has solved {solved} problems")
print(f"Double that is {solved * 2}")
print("a", "b", "c")            # print adds spaces...
print("a", "b", "c", sep="-")   # ...unless you change sep
print("no newline", end="")
print("... same line")`,
        output: py`
Ada has solved 12 problems
Double that is 24
a b c
a-b-c
no newline... same line`,
      },
      {
        kind: 'type',
        title: 'Build a message',
        prompt: 'Print `Kai solved 5 problems` with an f-string, putting `name` and `solved` inside `{}`.',
        starter: py`
name = "Kai"
solved = 5`,
        answer: 'print(f"{name} solved {solved} problems")',
        hint: 'Start the text with `f"`, then write the sentence with `{name}` and `{solved}` where the values go.',
        explain:
          'The `f` before the quotes tells Python to fill in each `{...}` with its value, so the message stays right whenever `name` or `solved` changes.',
        output: 'Kai solved 5 problems',
      },
      {
        kind: 'quiz',
        q: 'What does this print?',
        code: py`
a = 3
b = a
a = a + 1
print(a, b)`,
        options: ['4 4', '4 3', '3 3', '3 4'],
        answer: 1,
        explain:
          '`b = a` makes `b` name the value 3. Then `a` is pointed at a new value, 4. Nothing changed `b`, so it still names 3.',
      },
      {
        kind: 'type',
        title: 'Minutes to hours',
        prompt: '`duration` is a number of minutes. Store the whole hours in `hours` and the minutes left over in `mins`, using `//` and `%` with `60`. Then print them as `2h 15m` with an f-string.',
        starter: 'duration = 135',
        answer: py`
hours = duration // 60
mins = duration % 60
print(f"{hours}h {mins}m")`,
        accept: [
          py`
mins = duration % 60
hours = duration // 60
print(f"{hours}h {mins}m")`,
          py`
hours, mins = duration // 60, duration % 60
print(f"{hours}h {mins}m")`,
        ],
        hint: '`duration // 60` counts the full hours, and `duration % 60` is what is left over. In the f-string, the `h` goes right after `{hours}`.',
        explain:
          '135 minutes is 2 full hours (`135 // 60`) with 15 minutes left over (`135 % 60`). The f-string drops both values into the text.',
        output: '2h 15m',
      },
    ],
  },

  // ── 3 ────────────────────────────────────────────────────────────────────
  {
    id: 'control-flow',
    title: 'Decisions and Loops',
    icon: '🔀',
    blurb: 'if/elif/else, for loops with range, while, break and continue.',
    minutes: 17,
    slides: [
      {
        kind: 'text',
        title: 'Blocks and indentation',
        body: `Programs need to **choose** and to **repeat**. In Python, a line that opens a block (an \`if\`, a loop, a function) ends with a colon \`:\`, and the lines inside it are **indented by 4 spaces**.

Indentation is not decoration: it *is* the structure. Indent a line differently and it belongs to a different block.`,
      },
      {
        kind: 'code',
        title: 'if / elif / else',
        body: 'Python tests each condition top to bottom and runs **only the first** branch that is true. `elif` and `else` are optional.',
        code: py`
score = 75
if score >= 90:
    print("A")
elif score >= 70:
    print("B")
else:
    print("C")
print("done")    # not indented: always runs`,
        output: py`
B
done`,
      },
      {
        kind: 'quiz',
        q: 'What does this print?',
        code: py`
x = 15
if x > 5:
    print("big")
elif x > 10:
    print("huge")
else:
    print("small")`,
        options: ['big', 'huge', 'big, then huge', 'small'],
        answer: 0,
        explain:
          'Only the **first** true branch runs. `15 > 5` is true, so the `elif` is never even checked. Put the most specific condition first.',
      },
      {
        kind: 'type',
        title: 'Write an if',
        prompt: '`temp` holds a temperature. Write an `if` that prints `hot` when `temp` is greater than `30`.',
        starter: 'temp = 34',
        answer: py`
if temp > 30:
    print("hot")`,
        accept: [
          py`
if 30 < temp:
    print("hot")`,
        ],
        hint: 'End the `if` line with a colon. Press Enter after it and the editor indents the next line for you.',
        explain:
          '`temp > 30` is true here, so the indented line runs. The colon opens the block, and the 4-space indent puts `print` inside it.',
        output: 'hot',
      },
      {
        kind: 'type',
        title: 'Add an else',
        prompt: 'Print `pass` when `score` is at least `50`, and `fail` otherwise. Use `if` and `else`.',
        starter: 'score = 42',
        answer: py`
if score >= 50:
    print("pass")
else:
    print("fail")`,
        accept: [
          py`
if 50 <= score:
    print("pass")
else:
    print("fail")`,
        ],
        hint: '*At least 50* means `>= 50`. `else:` lines up with the `if` and has no condition; Backspace removes the indent.',
        explain:
          '42 is not at least 50, so Python skips the `if` block and runs the `else` block. Exactly one of the two branches always runs.',
        output: 'fail',
      },
      {
        kind: 'code',
        title: 'for loops and range',
        body: '`range(stop)` counts from 0 up to **but not including** `stop`. That *stop is excluded* rule appears all over Python.',
        code: py`
for i in range(4):
    print("lap", i)`,
        output: py`
lap 0
lap 1
lap 2
lap 3`,
      },
      {
        kind: 'type',
        title: 'Write a for loop',
        prompt: 'Write a loop that prints the numbers `0` to `4`, one per line. Use `i` as the loop variable.',
        answer: py`
for i in range(5):
    print(i)`,
        accept: [
          py`
for i in range(0, 5):
    print(i)`,
        ],
        hint: '`range(5)` counts 0, 1, 2, 3, 4. It stops *before* 5.',
        explain:
          '`range(5)` produces 0 up to, but not including, 5. The indented `print(i)` runs once for each of them.',
        output: py`
0
1
2
3
4`,
      },
      {
        kind: 'code',
        title: 'range(start, stop, step)',
        body: 'Here `list(...)` just shows every number a range produces.',
        code: py`
print(list(range(2, 6)))       # start at 2, stop before 6
print(list(range(0, 10, 3)))   # count up in 3s
print(list(range(5, 0, -1)))   # count down
print(list(range(3, 3)))       # start == stop: empty`,
        output: py`
[2, 3, 4, 5]
[0, 3, 6, 9]
[5, 4, 3, 2, 1]
[]`,
      },
      {
        kind: 'type',
        title: 'Count down by twos',
        prompt: 'Print `10`, `8`, `6` and `4`, one per line. Loop over a `range` with a step of `-2`, using `i` as the loop variable.',
        answer: py`
for i in range(10, 3, -2):
    print(i)`,
        accept: [
          py`
for i in range(10, 2, -2):
    print(i)`,
        ],
        hint: 'The stop value is never included, so it has to sit one step *past* 4 in the direction you are counting.',
        explain:
          '`range(10, 3, -2)` starts at 10 and steps down by 2, stopping before it reaches 3: 10, 8, 6, 4. `range(10, 4, -2)` would end at 6, because the stop is never included.',
        output: py`
10
8
6
4`,
      },
      {
        kind: 'type',
        title: 'A decision inside a loop',
        prompt: 'Print only the even numbers from `0` to `8`. Loop over `range(9)` with the variable `n`, and print `n` only when `n % 2 == 0`.',
        answer: py`
for n in range(9):
    if n % 2 == 0:
        print(n)`,
        accept: [
          py`
for n in range(0, 9):
    if n % 2 == 0:
        print(n)`,
        ],
        hint: 'Three lines: the loop, an `if` inside it (indented once), and the `print` inside the `if` (indented twice).',
        explain:
          'The `if` is indented once, so it runs on every pass of the loop. The `print` is indented twice, so it runs only when the `if` is true: for 0, 2, 4, 6 and 8.',
        output: py`
0
2
4
6
8`,
      },
      {
        kind: 'code',
        title: 'while loops',
        body: '`while` repeats as long as its condition is true. Use it when you do not know the number of steps in advance, and make sure each pass moves toward the exit, or it runs forever.',
        code: py`
n = 37
steps = 0
while n > 1:
    n = n // 2    # halve it
    steps += 1
print(steps)`,
        output: '5',
      },
      {
        kind: 'type',
        title: 'Write a while loop',
        prompt: 'Count down from `n`: while `n` is greater than `0`, print `n`, then subtract `1` from it.',
        starter: 'n = 3',
        answer: py`
while n > 0:
    print(n)
    n -= 1`,
        accept: [
          py`
while n > 0:
    print(n)
    n = n - 1`,
          py`
while 0 < n:
    print(n)
    n -= 1`,
          py`
while 0 < n:
    print(n)
    n = n - 1`,
        ],
        hint: 'Inside the loop, print first, then make `n` smaller. Without that last step the loop would never end.',
        explain:
          'Each pass prints `n` and then makes it 1 smaller: 3, 2, 1. Once `n` is 0, `n > 0` is false and the loop stops.',
        output: py`
3
2
1`,
      },
      {
        kind: 'code',
        title: 'break and continue',
        body: '`continue` jumps straight to the next pass of the loop. `break` leaves the loop immediately.',
        code: py`
for n in range(1, 10):
    if n % 2 == 0:
        continue     # skip even numbers
    if n > 6:
        break        # stop the whole loop
    print(n)
print("after the loop")`,
        output: py`
1
3
5
after the loop`,
      },
      {
        kind: 'type',
        title: 'Stop early with break',
        prompt: 'Loop over `range(1, 10)` with `n`. When `n` equals `4`, leave the loop with `break`; otherwise print `n`.',
        answer: py`
for n in range(1, 10):
    if n == 4:
        break
    print(n)`,
        accept: [
          py`
for n in range(1, 10):
    if n == 4:
        break
    else:
        print(n)`,
        ],
        hint: 'Check for 4 *before* printing. The `print` lines up with the `if`, not with `break`.',
        explain:
          'The loop prints 1, 2 and 3. When `n` is 4, `break` leaves the loop at once, so nothing from 4 to 9 is printed.',
        output: py`
1
2
3`,
      },
      {
        kind: 'code',
        title: 'Nested loops',
        body: 'A loop inside a loop runs the **whole** inner loop for every pass of the outer one. Starting `j` at `i + 1` visits every pair exactly once: the classic brute force.',
        code: py`
for i in range(3):
    for j in range(i + 1, 3):
        print(i, j)`,
        output: py`
0 1
0 2
1 2`,
      },
      {
        kind: 'quiz',
        q: 'How many times does this print `hi`?',
        code: py`
for i in range(3):
    for j in range(4):
        print("hi")`,
        options: ['7', '12', '3', '4'],
        answer: 1,
        explain:
          'The inner loop runs 4 times for *each* of the 3 outer passes: 3 × 4 = 12. Nested loops **multiply**, which matters a lot for Big-O.',
      },
      {
        kind: 'code',
        title: 'Truthy and falsy',
        body: 'In an `if` or `while`, zero, empty things and `None` count as **false**; everything else counts as true. That is why solutions write `if not root:` or `while stack:`.',
        code: py`
print(bool(0), bool(7))
print(bool(""), bool("hi"))
print(bool([]), bool([1, 2]))
print(bool(None))
count = 0
if not count:
    print("count is zero")`,
        output: py`
False True
False True
False True
False
count is zero`,
      },
      {
        kind: 'type',
        title: 'Count the multiples',
        prompt: 'Count how many numbers from `1` to `20` divide evenly by `3`. Start `count` at `0`, loop over `range(1, 21)` with `n`, add `1` to `count` when `n % 3 == 0`, and print `count` after the loop.',
        answer: py`
count = 0
for n in range(1, 21):
    if n % 3 == 0:
        count += 1
print(count)`,
        accept: [
          py`
count = 0
for n in range(1, 21):
    if n % 3 == 0:
        count = count + 1
print(count)`,
        ],
        hint: 'Five lines: `count = 0`, the loop, the `if` inside it, the `+= 1` inside the `if`, and the `print` back at the left edge.',
        explain:
          '`count` starts at 0 and grows by 1 for each multiple of 3: 3, 6, 9, 12, 15 and 18. The `print` is not indented, so it runs once, after the loop has finished.',
        output: '6',
      },
    ],
  },

  // ── 4 ────────────────────────────────────────────────────────────────────
  {
    id: 'lists-and-strings',
    title: 'Lists and Strings',
    icon: '📚',
    blurb: 'Indexing, slicing, list methods, sorting, string tricks and comprehensions.',
    minutes: 18,
    slides: [
      {
        kind: 'text',
        title: 'Lists hold many values',
        body: `A **list** is an ordered row of values in square brackets: \`nums = [4, 8, 15]\`. Each slot has an **index**, starting at **0**, so the last index is \`len(nums) - 1\`.

Lists can grow, shrink and hold anything. When a LeetCode problem says *array*, in Python you get a list.`,
      },
      {
        kind: 'code',
        title: 'Indexing',
        body: 'Negative indices count from the end: `-1` is the last item, `-2` the one before it.',
        code: py`
nums = [4, 8, 15, 16, 23]
print(nums[0])      # first
print(nums[2])
print(nums[-1])     # last
print(nums[-2])     # second to last
print(len(nums))    # how many items
nums[1] = 99        # lists can be changed
print(nums)`,
        output: py`
4
15
23
16
5
[4, 99, 15, 16, 23]`,
      },
      {
        kind: 'type',
        title: 'Read from the end',
        prompt: 'Print the **last** item of `nums`, using a negative index.',
        starter: 'nums = [4, 8, 15, 16]',
        answer: 'print(nums[-1])',
        hint: 'Index `-1` means the last item.',
        explain:
          '`nums[-1]` counts from the end, so it is always the last item, however long the list is. `nums[len(nums) - 1]` finds the same item the long way.',
        output: '16',
      },
      {
        kind: 'code',
        title: 'Slicing',
        body: '`a[start:stop]` copies the items from `start` up to **but not including** `stop`, the same rule as `range`. Leave a side blank to run to that edge.',
        code: py`
a = [0, 1, 2, 3, 4, 5]
print(a[1:4])
print(a[:2])       # from the start
print(a[3:])       # to the end
print(a[::2])      # every 2nd item
print(a[::-1])     # a reversed copy`,
        output: py`
[1, 2, 3]
[0, 1]
[3, 4, 5]
[0, 2, 4]
[5, 4, 3, 2, 1, 0]`,
      },
      {
        kind: 'type',
        title: 'Take a slice',
        prompt: 'Print the first three items of `nums`, using a slice.',
        starter: 'nums = [5, 10, 15, 20, 25]',
        answer: 'print(nums[:3])',
        accept: ['print(nums[0:3])'],
        hint: 'A slice is `nums[start:stop]`, and the stop index is not included. Leave `start` out to begin at the front.',
        explain:
          '`nums[:3]` copies indices 0, 1 and 2 and stops before index 3, so you get the first three items. It is the same *stop is excluded* rule as `range`.',
        output: '[5, 10, 15]',
      },
      {
        kind: 'code',
        title: 'Changing a list',
        body: 'Adding or removing at the **end** is fast. At the **front**, every other item has to shift over by one, which is slow on big lists.',
        code: py`
items = [1, 2]
items.append(3)        # add to the end (fast)
print(items)
last = items.pop()     # remove from the end (fast)
print(last, items)
items.insert(0, 9)     # insert at the front (slow)
print(items)
items.pop(0)           # remove from the front (slow)
print(items)`,
        output: py`
[1, 2, 3]
3 [1, 2]
[9, 1, 2]
[1, 2]`,
      },
      {
        kind: 'type',
        title: 'Push and pop',
        prompt: 'Add `2` to the end of `stack` with `append`. Then remove the last item with `pop`, storing it in `top`. Finally, print `top` and `stack`.',
        starter: 'stack = [1]',
        answer: py`
stack.append(2)
top = stack.pop()
print(top, stack)`,
        hint: '`pop()` with nothing in the parentheses removes the last item and hands it back, so you can store it.',
        explain:
          '`append` adds 2 at the end, making `[1, 2]`. `pop()` takes the last item back off and returns it, so `top` is 2 and `stack` is `[1]` again. Both are fast because they work at the end.',
        output: '2 [1]',
      },
      {
        kind: 'code',
        title: 'Looping over lists',
        body: '`enumerate` gives you each index together with its value. `zip` walks two lists side by side.',
        code: py`
fruits = ["fig", "kiwi", "lime"]
for f in fruits:
    print(f)
for i, f in enumerate(fruits):
    print(i, f)
prices = [3, 1, 2]
for f, p in zip(fruits, prices):
    print(f, p)`,
        output: py`
fig
kiwi
lime
0 fig
1 kiwi
2 lime
fig 3
kiwi 1
lime 2`,
      },
      {
        kind: 'type',
        title: 'Loop with enumerate',
        prompt: 'Print each color with its index, using `enumerate`. Name the loop variables `i` and `c`, and print them with `print(i, c)`.',
        starter: 'colors = ["red", "green", "blue"]',
        answer: py`
for i, c in enumerate(colors):
    print(i, c)`,
        hint: 'The loop line is `for i, c in ...:` with `enumerate(colors)` after `in`.',
        explain:
          '`enumerate` hands you two things on every pass, the index and the item, and `i, c` unpacks them into two names.',
        output: py`
0 red
1 green
2 blue`,
      },
      {
        kind: 'code',
        title: 'sorted() vs .sort()',
        body: '`sorted(x)` returns a **new** sorted list and leaves `x` alone. `x.sort()` sorts `x` **in place** and returns `None`. Both can take `key=` and `reverse=True`.',
        code: py`
nums = [3, 1, 2]
new = sorted(nums)
print(new, nums)
result = nums.sort()
print(nums, result)
words = ["pear", "fig", "banana"]
print(sorted(words, key=len))   # shortest first
print(sorted(nums, reverse=True))`,
        output: py`
[1, 2, 3] [3, 1, 2]
[1, 2, 3] None
['fig', 'pear', 'banana']
[3, 2, 1]`,
      },
      {
        kind: 'quiz',
        q: 'What does this print?',
        code: py`
nums = [4, 2, 9]
nums = nums.sort()
print(nums)`,
        options: ['`[2, 4, 9]`', '`None`', '`[4, 2, 9]`', 'An error'],
        answer: 1,
        explain:
          '`.sort()` sorts the list and returns `None`, and that `None` is what got stored back in `nums`. Write `nums.sort()` on its own line, or `nums = sorted(nums)`.',
      },
      {
        kind: 'type',
        title: 'Sort in place',
        prompt: 'Now do it right: sort `nums` in place with `.sort()`, then print `nums`.',
        starter: 'nums = [4, 2, 9]',
        answer: py`
nums.sort()
print(nums)`,
        accept: [
          py`
nums = sorted(nums)
print(nums)`,
        ],
        hint: '`.sort()` changes the list itself and returns `None`, so call it on its own line and do not store what it returns.',
        explain:
          '`nums.sort()` rearranges the list itself, so printing `nums` afterward shows `[2, 4, 9]`. `nums = sorted(nums)` works too: `sorted` returns a new sorted list, which you store back in `nums`.',
        output: '[2, 4, 9]',
      },
      {
        kind: 'code',
        title: 'Strings are sequences too',
        body: 'A string is a sequence of characters, so indexing, slicing, `len`, `in` and `for` loops all work on it.',
        code: py`
s = "hello"
print(s[0], s[-1], len(s))
print(s[1:4])
print(s.upper(), "ell" in s)
for ch in "abc":
    print(ch)`,
        output: py`
h o 5
ell
HELLO True
a
b
c`,
      },
      {
        kind: 'code',
        title: 'Immutable strings, split and join',
        body: 'Strings are **immutable**: you cannot change a character in place, so you build a new string instead. To glue many pieces together, collect them in a list and `join` once at the end.',
        code: py`
s = "cat"
# s[0] = "b"  would raise a TypeError
s = "b" + s[1:]           # build a new string
print(s)
words = "the quick brown fox".split()
print(words)
print("-".join(words))
print("".join(reversed("abc")))`,
        output: py`
bat
['the', 'quick', 'brown', 'fox']
the-quick-brown-fox
cba`,
      },
      {
        kind: 'type',
        title: 'Split and join',
        prompt: 'Split `sentence` into a list of words called `words`. Then print the words joined with `_` between them.',
        starter: 'sentence = "keep it simple"',
        answer: py`
words = sentence.split()
print("_".join(words))`,
        accept: [
          py`
words = sentence.split(" ")
print("_".join(words))`,
        ],
        hint: '`.split()` breaks text apart at the spaces. `"_".join(words)` glues a list of strings back together with `_` in between.',
        explain:
          '`split` returns a new list, `["keep", "it", "simple"]`, and `join` builds one new string from it. `sentence` itself never changes: string methods always return a new string.',
        output: 'keep_it_simple',
      },
      {
        kind: 'code',
        title: 'List comprehensions',
        body: 'A **list comprehension** builds a list in one line: `[expression for item in items if condition]`. For a grid, build each row separately, as in the last line.',
        code: py`
nums = [1, 2, 3, 4, 5]
squares = [n * n for n in nums]
evens = [n for n in nums if n % 2 == 0]
grid = [[0] * 3 for _ in range(2)]   # 2 rows, 3 columns
print(squares)
print(evens)
print(grid)`,
        output: py`
[1, 4, 9, 16, 25]
[2, 4]
[[0, 0, 0], [0, 0, 0]]`,
      },
      {
        kind: 'type',
        title: 'Write a list comprehension',
        prompt: 'Build a list called `doubled` that holds every number in `nums` times 2. Use a list comprehension with `n` as the loop variable, then print `doubled`.',
        starter: 'nums = [1, 2, 3]',
        answer: py`
doubled = [n * 2 for n in nums]
print(doubled)`,
        accept: [
          py`
doubled = [2 * n for n in nums]
print(doubled)`,
          py`
doubled = [n + n for n in nums]
print(doubled)`,
        ],
        hint: 'The shape is `[expression for item in items]`.',
        explain:
          'The comprehension works out `n * 2` for each `n` in `nums` and collects the results in a new list, all in one line.',
        output: '[2, 4, 6]',
      },
      {
        kind: 'quiz',
        q: 'What does this print?',
        code: py`
grid = [[0] * 2] * 2
grid[0][0] = 7
print(grid)`,
        options: ['`[[7, 0], [0, 0]]`', '`[[7, 0], [7, 0]]`', '`[[7, 7], [0, 0]]`', 'An error'],
        answer: 1,
        explain:
          'Multiplying the outer list repeats a reference to the **same** inner list, so both rows are one object. Build grids with a comprehension so every row is a fresh list.',
      },
      {
        kind: 'type',
        title: 'Find the longest word',
        prompt: 'Start `longest` at `words[0]`. Loop over `words` with `w`, and replace `longest` with `w` whenever `len(w)` is greater than `len(longest)`. Print `longest` after the loop.',
        starter: 'words = ["fig", "banana", "kiwi"]',
        answer: py`
longest = words[0]
for w in words:
    if len(w) > len(longest):
        longest = w
print(longest)`,
        accept: [
          py`
longest = words[0]
for w in words:
    if len(longest) < len(w):
        longest = w
print(longest)`,
        ],
        hint: 'Set `longest`, loop, compare the lengths with an `if`, and update `longest` inside it. The `print` goes back to the left edge.',
        explain:
          '`longest` holds the best word so far. Each pass keeps the longer of the two, so after the loop it is `"banana"`. Keeping a *best so far* while you loop is a shape you will use again and again.',
        output: 'banana',
      },
    ],
  },

  // ── 5 ────────────────────────────────────────────────────────────────────
  {
    id: 'dicts-and-sets',
    title: 'Dicts and Sets',
    icon: '🔑',
    blurb: 'Instant lookups by key: dict, set, Counter and defaultdict.',
    minutes: 17,
    slides: [
      {
        kind: 'text',
        title: 'Look things up by key',
        body: `A **dict** (dictionary) maps **keys** to **values**, the way a phone book maps names to numbers: \`ages = {"ana": 31, "bo": 25}\`.

You look values up by key, not by position. Keys are unique and must be immutable (strings, numbers, tuples). Values can be anything, even lists or other dicts.`,
      },
      {
        kind: 'code',
        title: 'Dict basics',
        code: py`
ages = {"ana": 31, "bo": 25}
print(ages["ana"])
ages["cy"] = 40       # add a new key
ages["bo"] += 1       # update an existing one
print(ages)
print("bo" in ages, "zed" in ages)   # in checks keys
del ages["ana"]
print(len(ages))`,
        output: py`
31
{'ana': 31, 'bo': 26, 'cy': 40}
True False
2`,
      },
      {
        kind: 'type',
        title: 'Add a key',
        prompt: 'Add the key `"cy"` with the value `40` to the dict `ages`.',
        starter: 'ages = {"ana": 31, "bo": 25}',
        answer: 'ages["cy"] = 40',
        hint: 'Put the key in square brackets after `ages`, then assign the value with `=`.',
        explain:
          'Assigning to a key that is not there yet adds it. If the key were already there, the same line would replace its value.',
      },
      {
        kind: 'code',
        title: '.get() for safe lookups',
        body: '`d.get(key, default)` returns `default` when the key is missing. `count.get(x, 0) + 1` is the classic counting line.',
        code: py`
word = "banana"
count = {}
for ch in word:
    count[ch] = count.get(ch, 0) + 1
print(count)
print(count.get("z", 0))`,
        output: py`
{'b': 1, 'a': 3, 'n': 2}
0`,
      },
      {
        kind: 'quiz',
        q: 'With `d = {"a": 1}`, what does `d["b"]` do?',
        options: ['Returns `None`', 'Raises a `KeyError`', 'Returns `0`', 'Adds `"b"` with the value `None`'],
        answer: 1,
        explain:
          'Square brackets on a missing key crash the program. Use `d.get("b")` (gives `None`), `d.get("b", 0)`, or check `"b" in d` first.',
      },
      {
        kind: 'type',
        title: 'Look up safely',
        prompt: 'Print how many `"pear"` there are in `stock`, using `.get` so that a missing key gives `0`.',
        starter: 'stock = {"apple": 3, "plum": 7}',
        answer: 'print(stock.get("pear", 0))',
        hint: 'Give `.get` two things: the key, then the value to use when the key is missing.',
        explain:
          '`"pear"` is not a key in `stock`, so `.get` returns the default, 0, instead of raising a `KeyError` the way `stock["pear"]` would.',
        output: '0',
      },
      {
        kind: 'type',
        title: 'Count with a dict',
        prompt: 'Count how often each letter appears in `word`. Loop over `word` with the variable `ch`, and add 1 to `count[ch]` using `count.get(ch, 0)`. After the loop, print `count`.',
        starter: py`
word = "apple"
count = {}`,
        answer: py`
for ch in word:
    count[ch] = count.get(ch, 0) + 1
print(count)`,
        accept: [
          py`
for ch in word:
    count[ch] = 1 + count.get(ch, 0)
print(count)`,
        ],
        hint: 'The `print` starts at the left edge, outside the loop. After the line inside the loop, press Enter, then remove the indent (Backspace removes all 4 spaces at once).',
        explain:
          '`count.get(ch, 0)` is the count so far, or 0 the first time a letter shows up. Adding 1 and storing it back counts this letter. The `print` is not indented, so it runs once, after the loop.',
        output: "{'a': 1, 'p': 2, 'l': 1, 'e': 1}",
      },
      {
        kind: 'code',
        title: 'Looping over a dict',
        body: 'Looping over a dict gives its keys. Use `.items()` to get each key with its value. Dicts remember the order keys were added.',
        code: py`
stock = {"apple": 3, "pear": 0, "plum": 7}
for fruit in stock:
    print(fruit)
for fruit, n in stock.items():
    if n > 0:
        print(fruit, n)
print(list(stock.values()))`,
        output: py`
apple
pear
plum
apple 3
plum 7
[3, 0, 7]`,
      },
      {
        kind: 'type',
        title: 'Loop over items',
        prompt: 'Print the name of everyone in `scores` who scored `8` or more. Loop over `scores.items()` with the variables `name` and `score`.',
        starter: 'scores = {"ana": 9, "bo": 7, "cy": 8}',
        answer: py`
for name, score in scores.items():
    if score >= 8:
        print(name)`,
        accept: [
          py`
for name, score in scores.items():
    if 8 <= score:
        print(name)`,
        ],
        hint: '`.items()` gives each key together with its value, so the loop line is `for name, score in scores.items():`.',
        explain:
          'Each pass unpacks one key and its value into `name` and `score`. `"ana"` (9) and `"cy"` (8) pass the check; `"bo"` (7) does not.',
        output: py`
ana
cy`,
      },
      {
        kind: 'code',
        title: 'Sets: unique values only',
        body: 'A **set** is like a dict with keys but no values. It ignores duplicates and answers `in` instantly. Note that `{}` makes an empty *dict*, so use `set()`.',
        code: py`
seen = set()
seen.add(3)
seen.add(5)
seen.add(3)          # already there: no change
print(len(seen), 5 in seen, 9 in seen)
seen.remove(5)
print(seen)
print(set([1, 2, 2, 3, 3, 3]))
print({1, 2, 3} & {2, 3, 4}, {1, 2} | {2, 5})`,
        output: py`
2 True False
{3}
{1, 2, 3}
{2, 3} {1, 2, 5}`,
      },
      {
        kind: 'type',
        title: 'Use a set',
        prompt: 'Create an empty set called `seen`. Add `"a"` to it. Then print whether `"a"` is in `seen`.',
        answer: py`
seen = set()
seen.add("a")
print("a" in seen)`,
        hint: '`{}` would make an empty *dict*, so an empty set is written `set()`.',
        explain:
          '`set()` makes an empty set, `.add` puts a value in it, and `in` answers *is it there?* instantly. You will use exactly these three moves in dozens of problems.',
        output: 'True',
      },
      {
        kind: 'text',
        title: 'Why lookups are O(1)',
        body: `To answer \`x in nums\` for a **list**, Python checks the items one by one: up to n steps.

A dict or set first runs the key through a **hash function**, which turns it into a number pointing straight at a slot in an internal table. So lookups, inserts and deletes take about the same time for 10 items or 10 million: **O(1) on average**. Swapping a list search for a set lookup is the trick behind dozens of problems.`,
      },
      {
        kind: 'quiz',
        q: 'You will check `x in collection` 100,000 times, and the collection holds 100,000 numbers. What should the collection be?',
        options: ['A list', 'A set', 'A string of the numbers', 'It does not matter'],
        answer: 1,
        explain:
          'With a list, each check can take 100,000 steps: 10¹⁰ in total, far too slow. With a set, each check is O(1), so about 10⁵ steps overall.',
      },
      {
        kind: 'code',
        title: 'Tuples',
        body: 'A **tuple** is like a list that cannot change, written with parentheses. Because it is immutable, it can be a dict key or a set item, which makes it perfect for grid coordinates.',
        code: py`
point = (2, 5)
r, c = point            # unpack into two names
print(r, c)
visited = {(0, 0), (2, 5)}
print((2, 5) in visited)
a, b = 1, 2
a, b = b, a             # swap in one line
print(a, b)`,
        output: py`
2 5
True
2 1`,
      },
      {
        kind: 'type',
        title: 'Store a grid cell',
        prompt: 'Add the cell at row `r`, column `c` to the set `visited`, as a tuple. Then print whether `(1, 2)` is in `visited`.',
        starter: py`
visited = set()
r, c = 1, 2`,
        answer: py`
visited.add((r, c))
print((1, 2) in visited)`,
        accept: [
          py`
visited.add((r, c))
print((r, c) in visited)`,
        ],
        hint: 'A tuple is written with parentheses, so the call needs two pairs: one for `add(...)` and one for the tuple `(r, c)`.',
        explain:
          'Set items must be immutable. A tuple is, so `(r, c)` can go in a set; a list `[r, c]` cannot (`TypeError: unhashable type`). And `add` takes exactly one item: the tuple.',
        output: 'True',
      },
      {
        kind: 'code',
        title: 'Counter',
        body: '`Counter` builds a frequency dict in one line. Missing keys count as 0 instead of raising an error.',
        code: py`
from collections import Counter

c = Counter("mississippi")
print(c["s"], c["z"])
print(c.most_common(2))
print(Counter("listen") == Counter("silent"))`,
        output: py`
4 0
[('i', 4), ('s', 4)]
True`,
      },
      {
        kind: 'type',
        title: 'Count with Counter',
        prompt: 'Count the letters of `word` with `Counter`, storing the result in `c`. Then print the counts for `"l"` and `"z"` with one `print`.',
        starter: py`
from collections import Counter
word = "hello"`,
        answer: py`
c = Counter(word)
print(c["l"], c["z"])`,
        hint: '`Counter(word)` counts every letter at once. Then read a count with square brackets, as with a dict.',
        explain:
          '`"l"` appears twice. `"z"` never appears, but a `Counter` gives 0 for a missing key instead of raising a `KeyError`.',
        output: '2 0',
      },
      {
        kind: 'code',
        title: 'defaultdict',
        body: '`defaultdict(list)` creates an empty list the first time you touch a new key, so grouping needs no `if key in d` check. `defaultdict(int)` starts new keys at 0.',
        code: py`
from collections import defaultdict

groups = defaultdict(list)
for word in ["ant", "bee", "ape", "bat"]:
    groups[word[0]].append(word)
print(dict(groups))

counts = defaultdict(int)
counts["x"] += 1
print(counts["x"], counts["y"])`,
        output: py`
{'a': ['ant', 'ape'], 'b': ['bee', 'bat']}
1 0`,
      },
      {
        kind: 'type',
        title: 'First repeated letter',
        prompt: 'Print the first letter that shows up twice in `word`. Start an empty set called `seen` and loop over `word` with `ch`: if `ch` is already in `seen`, print it and `break`; otherwise add it to `seen`.',
        starter: 'word = "abcdbe"',
        answer: py`
seen = set()
for ch in word:
    if ch in seen:
        print(ch)
        break
    seen.add(ch)`,
        accept: [
          py`
seen = set()
for ch in word:
    if ch in seen:
        print(ch)
        break
    else:
        seen.add(ch)`,
        ],
        hint: 'Check `ch in seen` *before* adding `ch`. `seen.add(ch)` lines up with the `if`, not with `break`.',
        explain:
          'The set remembers every letter so far, and `in` checks it instantly. `a`, `b`, `c` and `d` are new; the second `b` is already in `seen`, so it is printed and the loop stops.',
        output: 'b',
      },
    ],
  },

  // ── 6 ────────────────────────────────────────────────────────────────────
  {
    id: 'functions-and-classes',
    title: 'Functions and Classes',
    icon: '🧩',
    blurb: 'def and return, nested helpers with nonlocal, and why answers live in class Solution.',
    minutes: 18,
    slides: [
      {
        kind: 'text',
        title: 'Functions name a piece of work',
        body: `A **function** packages steps you can reuse. You **define** it once with \`def\` and **call** it as often as you like.

The names in the definition are **parameters**; the values you pass in a call are **arguments**. \`return\` hands a result back to the caller and ends the function immediately. A function with no \`return\` gives back \`None\`.`,
      },
      {
        kind: 'code',
        title: 'def and return',
        code: py`
def area(width, height):
    return width * height

print(area(3, 4))
big = area(10, 10)
print(big + 1)

def greet(name):
    print("hi", name)    # prints, but returns nothing

result = greet("Sam")
print(result)`,
        output: py`
12
101
hi Sam
None`,
      },
      {
        kind: 'type',
        title: 'Call a function',
        prompt: 'In one line, print the result of calling `area` with a width of `3` and a height of `5`.',
        starter: py`
def area(width, height):
    return width * height`,
        answer: 'print(area(3, 5))',
        hint: 'Write the function name, then the arguments in parentheses, in the same order as the parameters. Wrap it all in `print(...)`.',
        explain:
          '`area(3, 5)` runs the function with `width` = 3 and `height` = 5. Its `return` hands back 15, and `print` shows it.',
        output: '15',
      },
      {
        kind: 'type',
        title: 'Finish a function',
        prompt: 'The first line of `double` is written for you. Write the line inside it that **returns** `n` times 2.',
        starter: 'def double(n):',
        answer: '    return n * 2',
        accept: ['    return 2 * n', '    return n + n'],
        hint: 'One line that starts with `return`.',
        explain:
          '`return` hands the result back to whoever called `double`, so `double(4)` gives 8. The line is indented because it belongs to the function.',
      },
      {
        kind: 'quiz',
        q: 'What does this print?',
        code: py`
def sign(x):
    if x > 0:
        return "pos"
    return "not pos"
    print("never")

print(sign(3), sign(-3))`,
        options: ['pos not pos', 'pos never', 'pos', 'not pos never'],
        answer: 0,
        explain:
          '`return` ends the function on the spot. `sign(3)` returns at the first `return`; `sign(-3)` at the second. The `print` after it can never run.',
      },
      {
        kind: 'type',
        title: 'Write a whole function',
        prompt: 'Write a function called `is_even` that takes one parameter, `n`, and returns `True` if `n` is even and `False` otherwise.',
        answer: py`
def is_even(n):
    return n % 2 == 0`,
        accept: [
          py`
def is_even(n):
    if n % 2 == 0:
        return True
    return False`,
          py`
def is_even(n):
    if n % 2 == 0:
        return True
    else:
        return False`,
        ],
        hint: 'A number is even when `n % 2 == 0`. That comparison is already `True` or `False`, so you can return it directly.',
        explain:
          'A comparison gives a boolean, so `return n % 2 == 0` hands back `True` for even numbers and `False` for odd ones. An `if` with two `return` lines works too; it is just longer.',
      },
      {
        kind: 'code',
        title: 'Default and keyword arguments',
        body: 'A parameter can have a default value. Never use a mutable default like `seen=[]`: that one list is shared by every call. Use `None` and create the list inside.',
        code: py`
def power(base, exp=2):
    return base ** exp

print(power(5))               # exp defaults to 2
print(power(2, 5))
print(power(exp=3, base=2))   # name the arguments`,
        output: py`
25
32
8`,
      },
      {
        kind: 'text',
        title: 'Scope: where names live',
        body: `Variables created inside a function are **local**: they vanish when it returns and never clash with names outside it.

A function defined *inside* another function can **read** the outer function's variables. You will see this shape constantly in tree and graph solutions: the outer method sets things up, and an inner helper (often called \`dfs\`) does the recursive work using the outer variables.`,
      },
      {
        kind: 'code',
        title: 'nonlocal',
        body: 'To **reassign** an outer variable from a nested function, declare it `nonlocal`. Without that, Python treats it as a brand-new local variable.',
        code: py`
def count_big(nums, limit):
    count = 0
    def check(n):
        nonlocal count      # use the outer count
        if n > limit:
            count += 1

    for n in nums:
        check(n)
    return count

print(count_big([5, 12, 7, 30], 6))`,
        output: '3',
      },
      {
        kind: 'quiz',
        q: 'What happens when you call `outer()`?',
        code: py`
def outer():
    total = 0
    def add(x):
        total += x
    add(5)
    return total`,
        options: ['It returns 5', 'It returns 0', 'It raises an UnboundLocalError', 'It returns None'],
        answer: 2,
        explain:
          '`total += x` reassigns `total`, so Python treats it as a local of `add`, one that has no value yet. Adding `nonlocal total` inside `add` fixes it.',
      },
      {
        kind: 'type',
        title: 'Fix the helper',
        prompt: 'Here is the helper from that quiz, without its body. Write the body of `add`: declare `total` as `nonlocal`, then add `x` to it.',
        starter: py`
def outer():
    total = 0
    def add(x):`,
        answer: py`
        nonlocal total
        total += x`,
        accept: [
          py`
        nonlocal total
        total = total + x`,
        ],
        hint: '`nonlocal total` goes on its own line, before the line that changes `total`.',
        explain:
          "`nonlocal total` tells Python that `total` is the outer function's variable, not a new local one, so `total += x` updates it instead of raising an `UnboundLocalError`.",
      },
      {
        kind: 'code',
        title: 'Mutating vs reassigning',
        body: 'You only need `nonlocal` to **reassign** a name. Changing a list or dict in place (`append`, `d[k] = v`) works without it, which is why many solutions keep a `res = []` and append to it from a helper.',
        code: py`
def collect(nums):
    res, best = [], 0
    def visit(n):
        nonlocal best
        res.append(n * 2)      # mutation: no nonlocal needed
        best = max(best, n)    # reassignment: needs nonlocal
    for n in nums:
        visit(n)
    return res, best

print(collect([4, 9, 1]))`,
        output: '([8, 18, 2], 9)',
      },
      {
        kind: 'text',
        title: 'Classes bundle data and behavior',
        body: `A **class** is a blueprint for objects. Each object (an **instance**) carries its own data in **attributes**, and has functions attached to it called **methods**.

You will meet classes in two places: the \`class Solution:\` wrapper LeetCode puts around every answer, and node types like \`ListNode\` and \`TreeNode\` that linked lists and trees are built from.`,
      },
      {
        kind: 'code',
        title: '__init__ and self',
        body: '`__init__` runs when you create an object. `self` is the object itself; Python passes it in automatically, so `a.bump()` really means `Tally.bump(a)`.',
        code: py`
class Tally:
    def __init__(self, start):
        self.value = start      # an attribute of this object

    def bump(self):
        self.value += 1
        return self.value

a = Tally(10)
b = Tally(0)
a.bump()
print(a.bump(), b.bump())`,
        output: '12 1',
      },
      {
        kind: 'type',
        title: 'Write a class',
        prompt: 'Write a class `Pet` whose `__init__` takes `name` and stores it in `self.name`. Then create `p = Pet("Rex")` and print `p.name`.',
        answer: py`
class Pet:
    def __init__(self, name):
        self.name = name
p = Pet("Rex")
print(p.name)`,
        hint: '`__init__` takes `self` first, then `name`. After the class, go back to the left edge to create the object.',
        explain:
          '`Pet("Rex")` makes a new object and runs `__init__` with `name` set to `"Rex"`, which saves it on the object as `self.name`. Afterward, `p.name` reads it back.',
        output: 'Rex',
      },
      {
        kind: 'code',
        title: 'Node classes',
        body: 'This is how LeetCode defines a linked-list node: a value plus a reference to the next node. `None` marks the end.',
        code: py`
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

head = ListNode(1, ListNode(2, ListNode(3)))
node = head
while node:
    print(node.val)
    node = node.next`,
        output: py`
1
2
3`,
      },
      {
        kind: 'code',
        title: 'Why class Solution?',
        body: 'LeetCode asks you to fill in one method of a `Solution` class, then creates an object and calls that method for each test. Hints like `List[int]` and `-> int` are only for readers; Python does not enforce them.',
        code: py`
from typing import List

class Solution:
    def maxValue(self, nums: List[int]) -> int:
        best = nums[0]
        for n in nums:
            best = max(best, n)
        return best

print(Solution().maxValue([3, 9, 4]))   # roughly what LeetCode does`,
        output: '9',
      },
      {
        kind: 'type',
        title: 'Fill in a LeetCode method',
        prompt: 'Make `minValue` return the **smallest** number in `nums`. Keep the smallest so far in `best`, starting at `nums[0]`. Loop with `n`, and update `best` with `min`.',
        starter: py`
class Solution:
    def minValue(self, nums: List[int]) -> int:`,
        answer: py`
        best = nums[0]
        for n in nums:
            best = min(best, n)
        return best`,
        accept: [
          py`
        best = nums[0]
        for n in nums:
            best = min(n, best)
        return best`,
          py`
        best = nums[0]
        for n in nums:
            if n < best:
                best = n
        return best`,
          py`
        best = nums[0]
        for n in nums:
            if best > n:
                best = n
        return best`,
        ],
        hint: 'It is the `maxValue` method from earlier, with `min` in place of `max`. The last line, `return best`, is not inside the loop.',
        explain:
          '`best` starts as the first number. Each pass keeps the smaller of `best` and `n`, so after the loop `best` is the smallest number, and the method returns it.',
      },
      {
        kind: 'type',
        title: 'Call a helper method',
        prompt: 'Make `countEvens` return how many numbers in `nums` are even. Start `count` at `0`, loop with `n`, and add `1` to `count` whenever the helper method `isEven` says `n` is even.',
        starter: py`
class Solution:
    def isEven(self, n: int) -> bool:
        return n % 2 == 0

    def countEvens(self, nums: List[int]) -> int:`,
        answer: py`
        count = 0
        for n in nums:
            if self.isEven(n):
                count += 1
        return count`,
        accept: [
          py`
        count = 0
        for n in nums:
            if self.isEven(n):
                count = count + 1
        return count`,
        ],
        hint: 'Inside a class, call another method through `self` with a dot. A bare `isEven(n)` raises a `NameError`.',
        explain:
          'Methods live on the object, so one method calls another as `self.isEven(n)`. Each even number adds 1 to `count`, and `return count` runs once, after the loop.',
      },
    ],
  },

  // ── 7 ────────────────────────────────────────────────────────────────────
  {
    id: 'big-o',
    title: 'Big-O: How Fast Is It?',
    icon: '📈',
    blurb: 'Describe how running time and memory grow, and read constraints like a pro.',
    minutes: 15,
    slides: [
      {
        kind: 'text',
        title: 'Why speed matters',
        body: `Two correct solutions can differ wildly in speed. On 100,000 items, one might finish in a blink while the other runs for minutes.

Interviewers care about how your code **scales** as the input grows, and LeetCode rejects slow answers with *Time Limit Exceeded*. **Big-O notation** is the shared language for describing that growth.`,
      },
      {
        kind: 'text',
        title: 'What Big-O means',
        body: `Big-O describes how the number of steps **grows** with the input size n, ignoring constant factors and smaller terms.

A loop doing 3 things per item is O(3n), which we simply call **O(n)**. A cost of n² + n + 50 is **O(n²)**: for large n, the n² part dwarfs the rest. Usually we describe the **worst case**.`,
      },
      {
        kind: 'text',
        title: 'The common classes',
        body: `From fastest to slowest:

- **O(1)** constant: index a list, look up a dict key
- **O(log n)** logarithmic: halve the problem each step (binary search)
- **O(n)** linear: one pass over the input
- **O(n log n)**: good sorting algorithms
- **O(n²)** quadratic: look at every pair (nested loops)
- **O(2ⁿ)** exponential: try every subset`,
      },
      {
        kind: 'code',
        title: 'Feel the difference',
        body: 'Steps needed for one million items. A computer manages very roughly 10⁷ to 10⁸ simple steps per second, so the n² version would run for hours.',
        code: py`
import math

n = 1_000_000
print("log n:  ", round(math.log2(n)))
print("n:      ", n)
print("n log n:", round(n * math.log2(n)))
print("n^2:    ", n * n)`,
        output: py`
log n:   20
n:       1000000
n log n: 19931569
n^2:     1000000000000`,
      },
      {
        kind: 'quiz',
        q: 'Simplify O(3n² + 5n + 100).',
        options: ['O(3n²)', 'O(n²)', 'O(n² + n)', 'O(n)'],
        answer: 1,
        explain: 'Drop the constant factor (3) and the smaller terms (5n and 100). The biggest-growing term, n², is all that is left.',
      },
      {
        kind: 'code',
        title: 'Counting loops',
        body: 'Loops one **after** another **add**. Loops **inside** each other **multiply**. Then keep only the biggest term.',
        code: py`
def f(nums):
    n = len(nums)
    total = 0
    for x in nums:            # n steps
        total += x
    for i in range(n):        # n times...
        for j in range(n):    # ...n steps each = n^2
            total += i * j
    return total

# O(n) + O(n^2) = O(n^2)`,
      },
      {
        kind: 'type',
        title: 'Count the steps of one loop',
        prompt: 'Count the work one loop does. Loop with `for i in range(n):` and add 1 to `steps` on each pass. After the loop, print `steps`.',
        starter: py`
n = 1000
steps = 0`,
        answer: py`
for i in range(n):
    steps += 1
print(steps)`,
        accept: [
          py`
for i in range(n):
    steps = steps + 1
print(steps)`,
        ],
        hint: 'The loop body is one indented line, `steps += 1`. The `print` goes after the loop, back at the left edge.',
        explain:
          'One pass does one step per item: 1,000 items, 1,000 steps. Double `n` and the steps double too. Work that grows in a straight line with the input is **O(n)**.',
        output: '1000',
      },
      {
        kind: 'type',
        title: 'Count the steps of a nested loop',
        prompt: 'Now put a loop inside the loop: `for i in range(n):` and, inside it, `for j in range(n):`. Add 1 to `steps` in the inner loop, then print `steps` after both loops.',
        starter: py`
n = 1000
steps = 0`,
        answer: py`
for i in range(n):
    for j in range(n):
        steps += 1
print(steps)`,
        accept: [
          py`
for i in range(n):
    for j in range(n):
        steps = steps + 1
print(steps)`,
        ],
        hint: '`steps += 1` is indented twice, because it belongs to the inner loop. The `print` is not indented at all.',
        explain:
          'The inner loop runs all 1,000 times for **each** of the 1,000 outer passes: 1,000 × 1,000 is a million steps. Double `n` and the work grows four times. That is **O(n²)**, the cost of looking at every pair.',
        output: '1000000',
      },
      {
        kind: 'code',
        title: 'Logarithmic: halving',
        body: 'When each step cuts the remaining work in half, even a million items take only about 20 steps. That is **O(log n)**: binary search, balanced trees and heaps all work this way.',
        code: py`
def halvings(n):
    steps = 0
    while n > 1:
        n //= 2
        steps += 1
    return steps

print(halvings(8), halvings(1024), halvings(1_000_000))`,
        output: '3 10 19',
      },
      {
        kind: 'type',
        title: 'Count the doublings',
        prompt: 'Doubling is halving in reverse. Loop with `while size < n:`, doubling `size` and adding 1 to `steps` on each pass. After the loop, print `steps`.',
        starter: py`
n = 1_000_000
size = 1
steps = 0`,
        answer: py`
while size < n:
    size *= 2
    steps += 1
print(steps)`,
        accept: [
          py`
while size < n:
    size = size * 2
    steps += 1
print(steps)`,
          py`
while size < n:
    size *= 2
    steps = steps + 1
print(steps)`,
          py`
while size < n:
    size = size * 2
    steps = steps + 1
print(steps)`,
          py`
while size < n:
    steps += 1
    size *= 2
print(steps)`,
        ],
        hint: 'Two lines inside the loop: `size *= 2` and `steps += 1`. The `print` goes after the loop, not inside it.',
        explain:
          'Starting from 1, doubling passes a million after just 20 steps, because 2²⁰ is about a million. A billion would take only 30. Halving and doubling loops both take about log₂ n steps: **O(log n)**.',
        output: '20',
      },
      {
        kind: 'quiz',
        q: 'What is the time complexity of this code?',
        code: py`
for i in range(n):
    j = 1
    while j < n:
        j *= 2`,
        options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(n²)'],
        answer: 2,
        explain:
          'The inner loop doubles `j` until it reaches n: O(log n) steps. It runs once for each of the n outer passes, so n × log n = **O(n log n)**.',
      },
      {
        kind: 'text',
        title: 'Space complexity',
        body: `Big-O also measures **extra memory**. A handful of variables is **O(1)** space. Building a set of all n items is **O(n)** space.

Recursion uses memory too: every call still waiting to finish sits on the call stack, so a recursion depth of d costs O(d). The input itself usually is not counted. Often you **trade space for time**: an O(n) set can turn an O(n²) search into O(n).`,
      },
      {
        kind: 'code',
        title: 'Trading space for time',
        code: py`
def has_dup_slow(nums):     # O(n^2) time, O(1) space
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] == nums[j]:
                return True
    return False

def has_dup_fast(nums):     # O(n) time, O(n) space
    return len(set(nums)) < len(nums)

print(has_dup_slow([4, 1, 4]), has_dup_fast([4, 1, 7]))`,
        output: 'True False',
      },
      {
        kind: 'text',
        title: 'Hidden costs in Python',
        body: `One line of Python is not always one step:

- \`x in some_list\`: **O(n)**, but \`x in some_set\` is O(1)
- \`lst.append(x)\`, \`lst.pop()\`: O(1)
- \`lst.pop(0)\`, \`lst.insert(0, x)\`: **O(n)**
- \`sorted(lst)\`: O(n log n)
- slicing \`lst[a:b]\`: O(b − a), because it copies
- \`min\`, \`max\`, \`sum\`: O(n)

Put a hidden O(n) inside a loop and you have O(n²).`,
      },
      {
        kind: 'type',
        title: 'Swap a list scan for a set',
        prompt: 'Checking `x in b` for every `x` in `a` scans the list `b` each time: O(n²). Make a set called `seen` from `b` instead. Then loop with `for x in a:` and print every `x` that is in `seen`.',
        starter: py`
a = [4, 9, 2, 7]
b = [7, 1, 4, 5]`,
        answer: py`
seen = set(b)
for x in a:
    if x in seen:
        print(x)`,
        hint: '`set(b)` builds the set in one pass. Inside the loop, `if x in seen:` is the fast check.',
        explain:
          'Building the set costs O(n) once, and each `x in seen` check is O(1), so the whole thing is **O(n)**. With `x in b`, it would be O(n) work inside an O(n) loop: O(n²). Spending a little memory to save that time is one of the most common moves in interviews.',
        output: py`
4
7`,
      },
      {
        kind: 'text',
        title: 'Read the constraints',
        body: `LeetCode tells you how big the input can be. Use it to guess the complexity the problem expects:

- n ≤ 10: O(n!) is fine (try every ordering)
- n ≤ 20: O(2ⁿ) (try every subset)
- n ≤ 500: O(n³)
- n ≤ 10⁴: O(n²) is fine
- n ≤ 10⁵ to 10⁶: aim for O(n log n) or O(n)
- huge, like 10⁹: O(log n) or O(1)`,
      },
      {
        kind: 'quiz',
        q: 'A problem says `1 <= nums.length <= 10⁵`. Your idea compares every pair of elements. What should you do?',
        options: [
          'Submit it: O(n²) is fine for 10⁵',
          'Look for an O(n log n) or O(n) approach',
          'Rewrite it with recursion to speed it up',
          'Nothing: Big-O does not apply to Python',
        ],
        answer: 1,
        explain: '10⁵ squared is 10¹⁰ steps, far too slow. At this size, aim for O(n log n) or O(n).',
      },
    ],
  },

  // ── 8 ────────────────────────────────────────────────────────────────────
  {
    id: 'recursion',
    title: 'Recursion',
    icon: '🌀',
    blurb: 'Functions that call themselves: base cases, the call stack, and trusting the recursion.',
    minutes: 18,
    slides: [
      {
        kind: 'text',
        title: 'A function that calls itself',
        body: `**Recursion** solves a problem by solving a smaller copy of the same problem. Every recursive function has two parts:

- **Base case:** an input so small you answer it directly, with no further calls.
- **Recursive step:** shrink the problem, call yourself on the smaller version, and use that answer.

Without a base case that is always reached, the calls never stop.`,
      },
      {
        kind: 'code',
        title: 'Countdown',
        code: py`
def countdown(n):
    if n == 0:              # base case
        print("liftoff")
        return
    print(n)
    countdown(n - 1)        # a smaller problem

countdown(3)`,
        output: py`
3
2
1
liftoff`,
      },
      {
        kind: 'code',
        title: 'Factorial',
        body: '5! means 5 × 4 × 3 × 2 × 1. Notice that 5! = 5 × 4!. That *same problem, one size smaller* shape is exactly what recursion captures.',
        code: py`
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))
print(factorial(1))`,
        output: py`
120
1`,
      },
      {
        kind: 'type',
        title: 'Write the recursive step',
        prompt: '`power(base, exp)` returns `base` multiplied by itself `exp` times. The base case is done. Write the last line: return `base` times `power` with one less `exp`.',
        starter: py`
def power(base, exp):
    if exp == 0:
        return 1`,
        answer: '    return base * power(base, exp - 1)',
        accept: ['    return power(base, exp - 1) * base'],
        hint: 'Copy the shape of `factorial`: `n * factorial(n - 1)`. This time the call keeps `base` and makes `exp` one smaller.',
        explain:
          '2⁴ is 2 × 2³, so `power(base, exp)` is `base * power(base, exp - 1)`. Each call makes `exp` one smaller until the base case returns 1.',
      },
      {
        kind: 'text',
        title: 'The call stack',
        body: `Every call gets its own **frame** on the **call stack**, with its own copy of \`n\`. \`factorial(4)\` pauses and waits for \`factorial(3)\`, which waits for \`factorial(2)\`, and so on down to the base case.

Then the answers flow back up: 1, 2, 6, 24. Each waiting frame uses memory, so a depth of d costs **O(d) space**. Python gives up at about 1000 frames with a \`RecursionError\`.`,
      },
      {
        kind: 'code',
        title: 'Watch the stack',
        body: 'Each level of indentation is one more call waiting on the stack.',
        code: py`
def fact(n, depth=0):
    pad = "  " * depth
    print(pad + f"fact({n})")
    if n <= 1:
        result = 1
    else:
        result = n * fact(n - 1, depth + 1)
    print(pad + f"-> {result}")
    return result

fact(3)`,
        output: py`
fact(3)
  fact(2)
    fact(1)
    -> 1
  -> 2
-> 6`,
      },
      {
        kind: 'quiz',
        q: 'What does this print?',
        code: py`
def mystery(n):
    if n == 0:
        return 0
    return n + mystery(n - 1)

print(mystery(4))`,
        options: ['10', '4', '24', '0'],
        answer: 0,
        explain: 'It adds n to the sum of everything below it: 4 + 3 + 2 + 1 + 0 = 10.',
      },
      {
        kind: 'type',
        title: 'Base case first',
        prompt: '`digit_sum(n)` adds up the digits of `n`, so `digit_sum(472)` is 13. Base case: if `n` is less than `10`, it is a single digit, so return `n`. Otherwise, return the last digit, `n % 10`, plus `digit_sum(n // 10)`.',
        starter: 'def digit_sum(n):',
        answer: py`
    if n < 10:
        return n
    return n % 10 + digit_sum(n // 10)`,
        accept: [
          py`
    if n < 10:
        return n
    return digit_sum(n // 10) + n % 10`,
          py`
    if n < 10:
        return n
    else:
        return n % 10 + digit_sum(n // 10)`,
          py`
    if n < 10:
        return n
    else:
        return digit_sum(n // 10) + n % 10`,
        ],
        hint: '`472 % 10` is 2, the last digit, and `472 // 10` is 47, the rest. The recursive call gets the smaller number.',
        explain:
          '`digit_sum(472)` is 2 + `digit_sum(47)`, which is 7 + `digit_sum(4)`, and 4 is a single digit: the base case. Each call drops one digit, so the calls always reach a number under 10 and stop.',
      },
      {
        kind: 'text',
        title: 'Trust the recursion',
        body: `Don't trace every call in your head. Instead:

- Say in words what the function **returns** for an input.
- Handle the smallest input directly.
- **Assume** the call on a smaller input already works, and build your answer from its result.

This leap of faith is how tree problems are solved. The height of a tree? 1 + the larger of the heights of its two subtrees. Done.`,
      },
      {
        kind: 'code',
        title: 'Recursion on a list',
        body: 'Slicing copies the list, so these are fine for learning but slow on big inputs. Real solutions pass an index instead.',
        code: py`
def total(nums):
    if not nums:                        # empty list sums to 0
        return 0
    return nums[0] + total(nums[1:])    # first + sum of the rest

def biggest(nums):
    if len(nums) == 1:
        return nums[0]
    return max(nums[0], biggest(nums[1:]))

print(total([4, 1, 6]), biggest([4, 9, 2]))`,
        output: '11 9',
      },
      {
        kind: 'quiz',
        q: 'What happens when this runs?',
        code: py`
def count(n):
    if n == 0:
        return 0
    return 1 + count(n - 2)

print(count(5))`,
        options: ['It prints 3', 'It prints 2', 'It raises a RecursionError', 'It prints 0'],
        answer: 2,
        explain:
          '5, 3, 1, -1, -3… `n` jumps right past 0, so the base case is never reached and Python eventually gives up. A safer base case is `if n <= 0`.',
      },
      {
        kind: 'type',
        title: 'A recursive function from scratch',
        prompt: 'Write `length(nums)`, which returns how many items are in `nums` **without** using `len`. If `nums` is empty, return `0`. Otherwise, return `1` plus the `length` of the rest of the list, `nums[1:]`.',
        answer: py`
def length(nums):
    if not nums:
        return 0
    return 1 + length(nums[1:])`,
        accept: [
          py`
def length(nums):
    if nums == []:
        return 0
    return 1 + length(nums[1:])`,
          py`
def length(nums):
    if not nums:
        return 0
    return length(nums[1:]) + 1`,
          py`
def length(nums):
    if nums == []:
        return 0
    return length(nums[1:]) + 1`,
          py`
def length(nums):
    if not nums:
        return 0
    else:
        return 1 + length(nums[1:])`,
          py`
def length(nums):
    if nums == []:
        return 0
    else:
        return 1 + length(nums[1:])`,
          py`
def length(nums):
    if not nums:
        return 0
    else:
        return length(nums[1:]) + 1`,
          py`
def length(nums):
    if nums == []:
        return 0
    else:
        return length(nums[1:]) + 1`,
        ],
        hint: 'It has the same shape as `total` from earlier: an empty-list base case, then one step plus a call on the rest.',
        explain:
          'An empty list has length 0: that is the base case. Any other list is one item plus the rest, and you trust the call on `nums[1:]` to measure the rest.',
      },
      {
        kind: 'type',
        title: 'Reverse a string',
        prompt: 'Write `reverse(s)`, which returns `s` backward: `""` if `s` is empty, otherwise `reverse(s[1:])` with the first character, `s[0]`, added on the end. Then, below the function, print `reverse("stressed")`.',
        answer: py`
def reverse(s):
    if s == "":
        return ""
    return reverse(s[1:]) + s[0]

print(reverse("stressed"))`,
        accept: [
          py`
def reverse(s):
    if not s:
        return ""
    return reverse(s[1:]) + s[0]

print(reverse("stressed"))`,
          py`
def reverse(s):
    if len(s) == 0:
        return ""
    return reverse(s[1:]) + s[0]

print(reverse("stressed"))`,
          py`
def reverse(s):
    if s == "":
        return ""
    else:
        return reverse(s[1:]) + s[0]

print(reverse("stressed"))`,
          py`
def reverse(s):
    if not s:
        return ""
    else:
        return reverse(s[1:]) + s[0]

print(reverse("stressed"))`,
          py`
def reverse(s):
    if len(s) == 0:
        return ""
    else:
        return reverse(s[1:]) + s[0]

print(reverse("stressed"))`,
        ],
        hint: 'It is `length` with a twist: the base case returns `""`, and the step puts `s[0]` **after** the reversed rest. The `print` line starts at the left edge.',
        explain:
          '`reverse("abc")` is `reverse("bc") + "a"`, which is `reverse("c") + "b" + "a"`, all the way down to the empty string. Trust the call to reverse the rest, then put the first character last.',
        output: 'desserts',
      },
      {
        kind: 'code',
        title: 'Fibonacci',
        body: 'Each Fibonacci number is the sum of the two before it: 0, 1, 1, 2, 3, 5, 8… This function makes **two** recursive calls.',
        code: py`
def fib(n):
    if n < 2:              # fib(0) = 0, fib(1) = 1
        return n
    return fib(n - 1) + fib(n - 2)

print([fib(i) for i in range(8)])
print(fib(20))`,
        output: py`
[0, 1, 1, 2, 3, 5, 8, 13]
6765`,
      },
      {
        kind: 'code',
        title: 'Why naive fib is O(2ⁿ)',
        body: 'Counting the calls for n = 10, 20 and 30: every call splits into two more, so the total explodes, about 120 times bigger for every 10 added to n. The same values get recomputed again and again.',
        code: py`
def count_calls(n):
    calls = 0
    def fib(k):
        nonlocal calls
        calls += 1
        if k < 2:
            return k
        return fib(k - 1) + fib(k - 2)
    fib(n)
    return calls

print(count_calls(10), count_calls(20), count_calls(30))`,
        output: '177 21891 2692537',
      },
      {
        kind: 'code',
        title: 'Memoization: remember answers',
        body: 'Store each answer the first time you compute it. Now every n is solved once: **O(n)**. Recursion plus memory is the heart of **dynamic programming**, a whole unit later on.',
        code: py`
def fib(n, memo):
    if n < 2:
        return n
    if n in memo:               # solved before? reuse it
        return memo[n]
    memo[n] = fib(n - 1, memo) + fib(n - 2, memo)
    return memo[n]

print(fib(50, {}))`,
        output: '12586269025',
      },
      {
        kind: 'quiz',
        q: 'Why is the plain recursive `fib(n)` so slow?',
        options: [
          'Recursion is always slow in Python',
          'It recomputes the same subproblems an exponential number of times',
          'Adding large numbers takes a long time',
          'Its base case is wrong',
        ],
        answer: 1,
        explain:
          '`fib(30)` makes about 2.7 million calls, mostly repeats. Remembering each result (memoization) cuts that to about 30 distinct subproblems.',
      },
      {
        kind: 'type',
        title: 'How deep is the tree?',
        prompt: 'Each `Node` has two children, `left` and `right`, which are `None` when missing. Write `depth(node)`: if `node is None`, return `0`; otherwise return `1` plus the `max` of the depths of `node.left` and `node.right`. Then print `depth(root)`.',
        starter: py`
class Node:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

# 1 -> 2 -> 4, and 1 -> 3
root = Node(1, Node(2, Node(4)), Node(3))`,
        answer: py`
def depth(node):
    if node is None:
        return 0
    return 1 + max(depth(node.left), depth(node.right))

print(depth(root))`,
        accept: [
          py`
def depth(node):
    if not node:
        return 0
    return 1 + max(depth(node.left), depth(node.right))

print(depth(root))`,
          py`
def depth(node):
    if node == None:
        return 0
    return 1 + max(depth(node.left), depth(node.right))

print(depth(root))`,
          py`
def depth(node):
    if node is None:
        return 0
    return max(depth(node.left), depth(node.right)) + 1

print(depth(root))`,
          py`
def depth(node):
    if not node:
        return 0
    return max(depth(node.left), depth(node.right)) + 1

print(depth(root))`,
          py`
def depth(node):
    if node == None:
        return 0
    return max(depth(node.left), depth(node.right)) + 1

print(depth(root))`,
          py`
def depth(node):
    if node is None:
        return 0
    else:
        return 1 + max(depth(node.left), depth(node.right))

print(depth(root))`,
          py`
def depth(node):
    if not node:
        return 0
    else:
        return 1 + max(depth(node.left), depth(node.right))

print(depth(root))`,
          py`
def depth(node):
    if node == None:
        return 0
    else:
        return 1 + max(depth(node.left), depth(node.right))

print(depth(root))`,
          py`
def depth(node):
    if node is None:
        return 0
    else:
        return max(depth(node.left), depth(node.right)) + 1

print(depth(root))`,
          py`
def depth(node):
    if not node:
        return 0
    else:
        return max(depth(node.left), depth(node.right)) + 1

print(depth(root))`,
          py`
def depth(node):
    if node == None:
        return 0
    else:
        return max(depth(node.left), depth(node.right)) + 1

print(depth(root))`,
        ],
        hint: 'Like `fib`, it makes two recursive calls, one for each child. Trust each call to measure its own subtree, then add 1 for `node` itself.',
        explain:
          'The path 1 → 2 → 4 has three levels, so the depth is 3. No need to trace every call: trust `depth` on each child and add one level for the node itself. This exact function solves *Maximum Depth of Binary Tree* in the trees unit.',
        output: '3',
      },
    ],
  },

  // ── 9 ────────────────────────────────────────────────────────────────────
  {
    id: 'data-structures-tour',
    title: 'A Tour of Data Structures',
    icon: '🧰',
    blurb: 'Arrays, hash maps, stacks, queues, linked lists, trees, heaps and graphs.',
    minutes: 20,
    slides: [
      {
        kind: 'text',
        title: 'Pick the right tool',
        body: `A **data structure** is a way of organizing data so that certain operations are fast. Many interview *aha* moments are really *use this structure instead*.

Here is a quick tour. Each one gets a full unit later; for now, remember **what it is great at** and the cost of its key operations.`,
      },
      {
        kind: 'text',
        title: 'Array (Python list)',
        body: `Values in a row, numbered from 0.

- Read or write by index: **O(1)**
- Append or pop at the end: **O(1)**
- Insert or delete at the front or middle: **O(n)**
- Search for a value: **O(n)**, or O(log n) with binary search if sorted

Great for ordered data, two pointers, sliding windows and prefix sums.`,
      },
      {
        kind: 'text',
        title: 'Hash map and hash set',
        body: `\`dict\` maps keys to values; \`set\` stores unique keys.

- Insert, delete, look up: **O(1)** on average
- Keys must be hashable; there is no ordering by value

Great for *have I seen this?*, counting, grouping, and remembering where something was. It is the single most useful structure in interviews.`,
      },
      {
        kind: 'type',
        title: 'Set: unique values, fast lookups',
        prompt: 'Make a set called `unique` from `nums`. Then print two things on one line: how many values `unique` holds, using `len`, and whether `7` is in it.',
        starter: 'nums = [4, 7, 4, 1, 7]',
        answer: py`
unique = set(nums)
print(len(unique), 7 in unique)`,
        hint: '`set(nums)` drops the repeats. `print(a, b)` prints both values with a space between them.',
        explain:
          'A set keeps one copy of each value, so the five numbers shrink to three: 4, 7 and 1. `7 in unique` is an O(1) lookup, where `7 in nums` would scan the whole list.',
        output: '3 True',
      },
      {
        kind: 'type',
        title: 'Hash map: count things',
        prompt: 'Count how often each number appears in `nums`. Loop with `for n in nums:` and add 1 to `count[n]` using `count.get(n, 0)`. After the loop, print `count[2]` and `count[7]` on one line.',
        starter: py`
nums = [2, 7, 2, 5, 2, 7]
count = {}`,
        answer: py`
for n in nums:
    count[n] = count.get(n, 0) + 1
print(count[2], count[7])`,
        accept: [
          py`
for n in nums:
    count[n] = 1 + count.get(n, 0)
print(count[2], count[7])`,
          py`
for n in nums:
    if n in count:
        count[n] += 1
    else:
        count[n] = 1
print(count[2], count[7])`,
        ],
        hint: '`count.get(n, 0)` is the count so far, or 0 the first time a number shows up. The `print` goes after the loop, at the left edge.',
        explain:
          '2 shows up three times and 7 twice. Each number costs one O(1) dict update, so counting everything is O(n). Counting like this is the first step in problems like *Valid Anagram* and *Top K Frequent Elements*.',
        output: '3 2',
      },
      {
        kind: 'code',
        title: 'Stack: last in, first out',
        body: 'Like a pile of plates: you only touch the top. Great for matching brackets, undo, *most recent unmatched thing* problems, and depth-first search without recursion.',
        code: py`
stack = []
stack.append("a")      # push: O(1)
stack.append("b")
stack.append("c")
print(stack.pop())     # pop the newest: O(1)
print(stack[-1])       # peek at the top
print(stack)`,
        output: py`
c
b
['a', 'b']`,
      },
      {
        kind: 'type',
        title: 'Use a list as a stack',
        prompt: 'Push `"x"` and then `"y"` onto `stack` with `append`. Then, in a single line, pop the top item and print it.',
        starter: 'stack = []',
        answer: py`
stack.append("x")
stack.append("y")
print(stack.pop())`,
        hint: '`stack.pop()` removes the top item and gives it back, so you can print it directly.',
        explain:
          '`append` pushes onto the top and `pop()` takes the newest item off, so the last one in, `"y"`, is the first one out.',
        output: 'y',
      },
      {
        kind: 'code',
        title: 'Queue: first in, first out',
        body: 'Like a line at a shop. Use `deque`, because `list.pop(0)` is O(n). Great for breadth-first search (BFS) and processing things in arrival order.',
        code: py`
from collections import deque

q = deque()
q.append("ann")        # join the back: O(1)
q.append("ben")
q.append("cat")
print(q.popleft())     # serve the front: O(1)
print(list(q))`,
        output: py`
ann
['ben', 'cat']`,
      },
      {
        kind: 'type',
        title: 'Serve a queue',
        prompt: '`"cy"` joins the back of the line: `append` it to `q`. Then, while `q` is not empty, take the name at the front with `popleft()` and print it.',
        starter: py`
from collections import deque

q = deque(["ann", "bo"])`,
        answer: py`
q.append("cy")
while q:
    print(q.popleft())`,
        accept: [
          py`
q.append("cy")
while len(q) > 0:
    print(q.popleft())`,
        ],
        hint: 'An empty deque counts as false, so `while q:` stops once everyone is served. `print(q.popleft())` removes and prints in one step.',
        explain:
          'First in, first out: the names leave in the order they arrived. This `while q:` loop with `popleft()` is the heart of breadth-first search (BFS), which you will write in the graphs unit.',
        output: py`
ann
bo
cy`,
      },
      {
        kind: 'quiz',
        q: 'You are checking whether brackets like `([]{})` are balanced. Each closing bracket must match the most recent unmatched opening bracket. Which structure fits?',
        options: ['Queue', 'Stack', 'Set', 'Heap'],
        answer: 1,
        explain: '*Most recent first* is exactly last in, first out. Push each opener; on a closer, pop and check that they match.',
      },
      {
        kind: 'code',
        title: 'Linked list',
        body: 'Nodes joined by `next` pointers. There is no indexing: reaching item k means walking k steps. But once you hold a node, inserting or removing next to it is O(1), because you just rewire pointers.',
        code: py`
class ListNode:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next

head = ListNode(1, ListNode(2, ListNode(3)))
head = ListNode(0, head)        # insert at the front: O(1)
node, vals = head, []
while node:                     # walk it: O(n)
    vals.append(node.val)
    node = node.next
print(vals)`,
        output: '[0, 1, 2, 3]',
      },
      {
        kind: 'type',
        title: 'Walk a linked list',
        prompt: 'Print every value in the list, front to back, one per line. Use a variable called `node` that starts at `head`, and move it along with `.next` inside a `while` loop.',
        starter: py`
class ListNode:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next

head = ListNode(1, ListNode(2, ListNode(3)))`,
        answer: py`
node = head
while node:
    print(node.val)
    node = node.next`,
        accept: [
          py`
node = head
while node is not None:
    print(node.val)
    node = node.next`,
          py`
node = head
while node != None:
    print(node.val)
    node = node.next`,
        ],
        hint: 'Inside the loop: print `node.val`, then step with `node = node.next`. Forget the step and the loop never ends.',
        explain:
          '`node` starts at the first node. Each pass prints its value and steps to the next node. After the last one, `node` is `None`, which counts as false, so the loop stops.',
        output: py`
1
2
3`,
      },
      {
        kind: 'code',
        title: 'Binary tree',
        body: 'Each node has up to two children. In a **binary search tree**, everything on the left is smaller and everything on the right is larger, so a balanced one finds values in O(log n). Trees are usually walked with recursion.',
        code: py`
class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

#      5
#    3   8
root = TreeNode(5, TreeNode(3), TreeNode(8))
print(root.val, root.left.val, root.right.val)
print(root.left.left)`,
        output: py`
5 3 8
None`,
      },
      {
        kind: 'code',
        title: 'Heap: always grab the smallest',
        body: 'A heap (priority queue) keeps the smallest item on top without fully sorting. Great for *top k*, *k-th largest*, merging sorted lists and shortest paths. Python’s `heapq` is a min-heap; for a max-heap, push negated values.',
        code: py`
import heapq

h = []
for x in [7, 2, 9, 4]:
    heapq.heappush(h, x)     # O(log n)
print(h[0])                  # peek at the min: O(1)
print(heapq.heappop(h))      # remove the min: O(log n)
print(heapq.heappop(h))`,
        output: py`
2
2
4`,
      },
      {
        kind: 'type',
        title: 'Pop the smallest, again and again',
        prompt: 'Push every `x` in `nums` onto the heap `h` with `heapq.heappush`. Then, while `h` is not empty, pop the smallest with `heapq.heappop` and print it.',
        starter: py`
import heapq

nums = [5, 1, 8, 3]
h = []`,
        answer: py`
for x in nums:
    heapq.heappush(h, x)
while h:
    print(heapq.heappop(h))`,
        accept: [
          py`
for x in nums:
    heapq.heappush(h, x)
while len(h) > 0:
    print(heapq.heappop(h))`,
        ],
        hint: '`heapq.heappush(h, x)` takes the heap first, then the value. The `while` loop starts at the left edge, after the `for` loop.',
        explain:
          'Each pop takes the smallest item left, so the numbers come out in sorted order, and every push and pop costs only O(log n). For a max-heap, push `-x` and flip the sign back when you pop.',
        output: py`
1
3
5
8`,
      },
      {
        kind: 'quiz',
        q: 'You need the 3 largest numbers from a stream of a million numbers, using very little memory. Which structure fits best?',
        options: ['A stack', 'A heap that never holds more than 3 items', 'A queue', 'A linked list'],
        answer: 1,
        explain:
          'Keep a min-heap of size 3. When a new number beats the smallest of your top 3 (the heap top), swap it in. Each step is O(log 3), and memory stays tiny.',
      },
      {
        kind: 'code',
        title: 'Graph: adjacency list',
        body: 'A graph is nodes joined by edges: cities and roads, people and friendships, courses and prerequisites. Store each node’s neighbors in a list. Visiting everything with BFS or DFS costs O(V + E). A grid is a graph too.',
        code: py`
from collections import defaultdict

edges = [("A", "B"), ("A", "C"), ("B", "D")]
graph = defaultdict(list)
for u, v in edges:
    graph[u].append(v)
    graph[v].append(u)      # undirected: both directions
print(graph["A"])
print(graph["B"])`,
        output: py`
['B', 'C']
['A', 'D']`,
      },
      {
        kind: 'type',
        title: 'Build an adjacency list',
        prompt: 'Fill in `graph` from `edges`. Loop with `for u, v in edges:` and add every edge **both ways**. After the loop, print `graph[2]`.',
        starter: py`
from collections import defaultdict

edges = [(1, 2), (2, 3)]
graph = defaultdict(list)`,
        answer: py`
for u, v in edges:
    graph[u].append(v)
    graph[v].append(u)
print(graph[2])`,
        accept: [
          py`
for u, v in edges:
    graph[v].append(u)
    graph[u].append(v)
print(graph[2])`,
        ],
        hint: 'Inside the loop, `graph[u].append(v)` and its mirror image. The `print` goes after the loop, so it is not indented.',
        explain:
          "Each edge joins two nodes, so `v` goes in `u`'s list and `u` goes in `v`'s list. Node 2 is on both edges, so its neighbors are `[1, 3]`.",
        output: '[1, 3]',
      },
      {
        kind: 'text',
        title: 'Cheat sheet',
        body: `- Fast lookup, counting, grouping: **hash map / set**
- Most recent first: **stack**
- Oldest first, or BFS: **queue** (\`deque\`)
- Smallest or largest, again and again: **heap**
- Hierarchies, sorted data: **tree**
- Things connected to other things: **graph**
- Words that share prefixes: **trie** (its own unit later)`,
      },
      {
        kind: 'quiz',
        q: 'Which of these operations is O(n) rather than O(1)?',
        options: ['`d[key]` on a dict', '`stack.append(x)` on a list', '`nums.insert(0, x)` on a list', '`q.popleft()` on a deque'],
        answer: 2,
        explain:
          'Inserting at the front of a list shifts every other element one place to the right. The other three are O(1).',
      },
    ],
  },

  // ── 10 ───────────────────────────────────────────────────────────────────
  {
    id: 'solving-a-problem',
    title: 'How to Solve a Problem',
    icon: '🧠',
    blurb: 'A repeatable framework from first read to tested, explained code.',
    minutes: 16,
    slides: [
      {
        kind: 'text',
        title: 'Have a process',
        body: `When a problem is new and the clock is ticking, a fixed routine keeps you from freezing. Use the same one every time:

- Understand and clarify
- Work examples by hand
- Brute force first
- Spot the pattern
- Optimize, then code
- Test with edge cases
- State the complexity

And the whole time: **think out loud**.`,
      },
      {
        kind: 'text',
        title: 'Step 1: Understand and clarify',
        body: `Restate the problem in your own words, then ask questions **before** coding:

- Can the input be empty? How large can it get?
- Can values be negative, zero or repeated?
- Is the input sorted?
- What should I return if there is no answer?

Interviewers often leave details vague *on purpose*, to see whether you ask.`,
      },
      {
        kind: 'text',
        title: 'Example: first repeat',
        body: `*Given a string, return the first character that repeats.*

For \`"abcbad"\`, is the answer \`"b"\` (the first character to show up a **second time**) or \`"a"\` (the earliest character that **has** a duplicate)? Both readings are reasonable! One question settles it.

Say the interviewer means \`"b"\`, and that you should return \`""\` when nothing repeats.`,
      },
      {
        kind: 'quiz',
        q: 'A problem asks for two numbers in a list that add up to a target. Which clarifying question is most useful?',
        options: [
          'Am I allowed to use Python?',
          'Can I use the same element twice, and can values repeat?',
          'What is the time limit in milliseconds?',
          'Should I use a for loop or a while loop?',
        ],
        answer: 1,
        explain:
          'It changes what counts as a valid answer and exposes edge cases like `[3, 3]` with target 6. The other questions do not affect your approach.',
      },
      {
        kind: 'text',
        title: 'Steps 2 and 3: examples, then brute force',
        body: `Work a small example by hand and notice what **you** did. For \`"abcbad"\` you scan left to right, and at each letter you glance back to see whether it appeared before. That is already an algorithm!

Say the brute force out loud, with its cost. It proves you can solve the problem, and it gives you something concrete to improve.`,
      },
      {
        kind: 'code',
        title: 'Brute force',
        body: 'Correct, but O(n²) time: for each character we re-scan everything before it.',
        code: py`
def first_repeat(s):
    for j in range(len(s)):
        for i in range(j):          # look back at everything before j
            if s[i] == s[j]:
                return s[j]
    return ""

print(first_repeat("abcbad"), repr(first_repeat("xyz")))`,
        output: "b ''",
      },
      {
        kind: 'type',
        title: 'Brute force: pair sum',
        prompt: 'New problem: return the indices `[i, j]` of two different numbers in `nums` that add up to `target`, or `[]` if none do. Try every pair: `for i in range(len(nums)):` and, inside it, `for j in range(i + 1, len(nums)):`.',
        starter: 'def pair_sum(nums, target):',
        answer: py`
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []`,
        hint: 'Inside both loops, check `if nums[i] + nums[j] == target:` and return `[i, j]`. The final `return []` lines up with the first `for`.',
        explain:
          'Starting `j` at `i + 1` checks each pair once and never pairs a number with itself. It is correct, and saying it out loud first is smart, but it is O(n²): 10,000 numbers means about 50 million pairs.',
      },
      {
        kind: 'text',
        title: 'Step 4: Spot the pattern',
        body: `Ask: *what is the brute force doing over and over?* Here the inner loop only **searches** for something we have already seen. Repeated searching is a signal for a **hash set**.

Other common signals:
- sorted input: binary search or two pointers
- contiguous subarray or substring: sliding window
- all combinations or permutations: backtracking
- top k, k-th largest: heap
- number of ways, min or max cost: dynamic programming`,
      },
      {
        kind: 'code',
        title: 'Steps 5 and 6: optimize and code',
        body: 'Explain the idea **before** you type, then write clean code with clear names. Now it is O(n) time and O(n) space.',
        code: py`
def first_repeat(s):
    seen = set()
    for ch in s:
        if ch in seen:      # O(1) instead of an inner loop
            return ch
        seen.add(ch)
    return ""

print(first_repeat("abcbad"))`,
        output: 'b',
      },
      {
        kind: 'type',
        title: 'Optimize: pair sum with a hash map',
        prompt: 'Now in one pass: loop with `for i, x in enumerate(nums):` and keep a dict `seen` from each number to its index. If the partner, `target - x`, is in `seen`, return `[seen[target - x], i]`; otherwise store `seen[x] = i`. Return `[]` after the loop.',
        starter: 'def pair_sum(nums, target):',
        answer: py`
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []`,
        accept: [
          py`
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        else:
            seen[x] = i
    return []`,
          py`
    seen = dict()
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []`,
          py`
    seen = dict()
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        else:
            seen[x] = i
    return []`,
        ],
        hint: 'Check for the partner **before** you store `x`, so a number never pairs with itself. `seen = {}` makes an empty dict.',
        explain:
          'One O(1) dict lookup replaces the whole inner loop: *have I already seen the partner, and where?* That makes it O(n) time and O(n) space. This is *Two Sum*, which you will meet again in the first unit.',
      },
      {
        kind: 'quiz',
        q: 'A problem asks for the longest **contiguous substring** with no repeated letters. Which pattern does that wording point to?',
        options: ['Heap', 'Sliding window', 'Backtracking', 'Binary search'],
        answer: 1,
        explain:
          '*Contiguous* subarray or substring, plus *longest* or *shortest*, is the classic sliding-window signal: grow the window on the right, shrink it from the left.',
      },
      {
        kind: 'text',
        title: 'Step 7: Test it yourself',
        body: `Don't just say *I think it works*. Pick a small example and walk through your code line by line, tracking the variables out loud.

Then try edge cases: empty input, one element, everything the same, no valid answer, negative numbers, the largest size. Catching your own bug in an interview counts **for** you, not against you.`,
      },
      {
        kind: 'code',
        title: 'Edge cases in action',
        code: py`
def first_repeat(s):
    seen = set()
    for ch in s:
        if ch in seen:
            return ch
        seen.add(ch)
    return ""

for s in ["", "a", "aa", "abc", "abba"]:
    print(repr(s), "->", repr(first_repeat(s)))`,
        output: py`
'' -> ''
'a' -> ''
'aa' -> 'a'
'abc' -> ''
'abba' -> 'b'`,
      },
      {
        kind: 'type',
        title: 'Test the edge cases',
        prompt: '`assert` stops the program with an error when what follows it is false. Write three: `pair_sum([], 5)` is `[]`, `pair_sum([5], 10)` is `[]`, and `pair_sum([5, 5], 10)` is `[0, 1]`. Then print `all tests pass`.',
        starter: py`
def pair_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []`,
        answer: py`
assert pair_sum([], 5) == []
assert pair_sum([5], 10) == []
assert pair_sum([5, 5], 10) == [0, 1]
print("all tests pass")`,
        hint: 'Each line reads `assert pair_sum(...) == expected`. Compare with `==`, not `=`.',
        explain:
          'An empty list, a single number (which must not pair with itself) and a repeated value are exactly the cases the clarifying questions uncovered. If any `assert` failed, Python would stop with an `AssertionError` before the `print`.',
        output: 'all tests pass',
      },
      {
        kind: 'text',
        title: 'Step 8: State the complexity, and keep talking',
        body: `Finish with something like: *This is O(n) time, because each character is handled once with O(1) set operations, and O(n) space for the set.*

Throughout, **think out loud**. Interviewers grade your reasoning, not just the final code. If you are stuck, say what you are considering and why. A hint taken well beats silence every time.`,
      },
      {
        kind: 'quiz',
        q: 'Your code is written and there are 5 minutes left. What is the best use of them?',
        options: [
          'Start over with a completely different approach',
          'Trace an example through the code and check edge cases, out loud',
          'Quietly rename variables',
          'Ask the interviewer whether you passed',
        ],
        answer: 1,
        explain:
          'Testing out loud shows rigor and often catches a real bug. Finding and fixing it yourself is a strong signal.',
      },
      {
        kind: 'type',
        title: 'Solve one from scratch',
        prompt: `Write \`has_duplicate(nums)\`: return \`True\` if any number appears more than once in \`nums\`, and \`False\` otherwise.

Use the same idea as \`first_repeat\`: walk through \`nums\` with the loop variable \`n\`, and remember what you have seen in a set called \`seen\`.`,
        answer: py`
def has_duplicate(nums):
    seen = set()
    for n in nums:
        if n in seen:
            return True
        seen.add(n)
    return False`,
        accept: [
          py`
def has_duplicate(nums):
    seen = set()
    for n in nums:
        if n in seen:
            return True
        else:
            seen.add(n)
    return False`,
          py`
def has_duplicate(nums):
    return len(set(nums)) < len(nums)`,
          py`
def has_duplicate(nums):
    return len(set(nums)) != len(nums)`,
          py`
def has_duplicate(nums):
    return len(nums) > len(set(nums))`,
          py`
def has_duplicate(nums):
    return len(nums) != len(set(nums))`,
        ],
        hint: 'The `def` line, an empty set, the loop, an `if n in seen:` that returns `True`, then `seen.add(n)`. After the loop, `return False`.',
        explain:
          'Each number is checked against `seen` in O(1), so the whole function is **O(n)** time and O(n) space, instead of O(n²) for comparing every pair. This is also Contains Duplicate, the first problem in the Arrays & Hashing unit.',
      },
    ],
  },

  // ── 11 ───────────────────────────────────────────────────────────────────
  {
    id: 'leetcode-mechanics',
    title: 'How LeetCode Works',
    icon: '💻',
    blurb: 'Starter signatures, running tests, reading constraints and catching edge cases.',
    minutes: 13,
    slides: [
      {
        kind: 'text',
        title: 'Anatomy of a problem',
        body: `Every problem has a **description**, a few **examples** (input and expected output), **constraints** (limits on sizes and values), and an editor with **starter code**.

You fill in the function. LeetCode then runs it against many hidden tests, including nasty edge cases. Pass them all within the time limit and you get **Accepted**.`,
      },
      {
        kind: 'code',
        title: 'The starter code',
        body: 'You write only the body: never rename the method or change its parameters. On LeetCode, `List`, `Optional`, `collections` and `heapq` are already imported; here we import `List` so the snippet runs on its own.',
        code: py`
from typing import List

class Solution:
    def twoLargestSum(self, nums: List[int]) -> int:
        nums = sorted(nums)
        return nums[-1] + nums[-2]

# Roughly what LeetCode does behind the scenes:
sol = Solution()
print(sol.twoLargestSum([5, 1, 9, 3]))`,
        output: '14',
      },
      {
        kind: 'type',
        title: 'Write a method',
        prompt: 'Inside `class Solution`, write a method called `largest`. It takes `self` and `nums`, typed `List[int]`, and returns an `int`. Its body returns `max(nums)`.',
        starter: py`
from typing import List

class Solution:`,
        answer: py`
    def largest(self, nums: List[int]) -> int:
        return max(nums)`,
        hint: 'Copy the shape of `twoLargestSum`: `self` first, then `nums: List[int]`, then `-> int` and a colon. The body is indented one more level.',
        explain:
          '`self` always comes first in a method, and LeetCode passes it for you. `nums: List[int]` and `-> int` are type hints: they say what goes in and what comes out, but Python does not enforce them.',
      },
      {
        kind: 'text',
        title: "Return, don't print",
        body: `Your method must **return** the answer. Printing it does nothing for the grader (prints only show up in the output panel, which is handy for debugging).

Return the right **type**, too: \`True\` or \`False\` for a yes/no question, an int for *how many*, a list for *return all*. Some problems say *modify the input in place*: then you change it and return nothing.`,
      },
      {
        kind: 'type',
        title: 'Fix it: return the answer',
        prompt: 'This `isEven` used `print(n % 2 == 0)`, so it returned `None` and failed every test. Write its body so it **returns** whether `n` is even.',
        starter: py`
class Solution:
    def isEven(self, n: int) -> bool:`,
        answer: '        return n % 2 == 0',
        accept: [
          py`
        if n % 2 == 0:
            return True
        return False`,
          py`
        if n % 2 == 0:
            return True
        else:
            return False`,
        ],
        hint: 'Keep the same check, `n % 2 == 0`, and hand it back with `return` instead of `print`.',
        explain:
          'The grader only sees what a method **returns**. `n % 2 == 0` is already `True` or `False`, so you can return it directly. (It works for negative numbers too.)',
      },
      {
        kind: 'text',
        title: 'Run before you submit',
        body: `Click **Run** to try the given examples first, then add your own custom tests, especially tiny ones and edge cases.

When a test fails, LeetCode shows the input, your output and the expected output. Read all three, trace your code on that exact input, and fix the real cause. Don't just patch that one case with an \`if\`.`,
      },
      {
        kind: 'type',
        title: 'Call it like LeetCode does',
        prompt: 'Test the method yourself: make a `Solution` object called `sol`, then print `sol.largest([3, 8, 5])`.',
        starter: py`
from typing import List

class Solution:
    def largest(self, nums: List[int]) -> int:
        return max(nums)`,
        answer: py`
sol = Solution()
print(sol.largest([3, 8, 5]))`,
        accept: ['print(Solution().largest([3, 8, 5]))'],
        hint: '`Solution()`, with parentheses, makes the object. Then call the method on it with a dot: `sol.largest(...)`.',
        explain:
          'You pass only `nums`: Python fills in `self` with `sol`. LeetCode runs your code the same way on every test, and running it yourself on tiny inputs is the fastest way to find a bug.',
        output: '8',
      },
      {
        kind: 'text',
        title: 'Constraints are hints',
        body: `The constraints quietly tell you which solution is expected:

- \`1 <= nums.length <= 10⁵\`: you need O(n log n) or better
- \`1 <= n <= 20\`: trying every subset (2ⁿ) is probably intended
- \`-10⁹ <= nums[i] <= 10⁹\`: values can be negative and huge, so don't build an array indexed by value
- *the array is sorted*: think binary search or two pointers`,
      },
      {
        kind: 'quiz',
        q: 'The constraints say `1 <= n <= 15`. What does that suggest?',
        options: [
          'You must find an O(log n) solution',
          'An exponential approach, like trying every subset, is probably fine',
          'The input is sorted',
          'You must use a heap',
        ],
        answer: 1,
        explain:
          '2¹⁵ is only 32,768. Such a tiny limit is a strong hint that brute-force search, such as backtracking, is the intended solution.',
      },
      {
        kind: 'text',
        title: 'Edge cases to always check',
        body: `- **Empty** input: \`[]\` or \`""\`
- **One** element
- **Duplicates**: \`[2, 2, 2]\`
- **Negatives** and zero
- Already sorted, or sorted in reverse
- The answer at the very start or very end
- The **largest** allowed input (is it fast enough?)

Check the constraints to see which can really happen: \`1 <= nums.length\` rules out empty input.`,
      },
      {
        kind: 'type',
        title: 'Handle an empty input',
        prompt: '`average` divides by `len(nums)`, so an empty list would crash it. Handle that first: if `nums` is empty, return `0.0`. Otherwise, return `sum(nums) / len(nums)`.',
        starter: py`
from typing import List

class Solution:
    def average(self, nums: List[int]) -> float:`,
        answer: py`
        if not nums:
            return 0.0
        return sum(nums) / len(nums)`,
        accept: [
          py`
        if len(nums) == 0:
            return 0.0
        return sum(nums) / len(nums)`,
          py`
        if nums == []:
            return 0.0
        return sum(nums) / len(nums)`,
          py`
        if not nums:
            return 0.0
        else:
            return sum(nums) / len(nums)`,
          py`
        if len(nums) == 0:
            return 0.0
        else:
            return sum(nums) / len(nums)`,
          py`
        if nums == []:
            return 0.0
        else:
            return sum(nums) / len(nums)`,
        ],
        hint: 'An empty list counts as false, so `if not nums:` catches it. Put the check **before** the division.',
        explain:
          'Without the check, `average([])` divides by zero and LeetCode reports a **Runtime Error**. Handling the edge case first, then the normal case, keeps the main logic clean.',
      },
      {
        kind: 'code',
        title: 'A bug only negatives reveal',
        body: 'The largest product of two numbers should be 90 for the second list: two big negatives multiply to a big positive. Testing with negatives exposed the bug.',
        code: py`
def max_product(nums):
    nums = sorted(nums)
    return nums[-1] * nums[-2]      # the two largest

print(max_product([3, 5, 2]))
print(max_product([-10, -9, 1, 2]))   # wrong!`,
        output: py`
15
2`,
      },
      {
        kind: 'code',
        title: 'The fix',
        body: 'The best pair is either the two largest numbers or the two smallest (most negative). Check both.',
        code: py`
def max_product(nums):
    nums = sorted(nums)
    return max(nums[-1] * nums[-2],     # two largest
               nums[0] * nums[1])       # two most negative

print(max_product([3, 5, 2]))
print(max_product([-10, -9, 1, 2]))`,
        output: py`
15
90`,
      },
      {
        kind: 'quiz',
        q: 'Your code assumes the list has at least two elements. Which test would expose that?',
        options: ['`[1, 2, 3]`', '`[7]`', '`[5, 5]`', '`[-1, -2]`'],
        answer: 1,
        explain:
          'With a single element, `nums[-2]` is out of range and the code crashes. Always try the smallest input the constraints allow.',
      },
      {
        kind: 'text',
        title: 'Reading the verdict',
        body: `- **Wrong Answer**: a logic bug. Study the failing input.
- **Time Limit Exceeded**: correct but too slow. Compare your Big-O with the constraints, and hunt for hidden O(n) work inside loops.
- **Runtime Error**: a crash, often an index out of range, a missing dict key, using \`.next\` on \`None\`, or recursion that is too deep.
- **Accepted**: well done! Now ask whether it could be simpler.`,
      },
      {
        kind: 'quiz',
        q: 'Your solution gets **Time Limit Exceeded** on a test with 100,000 items. What is the most likely culprit?',
        options: [
          'A typo in a variable name',
          'A `list.pop(0)` or an `x in some_list` inside a loop',
          'Returning the answer instead of printing it',
          'Using too many comments',
        ],
        answer: 1,
        explain:
          'Each of those is O(n), so inside a loop of n items the whole thing becomes O(n²): about 10¹⁰ steps here. Use a `deque` or a `set` instead.',
      },
      {
        kind: 'text',
        title: "You're ready",
        body: `That's the foundations done. Next come the pattern units: each starts with a short guide and template, then guided problems from easiest to hardest, and every problem you finish joins your daily drills.

Start with **Arrays & Hashing**. You already know its secret weapon: the set. Come back tomorrow and keep the streak going.`,
      },
    ],
  },
];
