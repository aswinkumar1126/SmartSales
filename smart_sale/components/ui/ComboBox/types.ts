import type { ReactNode } from "react";

/** Supported visual sizes — mirrors Chakra's own `sm | md | lg` scale. */
export type ComboBoxSize = "sm" | "md" | "lg";

/** How the option list is produced. Derived internally, not set directly by callers. */
export type ComboBoxSearchMode = "local" | "remote" | "both";

/**
 * Internal normalized shape every raw `T` item is projected into once, via
 * `getLabel` / `getValue`, so the rest of the component never has to touch
 * the caller's domain type again.
 */
export interface ComboBoxOption<T> {
  item: T;
  label: string;
  value: string | number;
  disabled: boolean;
}

export interface ComboBoxProps<T> {
  // ── Data sources ────────────────────────────────────────────────────────
  /** Local/static option pool. Always searched client-side unless `remoteSearch` is set. */
  data?: T[];

  // ── Single-select value (controlled / uncontrolled) ─────────────────────
  value?: string | number | null;
  defaultValue?: string | number | null;
  /** Full item for the current value, used when it isn't present in `data` (e.g. edit mode). */
  selectedItem?: T | null;
  onChange?: (item: T | null) => void;
  onValueChange?: (value: string | number | null) => void;

  // ── Multi-select value (controlled / uncontrolled) ──────────────────────
  multiple?: boolean;
  values?: Array<string | number>;
  defaultValues?: Array<string | number>;
  selectedItems?: T[];
  onChangeMultiple?: (items: T[]) => void;
  onValuesChange?: (values: Array<string | number>) => void;

  // ── Item shape adapters ──────────────────────────────────────────────────
  getLabel: (item: T) => string;
  getValue: (item: T) => string | number;

  // ── Text / placeholders ──────────────────────────────────────────────────
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  errorMessage?: string;
  helperText?: string;

  // ── Behaviour flags ───────────────────────────────────────────────────────
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  loading?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  autoFocus?: boolean;
  invalid?: boolean;
  /** Auto-highlight (and, if `closeOnSelectFirst`, auto-select) the first visible option. */
  autoSelectFirst?: boolean;
  /** Single mode: close the popover right after a selection. Default true. */
  closeOnSelect?: boolean;
  /** Escape clears the current query/selection instead of just closing. Default false. */
  clearOnEscape?: boolean;

  // ── Remote search ─────────────────────────────────────────────────────────
  remoteSearch?: boolean;
  onSearch?: (query: string) => Promise<T[]>;
  debounceMs?: number;
  minSearchLength?: number;
  /**
   * Paginated remote search — an alternative to `onSearch` for sources with
   * more results than fit in one page. Called with the current search text
   * and a 1-based page number; returns that page's items plus whether more
   * pages exist. When supplied, takes priority over `onSearch`: the
   * component debounces the query, resets to page 1 on a new search, and
   * drives scroll-triggered `loadMore` itself (fetching + appending pages),
   * so the caller doesn't need to own any page state.
   */
  fetchPage?: (query: string, page: number) => Promise<{ items: T[]; hasMore: boolean }>;

  // ── Sizing / styling ──────────────────────────────────────────────────────
  maxHeight?: string;
  width?: string;
  size?: ComboBoxSize;
  variant?: "outline" | "subtle" | "flushed";
  colorPalette?: string;

  // ── Icons ─────────────────────────────────────────────────────────────────
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;

  // ── Custom rendering ──────────────────────────────────────────────────────
  renderItem?: (item: T, selected: boolean, highlighted: boolean) => ReactNode;
  renderSelected?: (item: T) => ReactNode;
  isOptionDisabled?: (item: T) => boolean;

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  onOpen?: () => void;
  onClose?: () => void;
  onBlur?: () => void;
  onFocus?: () => void;

  // ── Performance / pagination ──────────────────────────────────────────────
  virtualized?: boolean;
  infiniteScroll?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;

  // ── Create-new-option ──────────────────────────────────────────────────────
  allowCreate?: boolean;
  createOption?: (text: string) => void;

  // ── Form / a11y plumbing ───────────────────────────────────────────────────
  name?: string;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

export interface UseComboBoxArgs<T> extends ComboBoxProps<T> {}

export interface UseComboBoxResult<T> {
  /** Options currently shown in the list (post local-filter, pre-virtualization). */
  options: ComboBoxOption<T>[];
  query: string;
  setQuery: (q: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  isLoading: boolean;
  error: string | null;
  selectedValues: Set<string | number>;
  selectedOptions: ComboBoxOption<T>[];
  selectOption: (option: ComboBoxOption<T>) => void;
  removeValue: (value: string | number) => void;
  clear: () => void;
  loadMore: () => void;
  searchMode: ComboBoxSearchMode;
  /** True while a `fetchPage` next-page request is in flight (page 1 is covered by `isLoading`). */
  isLoadingMore: boolean;
  /** Whether another page is available — from `fetchPage` when supplied, else the caller-supplied `hasMore` prop. */
  hasMore: boolean;
}
