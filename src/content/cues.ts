// ─────────────────────────────────────────────────────────────────────────────
// Clue words: for each pattern, the wording in a problem statement that should
// make the learner reach for it, and what to reach for ("see this, use that").
//
// The Clue words drill (src/pages/ClueDrill.tsx) asks them both ways: this wording,
// which pattern? and this pattern, which wording? The pattern guide lists them.
// Rules (checked by `npm run validate`): 6 to 9 per pattern; `see` is wording a
// learner can spot on the page, at most 90 characters; `use` at most 70; a `see`
// that fits another pattern too names it in `also`.
// ─────────────────────────────────────────────────────────────────────────────
import type { CategoryId, Cue } from './types';

export const CUES: Record<CategoryId, Cue[]> = {
  'arrays-hashing': [
    {
      see: '"return `True` if any value appears **at least twice**"',
      use: 'a **set** of the values you have seen',
      problems: ['contains-duplicate'],
    },
    {
      see: '"**two numbers** that add up to `target`", unsorted; return their **indices**',
      use: 'a **dict** of value → index; look up each **complement**',
      problems: ['two-sum'],
    },
    {
      see: '"is `t` an **anagram** of `s`?" (same letters, same counts)',
      use: '**count** the letters of each string and compare',
      problems: ['valid-anagram'],
    },
    {
      see: '"**group** the words that are anagrams of each other"',
      use: 'a **dict of key → list**, keyed by the sorted letters',
      problems: ['group-anagrams'],
    },
    {
      see: '"the `k` **most frequent** values"',
      use: '**count** with a dict, then bucket the values by count',
      also: ['heap'],
      problems: ['top-k-frequent-elements'],
    },
    {
      see: '"the longest sequence of **consecutive numbers**" in an **unsorted** list, in O(n)',
      use: 'a **set**; count upward only from values that start a run',
      problems: ['longest-consecutive-sequence'],
    },
    {
      see: '"the product of every element **except** `nums[i]`", with **no division**',
      use: '**prefix** products times **suffix** products',
      problems: ['product-of-array-except-self'],
    },
    {
      see: '"is the board **valid**: no digit repeats in a row, column or 3 × 3 box?"',
      use: 'one **set** per row, per column and per box',
      problems: ['valid-sudoku'],
    },
    {
      see: '"`encode` a list of strings into **one string**; `decode` it back"',
      use: 'write each string as its **length**, a `#`, then its text',
      problems: ['encode-and-decode-strings'],
    },
  ],
  'two-pointers': [
    {
      see: 'the array is **sorted**, and you need a **pair** with a given sum',
      use: 'a pointer at **each end**; move the one that fixes the sum',
      problems: ['two-sum-ii-input-array-is-sorted'],
    },
    {
      see: '"is the string a **palindrome**?" (the same forward and backward)',
      use: 'compare the characters at **both ends**, walking inward',
      problems: ['valid-palindrome'],
    },
    {
      see: '"every unique **triplet** that sums to zero"',
      use: '**sort**, fix one value, close two pointers on the rest',
      problems: ['3sum'],
    },
    {
      see: '"which pair of walls holds the **most water**?"',
      use: 'start at both ends; move the **shorter** wall inward',
      problems: ['container-with-most-water'],
    },
    {
      see: '"how much **rain water** is trapped between the bars?"',
      use: 'both ends inward, keeping `left_max` and `right_max`',
      also: ['stack'],
      problems: ['trapping-rain-water'],
    },
    {
      see: '"**reverse** the string **in place**, with O(1) extra memory"',
      use: '**swap** the two ends, then step both inward',
    },
  ],
  'sliding-window': [
    {
      see: '"the **longest substring** without repeating characters"',
      use: 'grow the right edge; **shrink the left** while the rule is broken',
      problems: ['longest-substring-without-repeating-characters'],
    },
    {
      see: '"the **shortest substring** of `s` that contains every character of `t`"',
      use: 'expand until valid, then **shrink while it stays valid**',
      problems: ['minimum-window-substring'],
    },
    {
      see: '"change **at most `k`** characters": the longest substring of one letter',
      use: 'valid while **length − top count ≤ k**; else move the left edge',
      problems: ['longest-repeating-character-replacement'],
    },
    {
      see: '"does `s2` contain a **permutation** of `s1`?"',
      use: 'a **fixed-size** window of `len(s1)`, comparing letter counts',
      problems: ['permutation-in-string'],
    },
    {
      see: '"the largest number in **every block of `k`** neighboring numbers"',
      use: 'a **monotonic deque** of indices, the largest at the front',
      also: ['stack', 'heap'],
      problems: ['sliding-window-maximum'],
    },
    {
      see: '"buy on one day, **sell on a later day**": the best single trade',
      use: 'keep the **lowest price so far**; best = price − lowest',
      also: ['two-pointers', 'greedy', 'dp-1d'],
      problems: ['best-time-to-buy-and-sell-stock'],
    },
    {
      see: '"every **subarray of length `k`**": its sum or its average',
      use: 'add the item entering, **subtract the item leaving**',
    },
  ],
  stack: [
    {
      see: '"is every bracket **closed by the same type**, in the right order?"',
      use: 'push each opener; a closer must match the **top**',
      problems: ['valid-parentheses'],
    },
    {
      see: '"the **next greater** element", for every position',
      use: 'a **monotonic stack** of indices still waiting for an answer',
    },
    {
      see: '"for each day, **how many days until** a warmer one?"',
      use: 'each new day **pops every colder day** it answers',
      problems: ['daily-temperatures'],
    },
    {
      see: '"**Reverse Polish Notation**": each operator follows its two numbers',
      use: 'push numbers; an operator **pops two** and pushes the result',
      problems: ['evaluate-reverse-polish-notation'],
    },
    {
      see: 'a class with `push`, `pop`, `top` and **`getMin`**, all in **O(1)**',
      use: 'a second stack holding the **minimum so far**',
      problems: ['min-stack'],
    },
    {
      see: '"the **largest rectangle**" that fits inside a histogram',
      use: 'a stack of **rising** bars; a shorter bar pops and measures them',
      problems: ['largest-rectangle-in-histogram'],
    },
    {
      see: 'cars on one lane that **cannot pass**: "how many **fleets** arrive?"',
      use: 'sort by position; stack the **arrival times**, front car first',
      problems: ['car-fleet'],
    },
  ],
  'binary-search': [
    {
      see: '"your solution must run in **O(log n)** time"',
      use: '**halve** the range each step with `lo`, `hi` and `mid`',
      problems: ['binary-search', 'find-minimum-in-rotated-sorted-array'],
    },
    {
      see: 'the array is **sorted**, and you need to **find one value** in it',
      use: 'compare `target` with the **middle**; drop the half it is not in',
      problems: ['binary-search'],
    },
    {
      see: '"a sorted array was **rotated** at an unknown point"',
      use: 'one half is still sorted: use it to pick **which half** to keep',
      problems: ['search-in-rotated-sorted-array', 'find-minimum-in-rotated-sorted-array'],
    },
    {
      see: '"the **smallest speed** that still finishes within `h` hours"',
      use: 'binary search **on the answer**, with a `can_finish(speed)` check',
      problems: ['koko-eating-bananas'],
    },
    {
      see: '"the value stored at the **latest time ≤ `timestamp`**"',
      use: 'times arrive in order: search for the **last one ≤** the query',
      problems: ['time-based-key-value-store'],
    },
    {
      see: 'a grid with **sorted rows**, each starting above the last value of the row before',
      use: 'treat it as **one sorted list**: index → `(row, col)`',
      problems: ['search-a-2d-matrix'],
    },
    {
      see: '"the **median of two sorted** lists", in O(log(m + n))',
      use: 'binary search the **cut** in the shorter list',
      problems: ['median-of-two-sorted-arrays'],
    },
  ],
  'linked-list': [
    {
      see: 'the input is a `head`: nodes with a `val` and a `next` to **relink in place**',
      use: 'rewire the `next` pointers; a **dummy node** guards the head',
      problems: ['reorder-list'],
    },
    {
      see: '"**reverse the nodes**" (all of them, or `k` at a time)',
      use: 'walk with **`prev` and `curr`**, turning each `next` around',
      problems: ['reverse-linked-list', 'reverse-nodes-in-k-group'],
    },
    {
      see: '"does following `next` ever return to an **earlier node**?", in O(1) memory',
      use: '**fast and slow** pointers: they meet only if there is a loop',
      also: ['two-pointers'],
      problems: ['linked-list-cycle'],
    },
    {
      see: '"remove the **n-th node from the end**"',
      use: 'two pointers **`n` nodes apart**; stop when the lead one ends',
      also: ['two-pointers'],
      problems: ['remove-nth-node-from-end-of-list'],
    },
    {
      see: '"**merge** sorted lists of nodes into one sorted list" (two, or `k`)',
      use: 'a **dummy node** and a `tail`; attach the smaller head each time',
      also: ['heap'],
      problems: ['merge-two-sorted-lists', 'merge-k-sorted-lists'],
    },
    {
      see: 'each node has a `next` and a **`random`** pointer: "return a **deep copy**"',
      use: 'a **dict** from each original node to its copy',
      also: ['arrays-hashing'],
      problems: ['copy-list-with-random-pointer'],
    },
    {
      see: 'two numbers stored **one digit per node**, ones digit first: "add them"',
      use: 'add digit by digit with a **carry**, building a new list',
      also: ['math-geometry'],
      problems: ['add-two-numbers'],
    },
    {
      see: '"evict the **least recently used** key": `get` and `put` in **O(1)**',
      use: 'a **dict** plus a **doubly linked list** kept in order of use',
      also: ['arrays-hashing'],
      problems: ['lru-cache'],
    },
    {
      see: '`n + 1` numbers, each from **1 to n**: find the repeat in **O(1) space**',
      use: 'follow value → index like `next`; find where the **cycle starts**',
      also: ['two-pointers', 'binary-search', 'bit-manipulation'],
      problems: ['find-the-duplicate-number'],
    },
  ],
  trees: [
    {
      see: 'the input is the `root` of a **binary tree**',
      use: '**recursion**: handle `None`, solve left and right, combine',
      problems: ['invert-binary-tree', 'maximum-depth-of-binary-tree'],
    },
    {
      see: '"the values of the tree **level by level**" / "seen from the **right side**"',
      use: '**BFS** with a queue, one round of the loop per level',
      problems: ['binary-tree-level-order-traversal', 'binary-tree-right-side-view'],
    },
    {
      see: '"the maximum **depth** of the tree" / "is the tree **height-balanced**?"',
      use: '**post-order**: both children report a height, the node combines',
      problems: ['maximum-depth-of-binary-tree', 'balanced-binary-tree'],
    },
    {
      see: 'the tree is a **BST**, and you want the **k-th smallest** value',
      use: '**in-order** traversal visits a BST in sorted order',
      problems: ['kth-smallest-element-in-a-bst'],
    },
    {
      see: '"is it a valid **BST**?" / "no bigger value on the **path from the root**"',
      use: 'pass a **bound down** as a parameter: a range, or the max so far',
      problems: ['validate-binary-search-tree', 'count-good-nodes-in-binary-tree'],
    },
    {
      see: 'a path between any two nodes that "**need not pass through the root**"',
      use: 'return a height upward; update a **global best** at each node',
      problems: ['diameter-of-binary-tree', 'binary-tree-maximum-path-sum'],
    },
    {
      see: '"are the two trees **identical**?" / "is one a **subtree** of the other?"',
      use: 'recurse on **both trees at once**, node against node',
      problems: ['same-tree', 'subtree-of-another-tree'],
    },
    {
      see: '"the **lowest common ancestor**" of two nodes in a BST',
      use: 'walk down from the root; stop where the two values **split**',
      also: ['binary-search'],
      problems: ['lowest-common-ancestor-of-a-binary-search-tree'],
    },
    {
      see: '"**rebuild** the tree from `preorder` and `inorder`" / "**serialize** a tree"',
      use: '**preorder**: the root comes first, then left, then right',
      problems: ['construct-binary-tree-from-preorder-and-inorder-traversal', 'serialize-and-deserialize-binary-tree'],
    },
  ],
  tries: [
    {
      see: '"does any stored word **start with** this **prefix**?"',
      use: 'a **trie**: walk the prefix down, one letter per node',
      problems: ['implement-trie-prefix-tree'],
    },
    {
      see: 'a class with `insert(word)`, `search(word)` and **`startsWith(prefix)`**',
      use: 'nodes with a **dict of children** and an **end-of-word** flag',
      problems: ['implement-trie-prefix-tree'],
    },
    {
      see: 'searching the stored words, where "`.` matches **any single letter**"',
      use: 'trie plus DFS: at a `.`, **try every child**',
      problems: ['design-add-and-search-words-data-structure'],
    },
    {
      see: '"return **every word of the list** that can be traced in the letter grid"',
      use: 'put the words in a trie; **one DFS per cell** follows it',
      also: ['backtracking', 'graphs'],
      problems: ['word-search-ii'],
    },
    {
      see: '"**autocomplete**": suggest the stored words that begin with what was typed',
      use: 'walk to the node of the prefix, then **collect the words below**',
    },
    {
      see: '"replace each word with the **shortest stored root** it begins with"',
      use: 'walk the word down the trie; stop at the first **end flag**',
    },
  ],
  heap: [
    {
      see: '"the **k-th largest** element"',
      use: 'a **min-heap capped at size `k`**; its top is the answer',
      problems: ['kth-largest-element-in-an-array', 'kth-largest-element-in-a-stream'],
    },
    {
      see: '"the **`k` closest** points to the origin", in any order',
      use: 'a **max-heap of size `k`**: pop the farthest when it overflows',
      problems: ['k-closest-points-to-origin'],
    },
    {
      see: '"the **median** of all the numbers so far", as numbers **keep arriving**',
      use: '**two heaps**, one per half, kept balanced',
      problems: ['find-median-from-data-stream'],
    },
    {
      see: '"each turn, take the **two heaviest** stones", and put what is left back',
      use: 'a **max-heap** (negated values): pop, pop, push',
      problems: ['last-stone-weight'],
    },
    {
      see: '"the same task must **wait `n` units** to run again": the least total time',
      use: 'a max-heap of counts plus a **cooldown queue**',
      also: ['greedy'],
      problems: ['task-scheduler'],
    },
    {
      see: '"the **10 most recent** tweets" from everyone a user follows',
      use: 'a heap holding the **newest item of each feed**; pop 10 times',
      problems: ['design-twitter'],
    },
    {
      see: 'a **stream**: after every `add(val)`, report a rank (k-th largest, middle)',
      use: 'keep a heap between calls: each `add` costs **O(log n)**',
      problems: ['kth-largest-element-in-a-stream', 'find-median-from-data-stream'],
    },
  ],
  backtracking: [
    {
      see: '"return **all** possible subsets" / "**all** permutations"',
      use: 'a **decision tree**: choose, recurse, **un-choose**',
      problems: ['subsets', 'permutations'],
    },
    {
      see: '"return **every unique combination** that adds up to `target`"',
      use: 'DFS with a running sum; **stop when it overshoots**',
      problems: ['combination-sum', 'combination-sum-ii'],
    },
    {
      see: '"`nums` **may contain duplicates**; list each distinct subset only once"',
      use: '**sort**, then skip equal values at the same level',
      problems: ['subsets-ii', 'combination-sum-ii'],
    },
    {
      see: '"**generate every** well-formed string of `n` pairs of parentheses"',
      use: 'add `(` while some are left; add `)` only if it closes one',
      problems: ['generate-parentheses'],
    },
    {
      see: '"**every** letter string these phone digits could spell"',
      use: 'one level per digit: **try each of its letters**',
      problems: ['letter-combinations-of-a-phone-number'],
    },
    {
      see: '"**all** the ways to cut the string so that every piece is a palindrome"',
      use: 'try **every cut point**; recurse only if the piece is valid',
      problems: ['palindrome-partitioning'],
    },
    {
      see: '"place `n` queens so that **none attack** each other; return every board"',
      use: 'one queen per row; **sets** of used columns and diagonals',
      problems: ['n-queens'],
    },
    {
      see: '"can the word be spelled along **adjacent cells**, using **no cell twice**?"',
      use: 'DFS from each cell: **mark** it, recurse, **unmark** it',
      also: ['graphs'],
      problems: ['word-search'],
    },
    {
      see: 'tiny limits such as **`1 <= n <= 10`**, and the output lists every answer',
      use: 'exponential time is expected: **try every choice**',
    },
  ],
  graphs: [
    {
      see: 'a grid of **land and water**: "how many **islands**?", "the largest island"',
      use: '**flood fill**: DFS from every land cell not yet visited',
      problems: ['number-of-islands', 'max-area-of-island'],
    },
    {
      see: '"course `b` must be taken **before** course `a`": can you finish them all?',
      use: 'a directed graph: **topological sort**; a cycle means no',
      also: ['advanced-graphs'],
      problems: ['course-schedule', 'course-schedule-ii'],
    },
    {
      see: '"every minute, each rotten orange **rots its neighbors**": how many minutes?',
      use: '**BFS from every source at once**; one level per minute',
      problems: ['rotting-oranges'],
    },
    {
      see: '"fill each empty room with the distance to its **nearest gate**"',
      use: '**multi-source BFS**: start the queue with every gate',
      problems: ['walls-and-gates'],
    },
    {
      see: '"the **shortest** chain of words, changing **one letter at a time**"',
      use: '**BFS**: words are nodes, a one-letter change is an edge',
      problems: ['word-ladder'],
    },
    {
      see: '`n` nodes and a list of **`edges`**: "how many **connected components**?"',
      use: '**union-find**: every merge leaves one group fewer',
      problems: ['number-of-connected-components-in-an-undirected-graph'],
    },
    {
      see: '`n` nodes and `edges`: "do they form a **valid tree**?", "one **extra edge**"',
      use: 'an edge joining two nodes **already connected** closes a cycle',
      problems: ['graph-valid-tree', 'redundant-connection'],
    },
    {
      see: 'each node has a `val` and a list of **`neighbors`**: "return a deep copy"',
      use: 'DFS with a **dict** from each original node to its copy',
      problems: ['clone-graph'],
    },
    {
      see: 'grid cells that **reach the border**: "flows to both oceans", "not captured"',
      use: 'search **inward from the border** cells, not from every cell',
      problems: ['pacific-atlantic-water-flow', 'surrounded-regions'],
    },
  ],
  'advanced-graphs': [
    {
      see: 'edges carry a **weight**, `[u, v, w]`: "the **fastest** / **cheapest** route"',
      use: '**Dijkstra**: a min-heap of `(distance, node)`',
      problems: ['network-delay-time'],
    },
    {
      see: '"a signal takes `w` time units from `u` to `v`": when has **every** node got it?',
      use: 'Dijkstra from the source; the answer is the **largest** distance',
      problems: ['network-delay-time'],
    },
    {
      see: '"**connect all** the points at the **minimum total cost**"',
      use: 'a **minimum spanning tree**: Prim with a min-heap',
      problems: ['min-cost-to-connect-all-points'],
    },
    {
      see: '"the cheapest flight route with **at most `k` stops**"',
      use: '**Bellman-Ford** for `k + 1` rounds, each on a copy of the prices',
      also: ['dp-2d'],
      problems: ['cheapest-flights-within-k-stops'],
    },
    {
      see: '"use **every ticket exactly once**", in the smallest alphabetical order',
      use: '**Hierholzer**: DFS that uses up edges; add a node on the way back',
      also: ['graphs', 'backtracking'],
      problems: ['reconstruct-itinerary'],
    },
    {
      see: 'words "**sorted** in an **unknown** alphabet": return the order of the letters',
      use: 'first differing letters give edges; then **topological sort**',
      also: ['graphs'],
      problems: ['alien-dictionary'],
    },
    {
      see: '"at time `t` you may swim through cells of height **≤ `t`**": earliest arrival?',
      use: 'Dijkstra where a path costs its **highest** cell: `max`, not `+`',
      also: ['binary-search', 'graphs'],
      problems: ['swim-in-rising-water'],
    },
  ],
  'dp-1d': [
    {
      see: '"climb **1 or 2 steps** at a time": how many ways, or the minimum cost',
      use: '`dp[i]` from `dp[i - 1]` and `dp[i - 2]`: two **rolling values**',
      problems: ['climbing-stairs', 'min-cost-climbing-stairs'],
    },
    {
      see: '"you cannot rob two **adjacent** houses": the most money',
      use: 'at each house **take or skip**: `max(skip, take + two back)`',
      problems: ['house-robber', 'house-robber-ii'],
    },
    {
      see: '"the **fewest coins** that make exactly `amount`", unlimited supply',
      use: '`dp[a]` = fewest coins for amount `a`, filled **from 0 up**',
      also: ['dp-2d'],
      problems: ['coin-change'],
    },
    {
      see: '"**how many ways** can the string of digits be decoded?"',
      use: '`dp[i]` = ways for the first `i` digits: take **one digit or two**',
      problems: ['decode-ways'],
    },
    {
      see: '"can the string be **cut into dictionary words**?"',
      use: '`dp[i]`: can the first `i` characters be cut? Try each last word',
      problems: ['word-break'],
    },
    {
      see: '"the **longest increasing subsequence**"',
      use: '`dp[i]` = longest one **ending at** `i`; look back at smaller values',
      also: ['binary-search'],
      problems: ['longest-increasing-subsequence'],
    },
    {
      see: '"can `nums` be divided into **two subsets with equal sums**?"',
      use: 'subset sum: grow the **set of reachable sums** up to half',
      also: ['dp-2d'],
      problems: ['partition-equal-subset-sum'],
    },
    {
      see: '"the **longest palindromic substring**" / "count the palindromic substrings"',
      use: '**expand around every center**, odd and even',
      also: ['two-pointers'],
      problems: ['longest-palindromic-substring', 'palindromic-substrings'],
    },
    {
      see: '"the contiguous subarray with the **largest product**"',
      use: 'keep the **max and the min** product ending here',
      also: ['greedy'],
      problems: ['maximum-product-subarray'],
    },
  ],
  'dp-2d': [
    {
      see: '**two strings**: "longest common subsequence", "fewest edits to turn one into the other"',
      use: 'a table on **`(i, j)`**: a position in each string',
      problems: ['longest-common-subsequence', 'edit-distance'],
    },
    {
      see: '"a robot moves only **right or down**": how many paths across the grid?',
      use: '`paths[r][c]` = paths from above + paths from the left',
      also: ['math-geometry'],
      problems: ['unique-paths'],
    },
    {
      see: '"**how many combinations** of coins add up to `amount`?"',
      use: 'state **(coin, amount left)**: use this coin again, or move on',
      also: ['dp-1d'],
      problems: ['coin-change-ii'],
    },
    {
      see: '"put `+` or `-` before every number": how many ways reach `target`?',
      use: 'memo on **(index, running total)**',
      also: ['dp-1d', 'backtracking'],
      problems: ['target-sum'],
    },
    {
      see: '"is `s3` an **interleaving** of `s1` and `s2`?" / "how many subsequences of `s` equal `t`?"',
      use: 'state **`(i, j)`**: how far you are in each string',
      problems: ['interleaving-string', 'distinct-subsequences'],
    },
    {
      see: '"buy and sell many times, with a **cooldown** day after each sale"',
      use: 'state **(day, holding or not)**; selling skips a day',
      also: ['dp-1d'],
      problems: ['best-time-to-buy-and-sell-stock-with-cooldown'],
    },
    {
      see: 'a pattern with `.` and **`*`** must match the **entire** string',
      use: 'memo on **(i in string, j in pattern)**; a star: skip it or use it',
      problems: ['regular-expression-matching'],
    },
    {
      see: '"the **longest increasing path**" through a grid of numbers',
      use: 'DFS from every cell, with a **memo per cell**',
      also: ['graphs'],
      problems: ['longest-increasing-path-in-a-matrix'],
    },
    {
      see: '"each burst earns `left × value × right`, then the **neighbors close up**": most coins',
      use: 'interval DP on **`(left, right)`**: pick the **last** one to burst',
      problems: ['burst-balloons'],
    },
  ],
  greedy: [
    {
      see: '"the contiguous subarray with the **largest sum**"',
      use: 'Kadane: **drop the running sum** when it turns negative',
      also: ['dp-1d'],
      problems: ['maximum-subarray'],
    },
    {
      see: 'each value is a **maximum jump length**: "can you reach the last index?"',
      use: 'track the **farthest index** you can reach so far',
      also: ['dp-1d'],
      problems: ['jump-game'],
    },
    {
      see: '"the **fewest jumps** to reach the last index"',
      use: 'one more jump each time you pass the **farthest reach** of the last',
      also: ['dp-1d'],
      problems: ['jump-game-ii'],
    },
    {
      see: 'a **circular route** with `gas[i]` and `cost[i]`: "which station to start at?"',
      use: 'if total gas covers total cost, **restart after** each failure',
      problems: ['gas-station'],
    },
    {
      see: '"split **all** the cards into groups of `groupSize` **consecutive** values"',
      use: 'sort; the **smallest card left** must start the next group',
      also: ['heap', 'arrays-hashing'],
      problems: ['hand-of-straights'],
    },
    {
      see: '"split the string into **as many parts as possible**, each letter in one part"',
      use: 'note the **last index** of each letter; cut on reaching the farthest',
      problems: ['partition-labels'],
    },
    {
      see: 'brackets plus **`*`**, which may be `(`, `)` or nothing: "can it be balanced?"',
      use: 'track the **lowest and highest** possible count of open brackets',
      also: ['stack', 'dp-2d'],
      problems: ['valid-parenthesis-string'],
    },
    {
      see: '"merging keeps the **larger value** in each position": can you form `target`?',
      use: 'ignore triplets that **overshoot**; the rest must cover `target`',
      problems: ['merge-triplets-to-form-target-triplet'],
    },
  ],
  intervals: [
    {
      see: 'the input is a list of **`[start, end]`** pairs',
      use: '**sort by start**, then compare each one with the one before',
      problems: ['merge-intervals', 'meeting-rooms'],
    },
    {
      see: '"**merge** all **overlapping** intervals"',
      use: 'sort by start; extend the **last kept** interval, or append',
      problems: ['merge-intervals'],
    },
    {
      see: '"**insert** a new interval" into a sorted list with no overlaps',
      use: 'three phases: **before** it, overlapping it (merge), **after** it',
      problems: ['insert-interval'],
    },
    {
      see: '"can one person **attend all** the meetings?"',
      use: 'sort by start; a start **before the previous end** is a clash',
      problems: ['meeting-rooms'],
    },
    {
      see: '"the **fewest rooms**" so that every meeting gets one',
      use: 'sort by start; a **min-heap of end times** holds the rooms in use',
      also: ['heap'],
      problems: ['meeting-rooms-ii'],
    },
    {
      see: '"the **fewest intervals to remove**" so that the rest do not overlap',
      use: 'sort; on a clash, **keep the one that ends first**',
      also: ['greedy'],
      problems: ['non-overlapping-intervals'],
    },
    {
      see: 'for each query, "the **smallest interval that contains** it"',
      use: 'sort both lists; sweep with a **min-heap of (size, end)**',
      also: ['heap'],
      problems: ['minimum-interval-to-include-each-query'],
    },
  ],
  'math-geometry': [
    {
      see: '"**rotate** the `n × n` grid by **90 degrees**, in place"',
      use: '**transpose** the grid, then reverse each row',
      problems: ['rotate-image'],
    },
    {
      see: '"return the values of the grid in **spiral order**"',
      use: 'four **boundaries** that close in after each side',
      problems: ['spiral-matrix'],
    },
    {
      see: '"where a cell is `0`, set its **entire row and column** to `0`", in place',
      use: 'use the **first row and first column** as markers',
      problems: ['set-matrix-zeroes'],
    },
    {
      see: 'a large number stored as an **array of digits**: "add one to it"',
      use: 'go right to left with a **carry**',
      problems: ['plus-one'],
    },
    {
      see: 'numbers given as **strings of digits**: "do not convert them to integers"',
      use: '**grade-school** multiplication into an array of digits',
      problems: ['multiply-strings'],
    },
    {
      see: '"compute `x` raised to the power `n`", where `n` can be **huge** or negative',
      use: '**square and halve**: fast exponentiation in O(log n)',
      problems: ['powx-n'],
    },
    {
      see: '"replace the number with the **sum of the squares of its digits**; repeat"',
      use: '`% 10` and `// 10` peel off digits; a **set** spots the loop',
      also: ['arrays-hashing'],
      problems: ['happy-number'],
    },
    {
      see: '"how many **axis-aligned squares** do the stored points form with this one?"',
      use: 'count every point; try each stored point as the **diagonal corner**',
      also: ['arrays-hashing'],
      problems: ['detect-squares'],
    },
  ],
  'bit-manipulation': [
    {
      see: '"every value appears **twice except one**", in O(1) extra space',
      use: '**XOR** everything: the pairs cancel, the single one stays',
      problems: ['single-number'],
    },
    {
      see: '"how many **1s** are in the **binary form** of `n`?"',
      use: '`n & (n - 1)` erases the lowest 1; count the erasures',
      problems: ['number-of-1-bits'],
    },
    {
      see: '"add two integers **without using `+` or `-`**"',
      use: '**XOR** adds without carrying; **AND, then shift** gives the carry',
      problems: ['sum-of-two-integers'],
    },
    {
      see: '"**reverse the bits**" of an unsigned integer of 32 bits',
      use: '32 times: shift the result left, **add `n & 1`**, shift `n` right',
      problems: ['reverse-bits'],
    },
    {
      see: '`n` distinct numbers from the range **0 to n**: "which one is **missing**?"',
      use: '**XOR** every index with every value; the missing one is left',
      also: ['math-geometry', 'arrays-hashing'],
      problems: ['missing-number'],
    },
    {
      see: '"the count of 1s in binary, for **every number from 0 to `n`**"',
      use: '`bits[i] = bits[i >> 1] + (i & 1)`: reuse the smaller answer',
      also: ['dp-1d'],
      problems: ['counting-bits'],
    },
    {
      see: '"reverse the **digits** of a signed integer; return `0` if it **overflows** 32 bits"',
      use: 'pop digits with `% 10`; **check the limit before** each push',
      also: ['math-geometry'],
      problems: ['reverse-integer'],
    },
  ],
};
