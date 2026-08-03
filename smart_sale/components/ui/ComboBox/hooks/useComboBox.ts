import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComboBoxOption, ComboBoxSearchMode, UseComboBoxArgs, UseComboBoxResult } from "../types";
import { dedupeOptions, matchesQuery, toOptions } from "../utils";
import { useDebounce } from "./useDebounce";

/**
 * All non-visual state and behaviour for the ComboBox lives here: value
 * state (controlled or uncontrolled, single or multiple), the local/remote/
 * both search pipeline, and open/loading/error tracking. `ComboBox.tsx`
 * itself only wires this up to markup + keyboard navigation.
 */
export function useComboBox<T>(props: UseComboBoxArgs<T>): UseComboBoxResult<T> {
  const {
    data = [],
    getLabel,
    getValue,
    isOptionDisabled,

    value,
    defaultValue = null,
    selectedItem = null,
    onChange,
    onValueChange,

    multiple = false,
    values,
    defaultValues = [],
    selectedItems = [],
    onChangeMultiple,
    onValuesChange,

    remoteSearch = false,
    onSearch,
    fetchPage,
    debounceMs = 300,
    minSearchLength = 0,

    infiniteScroll = false,
    onLoadMore,
    hasMore: hasMoreProp = false,

    loading: externalLoading = false,
    onOpen,
    onClose,
  } = props;

  // ── Search mode ────────────────────────────────────────────────────────
  const searchMode: ComboBoxSearchMode = remoteSearch
    ? data.length > 0
      ? "both"
      : "remote"
    : "local";

  // ── Open state ────────────────────────────────────────────────────────
  const [open, setOpenState] = useState(false);
  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState((prev) => {
        if (prev === next) return prev;
        if (next) onOpen?.();
        else onClose?.();
        return next;
      });
    },
    [onOpen, onClose]
  );

  // ── Query text ────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, remoteSearch ? debounceMs : 0);

  // ── Remote fetch state ────────────────────────────────────────────────
  const [remoteOptions, setRemoteOptions] = useState<ComboBoxOption<T>[]>([]);
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const isPaged = remoteSearch && typeof fetchPage === "function";

  useEffect(() => {
    if (!remoteSearch || !onSearch || isPaged) return;
    const trimmed = debouncedQuery.trim();
    if (trimmed.length > 0 && trimmed.length < minSearchLength) {
      setRemoteOptions([]);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsRemoteLoading(true);
    setError(null);

    onSearch(debouncedQuery)
      .then((items) => {
        // A newer keystroke/request has since started — discard this stale response.
        if (requestId !== requestIdRef.current) return;
        setRemoteOptions(toOptions(items, getLabel, getValue, isOptionDisabled));
      })
      .catch((err: unknown) => {
        if (requestId !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : "Failed to load results");
        setRemoteOptions([]);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setIsRemoteLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, remoteSearch, minSearchLength, isPaged]);

  // ── Paginated remote fetch state (`fetchPage`) ────────────────────────
  const [pagedItems, setPagedItems] = useState<T[]>([]);
  const [pagedPage, setPagedPage] = useState(1);
  const [pagedHasMore, setPagedHasMore] = useState(false);
  const [isPagedLoading, setIsPagedLoading] = useState(false);
  const [isPagedLoadingMore, setIsPagedLoadingMore] = useState(false);
  const pagedRequestIdRef = useRef(0);

  useEffect(() => {
    if (!isPaged) return;
    const trimmed = debouncedQuery.trim();
    if (trimmed.length > 0 && trimmed.length < minSearchLength) {
      setPagedItems([]);
      setPagedHasMore(false);
      return;
    }

    const requestId = ++pagedRequestIdRef.current;
    setPagedPage(1);
    setIsPagedLoading(true);
    setError(null);

    fetchPage!(debouncedQuery, 1)
      .then((res) => {
        if (requestId !== pagedRequestIdRef.current) return;
        setPagedItems(res?.items ?? []);
        setPagedHasMore(!!res?.hasMore);
      })
      .catch((err: unknown) => {
        if (requestId !== pagedRequestIdRef.current) return;
        setError(err instanceof Error ? err.message : "Failed to load results");
        setPagedItems([]);
        setPagedHasMore(false);
      })
      .finally(() => {
        if (requestId === pagedRequestIdRef.current) setIsPagedLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, isPaged, minSearchLength]);

  const loadMorePaged = useCallback(() => {
    if (!isPaged || !pagedHasMore || isPagedLoading || isPagedLoadingMore) return;
    const requestId = pagedRequestIdRef.current;
    const nextPage = pagedPage + 1;
    setIsPagedLoadingMore(true);

    fetchPage!(debouncedQuery, nextPage)
      .then((res) => {
        // Query changed mid-flight (new search session started) — discard.
        if (requestId !== pagedRequestIdRef.current) return;
        setPagedPage(nextPage);
        setPagedItems((prev) => [...prev, ...(res?.items ?? [])]);
        setPagedHasMore(!!res?.hasMore);
      })
      .catch(() => {
        if (requestId === pagedRequestIdRef.current) setPagedHasMore(false);
      })
      .finally(() => {
        if (requestId === pagedRequestIdRef.current) setIsPagedLoadingMore(false);
      });
  }, [isPaged, pagedHasMore, isPagedLoading, isPagedLoadingMore, pagedPage, debouncedQuery]);

  const pagedOptions = useMemo(
    () => toOptions(pagedItems, getLabel, getValue, isOptionDisabled),
    [pagedItems, getLabel, getValue, isOptionDisabled]
  );

  // ── Local filter ──────────────────────────────────────────────────────
  const localOptions = useMemo(
    () => toOptions(data, getLabel, getValue, isOptionDisabled),
    [data, getLabel, getValue, isOptionDisabled]
  );

  const filteredLocalOptions = useMemo(() => {
    if (searchMode === "remote") return [];
    return localOptions.filter((opt) => matchesQuery(opt.label, query));
  }, [localOptions, query, searchMode]);

  // ── Value state (single) ──────────────────────────────────────────────
  const isValueControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string | number | null>(defaultValue ?? null);
  const currentValue = isValueControlled ? value ?? null : internalValue;

  // ── Value state (multiple) ────────────────────────────────────────────
  const isValuesControlled = values !== undefined;
  const [internalValues, setInternalValues] = useState<Array<string | number>>(defaultValues);
  const currentValues = isValuesControlled ? values ?? [] : internalValues;

  const selectedValues = useMemo(
    () => new Set(multiple ? currentValues : currentValue !== null ? [currentValue] : []),
    [multiple, currentValues, currentValue]
  );

  // ── Merge local + remote + "selected but not loaded" rows ────────────
  const options = useMemo(() => {
    const remoteVisible = searchMode === "local" ? [] : isPaged ? pagedOptions : remoteOptions;
    const merged = dedupeOptions([...filteredLocalOptions, ...remoteVisible]);

    // Inject rows for selections that aren't present in the currently loaded
    // page/search (classic edit-mode gap), so labels/chips render immediately.
    const injected: ComboBoxOption<T>[] = [];
    if (!multiple && currentValue !== null && selectedItem) {
      const exists = merged.some((o) => o.value === currentValue);
      if (!exists) {
        injected.push({
          item: selectedItem,
          label: getLabel(selectedItem),
          value: getValue(selectedItem),
          disabled: isOptionDisabled?.(selectedItem) ?? false,
        });
      }
    }
    if (multiple && selectedItems.length > 0) {
      for (const item of selectedItems) {
        const v = getValue(item);
        if (!currentValues.includes(v)) continue;
        if (merged.some((o) => o.value === v) || injected.some((o) => o.value === v)) continue;
        injected.push({ item, label: getLabel(item), value: v, disabled: isOptionDisabled?.(item) ?? false });
      }
    }

    return dedupeOptions([...injected, ...merged]);
  }, [
    searchMode,
    remoteOptions,
    isPaged,
    pagedOptions,
    filteredLocalOptions,
    multiple,
    currentValue,
    currentValues,
    selectedItem,
    selectedItems,
    getLabel,
    getValue,
    isOptionDisabled,
  ]);

  const selectedOptions = useMemo(
    () => options.filter((opt) => selectedValues.has(opt.value)),
    [options, selectedValues]
  );

  // ── Selection actions ──────────────────────────────────────────────────
  const selectOption = useCallback(
    (option: ComboBoxOption<T>) => {
      if (option.disabled) return;

      if (multiple) {
        const exists = currentValues.includes(option.value);
        const nextValues = exists
          ? currentValues.filter((v) => v !== option.value)
          : [...currentValues, option.value];
        if (!isValuesControlled) setInternalValues(nextValues);
        onValuesChange?.(nextValues);
        const nextItems = options.filter((o) => nextValues.includes(o.value)).map((o) => o.item);
        onChangeMultiple?.(nextItems);
        return;
      }

      if (!isValueControlled) setInternalValue(option.value);
      onValueChange?.(option.value);
      onChange?.(option.item);
      setQuery("");
    },
    [
      multiple,
      currentValues,
      isValuesControlled,
      onValuesChange,
      onChangeMultiple,
      options,
      isValueControlled,
      onValueChange,
      onChange,
    ]
  );

  const removeValue = useCallback(
    (v: string | number) => {
      if (!multiple) {
        if (!isValueControlled) setInternalValue(null);
        onValueChange?.(null);
        onChange?.(null);
        return;
      }
      const nextValues = currentValues.filter((cur) => cur !== v);
      if (!isValuesControlled) setInternalValues(nextValues);
      onValuesChange?.(nextValues);
      const nextItems = options.filter((o) => nextValues.includes(o.value)).map((o) => o.item);
      onChangeMultiple?.(nextItems);
    },
    [
      multiple,
      isValueControlled,
      onValueChange,
      onChange,
      currentValues,
      isValuesControlled,
      onValuesChange,
      options,
      onChangeMultiple,
    ]
  );

  const clear = useCallback(() => {
    setQuery("");
    if (multiple) {
      if (!isValuesControlled) setInternalValues([]);
      onValuesChange?.([]);
      onChangeMultiple?.([]);
      return;
    }
    if (!isValueControlled) setInternalValue(null);
    onValueChange?.(null);
    onChange?.(null);
  }, [multiple, isValuesControlled, onValuesChange, onChangeMultiple, isValueControlled, onValueChange, onChange]);

  const loadMore = useCallback(() => {
    if (isPaged) {
      loadMorePaged();
      return;
    }
    if (!infiniteScroll || !hasMoreProp) return;
    onLoadMore?.();
  }, [isPaged, loadMorePaged, infiniteScroll, hasMoreProp, onLoadMore]);

  const isLoading = externalLoading || isRemoteLoading || isPagedLoading;
  const hasMore = isPaged ? pagedHasMore : hasMoreProp;
  const isLoadingMore = isPaged ? isPagedLoadingMore : false;

  return {
    options,
    query,
    setQuery,
    open,
    setOpen,
    isLoading,
    error,
    hasMore,
    isLoadingMore,
    selectedValues,
    selectedOptions,
    selectOption,
    removeValue,
    clear,
    loadMore,
    searchMode,
  };
}
