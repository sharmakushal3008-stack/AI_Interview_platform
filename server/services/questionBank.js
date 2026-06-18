/**
 * Local offline question bank fallback.
 * Provides a rich, randomized set of questions when Gemini API is rate-limited or unavailable.
 */

const ROLE_GROUPS = {
  software_engineering: [
    'Software Engineer',
    'Frontend Engineer',
    'Backend Engineer',
    'Full Stack Engineer'
  ],
  devops: [
    'DevOps Engineer',
    'Site Reliability Engineer',
    'Cloud Architect'
  ],
  data_ai: [
    'Data Scientist',
    'ML Engineer',
    'Data Engineer'
  ],
  leadership: [
    'Engineering Manager',
    'Staff Engineer',
    'CTO'
  ],
  security: [
    'Security Engineer',
    'Penetration Tester'
  ]
};

function getRoleGroup(role) {
  for (const [group, roles] of Object.entries(ROLE_GROUPS)) {
    if (roles.some(r => r.toLowerCase() === role.toLowerCase())) {
      return group;
    }
  }
  return 'software_engineering'; // Default fallback
}

// Helper to shuffle array in-place
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const BEHAVIORAL_QUESTIONS = [
  {
    question: "Describe a time when you had a conflict with a teammate or peer. How did you resolve it, and what was the outcome?",
    type: "behavioral",
    expectedKeyPoints: ["STAR method structure", "Active listening/empathy", "Professional conflict resolution", "Positive learning/outcome"],
    followUpHints: ["How did you approach the conversation?", "What did you do to understand their perspective?", "What was the long-term impact on your working relationship?"]
  },
  {
    question: "Tell me about a project you owned or led that failed or fell short of expectations. What went wrong, and what did you learn?",
    type: "behavioral",
    expectedKeyPoints: ["Owning responsibility", "Identifying root causes", "Constructive analysis", "Applying lessons to future projects"],
    followUpHints: ["What early signs did you miss?", "How did you communicate the failure to stakeholders?", "What did you change in your workflow afterward?"]
  },
  {
    question: "Describe a situation where you had to make a high-stakes decision with incomplete data or under tight deadlines.",
    type: "behavioral",
    expectedKeyPoints: ["Risk mitigation strategy", "Leveraging available signals", "Decisiveness", "Post-decision validation"],
    followUpHints: ["How did you manage ambiguity?", "What trade-offs did you prioritize?", "How did the decision pan out?"]
  },
  {
    question: "Tell me about a time you had to deliver difficult feedback to a colleague or manage an expectation gap with a stakeholder.",
    type: "behavioral",
    expectedKeyPoints: ["Radical candor / direct communication", "Focusing on behavior/facts not personality", "Constructive next steps", "Maintaining relationships"],
    followUpHints: ["How did they respond to the feedback?", "How did you prepare for that conversation?", "What was the final outcome?"]
  },
  {
    question: "Describe a time when you went above and beyond your standard responsibilities to solve a critical team or system issue.",
    type: "behavioral",
    expectedKeyPoints: ["Proactivity and ownership", "Cross-team collaboration", "Root-cause resolution", "Impact measurement"],
    followUpHints: ["What motivated you to step in?", "How did you balance this with your day-to-day work?", "Did this result in permanent process improvements?"]
  },
  {
    question: "Describe a time you disagreed with a technical direction or decision made by leadership. How did you handle the disagreement?",
    type: "behavioral",
    expectedKeyPoints: ["Data-backed counterproposal", "Professional disagreement", "Commitment to the final path (disagree and commit)", "Constructive dialogue"],
    followUpHints: ["How did you present your concerns?", "What was the final decision?", "How did you support the project after the decision?"]
  },
  {
    question: "Tell me about a time you had to adapt to a major change in project requirements or technology stack late in the development cycle.",
    type: "behavioral",
    expectedKeyPoints: ["Flexibility and open-mindedness", "Assessing impact of changes", "Re-planning and alignment", "Successful migration/delivery"],
    followUpHints: ["What were the primary challenges of the transition?", "How did you minimize disruption to the team?", "How did you handle user feedback during/after the transition?"]
  },
  {
    question: "Describe a time when you had to work with a difficult stakeholder or client. How did you manage their expectations and ensure project success?",
    type: "behavioral",
    expectedKeyPoints: ["Proactive communication", "Establishing clear boundaries and SLAs", "Empathizing with their constraints", "Securing sign-offs"],
    followUpHints: ["What were their main concerns?", "How did you establish trust?", "What mechanisms did you use to track feedback?"]
  },
  {
    question: "Tell me about a time you mentored or helped a team member grow. What approach did you take and what was the result?",
    type: "behavioral",
    expectedKeyPoints: ["Structured learning/guidance", "Patience and active listening", "Creating opportunities for execution", "Verifiable growth/independence"],
    followUpHints: ["How did you identify their specific needs?", "What feedback loop did you set up?", "How did their performance change?"]
  },
  {
    question: "Describe a situation where you had to prioritize multiple competing deadlines. How did you decide what to focus on?",
    type: "behavioral",
    expectedKeyPoints: ["Impact vs effort analysis", "Stakeholder communication and alignment", "Task delegation or scoping down", "Successful execution"],
    followUpHints: ["What framework did you use to assess priority?", "How did you handle tasks that had to be delayed?", "What did you learn about planning?"]
  }
];

