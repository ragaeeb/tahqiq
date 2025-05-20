import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/****
 * Combines and merges class names using `clsx` and resolves Tailwind CSS conflicts with `twMerge`.
 *
 * @param inputs - Class values to be combined and merged.
 * @returns A single string of merged class names with Tailwind CSS conflicts resolved.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
