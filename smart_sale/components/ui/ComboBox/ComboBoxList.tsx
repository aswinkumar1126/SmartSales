"use client";

import { useCallback, useRef, type MouseEvent, type ReactNode, type UIEvent } from "react";
import { Box, Button, Spinner, Text } from "@chakra-ui/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ComboBoxItem } from "./ComboBoxItem";
import { optionDomId } from "./utils";
import type { ComboBoxOption } from "./types";

export interface ComboBoxListProps<T> {
  listId: string;
  options: ComboBoxOption<T>[];
  selectedValues: Set<string | number>;
  highlightedIndex: number;
  onHighlight: (index: number) => void;
  onSelect: (option: ComboBoxOption<T>) => void;
  multiple?: boolean;
  renderItem?: (item: T, selected: boolean, highlighted: boolean) => ReactNode;

  isLoading: boolean;
  error: string | null;
  emptyMessage: string;
  maxHeight: string;

  virtualized?: boolean;
  infiniteScroll?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;

  allowCreate?: boolean;
  createLabel?: string;
  onCreate?: () => void;
}

const ROW_HEIGHT = 36;
const SCROLL_THRESHOLD_PX = 80;

/**
 * The floating listbox. Renders loading / error / empty states, then either
 * a plain mapped list or a `@tanstack/react-virtual` virtualized list — the
 * same option data and selection/highlight logic drive both.
 */
export function ComboBoxList<T>({
  listId,
  options,
  selectedValues,
  highlightedIndex,
  onHighlight,
  onSelect,
  multiple,
  renderItem,
  isLoading,
  error,
  emptyMessage,
  maxHeight,
  virtualized = false,
  infiniteScroll = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  allowCreate = false,
  createLabel,
  onCreate,
}: ComboBoxListProps<T>) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreTriggeredRef = useRef(false);

  const virtualizer = useVirtualizer({
    count: options.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  const maybeLoadMore = useCallback(
    (scrollTop: number, scrollHeight: number, clientHeight: number) => {
      if (!infiniteScroll || !hasMore || isLoading || isLoadingMore || loadingMoreTriggeredRef.current) return;
      if (scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD_PX) {
        loadingMoreTriggeredRef.current = true;
        onLoadMore?.();
      }
    },
    [infiniteScroll, hasMore, isLoading, isLoadingMore, onLoadMore]
  );

  const handleScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      maybeLoadMore(scrollTop, scrollHeight, clientHeight);
    },
    [maybeLoadMore]
  );

  if (!isLoadingMore) loadingMoreTriggeredRef.current = false;

  const showInitialLoading = isLoading && options.length === 0;
  const showError = !!error && options.length === 0 && !isLoading;
  const showEmpty = !isLoading && !error && options.length === 0;

  if (showInitialLoading) {
    return (
      <Box role="status" px="3" py="4" display="flex" alignItems="center" gap="2" color="fg.muted" fontSize="sm">
        <Spinner size="xs" /> Loading...
      </Box>
    );
  }

  if (showError) {
    return (
      <Box role="alert" px="3" py="4" color="fg.error" fontSize="sm">
        {error}
      </Box>
    );
  }

  if (showEmpty) {
    return (
      <Box px="3" py="4" color="fg.muted" fontSize="sm">
        {allowCreate && createLabel ? (
          <Button
            variant="plain"
            w="full"
            justifyContent="flex-start"
            px="0"
            fontWeight="normal"
            onMouseDown={(e: MouseEvent<HTMLButtonElement>) => e.preventDefault()}
            onClick={onCreate}
            color="colorPalette.solid"
            _hover={{ textDecoration: "underline" }}
          >
            Create &ldquo;{createLabel}&rdquo;
          </Button>
        ) : (
          <Text>{emptyMessage}</Text>
        )}
      </Box>
    );
  }

  if (!virtualized) {
    return (
      <Box
        ref={scrollRef}
        role="listbox"
        id={listId}
        aria-multiselectable={multiple || undefined}
        maxH={maxHeight}
        overflowY="auto"
        onScroll={handleScroll}
      >
        {options.map((option, index) => (
          <ComboBoxItem
            key={option.value}
            id={optionDomId(listId, option.value)}
            option={option}
            selected={selectedValues.has(option.value)}
            highlighted={index === highlightedIndex}
            multiple={multiple}
            renderItem={renderItem}
            onSelect={() => onSelect(option)}
            onHighlight={() => onHighlight(index)}
          />
        ))}
        {isLoadingMore && (
          <Box px="3" py="2" display="flex" alignItems="center" gap="2" color="fg.muted" fontSize="xs">
            <Spinner size="xs" /> Loading more...
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box
      ref={scrollRef}
      role="listbox"
      id={listId}
      aria-multiselectable={multiple || undefined}
      maxH={maxHeight}
      overflowY="auto"
      onScroll={handleScroll}
    >
      <Box style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const option = options[virtualRow.index];
          return (
            <ComboBoxItem
              key={option.value}
              id={optionDomId(listId, option.value)}
              option={option}
              selected={selectedValues.has(option.value)}
              highlighted={virtualRow.index === highlightedIndex}
              multiple={multiple}
              renderItem={renderItem}
              onSelect={() => onSelect(option)}
              onHighlight={() => onHighlight(virtualRow.index)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                fontSize: "10px",
              }}
            />
          );
        })}
      </Box>
      {isLoadingMore && (
        <Box px="3" py="2" display="flex" alignItems="center" gap="2" color="fg.muted" fontSize="xs">
          <Spinner size="xs" /> Loading more...
        </Box>
      )}
    </Box>
  );
}