const CODING_QUESTIONS = [
  {
    question: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume each input has exactly one solution and you cannot use the same element twice.",
    type: "coding",
    difficulty: "easy",
    expectedKeyPoints: ["One-pass Hash Map approach", "O(N) time complexity", "O(N) space complexity", "Handling edge cases (empty array, no solution)"],
    followUpHints: ["Can you do it in less than O(N^2) time?", "How can a Hash Map help look up complement values?", "What is the space-time trade-off here?"],
    functionName: "twoSum",
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  // Write your JavaScript code here\n  \n}`,
      python: `def twoSum(nums: list[int], target: int) -> list[int]:\n    # Write your Python code here\n    pass`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your Java code here\n        return new int[]{};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your C++ code here\n        return {};\n    }\n};`
    },
    referenceSolution: {
      javascript: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
      python: `def twoSum(nums: list[int], target: int) -> list[int]:\n    seen = {}\n    for i, n in enumerate(nums):\n        comp = target - n\n        if comp in seen: return [seen[comp], i]\n        seen[n] = i\n    return []`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> seen;\n        for (int i = 0; i < nums.size(); ++i) {\n            int comp = target - nums[i];\n            if (seen.count(comp)) return {seen[comp], i};\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int comp = target - nums[i];\n            if (seen.containsKey(comp)) return new int[]{seen.get(comp), i};\n            seen.put(nums[i], i);\n        }\n        return new int[]{};\n    }\n}`
    },
    testCases: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1], inputString: 'nums = [2,7,11,15], target = 9' },
      { input: [[3, 2, 4], 6], expected: [1, 2], inputString: 'nums = [3,2,4], target = 6' },
      { input: [[3, 3], 6], expected: [0, 1], inputString: 'nums = [3,3], target = 6' }
    ]
  },
  {
    question: "Given a string `s`, find the length of the longest substring without repeating characters.",
    type: "coding",
    difficulty: "medium",
    expectedKeyPoints: ["Sliding window technique", "Two pointers", "Hash Map/Set for character index tracking", "O(N) time and space complexity"],
    followUpHints: ["Can you use two pointers to define a window?", "How do you update the left pointer when a duplicate is found?", "What happens if the string is empty or has all unique characters?"],
    functionName: "lengthOfLongestSubstring",
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {\n  // Write your JavaScript code here\n  \n}`,
      python: `def lengthOfLongestSubstring(s: str) -> int:\n    # Write your Python code here\n    pass`,
      java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your Java code here\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write your C++ code here\n        return 0;\n    }\n};`
    },
    referenceSolution: {
      javascript: `function lengthOfLongestSubstring(s) {\n  let maxLen = 0, left = 0;\n  const seen = new Set();\n  for (let right = 0; right < s.length; right++) {\n    while (seen.has(s[right])) {\n      seen.delete(s[left]);\n      left++;\n    }\n    seen.add(s[right]);\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  return maxLen;\n}`,
      python: `def lengthOfLongestSubstring(s: str) -> int:\n    max_len, left = 0, 0\n    seen = set()\n    for right, char in enumerate(s):\n        while char in seen:\n            seen.remove(s[left])\n            left += 1\n        seen.add(char)\n        max_len = max(max_len, right - left + 1)\n    return max_len`,
      cpp: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        int maxLen = 0, left = 0;\n        unordered_set<char> seen;\n        for (int right = 0; right < s.length(); ++right) {\n            while (seen.count(s[right])) {\n                seen.erase(s[left]);\n                left++;\n            }\n            seen.insert(s[right]);\n            maxLen = max(maxLen, right - left + 1);\n        }\n        return maxLen;\n    }\n};`,
      java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        int maxLen = 0, left = 0;\n        Set<Character> seen = new HashSet<>();\n        for (int right = 0; right < s.length(); right++) {\n            while (seen.contains(s.charAt(right))) {\n                seen.remove(s.charAt(left));\n                left++;\n            }\n            seen.add(s.charAt(right));\n            maxLen = Math.max(maxLen, right - left + 1);\n        }\n        return maxLen;\n    }\n}`
    },
    testCases: [
      { input: ["abcabcbb"], expected: 3, inputString: 's = "abcabcbb"' },
      { input: ["bbbbb"], expected: 1, inputString: 's = "bbbbb"' },
      { input: ["pwwkew"], expected: 3, inputString: 's = "pwwkew"' }
    ]
  },
  {
    question: "Implement a function to merge `k` sorted linked lists and return it as one sorted list. Analyze its complexity.",
    type: "coding",
    difficulty: "hard",
    expectedKeyPoints: ["Min-Heap / Priority Queue approach", "Divide and conquer list merging", "O(N log k) time complexity", "O(k) or O(1) auxiliary space"],
    followUpHints: ["How can a Min-Heap help track the smallest element across lists?", "Can you merge lists pair-by-pair recursively?", "What is the performance difference between heap and divide-and-conquer?"],
    functionName: "mergeKLists",
    starterCode: {
      javascript: `function mergeKLists(lists) {\n  // Write your JavaScript code here\n  // Note: lists is represented as an array of arrays for simplicity\n  \n}`,
      python: `def mergeKLists(lists: list[list[int]]) -> list[int]:\n    # Write your Python code here\n    pass`,
      java: `class Solution {\n    public List<Integer> mergeKLists(List<List<Integer>> lists) {\n        // Write your Java code here\n        return new ArrayList<>();\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> mergeKLists(vector<vector<int>>& lists) {\n        // Write your C++ code here\n        return {};\n    }\n};`
    },
    referenceSolution: {
      javascript: `function mergeKLists(lists) {\n  return lists.flat().sort((a, b) => a - b);\n}`,
      python: `def mergeKLists(lists: list[list[int]]) -> list[int]:\n    import heapq\n    heap = []\n    for idx, l in enumerate(lists):\n        if l: heapq.heappush(heap, (l[0], idx, 0))\n    res = []\n    while heap:\n        val, list_idx, elem_idx = heapq.heappop(heap)\n        res.append(val)\n        if elem_idx + 1 < len(lists[list_idx]):\n            heapq.heappush(heap, (lists[list_idx][elem_idx + 1], list_idx, elem_idx + 1))\n    return res`,
      cpp: `class Solution {\npublic:\n    vector<int> mergeKLists(vector<vector<int>>& lists) {\n        priority_queue<pair<int, pair<int, int>>, vector<pair<int, pair<int, int>>>, greater<>> pq;\n        for (int i = 0; i < lists.size(); ++i) {\n            if (!lists[i].empty()) pq.push({lists[i][0], {i, 0}});\n        }\n        vector<int> res;\n        while (!pq.empty()) {\n            auto node = pq.top(); pq.pop();\n            res.push_back(node.first);\n            int list_idx = node.second.first;\n            int elem_idx = node.second.second;\n            if (elem_idx + 1 < lists[list_idx].size()) {\n                pq.push({lists[list_idx][elem_idx + 1], {list_idx, elem_idx + 1}});\n            }\n        }\n        return res;\n    }\n};`,
      java: `class Solution {\n    public List<Integer> mergeKLists(List<List<Integer>> lists) {\n        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);\n        for (int i = 0; i < lists.size(); i++) {\n            if (lists.get(i) != null && !lists.get(i).isEmpty()) {\n                pq.add(new int[] { lists.get(i).get(0), i, 0 });\n            }\n        }\n        List<Integer> res = new ArrayList<>();\n        while (!pq.isEmpty()) {\n            int[] curr = pq.poll();\n            res.add(curr[0]);\n            int listIdx = curr[1];\n            int elemIdx = curr[2];\n            if (elemIdx + 1 < lists.get(listIdx).size()) {\n                pq.add(new int[] { lists.get(listIdx).get(elemIdx + 1), listIdx, elemIdx + 1 });\n            }\n        }\n        return res;\n    }\n}`
    },
    testCases: [
      { input: [[[1,4,5],[1,3,4],[2,6]]], expected: [1,1,2,3,4,4,5,6], inputString: 'lists = [[1,4,5],[1,3,4],[2,6]]' },
      { input: [[]], expected: [], inputString: 'lists = []' },
      { input: [[[]]], expected: [], inputString: 'lists = [[]]' }
    ]
  },
  {
    question: "Given the root of a binary tree, invert the tree (mirror it) and return its root.",
    type: "coding",
    difficulty: "easy",
    expectedKeyPoints: ["Recursive DFS approach", "Iterative BFS (Queue) approach", "O(N) time complexity", "O(H) recursion stack space / O(W) queue space"],
    followUpHints: ["Can you solve this both recursively and iteratively?", "What is the base case for the recursion?", "How does queue-based level order traversal work here?"],
    functionName: "invertTree",
    starterCode: {
      javascript: `function invertTree(root) {\n  // Write your JavaScript code here\n  // Note: root is represented as a level-order array for simplicity\n  \n}`,
      python: `def invertTree(root: list) -> list:\n    # Write your Python code here\n    pass`,
      java: `class Solution {\n    public List<Integer> invertTree(List<Integer> root) {\n        // Write your Java code here\n        return new ArrayList<>();\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> invertTree(vector<int>& root) {\n        // Write your C++ code here\n        return {};\n    }\n};`
    },
    referenceSolution: {
      javascript: `function invertTree(root) {\n  if (!root || root.length === 0) return [];\n  const invert = (idx) => {\n    if (idx >= root.length || root[idx] === null) return;\n    const leftIdx = 2 * idx + 1;\n    const rightIdx = 2 * idx + 2;\n    if (leftIdx < root.length) {\n      const temp = root[leftIdx];\n      root[leftIdx] = rightIdx < root.length ? root[rightIdx] : null;\n      if (rightIdx < root.length) root[rightIdx] = temp;\n    }\n    invert(leftIdx);\n    invert(rightIdx);\n  };\n  invert(0);\n  return root.filter(v => v !== undefined);\n}`,
      python: `def invertTree(root: list) -> list:\n    if not root: return []\n    n = len(root)\n    def swap(idx):\n        left = 2 * idx + 1\n        right = 2 * idx + 2\n        if left < n:\n            if right < n:\n                root[left], root[right] = root[right], root[left]\n            swap(left)\n            swap(right)\n    swap(0)\n    return root`,
      cpp: `class Solution {\npublic:\n    vector<int> invertTree(vector<int>& root) {\n        if (root.empty()) return {};\n        int n = root.size();\n        auto swap_nodes = [&](auto& self, int idx) -> void {\n            int left = 2 * idx + 1;\n            int right = 2 * idx + 2;\n            if (left < n) {\n                if (right < n) swap(root[left], root[right]);\n                self(self, left);\n                self(self, right);\n            }\n        };\n        swap_nodes(swap_nodes, 0);\n        return root;\n    }\n};`,
      java: `class Solution {\n    public List<Integer> invertTree(List<Integer> root) {\n        if (root == null || root.isEmpty()) return new ArrayList<>();\n        int n = root.size();\n        invertHelper(root, 0, n);\n        return root;\n    }\n    private void invertHelper(List<Integer> root, int idx, int n) {\n        int left = 2 * idx + 1;\n        int right = 2 * idx + 2;\n        if (left < n) {\n            Integer temp = root.get(left);\n            root.set(left, right < n ? root.get(right) : null);\n            if (right < n) root.set(right, temp);\n            invertHelper(root, left, n);\n            invertHelper(root, right, n);\n        }\n    }\n}`
    },
    testCases: [
      { input: [[4,2,7,1,3,6,9]], expected: [4,7,2,9,6,3,1], inputString: 'root = [4,2,7,1,3,6,9]' },
      { input: [[2,1,3]], expected: [2,3,1], inputString: 'root = [2,1,3]' },
      { input: [[]], expected: [], inputString: 'root = []' }
    ]
  },
  {
    question: "You are given an array of non-negative integers representing the heights of vertical walls. Find the maximum volume of water a container can hold between two walls.",
    type: "coding",
    difficulty: "medium",
    expectedKeyPoints: ["Two-pointer approach (start and end)", "Greedy pointer movement (moving smaller height)", "O(N) time complexity", "O(1) space complexity"],
    followUpHints: ["Can you avoid the O(N^2) brute force check?", "How does moving the shorter pointer guarantee finding the optimal volume?", "What mathematical formula represents the container area?"],
    functionName: "maxArea",
    starterCode: {
      javascript: `function maxArea(height) {\n  // Write your JavaScript code here\n  \n}`,
      python: `def maxArea(height: list[int]) -> int:\n    # Write your Python code here\n    pass`,
      java: `class Solution {\n    public int maxArea(int[] height) {\n        // Write your Java code here\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        // Write your C++ code here\n        return 0;\n    }\n};`
    },
    referenceSolution: {
      javascript: `function maxArea(height) {\n  let maxW = 0, l = 0, r = height.length - 1;\n  while (l < r) {\n    const w = (r - l) * Math.min(height[l], height[r]);\n    maxW = Math.max(maxW, w);\n    if (height[l] < height[r]) l++;\n    else r--;\n  }\n  return maxW;\n}`,
      python: `def maxArea(height: list[int]) -> int:\n    max_w, l, r = 0, 0, len(height) - 1\n    while l < r:\n        w = (r - l) * min(height[l], height[r])\n        max_w = max(max_w, w)\n        if height[l] < height[r]: l += 1\n        else: r -= 1\n    return max_w`,
      cpp: `class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        int maxW = 0, l = 0, r = height.size() - 1;\n        while (l < r) {\n            maxW = max(maxW, (r - l) * min(height[l], height[r]));\n            if (height[l] < height[r]) l++;\n            else r--;\n        }\n        return maxW;\n    }\n};`,
      java: `class Solution {\n    public int maxArea(int[] height) {\n        int maxW = 0, l = 0, r = height.length - 1;\n        while (l < r) {\n            maxW = Math.max(maxW, (r - l) * Math.min(height[l], height[r]));\n            if (height[l] < height[r]) l++;\n            else r--;\n        }\n        return maxW;\n    }\n}`
    },
    testCases: [
      { input: [[1,8,6,2,5,4,8,3,7]], expected: 49, inputString: 'height = [1,8,6,2,5,4,8,3,7]' },
      { input: [[1,1]], expected: 1, inputString: 'height = [1,1]' },
      { input: [[4,3,2,1,4]], expected: 16, inputString: 'height = [4,3,2,1,4]' }
    ]
  },
  {
    question: "Given an input string `s` and a pattern `p`, implement regular expression matching with support for `.` and `*` where `.` matches any single character and `*` matches zero or more of the preceding element.",
    type: "coding",
    difficulty: "hard",
    expectedKeyPoints: ["Dynamic programming (2D table)", "Memoized recursion", "Handling wildcard `*` transitions", "O(M*N) time and space complexity"],
    followUpHints: ["What are the subproblems?", "How do you handle the 0-occurrence case of `*`?", "What is the base case when both s and p are empty?"],
    functionName: "isMatch",
    starterCode: {
      javascript: `function isMatch(s, p) {\n  // Write your JavaScript code here\n  \n}`,
      python: `def isMatch(s: str, p: str) -> bool:\n    # Write your Python code here\n    pass`,
      java: `class Solution {\n    public boolean isMatch(String s, String p) {\n        // Write your Java code here\n        return false;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    bool isMatch(string s, string p) {\n        // Write your C++ code here\n        return false;\n    }\n};`
    },
    referenceSolution: {
      javascript: `function isMatch(s, p) {\n  const dp = Array(s.length + 1).fill(0).map(() => Array(p.length + 1).fill(false));\n  dp[0][0] = true;\n  for (let j = 1; j <= p.length; j++) {\n    if (p[j - 1] === '*') dp[0][j] = dp[0][j - 2];\n  }\n  for (let i = 1; i <= s.length; i++) {\n    for (let j = 1; j <= p.length; j++) {\n      if (p[j - 1] === '.' || p[j - 1] === s[i - 1]) {\n        dp[i][j] = dp[i - 1][j - 1];\n      } else if (p[j - 1] === '*') {\n        dp[i][j] = dp[i][j - 2];\n        if (p[j - 2] === '.' || p[j - 2] === s[i - 1]) {\n          dp[i][j] = dp[i][j] || dp[i - 1][j];\n        }\n      }\n    }\n  }\n  return dp[s.length][p.length];\n}`,
      python: `def isMatch(s: str, p: str) -> bool:\n    dp = [[False] * (len(p) + 1) for _ in range(len(s) + 1)]\n    dp[0][0] = True\n    for j in range(1, len(p) + 1):\n        if p[j-1] == '*': dp[0][j] = dp[0][j-2]\n    for i in range(1, len(s) + 1):\n        for j in range(1, len(p) + 1):\n            if p[j-1] in (s[i-1], '.'):\n                dp[i][j] = dp[i-1][j-1]\n            elif p[j-1] == '*':\n                dp[i][j] = dp[i][j-2]\n                if p[j-2] in (s[i-1], '.'):\n                    dp[i][j] = dp[i][j] or dp[i-1][j]\n    return dp[len(s)][len(p)]`,
      cpp: `class Solution {\npublic:\n    bool isMatch(string s, string p) {\n        int m = s.length(), n = p.length();\n        vector<vector<bool>> dp(m + 1, vector<bool>(n + 1, false));\n        dp[0][0] = true;\n        for (int j = 1; j <= n; ++j) {\n            if (p[j-1] == '*') dp[0][j] = dp[0][j-2];\n        }\n        for (int i = 1; i <= m; ++i) {\n            for (int j = 1; j <= n; ++j) {\n                if (p[j-1] == '.' || p[j-1] == s[i-1]) {\n                    dp[i][j] = dp[i-1][j-1];\n                } else if (p[j-1] == '*') {\n                    dp[i][j] = dp[i][j-2];\n                    if (p[j-2] == '.' || p[j-2] == s[i-1]) {\n                        dp[i][j] = dp[i][j] || dp[i-1][j];\n                    }\n                }\n            }\n        }\n        return dp[m][n];\n    }\n};`,
      java: `class Solution {\n    public boolean isMatch(String s, String p) {\n        int m = s.length(), n = p.length();\n        boolean[][] dp = new boolean[m + 1][n + 1];\n        dp[0][0] = true;\n        for (int j = 1; j <= n; j++) {\n            if (p.charAt(j - 1) == '*') dp[0][j] = dp[0][j - 2];\n        }\n        for (int i = 1; i <= m; i++) {\n            for (int j = 1; j <= n; j++) {\n                if (p.charAt(j - 1) == '.' || p.charAt(j - 1) == s.charAt(i - 1)) {\n                    dp[i][j] = dp[i - 1][j - 1];\n                } else if (p.charAt(j - 1) == '*') {\n                    dp[i][j] = dp[i][j - 2];\n                    if (p.charAt(j - 2) == '.' || p.charAt(j - 2) == s.charAt(i - 1)) {\n                        dp[i][j] = dp[i][j] || dp[i - 1][j];\n                    }\n                }\n            }\n        }\n        return dp[m][n];\n    }\n}`
    },
    testCases: [
      { input: ["aa", "a"], expected: false, inputString: 's = "aa", p = "a"' },
      { input: ["aa", "a*"], expected: true, inputString: 's = "aa", p = "a*"' },
      { input: ["ab", ".*"], expected: true, inputString: 's = "ab", p = ".*"' }
    ]
  },
  {
    question: "Given a string containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets and in the correct order.",
    type: "coding",
    difficulty: "easy",
    expectedKeyPoints: ["Stack data structure", "O(N) time complexity", "O(N) space complexity", "Edge cases (empty string, only open brackets)"],
    followUpHints: ["How can a Stack help match closing brackets to their corresponding open brackets?", "What happens if you encounter a closing bracket when the stack is empty?", "Can you use a map to link closing brackets with their opening pairs?"],
    functionName: "isValid",
    starterCode: {
      javascript: `function isValid(s) {\n  // Write your JavaScript code here\n  \n}`,
      python: `def isValid(s: str) -> bool:\n    # Write your Python code here\n    pass`,
      java: `class Solution {\n    public boolean isValid(String s) {\n        // Write your Java code here\n        return false;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        // Write your C++ code here\n        return false;\n    }\n};`
    },
    referenceSolution: {
      javascript: `function isValid(s) {\n  const stack = [];\n  const pairs = { ')': '(', '}': '{', ']': '[' };\n  for (let char of s) {\n    if (char === '(' || char === '{' || char === '[') {\n      stack.push(char);\n    } else {\n      if (stack.length === 0 || stack.pop() !== pairs[char]) return false;\n    }\n  }\n  return stack.length === 0;\n}`,
      python: `def isValid(s: str) -> bool:\n    stack = []\n    pairs = {')': '(', '}': '{', ']': '['}\n    for char in s:\n        if char in ('(', '{', '['):\n            stack.append(char)\n        else:\n            if not stack or stack.pop() != pairs[char]: return False\n    return len(stack) == 0`,
      cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        stack<char> st;\n        unordered_map<char, char> pairs = {{')', '('}, {'}', '{'}, {']', '['}};\n        for (char c : s) {\n            if (c == '(' || c == '{' || c == '[') {\n                st.push(c);\n            } else {\n                if (st.empty() || st.top() != pairs[c]) return false;\n                st.pop();\n            }\n        }\n        return st.empty();\n    }\n};`,
      java: `class Solution {\n    public boolean isValid(String s) {\n        Stack<Character> stack = new Stack<>();\n        Map<Character, Character> pairs = new HashMap<>();\n        pairs.put(')', '('); pairs.put('}', '{'); pairs.put(']', '[');\n        for (char c : s.toCharArray()) {\n            if (c == '(' || c == '{' || c == '[') {\n                stack.push(c);\n            } else {\n                if (stack.isEmpty() || stack.pop() != pairs.get(c)) return false;\n            }\n        }\n        return stack.isEmpty();\n    }\n}`
    },
    testCases: [
      { input: ["()"], expected: true, inputString: 's = "()"' },
      { input: ["()[]{}"], expected: true, inputString: 's = "()[]{}"' },
      { input: ["(]"], expected: false, inputString: 's = "(]"' }
    ]
  },
  {
    question: "Given an array of integers `nums` sorted in non-decreasing order, find the starting and ending position of a given `target` value. If target is not found in the array, return `[-1, -1]`. You must write an algorithm with `O(log n)` runtime complexity.",
    type: "coding",
    difficulty: "medium",
    expectedKeyPoints: ["Binary Search (two passes or modified)", "O(log N) time complexity", "O(1) space complexity", "Correct boundary handling"],
    followUpHints: ["How can you modify standard binary search to find the leftmost boundary?", "How do you find the rightmost boundary?", "What is the condition to stop searching?"],
    functionName: "searchRange",
    starterCode: {
      javascript: `function searchRange(nums, target) {\n  // Write your JavaScript code here\n  \n}`,
      python: `def searchRange(nums: list[int], target: int) -> list[int]:\n    # Write your Python code here\n    pass`,
      java: `class Solution {\n    public int[] searchRange(int[] nums, int target) {\n        // Write your Java code here\n        return new int[]{-1, -1};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> searchRange(vector<int>& nums, int target) {\n        // Write your C++ code here\n        return {-1, -1};\n    }\n};`
    },
    referenceSolution: {
      javascript: `function searchRange(nums, target) {\n  const findBound = (leftBound) => {\n    let l = 0, r = nums.length - 1, idx = -1;\n    while (l <= r) {\n      const mid = Math.floor((l + r) / 2);\n      if (nums[mid] === target) {\n        idx = mid;\n        if (leftBound) r = mid - 1;\n        else l = mid + 1;\n      } else if (nums[mid] < target) l = mid + 1;\n      else r = mid - 1;\n    }\n    return idx;\n  };\n  return [findBound(true), findBound(false)];\n}`,
      python: `def searchRange(nums: list[int], target: int) -> list[int]:\n    def findBound(left_bound):\n        l, r, idx = 0, len(nums) - 1, -1\n        while l <= r:\n            mid = (l + r) // 2\n            if nums[mid] == target:\n                idx = mid\n                if left_bound: r = mid - 1\n                else: l = mid + 1\n            elif nums[mid] < target: l = mid + 1\n            else: r = mid - 1\n        return idx\n    return [findBound(True), findBound(False)]`,
      cpp: `class Solution {\npublic:\n    vector<int> searchRange(vector<int>& nums, int target) {\n        auto findBound = [&](bool leftBound) {\n            int l = 0, r = nums.size() - 1, idx = -1;\n            while (l <= r) {\n                int mid = l + (r - l) / 2;\n                if (nums[mid] == target) {\n                    idx = mid;\n                    if (leftBound) r = mid - 1;\n                    else l = mid + 1;\n                } else if (nums[mid] < target) l = mid + 1;\n                else r = mid - 1;\n            }\n            return idx;\n        };\n        return {findBound(true), findBound(false)};\n    }\n};`,
      java: `class Solution {\n    public int[] searchRange(int[] nums, int target) {\n        return new int[] { findBound(nums, target, true), findBound(nums, target, false) };\n    }\n    private int findBound(int[] nums, int target, boolean leftBound) {\n        int l = 0, r = nums.length - 1, idx = -1;\n        while (l <= r) {\n            int mid = l + (r - l) / 2;\n            if (nums[mid] == target) {\n                idx = mid;\n                if (leftBound) r = mid - 1;\n                else l = mid + 1;\n            } else if (nums[mid] < target) l = mid + 1;\n            else r = mid - 1;\n        }\n        return idx;\n    }\n}`
    },
    testCases: [
      { input: [[5,7,7,8,8,10], 8], expected: [3, 4], inputString: 'nums = [5,7,7,8,8,10], target = 8' },
      { input: [[5,7,7,8,8,10], 6], expected: [-1, -1], inputString: 'nums = [5,7,7,8,8,10], target = 6' },
      { input: [[], 0], expected: [-1, -1], inputString: 'nums = [], target = 0' }
    ]
  },
  {
    question: "Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the input intervals.",
    type: "coding",
    difficulty: "medium",
    expectedKeyPoints: ["Sorting by start time", "Iterative merging", "O(N log N) time complexity due to sorting", "O(N) or O(log N) auxiliary space"],
    followUpHints: ["Why is sorting the intervals helpful first?", "How do you check if the current interval overlaps with the previous one?", "How do you update the end boundary of the merged interval?"],
    functionName: "merge",
    starterCode: {
      javascript: `function merge(intervals) {\n  // Write your JavaScript code here\n  \n}`,
      python: `def merge(intervals: list[list[int]]) -> list[list[int]]:\n    # Write your Python code here\n    pass`,
      java: `class Solution {\n    public int[][] merge(int[][] intervals) {\n        // Write your Java code here\n        return new int[][]{};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        // Write your C++ code here\n        return {};\n    }\n};`
    },
    referenceSolution: {
      javascript: `function merge(intervals) {\n  if (intervals.length <= 1) return intervals;\n  intervals.sort((a, b) => a[0] - b[0]);\n  const merged = [intervals[0]];\n  for (let i = 1; i < intervals.length; i++) {\n    const last = merged[merged.length - 1];\n    if (intervals[i][0] <= last[1]) {\n      last[1] = Math.max(last[1], intervals[i][1]);\n    } else {\n      merged.push(intervals[i]);\n    }\n  }\n  return merged;\n}`,
      python: `def merge(intervals: list[list[int]]) -> list[list[int]]:\n    if len(intervals) <= 1: return intervals\n    intervals.sort(key=lambda x: x[0])\n    merged = [intervals[0]]\n    for i in range(1, len(intervals)):\n        if intervals[i][0] <= merged[-1][1]:\n            merged[-1][1] = max(merged[-1][1], intervals[i][1])\n        else:\n            merged.append(intervals[i])\n    return merged`,
      cpp: `class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        if (intervals.size() <= 1) return intervals;\n        sort(intervals.begin(), intervals.end());\n        vector<vector<int>> merged = {intervals[0]};\n        for (int i = 1; i < intervals.size(); ++i) {\n            if (intervals[i][0] <= merged.back()[1]) {\n                merged.back()[1] = max(merged.back()[1], intervals[i][1]);\n            } else {\n                merged.push_back(intervals[i]);\n            }\n        }\n        return merged;\n    }\n};`,
      java: `class Solution {\n    public int[][] merge(int[][] intervals) {\n        if (intervals.length <= 1) return intervals;\n        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);\n        List<int[]> merged = new ArrayList<>();\n        merged.add(intervals[0]);\n        for (int i = 1; i < intervals.length; i++) {\n            int[] last = merged.get(merged.size() - 1);\n            if (intervals[i][0] <= last[1]) {\n                last[1] = Math.max(last[1], intervals[i][1]);\n            } else {\n                merged.add(intervals[i]);\n            }\n        }\n        return merged.toArray(new int[merged.size()][]);\n    }\n}`
    },
    testCases: [
      { input: [[[1,3],[2,6],[8,10],[15,18]]], expected: [[1,6],[8,10],[15,18]], inputString: 'intervals = [[1,3],[2,6],[8,10],[15,18]]' },
      { input: [[[1,4],[4,5]]], expected: [[1,5]], inputString: 'intervals = [[1,4],[4,5]]' },
      { input: [[[1,4],[0,4]]], expected: [[0,4]], inputString: 'intervals = [[1,4],[0,4]]' }
    ]
  },
  {
    question: "Given a non-empty binary search tree (BST) and a target value, find the value in the BST that is closest to the target. You may assume that the closest value is unique.",
    type: "coding",
    difficulty: "easy",
    expectedKeyPoints: ["BST property traversal", "Tracking minimum difference", "O(H) time complexity (H is height of tree)", "O(1) space complexity for iterative approach"],
    followUpHints: ["How does the BST structure help you prune half the search space at each node?", "Can you do this iteratively to avoid recursion stack space?", "How do you update the closest value so far?"],
    functionName: "closestValue",
    starterCode: {
      javascript: `function closestValue(root, target) {\n  // Write your JavaScript code here\n  // Note: root is represented as a level-order array for simplicity\n  \n}`,
      python: `def closestValue(root: list, target: float) -> int:\n    # Write your Python code here\n    pass`,
      java: `class Solution {\n    public int closestValue(List<Integer> root, double target) {\n        // Write your Java code here\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int closestValue(vector<int>& root, double target) {\n        // Write your C++ code here\n        return 0;\n    }\n};`
    },
    referenceSolution: {
      javascript: `function closestValue(root, target) {\n  let closest = root[0];\n  let idx = 0;\n  while (idx < root.length && root[idx] !== null) {\n    const val = root[idx];\n    if (Math.abs(val - target) < Math.abs(closest - target)) {\n      closest = val;\n    }\n    if (target < val) idx = 2 * idx + 1;\n    else idx = 2 * idx + 2;\n  }\n  return closest;\n}`,
      python: `def closestValue(root: list, target: float) -> int:\n    closest = root[0]\n    idx = 0\n    while idx < len(root) and root[idx] is not None:\n        val = root[idx]\n        if abs(val - target) < abs(closest - target):\n            closest = val\n        if target < val: idx = 2 * idx + 1\n        else: idx = 2 * idx + 2\n    return closest`,
      cpp: `class Solution {\npublic:\n    int closestValue(vector<int>& root, double target) {\n        int closest = root[0];\n        int idx = 0;\n        while (idx < root.size() && root[idx] != -1) {\n            int val = root[idx];\n            if (abs(val - target) < abs(closest - target)) {\n                closest = val;\n            }\n            if (target < val) idx = 2 * idx + 1;\n            else idx = 2 * idx + 2;\n        }\n        return closest;\n    }\n};`,
      java: `class Solution {\n    public int closestValue(List<Integer> root, double target) {\n        int closest = root.get(0);\n        int idx = 0;\n        while (idx < root.size() && root.get(idx) != null) {\n            int val = root.get(idx);\n            if (Math.abs(val - target) < Math.abs(closest - target)) {\n                closest = val;\n            }\n            if (target < val) idx = 2 * idx + 1;\n            else idx = 2 * idx + 2;\n        }\n        return closest;\n    }\n}`
    },
    testCases: [
      { input: [[4,2,5,1,3], 3.714286], expected: 4, inputString: 'root = [4,2,5,1,3], target = 3.714286' },
      { input: [[1], 4.428571], expected: 1, inputString: 'root = [1], target = 4.428571' }
    ]
  }
];

