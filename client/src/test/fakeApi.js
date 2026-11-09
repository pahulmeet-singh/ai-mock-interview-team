import { AxiosError } from 'axios';
import { api } from '@/lib/api';

// A tiny in-memory API for tests: replaces Axios's network adapter, so the REAL hooks, interceptors and components
// run, and only the HTTP call is faked. Each handler is keyed by "METHOD /path".

export const user = { id: 'u1', name: 'Asha Verma', email: 'asha@example.com', targetRole: 'Frontend developer', createdAt: '2026-10-01T00:00:00.000Z' };

export const categories = [
  { id: 'frontend', title: 'Frontend engineering', summary: 'Components, rendering and state.', topics: ['React rendering and hooks', 'CSS layout'] },
  { id: 'backend', title: 'Backend and APIs', summary: 'REST, auth and data modelling.', topics: ['REST design', 'SQL'] },
];

const scores = (n) => ({ technicalAccuracy: n, depth: n - 1, problemSolving: n, communication: n + 1, structure: n });

export const feedbacks = [
  { id: 'f1', interviewId: 'i1', overallScore: 7.4, scores: scores(7.4), summary: 'Strong.', strengths: ['Clear'], weaknesses: ['Shallow'], recommendations: ['Practise'], model: 'test', createdAt: '2026-10-25T10:00:00.000Z', interview: { category: 'frontend', difficulty: 'intermediate', scheduledAt: '2026-10-25T05:30:00.000Z' } },
  { id: 'f2', interviewId: 'i0', overallScore: 5.6, scores: scores(5.6), summary: 'Okay.', strengths: ['Readable'], weaknesses: ['Thin'], recommendations: ['Examples'], model: 'test', createdAt: '2026-10-11T10:00:00.000Z', interview: { category: 'backend', difficulty: 'intermediate', scheduledAt: '2026-10-11T05:30:00.000Z' } },
];

export const detailedFeedback = {
  ...feedbacks[0],
  perQuestion: [
    { index: 0, score: 8, question: 'Explain what happens after setState.', topic: 'Rendering', answer: 'React re-renders the component.', feedback: 'Accurate and complete.', betterAnswer: 'Queue, batch, render, commit.' },
    { index: 1, score: 6.5, question: 'How do you speed up a long list?', topic: 'Performance', answer: '', feedback: 'No answer was given.', betterAnswer: 'Profile, memoise, virtualise.' },
  ],
};

export const slots = {
  timezone: 'Asia/Kolkata',
  slotMinutes: 60,
  days: [
    {
      date: '2026-10-31',
      slots: [
        { startsAt: '2026-10-31T04:30:00.000Z', status: 'open' },
        { startsAt: '2026-10-31T05:30:00.000Z', status: 'taken' },
        { startsAt: '2026-10-31T06:30:00.000Z', status: 'open' },
      ],
    },
  ],
};

export const inProgress = {
  id: 'i2', category: 'frontend', difficulty: 'intermediate', scheduledAt: '2026-10-31T04:30:00.000Z', durationMinutes: 45, status: 'in_progress', canStart: false,
  opensAt: '2026-10-31T04:20:00.000Z', closesAt: '2026-10-31T05:00:00.000Z', startedAt: '2026-10-31T04:31:00.000Z', endsAt: '2099-01-01T00:00:00.000Z',
  submittedAt: null, createdAt: '2026-10-20T00:00:00.000Z', resume: null, feedback: null,
  questions: [
    { prompt: 'Walk me through what happens after setState.', topic: 'Rendering' },
    { prompt: 'How would you speed up a slow list?', topic: 'Performance' },
  ],
  answers: {},
};

export const upcoming = { ...inProgress, id: 'i3', status: 'booked', canStart: true, startedAt: null, endsAt: null, questions: [], answers: {} };

const httpError = (status, message, config) =>
  new AxiosError(message, 'ERR_BAD_REQUEST', config, null, { status, data: { error: { status, message } }, config, headers: {}, statusText: String(status) });

export function installFakeApi({ signedIn = true, resumes = [], handlers = {} } = {}) {
  const state = { signedIn, resumes, calls: [] };

  const table = {
    'GET /auth/me': () => ({ user: state.signedIn ? user : null }),
    'POST /auth/login': (config) => {
      if (JSON.parse(config.data).password === 'wrong-pass1') throw httpError(401, 'Incorrect email or password.', config);
      state.signedIn = true;
      return { user };
    },
    'POST /auth/logout': () => null,
    'GET /categories': () => ({ categories, difficulties: ['foundation', 'intermediate', 'advanced'] }),
    'GET /slots': () => slots,
    'GET /interviews': () => ({ interviews: [upcoming] }),
    'GET /interviews/i2': () => ({ interview: inProgress }),
    'PUT /interviews/i2/answers': () => ({ savedAt: '2026-10-31T04:35:00.000Z' }),
    'GET /interviews/i1/feedback': () => ({ feedback: detailedFeedback }),
    'GET /feedbacks': () => ({ feedbacks }),
    'GET /resumes': () => ({ resumes: state.resumes }),
    ...handlers,
  };

  api.defaults.adapter = async (config) => {
    const key = `${config.method.toUpperCase()} ${config.url.split('?')[0]}`;
    state.calls.push(key);
    const handler = table[key];
    if (!handler) throw httpError(404, `No fake handler for ${key}`, config);
    const data = handler(config);
    return { data, status: data === null ? 204 : 200, statusText: 'OK', headers: {}, config, request: {} };
  };

  return state;
}
