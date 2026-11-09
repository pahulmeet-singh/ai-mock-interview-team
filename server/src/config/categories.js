// Interview categories live in code (not a table) so the database stays at the four core entities.
// Keep ids in sync with the CHECK constraint in db/schema.sql.
export const CATEGORIES = [
  {
    id: 'frontend',
    title: 'Frontend engineering',
    summary: 'Components, rendering, state and browser fundamentals, as a React or web role probes them.',
    topics: ['React rendering and hooks', 'State management', 'CSS layout and accessibility', 'Browser performance', 'Web security basics'],
  },
  {
    id: 'backend',
    title: 'Backend and APIs',
    summary: 'Designing and debugging services: REST, authentication, data modelling and failure handling.',
    topics: ['REST design and status codes', 'Authentication and sessions', 'SQL and data modelling', 'Caching and queues', 'Error handling and logging'],
  },
  {
    id: 'system-design',
    title: 'System design',
    summary: 'Turn a vague product idea into components and defend every trade-off out loud.',
    topics: ['Requirements and capacity estimates', 'Data stores and partitioning', 'Caching and CDNs', 'Consistency and availability', 'Scaling and observability'],
  },
  {
    id: 'dsa',
    title: 'Data structures and algorithms',
    summary: 'Explain your approach, complexity and edge cases clearly, without an editor to hide behind.',
    topics: ['Arrays, strings and hashing', 'Trees and graphs', 'Recursion and dynamic programming', 'Sorting and searching', 'Complexity analysis'],
  },
  {
    id: 'cs-fundamentals',
    title: 'CS fundamentals',
    summary: 'The operating systems, database and networking questions that campus rounds keep returning to.',
    topics: ['Processes, threads and memory', 'DBMS, transactions and indexing', 'Networking and HTTP', 'OOP and design principles', 'Concurrency and deadlocks'],
  },
  {
    id: 'behavioral',
    title: 'Behavioral and HR',
    summary: 'Structure your stories, own your decisions and answer the questions that are about you.',
    topics: ['Tell me about yourself', 'Teamwork and conflict', 'Failure and feedback', 'Leadership and ownership', 'Motivation and career goals'],
  },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
export const DIFFICULTIES = ['foundation', 'intermediate', 'advanced'];
export const getCategory = (id) => CATEGORIES.find((c) => c.id === id);