const SYSTEM_DESIGN_QUESTIONS = [
  {
    question: "Design a scalable URL shortener service (like Bit.ly) that can handle millions of requests per day.",
    type: "system_design",
    difficulty: "easy",
    expectedKeyPoints: ["Base62 encoding", "Database schema (NoSQL or RDBMS with indexes)", "Hashing collision prevention", "Redirection redirection optimization (status 301 vs 302)"],
    followUpHints: ["How do you generate unique short keys?", "Where would caching fit in to speed up redirection?", "What is the expected read/write ratio?"]
  },
  {
    question: "Design a real-time collaborative document editing system like Google Docs, allowing multiple users to edit the same file simultaneously.",
    type: "system_design",
    difficulty: "hard",
    expectedKeyPoints: ["Operational Transformation (OT) or Conflict-Free Replicated Data Types (CRDTs)", "WebSockets / Server-Sent Events (SSE) for low latency updates", "Document state synchronization and merging", "Conflict resolution and offline synchronization"],
    followUpHints: ["How do you resolve concurrent conflicting edits at the same cursor position?", "How do you scale WebSocket connections across multiple servers?", "Where is document history stored?"]
  },
  {
    question: "Design a rate limiter for a public-facing API to prevent abuse and DDoS attacks.",
    type: "system_design",
    difficulty: "medium",
    expectedKeyPoints: ["Algorithms (Token Bucket, Leaky Bucket, Sliding Window Log)", "Redis for fast counter/timestamp storage", "Handling distributed rate limiting race conditions", "Error handling (HTTP 429 and headers)"],
    followUpHints: ["Which rate limiting algorithm would you choose and why?", "How do you avoid Redis synchronization bottlenecks?", "Can clients bypass it, and how do you protect against key spoofing?"]
  },
  {
    question: "Design a global notification system that supports sending real-time push notifications, emails, and SMS messages to billions of users.",
    type: "system_design",
    difficulty: "medium",
    expectedKeyPoints: ["Decoupled microservices architecture", "Message queues (Kafka/RabbitMQ) for asynchronous processing", "Handling provider failures (fallback and retries)", "De-duplication and idempotency keys"],
    followUpHints: ["How do you handle rate-limiting imposed by external SMS/email gateways?", "What happens if a user is offline when a push notification is sent?", "How do you ensure notifications are delivered in order?"]
  },
  {
    question: "Design a highly available and scalable video streaming platform like YouTube or Netflix.",
    type: "system_design",
    difficulty: "hard",
    expectedKeyPoints: ["Video chunking and multi-resolution transcoding pipeline", "Content Delivery Network (CDN) edge caching", "Adaptive Bitrate Streaming (HLS/DASH)", "Metadata database scaling (read-heavy optimizations)"],
    followUpHints: ["How do you handle video uploads vs playbacks?", "What metadata caching strategies would you use?", "How do CDNs minimize buffering and latency globally?"]
  },
  {
    question: "Design a scalable chat application like WhatsApp or Slack. Focus on real-time messaging, online/offline status, and message history.",
    type: "system_design",
    difficulty: "medium",
    expectedKeyPoints: ["WebSocket or MQTT connections", "Message queue / Broker (e.g. RabbitMQ/Kafka)", "Database choices (NoSQL/Cassandra for message history)", "Presence service for online/offline status"],
    followUpHints: ["How do you resolve concurrent conflicting edits?", "How do you scale WebSocket connections across servers?", "Where is presence state stored?"]
  },
  {
    question: "Design a web crawler that can traverse the entire web, download pages, extract links, and store them for search index building.",
    type: "system_design",
    difficulty: "hard",
    expectedKeyPoints: ["Distributed architecture (URL Frontier)", "Politeness policy (Robots.txt parsing)", "DNS caching and resolution bottlenecks", "De-duplication of content (simhash/fingerprinting)"],
    followUpHints: ["How do you prioritize crawling important pages?", "How do you handle cycle detection and traps?", "What database is suitable for crawled indices?"]
  },
  {
    question: "Design a proximity service like Yelp or Google Maps nearby search, allowing users to find businesses within a certain radius.",
    type: "system_design",
    difficulty: "medium",
    expectedKeyPoints: ["Spatial indexing (Geohash, Quadtree, or Google S2)", "Database optimization for spatial queries", "Read-heavy caching strategies", "Updating business locations efficiently"],
    followUpHints: ["How does Geohash partition the Earth?", "How do you handle queries near boundary edges?", "What caching layers should be added for static lists?"]
  },
  {
    question: "Design a distributed unique ID generator (like Twitter Snowflake) that can generate 64-bit unique IDs at high throughput with low latency.",
    type: "system_design",
    difficulty: "easy",
    expectedKeyPoints: ["Snowflake ID structure (Timestamp, Machine ID, Sequence number)", "Avoiding coordination bottlenecks (ZooKeeper)", "Handling NTP clock drift", "High availability and performance metrics"],
    followUpHints: ["Why are auto-increment keys problematic in distributed setups?", "How do we prevent duplicate IDs within the same millisecond?", "How does clock drift affect generators?"]
  },
  {
    question: "Design an API Gateway that handles authentication, rate limiting, routing, and request monitoring for internal microservices.",
    type: "system_design",
    difficulty: "medium",
    expectedKeyPoints: ["Reverse proxy and routing table", "Token validation (JWT/OAuth) at the edge", "Rate limiter integration", "Log aggregation and metric collection"],
    followUpHints: ["What is the logic overhead of an API Gateway?", "Should the gateway perform SSL termination?", "How do you handle backend service discovery?"]
  }
];

