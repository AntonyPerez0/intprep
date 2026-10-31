import { py, type CategoryContent } from '../types';

const content: CategoryContent = {
  guide: {
    category: 'trees',
    summary: `A **binary tree** is a set of **nodes**. Each node holds a value (\`node.val\`) and links to at most two children, \`node.left\` and \`node.right\` — either one can be \`None\`. The top node is the **root**; nodes with no children are **leaves**. In a **binary search tree (BST)**, everything in a node's left subtree is smaller than it and everything in its right subtree is bigger.

Every child is itself the root of a smaller tree (a **subtree**). That makes trees perfect for **recursion**: a function that calls itself on a smaller input. Almost every tree problem follows one script: **solve it for the left child, solve it for the right child, combine the two answers at the root.** The **base case** is the empty tree (\`None\`), whose answer you simply know: height 0, sum 0, "valid".

The trick is to *trust* the recursion. When you write \`left = height(node.left)\`, do not trace the call in your head. Assume it already returns the right answer for that subtree, and only ask: *given my children's answers, what is mine?*

This is **depth-first search (DFS)**. Where you do the work names the order: **pre-order** (the node before its children — good for passing information *down*), **in-order** (left, node, right — sorted order in a BST) and **post-order** (children first — good when a node needs its children's answers, like a height). When a problem talks about **levels** or rows, switch to **breadth-first search (BFS)**: a queue that visits the tree one level at a time.`,
    analogy:
      'A tree is a company org chart. To count all the staff, the boss does not walk the building. She asks each of her two direct reports for their team size, adds the two numbers, and adds 1 for herself. Every manager does the same with their own reports, all the way down to people with no reports, who simply answer "just me: 1".',
    whenToUse: [
      'The input is a `root` / `TreeNode` → think **recursion**: handle `None`, solve left, solve right, combine',
      'You need a fact about the whole tree (height, size, balanced?) → **post-order DFS**: the children answer first, the node combines',
      'The best path can bend at any node (diameter, max path sum) → **return a height, update a global best** on the side',
      'A rule depends on the path from the root (allowed range, biggest value so far) → **pass it down as a parameter**',
      'It is a **BST** and you need sorted order or the kth value → **in-order** traversal',
      'The problem says *level*, *row*, or *what you see from one side* → **BFS with a queue**',
    ],
    template: py`
# DFS (recursion): solve left, solve right, combine at the root
def dfs(node):
    if not node:                   # base case: the empty tree
        return BASE_ANSWER         # e.g. 0 for a height, True for "valid?"
    # pre-order spot: work on node BEFORE its children
    left = dfs(node.left)          # trust it: the answer for the left subtree
    # in-order spot: between the children (sorted order in a BST)
    right = dfs(node.right)        # trust it: the answer for the right subtree
    # post-order spot: combine both answers at this node
    return combine(node.val, left, right)


# BFS (queue): visit the tree one level at a time
def bfs(root):
    if not root:
        return []
    levels = []
    queue = collections.deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):   # exactly the nodes on this level
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        levels.append(level)
    return levels`,
    templateNotes: [
      'Always handle `if not node` first. The empty tree is your base case, and it is what stops the recursion from reading `None.left`.',
      'Move the work to pick the order: before the two calls = **pre-order**, between them = **in-order**, after them = **post-order**.',
      'Need something from the path *above* (a bound, a running max)? Add a parameter and pass it down. Need a best answer across the *whole* tree (Diameter, Max Path Sum)? Keep `best` outside a nested helper, write `nonlocal best` inside, and let the helper **return** what the parent needs (like a height) while it **updates** `best` on the side.',
      '`for _ in range(len(queue))` freezes the size of the current level before its children are added, so each `while` pass handles exactly one level.',
      '`collections.deque` gives O(1) `popleft()`. `list.pop(0)` is O(n) and makes BFS slow.',
    ],
    complexity:
      'O(n) time: every node is visited once. Space is O(h) for DFS (the recursion stack, h = tree height: about log n if balanced, n if it is a chain) and O(w) for BFS (w = the widest level).',
    quiz: [
      {
        q: 'What should a recursive tree function check **first**?',
        options: [
          'Whether the node is a leaf',
          'Whether the node is `None` (the empty tree)',
          'Whether the tree is balanced',
          'Whether the root value is positive',
        ],
        answer: 1,
        explain:
          'The empty tree is the base case. Without it, the recursion keeps going and crashes on `None.left`.',
      },
      {
        q: 'Which DFS order visits the values of a **BST** in sorted order?',
        options: ['Pre-order', 'In-order', 'Post-order', 'Level order'],
        answer: 1,
        explain:
          'In-order goes left subtree, node, right subtree. In a BST that is: smaller values, this value, bigger values.',
      },
      {
        q: 'What does `walk(root)` print for `root = [2, 1, 3]`?',
        code: py`
def walk(node):
    if not node:
        return
    walk(node.left)
    walk(node.right)
    print(node.val)`,
        options: ['2 1 3', '1 2 3', '1 3 2', '3 1 2'],
        answer: 2,
        explain:
          'The print comes after both calls, so this is **post-order**: the left child 1, then the right child 3, then the root 2.',
      },
      {
        q: 'You must return the values grouped **row by row**, top to bottom. What is the natural tool?',
        options: ['In-order recursion', 'BFS with a queue', 'Sorting the values', 'A hash set'],
        answer: 1,
        explain:
          'BFS visits nodes level by level. Saving `len(queue)` at the start of each round tells you exactly how many nodes belong to the current row.',
      },
    ],
  },

  problems: [
    {
      id: 'invert-binary-tree',
      num: 226,
      title: 'Invert Binary Tree',
      difficulty: 'Easy',
      category: 'trees',
      pattern: 'Recursive DFS: swap the children',
      prompt:
        "Given the `root` of a binary tree, turn it into its **mirror image**: every node's left and right children trade places, all the way down. Return the root.",
      examples: [
        {
          input: 'root = [5, 2, 8, 1, 3]',
          output: '[5, 8, 2, null, null, 3, 1]',
          note: '2 and 8 swap sides, and so do 1 and 3 under node 2.',
        },
        { input: 'root = []', output: '[]' },
      ],
      signals: ['"mirror", "flip" or "invert" the tree', 'the same small change applied at every node', 'return the modified root'],
      hints: [
        'Picture just one node and its two children. What would "inverting" that tiny tree mean?',
        'After you swap the two children at the root, what still has to happen inside each child?',
        'Swap `root.left` and `root.right`, then invert both subtrees recursively. Base case: `None` returns `None`.',
      ],
      brute:
        'Every node has to be touched, so **O(n)** is already the best possible. A clumsy approach copies the values into a list and rebuilds a mirrored tree — still O(n), but far more code and an extra O(n) memory.',
      insight:
        'Mirroring a tree = swapping the two children of **every** node. Do the swap at the root and let recursion do exactly the same for each subtree.',
      mnemonic: 'Swap my kids, then ask each kid to swap theirs.',
      steps: [
        'If the node is None, return None.',
        "Swap the node's left and right children.",
        'Recursively invert the left subtree.',
        'Recursively invert the right subtree.',
        'Return the node.',
      ],
      solution: py`
class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        #@ Base case: an empty tree is already its own mirror.
        if not root:
            return None
        #@ Swap this node's two children in one step — the whole "mirror" move.
        root.left, root.right = root.right, root.left  #!
        #@ Trust the recursion to mirror each subtree the same way.
        self.invertTree(root.left)  #!
        self.invertTree(root.right)
        #@ Hand back the same root, now mirrored.
        return root`,
      time: 'O(n)',
      space: 'O(h)',
      complexityWhy:
        'Each node is visited once. The recursion stack is as deep as the tree height h: about log n for a balanced tree, up to n for a chain.',
      pitfalls: [
        'Swapping with two separate lines (`root.left = root.right`, then `root.right = root.left`) loses a child. Use the one-line tuple swap.',
        'Forgetting `return root` at the end — the caller gets `None` back.',
        'Missing the `None` base case crashes on `None.left`.',
      ],
    },
    {
      id: 'maximum-depth-of-binary-tree',
      num: 104,
      title: 'Maximum Depth of Binary Tree',
      difficulty: 'Easy',
      category: 'trees',
      pattern: 'Recursive DFS: 1 + max(left, right)',
      prompt:
        'Return the **maximum depth** of a binary tree: the number of nodes on the longest path from the root down to a leaf. An empty tree has depth 0.',
      examples: [
        {
          input: 'root = [6, 4, 9, null, null, 7, 12, null, 8]',
          output: '4',
          note: 'The longest path is 6 → 9 → 7 → 8.',
        },
        { input: 'root = []', output: '0' },
      ],
      signals: ['"depth" or "height" of the tree', 'longest root-to-leaf path', 'one number that summarizes the whole tree'],
      hints: [
        'If you already knew the depth of the left subtree and of the right subtree, how would you get the depth of the whole tree?',
        'Take the bigger of the two and add 1 for the root itself.',
        'Base case: `None` has depth 0. Otherwise return `1 + max(depth of left, depth of right)`.',
      ],
      brute:
        'Write down every root-to-leaf path and measure each one. Copying paths costs up to **O(n²)** for a chain-shaped tree, and you only ever needed the length of the longest.',
      insight:
        'A tree is exactly as deep as its **deeper subtree, plus 1** for the root. Recursion hands you both subtree depths.',
      mnemonic: 'One plus the deeper child.',
      steps: [
        'If the node is None, return 0.',
        'Recursively get the depth of the left subtree.',
        'Recursively get the depth of the right subtree.',
        'Return 1 plus the larger of the two depths.',
      ],
      solution: py`
class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        #@ Base case: an empty tree has depth 0.
        if not root:
            return 0
        #@ Trust the recursion: get the depth of each subtree.
        left = self.maxDepth(root.left)
        right = self.maxDepth(root.right)
        #@ Combine at the root: the deeper side, plus 1 for this node.
        return 1 + max(left, right)  #!`,
      time: 'O(n)',
      space: 'O(h)',
      complexityWhy:
        'Every node is visited once with O(1) work. The recursion stack holds one call per level, so it grows with the height h.',
      pitfalls: [
        'Returning 1 for `None` counts one level too many.',
        'Depth here counts **nodes**. Some problems (like Diameter) count **edges** — read carefully.',
        "A very deep, chain-shaped tree can hit Python's recursion limit; a BFS that counts levels avoids recursion entirely.",
      ],
    },
    {
      id: 'diameter-of-binary-tree',
      num: 543,
      title: 'Diameter of Binary Tree',
      difficulty: 'Easy',
      category: 'trees',
      pattern: 'Post-order height + global best',
      prompt:
        'The **diameter** of a binary tree is the number of **edges** on the longest path between any two nodes. That path does not have to pass through the root. Return the diameter.',
      examples: [
        {
          input: 'root = [8, 3, 9, 1, 6, null, null, null, null, 4]',
          output: '4',
          note: 'The path 4 → 6 → 3 → 8 → 9 has 4 edges.',
        },
        {
          input: 'root = [1, 2, null, 3, 4, 5, null, null, 6]',
          output: '4',
          note: 'The path 5 → 3 → 2 → 4 → 6 never touches the root.',
        },
      ],
      signals: [
        '"longest path between any two nodes"',
        'the path may or may not pass through the root',
        'length counted in edges',
      ],
      hints: [
        'Every path has one highest node where it "bends". If a path bends at node X, how long can it be?',
        'The longest path bending at X is (height of the left subtree) + (height of the right subtree).',
        'Write a height function. After getting both heights, update a `best` variable with `left + right`, then return `1 + max(left, right)`.',
      ],
      brute:
        'At every node, compute the heights of its two subtrees from scratch and add them. Each height call is O(n), so the total is **O(n²)**.',
      insight:
        'One post-order pass can do two jobs: **return the height** to the parent, and **update the best diameter** with `left + right` at each node.',
      mnemonic: 'Return the height, record left plus right.',
      steps: [
        'Keep a best variable that starts at 0.',
        'Write height(node), which returns 0 for None.',
        'Get the heights of the left and right subtrees.',
        'Update best with left height + right height.',
        'Return 1 + the larger height to the parent.',
        'Call height(root) and return best.',
      ],
      solution: py`
class Solution:
    def diameterOfBinaryTree(self, root: Optional[TreeNode]) -> int:
        #@ The longest path found so far, measured in edges.
        best = 0

        #@ height(node) = number of nodes on the longest downward path from node.
        def height(node):
            nonlocal best
            if not node:
                return 0
            #@ Post-order: get both children's heights first.
            left = height(node.left)
            right = height(node.right)
            #@ The longest path that bends at this node uses left + right edges.
            best = max(best, left + right)  #!
            #@ The parent can only extend ONE side, so pass up the taller one.
            return 1 + max(left, right)  #!

        #@ One pass from the root fills in best along the way.
        height(root)
        return best`,
      time: 'O(n)',
      space: 'O(h)',
      complexityWhy:
        'Each node is visited once with O(1) work. The recursion stack is as deep as the tree height h.',
      pitfalls: [
        'Assuming the longest path goes through the root — it can sit entirely inside one subtree.',
        'Returning `left + right` to the parent. A path cannot fork, so the parent only gets `1 + max(left, right)`.',
        'Forgetting `nonlocal best`: Python then treats `best` as a new local variable and raises an error.',
      ],
    },
    {
      id: 'balanced-binary-tree',
      num: 110,
      title: 'Balanced Binary Tree',
      difficulty: 'Easy',
      category: 'trees',
      pattern: 'Post-order height + balance check',
      prompt:
        'A binary tree is **height-balanced** if, at every node, the heights of the left and right subtrees differ by at most 1. Return `True` if the tree is height-balanced, otherwise `False`.',
      examples: [
        { input: 'root = [5, 3, 8, 1, null, null, 9]', output: 'True' },
        {
          input: 'root = [1, 2, 3, 4, null, null, 5, 6, null, null, 7]',
          output: 'False',
          note: 'At the root both sides have height 3, but node 2 has heights 2 (left) and 0 (right).',
        },
      ],
      signals: [
        '"balanced" / heights differ by at most 1',
        'the rule must hold at **every** node, not just the root',
        'needs the heights of subtrees',
      ],
      hints: [
        'To check one node you need the heights of both of its subtrees. Which order gives you the children before the parent?',
        'Calling a separate height function at every node repeats work. Could one height function do the checking too?',
        'Post-order height: after getting `left` and `right`, set a `balanced` flag to False if `abs(left - right) > 1`. Return `1 + max(left, right)`.',
      ],
      brute:
        'At every node, call a separate height function on both children and compare. Each call is O(n), so the total is **O(n²)** for a chain-shaped tree.',
      insight:
        'Same trick as Diameter: a post-order **height** function that also checks `abs(left - right) > 1` at every node, so the whole check is one pass.',
      mnemonic: 'Return the height; flag any gap bigger than one.',
      steps: [
        'Start with a balanced flag set to True.',
        'Write height(node), which returns 0 for None.',
        'Get the heights of both children.',
        'If the two heights differ by more than 1, set the flag to False.',
        'Return 1 + the larger height.',
        'Call height(root) and return the flag.',
      ],
      solution: py`
class Solution:
    def isBalanced(self, root: Optional[TreeNode]) -> bool:
        #@ Assume balanced until some node proves otherwise.
        balanced = True

        #@ height(node) returns the subtree's height; an empty tree has height 0.
        def height(node):
            nonlocal balanced
            if not node:
                return 0
            #@ Post-order: heights of both children first.
            left = height(node.left)
            right = height(node.right)
            #@ A gap bigger than 1 breaks the rule at this node.
            if abs(left - right) > 1:  #!
                balanced = False
            #@ Pass this node's height up to its parent.
            return 1 + max(left, right)  #!

        #@ One pass over the whole tree, then report the verdict.
        height(root)
        return balanced`,
      time: 'O(n)',
      space: 'O(h)',
      complexityWhy:
        'Each node is visited once and computes its height from its children in O(1). The recursion stack is as deep as the tree.',
      pitfalls: [
        'Checking only the root. Both sides of the root can have the same height while a node lower down is lopsided.',
        'Calling a separate `height()` inside a check at every node is O(n²) — do both jobs in one pass.',
        'Forgetting `nonlocal balanced` inside the helper.',
      ],
    },
    {
      id: 'same-tree',
      num: 100,
      title: 'Same Tree',
      difficulty: 'Easy',
      category: 'trees',
      pattern: 'Recursion on two trees at once',
      prompt:
        'Given the roots `p` and `q` of two binary trees, return `True` if they are **identical**: the same shape, with the same value in every matching position. Otherwise return `False`.',
      examples: [
        { input: 'p = [4, 1, 6], q = [4, 1, 6]', output: 'True' },
        {
          input: 'p = [7, 3, 9, 2], q = [7, 3, 9, null, 2]',
          output: 'False',
          note: 'Same values, but 2 is the left child of 3 in p and the right child of 3 in q.',
        },
      ],
      signals: ['compare two trees', '"same structure and same values"', 'a yes/no answer that must hold at every position'],
      hints: [
        'Are two empty trees the same? What about one empty tree and one non-empty tree?',
        'If both roots exist and hold the same value, what else must be true?',
        'Return True if both are None; False if only one is None or the values differ; otherwise compare the two left subtrees `and` the two right subtrees.',
      ],
      brute:
        'Turn both trees into lists (with a marker for every missing child) and compare the lists. That is **O(n)** too, but it builds two extra O(n) lists and takes more code than comparing directly.',
      insight:
        'Two trees are equal exactly when their **roots match**, their **left subtrees are equal**, and their **right subtrees are equal** — a definition that is already a recursion.',
      mnemonic: 'Roots match, lefts match, rights match.',
      steps: [
        'If both nodes are None, return True.',
        'If only one is None or their values differ, return False.',
        'Recursively compare the two left subtrees.',
        'Recursively compare the two right subtrees, returning True only if both comparisons are True.',
      ],
      solution: py`
class Solution:
    def isSameTree(self, p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:
        #@ Both empty: identical.
        if not p and not q:
            return True
        #@ Only one empty, or different values: not identical.
        if not p or not q or p.val != q.val:  #!
            return False
        #@ The roots match, so both left subtrees AND both right subtrees must match too.
        return self.isSameTree(p.left, q.left) and self.isSameTree(p.right, q.right)  #!`,
      time: 'O(n)',
      space: 'O(h)',
      complexityWhy:
        'Each pair of matching positions is compared once (n is the size of the smaller tree). The recursion stack is as deep as the tree.',
      pitfalls: [
        'Reading `p.val` before checking that `p` is not `None` crashes with an AttributeError.',
        'Comparing only a list of values (say, in-order) is not enough: different shapes can give the same sequence.',
      ],
    },
    {
      id: 'subtree-of-another-tree',
      num: 572,
      title: 'Subtree of Another Tree',
      difficulty: 'Easy',
      category: 'trees',
      pattern: 'Same Tree check at every node',
      prompt:
        'Given two binary trees `root` and `subRoot`, return `True` if some node of `root` starts a subtree that is an **exact copy** of `subRoot` (same shape and values, including everything below it). Otherwise return `False`.',
      examples: [
        {
          input: 'root = [5, 2, 9, 1, 4], subRoot = [2, 1, 4]',
          output: 'True',
          note: 'Node 2 in root has exactly the children 1 and 4, and nothing more.',
        },
        {
          input: 'root = [5, 2, 9, 1, 4, null, null, null, null, 3], subRoot = [2, 1, 4]',
          output: 'False',
          note: 'Below node 4 there is an extra node 3, so the part under 2 is not an exact copy.',
        },
      ],
      signals: ['"subtree" of another tree', 'needs an exact match that starts at some node', 'you already know how to compare two trees'],
      hints: [
        'Suppose you had a function that says whether two trees are identical. How could you use it here?',
        'Any node of `root` could be the start of the match. Try each one.',
        'If `sameTree(root, subRoot)` is True, return True; otherwise search `root.left` `or` `root.right` recursively.',
      ],
      brute:
        'The expected solution already tries a Same Tree check at every node: **O(m·n)**. A fancier trick turns both trees into strings and uses fast string matching for O(m + n), but it is easy to get wrong (you need null markers and separators so `2` is not found inside `12`).',
      insight:
        '"Is `subRoot` inside `root`?" means "Is the tree **starting at some node** identical to `subRoot`?" Reuse Same Tree as a helper and try it at every node.',
      mnemonic: 'Same tree here? If not, search left or right.',
      steps: [
        'If subRoot is empty return True; if root is empty return False.',
        'If the tree starting at root is identical to subRoot, return True.',
        'Otherwise return whether subRoot appears in the left subtree or in the right subtree.',
        'The identical-check helper compares the roots, then both left subtrees, then both right subtrees.',
      ],
      solution: py`
class Solution:
    def isSubtree(self, root: Optional[TreeNode], subRoot: Optional[TreeNode]) -> bool:
        #@ An empty subRoot fits anywhere; an empty root cannot contain a real tree.
        if not subRoot:
            return True
        if not root:
            return False
        #@ Does the tree starting right here match subRoot exactly?
        if self.sameTree(root, subRoot):  #!
            return True
        #@ If not, the match may start anywhere in the left OR the right subtree.
        return self.isSubtree(root.left, subRoot) or self.isSubtree(root.right, subRoot)  #!

    #@ The Same Tree check from the previous problem, as a helper.
    def sameTree(self, a: Optional[TreeNode], b: Optional[TreeNode]) -> bool:
        if not a and not b:
            return True
        if not a or not b or a.val != b.val:
            return False
        return self.sameTree(a.left, b.left) and self.sameTree(a.right, b.right)`,
      time: 'O(m·n)',
      space: 'O(h)',
      complexityWhy:
        'For each of the m nodes in `root` we may run a Same Tree check costing up to O(n), where n is the size of `subRoot`. The recursion stack is as deep as the tree.',
      pitfalls: [
        'Matching values is not enough: the copy must include *everything* below that node, with no extra children.',
        'Using `and` instead of `or` when searching the two sides: the match only needs to exist on one side.',
        'A quick string version without null markers or separators gives false matches, like finding `"2"` inside `"12"`.',
      ],
    },
    {
      id: 'lowest-common-ancestor-of-a-binary-search-tree',
      num: 235,
      title: 'Lowest Common Ancestor of a Binary Search Tree',
      difficulty: 'Medium',
      category: 'trees',
      pattern: 'Walk down a BST by value',
      alsoAccept: ['binary-search'],
      prompt:
        'You get the root of a **binary search tree** and two of its nodes, `p` and `q`. Return their **lowest common ancestor**: the deepest node that has both `p` and `q` in its subtree. A node counts as part of its own subtree.',
      examples: [
        {
          input: 'root = [10, 5, 15, 3, 7, 12, 20], p = 3, q = 7',
          output: '5',
          note: 'Below 5, the path to 3 goes left and the path to 7 goes right.',
        },
        {
          input: 'root = [10, 5, 15, 3, 7, 12, 20], p = 5, q = 7',
          output: '5',
          note: '7 is inside the subtree of 5, and 5 counts as its own ancestor.',
        },
      ],
      signals: ['the tree is a **BST** (left smaller, right bigger)', '"lowest common ancestor"', 'two target nodes, one answer node'],
      hints: [
        'In a BST, if both p and q are smaller than the current node, where must both of them be?',
        'Keep walking down while p and q are on the same side. What does it mean when they land on different sides?',
        'Go right if both values are bigger, left if both are smaller; otherwise the current node is the answer.',
      ],
      brute:
        'Ignore the ordering: record the root-to-node path for p and for q, then return the last node the two paths share. That is **O(n)** time and O(n) memory, and it wastes the free information the BST gives you.',
      insight:
        'Walking down from the root, p and q stay on the same side until they **split** — one goes left, one goes right, or one *is* the current node. That split node is the answer, and the BST ordering tells you which way to walk.',
      mnemonic: 'Both bigger, go right. Both smaller, go left. Else, here.',
      steps: [
        'Start at the root.',
        'If both p and q are bigger than the node, move to its right child.',
        'If both p and q are smaller than the node, move to its left child.',
        'Otherwise they split here (or one of them is this node), so return it.',
      ],
      solution: py`
class Solution:
    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':
        #@ Start at the root and walk down a single path.
        node = root
        while node:
            #@ Both targets are bigger: the split point is in the right subtree.
            if p.val > node.val and q.val > node.val:  #!
                node = node.right
            #@ Both targets are smaller: the split point is in the left subtree.
            elif p.val < node.val and q.val < node.val:  #!
                node = node.left
            #@ They fall on different sides (or one IS this node): this is the split point.
            else:
                return node  #!`,
      time: 'O(h)',
      space: 'O(1)',
      complexityWhy:
        'We follow one path downward, so at most h steps (about log n for a balanced BST). The loop keeps only one pointer.',
      pitfalls: [
        'Forgetting that a node is its own ancestor: if `p` is the current node, the answer is `p`.',
        'Comparing the nodes themselves (`p > node`) instead of their values (`p.val > node.val`).',
        'The general binary-tree LCA works too, but it ignores the speed-up that the BST ordering gives you.',
      ],
    },
    {
      id: 'binary-tree-level-order-traversal',
      num: 102,
      title: 'Binary Tree Level Order Traversal',
      difficulty: 'Medium',
      category: 'trees',
      pattern: 'BFS by level with a queue',
      prompt:
        'Return the values of a binary tree **level by level**: one list per level, from the top level down, each list read left to right.',
      examples: [
        { input: 'root = [8, 4, 11, null, 6, 9, 13]', output: '[[8], [4, 11], [6, 9, 13]]' },
        { input: 'root = []', output: '[]' },
      ],
      signals: ['"level by level" or "row by row"', 'output is a list of lists, one per depth', 'left to right within each level'],
      hints: [
        'DFS dives deep first. Which kind of search finishes everything at depth 1 before touching depth 2?',
        'Use a queue: take a node from the front, add its children at the back.',
        'At the start of each round, `len(queue)` is exactly the number of nodes on the current level. Pop that many into one list.',
      ],
      brute:
        'For each depth d, walk the whole tree collecting the nodes at depth d. That repeats the walk once per level: **O(n·h)**, which is O(n²) for a chain-shaped tree.',
      insight:
        'A queue (first in, first out) visits nodes in level order on its own. Saving `len(queue)` at the start of each round tells you how many nodes belong to the current level.',
      mnemonic: 'Count the queue, pop that many, queue their kids.',
      steps: [
        'If the tree is empty, return an empty list.',
        'Put the root in a queue.',
        'While the queue is not empty, note how many nodes are on this level.',
        'Pop that many nodes, recording their values in a level list.',
        "Add each popped node's children to the back of the queue.",
        'Append the finished level list to the answer.',
      ],
      solution: py`
class Solution:
    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:
        #@ An empty tree has no levels.
        if not root:
            return []
        #@ The answer, and a queue that starts with just the root.
        levels = []
        queue = collections.deque([root])
        #@ Each pass of the while loop handles exactly one level: its size is frozen right now.
        while queue:
            level = []
            for _ in range(len(queue)):  #!
                #@ Take the oldest node from the front and record its value...
                node = queue.popleft()  #!
                level.append(node.val)
                #@ ...and line up its children at the back, for the NEXT level.
                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)
            #@ This level is complete; save it.
            levels.append(level)
        return levels`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy:
        'Each node enters and leaves the queue once. The queue can hold a whole level — up to about n/2 nodes on the bottom row of a full tree.',
      pitfalls: [
        'Not freezing the level size: if you loop "until the queue is empty" while also adding children, the levels blur together.',
        '`list.pop(0)` is O(n); use `collections.deque` and `popleft()`.',
        'Adding `None` children to the queue and then crashing on `node.val`. Only add children that exist.',
      ],
    },
    {
      id: 'binary-tree-right-side-view',
      num: 199,
      title: 'Binary Tree Right Side View',
      difficulty: 'Medium',
      category: 'trees',
      pattern: 'BFS by level, keep the last node',
      prompt:
        'Imagine standing to the **right** of a binary tree. Return the values you can see from top to bottom — that is, the **rightmost** node of every level.',
      examples: [
        {
          input: 'root = [6, 2, 9, 1]',
          output: '[6, 9, 1]',
          note: 'Node 1 hangs on the left, but it is alone on its level, so you can still see it.',
        },
        { input: 'root = [3, null, 5, null, 8]', output: '[3, 5, 8]' },
      ],
      signals: ['"seen from the right side"', 'one value per level', 'the rightmost (last) node of each level'],
      hints: [
        'Is the answer just "keep following right children"? What if a deep level only has a node on the left?',
        'You want exactly one node per level, so process the tree level by level.',
        'Run BFS level order and record the last node you pop on each level.',
      ],
      brute:
        'Build the full level-order list of lists and take the last value of each: **O(n)**, but it stores every value. Simply following `.right` pointers is faster but **wrong** — a deeper level may only have nodes on the left.',
      insight:
        'This is Level Order Traversal in disguise: run BFS one level at a time and keep only the **last** node of each level.',
      mnemonic: 'BFS by level; the last one popped is the one you see.',
      steps: [
        'If the tree is empty, return an empty list.',
        'Start a queue with the root.',
        'At the start of each level, record how many nodes it has.',
        'Pop each node of the level; if it is the last one, add its value to the answer.',
        'Add the left child, then the right child, to the queue.',
      ],
      solution: py`
class Solution:
    def rightSideView(self, root: Optional[TreeNode]) -> List[int]:
        #@ Nothing to see in an empty tree.
        if not root:
            return []
        #@ The visible values, and a queue that starts with the root.
        view = []
        queue = collections.deque([root])
        #@ Process one level per pass, remembering how many nodes it has.
        while queue:
            size = len(queue)
            for i in range(size):
                node = queue.popleft()
                #@ The last node popped on this level is the one you see from the right.
                if i == size - 1:  #!
                    view.append(node.val)
                #@ Queue children left first, then right, so the rightmost comes out last.
                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)
        return view`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy:
        'Every node is queued and popped once. The queue holds at most about one full level, which can be O(n) nodes.',
      pitfalls: [
        'Only following right children misses left-side nodes on deeper levels (like node 1 in the first example).',
        'Queue the left child before the right one; otherwise the "last" node of a level is the leftmost.',
        'Reading `len(queue)` again inside the loop — it changes as children are added. Save it first.',
      ],
    },
    {
      id: 'count-good-nodes-in-binary-tree',
      num: 1448,
      title: 'Count Good Nodes in Binary Tree',
      difficulty: 'Medium',
      category: 'trees',
      pattern: 'DFS passing the path max down',
      prompt:
        'A node is **good** if no node on the path from the root down to it has a **bigger** value. Count the good nodes in the tree. (The root is always good.)',
      examples: [
        { input: 'root = [5, 3, 7, 4, 1, 6, 9]', output: '3', note: 'The good nodes are 5, 7 and 9.' },
        {
          input: 'root = [2, 2, null, 1, 3]',
          output: '3',
          note: 'Ties count: both 2s are good, and so is 3. Node 1 is not.',
        },
      ],
      signals: ['a rule about the **path from the root** to each node', '"no bigger value above it"', 'count the nodes that pass a test'],
      hints: [
        'To judge one node, what is the only fact you need about the path above it?',
        'You only need the largest value seen so far on that path. Pass it down as a parameter.',
        'dfs(node, max_so_far): count 1 if `node.val >= max_so_far`, update the max, then add the counts from both children.',
      ],
      brute:
        'For every node, look back at its whole path from the root and compare against each ancestor. That costs up to **O(n·h)**, which is O(n²) for a chain-shaped tree.',
      insight:
        'Carry one number down the recursion: the **largest value on the path so far**. A node is good when its value is at least that number.',
      mnemonic: 'Carry the path max down; beat or tie it to be good.',
      steps: [
        'Write dfs(node, max_so_far), which returns 0 for None.',
        'Count the node as good if its value is at least max_so_far.',
        'Update max_so_far with the node value.',
        'Add the good counts from the left and right subtrees.',
        "Start the search with dfs(root, root's value).",
      ],
      solution: py`
class Solution:
    def goodNodes(self, root: TreeNode) -> int:
        #@ dfs carries the largest value on the path from the root down to node.
        def dfs(node, max_so_far):
            if not node:
                return 0
            #@ Good if nothing above it was bigger (ties are fine).
            good = 1 if node.val >= max_so_far else 0  #!
            #@ Update the path maximum before going deeper.
            max_so_far = max(max_so_far, node.val)  #!
            #@ Add the good nodes found in both subtrees.
            return good + dfs(node.left, max_so_far) + dfs(node.right, max_so_far)

        #@ The root is always good: start with its own value as the max.
        return dfs(root, root.val)`,
      time: 'O(n)',
      space: 'O(h)',
      complexityWhy:
        'Each node is visited once and does O(1) work. The recursion stack is as deep as the tree height h.',
      pitfalls: [
        'Using `>` instead of `>=`: a node equal to the path maximum is still good.',
        "Keeping one shared maximum for the whole tree: values from the left branch would leak into the right branch. Pass it down as a parameter so each path has its own.",
        'Starting the max at 0 breaks when values are negative; start at `root.val` (or `float("-inf")`).',
      ],
    },
    {
      id: 'validate-binary-search-tree',
      num: 98,
      title: 'Validate Binary Search Tree',
      difficulty: 'Medium',
      category: 'trees',
      pattern: 'DFS with (low, high) bounds',
      prompt:
        'Return `True` if a binary tree is a valid **binary search tree**: for every node, *all* values in its left subtree are strictly smaller than it, and *all* values in its right subtree are strictly bigger.',
      examples: [
        { input: 'root = [8, 3, 12, 1, 5]', output: 'True' },
        {
          input: 'root = [8, 3, 12, 1, 9]',
          output: 'False',
          note: '9 is fine as the right child of 3, but it sits in the left subtree of 8 and is bigger than 8.',
        },
      ],
      signals: ['"valid BST"', 'a rule about a whole subtree, not just the direct children', 'strictly smaller / strictly bigger'],
      hints: [
        'Checking only `node.left.val < node.val < node.right.val` is not enough. Can you build a tree that passes that test but is not a BST?',
        'Each node has a range it must fall into, set by all of its ancestors.',
        'Pass `(low, high)` down: going left, the node value becomes the new `high`; going right, it becomes the new `low`.',
      ],
      brute:
        'At every node, scan its whole left subtree for the maximum and its whole right subtree for the minimum, and compare. That rescans the same nodes over and over: **O(n²)** for a chain-shaped tree.',
      insight:
        'Every node must lie strictly inside an allowed range `(low, high)`. The root gets `(-inf, inf)`; stepping left lowers `high` to the parent value, stepping right raises `low` to it.',
      mnemonic: 'Pass the bounds down: left caps high, right lifts low.',
      steps: [
        'Write valid(node, low, high), which returns True for None.',
        'If the node value is not strictly between low and high, return False.',
        'Check the left child with high lowered to the node value.',
        'Check the right child with low raised to the node value.',
        'Start at the root with bounds of minus and plus infinity.',
      ],
      solution: py`
class Solution:
    def isValidBST(self, root: Optional[TreeNode]) -> bool:
        #@ valid() checks that every node in this subtree is strictly between low and high.
        def valid(node, low, high):
            #@ An empty subtree breaks no rules.
            if not node:
                return True
            #@ Outside its allowed range? Then this is not a BST.
            if not (low < node.val < high):  #!
                return False
            #@ Going left caps the high bound; going right lifts the low bound.
            return valid(node.left, low, node.val) and valid(node.right, node.val, high)  #!

        #@ The root may hold any value: start with infinite bounds.
        return valid(root, float('-inf'), float('inf'))`,
      time: 'O(n)',
      space: 'O(h)',
      complexityWhy:
        'Each node is checked once against two numbers. The recursion stack is as deep as the tree height h.',
      pitfalls: [
        'Comparing a node only with its direct children misses problems deeper down (the 9 in the second example).',
        'Using `<=`: equal values are not allowed on either side, so the comparisons must be strict.',
        'Using a made-up limit like `0` or `-1` for the starting bounds breaks on negative values; use `float("-inf")` and `float("inf")`.',
      ],
    },
    {
      id: 'kth-smallest-element-in-a-bst',
      num: 230,
      title: 'Kth Smallest Element in a BST',
      difficulty: 'Medium',
      category: 'trees',
      pattern: 'Iterative in-order with a stack',
      prompt:
        'Given the root of a **binary search tree** and a number `k`, return the **kth smallest** value in the tree. Counting starts at 1.',
      examples: [
        {
          input: 'root = [6, 3, 9, 2, 4, null, 10], k = 2',
          output: '3',
          note: 'Sorted, the values are 2, 3, 4, 6, 9, 10.',
        },
        { input: 'root = [6, 3, 9, 2, 4, null, 10], k = 5', output: '9' },
      ],
      signals: ['a **BST** plus "kth smallest" (or anything about sorted order)', 'visiting values in increasing order', 'k counts from 1'],
      hints: [
        'Which traversal order visits the values of a BST from smallest to largest?',
        'In-order: left subtree, node, right subtree. Count the nodes as you visit them.',
        'Do in-order with a stack: push nodes while going left, pop one, count down k, then move to its right child. Stop when k reaches 0.',
      ],
      brute:
        'Collect every value into a list, sort it, and return the item at index `k - 1`: **O(n log n)** time and O(n) space. It also ignores that the BST is already in order.',
      insight:
        'In-order traversal of a BST produces values in **increasing order**, so the kth node it visits is the answer. Doing it with an explicit stack lets you **stop early**.',
      mnemonic: 'All the way left, pop and count, then step right.',
      steps: [
        'Start with an empty stack and the current node set to root.',
        'Push nodes while moving left, until there is no left child.',
        'Pop the top node: it holds the next smallest value.',
        'Decrease k; if k reaches 0, return that value.',
        "Move to the popped node's right child and repeat.",
      ],
      solution: py`
class Solution:
    def kthSmallest(self, root: Optional[TreeNode], k: int) -> int:
        #@ In-order with our own stack: it visits BST values from smallest to largest.
        stack = []
        node = root
        while stack or node:
            #@ Slide as far left as possible, saving each node to come back to.
            while node:  #!
                stack.append(node)
                node = node.left
            #@ The top of the stack holds the next smallest value.
            node = stack.pop()  #!
            k -= 1
            #@ Counted down to zero? This is the kth smallest.
            if k == 0:  #!
                return node.val
            #@ Next come the values just bigger than this one: its right subtree.
            node = node.right`,
      time: 'O(h + k)',
      space: 'O(h)',
      complexityWhy:
        'We walk down at most h nodes to reach the smallest value, then pop k nodes. The stack holds at most one root-to-leaf path.',
      pitfalls: [
        'Off by one: k counts from 1, so decrease k first and return when it hits 0.',
        'The outer loop must run while `stack or node` — checking only the stack stops before the right subtrees are explored.',
        'A recursive in-order also works, but remember to stop once you have the answer instead of visiting every node.',
      ],
    },
    {
      id: 'construct-binary-tree-from-preorder-and-inorder-traversal',
      num: 105,
      title: 'Construct Binary Tree from Preorder and Inorder Traversal',
      difficulty: 'Medium',
      category: 'trees',
      pattern: 'Recursion with an inorder index map',
      prompt:
        'You get two lists describing the same binary tree, whose values are all different: `preorder` (root, then left subtree, then right subtree) and `inorder` (left subtree, then root, then right subtree). Rebuild the tree and return its root.',
      examples: [
        {
          input: 'preorder = [5, 2, 1, 4, 8, 9], inorder = [1, 2, 4, 5, 8, 9]',
          output: '[5, 2, 8, 1, 4, null, 9]',
          note: '5 comes first in preorder, so it is the root. In inorder, [1, 2, 4] sits left of 5 and [8, 9] sits right of it.',
        },
        {
          input: 'preorder = [1, 2, 3], inorder = [3, 2, 1]',
          output: '[1, 2, null, 3]',
          note: 'Every value appears left of its parent in inorder: a chain leaning left.',
        },
      ],
      signals: ['"construct" or "rebuild" a tree from traversals', 'given both preorder and inorder', 'all values are unique'],
      hints: [
        'Which of the two lists tells you the root straight away?',
        'Find that root in `inorder`: everything to its left is the left subtree, everything to its right is the right subtree.',
        'Use a dict value → inorder index and a pointer into preorder. Make the root, then recursively build the left range, then the right range.',
      ],
      brute:
        'Slice the lists on every call: find the root with `inorder.index(...)` (O(n)) and pass slices like `preorder[1:mid + 1]` into the recursion. All the searching and copying makes it **O(n²)** in the worst case.',
      insight:
        'The **next unused preorder value is always the root** of the subtree you are building, and its **position in inorder** splits the rest into left and right. A dict makes that position lookup O(1).',
      mnemonic: 'Preorder picks the root; inorder splits left from right.',
      steps: [
        'Build a dict from each value to its index in inorder.',
        'Keep a pointer to the next unused value in preorder.',
        'build(left, right) returns None when the inorder range is empty.',
        'Make a node from the next preorder value and move the pointer forward.',
        "Look up the node's inorder index; build the left range first, then the right range.",
        'Return build over the whole inorder range.',
      ],
      solution: py`
class Solution:
    def buildTree(self, preorder: List[int], inorder: List[int]) -> Optional[TreeNode]:
        #@ Map each value to its position in inorder, for O(1) lookups.
        index_of = {val: i for i, val in enumerate(inorder)}  #!
        #@ Preorder lists every root before its subtrees; walk through it with a pointer.
        pre_i = 0

        #@ build(left, right) makes the subtree whose values are inorder[left..right].
        def build(left, right):
            nonlocal pre_i
            if left > right:
                return None
            #@ The next preorder value is the root of this subtree.
            root = TreeNode(preorder[pre_i])  #!
            pre_i += 1
            #@ Values left of the root in inorder form its left subtree; values right of it, its right subtree.
            mid = index_of[root.val]
            root.left = build(left, mid - 1)  #!
            root.right = build(mid + 1, right)
            return root

        #@ Start with the whole inorder range.
        return build(0, len(inorder) - 1)`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy:
        'Each value becomes a node exactly once, using O(1) dict lookups. The dict holds n entries and the recursion is as deep as the tree.',
      pitfalls: [
        'Building the right subtree before the left breaks the preorder pointer: preorder lists the whole left subtree first.',
        'Calling `inorder.index()` inside the recursion makes every lookup O(n).',
        'This only works because the values are unique; with duplicates, the root position in inorder would be ambiguous.',
      ],
    },
    {
      id: 'binary-tree-maximum-path-sum',
      num: 124,
      title: 'Binary Tree Maximum Path Sum',
      difficulty: 'Hard',
      category: 'trees',
      pattern: 'Post-order gain + global best',
      prompt:
        'A **path** is a chain of connected nodes that uses each node at most once. It can start and end anywhere and does not have to include the root. Return the largest possible sum of the values on a path (values can be negative, and a path has at least one node).',
      examples: [
        {
          input: 'root = [2, -6, 5, null, null, 3, 4]',
          output: '12',
          note: 'The path 3 → 5 → 4 adds up to 12 and skips the root.',
        },
        {
          input: 'root = [-4, -2, -7]',
          output: '-2',
          note: 'Every value is negative, so the best path is the single node -2.',
        },
      ],
      signals: ['a "path" that can start and end at any node', 'maximize a sum, and values can be negative', 'like Diameter, but adding values instead of counting edges'],
      hints: [
        'Like Diameter, every path has one highest node where it bends. What is the best path that bends at node X?',
        "At X: X's value + the best downward path on the left + the best downward path on the right — but skip a side if it would add a negative amount.",
        'Post-order `gain(node)`: clip each child gain at 0, update a global `best` with `left + node.val + right`, and return `node.val + max(left, right)`.',
      ],
      brute:
        'Try every pair of nodes as the two ends of a path and add up the values between them: O(n²) pairs, each path up to O(n) long, so **O(n³)**.',
      insight:
        'Each node does two jobs in one post-order pass: it **updates the answer** with the path that bends here (`left + val + right`) and **returns** the best one-sided path (`val + max(left, right)`) to its parent. Negative branches count as 0.',
      mnemonic: 'Clip negatives to zero; bend here, but return one side.',
      steps: [
        'Start best at the root value.',
        'Write gain(node), which returns 0 for None.',
        'Get the left and right gains, replacing negative ones with 0.',
        'Update best with left gain + node value + right gain.',
        'Return the node value + the larger gain to the parent.',
        'Call gain(root) and return best.',
      ],
      solution: py`
class Solution:
    def maxPathSum(self, root: Optional[TreeNode]) -> int:
        #@ A path has at least one node, so the root value is a safe starting answer.
        best = root.val

        #@ gain(node) = the best sum of a path that starts at node and only goes down.
        def gain(node):
            nonlocal best
            if not node:
                return 0
            #@ A branch with a negative sum only hurts, so count it as 0 (just do not go there).
            left = max(gain(node.left), 0)  #!
            right = max(gain(node.right), 0)
            #@ The best path that bends at this node: left branch + node + right branch.
            best = max(best, left + node.val + right)  #!
            #@ The parent can continue down only ONE branch.
            return node.val + max(left, right)  #!

        #@ One pass from the root updates best everywhere.
        gain(root)
        return best`,
      time: 'O(n)',
      space: 'O(h)',
      complexityWhy:
        'Every node is visited once with O(1) work. The recursion stack is as deep as the tree height h.',
      pitfalls: [
        'Starting `best` at 0: when every value is negative the answer is negative. Start at `root.val` (or `float("-inf")`).',
        'Returning `left + val + right` to the parent — a path cannot fork, so only one side can continue upward.',
        'Not clipping negative gains at 0: a branch that lowers the sum should simply be left out.',
      ],
    },
    {
      id: 'serialize-and-deserialize-binary-tree',
      num: 297,
      title: 'Serialize and Deserialize Binary Tree',
      difficulty: 'Hard',
      category: 'trees',
      pattern: 'Preorder with null markers',
      prompt:
        'Design a `Codec` class with two methods. `serialize(root)` turns a binary tree into a string, and `deserialize(data)` turns that string back into the **exact same** tree. You choose the string format.',
      examples: [
        {
          input: 'root = [4, 7, 2, null, null, 9]',
          output: '[4, 7, 2, null, null, 9]',
          note: 'serialize gives "4,7,N,N,2,9,N,N,N", and deserialize rebuilds the same tree from it.',
        },
        { input: 'root = []', output: '[]', note: 'An empty tree is stored as just "N".' },
      ],
      signals: ['"serialize / deserialize" or "encode / decode" a tree', 'the exact shape must survive, including missing children', 'you get to design the format'],
      hints: [
        'A preorder list of the values alone cannot rebuild the shape. What information is missing?',
        'Write a marker such as `N` for every missing child. With those markers, preorder alone pins down the shape.',
        'To deserialize, read the tokens in the same preorder: `N` means None; otherwise make a node, then build its left child, then its right child.',
      ],
      brute:
        'Writing only the values is short but **cannot be decoded**: many different shapes share the same list of values. A level-order format with nulls (like LeetCode uses) also works in **O(n)**, but rebuilding it needs fiddlier queue bookkeeping than preorder.',
      insight:
        'Preorder **plus a marker for every empty child** describes a tree completely. Deserializing reads the tokens back in the same order, so the recursion rebuilds the shape by itself.',
      mnemonic: 'Preorder with N for nulls; read it back the same way.',
      steps: [
        'Serialize with a preorder walk, writing N for every missing node.',
        'Join the tokens with commas into one string.',
        'To deserialize, split the string back into tokens.',
        'Read the next token; if it is N, return None.',
        'Otherwise make a node, then build its left subtree, then its right subtree.',
      ],
      solution: py`
class Codec:
    def serialize(self, root: Optional[TreeNode]) -> str:
        #@ A preorder walk that collects string tokens in a list.
        out = []
        def write(node):
            #@ A missing node becomes 'N'. These markers are what preserve the shape.
            if not node:
                out.append('N')  #!
                return
            #@ Otherwise write the value, then the left subtree, then the right subtree.
            out.append(str(node.val))
            write(node.left)
            write(node.right)
        #@ Run the walk, then join the tokens with commas into one string.
        write(root)
        return ','.join(out)

    #@ Decoding: split into tokens and keep a pointer to the next one to read.
    def deserialize(self, data: str) -> Optional[TreeNode]:
        tokens = data.split(',')
        i = 0
        #@ read() consumes the next token and builds the whole subtree it starts.
        def read():
            nonlocal i
            token = tokens[i]
            i += 1
            #@ 'N' means "no node here", so this branch ends.
            if token == 'N':  #!
                return None
            #@ Otherwise make the node, then rebuild its left and right subtrees in the same preorder.
            node = TreeNode(int(token))
            node.left = read()  #!
            node.right = read()
            return node
        #@ The first token is the root, so one call rebuilds the whole tree.
        return read()`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy:
        'Each node and each null marker (about n + 1 of them) is written once and read once. The string and the token list hold O(n) items.',
      pitfalls: [
        'Leaving out the null markers: values alone cannot tell a left child from a right child.',
        'Reading the tokens in a different order than you wrote them — both directions must use preorder.',
        'Skipping the separator: joining "1" and "23" with nothing between them gives "123", which is ambiguous.',
      ],
    },
  ],
};

export default content;
