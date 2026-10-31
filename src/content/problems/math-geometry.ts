import { py, type CategoryContent } from '../types';

const content: CategoryContent = {
  guide: {
    category: 'math-geometry',
    summary: `This unit is a toolbox of small tricks rather than one big pattern. Three of them show up again and again.

**Matrix index tricks.** A grid is a list of rows, and \`matrix[r][c]\` is row \`r\`, column \`c\`. Rotating or walking a grid is careful index juggling. A 90° clockwise turn is a **transpose** (swap \`matrix[r][c]\` with \`matrix[c][r]\`) followed by **reversing each row**. A spiral walk keeps four shrinking boundaries: \`top\`, \`bottom\`, \`left\`, \`right\`.

**Digit tricks.** \`x % 10\` is the last digit of \`x\`, and \`x // 10\` removes it. Repeat until \`x\` is 0 to visit every digit. To build a number back up, use \`result = result * 10 + digit\`. When numbers are stored as strings or digit lists, do the arithmetic the way you learned at school: column by column, carrying.

**Fast exponentiation.** To compute x to the power n, do not multiply n times. Square the base and halve the exponent: x¹⁰ = (x²)⁵. That needs only about log₂(n) steps.`,
    analogy:
      "Think of a Rubik's cube. The moves look magical, but each one is a fixed, learnable sequence. Learn the few standard moves here (transpose, peel a digit, square-and-halve) and most problems become a matter of applying them in the right order.",
    whenToUse: [
      'Rotate, flip or mirror a square grid **in place** → transpose and/or reverse rows',
      'Visit a grid in a spiral or layer by layer → **four shrinking boundaries**',
      'Work with the digits of a number → `% 10` and `// 10` in a loop',
      'Numbers too big for normal integers, given as strings or digit lists → **grade-school arithmetic** with carries',
      'Compute a huge power → **fast exponentiation**, O(log n)',
      'A process repeats and might loop forever → remember the states you have seen in a **set**',
    ],
    template: py`
# 1. Rotate an n x n grid 90 degrees clockwise, in place
def rotate(matrix):
    n = len(matrix)
    for r in range(n):
        for c in range(r + 1, n):          # transpose: mirror across the diagonal
            matrix[r][c], matrix[c][r] = matrix[c][r], matrix[r][c]
    for row in matrix:                     # then flip each row left to right
        row.reverse()

# 2. Visit the digits of a non-negative integer, last digit first
def digits_of(x):
    digits = []
    while x > 0:
        digits.append(x % 10)              # peel off the last digit
        x //= 10                           # and drop it
    return digits

# 3. Fast power: x to the n using about log2(n) loop steps
def power(x, n):
    result = 1
    while n > 0:
        if n % 2 == 1:                     # odd exponent: set one x aside
            result *= x
        x *= x                             # square the base ...
        n //= 2                            # ... and halve the exponent
    return result`,
    templateNotes: [
      'Transpose only swaps cells **above** the diagonal (`c > r`). Swapping every pair would swap each one twice and undo the work.',
      'Counter-clockwise is the mirror image: transpose, then reverse the **order of the rows** instead of each row.',
      'For negative numbers, Python `%` and `//` round toward minus infinity (`-7 % 10` is `3`), so work with `abs(x)` and put the sign back at the end.',
      'Fast power is binary in disguise: each loop step looks at one bit of `n`.',
    ],
    complexity: 'Grid tricks: O(rows × cols). Digit loops: O(number of digits). Fast power: O(log n).',
    quiz: [
      {
        q: 'What are `4729 % 10` and `4729 // 10`?',
        options: ['`9` and `472`', '`4` and `729`', '`472` and `9`', '`9` and `472.9`'],
        answer: 0,
        explain: '`% 10` keeps the last digit. `// 10` divides by 10 and throws away the remainder, which drops that digit.',
      },
      {
        q: 'Which recipe rotates a square matrix 90° clockwise in place?',
        options: ['Transpose, then reverse each row', 'Reverse each row twice', 'Transpose twice', 'Sort each row'],
        answer: 0,
        explain: 'Transposing turns rows into columns. Reversing each row then puts them in clockwise order.',
      },
      {
        q: 'About how many loop steps does fast exponentiation need for an exponent of 1,000,000?',
        options: ['About 20', 'About 1,000', 'About 500,000', 'About 1,000,000'],
        answer: 0,
        explain: 'The exponent is halved every step, and log₂(1,000,000) is about 20.',
      },
      {
        q: 'In a spiral walk, you just finished the top row. What changes next?',
        options: ['`top` moves down by one', '`bottom` moves up by one', '`left` moves right by one', 'Nothing until the lap ends'],
        answer: 0,
        explain: 'That row is fully visited, so the top boundary moves down and the next side starts from the new top.',
      },
    ],
  },

  problems: [
    {
      id: 'rotate-image',
      num: 48,
      title: 'Rotate Image',
      difficulty: 'Medium',
      category: 'math-geometry',
      pattern: 'Transpose, then reverse each row',
      prompt:
        'You get an `n × n` grid of numbers. Rotate it **90 degrees clockwise** by changing the grid itself. Do not build a second grid, and do not return anything.',
      examples: [
        { input: 'matrix = [[1, 2], [3, 4]]', output: '[[3, 1], [4, 2]]' },
        {
          input: 'matrix = [[10, 20, 30], [40, 50, 60], [70, 80, 90]]',
          output: '[[70, 40, 10], [80, 50, 20], [90, 60, 30]]',
          note: 'The first column, read bottom to top, becomes the first row.',
        },
      ],
      signals: ['"rotate the image by 90 degrees"', '"in place": no second grid allowed', 'square n × n grid'],
      hints: [
        'Look at where the first row ends up after rotating. Where does the first column go?',
        'A clockwise turn can be split into two simpler moves, each easy to do in place.',
        'Transpose (swap `matrix[i][j]` with `matrix[j][i]`), then reverse every row.',
      ],
      brute:
        'Build a new grid where `new[c][n - 1 - r] = matrix[r][c]`, then copy it back. Easy, but it uses **O(n²)** extra space, which the problem forbids.',
      insight:
        'A clockwise turn is two in-place moves: **transpose** (mirror across the main diagonal) and then **reverse each row**.',
      mnemonic: 'Transpose, then flip each row: a clockwise turn.',
      steps: [
        'Get the side length n.',
        'Loop over every cell above the main diagonal.',
        'Swap it with its mirror cell across the diagonal.',
        'Reverse every row.',
      ],
      solution: py`
class Solution:
    def rotate(self, matrix: List[List[int]]) -> None:
        #@ n is the side length of the square grid.
        n = len(matrix)
        #@ Step 1, transpose: visit each cell above the diagonal (j > i) exactly once...
        for i in range(n):
            for j in range(i + 1, n):  #!
                #@ ...and swap it with its mirror cell. Rows become columns.
                matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]  #!
        #@ Step 2, reverse every row. Transpose plus reversed rows is a 90-degree clockwise turn.
        for row in matrix:
            row.reverse()  #!`,
      time: 'O(n²)',
      space: 'O(1)',
      complexityWhy: 'There are n² cells and each is touched a constant number of times. All swaps happen inside the grid.',
      pitfalls: [
        'Starting `j` at 0 instead of `i + 1` swaps every pair twice, which puts everything back where it started.',
        'Reversing the *order of the rows* instead of each row gives a counter-clockwise turn.',
        'Writing `matrix = new_grid` only rebinds your local name. LeetCode checks the original grid, so change it in place.',
      ],
    },
    {
      id: 'spiral-matrix',
      num: 54,
      title: 'Spiral Matrix',
      difficulty: 'Medium',
      category: 'math-geometry',
      pattern: 'Four shrinking boundaries',
      prompt:
        'Given an `m × n` grid, return all its values in **spiral order**: right along the top row, down the right column, left along the bottom row, up the left column, then keep circling inward.',
      examples: [
        { input: 'matrix = [[1, 2, 3], [8, 9, 4], [7, 6, 5]]', output: '[1, 2, 3, 4, 5, 6, 7, 8, 9]' },
        { input: 'matrix = [[1, 2], [3, 4], [5, 6]]', output: '[1, 2, 4, 6, 5, 3]' },
        { input: 'matrix = [[5], [6], [7]]', output: '[5, 6, 7]', note: 'A single column: only the down move does anything.' },
      ],
      signals: ['"spiral order"', 'walk the outer ring, then the next ring inside', 'grid can be rectangular, not just square'],
      hints: [
        'Each lap of the spiral walks the outermost unvisited row or column on every side.',
        'Track four boundaries: top, bottom, left, right. After walking a side, move that boundary inward.',
        'Before walking the bottom row and the left column, check the boundaries have not crossed. Thin grids end mid-lap.',
      ],
      brute:
        'Simulate with a direction and a `visited` grid, turning right whenever you hit an edge or a visited cell. It is **O(m · n)** time but needs **O(m · n)** extra space for `visited`.',
      insight:
        'Keep four walls, `top`, `bottom`, `left` and `right`, around the unvisited part. Walk one side, then **move that wall inward**. Stop when the walls cross.',
      mnemonic: 'Right, down, left, up, then shrink the walls.',
      steps: [
        'Set four boundaries: top, bottom, left and right.',
        'Loop while top <= bottom and left <= right.',
        'Walk the top row left to right, then move top down.',
        'Walk the right column top to bottom, then move right inward.',
        'If rows remain, walk the bottom row right to left, then move bottom up.',
        'If columns remain, walk the left column bottom to top, then move left inward.',
      ],
      solution: py`
class Solution:
    def spiralOrder(self, matrix: List[List[int]]) -> List[int]:
        #@ Four walls surround the part of the grid we have not visited yet.
        result = []
        top, bottom = 0, len(matrix) - 1
        left, right = 0, len(matrix[0]) - 1
        #@ Keep circling while an unvisited rectangle remains.
        while top <= bottom and left <= right:  #!
            #@ Walk the top row left to right, then push the top wall down.
            for col in range(left, right + 1):
                result.append(matrix[top][col])
            top += 1
            #@ Walk the right column top to bottom, then pull the right wall in.
            for row in range(top, bottom + 1):
                result.append(matrix[row][right])
            right -= 1
            #@ If a row is still left, walk the bottom row right to left, then raise the bottom wall.
            if top <= bottom:  #!
                for col in range(right, left - 1, -1):
                    result.append(matrix[bottom][col])
                bottom -= 1
            #@ If a column is still left, walk the left column bottom to top, then push the left wall right.
            if left <= right:  #!
                for row in range(bottom, top - 1, -1):
                    result.append(matrix[row][left])
                left += 1
        #@ Every cell has been visited exactly once.
        return result`,
      time: 'O(m · n)',
      space: 'O(1)',
      complexityWhy: 'Each of the m · n cells is added once. Apart from the output list, we only store four integers.',
      pitfalls: [
        'Skipping the `top <= bottom` and `left <= right` checks repeats values when a single row or column is left (try `[[1, 2, 3]]`).',
        'Off-by-one in the backward ranges: `range(right, left - 1, -1)` is what includes `left`.',
        'The order of the four sides matters. It must be right, down, left, up.',
      ],
    },
    {
      id: 'set-matrix-zeroes',
      num: 73,
      title: 'Set Matrix Zeroes',
      difficulty: 'Medium',
      category: 'math-geometry',
      pattern: 'First row and column as markers',
      prompt:
        'You get an `m × n` grid. Wherever a cell is `0`, set its **entire row and entire column** to `0`. Change the grid in place. Stretch goal: use only O(1) extra memory.',
      examples: [
        { input: 'matrix = [[1, 2, 3], [4, 0, 6], [7, 8, 9]]', output: '[[1, 0, 3], [0, 0, 0], [7, 0, 9]]' },
        { input: 'matrix = [[0, 5, 2], [3, 4, 1]]', output: '[[0, 0, 0], [0, 4, 1]]', note: 'The 0 in the corner clears row 0 and column 0.' },
      ],
      signals: ['"set its entire row and column to 0"', '"in place"', 'follow-up asks for constant extra space'],
      hints: [
        'If you clear rows as soon as you find a 0, the new zeros trick you into clearing even more. First *record* which rows and columns to clear.',
        'Two sets (rows and columns) work with O(m + n) space. Could the grid itself hold those marks?',
        'Use the first row and the first column as the marks. Remember separately whether they themselves started with a zero.',
      ],
      brute:
        'Copy the whole grid, then for each 0 in the copy clear its row and column in the original: **O(m · n)** extra space. Recording zero rows and columns in two sets is better at **O(m + n)**, and the marker trick gets it to O(1).',
      insight:
        'Use the **first row and first column as a notebook**: `matrix[r][0] = 0` means "clear row r" and `matrix[0][c] = 0` means "clear column c". Two booleans remember whether the notebook row and column need clearing themselves.',
      mnemonic: 'Mark in the margins, clear the inside, do the margins last.',
      steps: [
        'Record whether the first row and the first column contain a zero.',
        'For each zero in the inner grid, mark its row in column 0 and its column in row 0.',
        'Zero every inner cell whose row or column is marked.',
        'Zero the first row if it had a zero at the start.',
        'Zero the first column if it had a zero at the start.',
      ],
      solution: py`
class Solution:
    def setZeroes(self, matrix: List[List[int]]) -> None:
        #@ Grab the number of rows and columns.
        rows, cols = len(matrix), len(matrix[0])
        #@ Row 0 and column 0 will hold our marks, so first note whether they contain a real zero.
        first_row_zero = any(matrix[0][c] == 0 for c in range(cols))
        first_col_zero = any(matrix[r][0] == 0 for r in range(rows))
        #@ For each zero in the inner grid, mark its row (in column 0) and its column (in row 0).
        for r in range(1, rows):
            for c in range(1, cols):
                if matrix[r][c] == 0:
                    matrix[r][0] = 0  #!
                    matrix[0][c] = 0  #!
        #@ Use the marks: an inner cell becomes 0 if its row or its column was marked.
        for r in range(1, rows):
            for c in range(1, cols):
                if matrix[r][0] == 0 or matrix[0][c] == 0:  #!
                    matrix[r][c] = 0
        #@ Only now clear the first row, if it had a zero to begin with.
        if first_row_zero:
            for c in range(cols):
                matrix[0][c] = 0
        #@ Same for the first column.
        if first_col_zero:
            for r in range(rows):
                matrix[r][0] = 0`,
      time: 'O(m · n)',
      space: 'O(1)',
      complexityWhy: 'A few passes over the m · n cells. The marks live inside the grid, so we only need two extra booleans.',
      pitfalls: [
        'Zeroing rows and columns while still scanning creates new zeros that wipe out cells they should not.',
        'Clearing the first row or column *before* using them as markers erases the marks. Handle them last.',
        'The inner loops start at 1. Starting at 0 mixes the marker cells up with real data.',
      ],
    },
    {
      id: 'happy-number',
      num: 202,
      title: 'Happy Number',
      difficulty: 'Easy',
      category: 'math-geometry',
      pattern: 'Digit squares + cycle detection with a set',
      alsoAccept: ['arrays-hashing'],
      prompt:
        'Start with a positive integer `n`. Replace it with the **sum of the squares of its digits**, and keep repeating. If you eventually reach `1`, the number is *happy*: return `True`. If the process loops forever without reaching 1, return `False`.',
      examples: [
        { input: 'n = 7', output: 'True', note: '7 → 49 → 97 → 130 → 10 → 1.' },
        { input: 'n = 4', output: 'False', note: '4 → 16 → 37 → 58 → 89 → 145 → 42 → 20 → 4, a loop.' },
      ],
      signals: ['"repeat the process"', '"loops endlessly in a cycle"', 'works with the digits of a number'],
      hints: [
        'How can you get the digits of a number one at a time using arithmetic?',
        'The sequence either reaches 1 or repeats a number it has already produced. How can you notice a repeat?',
        'Keep a set of numbers seen so far. Stop when you reach 1 (happy) or a number already in the set (a loop).',
      ],
      brute:
        'Run the process for a fixed number of steps, say 1,000, and give up if 1 never shows. That is **O(1000 · digits)** and usually right, but it is a guess, not a proof. Detecting the loop is exact.',
      insight:
        'After a step or two the numbers stay small, so the sequence must either reach 1 or **repeat**. Catch the repeat with a **set** of seen numbers (fast and slow pointers also work).',
      mnemonic: 'Square the digits; seen it before means a loop.',
      steps: [
        'Create an empty set of seen numbers.',
        'While n is not 1 and not already seen, add n to the set.',
        'Split n into digits with % 10 and // 10.',
        'Replace n with the sum of the squared digits.',
        'Return whether n ended up equal to 1.',
      ],
      solution: py`
class Solution:
    def isHappy(self, n: int) -> bool:
        #@ Remember every number we reach. Meeting one again means we are stuck in a loop.
        seen = set()
        #@ Keep stepping until we reach 1 or a number we have seen before.
        while n != 1 and n not in seen:  #!
            seen.add(n)
            #@ One step: add up the squares of the digits, peeling them off with % 10 and // 10.
            total = 0
            while n > 0:
                digit = n % 10  #!
                total += digit * digit
                n //= 10
            #@ The sum becomes the next number in the chain.
            n = total
        #@ We stopped at 1 (happy) or on a repeat (a loop that never reaches 1).
        return n == 1`,
      time: 'O(log n)',
      space: 'O(log n)',
      complexityWhy: 'A number has about log n digits, and after one step even huge numbers fall below a few hundred, so only a handful of steps happen before 1 or a repeat.',
      pitfalls: [
        'Without the set (or another cycle check), unhappy numbers loop forever.',
        'Building the next number in `n` itself while still peeling its digits. Use a separate `total` and only then set `n = total`.',
        'Floyd fast and slow pointers also work in O(1) space: step one copy once and the other twice until they meet.',
      ],
    },
    {
      id: 'plus-one',
      num: 66,
      title: 'Plus One',
      difficulty: 'Easy',
      category: 'math-geometry',
      pattern: 'Right-to-left carry',
      prompt:
        'A large non-negative integer is stored as a list of its digits, most significant first, so `[4, 2]` means 42. Add **one** to the number and return the resulting list of digits.',
      examples: [
        { input: 'digits = [2, 5, 9]', output: '[2, 6, 0]', note: '259 + 1 = 260: the 9 rolls over and carries.' },
        { input: 'digits = [9, 9]', output: '[1, 0, 0]' },
        { input: 'digits = [4, 0, 7]', output: '[4, 0, 8]' },
      ],
      signals: ['number stored as a list of digits', '"increment by one"', 'carrying when a digit is 9'],
      hints: [
        'Do it the way you add 1 on paper: start at the rightmost digit.',
        'If that digit is less than 9, add one and you are done. What if it is a 9?',
        'A 9 becomes 0 and the carry moves left. If every digit was 9, put a 1 in front.',
      ],
      brute:
        'Join the digits into an int, add 1, and split it back into digits. Python makes that easy, but other languages cannot hold a 100-digit number, and interviewers want the digit version. Both are **O(n)**.',
      insight:
        'Only trailing **9s** cause work: they become 0 and pass the carry left. The first digit that is not 9 simply goes up by one, and you stop.',
      mnemonic: 'Nines become zeros; the first non-nine goes up.',
      steps: [
        'Walk the digits from right to left.',
        'If the digit is less than 9, add one and return the list.',
        'Otherwise set the digit to 0 and keep carrying left.',
        'If every digit was 9, return a 1 followed by all the zeros.',
      ],
      solution: py`
class Solution:
    def plusOne(self, digits: List[int]) -> List[int]:
        #@ Work from the last digit toward the first, like adding by hand.
        for i in range(len(digits) - 1, -1, -1):
            #@ A digit below 9 just goes up by one. Nothing carries, so we are done.
            if digits[i] < 9:  #!
                digits[i] += 1
                return digits
            #@ A 9 rolls over to 0, and the 1 carries into the digit on its left.
            digits[i] = 0  #!
        #@ Every digit was 9 (like 999), so the answer needs a new leading 1 (1000).
        return [1] + digits  #!`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy: 'One right-to-left pass over n digits. We usually edit the list in place; only an all-9s number needs a new list of n + 1 digits.',
      pitfalls: [
        'Forgetting the all-9s case: `[9, 9, 9]` must become `[1, 0, 0, 0]`, which is one digit longer.',
        'Carrying on after a digit below 9. Once there is no carry, stop immediately.',
        'Walking left to right. Carries travel from the last digit toward the front.',
      ],
    },
    {
      id: 'powx-n',
      num: 50,
      title: 'Pow(x, n)',
      difficulty: 'Medium',
      category: 'math-geometry',
      pattern: 'Fast (binary) exponentiation',
      prompt:
        'Compute `x` raised to the power `n`. Here `x` is a decimal number and `n` is an integer that can be **negative** and as large as about two billion in size. Do not use the built-in power operator or `pow`.',
      examples: [
        { input: 'x = 3.0, n = 4', output: '81.0' },
        { input: 'x = 2.0, n = -3', output: '0.125', note: '2 to the -3 is 1 / 2³ = 1/8.' },
        { input: 'x = 1.5, n = 0', output: '1.0', note: 'Anything to the power 0 is 1.' },
      ],
      signals: ['"implement pow(x, n)"', 'exponent can be huge (up to about 2³¹)', 'negative exponents'],
      hints: [
        'Multiplying x by itself n times takes n steps, which is far too many when n is two billion.',
        'Notice that x⁸ = ((x²)²)². Repeated squaring jumps through powers very quickly.',
        'Repeatedly square x and halve n. When n is odd, multiply the current x into the result. For negative n, use 1 / x and -n.',
      ],
      brute:
        'Multiply `x` into a result `|n|` times: **O(n)**, about two billion multiplications in the worst case.',
      insight:
        'Use x to the n = (x²) to the n/2: **square the base and halve the exponent** each step. When `n` is odd, set one `x` aside in the result. That takes only **O(log n)** steps.',
      mnemonic: 'Odd? Take one x. Then square x and halve n.',
      steps: [
        'If n is negative, replace x with 1 / x and n with -n.',
        'Start the result at 1.',
        'While n is above 0, if n is odd multiply the result by x.',
        'Square x and halve n.',
        'Return the result.',
      ],
      solution: py`
class Solution:
    def myPow(self, x: float, n: int) -> float:
        #@ A negative power is 1 over the positive power, so flip x and make n positive.
        if n < 0:  #!
            x = 1 / x
            n = -n
        #@ result collects the answer. x will take the values x, x², x⁴, x⁸ ... as we square it.
        result = 1.0
        while n > 0:
            #@ If n is odd, one copy of the current x belongs in the answer.
            if n % 2 == 1:  #!
                result *= x
            #@ Square the base and halve the exponent: x to the n equals (x²) to the n/2.
            x *= x  #!
            n //= 2
        #@ All the pieces have been multiplied in.
        return result`,
      time: 'O(log n)',
      space: 'O(1)',
      complexityWhy: 'n is halved every loop, so there are about log₂(n) loops, each with at most two multiplications.',
      pitfalls: [
        'Forgetting negative exponents: x to the -n is 1 / (x to the n).',
        'Recursing as `myPow(x, n - 1)` is O(n) and blows past the recursion limit for large n.',
        'In languages with 32-bit ints, `-n` overflows when n is -2³¹. Python integers do not have that problem, but mention it in an interview.',
      ],
    },
    {
      id: 'multiply-strings',
      num: 43,
      title: 'Multiply Strings',
      difficulty: 'Medium',
      category: 'math-geometry',
      pattern: 'Grade-school multiplication into a digit array',
      prompt:
        'Two non-negative integers are given as **strings** of digits, `num1` and `num2`. Return their product, also as a string. You may not turn the whole strings into integers or use a big-number library.',
      examples: [
        { input: 'num1 = "12", num2 = "34"', output: '"408"' },
        { input: 'num1 = "99", num2 = "9"', output: '"891"' },
        { input: 'num1 = "0", num2 = "52"', output: '"0"' },
      ],
      signals: ['numbers given as strings', '"must not convert the inputs to integers directly"', 'numbers can be up to 200 digits long'],
      hints: [
        'How did you learn to multiply two multi-digit numbers on paper?',
        'An m-digit number times an n-digit number has at most m + n digits. Prepare a list of that many zeros.',
        'Digit `i` of num1 times digit `j` of num2 belongs in slot `i + j + 1`, and its carry goes into slot `i + j`.',
      ],
      brute:
        'Add `num1` to itself `num2` times using string addition. With 200-digit numbers that is up to 10²⁰⁰ additions, hopelessly slow. Grade-school multiplication needs only **O(m · n)** digit products.',
      insight:
        'Do **grade-school multiplication** into a list of `m + n` slots. The product of `num1[i]` and `num2[j]` lands in slot `i + j + 1`, and any carry spills into slot `i + j`.',
      mnemonic: 'Digit i times digit j goes in slot i+j+1.',
      steps: [
        'If either number is "0", return "0".',
        'Create a result list of m + n zeros.',
        'Loop over every digit pair from right to left and multiply them.',
        'Add the product into slot i + j + 1 and keep only the last digit there.',
        'Carry the rest into slot i + j.',
        'Skip a leading zero and join the digits into a string.',
      ],
      solution: py`
class Solution:
    def multiply(self, num1: str, num2: str) -> str:
        #@ Anything times zero is "0". Handling it first means we never print extra zeros.
        if num1 == "0" or num2 == "0":
            return "0"
        #@ The product has at most m + n digits, so keep one slot per digit position.
        m, n = len(num1), len(num2)
        result = [0] * (m + n)  #!
        #@ Grade-school style: multiply every pair of digits, starting from the right.
        for i in range(m - 1, -1, -1):
            for j in range(n - 1, -1, -1):
                product = int(num1[i]) * int(num2[j])
                #@ This product belongs in slot i + j + 1. Add it to what is there, keep one digit, and carry the rest into slot i + j.
                total = result[i + j + 1] + product  #!
                result[i + j + 1] = total % 10
                result[i + j] += total // 10  #!
        #@ The first slot may be an unused 0. Skip it, then glue the digits into a string.
        start = 1 if result[0] == 0 else 0
        return "".join(str(d) for d in result[start:])`,
      time: 'O(m · n)',
      space: 'O(m + n)',
      complexityWhy: 'Every digit of num1 is multiplied by every digit of num2 once. The result list has m + n slots.',
      pitfalls: [
        'Leading zeros: the first slot may be 0, so skip it. Without the early "0" check, `"0" × "52"` would come out as `"00"`.',
        'Mixing up slots: with digits read left to right, the product goes in `i + j + 1`, not `i + j`.',
        'Forgetting to add the value already in the slot before taking `% 10` loses earlier partial sums.',
      ],
    },
    {
      id: 'detect-squares',
      num: 2013,
      title: 'Detect Squares',
      difficulty: 'Medium',
      category: 'math-geometry',
      pattern: 'Point counts + try every diagonal corner',
      prompt:
        'Design a class that stores points on a grid. `add(point)` stores a point (the same point can be added many times). `count(point)` returns how many ways you can choose **three stored points** that make a square with the query point. The square must have positive area and sides parallel to the x and y axes.',
      examples: [
        { input: 'add([1, 1]), add([1, 4]), add([4, 1]), then count([4, 4])', output: '1', note: 'Corners (1, 1), (1, 4), (4, 1) and (4, 4) form a 3 × 3 square.' },
        { input: 'same points, then count([2, 3])', output: '0' },
        { input: 'same points, add([1, 4]) again, then count([4, 4])', output: '2', note: 'Two copies of (1, 4) give two different squares.' },
      ],
      signals: ['"axis-aligned square with positive area"', 'duplicate points count separately', 'many add and count calls (a design problem)'],
      hints: [
        'If you know the query point and the corner diagonally opposite it, where must the other two corners be?',
        'For a diagonal corner (x, y) and query (qx, qy), the other corners are (qx, y) and (x, qy). It is a real square only if the x-distance equals the y-distance and is not 0.',
        'Keep a count for every point. For each stored point that could be the diagonal, add count(diagonal) × count((qx, y)) × count((x, qy)).',
      ],
      brute: 'For each `count` query, try every triple of stored points: **O(n³)** per query.',
      insight:
        'Choose the corner **diagonally opposite** the query. That one choice fixes the other two corners, so you just multiply three point counts. Trying every stored point as the diagonal is **O(n)** per query.',
      mnemonic: 'Pick the diagonal; the other two corners are forced.',
      steps: [
        'Keep a counter of how many times each point was added.',
        'On add, increase the counter for that point.',
        'On count, try every stored point as the diagonal corner.',
        'Skip it unless its x-distance equals its y-distance and is not zero.',
        'Add the product of the counts of the diagonal and the two other corners.',
      ],
      solution: py`
class DetectSquares:
    #@ Count how many times each exact point was added. A Counter returns 0 for missing points.
    def __init__(self):
        self.point_count = collections.Counter()

    #@ Adding a point just bumps its counter. Tuples can be dict keys; lists cannot.
    def add(self, point: List[int]) -> None:
        self.point_count[tuple(point)] += 1

    #@ To count squares with the query as one corner, try every stored point as the opposite (diagonal) corner.
    def count(self, point: List[int]) -> int:
        qx, qy = point
        total = 0
        for (x, y), cnt in self.point_count.items():
            #@ A diagonal corner must be the same non-zero distance away in x and in y, or no square fits.
            if abs(qx - x) != abs(qy - y) or x == qx:  #!
                continue
            #@ The other two corners are now fixed at (qx, y) and (x, qy). Multiply the three counts to count every combination.
            total += cnt * self.point_count[(qx, y)] * self.point_count[(x, qy)]  #!
        #@ Squares found from every possible diagonal.
        return total`,
      time: 'O(1) add, O(n) count',
      space: 'O(n)',
      complexityWhy: 'Adding is one dictionary update. Counting checks each of the n distinct stored points once. The counter holds up to n distinct points.',
      pitfalls: [
        'Skipping the zero-size check: a point with the same x as the query would form a "square" with no area.',
        'Duplicates matter. Multiply by the counts instead of just checking that the corners exist.',
        'With a `defaultdict`, even *reading* a missing key inserts it, which crashes while you are looping over that same dict. A `Counter` returns 0 without inserting.',
      ],
    },
  ],
};

export default content;