const TECHNICAL_QUESTIONS = {
  software_engineering: [
    {
      question: "Explain the difference between synchronous and asynchronous execution, and detail how the Event Loop handles tasks and microtasks in modern JavaScript engines.",
      type: "technical",
      difficulty: "easy",
      expectedKeyPoints: ["Single-threaded nature", "Call stack vs Callback Queue vs Microtask Queue", "Job queue priority (Promises vs setTimeout)", "Non-blocking I/O operations"],
      followUpHints: ["What runs first: a Promise callback or a setTimeout callback?", "What happens if a microtask schedules another microtask infinitely?", "How does Node.js libuv differ from browser event loops?"]
    },
    {
      question: "Compare REST APIs and GraphQL. Discuss their trade-offs in terms of network overhead, flexibility, client coupling, caching, and database query generation.",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Over-fetching and under-fetching", "N+1 query problem in GraphQL resolver execution", "HTTP caching (REST GET) vs custom client caching (GraphQL)", "Schema definition and contract safety"],
      followUpHints: ["How do you solve the N+1 query problem in GraphQL databases?", "How does caching work differently since GraphQL typically uses POST?", "When would you prefer REST over GraphQL?"]
    },
    {
      question: "How do you maintain data consistency and transaction integrity across multiple services in a distributed microservices architecture? Discuss the Saga pattern vs 2PC.",
      type: "technical",
      difficulty: "hard",
      expectedKeyPoints: ["Two-Phase Commit (2PC) blocking limits", "Saga Pattern (Orchestration vs Choreography)", "Compensating transactions", "Eventual consistency and Idempotent consumers"],
      followUpHints: ["What happens if a compensating transaction fails in a Saga?", "How do you handle out-of-order event delivery?", "What is an outbox pattern?"]
    },
    {
      question: "Explain the differences between SQL and NoSQL databases. When would you choose one over the other, and how do they handle ACID properties vs BASE properties?",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Relational vs Document/Key-Value/Columnar/Graph schemas", "ACID vs BASE consistency models", "Horizontal scaling (sharding) vs vertical scaling", "Use cases (e.g. financial transactions vs high-volume logs)"],
      followUpHints: ["How does indexing differ between SQL and NoSQL?", "What are the trade-offs of sharding a relational database?", "When is eventual consistency acceptable?"]
    },
    {
      question: "Describe the concept of garbage collection in modern programming languages. Compare generational GC (like in JVM or V8) with Reference Counting (like in Python or Swift).",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Mark-and-sweep algorithm", "Generational hypothesis (young vs old generations)", "Reference cycles and memory leaks", "Stop-the-world pauses vs concurrent/incremental GC"],
      followUpHints: ["How does reference counting handle cyclic references?", "What are garbage collection roots?", "How do you profile memory allocations?"]
    },
    {
      question: "Explain the Model-View-Controller (MVC) architecture pattern and compare it with Component-based architecture patterns (like React's virtual DOM reconciliation).",
      type: "technical",
      difficulty: "easy",
      expectedKeyPoints: ["Separation of concerns", "One-way data flow vs two-way data binding", "Virtual DOM and reconciliation diffing algorithm", "State management patterns (Redux/Context)"],
      followUpHints: ["What are the benefits of component encapsulations?", "How does virtual DOM diffing improve performance?", "Where does business logic belong in MVC?"]
    },
    {
      question: "What are WebSockets, and how do they differ from HTTP long polling, Server-Sent Events (SSE), and standard HTTP/2 multiplexing?",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Full-duplex persistent TCP connections", "Handshake protocol over HTTP", "Overhead comparison (headers size)", "Push communication models"],
      followUpHints: ["When is SSE more appropriate than WebSockets?", "How does HTTP/2 multiplexing work?", "What happens to WebSockets behind load balancers?"]
    },
    {
      question: "Explain the CAP theorem. For a distributed storage system, describe a scenario where you would prioritize Consistency (C) over Availability (A), and vice versa.",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Consistency, Availability, Partition tolerance definitions", "Network partitions are inevitable", "CP systems (e.g. ZooKeeper, HBase) vs AP systems (e.g. Cassandra, DynamoDB)", "Pacelc theorem expansion"],
      followUpHints: ["How does multi-master replication affect CAP choices?", "What is a split-brain scenario?", "Can a database be configured for both CP and AP modes?"]
    },
    {
      question: "Describe memory leaks in JavaScript/Node.js. How do you identify, debug, and resolve them in production applications?",
      type: "technical",
      difficulty: "hard",
      expectedKeyPoints: ["Accidental global variables", "Uncleared timers/callbacks", "Out-of-scope closures", "Profiling tools (Chrome DevTools, heap snapshots, clinic.js)"],
      followUpHints: ["What is a heap snapshot?", "How do closures retain outer scope variables in memory?", "What is the garbage collector's role in clearing leaks?"]
    },
    {
      question: "Explain the difference between Symmetric and Asymmetric cryptography. Provide practical examples of how each is used in modern secure software architectures.",
      type: "technical",
      difficulty: "easy",
      expectedKeyPoints: ["Shared key vs Public/Private key pair", "Performance differences (AES vs RSA/ECC)", "Key exchange protocols (Diffie-Hellman)", "Digital signatures and certificate verification"],
      followUpHints: ["Why do we use hybrid encryption in TLS?", "How are public keys distributed securely?", "What is the key size comparison?"]
    }
  ],
  devops: [
    {
      question: "Explain the core concepts of Continuous Integration (CI) and Continuous Deployment (CD). What are the key stages of a robust release pipeline?",
      type: "technical",
      difficulty: "easy",
      expectedKeyPoints: ["Automated testing and linting", "Artifact versioning and container registry storage", "Automated rollbacks", "Staging vs Production staging promotions"],
      followUpHints: ["How do you ensure secret keys are kept safe in your CI/CD runner?", "What is the difference between CD (Continuous Delivery) and CD (Continuous Deployment)?", "What gating mechanisms do you use before releasing to production?"]
    },
    {
      question: "Describe how you would design and execute a zero-downtime deployment strategy for a stateless containerized web application. Compare Blue-Green vs Canary.",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Blue-Green (instant swap, easy rollback)", "Canary (incremental traffic shift, risk mitigation)", "Database schema migration compatibility (expand/contract phase)", "Health checks and traffic routing"],
      followUpHints: ["What happens to active user sessions during a deployment?", "How do you handle migrations when the new deployment requires a column deletion?", "How do load balancers route traffic in Blue-Green?"]
    },
    {
      question: "Explain the design principles, networking model, and security best practices for orchestrating a multi-tenant enterprise Kubernetes cluster.",
      type: "technical",
      difficulty: "hard",
      expectedKeyPoints: ["Namespaces and NetworkPolicies", "RBAC configurations and ServiceAccounts", "Pod Security Standards (admission controllers)", "Resource quotas and limit ranges"],
      followUpHints: ["How do you isolate network traffic between namespaces?", "What is the role of an Ingress Controller vs a Service Mesh?", "How do you securely manage cluster secrets?"]
    },
    {
      question: "What is Infrastructure as Code (IaC)? Compare declarative vs imperative IaC tools (e.g., Terraform vs Ansible/Puppet).",
      type: "technical",
      difficulty: "easy",
      expectedKeyPoints: ["State management in Terraform", "Idempotency and reproducibility", "Declarative definition of target state", "Ad-hoc configuration vs provisioning"],
      followUpHints: ["How does Terraform manage locking?", "What are the risks of manual changes in an IaC ecosystem?", "How do you structure reusable modules?"]
    },
    {
      question: "Explain the DNS lookup process. What happens step-by-step when a client requests a domain name, and how does caching happen at different layers?",
      type: "technical",
      difficulty: "easy",
      expectedKeyPoints: ["Local hosts file and browser cache", "Recursive resolver", "Root, TLD, and Authoritative name servers", "TTL (Time to Live) records"],
      followUpHints: ["What is the difference between recursive and iterative DNS queries?", "How does DNS propagation work?", "What are common DNS record types?"]
    },
    {
      question: "Describe the containerization model of Docker. How do containers differ from Virtual Machines (VMs) in terms of resource utilization, kernel sharing, and boot times?",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Namespaces and Control Groups (cgroups)", "Shared host kernel vs hypervisor and guest OS", "Image layer caching and Union File System", "Isolation security trade-offs"],
      followUpHints: ["What namespaces provide process isolation?", "What is the overhead of a hypervisor in VMs?", "How do multi-stage builds optimize image size?"]
    },
    {
      question: "Explain the concept of GitOps. How does it improve deployment auditing, security, and disaster recovery compared to traditional CI/CD pushes?",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Git as the single source of truth", "Pull-based deployment agents (ArgoCD/Flux)", "Auto-reconciliation of drift", "Developer-centric workflow with pull requests"],
      followUpHints: ["Why is a pull-based model more secure?", "How do you handle secrets in GitOps?", "What happens when drift is detected?"]
    },
    {
      question: "Describe how you would design a highly available, multi-region architecture on AWS/GCP. How do you handle database replication and cross-region traffic routing?",
      type: "technical",
      difficulty: "hard",
      expectedKeyPoints: ["Anycast DNS (Route53/Cloud DNS)", "Multi-region active-active vs active-passive database replication", "Latency-based routing and health checks", "Data consistency latency and split-brain scenarios"],
      followUpHints: ["How does cross-region latency impact application performance?", "What is a split-brain scenario in databases?", "How do you test region failovers?"]
    },
    {
      question: "What is the Prometheus pull-based metrics collection model, and how does it compare to push-based monitoring systems? How do you scale metrics storage?",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Scraping targets via HTTP endpoints", "PushGateway for short-lived jobs", "Time Series Database (TSDB) characteristics", "Thanos/Cortex for long-term distributed storage"],
      followUpHints: ["Why does Prometheus use pull?", "What are the bottlenecks of pull scraping?", "How do metrics cardinality affect storage performance?"]
    },
    {
      question: "Explain the difference between L4 and L7 load balancing. When would you use each, and how do they impact TLS termination and session persistence?",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["TCP/UDP transport layer vs HTTP/HTTPS application layer routing", "TLS termination at L7 load balancer", "Header inspection (X-Forwarded-For, cookies)", "Performance efficiency of L4 routing"],
      followUpHints: ["Which load balancer supports sticky sessions?", "What is SNI in TLS routing?", "When is L4 load balancing preferred?"]
    }
  ],
  data_ai: [
    {
      question: "Explain the key differences between Supervised, Unsupervised, and Reinforcement Learning, and give real-world applications for each.",
      type: "technical",
      difficulty: "easy",
      expectedKeyPoints: ["Labeled vs Unlabeled training data", "Feedback loops and agent rewards", "Regression/Classification vs Clustering/Dimensionality reduction", "Examples (e.g. spam detection, customer segmentation, game playing)"],
      followUpHints: ["What happens if your supervised training dataset contains biased labels?", "What clustering algorithm would you use for non-spherical data?", "What are the core components of Reinforcement Learning?"]
    },
    {
      question: "What is class imbalance in machine learning classification tasks? How do you diagnose it, and what techniques do you use to address it at the data and model levels?",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Inadequacy of Accuracy metric (prefer F1-score, ROC-AUC)", "Resampling (SMOTE, random undersampling)", "Class weights / focal loss", "Ensemble methods (Balanced Random Forest)"],
      followUpHints: ["Why is accuracy misleading in fraud detection scenarios?", "How does SMOTE generate synthetic samples?", "What are the risks of over-sampling?"]
    },
    {
      question: "Explain the architecture of a Transformer model. Describe the self-attention mechanism, query-key-value vectors, and why this design scales better than LSTMs.",
      type: "technical",
      difficulty: "hard",
      expectedKeyPoints: ["Parallel execution vs sequential LSTM steps", "Scale-dot product attention formula", "Query, Key, Value mappings", "Positional encodings and feed-forward layers"],
      followUpHints: ["Why does self-attention have a quadratic O(N^2) complexity with sequence length?", "What role do multi-head attention blocks play?", "Why are positional encodings necessary?"]
    },
    {
      question: "Explain the difference between bagging and boosting ensemble methods. Give an example of an algorithm that uses each, and explain how they reduce bias and variance.",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Random Forest (Bagging) vs Gradient Boosting/XGBoost (Boosting)", "Parallel tree training vs sequential residual learning", "Reducing variance (bagging) vs reducing bias (boosting)", "Sensitivity to outliers and noisy data"],
      followUpHints: ["How does out-of-bag error work in random forests?", "Why is gradient boosting prone to overfitting if not tuned?", "What are hyper-parameters for trees?"]
    },
    {
      question: "What is the difference between L1 (Lasso) and L2 (Ridge) regularization? Explain their mathematical differences and how they affect the model's coefficients.",
      type: "technical",
      difficulty: "easy",
      expectedKeyPoints: ["Absolute vs squared penalty term", "L1 encourages sparsity (feature selection)", "L2 shrinks coefficients towards zero without eliminating them", "Geometric interpretation (diamond vs circle intersection)"],
      followUpHints: ["When would you choose Lasso over Ridge?", "What is Elastic Net?", "How does regularization prevent overfitting?"]
    },
    {
      question: "Explain the vanishing and exploding gradient problems in deep neural networks. Why do they occur, and what techniques (like activation functions, initialization, normalization) resolve them?",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Chain rule of backpropagation multiplying small/large weights", "Sigmoid/Tanh saturation vs ReLU/Leaky ReLU", "Xavier/He weight initialization", "Batch Normalization and Residual connections"],
      followUpHints: ["How do residual connections bypass vanishing gradients?", "What is gradient clipping?", "How does Batch Normalization normalize intermediate outputs?"]
    },
    {
      question: "Describe the concept of Retrieval-Augmented Generation (RAG). What are the main components of a RAG pipeline, and how does it help LLMs overcome hallucination?",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Document ingestion, chunking, and embedding generation", "Vector Database lookup", "Context injection into prompt", "Overcoming static knowledge limits and source citation"],
      followUpHints: ["What is semantic search vs keyword search?", "How do chunks influence vector recall accuracy?", "What are methods to evaluate RAG answer quality?"]
    },
    {
      question: "Explain the concept of cross-validation (e.g., K-fold cross-validation). Why is it used, and how does it help prevent overfitting and selection bias?",
      type: "technical",
      difficulty: "easy",
      expectedKeyPoints: ["Splitting data into training/validation folds recursively", "Estimating model performance generalization", "Data leakage detection", "Stratified K-fold for class imbalance"],
      followUpHints: ["What is nested cross-validation?", "Why should preprocessing be done within the cross-validation loop?", "What is Leave-One-Out CV?"]
    },
    {
      question: "Explain the differences between batch gradient descent, mini-batch gradient descent, and stochastic gradient descent (SGD). What are the convergence and speed trade-offs?",
      type: "technical",
      difficulty: "easy",
      expectedKeyPoints: ["Updating weights per epoch vs per batch vs per sample", "Computational efficiency of vectorization (mini-batch)", "Noise in updates helping escape local minima (SGD)", "Learning rate schedules"],
      followUpHints: ["What is batch size selection?", "Why does mini-batch converge faster than batch?", "What is momentum in SGD?"]
    },
    {
      question: "What is Dimensionality Reduction? Compare Principal Component Analysis (PCA) with t-SNE in terms of linearity, preservation of local/global structure, and use cases.",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Linear projection maximizing variance (PCA) vs non-linear probabilistic mapping (t-SNE)", "Preserving global distance (PCA) vs local clusters (t-SNE)", "Computational complexity", "Preprocessing vs visualization use cases"],
      followUpHints: ["How is the covariance matrix used in PCA?", "What is perplexity in t-SNE?", "Why is t-SNE not suitable for transforming test datasets?"]
    }
  ],
  leadership: [
    {
      question: "How do you define, align, and track performance goals (like OKRs) for your engineering team? How do you handle career progression conversations?",
      type: "technical",
      difficulty: "easy",
      expectedKeyPoints: ["Aligning team goals to company strategy", "Measurable Key Results (quantifiable metrics)", "Regular 1-on-1s and performance feedback", "Using career frameworks / matrices"],
      followUpHints: ["How do you handle an engineer who disagrees with their performance rating?", "How do you prevent goal gaming (cheating OKRs)?", "What is your frequency for review cycles?"]
    },
    {
      question: "Imagine you have a highly talented senior engineer who delivers excellent technical results but is toxic to team morale and communication. How do you handle this?",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Direct and timely feedback on behavioral issues", "Setting clear behavioral expectations and boundaries", "Evaluating overall team impact over individual output", "Performance Improvement Plan (PIP) if behavior doesn't change"],
      followUpHints: ["How do you document these soft-skill issues?", "What coaching techniques would you apply?", "At what point do you escalate this to HR or consider termination?"]
    },
    {
      question: "Describe your framework for managing and prioritizing technical debt. How do you pitch technical refactoring to non-technical business stakeholders?",
      type: "technical",
      difficulty: "hard",
      expectedKeyPoints: ["Tech debt categorization (deliberate vs accidental)", "Quantifying impact (velocity slowdown, outage costs)", "Allocating a fixed percentage of capacity (e.g., 20%) to engineering hygiene", "Translating tech benefits to business metrics (reliability, speed to market)"],
      followUpHints: ["How do you track tech debt items?", "What happens if product managers refuse to allocate time for tech debt?", "How do you measure developer velocity?"]
    },
    {
      question: "How do you manage an underperforming engineer? Walk through your steps from identifying the issue to setting up a performance improvement plan (PIP) or offboarding.",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Gathering concrete objective data and examples", "Early alignment in 1-on-1s to diagnose root causes (personal/skills/motivation)", "Setting clear, measurable targets with timelines", "Formalizing PIP as a supportive but firm path"],
      followUpHints: ["What indicators point to skill vs motivation issues?", "How long should a PIP typically last?", "How do you align stakeholders during offboarding?"]
    },
    {
      question: "Describe your strategy for scaling an engineering team. How do you handle hiring, onboarding, and preserving culture during rapid growth?",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Defining clear skill rubrics and structured interviewing", "Systematic buddy system and 30-60-90 day onboarding plans", "Documentation of cultural values and engineering practices", "Splitting teams dynamically (Conway's Law alignment)"],
      followUpHints: ["How do you minimize hiring biases?", "What metrics track onboarding success?", "How do you scale communication channels?"]
    },
    {
      question: "How do you handle conflict between engineering and product management regarding roadmap priorities, specifically balancing feature delivery with technical debt?",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Collaborative negotiation and transparent trade-offs", "Translating engineering work into business outcomes (risk/speed/reliability)", "Establishing shared metrics (SLOs, developer velocity)", "Allocating dedicated capacity ratios (e.g. 70/20/10)"],
      followUpHints: ["How do you handle critical features delayed by tech debt?", "How do you build trust with product partners?", "What is your metric for technical health?"]
    },
    {
      question: "Describe a situation where a critical production outage occurred under your watch. How did you coordinate the incident response and the post-incident review (post-mortem)?",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Designating incident commander role and communication channels", "Focusing on mitigation first, root cause later", "Blameless post-mortem culture", "Action items tracking to prevent recurrence"],
      followUpHints: ["Who is kept updated during an outage?", "How are action items prioritized after an incident?", "What makes a post-mortem 'blameless'?"]
    },
    {
      question: "What is your approach to delegation? How do you decide which tasks to delegate to senior engineers versus junior engineers, and how do you monitor progress without micro-managing?",
      type: "technical",
      difficulty: "easy",
      expectedKeyPoints: ["Task maturity model matching engineer capability", "Senior: high-ambiguity ownership; Junior: structured execution with mentorship", "Establishing clear check-in checkpoints and definitions of done", "Focusing on outcomes rather than implementation details"],
      followUpHints: ["What are signs of micro-management?", "How do you support an engineer failing a delegated task?", "How do you gauge work progress?"]
    },
    {
      question: "How do you manage remote or distributed engineering teams across different time zones? What processes and tools do you put in place to ensure collaboration and cohesion?",
      type: "technical",
      difficulty: "easy",
      expectedKeyPoints: ["Asynchronous-first documentation and communication", "Establishing core overlapping hours", "Explicit hand-off protocols for multi-time-zone tasks", "Fostering psychological safety and virtual team bonds"],
      followUpHints: ["How do you handle language barriers?", "What async tools do you use?", "How do you replace 'watercooler' chat?"]
    },
    {
      question: "Explain your framework for making architecture decisions (e.g., microservices vs monolith, choosing a new framework). How do you align the team and document these choices?",
      type: "technical",
      difficulty: "hard",
      expectedKeyPoints: ["Architecture Decision Records (ADRs)", "Prototyping/RFC process for feedback", "Cost-benefit-risk analysis", "Long-term maintenance and training overhead"],
      followUpHints: ["Who makes the final decision when team consensus fails?", "How do you handle deprecated architecture choices?", "Where are ADRs stored?"]
    }
  ],
  security: [
    {
      question: "Explain what Cross-Site Scripting (XSS) is, the different types (Stored, Reflected, DOM-based), and how you prevent them in modern web applications.",
      type: "technical",
      difficulty: "easy",
      expectedKeyPoints: ["Malicious script injection into trust pages", "Input validation and context-aware output encoding", "Content Security Policy (CSP) headers", "Using framework-native protections (e.g. React jsx escaping)"],
      followUpHints: ["How does CSP mitigate XSS?", "What is the difference between Reflected and Stored XSS?", "Why is `dangerouslySetInnerHTML` risky?"]
    },
    {
      question: "Explain the mechanics of HTTPS. How does it leverage both symmetric and asymmetric encryption to establish a secure connection?",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["TLS Handshake protocol", "Asymmetric encryption (RSA/ECDHE) for key exchange/agreement", "Symmetric encryption (AES) for session data transfer", "CA certificates and digital signatures for authentication"],
      followUpHints: ["What is Forward Secrecy?", "How does a client verify that a server's certificate is valid?", "What happens if a certificate authority's root key is compromised?"]
    },
    {
      question: "Explain SQL injection (SQLi) and Blind SQL injection. How do they differ, how do you exploit/detect them, and how do you remediate them?",
      type: "technical",
      difficulty: "hard",
      expectedKeyPoints: ["Injecting SQL fragments to manipulate database queries", "Blind SQLi: extracting data through boolean checks or time delays", "Parameterized queries / Prepared statements (Remediation)", "ORM usage and input escaping limits"],
      followUpHints: ["How does a time-based blind SQL injection work?", "Why are dynamic SQL builds in stored procedures still vulnerable?", "What tools (e.g. SQLmap) automate this detection?"]
    },
    {
      question: "What is OAuth 2.0? Describe the main authorization flows (Authorization Code, Client Credentials, Implicit) and when to use each.",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Roles: Resource Owner, Client, Authorization Server, Resource Server", "Authorization Code flow with PKCE for single-page/mobile apps", "Client credentials for machine-to-machine integration", "Access tokens vs Refresh tokens"],
      followUpHints: ["Why is the implicit flow deprecated?", "What security benefits does PKCE add?", "What is the difference between OAuth 2.0 and OIDC?"]
    },
    {
      question: "Explain the concept of Principle of Least Privilege (PoLP) and how it applies to cloud infrastructure security (IAM policies, role-based access).",
      type: "technical",
      difficulty: "easy",
      expectedKeyPoints: ["Minimizing attack surface by limiting permissions", "Role-Based Access Control (RBAC) vs Attribute-Based Access Control (ABAC)", "Temporary/Just-In-Time access elevation", "Auditing and removing unused permissions"],
      followUpHints: ["How do you implement PoLP in an IAM policy?", "What is a wildcard permission risk?", "How do you audit cloud resource usage?"]
    },
    {
      question: "Describe how a Cross-Site Request Forgery (CSRF) attack works. What mechanisms (like anti-CSRF tokens and SameSite cookie attributes) protect against it?",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Exploiting ambient credentials (session cookies) on third-party sites", "Anti-CSRF tokens (synchronizer pattern) validation on POST requests", "SameSite cookies (Lax/Strict) preventing automatic cookie transmission on cross-site requests", "Custom request headers bypassed by CORS constraints"],
      followUpHints: ["Can CSRF occur on GET APIs?", "How does SameSite Lax differ from Strict?", "Why does API-token-based headers protect SPA backend requests?"]
    },
    {
      question: "Explain the difference between static application security testing (SAST), dynamic application security testing (DAST), and software composition analysis (SCA).",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Code scanning without execution (SAST) vs scanning running application (DAST)", "Identifying vulnerabilities in third-party libraries (SCA)", "Integration checkpoints in CI/CD pipeline", "False positive handling"],
      followUpHints: ["Where in the pipeline should SAST be integrated?", "Why does DAST have high false-positive rates?", "How does SCA detect outdated dependencies?"]
    },
    {
      question: "Describe how a Distributed Denial of Service (DDoS) attack works at different layers of the OSI model, and how you design systems to mitigate them.",
      type: "technical",
      difficulty: "hard",
      expectedKeyPoints: ["L3/L4 volumetric attacks (SYN flood, UDP amplification)", "L7 application attacks (HTTP flood, slowloris)", "CDN caching and rate-limiting at edge", "Anycast routing and cloud-based DDoS scrubbing (e.g. Cloudflare)"],
      followUpHints: ["How does a SYN flood attack exploit the TCP handshake?", "What is an amplification attack?", "How do CDNs block volumetric traffic?"]
    },
    {
      question: "What is Threat Modeling, and how would you apply a framework like STRIDE to analyze the security of a newly proposed microservice?",
      type: "technical",
      difficulty: "hard",
      expectedKeyPoints: ["Decomposing system using Data Flow Diagrams (DFDs)", "STRIDE categories: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege", "Risk assessment and prioritizing mitigations", "Continuous review process"],
      followUpHints: ["Who should participate in a threat modeling session?", "How do you rate the severity of threats?", "When should threat models be updated?"]
    },
    {
      question: "Explain the concept of Zero Trust architecture. What are its core pillars, and how does it differ from traditional perimeter-based network security?",
      type: "technical",
      difficulty: "medium",
      expectedKeyPoints: ["Never trust, always verify philosophy", "Microsegmentation of networks", "Continuous authentication and authorization", "Device posture checks and context-aware access"],
      followUpHints: ["What is the perimeter-based network model?", "How does microsegmentation prevent lateral movement?", "What is context-aware authorization?"]
    }
  ]
};

const ROUND_TYPE_POOLS = {
  behavioral: BEHAVIORAL_QUESTIONS,
  coding: CODING_QUESTIONS,
  system_design: SYSTEM_DESIGN_QUESTIONS,
  hr: BEHAVIORAL_QUESTIONS // fallback HR to behavioral
};

/**
 * Main selector function. Returns exactly `count` questions.
 */
function getOfflineQuestions({ role, level, roundType, skills = [], count = 8 }) {
  const roleGroup = getRoleGroup(role);
  let pool = [];

  // Determine which categories to pull from
  if (roundType === 'behavioral') {
    pool = [...BEHAVIORAL_QUESTIONS];
  } else if (roundType === 'coding') {
    pool = [...CODING_QUESTIONS];
  } else if (roundType === 'system_design') {
    pool = [...SYSTEM_DESIGN_QUESTIONS];
  } else if (roundType === 'technical') {
    pool = [...(TECHNICAL_QUESTIONS[roleGroup] || TECHNICAL_QUESTIONS.software_engineering)];
  } else {
    // Mixed round
    // 30% behavioral, 35% technical, 35% system design/coding
    const bhCount = Math.max(1, Math.floor(count * 0.3));
    const techCount = Math.max(1, Math.floor(count * 0.35));
    const sysCount = count - bhCount - techCount;

    const bhPool = shuffle(BEHAVIORAL_QUESTIONS).slice(0, bhCount);
    const techPool = shuffle(TECHNICAL_QUESTIONS[roleGroup] || TECHNICAL_QUESTIONS.software_engineering).slice(0, techCount);
    const sysPool = shuffle([...SYSTEM_DESIGN_QUESTIONS, ...CODING_QUESTIONS]).slice(0, sysCount);

    pool = [...bhPool, ...techPool, ...sysPool];
  }

  // Shuffle the pool initially
  pool = shuffle(pool);

  // If pool is too small, backfill ONLY with questions matching the roundType
  if (pool.length < count) {
    const isMixed = !['behavioral', 'coding', 'system_design', 'technical', 'hr'].includes(roundType);
    
    let backupPool = [];
    if (isMixed) {
      backupPool = [
        ...BEHAVIORAL_QUESTIONS,
        ...CODING_QUESTIONS,
        ...SYSTEM_DESIGN_QUESTIONS,
        ...(TECHNICAL_QUESTIONS[roleGroup] || TECHNICAL_QUESTIONS.software_engineering)
      ];
    } else {
      backupPool = (roundType === 'technical')
        ? (TECHNICAL_QUESTIONS[roleGroup] || TECHNICAL_QUESTIONS.software_engineering)
        : (ROUND_TYPE_POOLS[roundType] || BEHAVIORAL_QUESTIONS);
    }

    // Try to fill with unique questions first
    for (const q of shuffle(backupPool)) {
      if (pool.length >= count) break;
      if (!pool.some(existing => existing.question === q.question)) {
        // Deep copy/clone to prevent mutating shared objects
        pool.push(JSON.parse(JSON.stringify(q)));
      }
    }

    // If still not enough, allow duplicates (for specific rounds with small pools)
    while (pool.length < count && backupPool.length > 0) {
      const shuffledBackup = shuffle(backupPool);
      for (const q of shuffledBackup) {
        if (pool.length >= count) break;
        pool.push(JSON.parse(JSON.stringify(q)));
      }
    }
  }

  // Define target difficulty counts (e.g., for count=8, easy=2, medium=3, hard=3)
  const targetEasyCount = Math.floor(count * 0.3);
  const targetMediumCount = Math.floor(count * 0.4);
  const targetHardCount = count - targetEasyCount - targetMediumCount;

  // Split gathered pool by difficulty
  // If questions don't have a difficulty (like behavioral), assign default level difficulty or distribute them
  const easyPool = pool.filter(q => q.difficulty === 'easy');
  const mediumPool = pool.filter(q => q.difficulty === 'medium');
  const hardPool = pool.filter(q => q.difficulty === 'hard');
  const unassignedPool = pool.filter(q => !q.difficulty);

  // Distribute unassigned questions (e.g. behavioral) to match required difficulties
  unassignedPool.forEach((q, idx) => {
    if (idx % 3 === 0) {
      q.difficulty = 'easy';
      easyPool.push(q);
    } else if (idx % 3 === 1) {
      q.difficulty = 'medium';
      mediumPool.push(q);
    } else {
      q.difficulty = 'hard';
      hardPool.push(q);
    }
  });

  // Select questions based on difficulty target
  const selected = [];
  const selectFromSubPool = (subPool, targetCount, defaultDiff) => {
    let gathered = 0;
    while (subPool.length > 0 && gathered < targetCount) {
      const q = subPool.pop();
      q.difficulty = q.difficulty || defaultDiff;
      selected.push(q);
      gathered++;
    }
    return targetCount - gathered; // remaining needed
  };

  let remainingEasy = targetEasyCount;
  let remainingMedium = targetMediumCount;
  let remainingHard = targetHardCount;

  remainingEasy = selectFromSubPool(easyPool, remainingEasy, 'easy');
  remainingMedium = selectFromSubPool(mediumPool, remainingMedium, 'medium');
  remainingHard = selectFromSubPool(hardPool, remainingHard, 'hard');

  // If there's still empty slots (because some difficulty was short), fill from anything left
  const leftovers = [...easyPool, ...mediumPool, ...hardPool];
  while (leftovers.length > 0 && selected.length < count) {
    const q = leftovers.pop();
    selected.push(q);
  }

  // Ensure we limit to exactly `count`
  const finalQuestions = selected.slice(0, count);

  // Post-processing: Replace placeholders with candidate's actual skills if available
  const skillList = skills.length > 0 ? skills : ['modern tools', 'Git', 'databases', 'cloud deployment'];
  finalQuestions.forEach((q, idx) => {
    const pickedSkill = skillList[idx % skillList.length];
    // If the question text contains generic phrases like "languages/frameworks", inject actual skills
    q.question = q.question.replace(/Node\.js/g, pickedSkill)
                           .replace(/JavaScript/g, pickedSkill)
                           .replace(/React/g, pickedSkill);
    
    // Add default values if missing
    q.timeLimit = q.timeLimit || 180;
    q.expectedKeyPoints = q.expectedKeyPoints || ["Clear communication", "Structured approach", "Addressing key requirements"];
    q.followUpHints = q.followUpHints || ["Can you elaborate on your choices?", "What alternative solutions did you consider?"];
  });

  return finalQuestions;
}

module.exports = {
  getOfflineQuestions,
  ROLE_GROUPS,
  CODING_QUESTIONS
};
