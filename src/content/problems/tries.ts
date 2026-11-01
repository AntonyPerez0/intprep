import { py, type CategoryContent } from '../types';

const content: CategoryContent = {
  guide: {
    category: 'tries',
    summary: `A **trie** (say "try", from re*trie*val) is a tree for storing words. Each node has **children**, one per possible next letter, and a flag **is_end** that says "a word finishes here". A word is a path from the root, one letter per step.

Words that start the same way **share** the start of their path: "car", "cart" and "cat" all go through the same c → a nodes. So "does any word start with ca?" is just two steps down the tree.

Insert, search and prefix checks take **O(L)** for a word of length L, no matter how many words are stored. A hash set can tell you if a whole word exists, but it cannot answer prefix questions cheaply, and it cannot tell a search to stop the moment no word can continue.`,
    analogy:
      'Nested index tabs in a giant paper dictionary: open the C tab, then the CA tab inside it, then CAR. Every word starting with "CA" lives behind the same two tabs, and a little star marks the spots where a real word ends.',
    whenToUse: [
      'The problem talks about **prefixes**: "starts with", autocomplete, "any word beginning with…"',
      'You must look for **many words at once**, for example all dictionary words hidden in a grid',
      'Wildcard search where `.` can be any letter, matched letter by letter',
      'You are asked to design a class that adds words and searches for them',
      'A search builds strings one character at a time and should stop as soon as no word can start that way',
    ],
    template: py`
class TrieNode:
    def __init__(self):
        self.children = {}     # letter -> TrieNode
        self.is_end = False    # True if a word ends at this node


def insert(root, word):
    node = root
    for ch in word:
        if ch not in node.children:
            node.children[ch] = TrieNode()   # create the missing step
        node = node.children[ch]
    node.is_end = True                       # mark where the word finishes


def walk(root, s):
    node = root
    for ch in s:
        if ch not in node.children:
            return None                      # path breaks: no word starts with s
        node = node.children[ch]
    return node                              # s is a prefix; node.is_end says if it is a word`,
    templateNotes: [
      'The root is an empty node that stands for the empty prefix "". Letters live on the edges: they are the keys of `children`.',
      '`is_end` separates a whole word from a mere prefix: after inserting only "cart", "car" is a prefix but not a word.',
      'A dict for `children` works for any alphabet. A list of 26 slots indexed by `ord(ch) - ord("a")` also works for lowercase letters.',
      'Insert and lookup cost O(L) for a word of length L, however many words are stored.',
    ],
    complexity: 'O(L) time per insert or lookup (L = word length) and O(total letters) space.',
    quiz: [
      {
        q: 'You insert only "card" into an empty trie. What does `search("car")` return?',
        options: ['True', 'False', 'It raises an error'],
        answer: 1,
        explain: 'The path c → a → r exists, but no word ends at the r node, so its `is_end` is False.',
      },
      {
        q: 'What does `startsWith("ca")` need to check?',
        options: [
          'That the path c → a exists from the root',
          'That `is_end` is True on the a node',
          'That the trie holds exactly one word',
          'That "ca" was stored in a set',
        ],
        answer: 0,
        explain: 'Any surviving path means some inserted word continues through it. The end flag does not matter for prefixes.',
      },
      {
        q: 'A trie holds a million words. Roughly how many steps does looking up a 5-letter word take?',
        options: ['About 5', 'About 20', 'About a million', 'It depends on alphabetical order'],
        answer: 0,
        explain: 'One step per letter. The number of stored words does not matter.',
      },
    ],
  },

  problems: [
    {
      id: 'implement-trie-prefix-tree',
      num: 208,
      title: 'Implement Trie (Prefix Tree)',
      difficulty: 'Medium',
      category: 'tries',
      pattern: 'Trie node: children map + end flag',
      prompt:
        'Build a `Trie` class with three methods: `insert(word)` adds a word, `search(word)` returns `True` only if that exact word was inserted, and `startsWith(prefix)` returns `True` if any inserted word begins with `prefix`.',
      examples: [
        {
          input: 't = Trie(); t.insert("card"); t.search("car"); t.startsWith("car"); t.insert("car"); t.search("car")',
          output: 'False, True, True',
          note: 'The results of the three queries. "car" is only a prefix until it is inserted itself.',
        },
      ],
      signals: ['"prefix" or "starts with"', 'insert and look up many words', 'design a class with insert and search'],
      hints: [
        'Words that share a beginning could share storage. What kind of tree would do that?',
        'Each node needs its children (letter → node) and a flag for "a word ends here".',
        'All three methods walk letter by letter from the root. `insert` creates missing nodes; `search` also checks the end flag; `startsWith` does not.',
      ],
      brute:
        'Keep a list of words. `search` is fine with a set, but `startsWith` must compare the prefix against every word — **O(n · L)** per call.',
      insight:
        'Store words as **paths of letters** from a shared root, so following any word takes O(L). The only difference between a word and a prefix is the `is_end` flag on the last node.',
      mnemonic: 'Walk letter by letter; is_end separates words from prefixes.',
      steps: [
        'Define a node with a children dict and an is_end flag.',
        'Create the trie with an empty root node.',
        'insert: walk the letters from the root, creating missing children, then set is_end on the last node.',
        'search: walk the letters, return False if a child is missing, otherwise return is_end of the last node.',
        'startsWith: walk the letters, return False if a child is missing, otherwise return True.',
      ],
      solution: py`
class TrieNode:
    #@ Each node maps a letter to the next node, and remembers whether a word ends here.
    def __init__(self):
        self.children = {}
        self.is_end = False


#@ The trie itself starts as one empty root node, which stands for the empty prefix.
class Trie:
    def __init__(self):
        self.root = TrieNode()

    #@ insert: walk the word letter by letter, creating any node that is missing.
    def insert(self, word: str) -> None:
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()  #!
            node = node.children[ch]
        #@ Mark the node of the last letter as the end of a word.
        node.is_end = True  #!

    #@ search: follow the path. If it breaks, the word was never inserted.
    def search(self, word: str) -> bool:
        node = self.root
        for ch in word:
            if ch not in node.children:
                return False
            node = node.children[ch]
        #@ The path exists, but it is only a word if a word ended here.
        return node.is_end  #!

    #@ startsWith: the same walk, but any surviving path is enough. No end flag needed.
    def startsWith(self, prefix: str) -> bool:
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return True`,
      time: 'O(L) per call',
      space: 'O(N)',
      complexityWhy:
        'Each method walks at most L letters of its input. The trie stores at most one node per inserted letter, N in total.',
      pitfalls: [
        '`search` must return `node.is_end`, not `True`: a prefix of a longer word is not a word.',
        'Set `is_end` on the node of the **last letter**, not on the root.',
        'Move `node = node.children[ch]` on every letter, including right after creating a new child.',
      ],
    },
    {
      id: 'design-add-and-search-words-data-structure',
      num: 211,
      title: 'Design Add and Search Words Data Structure',
      difficulty: 'Medium',
      category: 'tries',
      pattern: 'Trie + DFS for wildcards',
      prompt:
        'Build a `WordDictionary` class. `addWord(word)` stores a word. `search(word)` returns `True` if some stored word matches `word`, where a `.` in the search word matches **any single letter**.',
      examples: [
        {
          input: 'wd = WordDictionary(); wd.addWord("bat"); wd.addWord("bit"); wd.search("b.t"); wd.search(".a."); wd.search("b..s"); wd.search("bad")',
          output: 'True, True, False, False',
          note: 'The results of the four searches. "b.t" matches both words; "b..s" is the wrong length.',
        },
      ],
      signals: ['"." matches any letter (a wildcard)', 'add words, then search many times', 'patterns are matched letter by letter'],
      hints: [
        'Without dots this is exactly a trie search. What changes when you meet a dot?',
        'A dot could be any child of the current node, so you must try them all.',
        'Write `dfs(i, node)`: for a letter, follow its one child; for a dot, try every child and return True if any branch succeeds.',
      ],
      brute:
        'Keep a list of words and compare the pattern with every word, letter by letter — **O(n · L)** per search for n words.',
      insight:
        'Store the words in a trie. A normal letter follows **one** child, while a `.` must try **every** child. A recursive DFS handles both, and returns True as soon as any branch uses up the pattern on a node marked `is_end`.',
      mnemonic: 'Letter: follow one child. Dot: try them all.',
      steps: [
        'Define a trie node with a children dict and an is_end flag.',
        'addWord: walk the letters, creating missing children, and mark the last node.',
        'search: run dfs(i, node) from index 0 at the root.',
        'If i reaches the end of the word, return whether node.is_end is set.',
        'If word[i] is a dot, run dfs on every child and return True if any succeeds.',
        'Otherwise follow the one child for word[i], or return False if it is missing.',
      ],
      solution: py`
class TrieNode:
    #@ The same node as a normal trie: children by letter, plus a flag for "a word ends here".
    def __init__(self):
        self.children = {}
        self.is_end = False


#@ The dictionary starts as one empty root node.
class WordDictionary:
    def __init__(self):
        self.root = TrieNode()

    #@ Adding a word is a normal trie insert: walk the letters, create missing nodes, mark the end.
    def addWord(self, word: str) -> None:
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_end = True

    #@ Searching is a DFS: dfs(i, node) asks "can word[i:] be matched starting from node?"
    def search(self, word: str) -> bool:
        def dfs(i, node):
            #@ Every letter is matched. It only counts if a stored word ends right here.
            if i == len(word):
                return node.is_end  #!
            #@ A dot can be any letter: try every child, and succeed if any branch matches.
            ch = word[i]
            if ch == ".":
                for child in node.children.values():
                    if dfs(i + 1, child):  #!
                        return True
                return False
            #@ A normal letter has exactly one path to follow.
            if ch not in node.children:
                return False
            return dfs(i + 1, node.children[ch])  #!

        #@ Start with the first letter at the root.
        return dfs(0, self.root)`,
      time: 'O(L) add, O(N) worst-case search',
      space: 'O(N)',
      complexityWhy:
        'addWord walks L letters. A search without dots follows one path of length L. With dots it branches, but each trie node can be visited at most once, so the worst case is O(N), where N is the number of letters stored.',
      pitfalls: [
        'At the end of the pattern, return `node.is_end`, not `True`: if only "bath" was added, "ba." must not match.',
        'For a dot, do not return the result of the first child straight away. If that branch fails, keep trying the others.',
        'Only a dot branches. Every other character is an exact match, which keeps most searches fast.',
      ],
    },
    {
      id: 'word-search-ii',
      num: 212,
      title: 'Word Search II',
      difficulty: 'Hard',
      category: 'tries',
      pattern: 'Trie-guided DFS backtracking on a grid',
      alsoAccept: ['backtracking', 'graphs'],
      prompt:
        'You get a grid of letters `board` and a list of `words`. Return every word that can be traced in the grid: start on any cell and step up, down, left or right to the next letter, never reusing a cell within one word. Any order is fine.',
      examples: [
        {
          input: 'board = [["c", "a", "t"], ["x", "r", "s"], ["d", "o", "g"]], words = ["cats", "dog", "rot", "arc"]',
          output: '["cats", "dog"]',
          note: '"rot" fails because o and t are not neighbors; in "arc", r and c only touch diagonally.',
        },
        { input: 'board = [["a", "b"], ["c", "d"]], words = ["abdc", "abcd"]', output: '["abdc"]' },
      ],
      signals: ['find **many** words in one grid', 'paths through neighboring cells, no cell reused', 'the words share prefixes'],
      hints: [
        'Searching the grid separately for every word repeats a lot of work. What do "cat" and "cats" have in common?',
        'Put all the words in a trie. Then one DFS from each cell can follow the trie and look for every word at once.',
        'In the DFS, stop the moment the path so far is not a prefix in the trie. Store each whole word at its end node so you can record it on arrival.',
      ],
      brute:
        'Run the single-word grid search (Word Search) once per word — roughly **O(w · m · n · 3^L)** for w words. The same prefixes get explored again and again.',
      insight:
        'Build **one trie from all the words** and walk it while you DFS the grid. Each step moves one letter down the trie, so a path that does not start any word is cut off at once, and every word is searched for at the same time.',
      mnemonic: 'The trie steers the grid walk; dead prefix, turn back.',
      steps: [
        'Insert every word into a trie, storing the whole word at its last node.',
        'Start a DFS from every cell of the board, beginning at the trie root.',
        'If the letter in the cell is not a child of the current trie node, stop.',
        'If the new node holds a word, add it to the results and clear it.',
        'Mark the cell as used, explore its four neighbors, then restore its letter.',
        'Delete trie nodes that have no children and no word left.',
      ],
      solution: py`
class TrieNode:
    #@ Each node keeps its children by letter, and the whole word if one ends here.
    def __init__(self):
        self.children = {}
        self.word = None


#@ First put every word into one trie, so a single walk over the grid can look for all of them.
class Solution:
    def findWords(self, board: List[List[str]], words: List[str]) -> List[str]:
        root = TrieNode()
        for w in words:
            node = root
            for ch in w:
                node = node.children.setdefault(ch, TrieNode())
            node.word = w
        #@ Remember the grid size, and keep a list of the words we find.
        rows, cols = len(board), len(board[0])
        found = []

        #@ dfs(r, c, parent) tries to extend the current path with the letter at (r, c).
        def dfs(r, c, parent):
            ch = board[r][c]
            node = parent.children.get(ch)
            #@ No child for this letter: no word continues this way, so stop early.
            if node is None:  #!
                return
            #@ A word ends here: record it, then clear it so it is never added twice.
            if node.word is not None:
                found.append(node.word)
                node.word = None
            #@ Mark the cell as used, explore the four neighbors, then put the letter back.
            board[r][c] = "*"  #!
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] != "*":
                    dfs(nr, nc, node)
            board[r][c] = ch  #!
            #@ Prune: a node with no children and no word left can never help again.
            if not node.children and node.word is None:
                del parent.children[ch]

        #@ Start a search from every cell.
        for r in range(rows):
            for c in range(cols):
                dfs(r, c, root)
        return found`,
      time: 'O(m · n · 4 · 3^(L-1))',
      space: 'O(W)',
      complexityWhy:
        'From each of the m · n cells the DFS can go 4 ways first, then at most 3 (never back onto a used cell), for at most L letters (the longest word). The trie holds W letters in total.',
      pitfalls: [
        'Clear `node.word` after recording it, or the same word gets added again from another path.',
        'Restore the letter after exploring (that is the backtracking step), or later searches see a damaged board.',
        'Without pruning used-up trie branches, big boards with many words can run too slowly on LeetCode.',
        'Check the grid bounds before reading `board[nr][nc]`.',
      ],
    },
  ],
};

export default content;
