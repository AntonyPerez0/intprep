import { py, type CategoryContent } from '../types';

const content: CategoryContent = {
  guide: {
    category: 'advanced-graphs',
    summary: `In the Graphs unit every edge was equal, so BFS found shortest paths just by counting hops. Real maps have **weighted** edges: one road takes 5 minutes, another takes 40. Counting hops stops working, because two cheap edges can beat one expensive edge.

**Dijkstra's algorithm** is the workhorse. Keep a **min-heap** of \`(distance so far, node)\`. Pop the closest node: the first time a node is popped, its distance is final. Then push each neighbor with \`distance + edge weight\`. It is BFS where the queue is swapped for a heap that always serves the nearest node next.

A few cousins reuse the same ideas:
- **Prim's MST**: the same heap loop, but you push only the edge weight. It connects every node as cheaply as possible.
- **Bellman-Ford**: relax every edge, round after round. Slower, but it handles negative weights and "at most k edges" limits.
- **Topological sort**: order nodes so every edge points forward (you met it in Course Schedule).
- **Hierholzer's algorithm**: walk a path that uses every edge exactly once.`,
    analogy:
      'Dijkstra is water poured into a network of pipes. It reaches the nearest junctions first and spreads outward in order of distance, so the first moment water arrives at a junction is the fastest way to get there.',
    whenToUse: [
      'Edges have **weights** (time, cost, distance) and you want the cheapest or fastest path → **Dijkstra**',
      '"How long until every node is reached?" from one source with non-negative weights → Dijkstra, then take the max',
      'A path costs its **highest** edge or cell instead of a sum → Dijkstra still works; combine with `max` instead of `+`',
      '"Connect all points with minimum total cost" → **minimum spanning tree** (Prim or Kruskal)',
      '"At most k stops / edges", or negative weights → **Bellman-Ford** for a fixed number of rounds',
      '"Find an order that respects these before/after rules" → **topological sort**',
      '"Use every ticket / edge exactly once" → **Hierholzer** (Euler path)',
    ],
    template: py`
import heapq
import collections

def dijkstra(edges, start):
    # Adjacency list: node -> [(neighbor, weight), ...]
    graph = collections.defaultdict(list)
    for u, v, w in edges:
        graph[u].append((v, w))

    dist = {}                    # node -> FINAL shortest distance
    heap = [(0, start)]          # (distance so far, node)
    while heap:
        d, node = heapq.heappop(heap)      # closest unfinished node
        if node in dist:                   # stale copy: already finalized
            continue
        dist[node] = d                     # first pop = shortest distance
        for nxt, w in graph[node]:
            if nxt not in dist:
                heapq.heappush(heap, (d + w, nxt))
    return dist`,
    templateNotes: [
      'The heap compares tuples by their first item, so `(distance, node)` always pops the **closest** node. Put the distance first!',
      'A node can sit in the heap several times with different distances. The `if node in dist: continue` check skips the stale, longer copies. This is called **lazy deletion**.',
      'Dijkstra needs **non-negative** weights. With a negative edge, a node that was already popped could later get cheaper, which breaks the "first pop is final" rule.',
      "**Prim's MST** is the same loop: push `(w, nxt)` instead of `(d + w, nxt)` and add each popped weight to a running total.",
      '**Bellman-Ford**: repeat "for every edge u → v, try `dist[u] + w`" for n − 1 rounds (or k + 1 rounds for "at most k stops"). **Topological sort**: DFS, add each node after all its neighbors (post-order), then reverse.',
    ],
    complexity: 'Dijkstra and Prim: O(E log V) time, O(V + E) space. Bellman-Ford: O(V · E) time.',
    quiz: [
      {
        q: 'Why does Dijkstra use a **min-heap** instead of a plain queue?',
        options: [
          'To always expand the node with the smallest total distance so far',
          'To visit nodes in alphabetical order',
          'Because heaps use less memory than queues',
          'To detect cycles',
        ],
        answer: 0,
        explain:
          'With weighted edges, the node that is fewest hops away is not always the closest. The heap always hands you the cheapest node next.',
      },
      {
        q: 'In Dijkstra, when is the shortest distance to a node final?',
        options: [
          'The first time it is pushed onto the heap',
          'The first time it is popped from the heap',
          'After every edge has been processed once',
          'When all of its neighbors have been visited',
        ],
        answer: 1,
        explain:
          'Nodes come off the heap in order of distance. Any other route would have to pass through a node that is at least as far away, so it cannot be shorter (with non-negative weights).',
      },
      {
        q: 'A problem asks for the cheapest route using **at most k** flights. Which tool fits best?',
        options: ['Plain BFS', 'Unmodified Dijkstra', 'Bellman-Ford for k + 1 rounds', 'Topological sort'],
        answer: 2,
        explain:
          'Each Bellman-Ford round extends routes by one more edge, so k + 1 rounds give the cheapest price using at most k + 1 flights.',
      },
      {
        q: "What is the key change that turns the Dijkstra template into **Prim's** minimum spanning tree?",
        options: [
          'Use a max-heap',
          'Push the edge weight `w` instead of `d + w`',
          'Sort the nodes first',
          'Remove the visited check',
        ],
        answer: 1,
        explain:
          'Prim cares about the cost of the single edge that attaches a new node to the tree, not the total length of a path from the start.',
      },
    ],
  },

  problems: [
    {
      id: 'network-delay-time',
      num: 743,
      title: 'Network Delay Time',
      difficulty: 'Medium',
      category: 'advanced-graphs',
      pattern: 'Dijkstra shortest paths (min-heap)',
      prompt:
        'There are `n` computers labeled `1` to `n`. Each `times[i] = [u, v, w]` means a signal sent from `u` reaches `v` after `w` time units (one way only). A signal starts at computer `k`. Return how long it takes until **every** computer has received it, or `-1` if some computer never does.',
      examples: [
        {
          input: 'times = [[1, 2, 4], [1, 3, 1], [3, 2, 2], [2, 4, 1]], n = 4, k = 1',
          output: '4',
          note: 'Fastest arrivals: node 3 at 1, node 2 at 3 (via 3), node 4 at 4. The last one is 4.',
        },
        {
          input: 'times = [[1, 2, 5]], n = 3, k = 1',
          output: '-1',
          note: 'No edge ever reaches computer 3.',
        },
      ],
      signals: [
        'weighted, directed edges (travel times)',
        '"how long until all nodes receive it" = the slowest of the fastest arrivals',
        'one starting node and non-negative weights',
      ],
      hints: [
        'Each computer receives the signal along its *fastest* route. What does "everyone has it" mean in terms of those fastest times?',
        'You need the shortest time from `k` to every node, then the largest of those times.',
        'Run Dijkstra from `k` with a min-heap of `(time, node)`. Answer = max finalized time, or -1 if some node was never reached.',
      ],
      brute:
        'Explore every possible path with DFS and keep the smallest time to each node. The number of paths can be exponential. Bellman-Ford (relax every edge n − 1 times) works in **O(n · E)**, but Dijkstra is faster.',
      insight:
        'The answer is the **largest** of the shortest arrival times from `k`. Dijkstra finds all of them by always expanding the computer the signal reaches soonest.',
      mnemonic: 'Dijkstra from k; the slowest of the fastest wins.',
      steps: [
        'Build an adjacency list of (neighbor, time) pairs from the edge list.',
        'Push (0, k) onto a min-heap.',
        'Pop the smallest time; skip the node if it is already finalized.',
        'Record that time as the final arrival time for the node.',
        'Push each unfinished neighbor with the current time plus the edge time.',
        'Return the largest arrival time if all n nodes were reached, otherwise -1.',
      ],
      solution: py`
class Solution:
    def networkDelayTime(self, times: List[List[int]], n: int, k: int) -> int:
        #@ Adjacency list: node -> list of (neighbor, travel time).
        graph = collections.defaultdict(list)
        for u, v, w in times:
            graph[u].append((v, w))
        #@ Min-heap of (arrival time, node). The signal starts at k at time 0.
        heap = [(0, k)]
        arrival = {}
        #@ Pop the node the signal reaches soonest. Already finalized? This is a stale copy, so skip it.
        while heap:
            time, node = heapq.heappop(heap)  #!
            if node in arrival:
                continue
            #@ The first pop is the fastest arrival for this node. Lock it in.
            arrival[node] = time  #!
            #@ Offer every unfinished neighbor a route through this node.
            for nxt, w in graph[node]:
                if nxt not in arrival:
                    heapq.heappush(heap, (time + w, nxt))  #!
        #@ If all n nodes were reached, the last one to hear the signal sets the answer.
        return max(arrival.values()) if len(arrival) == n else -1`,
      time: 'O(E log E)',
      space: 'O(V + E)',
      complexityWhy:
        'Each edge can push one heap entry, and every push or pop costs O(log E). The graph and the heap hold up to V + E items.',
      pitfalls: [
        'Nodes are labeled **1 to n**, not 0 to n − 1. A dict avoids off-by-one sizing bugs.',
        'Without the `if node in arrival: continue` check, a node can be processed again with a worse time.',
        'Return the **max** of the shortest times, not their sum: the signal travels to all computers in parallel.',
        'Check `len(arrival) == n` before taking the max; an unreachable computer means -1.',
      ],
    },
    {
      id: 'reconstruct-itinerary',
      num: 332,
      title: 'Reconstruct Itinerary',
      difficulty: 'Hard',
      category: 'advanced-graphs',
      pattern: "Hierholzer's Euler path (post-order DFS)",
      alsoAccept: ['graphs'],
      prompt:
        'You get a list of airline `tickets`, each `[from, to]`. The trip starts at `"JFK"` and must use **every ticket exactly once**. If several trips work, return the one that comes first in alphabetical order (compare the airport lists word by word). At least one valid trip is guaranteed.',
      examples: [
        {
          input: 'tickets = [["JFK", "BOS"], ["BOS", "JFK"], ["JFK", "ATL"]]',
          output: '["JFK", "BOS", "JFK", "ATL"]',
          note: 'Flying to ATL first is alphabetically smaller, but ATL is a dead end and two tickets would be left unused.',
        },
        {
          input: 'tickets = [["JFK", "SEA"], ["SEA", "JFK"], ["JFK", "DEN"], ["DEN", "SEA"]]',
          output: '["JFK", "DEN", "SEA", "JFK", "SEA"]',
        },
      ],
      signals: [
        '"use every ticket / edge exactly once" (an Euler path)',
        'directed edges between named nodes',
        '"smallest lexical order" among all valid answers',
      ],
      hints: [
        'Always taking the alphabetically smallest ticket can strand you at a dead end too early. What if dead ends were simply placed at the *end* of the trip?',
        'Do a DFS that keeps using tickets. Add an airport to the answer only after all its outgoing tickets are used up (post-order).',
        'Sort the tickets so the smallest destination is tried first, record airports in post-order, then reverse the list.',
      ],
      brute:
        'Backtracking: try destinations in sorted order, undo a ticket when you get stuck, and stop at the first route that uses every ticket. Correct, but it can re-explore large parts of the graph: **exponential** in the worst case.',
      insight:
        "This is an **Euler path**. In Hierholzer's algorithm an airport is written down only when it has no tickets left, so any dead end automatically lands at the end of the trip. Reversing that post-order gives the itinerary.",
      mnemonic: 'Smallest ticket first, write on the way back, then reverse.',
      steps: [
        'Build an adjacency list where each list of destinations pops the smallest first.',
        'Start a DFS at "JFK".',
        'While the current airport has unused tickets, remove the smallest one and DFS into its destination.',
        'When an airport has no tickets left, append it to the route.',
        'Reverse the route to get the itinerary.',
      ],
      solution: py`
class Solution:
    def findItinerary(self, tickets: List[List[str]]) -> List[str]:
        #@ Sort tickets in reverse, so popping from the END of each list gives the smallest destination.
        graph = collections.defaultdict(list)
        for src, dst in sorted(tickets, reverse=True):
            graph[src].append(dst)  #!
        route = []
        #@ DFS: keep using up the smallest unused ticket out of this airport.
        def dfs(airport):
            while graph[airport]:
                dfs(graph[airport].pop())  #!
            #@ No tickets left here, so this airport is finished: record it in post-order.
            route.append(airport)  #!
        #@ The trip always starts at JFK.
        dfs("JFK")
        #@ Post-order wrote the trip backwards, so reverse it.
        return route[::-1]  #!`,
      time: 'O(E log E)',
      space: 'O(E)',
      complexityWhy:
        'Sorting the E tickets costs O(E log E); the DFS then uses each ticket exactly once. The graph, the route and the recursion stack hold O(E) items.',
      pitfalls: [
        'Appending the airport **before** exploring (pre-order) gives a wrong trip when there is a dead end. It must be post-order.',
        'Forgetting to **reverse** at the end: post-order builds the trip backwards.',
        '`pop(0)` from the front of a list is O(n). Sorting in reverse and popping from the end is O(1).',
        'The same flight can appear twice, so store destinations in a list, not a set.',
      ],
    },
    {
      id: 'min-cost-to-connect-all-points',
      num: 1584,
      title: 'Min Cost to Connect All Points',
      difficulty: 'Medium',
      category: 'advanced-graphs',
      pattern: "Prim's minimum spanning tree (min-heap)",
      prompt:
        'You get a list of `points` on a 2-D grid. Linking two points costs their **Manhattan distance**: `|x1 - x2| + |y1 - y2|`. Return the minimum total cost to link the points so that every point can reach every other one (directly or through other points).',
      examples: [
        {
          input: 'points = [[0, 0], [1, 1], [4, 1], [4, 5]]',
          output: '9',
          note: 'Link (0,0)–(1,1) for 2, (1,1)–(4,1) for 3 and (4,1)–(4,5) for 4.',
        },
        { input: 'points = [[2, 3]]', output: '0', note: 'A single point is already connected.' },
      ],
      signals: [
        '"connect all points / nodes" with "minimum total cost"',
        'any point may link to any other (a complete graph)',
        'no cycles needed: exactly n − 1 links',
      ],
      hints: [
        'The cheapest network that connects everything never contains a cycle. What is that structure called?',
        'It is a **minimum spanning tree**. Grow a tree one point at a time, always adding the cheapest link to a new point.',
        "Prim's: a min-heap of (cost, point). Pop the cheapest point not yet in the tree, add its cost, then push links from it to every outside point.",
      ],
      brute:
        'Try every set of n − 1 links and keep the cheapest one that connects everything. The number of sets is astronomical. The real trick is recognizing that the answer is a **minimum spanning tree**.',
      insight:
        "The answer is a **minimum spanning tree**. Prim's algorithm grows the tree from one point and always attaches the outside point with the cheapest link: the same heap loop as Dijkstra, but pushing the single edge cost instead of a running total.",
      mnemonic: 'Grow one tree; always attach the cheapest outsider.',
      steps: [
        'Start a min-heap with (0, point 0) and an empty in-tree set.',
        'Pop the cheapest (cost, point) pair from the heap.',
        'If that point is already in the tree, skip it.',
        'Add the point to the tree and add its cost to the total.',
        'Push (distance, j) for every point j that is not in the tree yet.',
        'Stop once all n points are in the tree and return the total.',
      ],
      solution: py`
class Solution:
    def minCostConnectPoints(self, points: List[List[int]]) -> int:
        #@ Prim's: grow one tree from point 0. The heap holds (cost to attach, point).
        n = len(points)
        heap = [(0, 0)]
        in_tree = set()
        total = 0
        #@ Keep going until every point has joined the tree.
        while len(in_tree) < n:
            cost, i = heapq.heappop(heap)  #!
            #@ A stale entry: this point already joined through a cheaper link.
            if i in in_tree:
                continue
            #@ Attach the cheapest outside point and pay for its link.
            in_tree.add(i)
            total += cost  #!
            #@ Offer every outside point a link to the newcomer, priced by Manhattan distance.
            xi, yi = points[i]
            for j in range(n):
                if j not in in_tree:
                    dist = abs(xi - points[j][0]) + abs(yi - points[j][1])
                    heapq.heappush(heap, (dist, j))  #!
        #@ All points are connected; the total is the cheapest way to do it.
        return total`,
      time: 'O(n² log n)',
      space: 'O(n²)',
      complexityWhy:
        'Each of the n points pushes up to n links, so the heap sees O(n²) pushes at O(log n) each. The heap can hold O(n²) entries at once.',
      pitfalls: [
        'Pushing `total + dist` (Dijkstra style) instead of just `dist`. Prim cares about the single link, not a path length.',
        'Not skipping points that are already in the tree, which pays for some points twice.',
        'Dense-graph alternative without a heap: keep a `min_dist` list and scan it for the cheapest outsider each step, for **O(n²)** total time.',
        'Kruskal (sort all ~n²/2 edges, then Union-Find) also works; it is just more code here.',
      ],
    },
    {
      id: 'swim-in-rising-water',
      num: 778,
      title: 'Swim in Rising Water',
      difficulty: 'Hard',
      category: 'advanced-graphs',
      pattern: 'Dijkstra on the max height along a path',
      alsoAccept: ['binary-search'],
      prompt:
        'You get an `n x n` grid where `grid[r][c]` is the height of that cell (all heights are different, from 0 to n² − 1). At time `t` the water level is `t`, and you may swim between two side-by-side cells only if **both** are at most `t` high. Swimming takes no time. Return the earliest time you can get from the top-left cell to the bottom-right cell.',
      examples: [
        {
          input: 'grid = [[0, 4, 1], [6, 5, 2], [8, 7, 3]]',
          output: '4',
          note: 'Path 0 → 4 → 1 → 2 → 3 has highest cell 4, so at t = 4 the whole path is under water.',
        },
        {
          input: 'grid = [[3, 0], [1, 2]]',
          output: '3',
          note: 'You start on a cell of height 3, so you must wait until t = 3 whichever way you go.',
        },
      ],
      signals: [
        'the cost of a path is its **highest** cell, not the sum',
        '"earliest time" to get from one corner to the other',
        'a grid treated as a graph with 4-directional moves',
      ],
      hints: [
        'Pick any one path. At what time can you swim all of it? Think about its highest cell.',
        'You want the path whose highest cell is as low as possible. Dijkstra works when a path costs its max instead of its sum.',
        'Min-heap of (highest so far, r, c). Pop the lowest, push neighbors with `max(current, neighbor height)`, and return as soon as you pop the bottom-right cell.',
      ],
      brute:
        'Try every time t from 0 upward and run a BFS through cells of height ≤ t. That is **O(n⁴)**. Binary searching on t brings it down to O(n² log n) and is a fair alternative.',
      insight:
        'A path can be swum at time = its **highest** cell. Run Dijkstra where a path costs the `max` of its heights: always extend the path with the lowest peak, and the first time you pop the corner, that peak is the answer.',
      mnemonic: 'Lowest-peak path first; pop the corner and you are done.',
      steps: [
        'Push (grid[0][0], 0, 0) onto a min-heap and mark the start visited.',
        'Pop the cell whose path has the lowest peak so far.',
        'If it is the bottom-right cell, return that peak.',
        'Look at each in-bounds neighbor that has not been visited and mark it visited.',
        'Push the neighbor with the max of the current peak and its own height.',
      ],
      solution: py`
class Solution:
    def swimInWater(self, grid: List[List[int]]) -> int:
        #@ Min-heap of (highest height on the path so far, row, col). You must wait for the start cell too.
        n = len(grid)
        heap = [(grid[0][0], 0, 0)]
        visited = {(0, 0)}
        #@ Always extend the path whose highest cell is lowest.
        while heap:
            t, r, c = heapq.heappop(heap)  #!
            #@ The first time the corner is popped, t is the smallest possible wait.
            if r == n - 1 and c == n - 1:
                return t  #!
            #@ Try the four neighbors that are inside the grid and not visited yet.
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < n and 0 <= nc < n and (nr, nc) not in visited:
                    #@ The new path's cost is its highest cell: max, not sum.
                    visited.add((nr, nc))
                    heapq.heappush(heap, (max(t, grid[nr][nc]), nr, nc))  #!`,
      time: 'O(n² log n)',
      space: 'O(n²)',
      complexityWhy:
        'Each of the n² cells is pushed once, and each heap operation costs O(log n²) = O(log n). The heap and the visited set hold up to n² cells.',
      pitfalls: [
        'Starting the heap at time 0 instead of `grid[0][0]`: you have to wait for your starting cell too.',
        'Adding heights (`t + grid[nr][nc]`) instead of taking the `max`. Only the highest cell on the path matters.',
        'Not tracking visited cells, so the same cell is pushed again and again.',
      ],
    },
    {
      id: 'alien-dictionary',
      num: 269,
      title: 'Alien Dictionary',
      difficulty: 'Hard',
      category: 'advanced-graphs',
      premium: true,
      pattern: 'Topological sort (DFS post-order with cycle check)',
      alsoAccept: ['graphs'],
      prompt:
        'An alien language uses lowercase English letters, but in an unknown order. You get a list of `words` that is already **sorted** in the alien order. Return a string with every letter that appears, in an order that fits the list. If no order fits, return `""`. If several orders fit, any one is fine.',
      examples: [
        {
          input: 'words = ["ba", "bc", "ac", "cb"]',
          output: '"bac"',
          note: '"ba" before "bc" means a comes before c; "bc" before "ac" means b comes before a.',
        },
        {
          input: 'words = ["ab", "ba", "aa"]',
          output: '""',
          note: 'The first pair says a before b, the second says b before a: a cycle.',
        },
        {
          input: 'words = ["abc", "ab"]',
          output: '""',
          note: 'A word can never come before its own prefix.',
        },
      ],
      signals: [
        '"sorted in an unknown order": recover the order',
        'pairwise before/after rules between letters',
        'return "" if impossible: detect a cycle',
      ],
      hints: [
        'Compare two neighboring words in the list. Which single position tells you something about the letter order?',
        'The first position where they differ gives one rule: the letter in word 1 comes before the letter in word 2. The rules form a directed graph.',
        'Topologically sort that graph (DFS post-order, then reverse). A cycle, or a longer word sitting before its own prefix, means return "".',
      ],
      brute:
        'Try every ordering of the distinct letters and check whether it sorts the words correctly: up to **26!** orderings. Hopeless.',
      insight:
        'Each pair of neighboring words gives at most one rule, from the **first letters that differ**. The rules form a directed graph, and any **topological order** of that graph is a valid alphabet.',
      mnemonic: 'First difference makes an edge; topo-sort the letters.',
      steps: [
        'Create a graph node for every letter that appears in any word.',
        'For each pair of neighboring words, return "" if the first is longer and starts with the second.',
        'Otherwise add an edge from the first differing letter of word 1 to the matching letter of word 2.',
        'DFS from each letter, marking it as on the path; meeting an on-the-path letter again means a cycle.',
        'After all its neighbors are explored, mark the letter done and append it.',
        'Reverse the appended letters and join them into the answer.',
      ],
      solution: py`
class Solution:
    def alienOrder(self, words: List[str]) -> str:
        #@ Every letter that appears is a node, even if no rule mentions it.
        graph = {ch: set() for word in words for ch in word}
        #@ Compare neighbors. A word before its own prefix (like "abc" before "ab") is impossible.
        for w1, w2 in zip(words, words[1:]):
            if len(w1) > len(w2) and w1.startswith(w2):
                return ""  #!
            #@ Only the FIRST differing letter tells us something: a comes before b.
            for a, b in zip(w1, w2):
                if a != b:
                    graph[a].add(b)  #!
                    break
        #@ A letter is unseen, on the current DFS path (visiting), or finished (done).
        visiting, done = set(), set()
        order = []
        #@ DFS returns True if it finds a cycle: a letter that is already on the current path.
        def has_cycle(ch):
            if ch in visiting:
                return True  #!
            if ch in done:
                return False
            visiting.add(ch)
            #@ Explore every letter that must come after ch.
            for nxt in graph[ch]:
                if has_cycle(nxt):
                    return True
            #@ Everything after ch is handled, so ch is finished. Record it in post-order.
            visiting.remove(ch)
            done.add(ch)
            order.append(ch)  #!
            return False
        #@ Start a DFS from every letter; any cycle means there is no valid alphabet.
        for ch in graph:
            if has_cycle(ch):
                return ""
        #@ Post-order lists each letter after the letters that follow it, so reverse.
        return "".join(reversed(order))`,
      time: 'O(C)',
      space: 'O(1)',
      complexityWhy:
        'Comparing neighboring words touches each of the C total characters a constant number of times. The graph has at most 26 nodes and 26² edges, so its size is constant.',
      pitfalls: [
        'Only the **first** differing letter tells you anything. Letters after it say nothing, so `break` right after adding the edge.',
        'Forgetting the prefix case: `["abc", "ab"]` is invalid even though no letters differ.',
        'Letters that never appear in a rule still belong in the answer, so create a node for every letter first.',
        'You need three states (unseen / on the path / done). With only one visited set you cannot tell a cycle apart from reaching a letter that is already finished.',
      ],
    },
    {
      id: 'cheapest-flights-within-k-stops',
      num: 787,
      title: 'Cheapest Flights Within K Stops',
      difficulty: 'Medium',
      category: 'advanced-graphs',
      pattern: 'Bellman-Ford limited to k + 1 rounds',
      prompt:
        'There are `n` cities and a list of `flights`, where `[from, to, price]` is a one-way flight. Find the cheapest price from `src` to `dst` using **at most `k` stops** in between (so at most `k + 1` flights). Return `-1` if there is no such route.',
      examples: [
        {
          input:
            'n = 4, flights = [[0, 1, 50], [1, 2, 50], [2, 3, 50], [0, 3, 400], [1, 3, 200]], src = 0, dst = 3, k = 1',
          output: '250',
          note: '0 → 1 → 3 costs 250. The cheaper 0 → 1 → 2 → 3 (150) needs 2 stops.',
        },
        {
          input:
            'n = 4, flights = [[0, 1, 50], [1, 2, 50], [2, 3, 50], [0, 3, 400], [1, 3, 200]], src = 0, dst = 3, k = 2',
          output: '150',
          note: 'With 2 stops allowed, 0 → 1 → 2 → 3 is fine.',
        },
      ],
      signals: [
        '"at most k stops": a limit on the number of edges',
        'weighted, directed edges and a cheapest-price question',
        'small n, so O(k · E) is fast enough',
      ],
      hints: [
        'Plain Dijkstra finds the cheapest route, but it might use too many flights. What if you grew routes one flight at a time?',
        'Suppose you know the cheapest price to every city using at most i flights. How do you get the prices for at most i + 1 flights?',
        'Bellman-Ford for k + 1 rounds: each round, try every flight, reading from a **copy** of the previous prices so a route grows by only one flight per round.',
      ],
      brute:
        'DFS through every route with at most k + 1 flights and keep the cheapest. The number of routes grows roughly like n to the power k + 1: **exponential**.',
      insight:
        'Bellman-Ford naturally counts edges: after round i, `prices` holds the cheapest cost using at most i flights. Run exactly k + 1 rounds, and read each round from a **frozen copy** so no route sneaks in two flights in one round.',
      mnemonic: 'k + 1 rounds; relax every flight; read from the old copy.',
      steps: [
        'Set every price to infinity except src, which costs 0.',
        'Repeat k + 1 times, once per allowed flight.',
        'Copy the current prices into a new list for this round.',
        'For each flight u → v, if prices[u] plus the ticket beats the new price of v, update it.',
        'At the end of the round, replace prices with the updated copy.',
        'Return prices[dst], or -1 if it is still infinity.',
      ],
      solution: py`
class Solution:
    def findCheapestPrice(self, n: int, flights: List[List[int]], src: int, dst: int, k: int) -> int:
        #@ prices[city] = cheapest cost found so far. Only the start city is free.
        prices = [float("inf")] * n
        prices[src] = 0
        #@ k stops means at most k + 1 flights, so run k + 1 rounds.
        for _ in range(k + 1):  #!
            #@ Write into a copy, so every route grows by only ONE flight this round.
            new_prices = prices[:]  #!
            #@ Relax: is flying u -> v cheaper than the best price for v so far?
            for u, v, cost in flights:
                if prices[u] + cost < new_prices[v]:
                    new_prices[v] = prices[u] + cost  #!
            #@ The round is done: its results are the starting prices for the next round.
            prices = new_prices
        #@ Still infinity means no route with at most k stops.
        return -1 if prices[dst] == float("inf") else prices[dst]`,
      time: 'O(k · E)',
      space: 'O(n)',
      complexityWhy:
        'Each of the k + 1 rounds scans all E flights once. We only keep two price lists of length n.',
      pitfalls: [
        'Updating `prices` in place lets a route take several flights in a single round, which breaks the stop limit. Always read from the previous round.',
        'k stops means **k + 1** flights. Running only k rounds is an off-by-one bug.',
        'Unmodified Dijkstra is wrong here: it can lock in a city through a cheap route that already used too many stops. A heap version must keep (cost, city, stops) in its state.',
      ],
    },
  ],
};

export default content;
