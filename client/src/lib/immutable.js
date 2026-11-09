// Small, pure helpers for working with state the React way: never mutate, always return a new value.
// Each one builds its result with spread, rest, destructuring and array methods, and leaves its input untouched.
// That matters because React (and Zustand, and React Query) decide whether something changed by comparing
// references with ===. A mutated array keeps the same reference, so the UI would not update.

export const updateById = (list, id, patch) =>
  list.map((item) => (item.id === id ? { ...item, ...(typeof patch === 'function' ? patch(item) : patch) } : item));

export const removeById = (list, id) => list.filter((item) => item.id !== id);

export const upsertById = (list, next) => (list.some((item) => item.id === next.id) ? updateById(list, next.id, next) : [...list, next]);

export const sortBy = (list, keyFn, direction = 'asc') => {
  const sign = direction === 'desc' ? -1 : 1;
  return [...list].sort((a, b) => {
    const [x, y] = [keyFn(a), keyFn(b)];
    return (x > y ? 1 : x < y ? -1 : 0) * sign;
  });
};

export function groupBy(list, keyFn) {
  const groups = {};
  for (const item of list) {
    const key = keyFn(item);
    groups[key] = [...(groups[key] ?? []), item];
  }
  return groups;
}

export const average = (numbers) => (numbers.length ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : 0);

export const pick = (object, ...keys) => Object.fromEntries(keys.filter((key) => key in object).map((key) => [key, object[key]]));
export const omit = (object, ...keys) => Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)));

// Shallow vs deep: spread copies one level, so nested objects are still shared. structuredClone copies everything.
export const deepClone = (value) => structuredClone(value);
