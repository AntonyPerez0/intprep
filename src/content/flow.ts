// ─────────────────────────────────────────────────────────────────────────────
// The pattern flowchart (src/pages/Flowchart.tsx, /flowchart): a few questions about
// a problem's wording that end at the pattern to try first.
//
// Two ideas order it. First the structure the problem is built on (a linked list, a
// tree, a graph, a grid, ranges, a class), because that alone often names the pattern.
// Then, for an array, a string or plain numbers, the wording: the strong signals
// first ("all possible", "k-th largest", "O(log n)"), then what the problem is about.
// Options are read top to bottom and the first that fits wins, so put the more
// specific option above the more general one.
//
// Every result lists the problems of the 150 whose wording leads there. That is the
// chart's test: `npm run validate -- flow` fails unless each problem is on exactly one
// result that names its pattern (or a pattern it accepts), or in FLOW_OFF_CHART with
// the reason its wording hides the pattern. Rules are in docs/CONTENT_GUIDE.md.
// ─────────────────────────────────────────────────────────────────────────────
import type { FlowNode } from './types';

export const FLOW_START = 'start';

export const FLOW: FlowNode[] = [
  {
    id: 'start',
    ask: 'What is the problem built on?',
    help: 'What it gives you, or what it asks you to build. Take the first one that fits.',
    options: [
      {
        id: 'list',
        label: 'A **linked list**',
        hint: 'A `head`: nodes with a `val` and a `next`',
        leaf: {
          cat: 'linked-list',
          use: 'walk it with pointers and relink `next`; a **dummy** node, slow and fast',
          problems: [
            'reverse-linked-list',
            'merge-two-sorted-lists',
            'linked-list-cycle',
            'remove-nth-node-from-end-of-list',
            'reorder-list',
            'copy-list-with-random-pointer',
            'add-two-numbers',
            'merge-k-sorted-lists',
            'reverse-nodes-in-k-group',
          ],
        },
      },
      {
        id: 'tree',
        label: 'A **binary tree**',
        hint: 'A `root`: nodes with a `left` and a `right`',
        leaf: {
          cat: 'trees',
          use: '**recursion**: a node’s answer from its children’s; BFS for "level by level"',
          problems: [
            'invert-binary-tree',
            'maximum-depth-of-binary-tree',
            'same-tree',
            'subtree-of-another-tree',
            'diameter-of-binary-tree',
            'balanced-binary-tree',
            'lowest-common-ancestor-of-a-binary-search-tree',
            'binary-tree-level-order-traversal',
            'binary-tree-right-side-view',
            'count-good-nodes-in-binary-tree',
            'validate-binary-search-tree',
            'kth-smallest-element-in-a-bst',
            'construct-binary-tree-from-preorder-and-inorder-traversal',
            'binary-tree-maximum-path-sum',
            'serialize-and-deserialize-binary-tree',
          ],
        },
      },
      {
        id: 'graph',
        label: 'A **graph**',
        hint: '`edges`, `neighbors`, "comes before" rules, flights, points to connect, moves between states',
        to: 'graph',
      },
      {
        id: 'grid',
        label: 'A **grid** or a matrix',
        hint: 'Rows and columns of cells',
        to: 'grid',
      },
      {
        id: 'ranges',
        label: 'A list of **ranges**',
        hint: '`[start, end]` pairs: meetings, intervals',
        leaf: {
          cat: 'intervals',
          use: '**sort by start** (or by end), then sweep once; a heap for "how many at once"',
          problems: [
            'meeting-rooms',
            'merge-intervals',
            'insert-interval',
            'non-overlapping-intervals',
            'meeting-rooms-ii',
            'minimum-interval-to-include-each-query',
          ],
        },
      },
      {
        id: 'class',
        label: 'A **class** to write',
        hint: 'Its methods are called many times',
        to: 'class',
      },
      {
        id: 'plain',
        label: 'An **array**, a **string** or plain numbers',
        hint: 'None of the above',
        to: 'wording',
      },
    ],
  },
  {
    id: 'graph',
    ask: 'What does it ask about the graph?',
    options: [
      {
        id: 'weight',
        label: 'Edges carry a **weight** (cost, time, distance): the cheapest route, or joining everything at the least cost',
        leaf: {
          cat: 'advanced-graphs',
          use: '**Dijkstra** (a min-heap); Bellman-Ford for "at most `k` stops"; a spanning tree to join all',
          problems: ['network-delay-time', 'cheapest-flights-within-k-stops', 'min-cost-to-connect-all-points'],
        },
      },
      {
        id: 'steps',
        label: 'The **shortest path** or the **fewest steps**, and every move costs the same',
        leaf: {
          cat: 'graphs',
          use: '**BFS**: the first time you reach a node is the shortest way',
          problems: ['word-ladder'],
        },
      },
      {
        id: 'order',
        label: 'An **order** that obeys "must come **before**" rules',
        hint: 'Prerequisites, dependencies, an unknown alphabet',
        leaf: {
          cat: 'graphs',
          also: ['advanced-graphs'],
          use: '**topological sort**; a cycle means no order exists',
          problems: ['course-schedule', 'course-schedule-ii', 'alien-dictionary'],
        },
      },
      {
        id: 'groups',
        label: '**Connected** groups, a **cycle**, "is it a tree?", or a copy of the graph',
        leaf: {
          cat: 'graphs',
          use: 'DFS with a visited set, or **union-find** for groups and cycles',
          problems: ['clone-graph', 'graph-valid-tree', 'number-of-connected-components-in-an-undirected-graph', 'redundant-connection'],
        },
      },
      {
        id: 'edges',
        label: 'A route that uses **every edge** exactly once',
        hint: 'Tickets, dominoes, pairs to chain',
        leaf: {
          cat: 'advanced-graphs',
          use: 'an **Eulerian path**: DFS that uses up edges, built backward',
          problems: ['reconstruct-itinerary'],
        },
      },
    ],
  },
  {
    id: 'grid',
    ask: 'What happens on the grid?',
    help: 'Take the first one that fits.',
    options: [
      {
        id: 'paths',
        label: 'You move only **right or down**, or only to larger values: count the paths, find the best one',
        leaf: {
          cat: 'dp-2d',
          also: ['graphs'],
          use: '`dp[r][c]` from the cells it can come from (or DFS with a memo)',
          problems: ['unique-paths', 'longest-increasing-path-in-a-matrix'],
        },
      },
      {
        id: 'word',
        label: 'A **word** is traced through adjacent cells, each used once',
        leaf: {
          cat: 'backtracking',
          also: ['tries'],
          use: 'DFS from each cell: mark, recurse, **unmark**; a trie for a list of words',
          problems: ['word-search', 'word-search-ii'],
        },
      },
      {
        id: 'place',
        label: '**Place** or **fill** cells so that no two conflict: queens, a sudoku to solve',
        leaf: {
          cat: 'backtracking',
          use: 'place one, recurse, **undo**; sets record the rows, columns and diagonals taken',
          problems: [],
        },
      },
      {
        id: 'cost',
        label: 'The **cheapest or earliest way across**: every cell has a cost or a height',
        leaf: {
          cat: 'advanced-graphs',
          use: 'Dijkstra over the cells, with a min-heap',
          problems: ['swim-in-rising-water'],
        },
      },
      {
        id: 'flood',
        label: '**Regions** of joined cells, something that **spreads**, the nearest or reachable cells: islands, rot, water flow',
        leaf: {
          cat: 'graphs',
          use: 'DFS or BFS from a cell, **marking** each one visited; BFS from all sources at once',
          problems: ['number-of-islands', 'max-area-of-island', 'walls-and-gates', 'rotting-oranges', 'pacific-atlantic-water-flow', 'surrounded-regions'],
        },
      },
      {
        id: 'shape',
        label: 'The matrix is **rotated**, read in **spiral** order, or rewritten **in place**',
        leaf: {
          cat: 'math-geometry',
          use: 'index arithmetic: transpose and reverse, or boundaries that close in',
          problems: ['rotate-image', 'spiral-matrix', 'set-matrix-zeroes'],
        },
      },
      {
        id: 'sorted',
        label: 'The rows are **sorted**, and you look for one value',
        leaf: {
          cat: 'binary-search',
          use: 'binary search, treating the grid as one sorted list',
          problems: ['search-a-2d-matrix'],
        },
      },
      {
        id: 'rule',
        label: '**Check** a filled grid: no repeats in any row, column or box',
        leaf: {
          cat: 'arrays-hashing',
          use: 'one **set per group**; a value already in its set breaks the rule',
          problems: ['valid-sudoku'],
        },
      },
    ],
  },
  {
    id: 'class',
    ask: 'What must each call do quickly?',
    options: [
      {
        id: 'recent',
        label: '`push`, `pop` and `top`, plus the **minimum** so far in O(1)',
        leaf: {
          cat: 'stack',
          use: 'a stack that stores the minimum so far **beside each value**',
          problems: ['min-stack'],
        },
      },
      {
        id: 'best',
        label: 'Report the **smallest**, **largest**, **k-th** or **median** of what has arrived, or the `k` newest across several sources',
        leaf: {
          cat: 'heap',
          use: 'keep a **heap** between calls (two heaps for a median)',
          problems: ['kth-largest-element-in-a-stream', 'find-median-from-data-stream', 'design-twitter'],
        },
      },
      {
        id: 'prefix',
        label: 'Store words; search them by **prefix** or with wildcards',
        leaf: {
          cat: 'tries',
          use: 'a **trie**: one node per letter, with an end-of-word flag',
          problems: ['implement-trie-prefix-tree', 'design-add-and-search-words-data-structure'],
        },
      },
      {
        id: 'used',
        label: 'Keep items in **order of use**, and evict the oldest in O(1)',
        leaf: {
          cat: 'linked-list',
          also: ['arrays-hashing'],
          use: 'a dict for lookup plus a **doubly linked** list for the order',
          problems: ['lru-cache'],
        },
      },
      {
        id: 'time',
        label: 'Look up by key, then by **time** or by sorted position',
        leaf: {
          cat: 'binary-search',
          use: 'a dict of sorted lists; binary search for the boundary',
          problems: ['time-based-key-value-store'],
        },
      },
      {
        id: 'other',
        label: '**None of these**: an ordinary problem wrapped in a class',
        to: 'wording',
      },
    ],
  },
  {
    id: 'wording',
    ask: 'Does the wording ask for one of these?',
    help: 'These phrases are the strongest signals. Take the first one that fits.',
    options: [
      {
        id: 'all',
        label: '"Return **all possible** …": every subset, permutation, combination or valid arrangement (not just pairs or triplets)',
        leaf: {
          cat: 'backtracking',
          use: 'DFS that **chooses, explores, then un-chooses**',
          problems: [
            'subsets',
            'letter-combinations-of-a-phone-number',
            'generate-parentheses',
            'combination-sum',
            'permutations',
            'subsets-ii',
            'combination-sum-ii',
            'palindrome-partitioning',
            'n-queens',
          ],
        },
      },
      {
        id: 'topk',
        label: '"The **k-th largest**", "the **top `k`**", or the largest / smallest taken again and again',
        leaf: {
          cat: 'heap',
          use: 'a **heap**, capped at size `k` for "top `k`"',
          problems: ['last-stone-weight', 'k-closest-points-to-origin', 'kth-largest-element-in-an-array', 'top-k-frequent-elements'],
        },
      },
      {
        id: 'log',
        label: 'One value to **find** in a **sorted** input, "**O(log n)**", or "the **minimum** speed / capacity that still works"',
        hint: 'A number to guess and test: if one guess works, every larger one does too',
        leaf: {
          cat: 'binary-search',
          use: '**halve** the range each step; or search on the answer with a test function',
          problems: ['binary-search', 'koko-eating-bananas', 'find-minimum-in-rotated-sorted-array', 'search-in-rotated-sorted-array', 'median-of-two-sorted-arrays'],
        },
      },
      {
        id: 'bits',
        label: '**Bits**: XOR, 1 bits, "without `+` or `−`", or the one value left **unpaired** or missing',
        leaf: {
          cat: 'bit-manipulation',
          use: '**XOR** cancels pairs; shift and mask to read one bit',
          problems: ['single-number', 'number-of-1-bits', 'counting-bits', 'reverse-bits', 'missing-number', 'sum-of-two-integers'],
        },
      },
      {
        id: 'prefix',
        label: 'Many words looked up by **prefix**: "starts with", autocomplete',
        leaf: {
          cat: 'tries',
          use: 'put the words in a **trie**; walk it letter by letter',
          problems: [],
        },
      },
      {
        id: 'none',
        label: '**None of these**',
        to: 'about',
      },
    ],
  },
  {
    id: 'about',
    ask: 'What is the problem about?',
    help: 'Take the first one that fits.',
    options: [
      {
        id: 'piece',
        label: 'A **contiguous** piece: a subarray, a substring, a window, or everything to the left / right of an index',
        to: 'piece',
      },
      {
        id: 'pair',
        label: 'A **pair or triplet of values** (a given sum, two walls), a **palindrome** check, or a change made **in place**',
        to: 'pair',
      },
      {
        id: 'nest',
        label: 'Things that **nest, cancel or wait** for a later item: brackets, "next greater", undo, evaluate, bars of a histogram',
        leaf: {
          cat: 'stack',
          use: 'push as you go; the **top** is the most recent one still open',
          problems: [
            'valid-parentheses',
            'evaluate-reverse-polish-notation',
            'daily-temperatures',
            'largest-rectangle-in-histogram',
            'trapping-rain-water',
            'valid-parenthesis-string',
          ],
        },
      },
      {
        id: 'seen',
        label: '**Duplicates, counts**, items **grouped by what they share**, or unsorted with "O(n)": "have I seen this value?"',
        leaf: {
          cat: 'arrays-hashing',
          use: 'a **set** or a dict: O(1) lookups in a single pass',
          problems: ['contains-duplicate', 'valid-anagram', 'group-anagrams', 'longest-consecutive-sequence'],
        },
      },
      {
        id: 'digits',
        label: '**Digits**, powers, primes, or points on a plane',
        leaf: {
          cat: 'math-geometry',
          use: 'arithmetic by hand: a **carry**, `% 10`, fast powers, a dict of points',
          problems: ['plus-one', 'happy-number', 'powx-n', 'multiply-strings', 'reverse-integer', 'detect-squares'],
        },
      },
      {
        id: 'choices',
        label: 'A count of ways, a best total, or a yes / no **over many choices**: "how many ways", "minimum cost", "can it be done?"',
        to: 'choices',
      },
      {
        id: 'none',
        label: '**None of these**',
        leaf: {
          cat: 'arrays-hashing',
          use: 'write the brute force first; a dict or a set often removes its inner loop',
          problems: ['encode-and-decode-strings'],
        },
      },
    ],
  },
  {
    id: 'piece',
    ask: 'What does it want from the piece?',
    options: [
      {
        id: 'window',
        label: 'The **longest or shortest** piece that meets a rule, or every window of size `k`',
        leaf: {
          cat: 'sliding-window',
          use: 'grow the right edge; shrink the left while the rule is broken',
          problems: [
            'longest-substring-without-repeating-characters',
            'longest-repeating-character-replacement',
            'permutation-in-string',
            'minimum-window-substring',
            'sliding-window-maximum',
          ],
        },
      },
      {
        id: 'sums',
        label: 'A sum that **equals `k`** (values may be negative), sums of many ranges, "everything **except** `nums[i]`"',
        leaf: {
          cat: 'arrays-hashing',
          use: '**prefix** running totals, built once (kept in a dict for "equals `k`")',
          problems: ['product-of-array-except-self'],
        },
      },
      {
        id: 'best',
        label: 'The **largest sum** or product of any piece',
        leaf: {
          cat: 'greedy',
          also: ['dp-1d'],
          use: 'the best piece ending at each index: extend it or start fresh (Kadane)',
          problems: ['maximum-subarray', 'maximum-product-subarray'],
        },
      },
      {
        id: 'palindrome',
        label: 'A piece that reads as a **palindrome**',
        leaf: {
          cat: 'dp-1d',
          also: ['two-pointers'],
          use: 'expand outward around every **center**',
          problems: ['longest-palindromic-substring', 'palindromic-substrings'],
        },
      },
    ],
  },
  {
    id: 'pair',
    ask: 'Which one?',
    options: [
      {
        id: 'unsorted',
        label: 'A pair with a given sum in an **unsorted** list, and the answer needs their positions',
        leaf: {
          cat: 'arrays-hashing',
          use: 'a **dict** of value → index; look up each complement',
          problems: ['two-sum'],
        },
      },
      {
        id: 'sorted',
        label: 'The input is **sorted**, or sorting it does no harm: a pair, triplets, the closest sum',
        leaf: {
          cat: 'two-pointers',
          use: 'a pointer at **each end**; move the side that fixes the sum',
          problems: ['two-sum-ii-input-array-is-sorted', '3sum'],
        },
      },
      {
        id: 'ends',
        label: 'A **palindrome** check, a pair of walls, or reversing / removing / moving **in place**',
        leaf: {
          cat: 'two-pointers',
          use: 'compare or swap from **both ends**; or a read and a write pointer',
          problems: ['valid-palindrome', 'container-with-most-water'],
        },
      },
    ],
  },
  {
    id: 'choices',
    ask: 'How do the choices behave?',
    help: 'Take the first one that fits. When unsure between the last three, it is usually dynamic programming.',
    options: [
      {
        id: 'tiny',
        label: 'The limits are **tiny** (`n ≤ 20`) for **one list** of items: every arrangement can be tried',
        leaf: {
          cat: 'backtracking',
          also: ['dp-2d'],
          use: '**try everything**: choose, explore, un-choose; add a memo when states repeat',
          problems: ['target-sum'],
        },
      },
      {
        id: 'greedy',
        label: 'One **clearly best move** at each step, never undone: the farthest reach, the earliest end, the smallest first',
        leaf: {
          cat: 'greedy',
          use: 'take the best move now; **sort first** when the order is yours to choose',
          problems: [
            'best-time-to-buy-and-sell-stock',
            'jump-game',
            'jump-game-ii',
            'gas-station',
            'hand-of-straights',
            'merge-triplets-to-form-target-triplet',
            'partition-labels',
            'task-scheduler',
          ],
        },
      },
      {
        id: 'two',
        label: '**Two things** change: a pair of strings, a string and a pattern, or a row that shrinks as items are removed',
        leaf: {
          cat: 'dp-2d',
          use: 'a table `dp[i][j]`, one axis per thing that changes',
          problems: ['longest-common-subsequence', 'interleaving-string', 'distinct-subsequences', 'edit-distance', 'burst-balloons', 'regular-expression-matching'],
        },
      },
      {
        id: 'one',
        label: 'A choice now changes what is left, along **one sequence**: a position to track, and maybe an amount',
        leaf: {
          cat: 'dp-1d',
          also: ['dp-2d'],
          use: '`dp[i]` from earlier answers: recursion, then a cache, then a table',
          problems: [
            'climbing-stairs',
            'min-cost-climbing-stairs',
            'house-robber',
            'house-robber-ii',
            'decode-ways',
            'coin-change',
            'word-break',
            'longest-increasing-subsequence',
            'partition-equal-subset-sum',
            'coin-change-ii',
            'best-time-to-buy-and-sell-stock-with-cooldown',
          ],
        },
      },
    ],
  },
];

/**
 * Problems of the 150 whose wording does not lead to their pattern, with the reason. The chart
 * is honest about them: the page lists them under the whole chart.
 */
export const FLOW_OFF_CHART: { id: string; why: string }[] = [
  {
    id: 'car-fleet',
    why: 'Nothing in its wording points to a stack. Sort the cars by position, then keep the arrival times that are not caught up.',
  },
  {
    id: 'find-the-duplicate-number',
    why: 'The word "duplicate" leads to a set. The rule against extra memory is what turns it into finding a cycle, as in a linked list.',
  },
];

export const FLOW_BY_ID: Record<string, FlowNode> = Object.fromEntries(FLOW.map((n) => [n.id, n]));
