import { afterEach, describe, expect, it } from 'vitest';
import { useSessionStore } from './sessionStore';

const store = () => useSessionStore.getState();
afterEach(() => store().reset());

const seed = (extra = {}) => store().begin({ interviewId: 'i1', questionCount: 3, endsAt: Date.now() + 60_000, answers: {}, ...extra });

describe('sessionStore', () => {
  it('replaces the answers object on every edit (immutable update)', () => {
    seed();
    const before = store().answers;
    store().setAnswer(0, 'hello');
    expect(store().answers).not.toBe(before);
    expect(before).toEqual({}); // the previous object was never mutated
    expect(store().answers).toEqual({ 0: 'hello' });
  });

  it('keeps unsaved local text when the same interview is begun again', () => {
    seed();
    store().setAnswer(1, 'typed locally');
    seed({ answers: { 1: 'older server copy' } });
    expect(store().answers[1]).toBe('typed locally');
  });

  it('stays dirty when the user typed while a save was in flight (referential equality)', () => {
    seed();
    store().setAnswer(0, 'one');
    const sent = store().answers; // what the autosave request carries
    store().setAnswer(0, 'one two'); // typing continues during the request
    store().markSaved(sent, '2026-10-31T00:00:00.000Z');
    expect(store().dirty).toBe(true);
    store().markSaved(store().answers, '2026-10-31T00:00:05.000Z');
    expect(store().dirty).toBe(false);
  });

  it('clamps navigation to the available questions and counts the clock down', () => {
    seed();
    store().goTo(99);
    expect(store().currentIndex).toBe(2);
    store().goTo(-5);
    expect(store().currentIndex).toBe(0);
    store().tick();
    expect(store().remainingSeconds).toBeGreaterThan(55);
    expect(store().remainingSeconds).toBeLessThanOrEqual(60);
  });
});
