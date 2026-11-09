import { describe, expect, it } from 'vitest';
import { average, groupBy, omit, pick, removeById, sortBy, updateById, upsertById } from './immutable';

// Inputs are frozen: in an ES module (strict mode) any attempt to mutate them throws, so these tests prove the
// helpers never mutate their arguments.
const deepFreeze = (value) => {
  Object.values(value).forEach((v) => typeof v === 'object' && v !== null && deepFreeze(v));
  return Object.freeze(value);
};
const items = deepFreeze([
  { id: 'a', score: 3, tags: ['x'] },
  { id: 'b', score: 1, tags: [] },
  { id: 'c', score: 2, tags: ['y'] },
]);

describe('immutable helpers', () => {
  it('updateById returns a new list and a new item, sharing untouched items', () => {
    const next = updateById(items, 'a', { score: 9 });
    expect(next).not.toBe(items);
    expect(next[0]).toEqual({ id: 'a', score: 9, tags: ['x'] });
    expect(next[1]).toBe(items[1]); // unchanged items keep their reference, so React.memo can skip them
    expect(items[0].score).toBe(3);
  });

  it('updateById accepts a function patch', () => {
    expect(updateById(items, 'b', (item) => ({ score: item.score + 1 }))[1].score).toBe(2);
  });

  it('removeById and upsertById do not touch the original', () => {
    expect(removeById(items, 'b').map((i) => i.id)).toEqual(['a', 'c']);
    expect(upsertById(items, { id: 'z', score: 0, tags: [] })).toHaveLength(4);
    expect(upsertById(items, { id: 'a', score: 7, tags: [] })[0].score).toBe(7);
    expect(items).toHaveLength(3);
  });

  it('sortBy sorts a copy', () => {
    expect(sortBy(items, (i) => i.score).map((i) => i.id)).toEqual(['b', 'c', 'a']);
    expect(sortBy(items, (i) => i.score, 'desc').map((i) => i.id)).toEqual(['a', 'c', 'b']);
    expect(items.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('groupBy builds new arrays per key', () => {
    const groups = groupBy(items, (i) => (i.score > 1 ? 'high' : 'low'));
    expect(Object.keys(groups).sort()).toEqual(['high', 'low']);
    expect(groups.high.map((i) => i.id)).toEqual(['a', 'c']);
  });

  it('average, pick and omit behave on empty and normal input', () => {
    expect(average([])).toBe(0);
    expect(average([2, 4, 6])).toBe(4);
    expect(pick({ a: 1, b: 2 }, 'a', 'z')).toEqual({ a: 1 });
    expect(omit({ a: 1, b: 2 }, 'a')).toEqual({ b: 2 });
  });

  it('shows why spread is a shallow copy', () => {
    const original = { id: 1, nested: { n: 1 } };
    const shallow = { ...original };
    const deep = structuredClone(original);
    expect(shallow.nested).toBe(original.nested);
    expect(deep.nested).not.toBe(original.nested);
  });
});
