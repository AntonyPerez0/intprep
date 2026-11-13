// ─────────────────────────────────────────────────────────────────────────────
// Clue words: for each pattern, the wording in a problem statement that should
// make the learner reach for it, and what to reach for ("see this, use that").
//
// The Clue words drill (src/pages/ClueDrill.tsx) asks them both ways: this wording,
// which pattern? and this pattern, which wording? The pattern guide lists them.
//
// A clue is wording that turns up in many problems, including ones the learner has
// never seen ("the k-th largest", "in O(log n) time", "return all possible …"), not a
// paraphrase of one problem's statement: a single problem's own phrases are its
// `signals`, which the drill asks separately. A pattern's last clue or two may be the
// signature wording of a famous problem where the pattern has little general wording.
//
// Rules (checked by `npm run validate`): 6 to 9 per pattern; `see` is wording a
// learner can spot on the page, at most 90 characters; `use` at most 70; a `see`
// that fits another pattern too names it in `also`.
// ─────────────────────────────────────────────────────────────────────────────
import type { CategoryId, Cue } from './types';

export const CUES: Record<CategoryId, Cue[]> = {
  'arrays-hashing': [
    {
      see: '"contains a **duplicate**", "appears **more than once**", "**distinct**", "**unique**"',
      use: 'a **set** of the values you have seen',
      problems: ['contains-duplicate'],
    },
    {
      see: '"**how many times** does each … appear?", "the most **frequent**"',
      use: '**count** with a dict (or `Counter`)',
      also: ['heap'],
      problems: ['top-k-frequent-elements', 'valid-anagram'],
    },
    {
      see: '"**two values** that add up to `target`" in an **unsorted** list',
      use: 'a **dict** of value → index; look up each **complement**',
      problems: ['two-sum'],
    },
    {
      see: '"**group** the items that share …" (the same letters, the same remainder)',
      use: 'a **dict of key → list**; items with one key land together',
      problems: ['group-anagrams'],
    },
    {
      see: '"**anagram**": the same letters in a different order',
      use: 'compare **letter counts** (or the sorted letters)',
      also: ['sliding-window'],
      problems: ['valid-anagram', 'group-anagrams'],
    },
    {
      see: '"a **subarray** whose sum **equals `k`**", and values may be **negative**',
      use: 'running sums in a dict: look up `sum − k`',
    },
    {
      see: '"the sum of the range `i..j`", asked often; "everything **except** `nums[i]`"',
      use: '**prefix** (and suffix) running totals, built once',
      problems: ['product-of-array-except-self'],
    },
    {
      see: '"the **intersection** of two lists", "values in one list but **not in the other**"',
      use: 'put one list in a **set**; test the other against it',
      also: ['two-pointers'],
    },
    {
      see: 'an **unsorted** list, "must run in **O(n)** time", and extra memory is allowed',
      use: 'a **set** or a dict: O(1) lookups replace the sort',
      problems: ['longest-consecutive-sequence'],
    },
  ],
  'two-pointers': [
    {
      see: 'the input is **sorted**, and you need a **pair** with a given sum',
      use: 'a pointer at **each end**; move the side that fixes the sum',
      also: ['binary-search'],
      problems: ['two-sum-ii-input-array-is-sorted'],
    },
    {
      see: '"**is** it a **palindrome**?" (reads the same forward and backward)',
      use: 'compare from **both ends**, moving inward',
      problems: ['valid-palindrome'],
    },
    {
      see: 'an array changed "**in place**", "with **O(1)** extra memory": reverse, remove, move',
      use: 'a **read** pointer and a **write** pointer (or swap from both ends)',
    },
    {
      see: '"all **triplets** that sum to …", with no duplicate triplets',
      use: '**sort**, fix one value, close in on the rest; skip repeats',
      problems: ['3sum'],
    },
    {
      see: 'a left **wall** and a right wall: the **area** or the water between them',
      use: 'start at both ends; move the **shorter** side inward',
      also: ['stack'],
      problems: ['container-with-most-water', 'trapping-rain-water'],
    },
    {
      see: '"**merge**" a pair of **sorted arrays** into one sorted array',
      use: 'one pointer **per array**; advance the smaller value',
    },
  ],
  'sliding-window': [
    {
      see: '"the **longest substring** / subarray that …" (no repeats, at most `k` distinct)',
      use: 'grow the right edge; shrink the left while the rule is broken',
      problems: ['longest-substring-without-repeating-characters', 'longest-repeating-character-replacement'],
    },
    {
      see: '"the **shortest** / minimum **window** that contains …"',
      use: 'expand until valid, then shrink while it stays valid',
      problems: ['minimum-window-substring'],
    },
    {
      see: '"every **subarray of size `k`**", "each block of `k` neighbors"',
      use: 'a **fixed** width: add the new item, drop the oldest',
    },
    {
      see: 'a **contiguous** run under a limit: "at most `k` …", "sum ≥ `target`" (no negatives)',
      use: 'a variable width: move the left edge when the limit breaks',
      problems: ['longest-repeating-character-replacement'],
    },
    {
      see: '"contains a **permutation** of …", "find all **anagrams** of `p` in `s`"',
      use: 'a fixed width of `len(p)`, comparing **letter counts**',
      also: ['arrays-hashing'],
      problems: ['permutation-in-string'],
    },
    {
      see: '"the **maximum** of each block of `k` neighbors"',
      use: 'a **deque** of indices kept in decreasing order of value',
      also: ['stack', 'heap'],
      problems: ['sliding-window-maximum'],
    },
    {
      see: '"**how many** subarrays have at most `k` …?", "… a product less than `k`?"',
      use: 'each right edge adds `right − left + 1` valid windows',
    },
  ],
  stack: [
    {
      see: '"**valid** / **balanced** parentheses": brackets that must **nest**',
      use: 'push each opener; a closer must match the **top**',
      problems: ['valid-parentheses'],
    },
    {
      see: '"the **next greater** / next smaller element", "days until a **warmer** one"',
      use: 'a **monotonic** stack of indices still waiting for an answer',
      problems: ['daily-temperatures'],
    },
    {
      see: '"**evaluate** the expression", "Reverse Polish Notation", "calculator"',
      use: 'push numbers; an operator pops its operands and pushes the result',
      problems: ['evaluate-reverse-polish-notation'],
    },
    {
      see: '"**undo**", "backspace", "simplify the path", "remove **adjacent** duplicates"',
      use: 'push as you go; the **most recent** item is the one cancelled',
    },
    {
      see: 'a class with `push`, `pop`, `top`, plus "the **minimum** in O(1)"',
      use: 'store the minimum so far **beside each value**',
      problems: ['min-stack'],
    },
    {
      see: '"the **largest rectangle**" under bars; "how far can each bar extend?"',
      use: 'increasing heights on a stack; pop while the new bar is lower',
      problems: ['largest-rectangle-in-histogram'],
    },
    {
      see: '"**decode** `3[a2[c]]`": nested groups to expand from the inside out',
      use: 'push the state at `[`; pop and combine at `]`',
    },
  ],
  'binary-search': [
    {
      see: '"must run in **O(log n)** time"',
      use: '**halve** the search space on every step',
      problems: ['search-in-rotated-sorted-array', 'find-minimum-in-rotated-sorted-array'],
    },
    {
      see: 'the array is **sorted**, and you need to **find** one value or its position',
      use: '`lo` and `hi`; check the **middle** and drop a half',
      problems: ['binary-search', 'search-a-2d-matrix'],
    },
    {
      see: '"the **minimum** speed / capacity / days such that it **still works**"',
      use: 'search **on the answer**, with a function that tests a guess',
      problems: ['koko-eating-bananas'],
    },
    {
      see: '"the **first** / **last** position of", "the smallest value **≥ x**", "insert position"',
      use: 'search for a **boundary** (`bisect_left`), not for a match',
      problems: ['time-based-key-value-store'],
    },
    {
      see: '"sorted, then **rotated**", "find the **peak**"',
      use: 'compare the middle with an end or a neighbor: one half must hold it',
      problems: ['find-minimum-in-rotated-sorted-array', 'search-in-rotated-sorted-array'],
    },
    {
      see: '"**split** into `k` parts so that the **largest part is as small as possible**"',
      use: 'guess the limit; a greedy pass counts the parts it needs',
      also: ['greedy', 'dp-2d'],
    },
    {
      see: '"the **median** of **two sorted** arrays", in O(log(m + n))',
      use: 'search for the **cut** that leaves half the values on each side',
      problems: ['median-of-two-sorted-arrays'],
    },
  ],
  'linked-list': [
    {
      see: 'the input is a **`head`**: nodes with a `val` and a `next`',
      use: 'walk with a pointer and relink `next`; a **dummy** node guards the head',
      problems: ['reverse-linked-list', 'merge-two-sorted-lists'],
    },
    {
      see: '"does the list have a **cycle**?", "where does the cycle start?"',
      use: 'a **slow** and a **fast** pointer; they meet inside a cycle',
      also: ['two-pointers'],
      problems: ['linked-list-cycle'],
    },
    {
      see: '"the **middle** node", "the **n-th node from the end**", in one pass',
      use: 'a pair of pointers a fixed **gap** apart (or slow and fast)',
      also: ['two-pointers'],
      problems: ['remove-nth-node-from-end-of-list', 'reorder-list'],
    },
    {
      see: '"**reverse** the list" (all of it, a part of it, or `k` nodes at a time)',
      use: '`prev`, `cur`, `nxt`: flip one link per step',
      problems: ['reverse-linked-list', 'reverse-nodes-in-k-group'],
    },
    {
      see: '"**merge** sorted lists" of nodes (a pair, or `k` of them)',
      use: 'a dummy head; attach the smaller node (a heap for `k`)',
      also: ['heap'],
      problems: ['merge-two-sorted-lists', 'merge-k-sorted-lists'],
    },
    {
      see: '"**least recently used**" cache: `get` and `put` in O(1)',
      use: 'a dict for lookup plus a **doubly linked** list for the order',
      also: ['arrays-hashing'],
      problems: ['lru-cache'],
    },
    {
      see: '"a deep **copy**" of nodes that point at each other (`next` and `random`)',
      use: 'a dict of **old node → new node**',
      also: ['arrays-hashing'],
      problems: ['copy-list-with-random-pointer'],
    },
    {
      see: 'numbers stored **one digit per node**: "add them"',
      use: 'walk both lists together with a **carry**',
      also: ['math-geometry'],
      problems: ['add-two-numbers'],
    },
    {
      see: '"is the **list** a **palindrome**?", "reorder it as first, last, second, …"',
      use: 'find the middle, **reverse** the second half, walk both halves',
      also: ['two-pointers'],
      problems: ['reorder-list'],
    },
  ],
  trees: [
    {
      see: 'the input is the **`root`** of a binary tree',
      use: '**recursion**: a node’s answer from its children’s answers',
      problems: ['invert-binary-tree', 'maximum-depth-of-binary-tree'],
    },
    {
      see: '"**level by level**", "level order", "the rightmost node of each level"',
      use: '**BFS** with a queue, one level per loop',
      problems: ['binary-tree-level-order-traversal', 'binary-tree-right-side-view'],
    },
    {
      see: '"**depth**", "**height**", "**balanced**", "**diameter**"',
      use: 'return the height upward; update the answer on the way',
      problems: ['maximum-depth-of-binary-tree', 'balanced-binary-tree'],
    },
    {
      see: 'a **BST**: "the **k-th smallest**", "in sorted order"',
      use: '**in-order** traversal visits a BST in sorted order',
      problems: ['kth-smallest-element-in-a-bst'],
    },
    {
      see: '"is it a **valid BST**?", "no larger value on the path from the root"',
      use: 'pass **bounds** (or the maximum so far) down the recursion',
      problems: ['validate-binary-search-tree', 'count-good-nodes-in-binary-tree'],
    },
    {
      see: '"the **lowest common ancestor**" of a pair of nodes',
      use: 'in a BST: walk down until the values go separate ways',
      also: ['binary-search'],
      problems: ['lowest-common-ancestor-of-a-binary-search-tree'],
    },
    {
      see: '"a **path**" that may start and end at **any** node',
      use: 'at each node: the best path **through** it vs the best going **up**',
      problems: ['binary-tree-maximum-path-sum', 'diameter-of-binary-tree'],
    },
    {
      see: '"are the trees the **same**?", "is it a **subtree** of …?", "symmetric"',
      use: 'recurse down **both** trees (or both sides) in step',
      problems: ['same-tree', 'subtree-of-another-tree'],
    },
    {
      see: '"**serialize**" a tree; "**rebuild** it from its traversals"',
      use: 'pre-order with a marker for `None`; the first value is the root',
      problems: ['serialize-and-deserialize-binary-tree', 'construct-binary-tree-from-preorder-and-inorder-traversal'],
    },
  ],
  tries: [
    {
      see: '"**starts with** this prefix", "common **prefix**", "**autocomplete**"',
      use: 'a **trie**: one node per letter, shared by words with that prefix',
      problems: ['implement-trie-prefix-tree'],
    },
    {
      see: 'a class with `insert(word)`, `search(word)` and `startsWith(prefix)`',
      use: 'nodes with `children` and an **end-of-word** flag',
      problems: ['implement-trie-prefix-tree'],
    },
    {
      see: 'searching stored words where "**`.` matches any letter**"',
      use: 'walk the trie; at `.`, try **every child**',
      problems: ['design-add-and-search-words-data-structure'],
    },
    {
      see: '"find **every word of the list**" in a letter grid or a long text',
      use: 'put the **list** in a trie; walk the grid and the trie together',
      also: ['backtracking', 'graphs'],
      problems: ['word-search-ii'],
    },
    {
      see: '"replace each word with its **shortest root**"',
      use: 'walk the trie letter by letter; stop at the first end-of-word',
    },
    {
      see: 'many words, many queries: "**how many** words start with …?"',
      use: 'keep a **count** on every trie node',
    },
  ],
  heap: [
    {
      see: '"the **k-th largest**" (or k-th smallest) element',
      use: 'a heap capped at size **k**; its top is the answer',
      problems: ['kth-largest-element-in-an-array', 'kth-largest-element-in-a-stream'],
    },
    {
      see: '"the **top `k`**", "the `k` **closest**", "the `k` most frequent"',
      use: 'push each item; pop once the heap grows past **k**',
      also: ['arrays-hashing'],
      problems: ['k-closest-points-to-origin'],
    },
    {
      see: '"**repeatedly** take the largest / smallest", then put something back',
      use: 'a heap (negate the values for a max-heap in Python)',
      problems: ['last-stone-weight'],
    },
    {
      see: '"the **median**" of a **stream**, "as numbers keep arriving"',
      use: '**two heaps**, one for each half',
      problems: ['find-median-from-data-stream'],
    },
    {
      see: '"**merge `k` sorted** lists", "the smallest across `k` sources"',
      use: 'a heap holding **one item per source**',
      also: ['linked-list'],
      problems: ['design-twitter'],
    },
    {
      see: '"**rearrange** so that no two equal items are **adjacent**", tasks "with a **cooldown**"',
      use: 'a max-heap of counts: place the most frequent one allowed',
      also: ['greedy'],
      problems: ['task-scheduler'],
    },
    {
      see: 'a **stream**: after every `add(val)`, report the best or the k-th so far',
      use: 'keep the heap **between calls**; never re-sort',
      problems: ['kth-largest-element-in-a-stream'],
    },
  ],
  backtracking: [
    {
      see: '"return **all possible** …": subsets, permutations, combinations',
      use: 'DFS that **chooses, explores, then un-chooses**',
      problems: ['subsets', 'permutations'],
    },
    {
      see: '"**all combinations** that sum to `target`"',
      use: 'try each candidate from index `i` on; stop once past `target`',
      problems: ['combination-sum', 'combination-sum-ii'],
    },
    {
      see: '"may contain **duplicates**", but "the answer must not repeat a set"',
      use: '**sort**, then skip a value equal to its left neighbor at one depth',
      problems: ['subsets-ii', 'combination-sum-ii'],
    },
    {
      see: '"**generate** all valid …" (parentheses, IP addresses, letter strings)',
      use: 'build one character at a time; add only what keeps it valid',
      problems: ['generate-parentheses', 'letter-combinations-of-a-phone-number'],
    },
    {
      see: 'tiny limits such as `n <= 10` or `nums.length <= 20`',
      use: 'small enough to **try everything**: exponential search is expected',
      also: ['bit-manipulation'],
      problems: ['n-queens', 'subsets'],
    },
    {
      see: '"**place** / fill so that no two conflict" (queens, sudoku)',
      use: 'place one, recurse, **undo**; sets record what is taken',
      problems: ['n-queens'],
    },
    {
      see: '"does a **path** spell the word?", using each cell **at most once**',
      use: 'DFS from each cell: mark it, recurse, **unmark** it',
      also: ['graphs'],
      problems: ['word-search'],
    },
    {
      see: '"**every way** to cut the string so that each piece is …"',
      use: 'cut at each valid prefix; recurse on the rest',
      problems: ['palindrome-partitioning'],
    },
  ],
  graphs: [
    {
      see: 'a **grid** of land and water: "how many **islands**?", "the largest region"',
      use: 'DFS or BFS from each unvisited cell; **mark** cells as you go',
      problems: ['number-of-islands', 'max-area-of-island'],
    },
    {
      see: '"the **shortest path** / **fewest steps**", and every move costs the same',
      use: '**BFS**: the first time you reach a node is the shortest way',
      problems: ['word-ladder'],
    },
    {
      see: '"**prerequisites**", "must come **before**", "a valid **order**"',
      use: '**topological sort**; a cycle means there is no order',
      also: ['advanced-graphs'],
      problems: ['course-schedule', 'course-schedule-ii'],
    },
    {
      see: '"**spreads** to its neighbors every minute", "distance to the **nearest** …"',
      use: 'BFS from **all the sources at once**',
      problems: ['rotting-oranges', 'walls-and-gates'],
    },
    {
      see: '`n` nodes and a list of **`edges`**: "how many **connected** components?"',
      use: 'an adjacency list and DFS, or **union-find**',
      problems: ['number-of-connected-components-in-an-undirected-graph'],
    },
    {
      see: '`edges`: "is there a **cycle**?", "the **redundant** edge", "a valid tree?"',
      use: '**union-find**: an edge inside one group closes a cycle',
      problems: ['redundant-connection', 'graph-valid-tree'],
    },
    {
      see: '"**change one letter** at a time": each move turns one state into another',
      use: 'states are **nodes**, moves are edges: BFS over the states',
      problems: ['word-ladder'],
    },
    {
      see: 'cells that can **reach the border**; regions that are "**surrounded**"',
      use: 'search **from the border inward**, not from every cell',
      problems: ['pacific-atlantic-water-flow', 'surrounded-regions'],
    },
    {
      see: '"**clone**" a structure whose nodes each list their `neighbors`',
      use: 'a dict of old → new; DFS, reusing a copy already made',
      also: ['arrays-hashing'],
      problems: ['clone-graph'],
    },
  ],
  'advanced-graphs': [
    {
      see: 'edges carry a **weight** (time, cost, distance): "the **cheapest** / fastest route"',
      use: '**Dijkstra**: a min-heap of (cost so far, node)',
      also: ['heap'],
      problems: ['network-delay-time'],
    },
    {
      see: '"**connect all** the points / cities at the **minimum total cost**"',
      use: 'a **minimum spanning tree** (Prim or Kruskal)',
      problems: ['min-cost-to-connect-all-points'],
    },
    {
      see: '"the cheapest route with **at most `k` stops**"',
      use: '**Bellman-Ford**: relax every edge, `k + 1` rounds',
      also: ['dp-2d'],
      problems: ['cheapest-flights-within-k-stops'],
    },
    {
      see: 'each edge has a **travel time**: "how long until **all** the nodes get the signal?"',
      use: 'Dijkstra from the source; the answer is the **largest** distance',
      also: ['heap'],
      problems: ['network-delay-time'],
    },
    {
      see: '"keep the **largest step** on the path as small as possible"',
      use: 'Dijkstra where a path costs its **maximum**, not its sum',
      also: ['binary-search', 'graphs'],
      problems: ['swim-in-rising-water'],
    },
    {
      see: '"use **every edge** (ticket) exactly once"',
      use: 'an **Eulerian path**: DFS that uses up edges, built backward',
      also: ['backtracking', 'graphs'],
      problems: ['reconstruct-itinerary'],
    },
    {
      see: 'words "sorted in an **unknown alphabet**": find the order of the letters',
      use: 'before/after edges from neighboring words, then a topological sort',
      also: ['graphs'],
      problems: ['alien-dictionary'],
    },
    {
      see: 'edge weights may be **negative**; "is there a negative cycle?"',
      use: 'Bellman-Ford: Dijkstra is not safe with negative weights',
    },
  ],
  'dp-1d': [
    {
      see: '"**how many ways** to reach / climb / decode …?"',
      use: '`dp[i]` = ways to reach `i`: add up the ways of each last step',
      also: ['dp-2d'],
      problems: ['climbing-stairs', 'decode-ways'],
    },
    {
      see: '"the **fewest** coins / numbers / steps that add up to **exactly** `amount`"',
      use: '`dp[x]` = 1 + the best `dp[x − c]` over every choice `c`',
      also: ['dp-2d', 'graphs'],
      problems: ['coin-change'],
    },
    {
      see: '"you **cannot take two adjacent** items": the largest total',
      use: '`dp[i]` = max(skip `i`, take `i` plus `dp[i − 2]`)',
      problems: ['house-robber', 'house-robber-ii'],
    },
    {
      see: '"return the **number of** …", "the answer may be large: return it **modulo 10⁹ + 7**"',
      use: 'too many to list: **count** them with a table',
      also: ['dp-2d', 'math-geometry'],
      problems: ['decode-ways', 'coin-change'],
    },
    {
      see: '"**can** the string be **broken into** dictionary words?"',
      use: '`dp[i]` = can the first `i` characters be built?',
      problems: ['word-break'],
    },
    {
      see: '"the longest **increasing subsequence**" (not contiguous)',
      use: '`dp[i]` = the best ending at `i`, from every smaller value before it',
      also: ['binary-search'],
      problems: ['longest-increasing-subsequence'],
    },
    {
      see: '"can some of the items sum to **exactly** `target`?", each used once',
      use: 'knapsack: the set of sums **reachable** so far',
      also: ['dp-2d', 'backtracking'],
      problems: ['partition-equal-subset-sum'],
    },
    {
      see: '"the **longest palindromic** substring", "count the palindromic substrings"',
      use: 'expand around every **center** (or a table over `i`, `j`)',
      also: ['two-pointers', 'dp-2d'],
      problems: ['longest-palindromic-substring', 'palindromic-substrings'],
    },
    {
      see: '"the largest **product** of a **contiguous** subarray"',
      use: 'keep the best **and the worst** product ending at each index',
      also: ['greedy'],
      problems: ['maximum-product-subarray'],
    },
  ],
  'dp-2d': [
    {
      see: 'a pair of strings: "the longest **common** subsequence", "**edit** distance"',
      use: 'a table `dp[i][j]` over a prefix of each string',
      problems: ['longest-common-subsequence', 'edit-distance'],
    },
    {
      see: 'a grid, moving only **right or down**: "how many paths?", "the cheapest path"',
      use: '`dp[r][c]` from the cell above and the cell to the left',
      also: ['math-geometry'],
      problems: ['unique-paths'],
    },
    {
      see: '"how many **combinations** of coins make `amount`?" (unlimited supply)',
      use: 'a table of coins × amount; each coin extends earlier sums',
      also: ['dp-1d'],
      problems: ['coin-change-ii'],
    },
    {
      see: '"put `+` or `−` before every number": how many ways reach `target`?',
      use: 'memoize on **(index, running total)**',
      also: ['dp-1d', 'backtracking'],
      problems: ['target-sum'],
    },
    {
      see: '"does the string **match the pattern**?", with wildcards such as `.` and `*`',
      use: '`dp[i][j]`: does `s[i:]` match `p[j:]`?',
      problems: ['regular-expression-matching'],
    },
    {
      see: '"is `s3` an **interleaving** of `s1` and `s2`?", "how many subsequences equal `t`?"',
      use: '`dp[i][j]`: how much of each string is used so far',
      problems: ['interleaving-string', 'distinct-subsequences'],
    },
    {
      see: '"buy and sell **many times**", with a **cooldown**, a fee or a limit on trades',
      use: 'one state per day and situation: holding, just sold, resting',
      also: ['dp-1d', 'greedy'],
      problems: ['best-time-to-buy-and-sell-stock-with-cooldown'],
    },
    {
      see: '"the longest **increasing path**" through a grid of numbers',
      use: 'DFS from each cell with a **memo** per cell',
      also: ['graphs'],
      problems: ['longest-increasing-path-in-a-matrix'],
    },
    {
      see: '"remove / **burst** / merge items; each gain depends on the **neighbors** left"',
      use: 'a table over ranges `dp[l][r]`: choose the **last** one to go',
      problems: ['burst-balloons'],
    },
  ],
  greedy: [
    {
      see: '"can you **reach the end**?", "the **fewest** jumps / clips / taps to cover the whole range"',
      use: 'track the **farthest** reach; count each time the current one runs out',
      also: ['dp-1d', 'graphs', 'intervals'],
      problems: ['jump-game', 'jump-game-ii'],
    },
    {
      see: '"the **most** that fit without overlapping", "the fewest arrows / groups"',
      use: '**sort** (often by end), then take each item that still fits',
      also: ['intervals'],
    },
    {
      see: '"**assign** … so that **as many as possible** are satisfied" (cookies, jobs to workers)',
      use: '**sort** both sides; give each one the smallest that works',
      also: ['two-pointers'],
    },
    {
      see: '"**split** into **as many** parts **as possible**", each part obeying a rule',
      use: 'cut at the **earliest** point the rule allows',
      problems: ['partition-labels'],
    },
    {
      see: '"the **largest number** you can form", "the **lexicographically smallest** result"',
      use: 'fill positions left to right, each with the best piece still unused',
      also: ['stack'],
    },
    {
      see: '"the largest **sum** of a **contiguous** subarray"',
      use: 'a running sum; drop it when it goes **negative** (Kadane)',
      also: ['dp-1d'],
      problems: ['maximum-subarray'],
    },
    {
      see: '"can the values be split into **groups of consecutive** numbers?"',
      use: 'always start a group from the **smallest** value left',
      also: ['heap', 'arrays-hashing'],
      problems: ['hand-of-straights'],
    },
    {
      see: 'a **circular** route with `gas[i]` and `cost[i]`: "where can you start?"',
      use: 'if the total is enough: restart after each point the tank runs dry',
      problems: ['gas-station'],
    },
  ],
  intervals: [
    {
      see: 'the input is a list of **`[start, end]`** pairs',
      use: '**sort by start** (or by end), then sweep once',
      problems: ['merge-intervals', 'meeting-rooms'],
    },
    {
      see: '"**merge** all the **overlapping** ones"',
      use: 'sort by start; extend the last one while the next overlaps it',
      problems: ['merge-intervals'],
    },
    {
      see: '"can one person **attend all** the meetings?", "do any two overlap?"',
      use: 'sort by start; compare each start with the previous **end**',
      problems: ['meeting-rooms'],
    },
    {
      see: '"the **fewest rooms**", "the most events going on **at the same time**"',
      use: 'a min-heap of end times (or sweep the sorted starts and ends)',
      also: ['heap'],
      problems: ['meeting-rooms-ii'],
    },
    {
      see: '"the **fewest to remove** so that none overlap"',
      use: 'sort by **end**; keep each one that starts after the last kept',
      also: ['greedy'],
      problems: ['non-overlapping-intervals'],
    },
    {
      see: '"**insert** a new range" into a sorted list with no overlaps',
      use: 'copy those before it, merge those that overlap, copy the rest',
      problems: ['insert-interval'],
    },
    {
      see: 'many **queries**: "the smallest range that **contains** each point"',
      use: 'sort both; sweep, keeping the open ranges in a heap by size',
      also: ['heap'],
      problems: ['minimum-interval-to-include-each-query'],
    },
  ],
  'math-geometry': [
    {
      see: '"**rotate** the matrix by 90 degrees", "flip / mirror the image", "in place"',
      use: '**transpose**, then reverse each row',
      problems: ['rotate-image'],
    },
    {
      see: '"in **spiral** order", "in **diagonal** / zigzag order": an unusual walk over a matrix',
      use: '**boundaries** that close in, or a direction that turns',
      problems: ['spiral-matrix'],
    },
    {
      see: 'a number given as an **array of digits** or a **string**: "add one", "add", "multiply"',
      use: 'grade-school arithmetic with a **carry**, right to left',
      problems: ['plus-one', 'multiply-strings'],
    },
    {
      see: '"the **sum of the digits**", "replace `n` by the sum of the squares of its **digits**"',
      use: 'peel digits off with `% 10` and `// 10`',
      problems: ['happy-number'],
    },
    {
      see: '"compute `x` raised to the **power** `n`", where `n` is huge or negative',
      use: '**fast exponentiation**: square the base, halve the exponent',
      problems: ['powx-n'],
    },
    {
      see: 'a **matrix** changed "in place", "with **O(1)** extra space" (set zeroes, Game of Life)',
      use: 'mark **inside the matrix**: its first row and column, or a spare value',
      problems: ['set-matrix-zeroes'],
    },
    {
      see: '"the **greatest common divisor**", "is it **prime**?", "count the primes below `n`"',
      use: 'Euclid: `gcd(a, b) = gcd(b, a % b)`; a sieve for primes',
    },
    {
      see: '**points** on a plane: "count the squares / rectangles they form"',
      use: 'a dict of points; fix a pair of corners, **look up** the others',
      also: ['arrays-hashing'],
      problems: ['detect-squares'],
    },
  ],
  'bit-manipulation': [
    {
      see: '"every value appears **twice except one**", in O(1) extra space',
      use: '**XOR** everything: pairs cancel, the single one is left',
      problems: ['single-number'],
    },
    {
      see: '"the number of **1 bits**", "Hamming weight", "binary representation"',
      use: '`n &= n − 1` clears the lowest 1; count the steps',
      problems: ['number-of-1-bits'],
    },
    {
      see: '"**without** using the operators `+` and `−`"',
      use: 'XOR adds without the carry; AND then a shift gives the carry',
      problems: ['sum-of-two-integers'],
    },
    {
      see: '"**reverse** the bits", "is it a **power of two**?"',
      use: 'shift and mask: `(n >> i) & 1`; `n & (n − 1) == 0`',
      problems: ['reverse-bits'],
    },
    {
      see: 'the numbers `0..n` with **one missing**',
      use: 'XOR every index with every value (or use the sum formula)',
      also: ['math-geometry', 'arrays-hashing'],
      problems: ['missing-number'],
    },
    {
      see: '"for **every** number from 0 to `n`, count its 1 bits"',
      use: '`bits[i] = bits[i >> 1] + (i & 1)`',
      also: ['dp-1d'],
      problems: ['counting-bits'],
    },
    {
      see: 'at most about 20 items, and the task is over **every subset** of them',
      use: 'a subset is a number: bit `i` set means item `i` is in',
      also: ['backtracking'],
    },
    {
      see: '"reverse the **digits** of an integer", "it must fit in **32 bits**"',
      use: 'pop digits with `% 10`; check the bound **before** adding one',
      also: ['math-geometry'],
      problems: ['reverse-integer'],
    },
  ],
};
