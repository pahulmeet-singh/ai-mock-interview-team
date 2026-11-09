import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// clsx joins conditional class names; twMerge resolves conflicts so the last Tailwind class wins
// (cn('px-2', 'px-4') → 'px-4'). Every component uses this to accept a className override.
export const cn = (...inputs) => twMerge(clsx(inputs));
