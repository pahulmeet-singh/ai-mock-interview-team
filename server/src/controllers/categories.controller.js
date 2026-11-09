import { CATEGORIES, DIFFICULTIES } from '../config/categories.js';

export const list = (_req, res) => res.json({ categories: CATEGORIES, difficulties: DIFFICULTIES });
