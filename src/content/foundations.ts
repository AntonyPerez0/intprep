// ─────────────────────────────────────────────────────────────────────────────
// Foundations: the beginner track.
//
// Takes a learner from zero Python to ready-for-the-pattern-units. Every code
// slide is real Python; when it prints, `output` is exactly what python3 prints.
// Quizzes are spread through each lesson so learners retrieve as they go.
// ─────────────────────────────────────────────────────────────────────────────
import { py, type Lesson } from './types';
import { EXTRA_LESSONS } from './foundations-extra';

const BASE: Lesson[] = [
  // ── 1 ────────────────────────────────────────────────────────────────────
  {
    id: 'how-to-learn',
    title: 'How IntPrep Works',
    icon: '🧭',
    blurb: 'Learn a pattern, build the code, then review it a little every day.',
    minutes: 10,
    slides: [
      {
        kind: 'text',
        title: 'Welcome to IntPrep',
        body: `Coding interviews can feel like a test of genius. They aren't. The 150 classic problems are built from **18 reusable patterns**, and once you know a pattern, the problems that use it start to look familiar.

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

- **Learn a pattern.** A short guide explains the idea, the **clue words** that point to it (wording like "k-th largest" or "sorted"), and a reusable code template, then you fill in its missing lines.
- **Solve guided problems.** Hints first, then you build a clean solution one part at a time.
- **Memorize in steps.** Each pattern and each solution has a short list: know its clue words, rebuild the code from cues, fill in its gaps, then write it from a blank file. The list always shows your next step.
- **Review daily.** Quick spaced-repetition reviews bring each problem back just before you would forget it: spot the pattern, then recall the code.

New code starts as choices: you put its lines in order or pick each missing line from a few options. Once you know it, you type it yourself.

Little and often wins: 25 minutes a day beats a three-hour cram on Sunday, and you never have to plan what to review. Just clear today's reviews.`,
      },
      {
        kind: 'text',
        title: "Test yourself, don't reread",
        body: `Rereading feels productive because the page looks familiar. But *recognizing* an answer is not the same as *recalling* it, and in an interview there is no page.

Every time you pull an idea out of memory (writing a line of code, filling in a missing line, rebuilding a solution) that memory gets stronger. A little struggle is the point. That is why IntPrep keeps asking you to write things from memory, starting now. Brand-new code starts as choices, so the struggle stays the useful kind.`,
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
        kind: 'type',
        title: 'From memory: print some math',
        prompt:
          'Write a `print` line from memory, the same shape as your first one. This time, put the math `25 * 30` inside the parentheses, with no quotes: 25 minutes a day for 30 days.',
        answer: 'print(25 * 30)',
        accept: ['print(30 * 25)'],
        hint: 'Same shape as before: `print(`, then what to show, then `)`. Numbers and math need no quotes.',
        explain:
          'Without quotes, Python works out `25 * 30` and prints the result: 750 minutes, over 12 hours a month, with no cramming. Pulling the `print(...)` shape out of memory instead of looking it up is retrieval practice, the same move every review here uses.',
        output: '750',
      },
      {
        kind: 'text',
        title: 'Getting stuck is part of it',
        body: `You will get stuck, often. Everyone does. A good rule: give a problem an honest 15–25 minutes, then open a hint. Still stuck? Read the walkthrough until it makes sense, then close it and write the solution yourself.

The problem then joins your reviews, so you will meet it again tomorrow. Recalling it *then*, and again later, is what really counts.`,
      },
    ],
  },

  // ── 2 ────────────────────────────────────────────────────────────────────
  {
    id: 'python-basics',
    title: 'Python Basics',
    icon: '🐍',
    blurb: 'Values, variables, types, arithmetic and comparisons.',
    minutes: 27,
    slides: [
      {
        kind: 'text',
        title: 'What is a program?',
        body: `A program is a list of instructions that the computer runs **top to bottom**, one line at a time.

We use **Python**: it reads almost like English, it is short to write, and every major company accepts it in interviews. Each code box in these lessons shows exactly what it prints underneath. Read the code, predict the output, then check.

After almost every new idea it is **your turn**: you write the code yourself, and IntPrep checks it line by line. When an idea is brand new, you usually pick the right code from a few options first, then type it a little later. Writing code, not just reading it, is what makes it stick.`,
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
score -= 2          # the same shortcut with minus
print(score)
lives = 3
print(score, lives)`,
        output: py`
14
14 3`,
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
        pick: [
          py`
score = 10
score + 5
print(score)`,
          py`
score = 10
score += 5
print("score")`,
          py`
score = 10
score + 5
print("score")`,
        ],
        ideas: ['variables', '+='],
        hint: '`score += 5` is short for `score = score + 5`. Press Enter to start a new line.',
        explain:
          'The first line stores 10 under the name `score`. `+=` reads the old value, adds 5 and stores the result back, so `print` shows 15. `score + 5` alone works out 15 but never stores it, and `"score"` in quotes is just the text *score*.',
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
        title: 'Converting types',
        body: '`int(...)` and `str(...)` turn a value of one type into another. Adding two strings glues them together.',
        code: py`
print("42" + "1")      # two texts: glued together
print(int("42") + 1)   # text -> number, then real math
print(str(42) + "!")   # number -> text
print(int(3.9))        # chops off the decimals`,
        output: py`
421
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
        pick: [
          py`
age = int("age_text")
print(age + 1)`,
          py`
age = int(age_text)
print(age_text + 1)`,
          py`
age = int("age_text")
print(age_text + 1)`,
        ],
        ideas: ['int()'],
        hint: '`int(...)` turns text that looks like a number into a real number you can do math with.',
        explain:
          'Text in quotes is a `str`, even when it looks like a number, so `age_text + 1` would be an error. `int(age_text)` reads the text the variable holds and gives the number 41, so `age + 1` is 42. With quotes, `int("age_text")` would try to read the letters *age_text* as a number.',
        output: '42',
      },
      {
        kind: 'code',
        title: 'Arithmetic',
        body: '`/` always gives a float. `//` is **floor division**: divide, then round *down*. `%` gives the **remainder**. Every operator has a shortcut like `+=`: `n //= 10` means `n = n // 10`.',
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
        kind: 'type',
        title: 'Add numbers stored as text',
        prompt: '`a` and `b` hold numbers as text. Convert each one with `int`, store their sum in `total`, then print `total`.',
        starter: py`
a = "7"
b = "5"`,
        answer: py`
total = int(a) + int(b)
print(total)`,
        accept: [
          py`
total = int(b) + int(a)
print(total)`,
        ],
        ideas: ['int()'],
        hint: '`a + b` would glue the two texts together. Convert each one with `int(...)` first, then add.',
        explain:
          '`int(a)` is 7 and `int(b)` is 5, so `total` is 12. Adding the text itself, `a + b`, would join the two strings into `"75"`.',
        output: '12',
      },
      {
        kind: 'code',
        title: 'What // and % are for',
        body: 'You will not need them every day, but two jobs come up again and again: taking a number apart digit by digit, and finding the middle of a range.',
        code: py`
n = 4721
print(n % 10)          # last digit
print(n // 10)         # drop the last digit
print(n % 2)           # 0 for an even number, 1 for an odd one
print((3 + 10) // 2)   # halfway between 3 and 10, rounded down`,
        output: py`
1
472
1
6`,
      },
      {
        kind: 'type',
        title: 'Split off the last digit',
        prompt: '`n` holds a number. Print its **last digit**, then on the next line print `n` **without** its last digit. Use `%` and `//`.',
        starter: 'n = 917',
        answer: py`
print(n % 10)
print(n // 10)`,
        pick: [
          py`
print(n // 10)
print(n % 10)`,
          py`
print(n % 10)
print(n / 10)`,
        ],
        ideas: ['// and %'],
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
        body: 'Comparisons produce `True` or `False`. Combine them with `and`, `or` and `not` (*Grids and Pointers* comes back to all three, and you write `and` and `or` there).',
        code: py`
x = 5
print(x > 3, x < 3)
print(x == 5, x != 5)     # == compares; = assigns
print(1 <= x < 10)        # chained: is x between 1 and 10?
print(x % 2 == 0)         # is x even?
print(x > 3 and x < 4)    # both sides must be true
print(x < 0 or x > 3)     # at least one side true
print(not x == 5)`,
        output: py`
True False
True False
True
False
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
        pick: [
          py`
is_ten = x = 10
print(is_ten)`,
          py`
is_ten = x == "10"
print(is_ten)`,
          py`
is_ten = x = "10"
print(is_ten)`,
        ],
        ideas: ['=='],
        hint: 'The first line needs both: a single `=` to store, and a double `==` to compare.',
        explain:
          '`x == 10` **compares** and gives `True` or `False`; the single `=` then **stores** that answer in `is_ten`. A single `=` in place of `==` would store 10 itself, and `"10"` is text, which never equals the number 10.',
        output: 'True',
      },
      {
        kind: 'code',
        title: 'f-strings, for reading',
        body: 'Put `f` before a string and anything inside `{}` is worked out and dropped in. You will not write them in interview answers, but these lessons and other people’s code use them to print messages, so it is enough to **read** them.',
        code: py`
name = "Ada"
solved = 12
print(f"{name} has solved {solved} problems")
print(f"Double that is {solved * 2}")`,
        output: py`
Ada has solved 12 problems
Double that is 24`,
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
        prompt: '`duration` is a number of minutes. Store the whole hours in `hours` and the minutes left over in `mins`, using `//` and `%` with `60`. Then print `hours` and `mins` with one `print`.',
        starter: 'duration = 135',
        answer: py`
hours = duration // 60
mins = duration % 60
print(hours, mins)`,
        accept: [
          py`
mins = duration % 60
hours = duration // 60
print(hours, mins)`,
        ],
        ideas: ['variables', '// and %'],
        hint: '`duration // 60` counts the full hours, and `duration % 60` is what is left over. `print(a, b)` shows two values with a space between them.',
        explain:
          '135 minutes is 2 full hours (`135 // 60`) with 15 minutes left over (`135 % 60`). One `print` with a comma shows both.',
        output: '2 15',
      },
    ],
  },

  // ── 3 ────────────────────────────────────────────────────────────────────
  {
    id: 'control-flow',
    title: 'Decisions and Loops',
    icon: '🔀',
    blurb: 'if/elif/else, for loops with range, while, break, and tracing code by hand.',
    minutes: 41,
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
        body: 'Python tests each condition top to bottom and runs **only the first** branch that is true. `elif` and `else` are optional. You write `if` and `else` next, and your first `elif` in *Grids and Pointers*.',
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
        title: 'Your first if',
        prompt: '`temp` holds a temperature. Use an `if` to print `hot` when `temp` is greater than `30`.',
        starter: 'temp = 34',
        answer: py`
if temp > 30:
    print("hot")`,
        accept: [
          py`
if 30 < temp:
    print("hot")`,
        ],
        pick: [
          py`
if temp > 30
    print("hot")`,
          py`
if temp > 30:
print("hot")`,
          py`
if temp > 30
print("hot")`,
        ],
        ideas: ['if'],
        hint: 'End the `if` line with a colon. Press Enter after it and the editor indents the next line for you.',
        explain:
          '`temp > 30` is true here, so the indented line runs. The colon opens the block, and the 4-space indent puts `print` inside it. Leave out either one and Python stops with a syntax error before running anything.',
        output: 'hot',
      },
      {
        kind: 'type',
        title: 'Two branches',
        prompt: '`age` holds an age. Print `adult` when `age` is at least `18`, and `minor` otherwise, with `if` and `else`.',
        starter: 'age = 15',
        answer: py`
if age >= 18:
    print("adult")
else:
    print("minor")`,
        accept: [
          py`
if 18 <= age:
    print("adult")
else:
    print("minor")`,
        ],
        pick: [
          py`
if age >= 18:
    print("adult")
else age < 18:
    print("minor")`,
          py`
if age >= 18:
    print("adult")
else if age < 18:
    print("minor")`,
        ],
        ideas: ['else'],
        hint: '`else` takes no condition: it runs whenever the `if` test is false. End it with a colon and line it up with the `if`.',
        explain:
          '15 is not at least 18, so Python skips the `if` block and runs the `else` block. `else` never takes a condition: it catches every case the `if` did not. Python has no `else if` either; that one is spelled `elif`.',
        output: 'minor',
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
        ideas: ['if', 'else'],
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
        title: 'Your first for loop',
        prompt: 'Print the numbers `0` to `4`, one per line, with a `for` loop. Use `i` as the loop variable.',
        answer: py`
for i in range(5):
    print(i)`,
        accept: [
          py`
for i in range(0, 5):
    print(i)`,
        ],
        pick: [
          py`
for i in range(4):
    print(i)`,
          py`
for i in range(5)
    print(i)`,
          py`
for i in range(4)
    print(i)`,
        ],
        ideas: ['for'],
        hint: '`range(5)` counts 0, 1, 2, 3, 4. It stops *before* 5.',
        explain:
          '`range(5)` produces 0 up to, but not including, 5, so `range(4)` would stop at 3. The loop line ends with a colon, and the indented `print(i)` runs once for each number.',
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
        body: `\`range\` can also take a start, and a step to count by:

- \`range(2, 6)\` gives 2, 3, 4, 5: start at 2, stop before 6
- \`range(0, 10, 3)\` gives 0, 3, 6, 9: count up in 3s
- \`range(5, 0, -1)\` gives 5, 4, 3, 2, 1: a negative step counts down
- \`range(3, 3)\` gives nothing: the loop body never runs`,
        code: py`
for i in range(2, 6):
    print(i)
for i in range(3, 0, -1):
    print("down", i)`,
        output: py`
2
3
4
5
down 3
down 2
down 1`,
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
        pick: [
          py`
for i in range(10, 4, -2):
    print(i)`,
          py`
for i in range(10, 3, 2):
    print(i)`,
          py`
for i in range(10, 4, 2):
    print(i)`,
        ],
        ideas: ['range step'],
        hint: 'The stop value is never included, so it has to sit one step *past* 4 in the direction you are counting.',
        explain:
          '`range(10, 3, -2)` starts at 10 and steps down by 2, stopping before it reaches 3: 10, 8, 6, 4. `range(10, 4, -2)` would end at 6, because the stop is never included. A step of `2` counts up, and 10 is already past 3, so that range would be empty.',
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
        pick: [
          py`
for n in range(9):
    if n % 2 = 0:
        print(n)`,
          py`
for n in range(9):
    if n % 2 == 0:
    print(n)`,
          py`
for n in range(9):
    if n % 2 = 0:
    print(n)`,
        ],
        ideas: ['if inside a loop'],
        hint: 'Three lines: the loop, an `if` inside it (indented once), and the `print` inside the `if` (indented twice).',
        explain:
          'The `if` is indented once, so it runs on every pass of the loop. The `print` is indented twice, so it runs only when the `if` is true: for 0, 2, 4, 6 and 8. A comparison needs `==`; a single `=` is a syntax error there.',
        output: py`
0
2
4
6
8`,
      },
      {
        kind: 'code',
        title: 'Trace it: be the computer',
        body: 'To **trace** code, go through it line by line the way Python does, and write down what each variable holds after every pass. It is how you find a bug, and how you check a solution in an interview. This loop prints its own trace: `n`, then `total`, once per pass.',
        code: py`
total = 0
for n in range(3, 7):
    total += n
    print(n, total)`,
        output: py`
3 3
4 7
5 12
6 18`,
      },
      {
        kind: 'quiz',
        q: 'Trace it. What does `count` hold right after the pass where `n` is `3`?',
        code: py`
count = 0
for n in range(6):
    if n % 3 == 0:
        count += 2
    else:
        count += 1`,
        options: ['4', '5', '6', '8'],
        answer: 2,
        explain:
          'Pass by pass: `n` = 0 adds 2 (0 divides evenly by 3), so `count` is 2. `n` = 1 makes it 3, `n` = 2 makes it 4, and `n` = 3 adds 2 again: **6**. 8 is where it ends up after the last pass, when `n` is 5.',
      },
      {
        kind: 'type',
        title: 'Find the bug',
        prompt: `This program should add up the numbers from 1 to 5 and print \`15\`. It prints \`10\`:

\`\`\`
total = 0
for n in range(1, 5):
    total += n
print(total)
\`\`\`

Trace it to find out why. Then write the whole program again, with the bug fixed.`,
        answer: py`
total = 0
for n in range(1, 6):
    total += n
print(total)`,
        accept: [
          py`
total = 0
for n in range(1, 6):
    total = total + n
print(total)`,
          py`
total = 0
for n in range(6):
    total += n
print(total)`,
          py`
total = 0
for n in range(0, 6):
    total += n
print(total)`,
        ],
        check: 'assert total == 15',
        hint: 'Write down `n` on every pass. Which of the numbers 1 to 5 never shows up?',
        explain:
          'Traced, `n` is 1, 2, 3 and 4, and then the loop is over: `range(1, 5)` stops **before** 5, so the program only adds 1 + 2 + 3 + 4. The stop has to be one past the last number you want: `range(1, 6)`. An off-by-one `range` is one of the most common bugs there is.',
        output: '15',
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
        title: 'Count down with while',
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
        pick: [
          py`
while n >= 0:
    print(n)
    n -= 1`,
          py`
while n > 0:
    print(n)
n -= 1`,
          py`
while n >= 0:
    print(n)
n -= 1`,
        ],
        ideas: ['while'],
        hint: 'Inside the loop, print first, then make `n` smaller. Without that last step the loop would never end.',
        explain:
          'Each pass prints `n` and then makes it 1 smaller: 3, 2, 1. Once `n` is 0, `n > 0` is false and the loop stops; with `>=` it would print 0 too. Both lines of the body are indented: if `n -= 1` sat outside the loop, `n` would never shrink and the loop would run forever.',
        output: py`
3
2
1`,
      },
      {
        kind: 'code',
        title: 'break and continue',
        body: '`continue` jumps straight to the next pass of the loop. `break` leaves the loop immediately. You write `break` next, and `continue` in *Grids and Pointers*.',
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
        pick: [
          py`
for n in range(1, 10):
    if n == 4:
        break
        print(n)`,
          py`
for n in range(1, 10):
    print(n)
    if n == 4:
        break`,
        ],
        ideas: ['break'],
        hint: 'Check for 4 *before* printing. The `print` lines up with the `if`, not with `break`.',
        explain:
          'The loop prints 1, 2 and 3. When `n` is 4, `break` leaves the loop at once, so nothing from 4 to 9 is printed. The check comes before the `print`, or 4 would be printed first. The `print` lines up with the `if`: inside it, after `break`, it could never run. `continue` would only skip 4 and go on to 5.',
        output: py`
1
2
3`,
      },
      {
        kind: 'type',
        title: 'Count the digits',
        prompt: 'Count the digits of `n`: while `n` is greater than `0`, drop its last digit with `n = n // 10` and add `1` to `digits`. After the loop, print `digits`.',
        starter: py`
n = 4721
digits = 0`,
        answer: py`
while n > 0:
    n = n // 10
    digits += 1
print(digits)`,
        accept: [
          py`
while n > 0:
    n = n // 10
    digits = digits + 1
print(digits)`,
          py`
while n > 0:
    digits += 1
    n = n // 10
print(digits)`,
          py`
while n > 0:
    digits = digits + 1
    n = n // 10
print(digits)`,
          py`
while n > 0:
    n //= 10
    digits += 1
print(digits)`,
          py`
while n > 0:
    digits += 1
    n //= 10
print(digits)`,
        ],
        ideas: ['while'],
        hint: 'Two lines inside the loop, both indented. The `print` goes after the loop, back at the left edge.',
        explain:
          'Each pass drops one digit: 4721, 472, 47, 4, then 0, and the loop stops. That is four passes, so `digits` is 4. A `while` loop fits here because you do not know the number of passes in advance.',
        output: '4',
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
          'The inner loop runs 4 times for *each* of the 3 outer passes: 3 × 4 = 12. Nested loops **multiply**, which will matter a lot once you start measuring how fast code is.',
      },
      {
        kind: 'type',
        title: 'The first multiple over 30',
        prompt: 'Loop over the multiples of `7` with `range(0, 100, 7)` and the variable `n`. When `n` is greater than `30`, print it and leave the loop with `break`.',
        answer: py`
for n in range(0, 100, 7):
    if n > 30:
        print(n)
        break`,
        accept: [
          py`
for n in range(0, 100, 7):
    if 30 < n:
        print(n)
        break`,
        ],
        ideas: ['range step', 'break'],
        hint: 'The `if` goes inside the loop, and both `print(n)` and `break` go inside the `if`.',
        explain:
          '`range(0, 100, 7)` counts 0, 7, 14, 21, 28, 35 and so on. The first one over 30 is 35: it is printed, and `break` stops the loop before 42 ever comes up.',
        output: '35',
      },
      {
        kind: 'code',
        title: 'Truthy and falsy',
        body: 'In an `if` or `while`, zero, empty text and `None` count as **false**, and so will the empty lists, dicts and sets of later lessons; everything else counts as true. `bool(...)` shows which way a value counts. Solutions lean on this all the time, with lines like `if not count:`.',
        code: py`
print(bool(0), bool(7))
print(bool(""), bool("hi"))
print(bool(None))
count = 0
if not count:
    print("count is zero")`,
        output: py`
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
        ideas: ['for', 'if inside a loop', '+=', '=='],
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
    blurb: 'Indexing, slicing, list methods, in, sorting, strings and comprehensions.',
    minutes: 39,
    slides: [
      {
        kind: 'text',
        title: 'Lists hold many values',
        body: `A **list** is an ordered row of values in square brackets: \`nums = [4, 8, 15]\`. Each slot has an **index**, starting at **0**, so the last index is \`len(nums) - 1\`.

Lists can grow, shrink and hold anything. An empty list, \`[]\`, counts as false in an \`if\` or \`while\`, just like \`0\` and \`""\`. When a LeetCode problem says *array*, in Python you get a list.`,
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
        pick: [
          'print(nums(-1))',
          'print(nums[4])',
          'print(nums(4))',
        ],
        ideas: ['negative index'],
        hint: 'Index `-1` means the last item.',
        explain:
          '`nums[-1]` counts from the end, so it is always the last item, however long the list is. Indexes go in square brackets, and with 4 items the last index is 3, so `nums[4]` is past the end. `nums[len(nums) - 1]` finds the same item the long way.',
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
        pick: [
          'print(nums[3:])',
          'print(nums[:2])',
          'print(nums[1:4])',
        ],
        ideas: ['slice'],
        hint: 'A slice is `nums[start:stop]`, and the stop index is not included. Leave `start` out to begin at the front.',
        explain:
          '`nums[:3]` copies indices 0, 1 and 2 and stops before index 3, so you get the first three items. It is the same *stop is excluded* rule as `range`: `nums[:2]` gives only two items, and `nums[1:4]` skips the first one, because indexes start at 0.',
        output: '[5, 10, 15]',
      },
      {
        kind: 'code',
        title: 'Changing a list',
        body: '`append`, `pop` and `insert` are **methods**: functions that belong to a value, called with a dot after it, as in `items.append(3)`. Adding or removing at the **end** is fast. At the **front**, every other item has to shift over by one, which is slow on big lists.',
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
        pick: [
          py`
stack = stack.append(2)
top = stack.pop()
print(top, stack)`,
          py`
stack.append(2)
top = stack.pop(0)
print(top, stack)`,
          py`
stack = stack.append(2)
top = stack.pop(0)
print(top, stack)`,
        ],
        ideas: ['append', 'pop'],
        hint: '`pop()` with nothing in the parentheses removes the last item and hands it back, so you can store it.',
        explain:
          '`append` adds 2 at the end, making `[1, 2]`. `pop()` takes the last item back off and returns it, so `top` is 2 and `stack` is `[1]` again. Both are fast because they work at the end. `append` returns `None`, so storing what it returns would lose the list, and `pop(0)` takes the *first* item.',
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
        pick: [
          py`
for i, c in colors:
    print(i, c)`,
          py`
for c, i in enumerate(colors):
    print(i, c)`,
          py`
for c, i in colors:
    print(i, c)`,
        ],
        ideas: ['enumerate'],
        hint: 'The loop line is `for i, c in ...:` with `enumerate(colors)` after `in`.',
        explain:
          '`enumerate` hands you two things on every pass, the index first and then the item, and `i, c` unpacks them into two names in that order. A plain `colors` gives only the items, one name at a time.',
        output: py`
0 red
1 green
2 blue`,
      },
      {
        kind: 'type',
        title: 'Undo the last move',
        prompt: 'Add `"down"` to the end of `moves` with `append`. Then undo it: `pop` the last move into `last`. Print `last` and the move that is now at the end, `moves[-1]`.',
        starter: 'moves = ["up", "left"]',
        answer: py`
moves.append("down")
last = moves.pop()
print(last, moves[-1])`,
        ideas: ['append', 'pop', 'negative index'],
        hint: '`pop()` with nothing inside the parentheses takes the last item off and hands it back. After that, `moves[-1]` is the new last item.',
        explain:
          '`append` puts `"down"` at the end and `pop()` takes it back off, so `last` is `"down"` and `moves` is `["up", "left"]` again. Its last item, `moves[-1]`, is `"left"`. An undo button works just like this.',
        output: 'down left',
      },
      {
        kind: 'code',
        title: 'in: is it in the list?',
        body: '`x in items` is `True` when `x` is one of the items. To answer, Python checks the items one by one from the front, so on a long list it is slow. *Dicts and Sets* shows a faster way.',
        code: py`
fruits = ["fig", "kiwi", "lime"]
print("kiwi" in fruits)
print("plum" in fruits)
if "fig" in fruits:
    print("we have figs")`,
        output: py`
True
False
we have figs`,
      },
      {
        kind: 'type',
        title: 'Check with in',
        prompt: 'Print whether `"green"` is one of the items of `colors`.',
        starter: 'colors = ["red", "green", "blue"]',
        answer: 'print("green" in colors)',
        pick: [
          'print(green in colors)',
          'print("green" in "colors")',
          'print(green in "colors")',
        ],
        ideas: ['in'],
        hint: 'The item you are looking for goes on the left of `in`, and the list on the right.',
        explain:
          '`"green" in colors` asks whether the text `"green"` is an item of the list, and gives `True`. `"green"` is text, so it needs quotes: without them Python looks for a variable called `green`. `colors` is a variable, so it has none: `"colors"` in quotes is just a word, and it does not contain `green`.',
        output: 'True',
      },
      {
        kind: 'type',
        title: 'Keep the ones you want',
        prompt: 'Loop over `basket` with `f`. Whenever `f` is in `wanted`, `append` it to `found`. Print `found` after the loop.',
        starter: py`
wanted = ["fig", "lime"]
basket = ["kiwi", "lime", "plum", "fig"]
found = []`,
        answer: py`
for f in basket:
    if f in wanted:
        found.append(f)
print(found)`,
        ideas: ['in', 'append'],
        hint: 'Three lines for the loop: `for f in basket:`, an `if f in wanted:` inside it, and the `append` inside the `if`. The `print` goes back at the left edge.',
        explain:
          'Each pass asks whether this fruit is in `wanted` and, if so, adds it to the end of `found`. Starting with an empty list and appending inside a loop is how most solutions build their answer.',
        output: "['lime', 'fig']",
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
        pick: [
          py`
nums = nums.sort()
print(nums)`,
          py`
nums.sort
print(nums)`,
          py`
nums = nums.sort
print(nums)`,
        ],
        ideas: ['.sort()'],
        hint: '`.sort()` changes the list itself and returns `None`, so call it on its own line and do not store what it returns.',
        explain:
          '`nums.sort()` rearranges the list itself, so printing `nums` afterward shows `[2, 4, 9]`. Storing what it returns would store `None`, and without the parentheses the method never runs. `nums = sorted(nums)` works too: `sorted` returns a new sorted list, which you store back in `nums`.',
        output: '[2, 4, 9]',
      },
      {
        kind: 'type',
        title: 'The three fastest laps',
        prompt: '`laps` holds lap times in seconds, and lower is faster. Sort `laps` in place with `.sort()`, then print the three fastest times with a slice.',
        starter: 'laps = [62, 58, 71, 60]',
        answer: py`
laps.sort()
print(laps[:3])`,
        accept: [
          py`
laps.sort()
print(laps[0:3])`,
          py`
laps = sorted(laps)
print(laps[:3])`,
          py`
laps = sorted(laps)
print(laps[0:3])`,
        ],
        ideas: ['.sort()', 'slice'],
        hint: 'After sorting, the fastest times are at the front, so the slice starts at the beginning and stops before index 3.',
        explain:
          '`laps.sort()` puts the times in order, fastest first: `[58, 60, 62, 71]`. `laps[:3]` copies the first three. Sorting, then slicing from one end, is a quick way to find the smallest or largest few.',
        output: '[58, 60, 62]',
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
print("-".join(words))`,
        output: py`
bat
['the', 'quick', 'brown', 'fox']
the-quick-brown-fox`,
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
        pick: [
          py`
words = sentence.split("_")
print("_".join(words))`,
          py`
words = sentence.split()
print(words.join("_"))`,
          py`
words = sentence.split("_")
print(words.join("_"))`,
        ],
        ideas: ['split', 'join'],
        hint: '`.split()` breaks text apart at the spaces. `"_".join(words)` glues a list of strings back together with `_` in between.',
        explain:
          '`split` returns a new list, `["keep", "it", "simple"]`, and `join` builds one new string from it. The text being split has spaces, not `_`, so `split()` needs no separator; `join` is called on the separator, with the list inside the parentheses. `sentence` itself never changes: a string method never changes the string it is called on. It hands back something new, here a list.',
        output: 'keep_it_simple',
      },
      {
        kind: 'code',
        title: 'List comprehensions',
        body: 'A **list comprehension** builds a list in one line: `[expression for item in items]`. Add `if condition` at the end to keep only some of the items.',
        code: py`
nums = [1, 2, 3, 4, 5]
squares = [n * n for n in nums]
evens = [n for n in nums if n % 2 == 0]
print(squares)
print(evens)`,
        output: py`
[1, 4, 9, 16, 25]
[2, 4]`,
      },
      {
        kind: 'type',
        title: 'A list comprehension',
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
        pick: [
          py`
doubled = n * 2 for n in nums
print(doubled)`,
          py`
doubled = [nums * 2 for n in nums]
print(doubled)`,
          py`
doubled = nums * 2 for n in nums
print(doubled)`,
        ],
        ideas: ['list comprehension'],
        hint: 'The shape is `[expression for item in items]`.',
        explain:
          'The comprehension works out `n * 2` for each `n` in `nums` and collects the results in a new list, all in one line. The square brackets are what make it a list, and the expression uses the item, `n`, not the whole list.',
        output: '[2, 4, 6]',
      },
      {
        kind: 'type',
        title: 'Shout every word',
        prompt: 'Split `line` into a list called `words`. Build a list called `loud` that holds every word in capitals: a list comprehension with `w` and `w.upper()`. Then print the words of `loud` joined with a space between them.',
        starter: 'line = "keep it simple"',
        answer: py`
words = line.split()
loud = [w.upper() for w in words]
print(" ".join(loud))`,
        accept: [
          py`
words = line.split(" ")
loud = [w.upper() for w in words]
print(" ".join(loud))`,
        ],
        ideas: ['split', 'list comprehension', 'join'],
        hint: '`.split()` gives the list of words, and the comprehension is `[w.upper() for w in words]`. To glue a list of strings together, call `join` on the separator: `" ".join(...)`.',
        explain:
          '`split` breaks the text at the spaces into `["keep", "it", "simple"]`, the comprehension builds a new list, `["KEEP", "IT", "SIMPLE"]`, and `join` glues its words into one string with a space between each. Split, change each piece, join: a lot of string problems are those three steps.',
        output: 'KEEP IT SIMPLE',
      },
      {
        kind: 'type',
        title: 'Find the longest word',
        prompt: 'Find where the longest word is. Start `best` at `0`: the index of the longest word so far. Loop over `enumerate(words)` with `i` and `w`, and set `best` to `i` whenever `len(w)` is greater than `len(words[best])`. After the loop, print `best` and `words[best]`.',
        starter: 'words = ["fig", "banana", "kiwi"]',
        answer: py`
best = 0
for i, w in enumerate(words):
    if len(w) > len(words[best]):
        best = i
print(best, words[best])`,
        accept: [
          py`
best = 0
for i, w in enumerate(words):
    if len(words[best]) < len(w):
        best = i
print(best, words[best])`,
        ],
        ideas: ['enumerate'],
        hint: 'Set `best`, loop with `for i, w in enumerate(words):`, compare the lengths with an `if`, and update `best` inside it. The `print` goes back to the left edge.',
        explain:
          '`best` holds the index of the longest word so far. Each pass compares the current word with it and keeps the index of the longer one, so after the loop `best` is 1 and `words[best]` is `"banana"`. Keeping a *best so far* while you loop is a shape you will use again and again.',
        output: '1 banana',
      },
    ],
  },

  // ── 5 ────────────────────────────────────────────────────────────────────
  {
    id: 'dicts-and-sets',
    title: 'Dicts and Sets',
    icon: '🔑',
    blurb: 'Instant lookups by key: dict, set, Counter and defaultdict.',
    minutes: 34,
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
        pick: [
          'ages["cy"] == 40',
          'ages.append("cy", 40)',
          'ages = {"cy": 40}',
        ],
        ideas: ['dict key'],
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
        pick: [
          'print(stock["pear"])',
          'print(stock.get("pear"))',
          'print(stock.get(0, "pear"))',
        ],
        ideas: ['.get'],
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
        ideas: ['dict key', '.get'],
        hint: 'The `print` starts at the left edge, outside the loop. After the line inside the loop, press Enter, then remove the indent (Backspace removes all 4 spaces at once).',
        explain:
          '`count.get(ch, 0)` is the count so far, or 0 the first time a letter shows up. Adding 1 and storing it back counts this letter. The `print` is not indented, so it runs once, after the loop.',
        output: "{'a': 1, 'p': 2, 'l': 1, 'e': 1}",
      },
      {
        kind: 'code',
        title: 'Looping over a dict',
        body: 'Looping over a dict gives its keys. Use `.items()` to get each key with its value: a pair, which the loop unpacks into two names, as it did with `enumerate`. Dicts remember the order keys were added.',
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
        pick: [
          py`
for name, score in scores:
    if score >= 8:
        print(name)`,
          py`
for name, score in scores.items():
    if score >= 8:
        print(score)`,
          py`
for name, score in scores:
    if score >= 8:
        print(score)`,
        ],
        ideas: ['.items()'],
        hint: '`.items()` gives each key together with its value, so the loop line is `for name, score in scores.items():`.',
        explain:
          'Each pass unpacks one key and its value into `name` and `score`. `"ana"` (9) and `"cy"` (8) pass the check; `"bo"` (7) does not. Looping over `scores` alone gives only the keys, with no scores to unpack. And the name is in `name`; `score` holds the number.',
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
print(len(seen))
print(5 in seen, 9 in seen)`,
        output: py`
2
True False`,
      },
      {
        kind: 'type',
        title: 'Use a set',
        prompt: 'Create an empty set called `seen`. Add `"a"` to it. Then print whether `"a"` is in `seen`.',
        answer: py`
seen = set()
seen.add("a")
print("a" in seen)`,
        pick: [
          py`
seen = {}
seen.add("a")
print("a" in seen)`,
          py`
seen = set()
seen.append("a")
print("a" in seen)`,
          py`
seen = {}
seen.append("a")
print("a" in seen)`,
        ],
        ideas: ['set'],
        hint: '`{}` would make an empty *dict*, so an empty set is written `set()`.',
        explain:
          '`set()` makes an empty set, `.add` puts a value in it, and `in` answers *is it there?* instantly. You will use exactly these three moves in dozens of problems. `{}` would make an empty dict, and `append` is a list method.',
        output: 'True',
      },
      {
        kind: 'code',
        title: 'A set from a list',
        body: '`set(nums)` builds a set from a list in one go, so the repeats vanish. `.remove(x)` takes a value back out.',
        code: py`
nums = [1, 2, 2, 3, 3, 3]
unique = set(nums)
print(unique, len(unique))
unique.remove(2)
print(unique)`,
        output: py`
{1, 2, 3} 3
{1, 3}`,
      },
      {
        kind: 'text',
        title: 'Why lookups are instant',
        body: `To answer \`x in nums\` for a **list**, Python checks the items one by one: on a list of a million items, that can be a million steps.

A dict or set first runs the key through a **hash function**, which turns it into a number pointing straight at a slot in an internal table. So a lookup, an insert or a delete takes about the same time however much is stored: 10 items or 10 million. Swapping a list search for a set lookup is the trick behind dozens of problems. The Big-O lesson gives these two speeds their names.`,
      },
      {
        kind: 'quiz',
        q: 'You will check `x in collection` 100,000 times, and the collection holds 100,000 numbers. What should the collection be?',
        options: ['A list', 'A set', 'A string of the numbers', 'It does not matter'],
        answer: 1,
        explain:
          'With a list, each check can take 100,000 steps: 10 billion in total, far too slow. A set answers each check in about the same tiny time however much it holds, so the whole job is about 100,000 steps.',
      },
      {
        kind: 'code',
        title: 'Tuples',
        body: 'You met the **tuple** in *Grids and Pointers*: the direction pairs `(dr, dc)`. It is like a list that cannot change, written with parentheses. Because it is immutable, it can be a dict key or a set item, which makes it perfect for grid coordinates.',
        code: py`
point = (2, 5)
r, c = point            # unpacked, as the direction pairs were
print(r, c)
visited = {(0, 0), (2, 5)}   # a set written out: braces, no colons
print((2, 5) in visited)
a, b = 1, 2
a, b = b, a             # the swap you know: the right side is a tuple
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
        pick: [
          py`
visited.add(r, c)
print((1, 2) in visited)`,
          py`
visited.add([r, c])
print((1, 2) in visited)`,
        ],
        ideas: ['tuple in a set'],
        hint: 'A tuple is written with parentheses, so the call needs two pairs: one for `add(...)` and one for the tuple `(r, c)`.',
        explain:
          'Set items must be immutable. A tuple is, so `(r, c)` can go in a set; a list `[r, c]` cannot (`TypeError: unhashable type`). And `add` takes exactly one item: the tuple.',
        output: 'True',
      },
      {
        kind: 'code',
        title: 'Counter',
        body: 'Python keeps extra tools in **modules**, and an `import` line at the top of your code fetches the ones you need: here `Counter`, from the module `collections`. `Counter` builds a frequency dict in one line. Missing keys count as 0 instead of raising an error.',
        code: py`
from collections import Counter

c = Counter("mississippi")
print(c["s"], c["z"])
print(Counter("listen") == Counter("silent"))`,
        output: py`
4 0
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
        pick: [
          py`
c = Counter("word")
print(c["l"], c["z"])`,
          py`
c = Counter(word)
print(c[l], c[z])`,
          py`
c = Counter("word")
print(c[l], c[z])`,
        ],
        ideas: ['Counter'],
        hint: '`Counter(word)` counts every letter at once. Then read a count with square brackets, as with a dict.',
        explain:
          '`"l"` appears twice. `"z"` never appears, but a `Counter` gives 0 for a missing key instead of raising a `KeyError`. `word` is a variable, so no quotes; the keys are letters, so they need them.',
        output: '2 0',
      },
      {
        kind: 'type',
        title: 'The cell below',
        prompt: 'The cell below `(r, c)` is one row down: `(r + 1, c)`. Store it as a tuple in `below`, then print `below` and whether it is in `visited`.',
        starter: py`
visited = {(2, 5)}
r, c = 2, 5`,
        answer: py`
below = (r + 1, c)
print(below, below in visited)`,
        ideas: ['tuple in a set'],
        hint: 'A tuple is written with parentheses: `(r + 1, c)`. Then `print(a, b)` prints two values with a space between them.',
        explain:
          '`below` is the tuple `(3, 5)`, and the set holds only `(2, 5)`, so `below in visited` is `False`. Grid problems ask whether a neighbor was already visited exactly like this: a set of `(r, c)` tuples does the same job as the grid of `False` and `True` you built in *Grids and Pointers*.',
        output: '(3, 5) False',
      },
      {
        kind: 'type',
        title: 'Letters that repeat',
        prompt: 'This time the import is yours: start with the line that imports `Counter` from `collections`. Count the letters of `word` with `Counter`, storing the result in `c`. Then loop over `c.items()` with `ch` and `count`, and print each letter that appears more than once.',
        starter: 'word = "banana"',
        answer: py`
from collections import Counter
c = Counter(word)
for ch, count in c.items():
    if count > 1:
        print(ch)`,
        accept: [
          py`
from collections import Counter
c = Counter(word)
for ch, count in c.items():
    if count >= 2:
        print(ch)`,
          py`
from collections import Counter
c = Counter(word)
for ch, count in c.items():
    if 1 < count:
        print(ch)`,
        ],
        ideas: ['Counter', '.items()'],
        hint: 'The first line is `from collections import Counter`. `.items()` gives each letter with its count, so the loop line is `for ch, count in c.items():`. The `print` goes inside the `if`.',
        explain:
          'A `Counter` is a dict, so `.items()` works on it too: each pass gets one letter and its count. `a` appears 3 times and `n` twice; `b` appears once, so it is skipped.',
        output: py`
a
n`,
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
        ideas: ['set', 'break'],
        hint: 'Check `ch in seen` *before* adding `ch`. `seen.add(ch)` lines up with the `if`, not with `break`.',
        explain:
          'The set remembers every letter so far, and `in` checks it instantly. `a`, `b`, `c` and `d` are new; the second `b` is already in `seen`, so it is printed and the loop stops.',
        output: 'b',
      },
    ],
  },

  // ── 6 ────────────────────────────────────────────────────────────────────
  {
    id: 'functions',
    title: 'Functions',
    icon: '🧩',
    blurb: 'def and return, early returns, helpers that call helpers, and functions inside functions.',
    minutes: 35,
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
        body: '`print` shows a value on the screen. `return` hands it back to the code that called the function, which can store it or keep computing with it. An interview answer always returns.',
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
        pick: [
          'area(3, 5)',
          'print(area(3 * 5))',
          'area(3 * 5)',
        ],
        ideas: ['call a function'],
        hint: 'Write the function name, then the arguments in parentheses, in the same order as the parameters. Wrap it all in `print(...)`.',
        explain:
          '`area(3, 5)` runs the function with `width` = 3 and `height` = 5. Its `return` hands back 15, and `print` shows it; without `print`, the 15 is never shown. `area(3 * 5)` would pass a single argument, 15, and `area` needs two.',
        output: '15',
      },
      {
        kind: 'type',
        title: 'Finish a function',
        prompt: 'The first line of `double` is written for you. Finish it with the line inside that **returns** `n` times 2.',
        starter: 'def double(n):',
        answer: '    return n * 2',
        accept: ['    return 2 * n', '    return n + n'],
        pick: [
          '    print(n * 2)',
          'return n * 2',
          'print(n * 2)',
        ],
        ideas: ['return'],
        hint: 'One line that starts with `return`.',
        explain:
          '`return` hands the result back to whoever called `double`, so `double(4)` gives 8; `print` would only show it. The line is indented because it belongs to the function.',
      },
      {
        kind: 'type',
        title: 'A whole function',
        prompt: 'Define a function called `is_even` that takes one parameter, `n`, and returns `True` if `n` is even and `False` otherwise.',
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
        pick: [
          py`
def is_even():
    return n % 2 == 0`,
          py`
def is_even(n):
    print(n % 2 == 0)`,
          py`
def is_even():
    print(n % 2 == 0)`,
        ],
        ideas: ['def'],
        hint: 'A number is even when `n % 2 == 0`. That comparison is already `True` or `False`, so you can return it directly.',
        explain:
          'The parameter `n` goes in the parentheses of the `def` line. A comparison gives a boolean, so `return n % 2 == 0` hands back `True` for even numbers and `False` for odd ones; `print` would only show it. An `if` with two `return` lines works too; it is just longer.',
      },
      {
        kind: 'type',
        title: 'Two parameters, two returns',
        prompt: 'Define `bigger(a, b)`, which returns the larger of its two parameters: if `a` is greater than `b`, return `a`. Otherwise, return `b`.',
        answer: py`
def bigger(a, b):
    if a > b:
        return a
    return b`,
        accept: [
          py`
def bigger(a, b):
    if a > b:
        return a
    else:
        return b`,
          py`
def bigger(a, b):
    if a >= b:
        return a
    return b`,
          py`
def bigger(a, b):
    if a >= b:
        return a
    else:
        return b`,
          py`
def bigger(a, b):
    if b < a:
        return a
    return b`,
          py`
def bigger(a, b):
    if b < a:
        return a
    else:
        return b`,
        ],
        ideas: ['def', 'return'],
        hint: 'The `def` line names both parameters, separated by a comma. Inside it: an `if` with a `return`, then a second `return` lined up with the `if`.',
        explain:
          '`bigger(3, 8)` skips the `if` and returns 8; `bigger(8, 3)` returns 8 from inside the `if`, and the last line never runs. A function can have several `return` lines, and only one of them runs on each call.',
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
        kind: 'code',
        title: 'Return early',
        body: 'Because `return` ends the function, a search can stop the moment it finds what it wants. The `return` after the loop only runs when the loop finished without finding anything.',
        code: py`
def first_negative(nums):
    for n in nums:
        if n < 0:
            return n      # found one: the function ends here
    return None           # the loop finished without finding any

print(first_negative([4, -2, 7, -9]))
print(first_negative([4, 7]))`,
        output: py`
-2
None`,
      },
      {
        kind: 'type',
        title: 'Search with an early return',
        prompt: '`has_big(nums, limit)` answers whether any number in `nums` is greater than `limit`. Its body loops over `nums` with `n`, returns `True` as soon as one number is greater, and returns `False` if the loop ends without finding any.',
        starter: 'def has_big(nums, limit):',
        answer: py`
    for n in nums:
        if n > limit:
            return True
    return False`,
        accept: [
          py`
    for n in nums:
        if limit < n:
            return True
    return False`,
        ],
        pick: [
          py`
    for n in nums:
        if n > limit:
            return True
        else:
            return False`,
          py`
    for n in nums:
        if n > limit:
            return True
        return False`,
        ],
        ideas: ['early return'],
        hint: '`return True` goes inside the `if`. `return False` goes after the loop, lined up with the `for`.',
        explain:
          'The `return False` sits **after** the loop, at the level of the `for`, so it runs only once every number has been checked. Inside the loop, with or without an `else`, the function would give up after looking at the first number. *Return as soon as you know, and return the fallback after the loop* is a shape you will write in a large share of interview answers.',
      },
      {
        kind: 'code',
        title: 'Functions calling functions',
        body: 'A function can call any other function. Splitting the work into small **helpers** with clear names keeps each piece easy to read and easy to test.',
        code: py`
def square(n):
    return n * n

def sum_of_squares(a, b):
    return square(a) + square(b)

print(sum_of_squares(3, 4))`,
        output: '25',
      },
      {
        kind: 'type',
        title: 'Call a helper',
        prompt: 'Finish `has_vowel`, using the helper `is_vowel`: loop over `word` with `ch`, return `True` as soon as `is_vowel(ch)` is true, and return `False` after the loop.',
        starter: py`
def is_vowel(ch):
    return ch in "aeiou"

def has_vowel(word):`,
        answer: py`
    for ch in word:
        if is_vowel(ch):
            return True
    return False`,
        ideas: ['call a function', 'early return'],
        hint: 'The same shape as `has_big`: a loop, an `if` that calls the helper, `return True` inside it, and `return False` back at the level of the `for`.',
        explain:
          '`has_vowel("tree")` returns `True` at the first `e` without looking any further, and `has_vowel("sky")` runs out of letters and returns `False`. The helper keeps the loop readable: the `if` line says what it means.',
      },
      {
        kind: 'type',
        title: 'Find the bug',
        prompt: `\`count_big(nums)\` should return how many numbers in \`nums\` are greater than 10, so \`count_big([12, 5, 40])\` should be \`2\`. It returns \`1\`:

\`\`\`
def count_big(nums):
    count = 0
    for n in nums:
        if n > 10:
            count += 1
        return count
\`\`\`

Find the bug, then write the whole function again with it fixed.`,
        answer: py`
def count_big(nums):
    count = 0
    for n in nums:
        if n > 10:
            count += 1
    return count`,
        accept: [
          py`
def count_big(nums):
    count = 0
    for n in nums:
        if n > 10:
            count = count + 1
    return count`,
        ],
        check: py`
assert count_big([12, 5, 40]) == 2
assert count_big([40, 5, 12, 11]) == 3
assert count_big([]) == 0`,
        hint: 'Trace the call by hand: how many passes does the loop get through before the function ends?',
        explain:
          '`return` ends the function on the spot. Indented inside the loop, `return count` ran at the end of the **first** pass, after looking at 12 only. One level to the left, it runs once, after the loop has seen every number. When a function gives up too early, look at where its `return` lines sit.',
      },
      {
        kind: 'text',
        title: 'Scope: where names live',
        body: `A function's parameters, and the variables created inside it, are **local**: they exist only while the function runs, and they never clash with names outside it. That is why two functions can both use \`n\` or \`count\` without getting in each other's way.

It also means a function gives something back only through \`return\`. Changing a local variable changes nothing outside the function.`,
      },
      {
        kind: 'quiz',
        q: 'What does this print?',
        code: py`
def bump(x):
    x = x + 1
    return x

x = 5
bump(x)
print(x)`,
        options: ['5', '6', 'None', 'An error'],
        answer: 0,
        explain:
          'The `x` inside `bump` is a local variable, separate from the `x` outside. `bump(x)` returns 6, but nothing stores that result, so the outer `x` is still 5. To keep it, write `x = bump(x)`.',
      },
      {
        kind: 'code',
        title: 'A helper inside a function',
        body: 'A function defined **inside** another one can read the outer function’s variables, so it needs fewer parameters: here `in_range` uses `low` and `high` without being handed them. About a quarter of the 150 solutions are built this way, with a helper (often called `dfs`) inside the main function.',
        code: py`
def count_between(nums, low, high):
    def in_range(n):
        return low <= n <= high     # low and high: the outer function's

    count = 0
    for n in nums:
        if in_range(n):
            count += 1
    return count

print(count_between([5, 12, 7, 30], 6, 20))`,
        output: '2',
      },
      {
        kind: 'type',
        title: 'Define a helper inside',
        prompt: 'Inside `count_long`, define a helper called `is_long` that takes a word `w` and returns whether `len(w)` is greater than `limit`.',
        starter: 'def count_long(words, limit):',
        answer: py`
    def is_long(w):
        return len(w) > limit`,
        accept: [
          py`
    def is_long(w):
        return limit < len(w)`,
        ],
        pick: [
          py`
def is_long(w):
    return len(w) > limit`,
          py`
    def is_long(w):
        print(len(w) > limit)`,
          py`
def is_long(w):
    print(len(w) > limit)`,
        ],
        ideas: ['nested def'],
        hint: 'The helper’s `def` line is indented once, because it lives inside `count_long`. Its body is indented once more.',
        explain:
          'Indented once, the helper sits inside `count_long`, where it can read `limit`. At the left edge it would be a separate function that has never heard of `limit`. And it has to `return` its answer: `print` would only show it.',
      },
      {
        kind: 'type',
        title: 'Write and use a helper',
        prompt: 'Inside `keep_small`, define a helper `is_small(n)` that returns whether `n` is less than `limit`. Then return a list of the numbers in `nums` that are small: a list comprehension with `n` that keeps `n` only `if is_small(n)`.',
        starter: 'def keep_small(nums, limit):',
        answer: py`
    def is_small(n):
        return n < limit
    return [n for n in nums if is_small(n)]`,
        accept: [
          py`
    def is_small(n):
        return limit > n
    return [n for n in nums if is_small(n)]`,
        ],
        ideas: ['nested def'],
        hint: 'The helper’s `def` is indented once and its body twice. The last line, `return [...]`, lines up with the helper’s `def`.',
        explain:
          '`is_small` reads `limit` from `keep_small`, so it takes only `n`. The comprehension then calls it once per number: `keep_small([5, 12, 7], 10)` returns `[5, 7]`.',
      },
      {
        kind: 'code',
        title: 'nonlocal',
        body: 'A nested function can **read** an outer variable freely. But an assignment like `count += 1` makes Python treat `count` as a brand-new local variable, and the function stops with an `UnboundLocalError`. Declare the name `nonlocal` first and the assignment changes the outer variable. Only a handful of the 150 solutions need this, so it is enough to recognize it.',
        code: py`
def count_over(nums, limit):
    count = 0
    def check(n):
        nonlocal count      # use the outer count
        if n > limit:
            count += 1

    for n in nums:
        check(n)
    return count

print(count_over([5, 12, 7, 30], 6))`,
        output: '3',
      },
      {
        kind: 'type',
        title: 'A helper with nonlocal',
        prompt: 'Finish `tally` so it returns the sum of `nums`, with a helper. Define `add(x)` inside it: declare `total` as `nonlocal` there, then add `x` to `total`. After the helper, loop over `nums` with `n`, calling `add(n)`, and return `total`.',
        starter: py`
def tally(nums):
    total = 0`,
        answer: py`
    def add(x):
        nonlocal total
        total += x
    for n in nums:
        add(n)
    return total`,
        accept: [
          py`
    def add(x):
        nonlocal total
        total = total + x
    for n in nums:
        add(n)
    return total`,
        ],
        ideas: ['nested def', 'call a function'],
        hint: 'The `def` line is indented once, because `add` lives inside `tally`, and its two lines once more: `nonlocal total` first. The loop and the `return` line up with the `def`.',
        explain:
          '`add` is defined inside `tally`, so it can see `total`. Because `total += x` assigns to it, `add` declares `nonlocal total` first. This is the shape of most tree and graph solutions: the outer function sets things up, an inner helper does the work, and the outer function returns the result.',
      },
    ],
  },

  // ── 7 ────────────────────────────────────────────────────────────────────
  {
    id: 'classes-and-nodes',
    title: 'Classes and Nodes',
    icon: '🔗',
    blurb: 'Classes, __init__ and self, linked-list nodes, and why answers live in class Solution.',
    minutes: 28,
    slides: [
      {
        kind: 'text',
        title: 'Classes bundle data and behavior',
        body: `A **class** is a blueprint for objects. Each object (an **instance**) carries its own data in **attributes**, and has its own **methods**: the functions you call with a dot. You have used both already: a list is an object, and \`items.append(3)\` calls one of its methods.

You will write classes in two places: the \`class Solution:\` wrapper LeetCode puts around every answer, and node types like \`ListNode\` and \`TreeNode\` that linked lists and trees are built from.`,
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
        title: 'A class with __init__',
        prompt: 'Define a class `Pet` whose `__init__` takes `name` and stores it in `self.name`. Then create `p = Pet("Rex")` and print `p.name`.',
        answer: py`
class Pet:
    def __init__(self, name):
        self.name = name
p = Pet("Rex")
print(p.name)`,
        pick: [
          py`
class Pet:
    def __init__(self, name):
        name = name
p = Pet("Rex")
print(p.name)`,
          py`
class Pet:
    def __init__(name):
        name = name
p = Pet("Rex")
print(p.name)`,
        ],
        ideas: ['class'],
        hint: '`__init__` takes `self` first, then `name`. After the class, go back to the left edge to create the object.',
        explain:
          '`Pet("Rex")` makes a new object and runs `__init__` with `self` set to that object and `name` set to `"Rex"`. `self.name = name` saves it on the object, so `p.name` reads it back afterward. A plain `name = name` saves nothing on the object.',
        output: 'Rex',
      },
      {
        kind: 'type',
        title: 'A Point class',
        prompt: 'Define a class `Point` whose `__init__` takes `x` and `y` and stores them in `self.x` and `self.y`. Then create `p = Point(3, 4)` and print `p.x + p.y`.',
        answer: py`
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
p = Point(3, 4)
print(p.x + p.y)`,
        accept: [
          py`
class Point:
    def __init__(self, x, y):
        self.y = y
        self.x = x
p = Point(3, 4)
print(p.x + p.y)`,
          py`
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
p = Point(3, 4)
print(p.y + p.x)`,
          py`
class Point:
    def __init__(self, x, y):
        self.y = y
        self.x = x
p = Point(3, 4)
print(p.y + p.x)`,
        ],
        ideas: ['class'],
        hint: 'The same shape as `Pet`, with two parameters after `self` and one `self.` line for each. After the class, go back to the left edge to create the object.',
        explain:
          '`Point(3, 4)` runs `__init__` with `x` = 3 and `y` = 4, and each `self.` line saves one value on the new object. `p.x + p.y` reads them back: 7. `ListNode` and `TreeNode` are built the same way.',
        output: '7',
      },
      {
        kind: 'type',
        title: 'One method calls another',
        prompt: 'Inside a class, one method calls another through `self`. Make `greet` return `"Hi "` joined to what the `name` method returns.',
        starter: py`
class Greeter:
    def name(self):
        return "Ada"

    def greet(self):`,
        answer: py`
        return "Hi " + self.name()`,
        pick: [
          py`
        return "Hi " + name()`,
          py`
        return "Hi " + self.name`,
          py`
        return "Hi " + name`,
        ],
        ideas: ['self.method()'],
        hint: 'The method lives on the object: `self.` in front of its name, and `()` to call it.',
        explain:
          '`self.name()` finds the `name` method on this object and calls it, so `greet` returns `"Hi Ada"`. Without `self.`, Python looks for a plain function called `name` and stops with a `NameError`. Without the parentheses, `self.name` is the method itself, not the text it returns.',
      },
      {
        kind: 'type',
        title: 'Call a method from a method',
        prompt: 'Finish `add_all`: loop over `songs` with `song`, and add each one to the playlist by calling the `add` method through `self`.',
        starter: py`
class Playlist:
    def __init__(self):
        self.songs = []

    def add(self, song):
        self.songs.append(song)

    def add_all(self, songs):`,
        answer: py`
        for song in songs:
            self.add(song)`,
        ideas: ['self.method()'],
        hint: 'A bare `add(song)` raises a `NameError`: the method lives on the object, so it needs `self.` in front.',
        explain:
          'Methods live on the object, so one method calls another as `self.add(song)`, and Python fills in `self` for you. Design problems such as *Min Stack* and *LRU Cache* are small classes like this one: their methods share data through `self` and call each other.',
      },
      {
        kind: 'code',
        title: 'Node classes',
        body: 'This is how LeetCode defines a linked-list node: a value, plus a reference to the next node. `val=0` and `next=None` are **default values**: leave an argument out and the parameter gets its default. So `ListNode(3)` has `next` set to `None`, which marks the end of the list.',
        code: py`
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

head = ListNode(1, ListNode(2, ListNode(3)))
print(head.val)
print(head.next.val)
print(head.next.next.next)    # past the last node`,
        output: py`
1
2
None`,
      },
      {
        kind: 'code',
        title: 'Walking a linked list',
        body: 'A linked list has no indexes: you only hold its first node, the **head**. To visit every node, keep a variable on the current one and move it along with `node = node.next`. After the last node it becomes `None`, which counts as false, so the loop ends.',
        code: py`
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

head = ListNode(4, ListNode(1, ListNode(5)))
node = head
total = 0
while node:
    total += node.val
    node = node.next
print(total)`,
        output: '10',
      },
      {
        kind: 'type',
        title: 'Walk a linked list',
        prompt: 'Print every value in the list, front to back, one per line. Use a variable called `node` that starts at `head`, and move it along with `.next` inside a `while` loop.',
        starter: py`
class ListNode:
    def __init__(self, val=0, next=None):
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
        pick: [
          py`
node = head
while node:
    print(node)
    node = node.next`,
          py`
node = head
while node:
    print(node)
node = node.next`,
        ],
        ideas: ['linked list walk'],
        hint: 'Inside the loop: print `node.val`, then step with `node = node.next`. Forget the step and the loop never ends.',
        explain:
          '`node` starts at the first node. Each pass prints its value, `node.val` (printing `node` itself would show the object, not the number), and steps to the next node. The step is inside the loop: outside it, `node` would never move and the loop would never end. After the last node, `node` is `None`, which counts as false, so the loop stops.',
        output: py`
1
2
3`,
      },
      {
        kind: 'code',
        title: 'Changing an object vs moving a name',
        body: 'A variable is a **name** for an object, not a box holding its own copy. `b = a` gives one list two names. **Mutating** the object (`b.append(4)`, `node.next = None`) shows through every name it has. **Reassigning** a name (`b = [9]`, `node = node.next`) only points that one name somewhere else.',
        code: py`
a = [1, 2, 3]
b = a                # a second name for the same list
b.append(4)          # mutate: the one list changes
print(a)
b = [9]              # reassign: b now names another list
print(a, b)

def add_zero(nums):
    nums.append(0)   # mutates the caller's list

add_zero(a)
print(a)`,
        output: py`
[1, 2, 3, 4]
[1, 2, 3, 4] [9]
[1, 2, 3, 4, 0]`,
      },
      {
        kind: 'quiz',
        q: 'What does this print?',
        code: py`
def clear(nums):
    nums = []

def push(nums):
    nums.append(7)

data = [1, 2]
clear(data)
push(data)
print(data)`,
        options: ['`[1, 2, 7]`', '`[7]`', '`[]`', '`[1, 2]`'],
        answer: 0,
        explain:
          '`clear` only **reassigns** its local name `nums` to a new empty list; the caller’s list is untouched. `push` **mutates** the list it was given, and `data` is another name for that same list, so the 7 shows up. It is why walking a list with `node = node.next` never damages it, and why a nested helper can `res.append(x)` to an outer list without `nonlocal`.',
      },
      {
        kind: 'code',
        title: 'Why class Solution?',
        body: 'LeetCode asks you to fill in one method of a `Solution` class, then creates an object and calls that method for each test. `nums: List[int]` and `-> int` are **type hints**: they tell the reader that `nums` is a list of ints and that the method returns an int. Python does not enforce them. `max(a, b)` gives the larger of two values, and `min(a, b)` the smaller.',
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
from typing import List

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
        ideas: ['return'],
        hint: 'It is the `maxValue` method from the last slide, with `min` in place of `max`. The last line, `return best`, is not inside the loop.',
        explain:
          '`best` starts as the first number. Each pass keeps the smaller of `best` and `n`, so after the loop `best` is the smallest number, and the method returns it. Filling in the body under a given `def` line is exactly what you do on LeetCode.',
      },
      {
        kind: 'text',
        title: 'Reading the type hints',
        body: `The hints on a LeetCode method tell you what you are given and what to hand back:

- \`nums: List[int]\`: a list of ints
- \`s: str\`, \`k: int\`: a string, an int
- \`-> bool\`: return \`True\` or \`False\`
- \`head: Optional[ListNode]\`: a \`ListNode\`, or \`None\` for an empty list
- \`-> None\`: return nothing, and change the input in place instead

\`self\` has no hint, and you never pass it yourself: it is the \`Solution\` object.`,
      },
      {
        kind: 'type',
        title: 'A method with type hints',
        prompt: 'Inside `class Solution`, add a method called `largest`. It takes `self` and `nums`, typed `List[int]`, and returns an `int`. Its body returns `max(nums)`, the largest item of the list.',
        starter: py`
from typing import List

class Solution:`,
        answer: py`
    def largest(self, nums: List[int]) -> int:
        return max(nums)`,
        pick: [
          py`
    def largest(nums: List[int]) -> int:
        return max(nums)`,
          py`
    def largest(self, nums: List[int]) -> int
        return max(nums)`,
          py`
    def largest(nums: List[int]) -> int
        return max(nums)`,
        ],
        ideas: ['method signature'],
        hint: 'Copy the shape of `maxValue`: `self` first, then `nums: List[int]`, then `-> int` and a colon. The body is indented one more level.',
        explain:
          '`self` always comes first in a method, and LeetCode passes it for you. `nums: List[int]` and `-> int` are type hints: they say what goes in and what comes out, but Python does not enforce them. The colon still ends the line, after the `-> int`. Given a whole list, `max` returns its largest item.',
      },
      {
        kind: 'quiz',
        q: 'A method starts with `def middle(self, head: Optional[ListNode]) -> Optional[ListNode]:`. What does that line tell you?',
        options: [
          '`head` is a node or `None`, and so is what you return',
          '`head` is a Python list of nodes',
          'Python raises an error when `head` is `None`',
          'You may leave `head` out when you call the method',
        ],
        answer: 0,
        explain:
          '`Optional[X]` means *an X, or `None`*. For a linked list, `None` is the empty list, so most solutions deal with that case first. Hints are for readers; Python never checks them.',
      },
      {
        kind: 'type',
        title: 'A LeetCode method on a linked list',
        prompt: 'Inside `class Solution`, add the method `countNodes`. It takes `self` and `head`, typed `Optional[ListNode]`, and returns an `int`: the number of nodes in the list. In its body, start `count` at `0` and `node` at `head`, walk the list with `while node:`, adding `1` to `count` before each step, and return `count`.',
        starter: py`
from typing import Optional

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class Solution:`,
        answer: py`
    def countNodes(self, head: Optional[ListNode]) -> int:
        count = 0
        node = head
        while node:
            count += 1
            node = node.next
        return count`,
        accept: [
          py`
    def countNodes(self, head: Optional[ListNode]) -> int:
        node = head
        count = 0
        while node:
            count += 1
            node = node.next
        return count`,
          py`
    def countNodes(self, head: Optional[ListNode]) -> int:
        count = 0
        node = head
        while node:
            count = count + 1
            node = node.next
        return count`,
          py`
    def countNodes(self, head: Optional[ListNode]) -> int:
        node = head
        count = 0
        while node:
            count = count + 1
            node = node.next
        return count`,
        ],
        ideas: ['method signature', 'linked list walk'],
        hint: 'The `def` line: `self`, then `head: Optional[ListNode]`, then `-> int` and a colon. The body is the walk from before, with `count += 1` in place of the `print`, and `return count` after the loop.',
        explain:
          'For an empty list, `head` is `None`, the loop never runs and the method returns 0: the `Optional` case takes care of itself. Otherwise each pass counts one node and steps to the next. A `Solution` method that walks a list with a `node` variable is how every linked-list problem starts.',
      },
    ],
  },

  // ── 8 ────────────────────────────────────────────────────────────────────
  {
    id: 'big-o',
    title: 'Big-O: How Fast Is It?',
    icon: '📈',
    blurb: 'Describe how running time and memory grow, and read constraints like a pro.',
    minutes: 27,
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
        kind: 'text',
        title: 'Feel the difference',
        body: `Steps needed for one million items:

- **log n**: about 20
- **n**: 1,000,000
- **n log n**: about 20,000,000
- **n²**: 1,000,000,000,000

A computer manages very roughly 10⁷ to 10⁸ simple steps per second. The first three finish in a blink; the n² version would run for hours.`,
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
        title: 'Count the steps of a nested loop',
        prompt: 'Count the work a nested loop does. Put a loop inside a loop: `for i in range(n):` and, inside it, `for j in range(n):`. Add 1 to `steps` in the inner loop, then print `steps` after both loops.',
        starter: py`
n = 300
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
          'A single loop over 300 items takes 300 steps: **O(n)**. Here the inner loop runs all 300 times for **each** of the 300 outer passes: 300 × 300 is 90,000 steps. Double `n` and the work grows four times. That is **O(n²)**, the cost of looking at every pair.',
        output: '90000',
      },
      {
        kind: 'quiz',
        q: 'Trace it. How many times does the line `count += 1` run?',
        code: py`
count = 0
for i in range(4):
    for j in range(i):
        count += 1`,
        options: ['4', '6', '10', '16'],
        answer: 1,
        explain:
          'The inner loop runs `i` times: 0 times when `i` is 0, then 1, 2 and 3 times. 0 + 1 + 2 + 3 = **6**. With n in place of 4 that is about n²/2 steps, and Big-O drops the constant ½, so this loop is still **O(n²)**.',
      },
      {
        kind: 'code',
        title: 'Logarithmic: halving',
        body: 'When each step cuts the remaining work in half, even a million items take only about 20 steps. That is **O(log n)**: binary search, balanced trees and heaps all work this way.',
        code: py`
def halvings(n):
    steps = 0
    while n > 1:
        n //= 2           # short for n = n // 2
        steps += 1
    return steps

# The underscores in 1_000_000 only make it easier to read.
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
          py`
while size < n:
    steps += 1
    size = size * 2
print(steps)`,
          py`
while size < n:
    steps = steps + 1
    size *= 2
print(steps)`,
          py`
while size < n:
    steps = steps + 1
    size = size * 2
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
        body: `Big-O also measures **extra memory**. A handful of variables is **O(1)** space. Building a set of all n items is **O(n)** space. The input itself usually is not counted.

Often you **trade space for time**: an O(n) set can turn an O(n²) search into O(n).`,
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
- \`min(lst)\`, \`max(lst)\`, \`sum(lst)\` (the smallest item, the largest, and the total): O(n)

Put a hidden O(n) inside a loop and you have O(n²).`,
      },
      {
        kind: 'quiz',
        q: '`a` and `b` are lists of n numbers each. What is the time complexity of this code?',
        code: py`
count = 0
for x in a:
    if x in b:
        count += 1`,
        options: ['O(n)', 'O(n²)', 'O(log n)', 'O(n log n)'],
        answer: 1,
        explain:
          'It reads like one loop, but `x in b` scans the list `b`: O(n) work hidden inside an O(n) loop, so **O(n²)**. If `b` were a set, each check would be O(1) and the whole thing O(n).',
      },
      {
        kind: 'type',
        title: 'Swap a list scan for a set',
        prompt: 'The same job, made fast: print every number of `a` that is also in `b`. Make a set called `seen` from `b`. Then loop with `for x in a:` and print every `x` that is in `seen`.',
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

- n ≤ 10: O(n!) is fine (try every ordering; n! is n × (n − 1) × … × 1, the number of ways to order n things)
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
          'Shorten the variable names to speed it up',
          'Nothing: Big-O does not apply to Python',
        ],
        answer: 1,
        explain: '10⁵ squared is 10¹⁰ steps, far too slow. At this size, aim for O(n log n) or O(n).',
      },
    ],
  },

  // ── 9 ────────────────────────────────────────────────────────────────────
  {
    id: 'recursion',
    title: 'Recursion',
    icon: '🌀',
    blurb: 'Functions that call themselves: base cases, the call stack, and trusting the recursion.',
    minutes: 31,
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
        return              # no value: it only ends the function
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
        title: 'The recursive step',
        prompt: '`power(base, exp)` returns `base` multiplied by itself `exp` times. The base case is done. Finish it with the last line: return `base` times `power` with one less `exp`.',
        starter: py`
def power(base, exp):
    if exp == 0:
        return 1`,
        answer: '    return base * power(base, exp - 1)',
        accept: ['    return power(base, exp - 1) * base'],
        pick: [
          '    return base * power(base, exp)',
          '    return power(base, exp - 1)',
          '    return power(base, exp)',
        ],
        ideas: ['recursive call'],
        hint: 'Copy the shape of `factorial`: `n * factorial(n - 1)`. This time the call keeps `base` and makes `exp` one smaller.',
        explain:
          '2⁴ is 2 × 2³, so `power(base, exp)` is `base * power(base, exp - 1)`. Each call makes `exp` one smaller until the base case returns 1; a call with the same `exp` would never reach it. Without `base *`, every call just passes the 1 back up.',
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
    pad = "  " * depth       # two spaces, repeated depth times
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
        q: 'Trace it. The calls pile up until one reaches the base case. At that deepest point, which calls are on the call stack, oldest first?',
        code: py`
def mystery(n):
    if n == 0:
        return 0
    return n + mystery(n - 1)

print(mystery(3))`,
        options: [
          '`mystery(3)`, `mystery(2)`, `mystery(1)`, `mystery(0)`',
          '`mystery(0)`, `mystery(1)`, `mystery(2)`, `mystery(3)`',
          '`mystery(3)` and `mystery(0)`',
          'Only `mystery(0)`',
        ],
        answer: 0,
        explain:
          'Each call waits for the next one, so all four are on the stack at once: `mystery(3)` at the bottom and `mystery(0)` on top. Then they finish in reverse order, handing back 0, then 1, then 3, and finally 6 (3 + 2 + 1 + 0), which is what gets printed.',
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
        pick: [
          py`
    if n < 10:
        return 0
    return n % 10 + digit_sum(n // 10)`,
          py`
    if n < 10:
        return n
    return n // 10 + digit_sum(n % 10)`,
          py`
    if n < 10:
        return 0
    return n // 10 + digit_sum(n % 10)`,
        ],
        ideas: ['base case'],
        hint: '`472 % 10` is 2, the last digit, and `472 // 10` is 47, the rest. The recursive call gets the smaller number.',
        explain:
          '`digit_sum(472)` is 2 + `digit_sum(47)`, which is 7 + `digit_sum(4)`, and 4 is a single digit: the base case, which returns the digit itself, not 0. Each call takes the last digit with `%` and passes the rest on with `//`, so the calls always reach a number under 10 and stop.',
      },
      {
        kind: 'text',
        title: 'Trust the recursion',
        body: `Tracing a tiny call shows you how recursion runs. To **write** it, don't trace every call in your head. Instead:

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
        prompt: 'Write `length(nums)`, which returns how many items are in the list `nums`. Use recursion, and no `len`.',
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
        check: py`
assert length([]) == 0
assert length([7]) == 1
assert length([4, 1, 6]) == 3

# Recursion: length has to call itself.
inner = length
calls = []
def length(nums):
    calls.append(1)
    return inner(nums)
assert inner([4, 1, 6]) == 3
assert calls, "use recursion: length should call itself on a smaller list"`,
        ideas: ['recursive call', 'base case'],
        hint: 'It has the same shape as `total` from earlier. Which list has a length you know without counting? And if a call told you the length of everything after the first item, `nums[1:]`, what would you add to it?',
        explain:
          'An empty list has length 0: that is the base case. Any other list is one item plus the rest, and you trust the call on `nums[1:]` to measure the rest.',
      },
      {
        kind: 'type',
        title: 'Reverse a string',
        prompt: 'Write `reverse(s)`, which returns the string `s` backward, using recursion. Then, below the function, print `reverse("stressed")`.',
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
        check: py`
assert reverse("") == ""
assert reverse("ab") == "ba"
assert reverse("level up") == "pu level"

# Recursion: reverse has to call itself.
inner = reverse
calls = []
def reverse(s):
    calls.append(1)
    return inner(s)
assert inner("abc") == "cba"
assert calls, "use recursion: reverse should call itself on a shorter string"`,
        hint: 'The base case is the empty string. For the step, trust `reverse` to turn around everything after the first character, `s[1:]`. Where does the first character, `s[0]`, go then? The `print` line starts at the left edge.',
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
        kind: 'quiz',
        q: 'Trace the calls. How many times is `fib(1)` called while this runs?',
        code: py`
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

fib(4)`,
        options: ['1', '2', '3', '5'],
        answer: 2,
        explain:
          '`fib(4)` calls `fib(3)` and `fib(2)`. `fib(3)` calls `fib(2)` and `fib(1)`. Each of the two `fib(2)` calls then makes its own `fib(1)` call: **3** in all. The same small questions get answered again and again, and it gets much worse as n grows.',
      },
      {
        kind: 'code',
        title: 'Why naive fib is O(2ⁿ)',
        body: 'Counting the calls for n = 10, 20 and 30: every call splits into two more, so the total explodes, about 120 times bigger for every 10 added to n. Almost all of those calls are repeats.',
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
        kind: 'type',
        title: 'How deep is the tree?',
        prompt: 'Each `Node` has two children, `left` and `right`, which are `None` when missing. Write `depth(node)`: if `node is None` (the usual way to ask whether a value is `None`), return `0`; otherwise return `1` plus the `max` of the depths of `node.left` and `node.right`. Then print `depth(root)`.',
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

  // ── 10 ───────────────────────────────────────────────────────────────────
  {
    id: 'data-structures-tour',
    title: 'A Tour of Data Structures',
    icon: '🧰',
    blurb: 'Arrays, hash maps, stacks, queues, linked lists, trees, heaps and graphs.',
    minutes: 38,
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
        title: 'Hash map: the first letter that appears once',
        prompt: 'Write `first_unique(word)`, which returns the first letter of `word` that appears exactly once in it, or `""` when every letter repeats. So `first_unique("level")` is `"v"`.',
        starter: 'from collections import Counter',
        answer: py`
def first_unique(word):
    count = Counter(word)
    for ch in word:
        if count[ch] == 1:
            return ch
    return ""`,
        accept: [
          py`
def first_unique(word):
    count = {}
    for ch in word:
        count[ch] = count.get(ch, 0) + 1
    for ch in word:
        if count[ch] == 1:
            return ch
    return ""`,
        ],
        check: py`
assert first_unique("level") == "v"
assert first_unique("aabb") == ""
assert first_unique("z") == "z"
assert first_unique("") == ""
assert first_unique("abcab") == "c"`,
        hint: 'Two passes. First count every letter, with `Counter(word)` or a dict and `.get`. Then walk `word` again and return the first letter whose count is 1. If the loop ends, nothing was unique.',
        explain:
          'Counting first makes every *how often does this letter appear?* question an O(1) lookup, so two passes over the word are enough: O(n). Without the counts you would rescan the word for each letter, which is O(n²). Counting like this is the first step in problems like *Valid Anagram* and *Top K Frequent Elements*.',
      },
      {
        kind: 'code',
        title: 'Stack: last in, first out',
        body: 'Like a pile of plates: you only touch the top. It is the list with `append` and `pop` that you already know. Great for matching brackets, undo, *most recent unmatched thing* problems, and depth-first search without recursion.',
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
        prompt: '`"cy"` joins the back of the line: `append` it to `q`. Then loop while `q` is not empty and, in a single line, take the name at the front with `popleft()` and print it.',
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
        pick: [
          py`
q.append("cy")
while q:
    print(q.pop())`,
          py`
q.append("cy")
while q:
print(q.popleft())`,
          py`
q.append("cy")
while q:
print(q.pop())`,
        ],
        ideas: ['deque'],
        hint: 'An empty deque counts as false, so `while q:` stops once everyone is served. `print(q.popleft())` removes and prints in one step.',
        explain:
          'First in, first out: the names leave in the order they arrived. `pop()` would take the newest name instead, as a stack does. This `while q:` loop with `popleft()` is the heart of breadth-first search (BFS), which you will write in the graphs unit.',
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
        body: 'The nodes joined by `next` that you walked in *Classes and Nodes*. There is no indexing: reaching item k means walking k steps. But once you hold a node, inserting or removing next to it is O(1), because you only change a `next` or two.',
        code: py`
class ListNode:
    def __init__(self, val=0, next=None):
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
        title: 'Add up a linked list',
        prompt: 'Write `list_sum(head)`, which returns the sum of every value in the linked list that starts at `head`, and `0` when `head` is `None`.',
        starter: py`
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next`,
        answer: py`
def list_sum(head):
    total = 0
    node = head
    while node:
        total += node.val
        node = node.next
    return total`,
        accept: [
          py`
def list_sum(head):
    total = 0
    while head:
        total += head.val
        head = head.next
    return total`,
          py`
def list_sum(head):
    if not head:
        return 0
    return head.val + list_sum(head.next)`,
        ],
        check: py`
assert list_sum(ListNode(4, ListNode(1, ListNode(5)))) == 10
assert list_sum(ListNode(7)) == 7
assert list_sum(None) == 0`,
        ideas: ['linked list walk'],
        hint: 'Walk the list as before: a `node` variable that starts at `head` and moves with `node = node.next` while it is not `None`. Keep a running total as you go.',
        explain:
          'Each pass adds the current value and steps to the next node: 4 + 1 + 5 = 10. An empty list never enters the loop, so it sums to 0. Recursion works too: the sum of a list is its first value plus the sum of the rest.',
      },
      {
        kind: 'type',
        title: 'Front of the line to the back',
        prompt: 'Take the name at the front of `q` off with `popleft()`, storing it in `first`. Then `append` `first` to the back, and print `list(q)`.',
        starter: py`
from collections import deque

q = deque(["ann", "bo", "cy"])`,
        answer: py`
first = q.popleft()
q.append(first)
print(list(q))`,
        ideas: ['deque'],
        hint: '`popleft()` hands back the name it removes, so you can store it: `first = q.popleft()`.',
        explain:
          '`popleft()` takes `"ann"` off the front and `append` puts her at the back, so the line becomes `bo`, `cy`, `ann`. Both ends of a `deque` are O(1), which is why queues use it instead of a list.',
        output: "['bo', 'cy', 'ann']",
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
        body: 'A heap (priority queue) keeps the smallest item on top without fully sorting. Great for *top k*, *k-th largest*, merging sorted lists and shortest paths. `import heapq` fetches the whole `heapq` module, so its functions are written with the module name in front: `heapq.heappush`. It is a min-heap; for a max-heap, push negated values.',
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
        prompt: 'Push every `x` in `nums` onto the heap `h` with `heapq.heappush`. Then loop while `h` is not empty and, in a single line, pop the smallest with `heapq.heappop` and print it.',
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
        pick: [
          py`
for x in nums:
    heapq.heappush(x, h)
while h:
    print(heapq.heappop(h))`,
          py`
for x in nums:
    h.heappush(x)
while h:
    print(heapq.heappop(h))`,
        ],
        ideas: ['heapq'],
        hint: '`heapq.heappush(h, x)` takes the heap first, then the value. The `while` loop starts at the left edge, after the `for` loop.',
        explain:
          'Each pop takes the smallest item left, so the numbers come out in sorted order, and every push and pop costs only O(log n). The heap is a plain list, so the functions live in `heapq` and take the list first. For a max-heap, push `-x` and flip the sign back when you pop.',
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
        kind: 'type',
        title: 'The two smallest',
        prompt: 'Push every `x` in `nums` onto `h` with `heapq.heappush`. Then, in one `print`, pop the two smallest with `heapq.heappop`.',
        starter: py`
import heapq

nums = [9, 4, 7, 1]
h = []`,
        answer: py`
for x in nums:
    heapq.heappush(h, x)
print(heapq.heappop(h), heapq.heappop(h))`,
        ideas: ['heapq'],
        hint: 'The `for` loop pushes. The `print` goes after it, at the left edge, with two `heapq.heappop(h)` calls inside, separated by a comma.',
        explain:
          'The heap keeps the smallest value on top, so the first pop gives 1 and the second gives 4, the smallest of what is left. For the k smallest, pop k times: each pop is only O(log n).',
        output: '1 4',
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
        pick: [
          py`
for u, v in edges:
    graph[u].append(v)
print(graph[2])`,
          py`
for u, v in edges:
    graph[u].append(v)
    print(graph[2])`,
        ],
        ideas: ['adjacency list'],
        hint: 'Inside the loop, `graph[u].append(v)` and its mirror image. The `print` goes after the loop, so it is not indented.',
        explain:
          "Each edge joins two nodes, so `v` goes in `u`'s list and `u` goes in `v`'s list: with only one direction, node 2 would miss its neighbor 1. Node 2 is on both edges, so its neighbors are `[1, 3]`. The `print` runs once, after the loop.",
        output: '[1, 3]',
      },
      {
        kind: 'type',
        title: 'One-way streets',
        prompt: 'These streets are one-way, so store each edge in one direction only. Loop with `for u, v in streets:` and append `v` to `graph[u]`. After the loop, print `graph["a"]` and `graph["c"]` on one line.',
        starter: py`
from collections import defaultdict

streets = [("a", "b"), ("a", "c"), ("b", "c")]
graph = defaultdict(list)`,
        answer: py`
for u, v in streets:
    graph[u].append(v)
print(graph["a"], graph["c"])`,
        ideas: ['adjacency list'],
        hint: 'One line inside the loop this time. Nothing is ever added to `graph["c"]`, but a `defaultdict(list)` gives an empty list instead of an error.',
        explain:
          'In a one-way (directed) graph, each edge is stored once: `u` points to `v`. No street leaves `c`, so `graph["c"]` is the empty list that `defaultdict(list)` creates. Course prerequisites form a directed graph like this one.',
        output: "['b', 'c'] []",
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

  // ── 11 ───────────────────────────────────────────────────────────────────
  {
    id: 'solving-a-problem',
    title: 'How to Solve a Problem',
    icon: '🧠',
    blurb: 'A repeatable framework from first read to tested, explained code.',
    minutes: 32,
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
        body: 'Correct, but O(n²) time: for each character we re-scan everything before it. (`repr(...)` shows a string with its quotes, so that an empty one is visible.)',
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
        kind: 'quiz',
        q: 'Back to pair sum, before any code. At each number `x` you want to know: *have I already passed its partner, `target - x`, and at which index?* What should you keep as you scan, and why?',
        options: [
          'A set of the numbers seen: a set lookup is the fastest there is',
          'A dict from each number seen to its index: one lookup answers both questions',
          'A sorted copy of the list: sorted data is quicker to search',
          'A list of the numbers seen: `in` works on a list too',
        ],
        answer: 1,
        explain:
          'The answer is two **indices**, so knowing only *that* the partner was seen (a set) is not enough: you need *where*. A dict from number to index gives both in one O(1) lookup. A list makes every check O(n) again, and sorting loses the original positions.',
      },
      {
        kind: 'type',
        title: 'Optimize: pair sum in one pass',
        prompt: 'Now write the fast `pair_sum`. As before, it returns the indices `[i, j]`, smaller index first, of two different numbers in `nums` that add up to `target`, or `[]` if there are none. This time, go through the list **once**, with no inner loop.',
        starter: 'def pair_sum(nums, target):',
        check: py`
assert pair_sum([2, 7, 4, 9], 13) == [2, 3]
assert pair_sum([5, 5], 10) == [0, 1]
assert pair_sum([3, 1], 6) == []
assert pair_sum([5], 10) == []
assert pair_sum([], 5) == []

class Watched(list):
    # Counts how often the list is read, to tell one pass from a loop inside a loop.
    reads = 0
    def __iter__(self):
        Watched.reads += len(self)
        return super().__iter__()
    def __getitem__(self, i):
        Watched.reads += len(self) if isinstance(i, slice) else 1
        return super().__getitem__(i)
    def __contains__(self, x):
        Watched.reads += len(self)
        return super().__contains__(x)
    def index(self, *args):
        Watched.reads += len(self)
        return super().index(*args)
    def count(self, x):
        Watched.reads += len(self)
        return super().count(x)

big = Watched(range(0, 200, 2))
assert pair_sum(big, 5) == []
assert Watched.reads <= 5 * len(big), "too slow: go through the list once, with no inner loop"`,
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
          py`
    seen = {}
    for i, x in enumerate(nums):
        if (target - x) in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []`,
          py`
    seen = {}
    for i, x in enumerate(nums):
        if (target - x) in seen:
            return [seen[target - x], i]
        else:
            seen[x] = i
    return []`,
          py`
    seen = dict()
    for i, x in enumerate(nums):
        if (target - x) in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []`,
          py`
    seen = dict()
    for i, x in enumerate(nums):
        if (target - x) in seen:
            return [seen[target - x], i]
        else:
            seen[x] = i
    return []`,
        ],
        hint: 'Keep a dict from each number you have passed to its index. At each number, look for its partner, `target - x`, in the dict **before** you store the number itself, so it never pairs with itself. `enumerate` gives you each index with its number.',
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
        kind: 'quiz',
        q: 'Another one: *you get a **sorted** list of a million numbers and one target, and must say whether the target is in the list.* Which approach fits best, and why?',
        options: [
          'Build a set of the numbers, then look the target up: set lookups are O(1)',
          'Binary search: the list is sorted, so every step can throw away half of it',
          'Scan from the front: O(n) is always fast enough',
          'Push everything onto a heap: it keeps the smallest number on top',
        ],
        answer: 1,
        explain:
          'Sorted input is the signal for binary search: about 20 steps for a million numbers. Building a set costs a full O(n) pass before the first lookup, which only pays off when there are many targets to look up. Two things decided it: a property of the input (*sorted*) and how many questions will be asked.',
      },
      {
        kind: 'text',
        title: 'Step 7: Test it yourself',
        body: `Don't just say *I think it works*. Pick a small example and trace your code line by line, tracking the variables out loud.

Then try the edge cases, smallest inputs first: an empty one, a single element, a repeated value. The next lesson has the full checklist. Catching your own bug in an interview counts **for** you, not against you.`,
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
        prompt: '`assert` stops the program with an error when what follows it is false. Check three cases with it: `pair_sum([], 5)` is `[]`, `pair_sum([5], 10)` is `[]`, and `pair_sum([5, 5], 10)` is `[0, 1]`. Then print `all tests pass`.',
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
        pick: [
          py`
assert pair_sum([], 5) == []
assert pair_sum([5], 10) == [0, 0]
assert pair_sum([5, 5], 10) == [0, 1]
print("all tests pass")`,
          py`
assert pair_sum([], 5) = []
assert pair_sum([5], 10) == [0, 0]
assert pair_sum([5, 5], 10) == [0, 1]
print("all tests pass")`,
        ],
        ideas: ['assert'],
        hint: 'Each line reads `assert pair_sum(...) == expected`. Compare with `==`, not `=`.',
        explain:
          'An empty list, a single number (which must not pair with itself, so the answer is `[]`, not `[0, 0]`) and a repeated value are exactly the cases the clarifying questions uncovered. Each check compares with `==`. If any `assert` failed, Python would stop with an `AssertionError` before the `print`.',
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
        q: 'One more problem, and this time the plan is yours: *return `True` if any number appears more than once in a list of up to 100,000 numbers.* Which plan would you code?',
        options: [
          'Compare every pair of numbers with two nested loops',
          'Walk the list once, keeping a set of the numbers seen so far',
          'Walk the list once, keeping a list of the numbers seen so far',
          'Push every number onto a stack, then pop them one by one',
        ],
        answer: 1,
        explain:
          'Comparing every pair is O(n²): about 5 billion steps for 100,000 numbers. What that brute force does over and over is ask *have I seen this before?*, and a set answers that in O(1). A list of seen numbers looks similar, but each `in` scans it, so it is O(n²) again. A stack only ever shows its top.',
      },
      {
        kind: 'type',
        title: 'Solve one from scratch',
        prompt: `Write \`has_duplicate(nums)\`: return \`True\` if any number appears more than once in \`nums\`, and \`False\` otherwise.

No steps this time, but it has to stay fast on a list of 100,000 numbers. Code your plan, then test it in your head on \`[]\` and \`[7, 7]\` before you check it.`,
        check: py`
assert has_duplicate([4, 1, 7, 1]) is True
assert has_duplicate([4, 1, 7]) is False
assert has_duplicate([7, 7]) is True
assert has_duplicate([7]) is False
assert has_duplicate([]) is False

class Watched(list):
    # Counts how often the list is read, to tell one pass from a loop inside a loop.
    reads = 0
    def __iter__(self):
        Watched.reads += len(self)
        return super().__iter__()
    def __getitem__(self, i):
        Watched.reads += len(self) if isinstance(i, slice) else 1
        return super().__getitem__(i)
    def __contains__(self, x):
        Watched.reads += len(self)
        return super().__contains__(x)
    def index(self, *args):
        Watched.reads += len(self)
        return super().index(*args)
    def count(self, x):
        Watched.reads += len(self)
        return super().count(x)

big = Watched(range(100))
assert has_duplicate(big) is False
assert Watched.reads <= 5 * len(big), "too slow for 100,000 numbers: go through the list once"`,
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
        hint: 'Start with an empty set, then loop. If the number is already in the set, you have your answer; otherwise add it. What should the function return when the loop ends without finding a repeat?',
        explain:
          'Each number is checked against `seen` in O(1), so the whole function is **O(n)** time and O(n) space, instead of O(n²) for comparing every pair. This is also Contains Duplicate, the first problem in the Arrays & Hashing unit.',
      },
    ],
  },

  // ── 12 ───────────────────────────────────────────────────────────────────
  {
    id: 'leetcode-mechanics',
    title: 'How LeetCode Works',
    icon: '💻',
    blurb: 'Starter signatures, running tests, reading constraints and catching edge cases.',
    minutes: 31,
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
        body: 'The shape you met in *Classes and Nodes*. You write only the body: never rename the method or change its parameters. On LeetCode, `List`, `Optional`, `collections` and `heapq` are already imported, so your answer needs no `import` lines; here we import `List` so the snippet runs on its own.',
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
        kind: 'text',
        title: "Return, don't print",
        body: `Your method must **return** the answer. Printing it does nothing for the grader (prints only show up in the output panel, which is handy for debugging).

Return the right **type**, too: \`True\` or \`False\` for a yes/no question, an int for *how many*, a list for *return all*. Some problems say *modify the input in place*: then you change it and return nothing.`,
      },
      {
        kind: 'text',
        title: 'Run before you submit',
        body: `Click **Run** to try the given examples first, then add your own custom tests, especially tiny ones and edge cases.

When a test fails, LeetCode shows the input, your output and the expected output. Read all three, trace your code on that exact input, and fix the real cause. Don't just patch that one case with an \`if\`.`,
      },
      {
        kind: 'type',
        title: 'Find the bug from the verdict',
        prompt: `You submit this method and LeetCode says **Wrong Answer**. For the input \`nums = [3, 8, 5]\` it expected \`8\`, and your output was \`null\`, LeetCode's word for \`None\`:

\`\`\`
class Solution:
    def largest(self, nums: List[int]) -> int:
        best = nums[0]
        for n in nums:
            best = max(best, n)
        print(best)
\`\`\`

Find the bug, then write the body of \`largest\` again with it fixed.`,
        starter: py`
from typing import List

class Solution:
    def largest(self, nums: List[int]) -> int:`,
        answer: py`
        best = nums[0]
        for n in nums:
            best = max(best, n)
        return best`,
        accept: [
          py`
        best = nums[0]
        for n in nums:
            best = max(n, best)
        return best`,
          py`
        return max(nums)`,
        ],
        check: py`
assert Solution().largest([3, 8, 5]) == 8
assert Solution().largest([-4]) == -4`,
        hint: 'The method ran without crashing, and LeetCode still received `None`. What does a function hand back when it ends without reaching a `return`?',
        explain:
          'The loop was right all along: it even printed 8 in the output panel. But the grader only sees what the method **returns**, and a method that ends without a `return` hands back `None`. With `return best` in place of `print(best)`, the same test passes.',
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
        body: `The constraints quietly tell you which solution is expected. You know the main one from the Big-O lesson: the size limit sets the complexity to aim for. Two more are worth a glance:

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
        prompt: 'Finish `average` so that it returns the average of the numbers in `nums`: their `sum` divided by how many there are. For an empty list, it must return `0.0`.',
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
        check: py`
assert Solution().average([2, 4]) == 3.0
assert Solution().average([5]) == 5.0
assert Solution().average([]) == 0.0`,
        hint: 'What does `sum(nums) / len(nums)` do when the list is empty? Deal with that case first, then the normal one. An empty list counts as false.',
        explain:
          'Without the check, `average([])` divides by zero and LeetCode reports a **Runtime Error**. Handling the edge case first, then the normal case, keeps the main logic clean.',
      },
      {
        kind: 'type',
        title: 'Test the empty case',
        prompt: 'Make a `Solution` object called `sol`. Then check two cases with `assert`: `sol.average([])` is `0.0`, and `sol.average([2, 4])` is `3.0`. Finally, print `tests pass`.',
        starter: py`
from typing import List

class Solution:
    def average(self, nums: List[int]) -> float:
        if not nums:
            return 0.0
        return sum(nums) / len(nums)`,
        answer: py`
sol = Solution()
assert sol.average([]) == 0.0
assert sol.average([2, 4]) == 3.0
print("tests pass")`,
        ideas: ['assert'],
        hint: '`Solution()`, with parentheses, makes the object. Each check reads `assert sol.average(...) == expected`, with `==`, not `=`.',
        explain:
          'Both checks pass, so the program reaches the `print`. Testing the empty case yourself, before you submit, catches the crash LeetCode would report as a Runtime Error.',
        output: 'tests pass',
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
        body: `That's the foundations done. Next come the pattern units: each starts with a short guide and a template you fill in, then guided problems from easiest to hardest where you write each solution yourself, and every problem you finish joins your daily review.

Start with **Arrays & Hashing**. You already know its secret weapon: the set. Come back tomorrow and keep the streak going.`,
      },
    ],
  },
];

/** The track in order: the lessons above, with each lesson of foundations-extra.ts placed after the one it names. */
export const FOUNDATIONS: Lesson[] = BASE.flatMap((l) => [l, ...EXTRA_LESSONS.filter((e) => e.after === l.id).map((e) => e.lesson)]);
