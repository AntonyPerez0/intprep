import { py, type CategoryContent } from '../types';

const content: CategoryContent = {
  guide: {
    category: 'linked-list',
    summary: `A **linked list** is a chain of nodes. Each node holds a value (\`node.val\`) and an arrow to the next node (\`node.next\`). The last node points to \`None\`. You are only handed the **head** (the first node), so to reach the 5th node you must walk there one step at a time. There is no \`nums[4]\` shortcut.

The upside: you can insert, remove or reverse nodes just by **rewiring arrows**, with no shifting and no extra memory. Almost every linked-list problem is about changing \`next\` pointers in the right order without losing part of the chain.

Three tricks solve most of them:

- **Dummy node**: a fake node placed in front of the head, so the head is never a special case.
- **Fast & slow pointers**: one pointer moves 2 steps for every 1 step of the other. This finds the middle, the n-th node from the end, and cycles.
- **In-place reversal**: walk the list with \`prev\` and \`curr\`, flipping each arrow backwards as you go.`,
    analogy:
      'A linked list is a scavenger hunt: each clue only tells you where the next clue is hidden. You cannot jump straight to clue 7, but you can change the whole route by rewriting one clue, as long as you read where it pointed before you erase it.',
    whenToUse: [
      'The input is a `ListNode` head and you must rearrange, remove or insert nodes → rewire `next` pointers in place',
      'The head itself might be removed or replaced → put a **dummy node** in front of it',
      'You need the middle node, the n-th node from the end, or to detect a loop → **fast & slow pointers**',
      'You need to reverse the whole list or a part of it → **prev / curr reversal**',
      'You build a new list piece by piece (merging, adding digits) → dummy node + a `tail` pointer',
      'An array whose values can be read as "go to that index next" → it is secretly a linked list, so cycle tricks apply',
    ],
    template: py`
def build_with_dummy(head):
    dummy = ListNode(0, head)   # fake node in front of the real head
    tail = dummy                # last node of the list we are building
    # ... attach nodes with: tail.next = node; tail = tail.next ...
    return dummy.next           # the real head, even if it changed


def find_middle(head):
    slow = fast = head
    while fast and fast.next:   # fast needs two more nodes to jump
        slow = slow.next        # 1 step
        fast = fast.next.next   # 2 steps
    return slow                 # the middle (second middle if length is even)


def reverse(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next         # 1. save the rest of the list
        curr.next = prev        # 2. flip this arrow backwards
        prev, curr = curr, nxt  # 3. step both pointers forward
    return prev                 # old tail = new head`,
    templateNotes: [
      'Always save `curr.next` **before** you overwrite it. Once that arrow changes, the rest of the list is unreachable.',
      'With a dummy node, "the node before the head" always exists, so deleting or inserting at the front needs no special case. Return `dummy.next`, not `head`.',
      '`while fast and fast.next` protects both jumps: fast moves two steps, so both of those nodes must exist.',
      'Draw boxes and arrows on paper and update them line by line. Most linked-list bugs are an arrow changed one step too early.',
    ],
    complexity: 'Usually O(n) time and O(1) extra space, because you rewire existing nodes instead of copying them.',
    quiz: [
      {
        q: 'In the reversal loop, why must `nxt = curr.next` run before `curr.next = prev`?',
        options: [
          'It makes the loop run faster',
          'After the flip, `curr.next` points backwards, so the rest of the list would be lost',
          'Python requires every variable to be declared first',
          'It is not needed; the order of the two lines does not matter',
        ],
        answer: 1,
        explain:
          'Flipping the arrow destroys the only link to the remaining nodes. Saving it first keeps the rest of the list reachable.',
      },
      {
        q: 'A fast pointer moves 2 nodes per step and a slow pointer moves 1. Where is slow when fast reaches the end?',
        options: ['Still at the head', 'Around the middle', 'At the last node', 'One node before the end'],
        answer: 1,
        explain: 'Fast covers twice the distance, so when fast has walked the whole list, slow has walked half of it.',
      },
      {
        q: 'What problem does a dummy node solve?',
        options: [
          'It keeps the list sorted',
          'It removes the special case when the head might change or be deleted',
          'It detects cycles',
          'It saves memory',
        ],
        answer: 1,
        explain:
          'There is always a node before the real head, so removing or replacing the head works like any other node. Return `dummy.next` at the end.',
      },
      {
        q: 'How long does it take to reach the k-th node of a linked list, starting from the head?',
        options: ['O(1)', 'O(log k)', 'O(k)', 'O(k²)'],
        answer: 2,
        explain: 'There is no indexing: you follow `next` one node at a time, k times.',
      },
    ],
  },

  problems: [
    {
      id: 'reverse-linked-list',
      num: 206,
      title: 'Reverse Linked List',
      difficulty: 'Easy',
      category: 'linked-list',
      pattern: 'Iterative pointer reversal',
      prompt:
        'You are given the `head` of a singly linked list. Flip the direction of every link so the list runs backwards, and return the new head.',
      examples: [
        { input: 'head = [4, 8, 15]', output: '[15, 8, 4]' },
        { input: 'head = []', output: '[]', note: 'An empty list stays empty.' },
      ],
      signals: ['"reverse the list"', 'singly linked list (only `next` arrows)', 'can be done in place with O(1) memory'],
      hints: [
        'If you flip one arrow, how do you still reach the rest of the list?',
        'Keep track of three nodes: the one behind you, the current one, and the one ahead.',
        'Walk with `prev` and `curr`. Save `curr.next`, point `curr.next` at `prev`, then shift both forward.',
      ],
      brute:
        'Copy the values into a Python list, reverse it, and build new nodes (or write the values back). That is **O(n)** time but **O(n)** extra space, and it dodges the real skill: rewiring pointers.',
      insight:
        'You only need to remember the node *behind* you. Flip each arrow to point backwards, saving the next node first so you never lose the rest of the chain.',
      mnemonic: 'Save next, flip arrow, step forward.',
      steps: [
        'Set prev to None and curr to head.',
        'While curr is not None, save curr.next in nxt.',
        'Point curr.next back at prev.',
        'Move prev to curr and curr to nxt.',
        'Return prev, which is the new head.',
      ],
      solution: py`
class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        #@ prev is the already-reversed part (empty at first). curr is the node we are working on.
        prev, curr = None, head
        #@ Keep going until every node has been flipped.
        while curr:
            #@ Save the rest of the list before we break the link to it.
            nxt = curr.next  #!
            #@ Flip this node's arrow so it points backwards.
            curr.next = prev  #!
            #@ Step forward: this node joins the reversed part, and we move on to the saved node.
            prev = curr
            curr = nxt
        #@ curr fell off the end, so prev is the old tail, which is the new head.
        return prev`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy: 'Each node is visited once and only three pointers are stored, no matter how long the list is.',
      pitfalls: [
        'Overwriting `curr.next` before saving it loses the rest of the list.',
        'Returning `head` instead of `prev`: the old head is now the *tail*.',
        'A recursive version also works, but it uses O(n) space on the call stack.',
      ],
    },
    {
      id: 'merge-two-sorted-lists',
      num: 21,
      title: 'Merge Two Sorted Lists',
      difficulty: 'Easy',
      category: 'linked-list',
      pattern: 'Dummy node + tail pointer merge',
      prompt:
        'You get the heads of two linked lists, each already sorted from smallest to largest. Splice their nodes together into **one sorted list** and return its head.',
      examples: [
        { input: 'list1 = [2, 5, 9], list2 = [1, 5, 6]', output: '[1, 2, 5, 5, 6, 9]' },
        { input: 'list1 = [], list2 = [3]', output: '[3]' },
      ],
      signals: ['two inputs that are **already sorted**', '"merge" into one sorted list', 'reuse the existing nodes'],
      hints: [
        'Which node must come first in the merged list?',
        'Compare the two front nodes; the smaller one goes next. Then repeat.',
        'Use a dummy node and a `tail` pointer so the first node is not a special case. When one list runs out, attach the other.',
      ],
      brute:
        'Pour every value into a Python list, sort it, and build new nodes: **O((n + m) log(n + m))** time and **O(n + m)** extra space. It ignores that the inputs are already sorted.',
      insight:
        'The smallest remaining value is always at the front of one of the two lists. Keep attaching the smaller front node to the end of a growing list that starts at a dummy node.',
      mnemonic: 'Smaller front goes next; leftovers hang on the end.',
      steps: [
        'Create a dummy node and point tail at it.',
        'While both lists have nodes, compare their front values.',
        'Attach the smaller front node to tail and advance that list.',
        'Move tail forward onto the node just attached.',
        'Attach whichever list still has nodes left.',
        'Return dummy.next.',
      ],
      solution: py`
class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        #@ A dummy node gives the merged list a fixed starting point. tail marks its last node.
        dummy = ListNode()
        tail = dummy
        #@ While both lists still have nodes, compare their fronts.
        while list1 and list2:
            #@ Attach the smaller front node and advance that list.
            if list1.val <= list2.val:  #!
                tail.next = list1
                list1 = list1.next
            else:
                tail.next = list2
                list2 = list2.next
            #@ Move tail onto the node we just attached.
            tail = tail.next
        #@ One list ran out. The other is already sorted, so attach all of it in one step.
        tail.next = list1 or list2  #!
        #@ Skip the dummy and return the real head.
        return dummy.next`,
      time: 'O(n + m)',
      space: 'O(1)',
      complexityWhy:
        'Every node is attached exactly once. We only create one dummy node and move existing nodes around.',
      pitfalls: [
        'Forgetting to move `tail` forward, so every new node overwrites the same link.',
        'Returning `dummy` instead of `dummy.next` puts a fake 0 at the front.',
        'No need to loop over the leftover list: it is already sorted, so one link attaches all of it.',
      ],
    },
    {
      id: 'linked-list-cycle',
      num: 141,
      title: 'Linked List Cycle',
      difficulty: 'Easy',
      category: 'linked-list',
      pattern: "Floyd's fast & slow pointers",
      prompt:
        'Given the `head` of a linked list, return `True` if following `next` pointers ever brings you back to a node you already visited (a **cycle**), and `False` if you eventually reach the end.',
      examples: [
        {
          input: 'head = [5, 1, 7, 2], pos = 1',
          output: 'True',
          note: 'The last node links back to index 1 (the node holding 1). `pos` only describes the test; your function never sees it.',
        },
        { input: 'head = [6, 3], pos = -1', output: 'False', note: 'pos = -1 means the list has no cycle.' },
      ],
      signals: ['"does the list loop back on itself?"', 'O(1) memory requested', 'following pointers might never reach `None`'],
      hints: [
        'A plain walk would run forever on a cycle. What could tell you that you are going in circles?',
        'You could remember visited nodes in a set, but can you do it with no extra memory?',
        'Send two pointers: one moves 1 step, the other 2. If there is a loop, the fast one must eventually land on the slow one.',
      ],
      brute:
        'Store every visited node in a hash set; seeing a node twice means a cycle. That is **O(n)** time but **O(n)** extra space.',
      insight:
        'Inside a loop, the fast pointer gains one step on the slow pointer every round, so it is guaranteed to land on it. With no loop, fast simply reaches the end.',
      mnemonic: 'The hare only laps the tortoise on a circular track.',
      steps: [
        'Start slow and fast at the head.',
        'While fast and fast.next exist, move slow one step and fast two steps.',
        'If slow and fast are now the same node, return True.',
        'If the loop ends, fast reached the end, so return False.',
      ],
      solution: py`
class Solution:
    def hasCycle(self, head: Optional[ListNode]) -> bool:
        #@ Two runners start at the head: slow takes 1 step at a time, fast takes 2.
        slow, fast = head, head
        #@ fast reaching None means the list has an end. Otherwise move both runners.
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next  #!
            #@ In a loop, fast closes the gap by 1 each round, so it must land on slow.
            if slow is fast:  #!
                return True
        #@ fast ran off the end, so there is no cycle.
        return False`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy:
        'Without a cycle, fast reaches the end in about n/2 rounds. With one, fast catches slow within one lap after slow enters the loop. Only two pointers are stored.',
      pitfalls: [
        'Checking `slow is fast` before moving them: both start at the head, so it would return True at once.',
        'Checking only `fast` and not `fast.next` crashes on `fast.next.next` near the end of the list.',
        'Compare nodes with `is`, not values: two different nodes can hold the same value.',
      ],
    },
    {
      id: 'reorder-list',
      num: 143,
      title: 'Reorder List',
      difficulty: 'Medium',
      category: 'linked-list',
      pattern: 'Find middle + reverse + weave',
      prompt:
        'Rearrange a linked list **in place** so it goes: first node, last node, second node, second-to-last node, and so on. Change the links, not the values. The function returns nothing.',
      examples: [
        { input: 'head = [10, 20, 30, 40, 50]', output: '[10, 50, 20, 40, 30]', note: 'The list is changed in place.' },
        { input: 'head = [7, 8, 9, 10]', output: '[7, 10, 8, 9]' },
      ],
      signals: ['alternate between the front and the back', 'must modify the list in place', 'needs the second half in reverse order'],
      hints: [
        'You need to walk the back half backwards, but a singly linked list only goes forward. How could you fix that?',
        'Split the list at the middle and reverse the second half.',
        'Fast & slow pointers find the middle. Reverse the second half, then weave the halves together one node at a time.',
      ],
      brute:
        'Copy all nodes into a Python list, then use a front index and a back index to relink them. **O(n)** time but **O(n)** extra space.',
      insight:
        'The result is just the first half woven together with the **reversed** second half. Combine three basic moves: find the middle, reverse, merge alternately.',
      mnemonic: 'Split at the middle, reverse the back, zip together.',
      steps: [
        'Use slow and fast pointers to find the end of the first half.',
        'Cut the list after slow so the two halves are separate.',
        'Reverse the second half.',
        'Weave: link a node from the first half, then one from the reversed second half, and repeat.',
      ],
      solution: py`
class Solution:
    def reorderList(self, head: Optional[ListNode]) -> None:
        #@ Find the middle. When fast stops, slow sits on the last node of the first half.
        slow, fast = head, head.next
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        #@ Cut the list in two after slow.
        second = slow.next
        slow.next = None  #!
        #@ Reverse the second half with the standard prev / curr walk.
        prev = None
        while second:
            nxt = second.next
            second.next = prev
            prev, second = second, nxt
        #@ first walks the front half, second walks the reversed back half.
        first, second = head, prev
        #@ Save both next nodes, then link first to second and second to first's old next.
        while second:
            nxt1, nxt2 = first.next, second.next
            first.next = second  #!
            second.next = nxt1  #!
            first, second = nxt1, nxt2`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy:
        'Finding the middle, reversing and weaving each take one pass. Only a handful of pointers are used.',
      pitfalls: [
        'Forgetting `slow.next = None` leaves the halves connected, which creates a cycle while weaving.',
        'Losing nodes while weaving: save both `first.next` and `second.next` before relinking.',
        'Starting fast at `head.next` makes the first half equal to or one longer than the second, so the weave can stop when the second half runs out.',
      ],
    },
    {
      id: 'remove-nth-node-from-end-of-list',
      num: 19,
      title: 'Remove Nth Node From End of List',
      difficulty: 'Medium',
      category: 'linked-list',
      pattern: 'Two pointers with a fixed gap',
      prompt:
        'Delete the node that is `n` places from the **end** of a linked list (n = 1 means the last node) and return the head of the resulting list.',
      examples: [
        { input: 'head = [3, 6, 9, 12], n = 1', output: '[3, 6, 9]' },
        { input: 'head = [3, 6, 9, 12], n = 4', output: '[6, 9, 12]', note: 'The 4th node from the end is the head itself.' },
      ],
      signals: ['"n-th node from the end"', 'one pass preferred', 'the head itself might be deleted'],
      hints: [
        'The easy way needs the length first. Can you do it in a single pass?',
        'If two pointers are a fixed distance apart and the front one reaches the end, where is the back one?',
        'Start left at a dummy node and move right n steps ahead of head. Move both until right is None; left is then just before the node to delete.',
      ],
      brute:
        'Walk once to count the length L, then walk again to the node just before the target (position L - n, counting from 0) and unlink it. Still **O(n)**, but two passes; the gap trick needs only one.',
      insight:
        'Keep two pointers a fixed gap apart. When the front one falls off the end, the back one is sitting right **before** the node to remove.',
      mnemonic: 'Give right an n-step head start; delete after left.',
      steps: [
        'Create a dummy node in front of head.',
        'Put left on the dummy and right on head.',
        'Move right forward n steps.',
        'Move left and right together until right is None.',
        'Skip the target node: left.next = left.next.next.',
        'Return dummy.next.',
      ],
      solution: py`
class Solution:
    def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:
        #@ A dummy in front of head means deleting the head is a normal case.
        dummy = ListNode(0, head)
        #@ left starts on the dummy. right gets an n-step head start from head.
        left, right = dummy, head
        for _ in range(n):
            right = right.next  #!
        #@ Move both together; the gap between them never changes.
        while right:
            left = left.next
            right = right.next
        #@ right fell off the end, so left is just before the target. Skip over it.
        left.next = left.next.next  #!
        #@ Return the real head (it may be different if the old head was removed).
        return dummy.next`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy: 'right walks the list once and left trails behind it; no extra data structures.',
      pitfalls: [
        'Without a dummy node, deleting the head (n equal to the length) needs its own special case.',
        'Off by one: left must stop *before* the target, which is why it starts on the dummy, not on head.',
        'Return `dummy.next`, not `head`: the original head may have been deleted.',
      ],
    },
    {
      id: 'copy-list-with-random-pointer',
      num: 138,
      title: 'Copy List with Random Pointer',
      difficulty: 'Medium',
      category: 'linked-list',
      pattern: 'Hash map from original node to copy',
      alsoAccept: ['arrays-hashing'],
      prompt:
        'Each node in this linked list has a `next` pointer plus an extra `random` pointer that can point to **any** node in the list, or to `None`. Build a **deep copy**: brand-new nodes with the same values, wired the same way, sharing no nodes with the original.',
      examples: [
        {
          input: 'head = [[5, null], [8, 0], [2, 1]]',
          output: '[[5, null], [8, 0], [2, 1]]',
          note: 'Each pair is [value, index that random points to]. The copy has the same shape, but every node is new.',
        },
        { input: 'head = []', output: '[]' },
      ],
      signals: [
        '"deep copy"',
        'extra pointers that can point anywhere (forward, backward or None)',
        'a copied node may need to link to a copy that does not exist yet',
      ],
      hints: [
        'When you copy a node, its random target might not have been copied yet. How could you handle that?',
        'Work in two passes: first create every copy, then wire them up.',
        'Keep a dict mapping each original node to its copy. Then `copy.random = old_to_new[node.random]`.',
      ],
      brute:
        'For each node, find where its random pointer goes by walking from the head and counting positions, then walk the copy to the same position: **O(n²)** time.',
      insight:
        'A dict from **original node → its copy** translates any pointer in O(1). Create all the copies first, then fill in `next` and `random` by looking them up.',
      mnemonic: 'Clone every node first, then wire through the map.',
      steps: [
        'Create a dict that already maps None to None.',
        'First pass: for every original node, create a copy with the same value and store it in the dict.',
        "Second pass: point each copy's next at the copy of the original's next.",
        "In the same pass, point each copy's random at the copy of the original's random.",
        'Return the copy of head.',
      ],
      solution: py`
class Solution:
    def copyRandomList(self, head: 'Optional[Node]') -> 'Optional[Node]':
        #@ Map each original node to its copy. None maps to None, so missing links copy cleanly.
        old_to_new = {None: None}  #!
        #@ Pass 1: make a bare copy of every node (value only, no links yet).
        curr = head
        while curr:
            old_to_new[curr] = Node(curr.val)
            curr = curr.next
        #@ Pass 2: wire each copy by translating where the original points.
        curr = head
        while curr:
            copy = old_to_new[curr]
            copy.next = old_to_new[curr.next]  #!
            copy.random = old_to_new[curr.random]  #!
            curr = curr.next
        #@ The copy of the head is the head of the new list.
        return old_to_new[head]`,
      time: 'O(n)',
      space: 'O(n)',
      complexityWhy: 'Two passes over n nodes with O(1) dict lookups. The dict stores n entries.',
      pitfalls: [
        'Forgetting the `None: None` entry makes lookups crash on the last node and on `random` pointers that are `None`.',
        'Writing `copy.random = curr.random` points into the *original* list, so it is not a deep copy.',
        'An O(1)-extra-space version exists: weave each copy right after its original, set the randoms, then unweave. Good to know, but the hash map is the standard answer.',
      ],
    },
    {
      id: 'add-two-numbers',
      num: 2,
      title: 'Add Two Numbers',
      difficulty: 'Medium',
      category: 'linked-list',
      pattern: 'Digit-by-digit addition with carry',
      prompt:
        'Two non-negative whole numbers are stored as linked lists, one digit per node, with the **ones digit first** (the digits are in reverse order). Return their sum as a linked list in the same format.',
      examples: [
        { input: 'l1 = [9, 1, 6], l2 = [4, 8]', output: '[3, 0, 7]', note: '619 + 84 = 703, stored backwards.' },
        { input: 'l1 = [9, 9], l2 = [1]', output: '[0, 0, 1]', note: '99 + 1 = 100: the final carry adds a new node.' },
      ],
      signals: [
        'digits stored one per node',
        'reverse order (ones digit first), which is exactly the order you add by hand',
        'the two lists may have different lengths',
      ],
      hints: [
        'How do you add two numbers on paper? Which column do you start with?',
        'The ones digits are at the heads, so you can add column by column while walking both lists.',
        'Track a `carry`. For each column: total = digit1 + digit2 + carry; write `total % 10` and carry `total // 10`. Keep going while either list or the carry remains.',
      ],
      brute:
        'Turn each list into a Python integer, add them, and turn the sum back into a list. Python can do it thanks to big integers, but in most languages long inputs overflow, and it skips the point of the exercise.',
      insight:
        'Reverse order is a gift: the heads are the ones digits, so one walk adds column by column exactly like grade-school addition, building the answer behind a dummy node.',
      mnemonic: 'Add the column, keep the ones digit, carry the tens.',
      steps: [
        'Create a dummy node, a tail pointer and carry = 0.',
        'Loop while l1 or l2 has nodes left, or carry is not zero.',
        'Read each digit, using 0 for a list that has run out.',
        'Add the digits and the carry; append total % 10 as a new node and set carry to total // 10.',
        'Advance l1 and l2 if they have more nodes.',
        'Return dummy.next.',
      ],
      solution: py`
class Solution:
    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
        #@ A dummy node collects the answer digits. carry holds what spills into the next column.
        dummy = ListNode()
        tail = dummy
        carry = 0
        #@ Keep going while either list has digits OR a carry is still waiting to be written.
        while l1 or l2 or carry:  #!
            #@ A list that has run out counts as the digit 0.
            v1 = l1.val if l1 else 0
            v2 = l2.val if l2 else 0
            #@ Add the column like on paper: write the ones digit, carry the tens.
            total = v1 + v2 + carry
            carry = total // 10  #!
            tail.next = ListNode(total % 10)  #!
            tail = tail.next
            #@ Move to the next column in each list, if it has one.
            l1 = l1.next if l1 else None
            l2 = l2.next if l2 else None
        #@ Skip the dummy to return the ones digit of the sum.
        return dummy.next`,
      time: 'O(max(n, m))',
      space: 'O(1)',
      complexityWhy:
        'One pass over the longer list. Apart from the answer list itself, only a few variables are stored.',
      pitfalls: [
        'Stopping when both lists end but forgetting the leftover carry: 99 + 1 needs a third digit.',
        'Assuming both lists have the same length; treat a missing digit as 0.',
        'Storing `total` instead of `total % 10` in the new node.',
      ],
    },
    {
      id: 'find-the-duplicate-number',
      num: 287,
      title: 'Find the Duplicate Number',
      difficulty: 'Medium',
      category: 'linked-list',
      pattern: "Floyd's cycle detection on index links",
      alsoAccept: ['two-pointers'],
      prompt:
        'An array `nums` holds `n + 1` integers, and every value is between 1 and n, so some value must repeat. Exactly one value is repeated (possibly more than twice). Return it **without changing the array** and using only **O(1) extra space**.',
      examples: [
        { input: 'nums = [4, 1, 3, 4, 2]', output: '4' },
        { input: 'nums = [2, 6, 4, 1, 3, 1, 5]', output: '1', note: 'Two different indices hold the value 1.' },
      ],
      signals: [
        'n + 1 slots, every value between 1 and n',
        'do not modify the array, O(1) extra space',
        'every value is also a valid index',
      ],
      hints: [
        'Every value is a valid index. Think of `i → nums[i]` as an arrow from one index to another.',
        'If two indices hold the same value, two arrows point into the same spot. What shape does that create?',
        'It is a linked list with a cycle, and the duplicate is where the cycle starts. Use Floyd: meet inside the cycle, then restart one pointer at 0 and move both 1 step at a time until they meet.',
      ],
      brute:
        'A hash set finds it in **O(n)** time but needs **O(n)** space; sorting takes **O(n log n)** and changes the array. Both break the rules. (Binary search on the value range, counting values, works in **O(n log n)** time and O(1) space.)',
      insight:
        'Read the array as a linked list where index `i` points to index `nums[i]`. The duplicate value has two arrows pointing into it, so it is exactly the **entrance of a cycle**, and Floyd finds a cycle entrance in O(1) space.',
      mnemonic: 'Values are arrows; the duplicate is where the loop begins.',
      steps: [
        'Treat each index i as a node whose next is nums[i], starting from index 0.',
        'Move slow one step and fast two steps until they meet.',
        'Start a second pointer, finder, at index 0.',
        'Move finder and slow one step at a time until they meet.',
        'Return the meeting point: the cycle entrance is the duplicate.',
      ],
      solution: py`
class Solution:
    def findDuplicate(self, nums: List[int]) -> int:
        #@ Treat index i as a node whose next pointer is nums[i]. Both runners start at index 0.
        slow, fast = 0, 0
        #@ Phase 1: slow moves 1 step, fast moves 2, until they meet somewhere inside the cycle.
        while True:
            slow = nums[slow]
            fast = nums[nums[fast]]  #!
            if slow == fast:
                break
        #@ Phase 2: a new runner starts at index 0. Moving both 1 step at a time, they meet at the cycle entrance.
        finder = 0
        while finder != slow:
            finder = nums[finder]  #!
            slow = nums[slow]
        #@ Two indices point to the entrance, so the entrance is the duplicate value.
        return finder`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy:
        'Each phase takes at most a few trips around n + 1 indices. Only three integers are stored.',
      pitfalls: [
        'Starting at index 0 matters: no value is 0, so nothing points back to index 0, which keeps it outside the cycle.',
        'In phase 2, move **both** pointers one step at a time. If one still moved two steps, they would not meet at the entrance.',
        'Writing `fast = nums[fast]` (one step) instead of `nums[nums[fast]]` means fast never gains on slow, and the meeting point is wrong.',
      ],
    },
    {
      id: 'lru-cache',
      num: 146,
      title: 'LRU Cache',
      difficulty: 'Medium',
      category: 'linked-list',
      pattern: 'Hash map + doubly linked list',
      alsoAccept: ['arrays-hashing'],
      prompt:
        'Design a **Least Recently Used (LRU) cache** with a fixed `capacity`. `get(key)` returns the stored value, or -1 if the key is missing. `put(key, value)` inserts or updates a key; if that pushes the size over capacity, evict the key that was used (read or written) longest ago. Both operations must take **O(1)** average time.',
      examples: [
        {
          input: 'LRUCache(2), put(4, 40), put(7, 70), get(4), put(9, 90), get(7), get(9)',
          output: 'get(4) → 40, get(7) → -1, get(9) → 90',
          note: 'Reading 4 made it recent, so adding 9 evicted 7.',
        },
        {
          input: 'LRUCache(1), put(3, 30), put(5, 50), get(3), get(5)',
          output: 'get(3) → -1, get(5) → 50',
        },
      ],
      signals: ['"least recently used" eviction', 'get and put must both be O(1)', 'need fast lookup **and** a usage order'],
      hints: [
        'A dict gives O(1) lookup, but how would you know which key is the oldest?',
        'You need an order where you can move any item to the "newest" end and drop the "oldest" end, all in O(1).',
        'A doubly linked list does that if you can find each node instantly: store key → node in a dict. Add two sentinel nodes, `left` (oldest side) and `right` (newest side).',
      ],
      brute:
        'Keep the keys in a Python list ordered by use. Finding a key to move it to the end needs `list.remove`, which is **O(n)** per operation.',
      insight:
        'A dict maps each key to its node in a **doubly linked list** ordered from least to most recently used. The dict finds the node in O(1), and its prev/next links let you unlink it and move it to the recent end in O(1).',
      mnemonic: 'The dict finds the node; the list keeps the order.',
      steps: [
        'Store the capacity, a dict of key to node, and left/right sentinel nodes linked to each other.',
        'Write remove(node) to unlink a node from its two neighbours.',
        'Write insert(node) to add a node just before the right sentinel (most recent).',
        'get: if the key exists, move its node to the right end and return its value; otherwise return -1.',
        'put: remove any old node for the key, then insert a new node and store it in the dict.',
        'If the dict is over capacity, remove the node right after left and delete its key from the dict.',
      ],
      solution: py`
#@ LeetCode gives no node class here, so we write a tiny one. It stores its key so eviction can delete it from the dict.
class Node:
    def __init__(self, key, val):
        self.key, self.val = key, val
        self.prev = self.next = None


class LRUCache:
    #@ The dict maps key to node. left and right are sentinels: left.next is the oldest, right.prev the newest.
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {}
        self.left, self.right = Node(0, 0), Node(0, 0)
        self.left.next, self.right.prev = self.right, self.left

    #@ Helper: unlink a node by connecting its two neighbours to each other.
    def remove(self, node):
        prev, nxt = node.prev, node.next
        prev.next, nxt.prev = nxt, prev  #!

    #@ Helper: insert a node just before right, marking it the most recently used.
    def insert(self, node):
        prev, nxt = self.right.prev, self.right
        prev.next = nxt.prev = node
        node.prev, node.next = prev, nxt

    #@ get: a hit counts as a use, so move the node to the recent end before returning its value.
    def get(self, key: int) -> int:
        if key in self.cache:
            self.remove(self.cache[key])
            self.insert(self.cache[key])  #!
            return self.cache[key].val
        return -1

    #@ put: drop any old node for this key, then add a fresh node at the recent end.
    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.remove(self.cache[key])
        self.cache[key] = Node(key, value)
        self.insert(self.cache[key])
        #@ Over capacity? The least recently used node sits right after left: unlink it and forget its key.
        if len(self.cache) > self.cap:
            lru = self.left.next  #!
            self.remove(lru)
            del self.cache[lru.key]  #!`,
      time: 'O(1) per get and put',
      space: 'O(capacity)',
      complexityWhy:
        'Each operation is a dict lookup plus relinking a few pointers, all constant time. At most capacity + 1 nodes exist at once.',
      pitfalls: [
        'Each node must store its **key**: when you evict the oldest node, you need the key to delete it from the dict.',
        'Forgetting to move a node to the recent end on `get`: reading counts as using.',
        'Sentinels remove every `None` check: there is always a real node on both sides of anything you unlink or insert.',
        'In Python, `collections.OrderedDict` with `move_to_end` does the same job, but interviewers usually want you to build the list yourself.',
      ],
    },
    {
      id: 'merge-k-sorted-lists',
      num: 23,
      title: 'Merge k Sorted Lists',
      difficulty: 'Hard',
      category: 'linked-list',
      pattern: 'Divide and conquer pairwise merging',
      alsoAccept: ['heap'],
      prompt:
        'You get an array of `k` linked lists, each sorted in ascending order. Merge them all into **one sorted linked list** and return its head.',
      examples: [
        { input: 'lists = [[2, 6], [1, 4, 9], [3]]', output: '[1, 2, 3, 4, 6, 9]' },
        { input: 'lists = []', output: '[]' },
      ],
      signals: ['**k** sorted lists to combine', 'builds on Merge Two Sorted Lists', 'many nodes in total, but far fewer lists'],
      hints: [
        'You already know how to merge two sorted lists. How could that help with k?',
        'Merging the lists one by one into a growing result works but is slow: the early nodes get walked again on every merge.',
        'Merge in pairs, like a tournament: list 0 with 1, 2 with 3, and so on. Each round halves the number of lists, so there are only about log k rounds.',
      ],
      brute:
        'Merge list 1 into list 2, that result into list 3, and so on. The growing result is walked again each time, giving **O(N · k)** time for N total nodes. Dumping every value into an array and sorting costs **O(N log N)**.',
      insight:
        'Pair the lists up and merge each pair. Every round touches each node once and halves the number of lists, so the total is **O(N log k)**. A min-heap holding the k front nodes reaches the same bound.',
      mnemonic: 'Tournament bracket: merge pairs until one list remains.',
      steps: [
        'If there are no lists, return None.',
        'While more than one list remains, start an empty list of merged results.',
        'Take the lists two at a time, using None when the last one has no partner.',
        'Merge each pair with the two-list merge and collect the result.',
        'Replace the lists with the merged results and repeat.',
        'Return the single remaining list.',
      ],
      solution: py`
class Solution:
    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:
        #@ No lists at all means an empty result.
        if not lists:
            return None
        #@ Each round merges the lists in pairs, halving how many are left.
        while len(lists) > 1:
            merged = []
            #@ Take lists two at a time. An odd one out is merged with None, which leaves it unchanged.
            for i in range(0, len(lists), 2):
                l1 = lists[i]
                l2 = lists[i + 1] if i + 1 < len(lists) else None
                merged.append(self.mergeTwo(l1, l2))  #!
            #@ The merged lists become the input for the next round.
            lists = merged  #!
        #@ One list is left: the fully merged answer.
        return lists[0]

    #@ Helper: the two-list merge from earlier. A dummy node anchors the result.
    def mergeTwo(self, l1, l2):
        dummy = tail = ListNode()
        #@ Repeatedly attach the smaller front node.
        while l1 and l2:
            if l1.val <= l2.val:
                tail.next = l1
                l1 = l1.next
            else:
                tail.next = l2
                l2 = l2.next
            tail = tail.next
        #@ Attach whatever is left and skip the dummy.
        tail.next = l1 or l2
        return dummy.next`,
      time: 'O(N log k)',
      space: 'O(k)',
      complexityWhy:
        'There are about log k rounds, and each round walks all N nodes once. The list of merged heads holds at most k entries.',
      pitfalls: [
        'An empty input (`lists = []`) must return `None` before you touch `lists[0]`.',
        'With an odd number of lists, the last one has no partner; merging it with `None` simply returns it.',
        'Heap alternative: push `(node.val, i, node)` for each list head. The index `i` breaks ties so Python never tries to compare two `ListNode` objects.',
      ],
    },
    {
      id: 'reverse-nodes-in-k-group',
      num: 25,
      title: 'Reverse Nodes in k-Group',
      difficulty: 'Hard',
      category: 'linked-list',
      pattern: 'Group-by-group in-place reversal',
      prompt:
        'Reverse the nodes of a linked list **k at a time**: flip the first k nodes, then the next k, and so on. If fewer than k nodes remain at the end, leave them in their original order. Rewire the nodes (do not just swap values) and return the new head.',
      examples: [
        { input: 'head = [6, 7, 8, 9, 10], k = 3', output: '[8, 7, 6, 9, 10]', note: '9 and 10 are fewer than 3 nodes, so they stay put.' },
        { input: 'head = [6, 7, 8, 9], k = 2', output: '[7, 6, 9, 8]' },
      ],
      signals: ['reverse in fixed-size groups', 'a leftover partial group stays as it is', 'O(1) extra memory'],
      hints: [
        'Can you reverse just one group of k nodes and reconnect it to the rest of the list?',
        'Before reversing a group, check that k nodes really remain. Keep a pointer to the node just before the group.',
        'Reverse the group with prev starting at the node after the group, so the old first node automatically links onward. Then point the node before the group at the old k-th node.',
      ],
      brute:
        'Copy the values into an array, reverse each block of k, and write them back: **O(n)** time but **O(n)** extra space, and it swaps values instead of relinking nodes.',
      insight:
        'It is ordinary reversal, done one group at a time. A dummy node plus a `group_prev` pointer (the node before the current group) turns reconnecting each reversed group into a two-line job.',
      mnemonic: 'Find the kth, reverse the group, reconnect, slide on.',
      steps: [
        'Create a dummy node before head and set group_prev to it.',
        'Find the k-th node after group_prev; if it does not exist, stop.',
        'Remember group_next, the node right after the group.',
        'Reverse the group, starting prev at group_next.',
        'Point group_prev.next at the k-th node, then move group_prev to the old first node.',
        'Return dummy.next.',
      ],
      solution: py`
class Solution:
    def reverseKGroup(self, head: Optional[ListNode], k: int) -> Optional[ListNode]:
        #@ group_prev always sits just before the next group. It starts on a dummy in front of head.
        dummy = ListNode(0, head)
        group_prev = dummy
        #@ Find the k-th node of this group. Fewer than k nodes left? Leave them as they are.
        while True:
            kth = self.get_kth(group_prev, k)
            if not kth:  #!
                break
            group_next = kth.next
            #@ Reverse the group. Starting prev at group_next makes the old first node link onward.
            prev, curr = group_next, group_prev.next  #!
            while curr is not group_next:
                nxt = curr.next
                curr.next = prev
                prev, curr = curr, nxt
            #@ Reconnect: the node before the group now points at kth. The old first node is the new group_prev.
            old_first = group_prev.next
            group_prev.next = kth  #!
            group_prev = old_first
        #@ The dummy still points at the head of the rearranged list.
        return dummy.next

    #@ Helper: walk k steps from curr. Returns None if the list runs out first.
    def get_kth(self, curr, k):
        while curr and k > 0:
            curr = curr.next
            k -= 1
        return curr`,
      time: 'O(n)',
      space: 'O(1)',
      complexityWhy:
        'Each node is visited a constant number of times: once while finding the k-th node and once while reversing. Only pointers are stored.',
      pitfalls: [
        'Reversing a final group that has fewer than k nodes: always check that the k-th node exists first.',
        'Starting the reversal with `prev = None` cuts the group off from the rest of the list.',
        "Moving `group_prev` to `kth` instead of the old first node: after reversing, the old first node is the group's last.",
      ],
    },
  ],
};

export default content;
