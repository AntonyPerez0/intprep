// Wrong options that run exactly like the answer in a pattern template, found by hand (templates
// are not run by scripts/check-distractors.py). Keyed like src/content/distractorDeny.ts: the
// template's `contextKey` -> the answer line's `lineKey` -> the `lineKey`s of options never to
// offer for it (an option that means the same as one of these, by `canonKey`, is never offered
// either). `npm run validate` fails when a key no longer matches a template: after editing a
// template, recheck its entries and update the key it prints.

export const TEMPLATE_DENY: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
  // stack
  "qh8j6w": {
    // the stack only ever holds "(", so either end gives one
    "stack.pop()": ["stack.pop(0)"],
  },
  // trees
  "9gmzki": {
    // a node is never falsy
    "if not node:": ["if node is None:"],
    // a node is never falsy
    "if not root:": ["if root is None:"],
  },
  // intervals
  "ip9879": {
    // merging the first interval into itself changes nothing
    "for start,end in intervals[1:]:": ["for start,end in intervals[0:]:"],
    // an interval has two items: [-1] is [1]
    "last[1]=max(last[1],end)": ["last[-1]=max(last[1],end)"],
  },
  // graphs
  "90ebed": {
    // either root can go under the other
    "root_a,root_b=find(a),find(b)": ["root_b,root_a=find(a),find(b)"],
    // any node of the other group joins the groups
    "parent[root_a]=root_b": ["parent[root_a]=b"],
  },
  // dp-1d
  "jz173b": {
    // one spare cell is never read
    "dp=[1]*(n+1)": ["dp=[1]*(n+2)"],
    // the same number of steps
    "for _ in range(2,n+1):": ["for _ in range(3,n+2):","for _ in range(1,n):"],
  },
  // dp-2d
  "1kbyqe": {
    // spare cells are never read
    "dp=[[BASE]*(n+1)for _ in range(m+1)]": ["dp=[[BASE]*(n+2)for _ in range(m+1)]","dp=[[BASE]*(n+1)for _ in range(m+2)]","dp=[[BASE]*(n+2)for _ in range(m+2)]"],
    // the extra last step only rewrites the base row after dp[0][0] is done
    "for i in range(m-1,-1,-1):": ["for i in range(m-1,-2,-1):"],
  },
};
