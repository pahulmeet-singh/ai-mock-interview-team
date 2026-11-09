import { afterEach, describe, expect, it, vi } from 'vitest';

// The live Gemini API can't be called from tests, so fetch is stubbed. These tests pin down the request shape
// we send and how we read, validate and post-process what comes back.

async function loadService(env = {}) {
  vi.resetModules();
  vi.stubEnv('GEMINI_MOCK', 'false');
  vi.stubEnv('GEMINI_API_KEY', 'test-key');
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import('./gemini.service.js');
}

const interaction = (payload) => ({
  ok: true,
  status: 200,
  json: async () => ({
    id: 'int_1',
    status: 'completed',
    steps: [
      { type: 'user_input', content: [{ type: 'text', text: 'prompt' }] },
      { type: 'model_output', status: 'done', content: [{ type: 'text', text: typeof payload === 'string' ? payload : JSON.stringify(payload) }] },
    ],
  }),
});

const candidates = (payload) => ({
  ok: true,
  status: 200,
  json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] }),
});

const questions = { questions: Array.from({ length: 5 }, (_, i) => ({ prompt: `Question number ${i + 1}, explained clearly?`, topic: 'Topic' })) };
const items = [0, 1, 2].map((index) => ({ index, prompt: `Q${index}`, topic: 'T', answer: index === 2 ? '' : 'An answer' }));
const evaluation = {
  scores: { technicalAccuracy: 8, depth: 6, problemSolving: 7, communication: 9, structure: 5 },
  summary: 'Solid.',
  strengths: ['Clear'],
  weaknesses: ['Shallow'],
  recommendations: ['Practise'],
  perQuestion: [0, 1, 2].map((index) => ({ index, score: 8, feedback: 'ok', betterAnswer: 'better' })),
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('generateQuestions', () => {
  it('calls the Interactions API with structured output and reads model_output text', async () => {
    const fetchMock = vi.fn().mockResolvedValue(interaction(questions));
    vi.stubGlobal('fetch', fetchMock);
    const { generateQuestions } = await loadService();

    const result = await generateQuestions({ category: 'frontend', difficulty: 'intermediate', count: 5 });

    expect(result).toHaveLength(5);
    const [url, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
    expect(init.headers['x-goog-api-key']).toBe('test-key');
    expect(body).toMatchObject({ model: 'gemini-3.5-flash-lite', store: false });
    expect(body.response_format).toMatchObject({ type: 'text', mime_type: 'application/json' });
    expect(body.response_format.schema.required).toContain('questions');
    expect(body.input).toContain('Frontend engineering');
  });

  it('supports the generateContent fallback with upper-case schema types', async () => {
    const fetchMock = vi.fn().mockResolvedValue(candidates(questions));
    vi.stubGlobal('fetch', fetchMock);
    const { generateQuestions } = await loadService({ GEMINI_API: 'generateContent' });

    await generateQuestions({ category: 'dsa', difficulty: 'foundation', count: 5 });

    const [url, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.generationConfig.responseSchema.type).toBe('OBJECT');
    expect(body.generationConfig.responseSchema.properties.questions.items.properties.prompt.type).toBe('STRING');
  });

  it('retries once when the model returns invalid JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(interaction('{ not json')).mockResolvedValueOnce(interaction(questions));
    vi.stubGlobal('fetch', fetchMock);
    const { generateQuestions } = await loadService();

    await expect(generateQuestions({ category: 'frontend', difficulty: 'intermediate', count: 5 })).resolves.toHaveLength(5);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry a quota error and reports 429', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 429, statusText: 'Too Many Requests', json: async () => ({ error: { message: 'quota' } }) });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { generateQuestions } = await loadService();

    await expect(generateQuestions({ category: 'frontend', difficulty: 'intermediate', count: 5 })).rejects.toMatchObject({ status: 429 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('evaluateInterview', () => {
  it('computes the overall score itself and zeroes unanswered questions', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(interaction(evaluation)));
    const { evaluateInterview } = await loadService();

    const result = await evaluateInterview({ category: 'frontend', difficulty: 'intermediate', items });

    expect(result.overallScore).toBe(7); // mean of 8, 6, 7, 9, 5
    expect(result.perQuestion.map((p) => p.score)).toEqual([8, 8, 0]); // question 3 had no answer
  });

  it('retries when the model skips a question', async () => {
    const partial = { ...evaluation, perQuestion: evaluation.perQuestion.slice(0, 2) };
    const fetchMock = vi.fn().mockResolvedValueOnce(interaction(partial)).mockResolvedValueOnce(interaction(evaluation));
    vi.stubGlobal('fetch', fetchMock);
    const { evaluateInterview } = await loadService();

    const result = await evaluateInterview({ category: 'frontend', difficulty: 'intermediate', items });
    expect(result.perQuestion).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
