import type { ComboBoxOption } from "./types";

/**
 * Normalizes text for comparison: trims leading/trailing whitespace and
 * lower-cases it. Every local-search comparison in this component goes
 * through this single function so behaviour stays consistent.
 */
export function normalize(text: string): string {
  return text.trim().toLowerCase();
}

/** Case-insensitive, whitespace-trimmed substring match — the local search rule. */
export function matchesQuery(label: string, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  return normalize(label).includes(q);
}

/** Projects raw domain items into the internal option shape used everywhere else. */
export function toOptions<T>(
  items: T[],
  getLabel: (item: T) => string,
  getValue: (item: T) => string | number,
  isOptionDisabled?: (item: T) => boolean
): ComboBoxOption<T>[] {
  return (items ?? []).map((item) => ({
    item,
    label: getLabel(item),
    value: getValue(item),
    disabled: isOptionDisabled?.(item) ?? false,
  }));
}

/** De-duplicates options by value, keeping the first occurrence (e.g. an
 *  injected "selected but not loaded yet" row followed by the real fetched row). */
export function dedupeOptions<T>(options: ComboBoxOption<T>[]): ComboBoxOption<T>[] {
  const seen = new Set<string | number>();
  const result: ComboBoxOption<T>[] = [];
  for (const opt of options) {
    const key = opt.value;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(opt);
  }
  return result;
}

/** Clamps an index into `[0, length - 1]`, or `-1` when the list is empty. */
export function clampIndex(index: number, length: number): number {
  if (length <= 0) return -1;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}

/** Stable id used to wire `aria-activedescendant` to a rendered option row. */
export function optionDomId(baseId: string, value: string | number): string {
  return `${baseId}-option-${String(value).replace(/\s+/g, "_")}`;
}
