// Deterministic stand-ins for Gemini, used when GEMINI_MOCK=true (demos without a key, tests, quota trouble).
const BANK = {
  frontend: [
    ['Walk me through what happens between calling setState in React and the updated UI appearing on screen.', 'Rendering and reconciliation'],
    ['A list of 2,000 rows scrolls badly. How would you find the cause, and what would you try first?', 'Performance'],
    ['When would you reach for useReducer or a global store instead of useState, and what does each cost you?', 'State management'],
    ['How do you make a custom dropdown usable with a keyboard and a screen reader?', 'Accessibility'],
    ['Explain how a cross-site scripting attack works and the layers you would use to defend a React app.', 'Web security'],
  ],
  backend: [
    ['Design the REST endpoints for booking a time slot. Which verbs, status codes and error shapes would you use?', 'REST design'],
    ['Where would you keep a login session, a JWT in localStorage or an HttpOnly cookie, and why?', 'Authentication'],
    ['Two users try to book the same slot at the same instant. How do you guarantee only one succeeds?', 'Data integrity'],
    ['A query that was fast last month now takes seconds. How do you diagnose it, and what are your usual fixes?', 'SQL and indexing'],
    ['Your service calls a third-party API that sometimes times out. How do you keep your own API healthy?', 'Resilience'],
  ],
  'system-design': [
    ['Design a URL shortener. Start with requirements and rough numbers before you draw any boxes.', 'Requirements'],
    ['Where would a cache sit in that design, and how do you stop it serving stale data?', 'Caching'],
    ['How would you store and look up billions of short links, and how would you partition the data?', 'Data storage'],
    ['One link suddenly gets a million clicks a minute. What breaks first, and what do you do?', 'Scaling'],
    ['What would you monitor so you hear about problems before your users report them?', 'Observability'],
  ],
  dsa: [
    ['Explain how you would find two numbers in an array that add up to a target, and compare two approaches.', 'Arrays and hashing'],
    ['When is a hash map the wrong choice, and what would you use instead?', 'Data structure choice'],
    ['Describe how you would detect a cycle in a linked list and why your method works.', 'Linked lists'],
    ['Pick a problem where dynamic programming beats plain recursion. How do you spot it and define the state?', 'Dynamic programming'],
    ['How do you choose between BFS and DFS on a graph? Give a case where the wrong choice costs you.', 'Graph traversal'],
  ],
  'cs-fundamentals': [
    ['What is the difference between a process and a thread, and what does a context switch cost?', 'Operating systems'],
    ['Explain ACID with an example, and say what can go wrong if isolation is relaxed.', 'Transactions'],
    ['What happens, step by step, from typing a URL into the browser until the page renders?', 'Networking'],
    ['How can two threads deadlock, and what are two ways to prevent it?', 'Concurrency'],
    ['When can adding an index make a query slower, and how does a B-tree index actually help?', 'Indexing'],
  ],
  behavioral: [
    ['Tell me about yourself in two minutes, as if I have only read the top of your resume.', 'Introduction'],
    ['Describe a time you disagreed with a teammate. What did you do, and how did it end?', 'Conflict'],
    ['Tell me about a project that did not go as planned. What would you do differently?', 'Failure and learning'],
    ['Describe feedback that was hard to hear. What did you change afterwards?', 'Feedback'],
    ['Why this role, and where do you want to be in three years?', 'Motivation'],
  ],
};

export function mockQuestions(category, count) {
  const bank = BANK[category] ?? BANK.frontend;
  return Array.from({ length: count }, (_, i) => {
    const [prompt, topic] = bank[i % bank.length];
    return { prompt, topic };
  });
}

const words = (text) => text.trim().split(/\s+/).filter(Boolean).length;
const round1 = (n) => Math.round(n * 10) / 10;
const clamp = (n) => Math.max(0, Math.min(10, round1(n)));

// Scores follow answer length and coverage only. It is a placeholder, and the summary says so.
export function mockEvaluation(items) {
  const perQuestion = items.map(({ index, answer }) => {
    const count = words(answer);
    const score = count === 0 ? 0 : Math.min(9, round1(2.5 + Math.sqrt(count) * 0.85));
    return {
      index,
      score,
      feedback:
        count === 0
          ? 'No answer was submitted for this question.'
          : count < 25
            ? 'You are on the right track, but the answer is too short to show real understanding. Add a concrete example and explain why, not just what.'
            : 'A solid, well-developed answer. To lift it further, state the trade-offs explicitly and close with a one-line summary.',
      betterAnswer:
        'Open with a one-sentence definition, walk through the mechanism step by step, then give one concrete example and name a trade-off.',
    };
  });

  const answered = perQuestion.filter((p) => p.score > 0);
  const average = answered.length ? answered.reduce((sum, p) => sum + p.score, 0) / answered.length : 0;
  const coverage = answered.length / items.length;
  const base = average * coverage;

  return {
    scores: {
      technicalAccuracy: clamp(base),
      depth: clamp(base - 0.6),
      problemSolving: clamp(base - 0.2),
      communication: clamp(average + 0.3 - (1 - coverage) * 3),
      structure: clamp(base + 0.1),
    },
    summary: `Demo evaluation: this report was generated without the AI service, from answer length and coverage only. You answered ${answered.length} of ${items.length} questions.`,
    strengths: [
      answered.length ? 'You committed to an answer instead of leaving questions blank.' : 'You opened the session and reviewed the questions.',
      'Your answers were readable and stayed on topic.',
    ],
    weaknesses: [
      coverage < 1 ? 'Some questions were left unanswered, which scores zero.' : 'Several answers could go deeper into trade-offs.',
      'Concrete examples were rare. Interviewers remember examples, not definitions.',
    ],
    recommendations: [
      'Practise answering out loud in under two minutes, then write the answer down.',
      'For each topic, prepare one real example from a project you built.',
      'Retake this category in a week and compare the scorecards.',
    ],
    perQuestion,
  };
}
