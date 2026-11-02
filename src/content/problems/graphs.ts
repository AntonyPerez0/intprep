import { py, type CategoryContent } from '../types';

const content: CategoryContent = {
  guide: {
    category: 'graphs',
    summary: `A **graph** is a set of **nodes** (things) joined by **edges** (connections). Cities and roads, people and friendships, courses and prerequisites: all graphs. A grid is a graph too, where each cell is a node whose neighbors are the cells up, down, left and right.

We usually store a graph as an **adjacency list**: for each node, the list of its neighbors. Building it from a list of edges is the first step of most problems.

To explore, use **DFS** (go deep down one path, with recursion or a stack) or **BFS** (spread outward ring by ring, with a queue). Both need a **visited** set so no node is processed twice; without it, a cycle makes you loop forever. BFS has a bonus: the first time it reaches a node is along a **shortest path** (fewest edges).

Two more tools complete the unit. **Topological sort** orders tasks so every prerequisite comes first, and spots impossible cycles. **Union-find** keeps track of which nodes are already connected while edges arrive one by one.`,
    analogy:
      'Exploring a city with a map and a highlighter. You start at one corner, walk to every corner you can reach, and highlight each one so you never walk the same block twice. DFS is following one road as far as it goes before turning back; BFS is the ripple from a stone dropped in a pond.',
    whenToUse: [
      'Things connected to other things (friends, routes, prerequisites) → build an **adjacency list**',
      'A 2-D grid where you count or measure connected blobs (islands, regions) → **grid DFS or BFS**',
      '"Fewest steps", "shortest sequence" or "minimum minutes" with equal-cost moves → **BFS**',
      'Many starting points spreading at the same time (all gates, all rotten oranges) → **multi-source BFS**',
      '"Prerequisites", "ordering", "can every task be finished?" → **topological sort** and cycle detection',
      'Edges arrive one at a time and you ask "are these two already connected?" → **union-find**',
    ],
    template: py`
# 1. Adjacency list from an edge list
graph = collections.defaultdict(list)
for a, b in edges:
    graph[a].append(b)
    graph[b].append(a)              # leave this out for directed edges

# 2. BFS: fewest steps from start to every reachable node
def bfs(start):
    dist = {start: 0}               # doubles as the visited set
    queue = collections.deque([start])
    while queue:
        node = queue.popleft()
        for nb in graph[node]:
            if nb not in dist:      # mark when you ADD to the queue
                dist[nb] = dist[node] + 1
                queue.append(nb)
    return dist

# 3. Grid DFS (flood fill): visit every land cell connected to (r, c)
def dfs(r, c):
    if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != "1":
        return
    grid[r][c] = "0"                # mark visited by sinking it
    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        dfs(r + dr, c + dc)

# 4. Topological sort (Kahn): edges point prerequisite -> task
indegree = [0] * n
for pre, task in edges:
    indegree[task] += 1
queue = collections.deque(i for i in range(n) if indegree[i] == 0)
order = []
while queue:
    node = queue.popleft()
    order.append(node)
    for nxt in graph[node]:
        indegree[nxt] -= 1
        if indegree[nxt] == 0:
            queue.append(nxt)
has_cycle = len(order) < n

# 5. Union-find: which group (leader) does each node belong to?
parent = list(range(n))
def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]   # path compression
        x = parent[x]
    return x
def union(a, b):
    root_a, root_b = find(a), find(b)
    if root_a == root_b:
        return False                # already connected: this edge makes a cycle
    parent[root_a] = root_b
    return True`,
    templateNotes: [
      'Mark a node visited when you **add** it to the queue, not when you pop it. Otherwise the same node can be queued many times.',
      'Grids need no adjacency list: the neighbors of `(r, c)` come from the four direction pairs. Always bounds-check before reading `grid[r][c]`.',
      'Recursive DFS is the shortest to write, but a huge grid can exceed Python recursion depth. BFS or an explicit stack is the safe swap.',
      "Kahn's algorithm repeatedly takes a node with no remaining prerequisites. Nodes that never reach in-degree 0 sit on a cycle.",
      '`union` returns `False` when both ends already share a leader: that edge closes a cycle. Counting successful unions counts merges between components.',
    ],
    complexity:
      'O(V + E) time for BFS, DFS and topological sort (O(rows · cols) on a grid), with O(V) extra space for the visited set and the queue or stack. Union-find costs nearly O(1) per operation.',
    quiz: [
      {
        q: 'Which traversal finds the **fewest steps** between two nodes when every edge costs the same?',
        options: ['DFS', 'BFS', 'Union-find', 'Sorting the nodes'],
        answer: 1,
        explain:
          'BFS visits nodes in order of distance: everything 1 step away, then 2 steps, and so on. The first time it reaches a node is along a shortest path.',
      },
      {
        q: 'Why do graph traversals keep a **visited** set?',
        options: [
          'To keep the nodes sorted',
          'Without it, a cycle would make the search revisit nodes forever',
          'To store the final answer',
          'Python requires it for recursion',
        ],
        answer: 1,
        explain: 'Graphs can loop back on themselves. Remembering visited nodes guarantees each one is processed once, giving O(V + E).',
      },
      {
        q: "Kahn's algorithm finishes with fewer than n nodes in the order. What does that mean?",
        options: [
          'The graph has more than one connected piece',
          'There is a cycle, so no valid order exists',
          'The edges were given in the wrong order',
          'The graph is a tree',
        ],
        answer: 1,
        explain:
          'Nodes on a cycle all wait for each other, so their in-degree never drops to 0 and they never enter the queue. Separate pieces are fine: they still get ordered.',
      },
      {
        q: 'Rotten oranges infect their neighbors every minute. Where should the BFS start?',
        options: [
          'From the top-left cell',
          'From one rotten orange, then from the next one',
          'From all rotten oranges at once (multi-source BFS)',
          'From every fresh orange',
        ],
        answer: 2,
        explain:
          'All rotten oranges spread at the same time. Putting all of them in the queue at the start makes each BFS level equal one minute.',
      },
    ],
  },

  problems: [
    {
      id: 'number-of-islands',
      num: 200,
      title: 'Number of Islands',
      difficulty: 'Medium',
      category: 'graphs',
      pattern: 'Grid DFS flood fill',
      prompt:
        'You get a grid `grid` of `"1"` (land) and `"0"` (water). An **island** is a group of land cells connected **up, down, left or right**. Return how many islands there are. Everything outside the grid counts as water.',
      examples: [
        {
          input: 'grid = [["1", "1", "0", "0"], ["0", "1", "0", "1"], ["1", "0", "0", "1"]]',
          output: '3',
          note: 'Diagonal cells do not connect, so the bottom-left "1" is an island on its own.',
        },
        { input: 'grid = [["0", "0"], ["0", "0"]]', output: '0' },
      ],
      signals: ['a grid of land and water (1s and 0s)', '"connected horizontally or vertically"', '"count the number of groups"'],
      hints: [
        'When you step on a land cell that nobody has visited yet, you have found a new island. How do you avoid counting its other cells again?',
        'From that cell, visit every land cell you can reach and mark them all as seen.',
        'Loop over all cells. On a "1", add one to the count and DFS to "sink" the whole island by turning its cells into "0".',
      ],
      brute:
        'For each land cell, run a fresh search to check whether it connects to a cell you already counted: **O((m·n)²)**. Marking cells as visited means each cell is processed once.',
      insight:
        'Every land cell you have not visited yet starts a **new island**. Flood-fill from it with DFS and sink all the connected land so it is never counted again. The number of flood fills is the answer.',
      mnemonic: 'Find land, count one, sink the whole island.',
      steps: [
        'Write dfs(r, c) to flood-fill one island.',
        'In dfs, stop if the cell is off the grid or is water.',
        'Sink the cell (turn it into "0"), then call dfs on its four neighbors.',
        'Loop over every cell of the grid.',
        'On each remaining "1", add one to the count and call dfs to sink that island.',
      ],
      solution: py`
class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        #@ Grid size, used for bounds checks.
        rows, cols = len(grid), len(grid[0])

        #@ dfs sinks the whole island that contains (r, c).
        def dfs(r, c):
            #@ Stop at the edge of the map or at water (sunk land is water now too).
            if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != "1":
                return
            #@ Sink this cell so it is never counted or visited again.
            grid[r][c] = "0"  #!
            #@ Spread to the four neighbors: down, up, right, left.
            dfs(r + 1, c)
            dfs(r - 1, c)
            dfs(r, c + 1)
            dfs(r, c - 1)

        #@ Scan every cell; land that is still there means a brand-new island.
        count = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == "1":
                    #@ Count it once, then sink all of it. Return the count after the scan.
                    count += 1  #!
                    dfs(r, c)  #!
        return count`,
      time: 'O(m · n)',
      space: 'O(m · n)',
      complexityWhy:
        'Every cell is looked at by the scan once and sunk by a DFS at most once. If the whole grid is land, the recursion can go m·n deep.',
      pitfalls: [
        'The grid holds strings: compare with `"1"`, not the number `1`.',
        'Counting diagonal neighbors: only up, down, left and right connect.',
        'A huge all-land grid can exceed Python recursion depth; BFS with a deque or an explicit stack avoids that.',
        'If you may not change the input, use a `visited` set instead of sinking.',
      ],
    },
    {
      id: 'max-area-of-island',
      num: 695,
      title: 'Max Area of Island',
      difficulty: 'Medium',
      category: 'graphs',
      pattern: 'Grid DFS that returns a size',
      prompt:
        'You get a grid of `1` (land) and `0` (water). An island is a group of 1s connected up, down, left or right. Return the **area** (number of cells) of the **largest** island, or `0` if there is no land at all.',
      examples: [
        {
          input: 'grid = [[1, 1, 0, 1], [0, 1, 0, 1], [0, 0, 0, 1], [1, 0, 1, 1]]',
          output: '5',
          note: 'The island down the right side has 5 cells; the others have 3 and 1.',
        },
        { input: 'grid = [[0, 0, 0]]', output: '0' },
      ],
      signals: ['a grid of 0s and 1s', '"largest connected region"', 'the size or area of each group'],
      hints: [
        'This is Number of Islands, but instead of counting islands you measure each one.',
        'Make the DFS return how many cells it sank.',
        'Area from (r, c) = 1 + the areas returned by the four neighbor calls (water and off-grid cells return 0). Keep the maximum over all starting cells.',
      ],
      brute:
        'For every land cell, run a fresh search with its own visited set to measure its island: **O((m·n)²)**, because a big island is re-measured once for every cell it has.',
      insight:
        'Let the flood fill **return a count**: 1 for the current cell plus whatever its four neighbors return. Sink cells as you go so each one is counted once, and keep the largest total.',
      mnemonic: 'Area = 1 + four neighbor areas; keep the max.',
      steps: [
        'Write dfs(r, c) that returns the area it sinks.',
        'Return 0 for off-grid cells and water.',
        'Sink the cell, then return 1 plus the dfs of its four neighbors.',
        'Call dfs from every cell and keep the largest result.',
      ],
      solution: py`
class Solution:
    def maxAreaOfIsland(self, grid: List[List[int]]) -> int:
        #@ Grid size, used for bounds checks.
        rows, cols = len(grid), len(grid[0])

        #@ dfs returns the area of the island containing (r, c), sinking it as it goes.
        def dfs(r, c):
            #@ Water or off the map adds nothing.
            if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] == 0:
                return 0
            #@ Sink this cell so it is counted exactly once.
            grid[r][c] = 0  #!
            #@ This cell plus everything reachable through its four neighbors.
            return 1 + dfs(r + 1, c) + dfs(r - 1, c) + dfs(r, c + 1) + dfs(r, c - 1)  #!

        #@ Try every cell; water and already-sunk land simply return 0.
        best = 0
        for r in range(rows):
            for c in range(cols):
                best = max(best, dfs(r, c))  #!
        return best`,
      time: 'O(m · n)',
      space: 'O(m · n)',
      complexityWhy:
        'Each cell is sunk at most once, and every other dfs call returns immediately. The recursion can hold every cell of one huge island.',
      pitfalls: [
        'Forgetting to sink the cell before recursing: neighbors call back into it forever.',
        'This grid holds the integers `1` and `0`, unlike Number of Islands, which uses strings.',
        'Very large islands can exceed Python recursion depth; an explicit stack or BFS avoids it.',
      ],
    },
    {
      id: 'clone-graph',
      num: 133,
      title: 'Clone Graph',
      difficulty: 'Medium',
      category: 'graphs',
      pattern: 'DFS with an original → copy hash map',
      prompt:
        'You get one node of a **connected, undirected graph**. Each `Node` has a `val` and a list `neighbors`. Return a **deep copy** of the whole graph: brand-new nodes with the same values and the same connections, none of them pointing at an original node. (Examples show the graph as `adjList`, where entry `i` lists the neighbors of the node with value `i + 1`.)',
      examples: [
        {
          input: 'adjList = [[2, 3], [1, 3], [1, 2]]',
          output: '[[2, 3], [1, 3], [1, 2]]',
          note: 'A triangle. The copy has the same shape but is built from new nodes.',
        },
        { input: 'adjList = [[2], [1]]', output: '[[2], [1]]', note: 'Two nodes joined by one edge.' },
      ],
      signals: ['"deep copy" or "clone"', 'nodes with neighbor lists (a graph that may have cycles)', 'the same node can be reached in several ways'],
      hints: [
        'Copying a node means copying its neighbors too, which suggests recursion. But a cycle would make plain recursion loop forever.',
        'Remember which original nodes you have already copied, and reuse those copies.',
        'Use a dict original → copy. In dfs(node): if the node is in the dict, return its copy; otherwise create the copy, store it **before** visiting neighbors, then append dfs(neighbor) for each neighbor.',
      ],
      brute:
        'Copying recursively with no memory never finishes on a cycle (1 → 2 → 1 → …), and copying a node each time it is reached creates several different clones of it. A map from original to copy is required; with it, the work is **O(V + E)**.',
      insight:
        'Keep a hash map from **original node → its copy**. It doubles as the visited set: create and store a copy the first time you see a node, and whenever you meet that node again, reuse the stored copy.',
      mnemonic: 'Map old to new; store the copy before visiting neighbors.',
      steps: [
        'Create an empty dict from original node to copy.',
        'In dfs(node), return the stored copy if the node was already copied.',
        'Otherwise create a new node with the same value and store it in the dict.',
        "For each neighbor, append dfs(neighbor) to the copy's neighbor list.",
        'Return dfs(node), or None if the graph is empty.',
      ],
      solution: py`
class Solution:
    def cloneGraph(self, node: Optional['Node']) -> Optional['Node']:
        #@ Maps each original node to its copy. It is also our visited set.
        clones = {}

        #@ dfs returns the copy of an original node, creating it if needed.
        def dfs(original):
            #@ Already copied? Reuse that copy, which also stops cycles.
            if original in clones:  #!
                return clones[original]
            #@ Make the copy and record it BEFORE visiting neighbors.
            copy = Node(original.val)
            clones[original] = copy  #!
            #@ Connect the copy to the copies of every neighbor, then return the copy.
            for neighbor in original.neighbors:
                copy.neighbors.append(dfs(neighbor))  #!
            return copy

        #@ An empty graph clones to nothing.
        return dfs(node) if node else None`,
      time: 'O(V + E)',
      space: 'O(V)',
      complexityWhy:
        'Each node is copied once and each edge is followed once from each end. The dict holds V copies and the recursion can be V deep.',
      pitfalls: [
        'Storing the copy *after* processing neighbors: a cycle reaches the node again before it is in the dict, so you recurse forever.',
        'Appending the original neighbor instead of its copy: the new graph would point back into the old one.',
        'Handle `node is None` (an empty graph).',
      ],
    },
    {
      id: 'walls-and-gates',
      num: 286,
      title: 'Walls and Gates',
      difficulty: 'Medium',
      category: 'graphs',
      premium: true,
      pattern: 'Multi-source BFS',
      prompt:
        'You get a grid `rooms` where `-1` is a wall, `0` is a gate and `2147483647` (call it INF) is an empty room. Fill **each empty room with the number of steps to its nearest gate**, moving up, down, left or right. Rooms that cannot reach any gate stay INF. Change the grid in place and return nothing.',
      examples: [
        {
          input: 'rooms = [[INF, -1, 0], [INF, INF, INF], [0, -1, INF]]',
          output: '[[2, -1, 0], [1, 2, 1], [0, -1, 2]]',
          note: 'INF = 2147483647. The output is the grid after the call.',
        },
        { input: 'rooms = [[0, -1, INF]]', output: '[[0, -1, INF]]', note: 'The wall cuts the room off from the gate, so it stays INF.' },
      ],
      signals: ['"distance to the nearest" of several sources', 'equal-cost grid moves', 'many starting points (every gate)', 'fill every cell in place'],
      hints: [
        'Running a BFS from every room, or from every gate one at a time, repeats a lot of work.',
        'What if all the gates start spreading at the same moment, like ripples from many stones?',
        'Put every gate in the queue first. BFS outward; when you reach an INF room, set it to the current cell value + 1 and queue it.',
      ],
      brute:
        'Run a separate BFS from each of the g gates and keep the smallest distance per room: **O(g · m · n)**, which is O((m·n)²) when there are many gates.',
      insight:
        '**Multi-source BFS**: start the queue with **all** gates at distance 0. BFS reaches each room first from its nearest gate, so the first distance written is final, and an INF value doubles as "not visited yet".',
      mnemonic: 'All gates start the ripple; first touch is the distance.',
      steps: [
        'Put the position of every gate into a queue.',
        'Pop a cell from the front of the queue.',
        'Look at its four neighbors.',
        'If a neighbor is an empty room still at INF, set it to this cell value + 1.',
        'Push that room onto the queue so it spreads further.',
      ],
      solution: py`
class Solution:
    def wallsAndGates(self, rooms: List[List[int]]) -> None:
        #@ INF marks an empty room that no gate has reached yet.
        INF = 2147483647
        rows, cols = len(rooms), len(rooms[0])
        #@ Multi-source BFS: every gate starts in the queue, at distance 0.
        queue = collections.deque()
        for r in range(rows):
            for c in range(cols):
                if rooms[r][c] == 0:
                    queue.append((r, c))  #!
        #@ Cells come out in order of distance from their nearest gate.
        while queue:
            r, c = queue.popleft()
            #@ Look at the four neighbors of this cell.
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                #@ Only empty rooms not reached yet; walls, gates and filled rooms are skipped.
                if 0 <= nr < rows and 0 <= nc < cols and rooms[nr][nc] == INF:
                    #@ First visit is the shortest distance. Record it and keep spreading.
                    rooms[nr][nc] = rooms[r][c] + 1  #!
                    queue.append((nr, nc))`,
      time: 'O(m · n)',
      space: 'O(m · n)',
      complexityWhy:
        'Each room enters the queue at most once, at the moment it gets its distance, and each pop checks 4 neighbors. The queue can hold O(m·n) cells.',
      pitfalls: [
        'Running one BFS per gate: correct, but much slower, and you must keep the minimum each time.',
        'Using DFS: it may reach a room along a long path first, so the first value written is not the shortest.',
        'Only overwrite cells equal to INF. That check is what stops revisits and keeps walls and gates untouched.',
      ],
    },
    {
      id: 'rotting-oranges',
      num: 994,
      title: 'Rotting Oranges',
      difficulty: 'Medium',
      category: 'graphs',
      pattern: 'Multi-source BFS, one level per minute',
      prompt:
        'Each cell of `grid` is `0` (empty), `1` (a fresh orange) or `2` (a rotten orange). Every minute, each rotten orange rots the fresh oranges directly **up, down, left and right** of it. Return the **minimum number of minutes** until no fresh orange is left, or `-1` if some orange can never rot.',
      examples: [
        {
          input: 'grid = [[2, 1, 1], [0, 1, 0], [1, 1, 2]]',
          output: '2',
          note: 'Minute 1 rots the two oranges next to the rotten corners; minute 2 rots the remaining three.',
        },
        { input: 'grid = [[1, 0, 2]]', output: '-1', note: 'The empty cell keeps the left orange safe forever.' },
      ],
      signals: ['something spreads to neighbors "every minute"', '"minimum time until all…"', 'several starting points at once', 'return -1 if it is impossible'],
      hints: [
        'All rotten oranges spread at the same time. Which traversal moves outward one "ring" per step?',
        'Start a BFS with every rotten orange in the queue, and process the queue one whole level (one minute) at a time.',
        'Count the fresh oranges first. Each minute, rot the fresh neighbors of everything in the current level, subtract them from the count, and add a minute. Stop when the count hits 0 or the queue is empty.',
      ],
      brute:
        'Simulate minute by minute, scanning the whole grid each time to find the rotten oranges: **O((m·n)²)** in the worst case, because there can be about m·n minutes.',
      insight:
        '**Multi-source BFS by level**: the queue starts with all rotten oranges, and each full level of the BFS is exactly one minute. A running count of fresh oranges tells you at the end whether any were unreachable.',
      mnemonic: 'All rotten start together; one BFS level per minute.',
      steps: [
        'Queue every rotten orange and count the fresh ones.',
        'While fresh oranges remain and the queue is not empty, start a new minute.',
        'Process exactly the oranges that were in the queue when the minute began.',
        'Rot each fresh neighbor, lower the fresh count and queue it.',
        'After the level, add one to the minutes.',
        'Return the minutes if no fresh oranges remain, otherwise -1.',
      ],
      solution: py`
class Solution:
    def orangesRotting(self, grid: List[List[int]]) -> int:
        #@ Grid size, plus a queue and a counter that the scan below fills in.
        rows, cols = len(grid), len(grid[0])
        queue = collections.deque()
        fresh = 0
        #@ All rotten oranges start in the queue together; count the fresh ones.
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == 2:
                    queue.append((r, c))  #!
                elif grid[r][c] == 1:
                    fresh += 1
        #@ Each pass of this loop is one minute. Stop once nothing fresh is left.
        minutes = 0
        while queue and fresh > 0:
            #@ Only the oranges that were rotten when this minute began spread now.
            for _ in range(len(queue)):  #!
                r, c = queue.popleft()
                #@ Rot each fresh neighbor and queue it for the next minute.
                for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                        grid[nr][nc] = 2
                        fresh -= 1
                        queue.append((nr, nc))
            #@ That minute is over.
            minutes += 1
        #@ Any orange still fresh could never be reached.
        return minutes if fresh == 0 else -1  #!`,
      time: 'O(m · n)',
      space: 'O(m · n)',
      complexityWhy: 'Each cell is scanned once and each orange is queued at most once. The queue can hold O(m·n) oranges.',
      pitfalls: [
        'Looping on `while queue` alone counts one extra minute after the last orange rots. Also checking `fresh > 0` avoids it.',
        'Not processing level by level (`for _ in range(len(queue))`) mixes different minutes together.',
        'No fresh oranges at the start means the answer is 0, not -1.',
      ],
    },
    {
      id: 'pacific-atlantic-water-flow',
      num: 417,
      title: 'Pacific Atlantic Water Flow',
      difficulty: 'Medium',
      category: 'graphs',
      pattern: 'Reverse DFS inward from the borders',
      prompt:
        'An island is given as a grid of `heights`. The **Pacific** touches its top and left edges; the **Atlantic** touches its bottom and right edges. Rain flows from a cell to a neighbor (up, down, left, right) whose height is **less than or equal** to it, and from an edge cell straight into the ocean beside it. Return the coordinates `[r, c]` of every cell from which water can reach **both** oceans.',
      examples: [
        {
          input: 'heights = [[1, 2, 3], [8, 9, 4], [7, 6, 5]]',
          output: '[[0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]]',
          note: 'Water from the 1 and the 2 in the top row can only run into the Pacific.',
        },
        {
          input: 'heights = [[2, 1, 2]]',
          output: '[[0, 0], [0, 1], [0, 2]]',
          note: 'A single row touches both the top and the bottom edge, so every cell borders both oceans.',
        },
      ],
      signals: ['water flowing to "both" edges or oceans', 'flow goes to neighbors of lower or equal height', 'asked for every cell that can reach a border'],
      hints: [
        'Simulating the flow from every cell is slow. Can you think about it backwards, starting from the oceans?',
        'Water flows downhill to the ocean. In reverse, start at the ocean and walk **uphill**, to neighbors whose height is greater than or equal to the current one.',
        'DFS from all Pacific border cells into one set, and from all Atlantic border cells into another. Return the cells in both sets.',
      ],
      brute:
        'From each of the m·n cells, run a DFS downhill to see which oceans it can reach: **O((m·n)²)**.',
      insight:
        '**Reverse the flow.** Start from the border cells of each ocean and climb to neighbors that are **at least as high**. Every cell you reach can drain into that ocean. Do it once per ocean and keep the cells both searches reached.',
      mnemonic: 'Climb inward from each ocean; answer = cells both reach.',
      steps: [
        'Create one reachable set for each ocean.',
        'In dfs(r, c, seen, prev_height), stop off the grid, on a seen cell, or when the cell is lower than prev_height.',
        'Add the cell to the set and DFS into its four neighbors with its own height.',
        'Start Pacific searches from the top row and left column, Atlantic searches from the bottom row and right column.',
        'Return every cell that is in both sets.',
      ],
      solution: py`
class Solution:
    def pacificAtlantic(self, heights: List[List[int]]) -> List[List[int]]:
        #@ Grid size, and one set per ocean of the cells that can drain into it.
        rows, cols = len(heights), len(heights[0])
        pacific, atlantic = set(), set()

        #@ Walk UPHILL from the ocean. Stop off the grid or on a cell already reached.
        def dfs(r, c, seen, prev_height):
            if r < 0 or c < 0 or r >= rows or c >= cols or (r, c) in seen:
                return
            #@ Lower than the cell we came from: water could not flow from here to there.
            if heights[r][c] < prev_height:  #!
                return
            #@ Water here can reach this ocean. Keep climbing from this cell.
            seen.add((r, c))
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                dfs(nr, nc, seen, heights[r][c])

        #@ Pacific borders: top row and left column. Atlantic: bottom row and right column.
        for c in range(cols):
            dfs(0, c, pacific, heights[0][c])  #!
            dfs(rows - 1, c, atlantic, heights[rows - 1][c])
        for r in range(rows):
            dfs(r, 0, pacific, heights[r][0])
            dfs(r, cols - 1, atlantic, heights[r][cols - 1])

        #@ Cells reached from both oceans can drain into both: collect them and return the list.
        result = []
        for r in range(rows):
            for c in range(cols):
                if (r, c) in pacific and (r, c) in atlantic:  #!
                    result.append([r, c])
        return result`,
      time: 'O(m · n)',
      space: 'O(m · n)',
      complexityWhy:
        'Each of the two searches visits every cell at most once (the seen set stops repeats). The two sets and the recursion can each hold m·n cells.',
      pitfalls: [
        'Forgetting to reverse the comparison: walking inward from the ocean, the next cell must be **higher or equal**, not lower.',
        'Equal heights do let water flow, so the stop condition is `<`, not `<=`.',
        'Starting from only one edge per ocean. The Pacific needs both the top row and the left column; the Atlantic needs the bottom row and the right column.',
      ],
    },
    {
      id: 'surrounded-regions',
      num: 130,
      title: 'Surrounded Regions',
      difficulty: 'Medium',
      category: 'graphs',
      pattern: 'Border DFS, then flip',
      prompt:
        'A grid `board` holds `"X"` and `"O"`. A region of `"O"` cells connected up, down, left or right is **captured** if none of its cells is on the border of the grid. Change the board in place so that every captured region becomes `"X"`. Return nothing.',
      examples: [
        {
          input: 'board = [["X", "O", "X", "X"], ["X", "O", "X", "X"], ["X", "X", "O", "X"], ["X", "X", "X", "X"]]',
          output: '[["X", "O", "X", "X"], ["X", "O", "X", "X"], ["X", "X", "X", "X"], ["X", "X", "X", "X"]]',
          note: 'The O in row 1 survives because it connects to the border O above it. The lone O in row 2 is captured.',
        },
        { input: 'board = [["O", "O"], ["O", "O"]]', output: '[["O", "O"], ["O", "O"]]', note: 'Every O is on the border, so nothing is captured.' },
      ],
      signals: ['regions "surrounded" by X', 'touching the border decides the outcome', 'modify the board in place'],
      hints: [
        'Deciding "is this region surrounded?" from the inside is awkward. Which O cells are certainly safe?',
        'Any O on the border is safe, and so is every O connected to one. Find those first.',
        'DFS from every border O and temporarily mark those cells (say "T"). Then flip every remaining O to X, and turn every T back into O.',
      ],
      brute:
        'From every O cell, run a separate search to see whether its region reaches the border, then flip it if not: **O((m·n)²)**.',
      insight:
        '**Work from the border inward.** Mark every O you can reach from the border as safe. Any O left unmarked must be surrounded, so one final sweep flips it to X and restores the safe cells.',
      mnemonic: 'Save border-connected O, flip the rest, restore the saved.',
      steps: [
        'Write a DFS that turns an O and every O connected to it into "T".',
        'Run that DFS from every cell on the four borders.',
        'Sweep the board and flip every remaining O to X, because it is surrounded.',
        'In the same sweep, turn every T back into O.',
      ],
      solution: py`
class Solution:
    def solve(self, board: List[List[str]]) -> None:
        #@ Grid size, used for bounds checks.
        rows, cols = len(board), len(board[0])

        #@ Stop off the grid or on anything that is not an unmarked O.
        def dfs(r, c):
            if r < 0 or c < 0 or r >= rows or c >= cols or board[r][c] != "O":
                return
            #@ Mark it "T" (temporarily safe) and spread to the four neighbors.
            board[r][c] = "T"  #!
            dfs(r + 1, c)
            dfs(r - 1, c)
            dfs(r, c + 1)
            dfs(r, c - 1)

        #@ Only regions that touch the border are safe, so search from every border cell.
        for r in range(rows):
            for c in range(cols):
                if r in (0, rows - 1) or c in (0, cols - 1):  #!
                    dfs(r, c)

        #@ Final sweep: an unmarked O is surrounded; a T was safe all along.
        for r in range(rows):
            for c in range(cols):
                if board[r][c] == "O":
                    board[r][c] = "X"  #!
                elif board[r][c] == "T":
                    board[r][c] = "O"`,
      time: 'O(m · n)',
      space: 'O(m · n)',
      complexityWhy:
        'The border searches visit each cell at most once and the sweep touches each cell once. The recursion can be m·n deep in the worst case.',
      pitfalls: [
        'Flipping cells during the border search: finish marking every safe cell *before* flipping anything.',
        'Forgetting to turn the temporary "T" marks back into O.',
        'Starting only from the corners or from one edge: all four borders count.',
      ],
    },
    {
      id: 'course-schedule',
      num: 207,
      title: 'Course Schedule',
      difficulty: 'Medium',
      category: 'graphs',
      pattern: 'Cycle detection with three DFS states',
      prompt:
        'There are `numCourses` courses labeled `0` to `numCourses - 1`. Each pair `[a, b]` in `prerequisites` means you must take course `b` **before** course `a`. Return `True` if it is possible to finish every course, or `False` if the requirements go round in a circle.',
      examples: [
        { input: 'numCourses = 3, prerequisites = [[1, 0], [2, 1]]', output: 'True', note: 'Take 0, then 1, then 2.' },
        {
          input: 'numCourses = 3, prerequisites = [[0, 1], [1, 2], [2, 0]]',
          output: 'False',
          note: '0 needs 1, 1 needs 2 and 2 needs 0: a cycle.',
        },
      ],
      signals: ['"prerequisites" or "must take b before a"', '"is it possible to finish all…?"', 'dependencies between tasks form a directed graph', 'impossible exactly when there is a cycle'],
      hints: [
        'Draw each course as a node and each prerequisite as an arrow. When is it impossible to finish?',
        'It is impossible exactly when the arrows form a **cycle**. How can DFS spot a cycle in a directed graph?',
        'Give each course a state: 0 = unvisited, 1 = on the current DFS path, 2 = done. Reaching a course in state 1 means you looped back: a cycle.',
      ],
      brute:
        'For each course, follow every chain of prerequisites from scratch to see whether it leads back to that course: **O(V · (V + E))**. Remembering finished courses brings it down to O(V + E).',
      insight:
        'Every course can be finished **unless the prerequisite graph has a cycle**. A DFS with three states finds one: meeting a course that is still *on the current path* means you went in a circle. Courses marked *done* are known to be safe and are never explored again.',
      mnemonic: 'Back on a course still on the path? Cycle!',
      steps: [
        'Build a list of prerequisites for each course.',
        'Give every course a state: unvisited, on the path, or done.',
        'In the DFS, a course already on the path means a cycle; a done course is safe.',
        'Mark the course as on the path and DFS into each of its prerequisites.',
        'If none of them found a cycle, mark the course done.',
        'Run the DFS from every course; return False on any cycle, otherwise True.',
      ],
      solution: py`
class Solution:
    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:
        #@ Adjacency list: for each course, the courses it requires.
        needs = [[] for _ in range(numCourses)]
        for course, pre in prerequisites:
            needs[course].append(pre)
        #@ 0 = unvisited, 1 = on the current DFS path, 2 = finished and safe.
        state = [0] * numCourses

        #@ Returns True if a cycle can be reached from this course.
        def has_cycle(course):
            #@ Back on a course that is still on our path: we went in a circle.
            if state[course] == 1:  #!
                return True
            #@ Already fully checked earlier: no cycle through here.
            if state[course] == 2:
                return False
            #@ Put the course on the path and check every prerequisite.
            state[course] = 1  #!
            for pre in needs[course]:
                if has_cycle(pre):
                    return True
            #@ Every prerequisite is fine: take it off the path and mark it safe.
            state[course] = 2  #!
            return False

        #@ The graph may have several separate pieces, so check from every course: any cycle returns False, else True.
        for course in range(numCourses):
            if has_cycle(course):
                return False
        return True`,
      time: 'O(V + E)',
      space: 'O(V + E)',
      complexityWhy:
        'Each course is fully explored once (state 2 stops repeats) and each prerequisite pair is followed once. The adjacency list stores E pairs and the recursion can be V deep.',
      pitfalls: [
        'Using only visited/unvisited: a course reached twice through two different, non-circular routes would look like a cycle.',
        'Never marking courses done (state 2): the DFS re-explores them and can take exponential time.',
        'Only starting from course 0 misses cycles in other, unconnected parts of the graph.',
      ],
    },
    {
      id: 'course-schedule-ii',
      num: 210,
      title: 'Course Schedule II',
      difficulty: 'Medium',
      category: 'graphs',
      pattern: "Topological sort (Kahn's algorithm)",
      prompt:
        'Same setup as Course Schedule: `numCourses` courses and pairs `[a, b]` meaning take `b` before `a`. This time, return **an order** in which you can take every course. If several orders work, any one is fine; if it is impossible, return an empty list.',
      examples: [
        {
          input: 'numCourses = 4, prerequisites = [[0, 3], [1, 0], [2, 3]]',
          output: '[3, 0, 2, 1]',
          note: 'Course 3 needs nothing, so it comes first. [3, 2, 0, 1] would also be accepted.',
        },
        {
          input: 'numCourses = 3, prerequisites = [[1, 2], [2, 1]]',
          output: '[]',
          note: 'Courses 1 and 2 each wait for the other, so not every course can be taken.',
        },
      ],
      signals: ['"return the order" in which to take courses', 'prerequisites or dependencies', '"if it is impossible, return an empty array"', 'any valid order is accepted'],
      hints: [
        'Which courses can you take right now, on day one?',
        'Taking a course removes one requirement from every course that depends on it. Some of those may become free to take.',
        "Kahn's algorithm: count each course's prerequisites (its in-degree), queue the ones at 0, then repeatedly pop one into the order and lower the counts of its dependents. If the order is shorter than numCourses, there was a cycle.",
      ],
      brute:
        'Repeatedly scan all courses for one whose prerequisites are all taken: **O(V · (V + E))**. Keeping a count of remaining prerequisites per course removes the rescanning.',
      insight:
        "**Topological sort with Kahn's algorithm.** A course is ready when its number of untaken prerequisites (its in-degree) is 0. Take ready courses one by one; each one taken may make its dependents ready. Courses stuck on a cycle never reach 0.",
      mnemonic: 'Take what has zero prerequisites; unlock its dependents.',
      steps: [
        'Build a list of dependents for each course and count the prerequisites of every course.',
        'Queue every course with zero prerequisites.',
        'Pop a course and add it to the order.',
        'Lower the count of each of its dependents.',
        'Queue any dependent whose count drops to zero.',
        'Return the order if it contains every course, otherwise an empty list.',
      ],
      solution: py`
class Solution:
    def findOrder(self, numCourses: int, prerequisites: List[List[int]]) -> List[int]:
        #@ Edges go from a prerequisite to the course it unlocks; indegree counts prerequisites.
        unlocks = [[] for _ in range(numCourses)]
        indegree = [0] * numCourses
        for course, pre in prerequisites:
            unlocks[pre].append(course)
            indegree[course] += 1
        #@ Courses with no prerequisites can be taken right away.
        queue = collections.deque(c for c in range(numCourses) if indegree[c] == 0)  #!
        #@ Repeatedly take a ready course and add it to the order.
        order = []
        while queue:
            course = queue.popleft()
            order.append(course)
            #@ Each course it unlocks now has one fewer prerequisite left.
            for nxt in unlocks[course]:
                indegree[nxt] -= 1  #!
                #@ No prerequisites left: that course is ready to take.
                if indegree[nxt] == 0:
                    queue.append(nxt)
        #@ A cycle leaves some courses stuck, so the order would be too short.
        return order if len(order) == numCourses else []  #!`,
      time: 'O(V + E)',
      space: 'O(V + E)',
      complexityWhy:
        'Each course is queued and popped once, and each prerequisite pair lowers one count once. The adjacency list and the counts take O(V + E) space.',
      pitfalls: [
        'Reversing the edge direction: the pair `[a, b]` means b → a (taking b unlocks a).',
        'Returning a partial order when there is a cycle: check `len(order) == numCourses`.',
        'Courses that appear in no pair must still be in the order. Seeding the queue from every course handles them.',
      ],
    },
    {
      id: 'graph-valid-tree',
      num: 261,
      title: 'Graph Valid Tree',
      difficulty: 'Medium',
      category: 'graphs',
      premium: true,
      pattern: 'Edge count + connectivity check',
      prompt:
        'You get `n` nodes labeled `0` to `n - 1` and a list of undirected `edges`. Return `True` if these edges make a valid **tree**: everything is connected and there are **no cycles**. Otherwise return `False`.',
      examples: [
        { input: 'n = 4, edges = [[0, 1], [0, 2], [2, 3]]', output: 'True' },
        {
          input: 'n = 4, edges = [[0, 1], [1, 2], [2, 0]]',
          output: 'False',
          note: 'Three edges is the right count for 4 nodes, but 0, 1 and 2 form a cycle and node 3 is cut off.',
        },
      ],
      signals: ['"is this graph a valid tree?"', 'n nodes and a list of undirected edges', 'connected and no cycles'],
      hints: [
        'A tree with n nodes always has exactly how many edges?',
        'With exactly n − 1 edges, the graph is a tree if and only if it is connected. (A cycle would use up an edge, leaving some node cut off.)',
        'Check len(edges) == n − 1, then run a DFS or BFS from node 0 and make sure it reaches all n nodes.',
      ],
      brute:
        'For every edge, remove it and search to see whether its two ends are still connected (which would mean a cycle), then check connectivity separately: **O(E · (n + E))**.',
      insight:
        'A tree on n nodes has **exactly n − 1 edges** and is **connected**. Those two facts together already rule out cycles, so count the edges and do a single traversal from node 0.',
      mnemonic: 'Exactly n − 1 edges and everything reachable: a tree.',
      steps: [
        'If the number of edges is not n − 1, return False.',
        'Build an undirected adjacency list.',
        'Traverse from node 0 with a stack, recording every node seen.',
        'Push each neighbor that has not been seen yet.',
        'Return True only if all n nodes were seen.',
      ],
      solution: py`
class Solution:
    def validTree(self, n: int, edges: List[List[int]]) -> bool:
        #@ A tree on n nodes has exactly n - 1 edges. Any other count fails at once.
        if len(edges) != n - 1:  #!
            return False
        #@ Undirected adjacency list: add each edge in both directions.
        graph = [[] for _ in range(n)]
        for a, b in edges:
            graph[a].append(b)
            graph[b].append(a)
        #@ Iterative DFS from node 0, remembering every node we reach.
        seen = {0}
        stack = [0]
        while stack:
            node = stack.pop()
            #@ Push each neighbor we have not reached yet.
            for nb in graph[node]:
                if nb not in seen:
                    seen.add(nb)
                    stack.append(nb)
        #@ With n - 1 edges, reaching all n nodes means connected AND no cycle.
        return len(seen) == n  #!`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy:
        'After the edge check there are only n − 1 edges, so building the graph and the DFS both take O(n). The adjacency list, the seen set and the stack are all O(n).',
      pitfalls: [
        'Checking only the edge count: `[[0, 1], [1, 2], [2, 0]]` with n = 4 has the right count but contains a cycle.',
        'Checking only connectivity: extra edges create cycles while everything stays connected.',
        'Forgetting to add each edge in both directions for an undirected graph.',
        'A single node with no edges (n = 1) is a valid tree.',
      ],
    },
    {
      id: 'number-of-connected-components-in-an-undirected-graph',
      num: 323,
      title: 'Number of Connected Components in an Undirected Graph',
      difficulty: 'Medium',
      category: 'graphs',
      premium: true,
      pattern: 'Union-find',
      prompt:
        'There are `n` nodes labeled `0` to `n - 1` and a list of undirected `edges`. Return how many **connected components** the graph has: separate groups in which every node can reach every other node of the group.',
      examples: [
        {
          input: 'n = 6, edges = [[0, 1], [2, 3], [3, 4]]',
          output: '3',
          note: 'The groups are {0, 1}, {2, 3, 4} and {5}. Node 5 has no edges, so it is a group on its own.',
        },
        { input: 'n = 3, edges = [[0, 1], [1, 2], [2, 0]]', output: '1' },
      ],
      signals: ['"number of connected components" or groups', 'undirected edges given as a list', 'groups merge as edges are added'],
      hints: [
        'Start by assuming every node is its own group: n groups. What can one edge do to that number?',
        'An edge between two *different* groups merges them, so the count drops by 1. An edge inside one group changes nothing.',
        'Union-find: find(x) returns the leader of x. For each edge, if the two leaders differ, link one under the other and subtract 1 from the count.',
      ],
      brute:
        'For each pair of nodes, run a search to check whether they are connected, then group them: **O(n² · (n + E))**. One BFS or DFS per unvisited node already gets O(n + E); union-find is just as fast and also works when edges arrive one at a time.',
      insight:
        '**Union-find**: start with n separate groups. Every edge that joins two *different* groups merges them and lowers the count by one. Path compression keeps `find` close to O(1).',
      mnemonic: 'Start with n groups; each real merge subtracts one.',
      steps: [
        'Give every node itself as parent, so there are n groups.',
        'find(x) follows parents up to the group leader, compressing the path.',
        'For each edge, find the leaders of both ends.',
        'If the leaders differ, link one under the other and subtract one from the count.',
        'Return the count.',
      ],
      solution: py`
class Solution:
    def countComponents(self, n: int, edges: List[List[int]]) -> int:
        #@ Every node starts as the leader of its own group.
        parent = list(range(n))

        #@ Follow parent links up to the leader, pointing nodes closer to it as we go, then return the leader.
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]  #!
                x = parent[x]
            return x

        #@ n separate groups to begin with. Look up both leaders of each edge.
        components = n
        for a, b in edges:
            root_a, root_b = find(a), find(b)
            #@ Different leaders: this edge merges two groups into one. Return the count of groups left.
            if root_a != root_b:  #!
                parent[root_a] = root_b
                components -= 1  #!
        return components`,
      time: 'O(n + E · log n)',
      space: 'O(n)',
      complexityWhy:
        'Each edge does two finds. With path compression a find costs O(log n) at worst on average, and in practice it is almost constant. The parent list holds n entries.',
      pitfalls: [
        'Linking `parent[a] = b` instead of linking the **leaders** `parent[root_a] = root_b` can break existing groups apart.',
        'Lowering the count for every edge: only edges that join two different groups reduce it.',
        'Nodes with no edges are components too. Starting the count at n covers them.',
      ],
    },
    {
      id: 'redundant-connection',
      num: 684,
      title: 'Redundant Connection',
      difficulty: 'Medium',
      category: 'graphs',
      pattern: 'Union-find cycle detection',
      prompt:
        'A tree with nodes `1` to `n` had **one extra edge** added, so the graph now contains exactly one cycle. Given the `edges` in order, return an edge you can remove so the rest is a tree again. If several edges would work, return the one that appears **last** in the list.',
      examples: [
        {
          input: 'edges = [[1, 2], [2, 3], [3, 4], [2, 4]]',
          output: '[2, 4]',
          note: '2, 3 and 4 are already joined by a path, so the edge 2–4 closes a loop.',
        },
        {
          input: 'edges = [[1, 3], [3, 2], [2, 1], [1, 4]]',
          output: '[2, 1]',
          note: 'The cycle is 1–3–2–1, and [2, 1] is the last of its edges in the list.',
        },
      ],
      signals: ['"a tree with one extra edge"', 'find the edge that creates a cycle', 'edges given in order; "return the last one"'],
      hints: [
        'Add the edges one at a time. At what moment does a cycle appear?',
        'An edge closes a cycle exactly when its two ends are **already connected** before you add it.',
        'Union-find: for each edge, if find(a) == find(b), return it; otherwise union the two groups.',
      ],
      brute:
        'Try removing each edge, starting from the last, and check with a DFS whether what remains is a connected tree: **O(n²)**.',
      insight:
        '**Union-find** while adding the edges in order. The first edge whose two ends already share a leader closes the cycle, and because the cycle\'s other edges all came earlier, it is also the last cycle edge in the list.',
      mnemonic: 'Already in the same group? That edge closes the cycle.',
      steps: [
        'Give each node from 1 to n itself as parent.',
        'find(x) climbs to the group leader, compressing the path.',
        'For each edge in order, find the leaders of both ends.',
        'If they share a leader, return this edge.',
        'Otherwise link the two leaders together.',
      ],
      solution: py`
class Solution:
    def findRedundantConnection(self, edges: List[List[int]]) -> List[int]:
        #@ Nodes are numbered 1 to n, and a tree plus one edge has n edges.
        parent = list(range(len(edges) + 1))

        #@ Find the leader of the group x belongs to, compressing the path as we climb, and return it.
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        #@ Add the edges in order, looking up both leaders first.
        for a, b in edges:
            root_a, root_b = find(a), find(b)
            #@ Already connected? Then this edge closes the cycle.
            if root_a == root_b:  #!
                return [a, b]
            #@ Otherwise merge the two groups.
            parent[root_a] = root_b  #!`,
      time: 'O(n log n)',
      space: 'O(n)',
      complexityWhy:
        'Each of the n edges does two finds, and path compression keeps them cheap (O(log n) at worst on average, nearly constant in practice). The parent list holds n + 1 entries.',
      pitfalls: [
        'Nodes start at 1, so the parent list needs `n + 1` slots.',
        'Comparing `a` and `b` themselves instead of their leaders `find(a)` and `find(b)`.',
        'Merging first and checking afterwards: then every edge looks "already connected".',
      ],
    },
    {
      id: 'word-ladder',
      num: 127,
      title: 'Word Ladder',
      difficulty: 'Hard',
      category: 'graphs',
      pattern: 'BFS with wildcard pattern buckets',
      prompt:
        'You get a `beginWord`, an `endWord` and a dictionary `wordList`. A **ladder** changes **one letter at a time**, and every word after `beginWord` must be in `wordList`. Return the **number of words** in the shortest ladder from `beginWord` to `endWord` (counting both ends), or `0` if there is no ladder.',
      examples: [
        {
          input: 'beginWord = "cold", endWord = "warm", wordList = ["cord", "card", "ward", "warm", "worm"]',
          output: '5',
          note: 'cold → cord → card → ward → warm.',
        },
        {
          input: 'beginWord = "pin", endWord = "pot", wordList = ["pit", "pat"]',
          output: '0',
          note: '"pot" is not in the word list, so no ladder can end there.',
        },
      ],
      signals: ['"shortest transformation sequence"', 'change one letter at a time', 'every step must be a word from a dictionary', 'fewest steps, so BFS'],
      hints: [
        'Treat each word as a node, with an edge between words that differ in exactly one letter. What is the question now?',
        'Shortest path with equal-cost steps means BFS. The slow part is finding neighbors: comparing every pair of words costs O(n² · L).',
        'Group words by wildcard patterns: `hot` belongs to `*ot`, `h*t` and `ho*`. Two words are neighbors exactly when they share a pattern.',
      ],
      brute:
        'Compare every pair of words to find the ones that differ by one letter, then BFS. Building that graph is **O(n² · L)**, too slow for thousands of words.',
      insight:
        'BFS from `beginWord`, because each BFS level adds one more word to the ladder. Find neighbors quickly with **wildcard patterns**: words that share a pattern such as `h*t` differ only in that one position.',
      mnemonic: 'Bucket words by wildcard; BFS until you reach the end word.',
      steps: [
        'Return 0 if endWord is not in the word list.',
        'Put every word into a bucket for each of its wildcard patterns.',
        'Start a BFS queue with (beginWord, 1) and mark beginWord visited.',
        'Pop a word; if it is endWord, return its ladder length.',
        'For each wildcard pattern of the word, queue every unvisited word in that bucket with length + 1.',
        'If the queue runs out, return 0.',
      ],
      solution: py`
class Solution:
    def ladderLength(self, beginWord: str, endWord: str, wordList: List[str]) -> int:
        #@ If the target is not in the dictionary, no ladder can end on it.
        if endWord not in wordList:
            return 0
        #@ Bucket each word under its wildcard patterns: one letter swapped for a star.
        buckets = collections.defaultdict(list)
        for word in wordList:
            for i in range(len(word)):
                buckets[word[:i] + "*" + word[i + 1:]].append(word)  #!
        #@ BFS from the start word. Each queue entry carries its ladder length.
        visited = {beginWord}
        queue = collections.deque([(beginWord, 1)])
        while queue:
            word, length = queue.popleft()
            #@ BFS reaches the end word first along a shortest ladder.
            if word == endWord:  #!
                return length
            #@ Neighbors are the words sharing one of this word's patterns.
            for i in range(len(word)):
                for nxt in buckets[word[:i] + "*" + word[i + 1:]]:
                    #@ Mark words when queuing them, so none enters the queue twice.
                    if nxt not in visited:
                        visited.add(nxt)  #!
                        queue.append((nxt, length + 1))
        #@ The queue ran out without reaching the end word.
        return 0`,
      time: 'O(n · L²)',
      space: 'O(n · L²)',
      complexityWhy:
        'Each of the n words has L patterns, and building a pattern string costs O(L). A bucket holds at most 26 words, so the BFS does the same order of work. The buckets store n·L patterns of length L.',
      pitfalls: [
        'Using DFS: it finds *a* ladder, not necessarily the shortest one.',
        'The answer counts **words**, not changes: a one-step ladder such as `cat → cot` has length 2.',
        'Marking words visited only when popped lets the same word be queued many times.',
        'Forgetting the early `return 0` when `endWord` is missing from `wordList`.',
      ],
    },
  ],
};

export default content;
