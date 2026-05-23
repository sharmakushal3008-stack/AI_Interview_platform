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
  }
];

const CODING_QUESTIONS = [
  {
    question: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume each input has exactly one solution and you cannot use the same element twice.",
    type: "coding",
    difficulty: "easy",
    expectedKeyPoints: ["One-pass Hash Map approach", "O(N) time complexity", "O(N) space complexity", "Handling edge cases (empty array, no solution)"],
    followUpHints: ["Can you do it in less than O(N^2) time?", "How can a Hash Map help look up complement values?", "What is the space-time trade-off here?"]
  },
  {
    question: "Given a string `s`, find the length of the longest substring without repeating characters.",
    type: "coding",
    difficulty: "medium",
    expectedKeyPoints: ["Sliding window technique", "Two pointers", "Hash Map/Set for character index tracking", "O(N) time and space complexity"],
    followUpHints: ["Can you use two pointers to define a window?", "How do you update the left pointer when a duplicate is found?", "What happens if the string is empty or has all unique characters?"]
  },
  {
    question: "Implement a function to merge `k` sorted linked lists and return it as one sorted list. Analyze its complexity.",
    type: "coding",
    difficulty: "hard",
    expectedKeyPoints: ["Min-Heap / Priority Queue approach", "Divide and conquer list merging", "O(N log k) time complexity", "O(k) or O(1) auxiliary space"],
    followUpHints: ["How can a Min-Heap help track the smallest element across lists?", "Can you merge lists pair-by-pair recursively?", "What is the performance difference between heap and divide-and-conquer?"]
  },
  {
    question: "Given the root of a binary tree, invert the tree (mirror it) and return its root.",
    type: "coding",
    difficulty: "easy",
    expectedKeyPoints: ["Recursive DFS approach", "Iterative BFS (Queue) approach", "O(N) time complexity", "O(H) recursion stack space / O(W) queue space"],
    followUpHints: ["Can you solve this both recursively and iteratively?", "What is the base case for the recursion?", "How does queue-based level order traversal work here?"]
  },
  {
    question: "You are given an array of non-negative integers representing the heights of vertical walls. Find the maximum volume of water a container can hold between two walls.",
    type: "coding",
    difficulty: "medium",
    expectedKeyPoints: ["Two-pointer approach (start and end)", "Greedy pointer movement (moving smaller height)", "O(N) time complexity", "O(1) space complexity"],
    followUpHints: ["Can you avoid the O(N^2) brute force check?", "How does moving the shorter pointer guarantee finding the optimal volume?", "What mathematical formula represents the container area?"]
  },
  {
    question: "Given an input string `s` and a pattern `p`, implement regular expression matching with support for `.` and `*` where `.` matches any single character and `*` matches zero or more of the preceding element.",
    type: "coding",
    difficulty: "hard",
    expectedKeyPoints: ["Dynamic programming (2D table)", "Memoized recursion", "Handling wildcard `*` transitions", "O(M*N) time and space complexity"],
    followUpHints: ["What are the subproblems?", "How do you handle the 0-occurrence case of `*`?", "What is the base case when both s and p are empty?"]
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
    }
  ]
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

  // If pool is too small, backfill with other pools
  if (pool.length < count) {
    const backupPools = [
      ...BEHAVIORAL_QUESTIONS,
      ...CODING_QUESTIONS,
      ...SYSTEM_DESIGN_QUESTIONS,
      ...(TECHNICAL_QUESTIONS[roleGroup] || TECHNICAL_QUESTIONS.software_engineering)
    ];
    for (const q of shuffle(backupPools)) {
      if (pool.length >= count) break;
      if (!pool.some(existing => existing.question === q.question)) {
        pool.push(q);
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
  ROLE_GROUPS
};
