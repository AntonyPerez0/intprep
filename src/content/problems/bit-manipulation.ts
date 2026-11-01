import { py, type CategoryContent } from '../types';

const content: CategoryContent = {
  guide: {
    category: 'bit-manipulation',
    summary: `Computers store every integer as **bits**, a row of 0s and 1s. For example, \`13\` is \`1101\` in binary: 8 + 4 + 0 + 1. Bit manipulation means working on those bits directly with a handful of operators:

- \`a & b\` (**AND**): 1 only where *both* bits are 1. \`1100 & 1010 = 1000\`
- \`a | b\` (**OR**): 1 where *either* bit is 1. \`1100 | 1010 = 1110\`
- \`a ^ b\` (**XOR**): 1 where the bits are *different*. \`1100 ^ 1010 = 0110\`
- \`x << k\` and \`x >> k\` (**shifts**): slide the bits left or right, which multiplies or divides by 2 for each step.

Three facts solve most problems. **XOR cancels pairs**: \`a ^ a = 0\` and \`a ^ 0 = a\`, in any order. **\`x & (x - 1)\` erases the lowest 1-bit** of \`x\`. And **\`x & 1\`** is the last bit, so it tells you whether \`x\` is odd.

One Python quirk: Python integers never overflow and can grow forever, so a negative number behaves as if it had *infinitely many* leading 1s. When a problem assumes 32-bit integers, keep only the low 32 bits with \`& 0xFFFFFFFF\`, then turn the result back into a negative number if its top bit (bit 31) is set.`,
    analogy:
      'Bits are a row of light switches. AND asks "are both switches on?", OR asks "is either on?", XOR asks "are they different?", and a shift slides the whole row of switches one place left or right.',
    whenToUse: [
      'Every value appears twice except one → **XOR** everything together',
      'Count or inspect the 1-bits of a number → `x & 1`, `x >> 1`, `x & (x - 1)`',
      'The problem says "without using + or -" or "32-bit integer" → bitwise arithmetic with a **32-bit mask**',
      'Reverse or rebuild a number bit by bit → shift bits **out** of one number and **into** another',
      'One number is missing from 0 to n → XOR (or sum) the indices and the values',
      'You need O(1) extra space where a hash set would be the easy answer → let the bits do the remembering',
    ],
    template: py`
# Truth table for one pair of bits
#   a  b | a & b   a | b   a ^ b
#   0  0 |   0       0       0
#   0  1 |   0       1       1
#   1  0 |   0       1       1
#   1  1 |   1       1       0

def get_bit(x, k):
    return (x >> k) & 1              # slide bit k to the end, keep only it

def count_ones(x):
    count = 0
    while x:
        x &= x - 1                   # erase the lowest 1-bit
        count += 1
    return count

def find_unpaired(nums):
    result = 0
    for n in nums:
        result ^= n                  # pairs cancel: a ^ a = 0
    return result

MASK = 0xFFFFFFFF                    # 32 one-bits
def to_int32(x):
    x &= MASK                        # keep only the low 32 bits
    if x > 0x7FFFFFFF:               # bit 31 set: it is a negative number
        x = ~(x ^ MASK)              # back to Python's negative number
    return x`,
    templateNotes: [
      '`x & 1` reads the last bit and `x >> 1` drops it. Together they walk through the bits from right to left.',
      '`x & (x - 1)` loops once per 1-bit, which beats checking all 32 positions when there are few 1s.',
      'XOR does not care about order: `a ^ b ^ a` is just `b`.',
      'Python ints have no fixed width. For 32-bit problems, mask with `0xFFFFFFFF`, and if bit 31 is set convert back with `~(x ^ MASK)`.',
      'Precedence trap: `+` and `-` bind tighter than `&`, `|` and `^`, so add parentheses: `(i & 1) + 1`.',
    ],
    complexity: 'Usually O(1) per number (at most 32 bits) and O(1) extra space.',
    quiz: [
      {
        q: 'What is `9 ^ 9 ^ 4`?',
        options: ['`4`', '`0`', '`22`', '`9`'],
        answer: 0,
        explain: '`9 ^ 9` is 0 because pairs cancel, and `0 ^ 4` is 4.',
      },
      {
        q: 'What does `x & (x - 1)` do?',
        options: ['Erases the lowest 1-bit of x', 'Doubles x', 'Flips every bit of x', 'Keeps only the highest bit of x'],
        answer: 0,
        explain:
          'Subtracting 1 turns the lowest 1-bit into 0 and the 0s below it into 1s. AND-ing with x wipes all of those out. Example: `12 & 11` is `1100 & 1011 = 1000`, which is 8.',
      },
      {
        q: 'Why do Python bit solutions often use `& 0xFFFFFFFF`?',
        options: [
          'Python ints never overflow, so we keep only the low 32 bits to act like a 32-bit machine',
          'It makes the code run faster',
          'It turns the number into a string',
          'It rounds the number to a power of two',
        ],
        answer: 0,
        explain: 'Without the mask, negative numbers carry infinitely many leading 1s and loops that shift carries can run forever.',
      },
      {
        q: 'What is `5 << 2`?',
        options: ['`20`', '`10`', '`1`', '`7`'],
        answer: 0,
        explain: 'Shifting left by 2 multiplies by 4: `101` becomes `10100`, which is 20.',
      },
    ],
  },

  problems: [
    {
      id: 'single-number',
      num: 136,
      title: 'Single Number',
      difficulty: 'Easy',
      category: 'bit-manipulation',
      pattern: 'XOR cancels pairs',
      prompt:
        'In a non-empty list of integers, every value appears **exactly twice** except one, which appears once. Return that lonely value. Aim for O(n) time and O(1) extra space.',
      examples: [
        { input: 'nums = [5, 3, 5]', output: '3' },
        { input: 'nums = [8, 2, 2, 7, 7]', output: '8' },
        { input: 'nums = [-4, 1, 1]', output: '-4', note: 'XOR works for negative numbers too.' },
      ],
      signals: ['"every element appears twice except for one"', 'O(1) extra space required', 'pairs that should cancel out'],
      hints: [
        'A set of seen numbers works, but it uses O(n) memory. Is there an operation where a number cancels itself out?',
        '`a ^ a = 0` and `a ^ 0 = a`, and XOR does not care about order.',
        'XOR all the numbers together. Every pair cancels, and the single number is left.',
      ],
      brute:
        'For each number, count how often it appears with an inner loop: **O(n²)**. A hash set or counter is **O(n)** time but also **O(n)** space.',
      insight:
        'XOR cancels pairs: `a ^ a = 0`. XOR **everything** together and all the pairs vanish, leaving only the single number.',
      mnemonic: 'XOR them all; the pairs cancel out.',
      steps: [
        'Start with result = 0.',
        'XOR every number into result.',
        'Return result, the number without a partner.',
      ],
      solution: py`
class Solution:
    def singleNumber(self, nums: List[int]) -> int:
        #@ Start from 0, because x ^ 0 = x leaves the first number unchanged.
        result = 0
        #@ XOR every number in. Each pair cancels itself (a ^ a = 0), whatever the order.
        for n in nums:
            result ^= n  #!
        #@ Only the number without a partner survives.
        return result`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy: 'One pass over n numbers with an O(1) XOR each, and a single variable for storage.',
      pitfalls: [
        'Starting `result` at anything other than 0 mixes that value into the answer.',
        'Using `+` or `-` instead of `^`: sums do not cancel pairs.',
        'This only works because the others appear an *even* number of times. If they appeared three times, you would need a different trick.',
      ],
    },
    {
      id: 'number-of-1-bits',
      num: 191,
      title: 'Number of 1 Bits',
      difficulty: 'Easy',
      category: 'bit-manipulation',
      pattern: 'n & (n - 1) erases the lowest 1-bit',
      prompt:
        'Given a positive integer `n`, return how many **1s** appear in its binary form. (This count is also called the *Hamming weight*.)',
      examples: [
        { input: 'n = 13', output: '3', note: '13 is 1101 in binary.' },
        { input: 'n = 64', output: '1', note: '64 is 1000000 in binary.' },
        { input: 'n = 255', output: '8', note: '255 is 11111111.' },
      ],
      signals: ['"number of set bits"', '"binary representation"', 'Hamming weight'],
      hints: [
        'You can read the last bit with `n & 1` and drop it with `n >> 1`.',
        'That visits every bit, even the 0s. Is there a way to jump straight from one 1-bit to the next?',
        '`n & (n - 1)` erases the lowest 1-bit. Count how many times you can do that before n reaches 0.',
      ],
      brute:
        'Count the 1 characters in `bin(n)`, or check all 32 positions with `n & 1` and `n >> 1`. Both are **O(32)** and fine, but `n & (n - 1)` only loops once per 1-bit.',
      insight:
        'Subtracting 1 flips the lowest 1-bit to 0 (and the 0s below it to 1s). So **`n & (n - 1)` erases exactly one 1-bit**. Count the erasures until `n` is 0.',
      mnemonic: 'n & (n − 1) erases a 1; count the erasures.',
      steps: [
        'Start a counter at 0.',
        'While n is not 0, erase its lowest 1-bit with n & (n - 1).',
        'Add one to the counter for each erasure.',
        'Return the counter.',
      ],
      solution: py`
class Solution:
    def hammingWeight(self, n: int) -> int:
        #@ count will hold how many 1-bits we have erased.
        count = 0
        #@ Keep going while any 1-bit is left.
        while n:
            #@ n & (n - 1) wipes out the lowest 1-bit. Each pass erases exactly one, so count it.
            n &= n - 1  #!
            count += 1
        #@ The number of erasures equals the number of 1-bits.
        return count`,
      time: 'O(1)',
      space: 'O(1)',
      complexityWhy: 'The loop runs once per 1-bit, which is at most 32 times for a 32-bit number.',
      pitfalls: [
        'Writing `n & (n - 1)` without assigning it back. It must be `n &= n - 1`, or the loop never ends.',
        'Precedence: in Python `n & n - 1` already means `n & (n - 1)`, but parentheses make your intent obvious.',
        'In Java or C, shifting a negative number right with `>>` fills in 1s and can loop forever. `n & (n - 1)` avoids shifting entirely.',
      ],
    },
    {
      id: 'counting-bits',
      num: 338,
      title: 'Counting Bits',
      difficulty: 'Easy',
      category: 'bit-manipulation',
      pattern: 'DP on bits: bits[i] = bits[i >> 1] + (i & 1)',
      alsoAccept: ['dp-1d'],
      prompt:
        'Given an integer `n`, return a list `ans` of length `n + 1` where `ans[i]` is the **number of 1-bits** in the binary form of `i`, for every `i` from 0 to `n`. Try to do it in a single O(n) pass.',
      examples: [
        { input: 'n = 4', output: '[0, 1, 1, 2, 1]', note: 'In binary: 0, 1, 10, 11, 100.' },
        { input: 'n = 6', output: '[0, 1, 1, 2, 1, 2, 2]' },
      ],
      signals: ['an answer for **every** number from 0 to n', 'counting 1-bits', 'follow-up asks for O(n), not O(n log n)'],
      hints: [
        'Counting the bits of each number separately repeats work. Could a smaller number answer most of the question?',
        '`i >> 1` is `i` with its last bit chopped off. It is smaller than `i`, so you already know its count.',
        '`bits[i] = bits[i >> 1] + (i & 1)`: the count without the last bit, plus the last bit itself.',
      ],
      brute:
        'Count the 1-bits of each number on its own: **O(n log n)** in total, since each number has about log n bits.',
      insight:
        'Chop off the last bit: `i >> 1` is a smaller number whose answer you **already computed**. So `bits[i] = bits[i >> 1] + (i & 1)`, a one-line DP.',
      mnemonic: 'Bits of i = bits of i/2, plus the last bit.',
      steps: [
        'Create a list bits of n + 1 zeros.',
        'Loop i from 1 up to n.',
        'Set bits[i] to bits[i >> 1] plus the last bit, i & 1.',
        'Return the list.',
      ],
      solution: py`
class Solution:
    def countBits(self, n: int) -> List[int]:
        #@ bits[i] will hold the number of 1s in i. bits[0] is 0.
        bits = [0] * (n + 1)
        #@ Fill in the answers from small to large, so smaller answers are ready to reuse.
        for i in range(1, n + 1):
            #@ i >> 1 is i without its last bit: smaller, so already solved. Add back that last bit, i & 1.
            bits[i] = bits[i >> 1] + (i & 1)  #!
        #@ Every count from 0 to n is filled in.
        return bits`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy: 'One O(1) step for each number from 1 to n. The output list itself has n + 1 entries.',
      pitfalls: [
        'The list has n + 1 entries (0 through n), not n.',
        'Missing parentheses: `bits[i >> 1] + i & 1` means `(bits[i >> 1] + i) & 1`, because `+` binds tighter than `&`.',
        'Another valid DP: `bits[i] = bits[i & (i - 1)] + 1`, which drops the lowest 1-bit instead of the last bit.',
      ],
    },
    {
      id: 'reverse-bits',
      num: 190,
      title: 'Reverse Bits',
      difficulty: 'Easy',
      category: 'bit-manipulation',
      pattern: 'Shift bits out of n and into the result',
      prompt:
        'Treat `n` as a **32-bit unsigned integer**. Reverse the order of all 32 bits, so the last bit becomes the first, and return the resulting number.',
      examples: [
        { input: 'n = 1', output: '2147483648', note: '000…0001 becomes 1000…0000, which is 2³¹.' },
        { input: 'n = 6', output: '1610612736', note: '000…0110 becomes 0110…000, which is 2³⁰ + 2²⁹.' },
      ],
      signals: ['"reverse the bits"', '"32-bit unsigned integer"', 'leading zeros matter'],
      hints: [
        'You can read bits off the end of `n` with `n & 1` and `n >>= 1`.',
        'Build the answer the opposite way: shift `result` left to make room, then drop the bit in.',
        'Do this exactly 32 times, even if `n` reaches 0 early, so every bit lands in the right place.',
      ],
      brute:
        'Turn `n` into a 32-character binary string with `format(n, "032b")`, reverse it, and read it back with `int(s, 2)`. It is also **O(32)**, but interviewers want to see the bit operations.',
      insight:
        'Move bits one at a time, like plates between two stacks: take from the **right end** of `n` and push onto the **right end** of `result`. The bit that comes off first ends up furthest to the left.',
      mnemonic: 'Pop a bit off n, push it onto result, 32 times.',
      steps: [
        'Start result at 0.',
        'Repeat exactly 32 times.',
        'Shift result left by one and OR in the last bit of n.',
        'Shift n right by one to drop that bit.',
        'Return result.',
      ],
      solution: py`
class Solution:
    def reverseBits(self, n: int) -> int:
        #@ result is built one bit at a time.
        result = 0
        #@ A 32-bit number has exactly 32 bits to move, leading zeros included.
        for _ in range(32):  #!
            #@ Shift result left to make room, then drop in the lowest bit of n.
            result = (result << 1) | (n & 1)  #!
            #@ Throw away the bit we just used, exposing the next one.
            n >>= 1
        #@ All 32 bits are now in reverse order.
        return result`,
      time: 'O(1)',
      space: 'O(1)',
      complexityWhy: 'Always exactly 32 loop steps, whatever the input, and two integer variables.',
      pitfalls: [
        'Stopping when `n` becomes 0 skips the leading zeros, so the bits end up in the wrong positions.',
        'Shifting `result` *after* adding the bit, instead of before, leaves an extra 0 on the end: the answer is doubled and grows past 32 bits.',
        'Looping 31 times or 33 times. It must be exactly 32.',
      ],
    },
    {
      id: 'missing-number',
      num: 268,
      title: 'Missing Number',
      difficulty: 'Easy',
      category: 'bit-manipulation',
      pattern: 'XOR indices with values',
      prompt:
        'A list holds `n` **distinct** numbers taken from the range `0` to `n`. That range has n + 1 values, so exactly one is missing. Return the missing one.',
      examples: [
        { input: 'nums = [4, 0, 1, 2]', output: '3', note: 'n = 4, so the range is 0 to 4, and 3 is absent.' },
        { input: 'nums = [1]', output: '0' },
        { input: 'nums = [0, 1, 2]', output: '3', note: 'The missing number can be n itself.' },
      ],
      signals: ['"numbers in the range 0 to n"', 'exactly one missing', 'follow-up asks for O(1) extra space'],
      hints: [
        'If nothing were missing, which numbers would be there? Could you compare against that?',
        'The indices 0 to n - 1, plus n itself, list every number from 0 to n exactly once.',
        'XOR together all the indices, n, and all the values. Everything appears twice and cancels, except the missing number.',
      ],
      brute:
        'For each number from 0 to n, check whether it is in the list: **O(n²)** with a list, or **O(n)** time and **O(n)** space with a set.',
      insight:
        'XOR together **every index, n, and every value**. Each number that is present shows up twice and cancels; the missing number shows up once and survives. (Summing also works: the expected total minus the actual total.)',
      mnemonic: 'XOR indices with values; the lonely one is missing.',
      steps: [
        'Start result at n, the length of the list.',
        'Loop over each index and value together.',
        'XOR both the index and the value into result.',
        'Return result.',
      ],
      solution: py`
class Solution:
    def missingNumber(self, nums: List[int]) -> int:
        #@ Start with n: the one number from 0 to n that is not an index of the list.
        result = len(nums)  #!
        #@ XOR in every index and every value. Each number that is present appears twice and cancels.
        for i, x in enumerate(nums):
            result ^= i ^ x  #!
        #@ What remains appeared only once: the missing number.
        return result`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy: 'One pass over the list with an O(1) XOR per element, and a single variable.',
      pitfalls: [
        'Forgetting n itself: indices only go up to n - 1, which is why `result` starts at `len(nums)`.',
        'The sum version `n * (n + 1) // 2 - sum(nums)` is just as good in Python. In fixed-size languages the sum can overflow; XOR never does.',
        'The list is not sorted, so you cannot assume `nums[i] == i`.',
      ],
    },
    {
      id: 'sum-of-two-integers',
      num: 371,
      title: 'Sum of Two Integers',
      difficulty: 'Medium',
      category: 'bit-manipulation',
      pattern: 'XOR for the sum, AND + shift for the carry',
      prompt:
        'Return the sum of two integers `a` and `b` **without using the `+` or `-` operators**. Both can be negative (they lie between -1000 and 1000).',
      examples: [
        { input: 'a = 4, b = 9', output: '13' },
        { input: 'a = -6, b = 2', output: '-4' },
        { input: 'a = -3, b = -5', output: '-8' },
      ],
      signals: ['"without using the operators + and -"', 'add using only bit operations', "negative numbers in 32-bit two's complement"],
      hints: [
        'Add two binary numbers on paper. In each column, what is the sum bit if you ignore carries? Which columns create a carry?',
        'XOR gives the sum without carries. AND marks the columns where both bits are 1, and shifting that left by one moves each carry into the next column.',
        'Repeat `a, b = a ^ b, (a & b) << 1` until the carry `b` is 0. In Python, mask each step with `0xFFFFFFFF` and convert back to a negative number at the end if bit 31 is set.',
      ],
      brute:
        'Simulate binary addition one column at a time: for each of the 32 positions, look at both bits and the carry and work out the output bit. That is **O(32)** too, but full of fiddly bookkeeping. XOR and AND handle all 32 columns at once.',
      insight:
        '`a ^ b` adds every column **ignoring carries**, and `(a & b) << 1` is exactly the **carries**, moved one column left. Keep adding those two together until no carry is left.',
      mnemonic: 'XOR for the sum, AND-shift for the carry; repeat.',
      steps: [
        'Set up a 32-bit mask and the largest positive 32-bit value.',
        'Loop while there is still a carry in b.',
        'Compute the carry as (a AND b) shifted left, masked to 32 bits.',
        'Set a to a XOR b, masked to 32 bits, then set b to the carry.',
        'If a is above the largest positive value, convert it back to a negative number.',
      ],
      solution: py`
class Solution:
    def getSum(self, a: int, b: int) -> int:
        #@ Python ints never overflow, so we imitate a 32-bit machine. MASK keeps the low 32 bits; MAX_INT is the largest positive 32-bit value.
        MASK = 0xFFFFFFFF
        MAX_INT = 0x7FFFFFFF
        #@ b holds the carries still waiting to be added. Stop when there are none.
        while b != 0:
            #@ AND finds the columns where both bits are 1: those carry. Shift left to move each carry into the next column.
            carry = ((a & b) << 1) & MASK  #!
            #@ XOR adds each column without carrying. Then the carry becomes the next thing to add.
            a = (a ^ b) & MASK  #!
            b = carry
        #@ If bit 31 is set, a is a negative number in 32-bit form. ~(a ^ MASK) turns it into the matching negative Python int.
        return a if a <= MAX_INT else ~(a ^ MASK)  #!`,
      time: 'O(1)',
      space: 'O(1)',
      complexityWhy: 'Each loop pushes the carry at least one column left, and the mask drops it after bit 31, so there are at most 32 loops.',
      pitfalls: [
        'Without the mask, Python ints grow forever: with a negative number the carry keeps moving left and the loop never ends.',
        'Forgetting to convert back: masked results are between 0 and 2³² − 1, so -4 comes out as 4294967292 unless you handle bit 31.',
        'In Java or C++ you do not need the mask. Fixed-size ints wrap around on their own, which is exactly the behavior we imitate here.',
      ],
    },
    {
      id: 'reverse-integer',
      num: 7,
      title: 'Reverse Integer',
      difficulty: 'Medium',
      category: 'bit-manipulation',
      pattern: 'Digit by digit with an overflow check',
      alsoAccept: ['math-geometry'],
      prompt:
        'Given a signed 32-bit integer `x`, return it with its **digits reversed**, keeping the sign. If the reversed value falls outside the signed 32-bit range (−2³¹ to 2³¹ − 1), return `0`. Pretend you cannot store 64-bit integers.',
      examples: [
        { input: 'x = 472', output: '274' },
        { input: 'x = -905', output: '-509' },
        { input: 'x = 1200', output: '21', note: 'Trailing zeros disappear.' },
        { input: 'x = 1563847412', output: '0', note: 'Reversed it would be 2147483651, just past the limit 2147483647.' },
      ],
      signals: ['"reverse digits of an integer"', '"signed 32-bit integer range"', '"return 0 if it overflows"'],
      hints: [
        'Peel digits off the end with `% 10` and `// 10`, and push them onto a new number with `result * 10 + digit`.',
        'Deal with the sign separately: Python `%` behaves surprisingly on negative numbers.',
        'Before doing `result * 10 + digit`, check whether it would go past 2147483647. If so, return 0.',
      ],
      brute:
        'Turn it into a string, reverse it, turn it back, and compare with the limits. It is short and **O(digits)**, but it builds a number that may not fit in 32 bits, which the problem forbids.',
      insight:
        'Build the reversed number digit by digit, and check **before** each `result * 10 + digit` whether it would pass the limit. That way the oversize number is never created.',
      mnemonic: 'Peel with % 10, push with × 10, check before pushing.',
      steps: [
        'Remember the sign and work with the absolute value.',
        'Peel off the last digit with % 10 and drop it with // 10.',
        'If `result * 10 + digit` would pass the 32-bit maximum, return 0.',
        'Otherwise push the digit on: `result = result * 10 + digit`.',
        'Return the result with the original sign.',
      ],
      solution: py`
class Solution:
    def reverse(self, x: int) -> int:
        #@ The largest value a signed 32-bit integer can hold: 2147483647.
        INT_MAX = 2**31 - 1
        #@ Save the sign and work with the absolute value, because Python % and // act oddly on negatives.
        sign = -1 if x < 0 else 1
        x = abs(x)
        result = 0
        #@ Peel the last digit off x.
        while x:
            digit = x % 10  #!
            x //= 10
            #@ Would result * 10 + digit pass INT_MAX? Rearranged, that is result > (INT_MAX - digit) // 10. Check before building it.
            if result > (INT_MAX - digit) // 10:  #!
                return 0
            #@ Safe: push the digit onto the end of result.
            result = result * 10 + digit  #!
        #@ Put the sign back.
        return sign * result`,
      time: 'O(log x)',
      space: 'O(1)',
      complexityWhy: 'The loop runs once per digit, and x has about log₁₀(x) digits (at most 10). Only a few integers are stored.',
      pitfalls: [
        'In Python, `-905 % 10` is `5` and `-905 // 10` is `-91`. Peel digits from `abs(x)` and put the sign back at the end.',
        'Checking for overflow *after* building the number defeats the point in fixed-size languages. Check first.',
        'The negative limit is one bigger (2147483648), but no valid 32-bit input reverses to exactly that, so checking against 2147483647 is enough.',
      ],
    },
  ],
};

export default content;
