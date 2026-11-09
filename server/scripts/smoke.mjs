// End-to-end smoke test for a RUNNING API: auth, booking, double-booking guard, AI session, feedback, resumes.
//
//   1. Start the API (ideally with GEMINI_MOCK=true and SLOT_ENFORCE_WINDOW=false in server/.env)
//   2. npm run smoke            (optionally: API_URL=http://localhost:5000/api npm run smoke)
//
// Every step prints ok / FAIL. It creates a throwaway user and leaves no resumes behind.

const BASE = process.env.API_URL ?? 'http://localhost:5000/api';
let cookie = '';
let passed = 0;
let failed = 0;

async function call(method, path, body, { headers = {}, csrf = true } = {}) {
  const isForm = body instanceof FormData;
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(csrf && { 'X-Requested-With': 'XMLHttpRequest' }),
      ...(body && !isForm && { 'Content-Type': 'application/json' }),
      ...(cookie && { Cookie: cookie }),
      ...headers,
    },
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  if (setCookie.length) cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data, setCookie };
}

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};
const expectStatus = (res, status) => expect(res.status === status, `expected ${status}, got ${res.status}: ${JSON.stringify(res.data)}`);

async function step(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok    ${name}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL  ${name}\n        ${err.message}`);
  }
}

const email = `smoke.${Date.now()}@example.com`;
const state = {};

console.log(`Smoke test against ${BASE}\n`);

await step('health check', async () => expectStatus(await call('GET', '/health'), 200));
await step('anonymous /auth/me answers { user: null } (200)', async () => {
  const res = await call('GET', '/auth/me');
  expectStatus(res, 200);
  expect(res.data.user === null, 'expected user: null');
});
await step('a protected endpoint answers 401 when signed out', async () => expectStatus(await call('GET', '/interviews'), 401));
await step('state-changing request without X-Requested-With is 403', async () => {
  expectStatus(await call('POST', '/auth/login', { email, password: 'x' }, { csrf: false }), 403);
});
await step('weak password is rejected with field errors (422)', async () => {
  const res = await call('POST', '/auth/register', { name: 'Smoke Test', email, password: 'short' });
  expectStatus(res, 422);
  expect(res.data.error.fieldErrors?.password, 'expected a password field error');
});
await step('register creates a user and an HttpOnly cookie (201)', async () => {
  const res = await call('POST', '/auth/register', { name: 'Smoke Test', email, password: 'Smoke#1234', targetRole: 'Tester' });
  expectStatus(res, 201);
  expect(res.data.user.email === email, 'wrong user returned');
  expect(res.setCookie.some((c) => /httponly/i.test(c)), 'auth cookie is not HttpOnly');
  expect(!('passwordHash' in res.data.user), 'password hash leaked');
});
await step('duplicate email is 409', async () => {
  expectStatus(await call('POST', '/auth/register', { name: 'Smoke Test', email, password: 'Smoke#1234' }), 409);
});
await step('/auth/me returns the user', async () => {
  const res = await call('GET', '/auth/me');
  expectStatus(res, 200);
  expect(res.data.user.email === email, 'wrong user');
});
await step('categories lists six categories', async () => {
  const res = await call('GET', '/categories');
  expectStatus(res, 200);
  expect(res.data.categories.length === 6, `got ${res.data.categories.length}`);
});
await step('slots returns open slots', async () => {
  const res = await call('GET', '/slots');
  expectStatus(res, 200);
  const open = res.data.days.flatMap((d) => d.slots).filter((s) => s.status === 'open');
  expect(open.length >= 3, 'need at least 3 open slots');
  state.slots = open.map((s) => s.startsAt);
});
await step('booking a slot returns 201 and a Location header', async () => {
  const res = await call('POST', '/interviews', { category: 'frontend', difficulty: 'intermediate', scheduledAt: state.slots[0] });
  expectStatus(res, 201);
  expect(res.data.interview.status === 'booked', 'status should be booked');
  state.interviewId = res.data.interview.id;
});
await step('booking the same slot again is 409 (database guard)', async () => {
  expectStatus(await call('POST', '/interviews', { category: 'backend', difficulty: 'foundation', scheduledAt: state.slots[0] }), 409);
});
await step('a time that is not a slot is 422', async () => {
  expectStatus(await call('POST', '/interviews', { category: 'frontend', difficulty: 'intermediate', scheduledAt: '2030-01-01T00:07:00.000Z' }), 422);
});
await step('the slot now shows as "mine"', async () => {
  const res = await call('GET', '/slots');
  const slot = res.data.days.flatMap((d) => d.slots).find((s) => s.startsAt === state.slots[0]);
  expect(slot?.status === 'mine', `status was ${slot?.status}`);
});
await step('cancelling frees the slot for rebooking', async () => {
  const booked = await call('POST', '/interviews', { category: 'dsa', difficulty: 'foundation', scheduledAt: state.slots[1] });
  expectStatus(booked, 201);
  const cancelled = await call('PATCH', `/interviews/${booked.data.interview.id}`, { status: 'cancelled' });
  expectStatus(cancelled, 200);
  expect(cancelled.data.interview.status === 'cancelled', 'not cancelled');
  expectStatus(await call('POST', '/interviews', { category: 'dsa', difficulty: 'foundation', scheduledAt: state.slots[1] }), 201);
});
await step('upcoming filter lists the bookings', async () => {
  const res = await call('GET', '/interviews?status=upcoming');
  expectStatus(res, 200);
  expect(res.data.interviews.some((i) => i.id === state.interviewId), 'booking missing from list');
});
await step('malformed id is 404, not a crash', async () => expectStatus(await call('GET', '/interviews/not-a-uuid'), 404));
await step('starting the session generates questions (201)', async () => {
  const res = await call('POST', `/interviews/${state.interviewId}/session`);
  expect(res.status === 201, `expected 201, got ${res.status}: ${JSON.stringify(res.data)} (set SLOT_ENFORCE_WINDOW=false to start early)`);
  expect(res.data.interview.status === 'in_progress', 'not in progress');
  expect(res.data.interview.questions.length >= 1, 'no questions');
  state.questionCount = res.data.interview.questions.length;
});
await step('starting again is idempotent (200)', async () => expectStatus(await call('POST', `/interviews/${state.interviewId}/session`), 200));
await step('autosaving answers works (200)', async () => {
  expectStatus(await call('PUT', `/interviews/${state.interviewId}/answers`, { answers: { 0: 'A first draft of my answer to question one.' } }), 200);
});
await step('submitting creates feedback with a computed overall score (201)', async () => {
  const answers = Object.fromEntries(Array.from({ length: state.questionCount }, (_, i) => [i, `My answer to question ${i + 1}: I would explain the mechanism, give an example from a project, and name the trade-off clearly and briefly.`]));
  const res = await call('POST', `/interviews/${state.interviewId}/feedback`, { answers });
  expectStatus(res, 201);
  const fb = res.data.feedback;
  expect(typeof fb.overallScore === 'number' && fb.overallScore >= 0 && fb.overallScore <= 10, 'bad overall score');
  expect(fb.perQuestion.length === state.questionCount, 'per-question feedback missing');
  expect(fb.perQuestion[0].question && fb.perQuestion[0].answer, 'question/answer not merged in');
  state.feedbackId = fb.id;
});
await step('submitting twice returns the same feedback (200)', async () => {
  const res = await call('POST', `/interviews/${state.interviewId}/feedback`, {});
  expectStatus(res, 200);
  expect(res.data.feedback.id === state.feedbackId, 'a second report was created');
});
await step('feedback can be fetched per interview and as a list', async () => {
  expectStatus(await call('GET', `/interviews/${state.interviewId}/feedback`), 200);
  const list = await call('GET', '/feedbacks');
  expectStatus(list, 200);
  expect(list.data.feedbacks.some((f) => f.id === state.feedbackId), 'feedback missing from list');
});
await step('the interview is now completed', async () => {
  const res = await call('GET', `/interviews/${state.interviewId}`);
  expect(res.data.interview.status === 'completed', `status ${res.data.interview.status}`);
});
await step('resume upload accepts a PDF (201)', async () => {
  const form = new FormData();
  form.append('file', new Blob(['%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF'], { type: 'application/pdf' }), 'my resume.pdf');
  const res = await call('POST', '/resumes', form);
  expectStatus(res, 201);
  state.resumeId = res.data.resume.id;
});
await step('resume upload rejects non-PDF files (415)', async () => {
  const form = new FormData();
  form.append('file', new Blob(['hello'], { type: 'text/plain' }), 'notes.txt');
  expectStatus(await call('POST', '/resumes', form), 415);
});
await step('resume list, signed download link and delete', async () => {
  const list = await call('GET', '/resumes');
  expect(list.data.resumes.some((r) => r.id === state.resumeId), 'resume missing');
  const link = await call('GET', `/resumes/${state.resumeId}/download`);
  expectStatus(link, 200);
  expect(/^https?:\/\//.test(link.data.url), 'no download url');
  expectStatus(await call('DELETE', `/resumes/${state.resumeId}`), 204);
});
await step('logout clears the session (204), then protected routes are 401 again', async () => {
  expectStatus(await call('POST', '/auth/logout'), 204);
  cookie = '';
  expectStatus(await call('GET', '/interviews'), 401);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
