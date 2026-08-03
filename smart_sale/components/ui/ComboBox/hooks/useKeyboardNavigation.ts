import { useCallback, useEffect, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { clampIndex } from "../utils";

export interface UseKeyboardNavigationArgs {
  /** Number of currently visible/selectable rows (options, plus a trailing "create" row if any). */
  itemCount: number;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  /** Fired on Enter for the highlighted row. */
  onSelect: (index: number) => void;
  /** Escape behaviour is context-dependent (close vs. clear), left to the caller. */
  onEscape?: () => void;
  disabled?: boolean;
}

export interface UseKeyboardNavigationResult {
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
}

/**
 * Implements the standard listbox keyboard contract: ArrowUp/Down move the
 * highlight (opening the popover on first press), Home/End jump to the
 * edges, Enter commits the highlighted row, Escape/Tab close it.
 */
export function useKeyboardNavigation({
  itemCount,
  open,
  onOpen,
  onClose,
  onSelect,
  onEscape,
  disabled = false,
}: UseKeyboardNavigationArgs): UseKeyboardNavigationResult {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Keep the highlight in range whenever the list shrinks/grows (e.g. new search results).
  useEffect(() => {
    setHighlightedIndex((prev) => (itemCount === 0 ? -1 : clampIndex(prev, itemCount)));
  }, [itemCount]);

  useEffect(() => {
    if (!open) setHighlightedIndex(-1);
  }, [open]);

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      if (disabled) return;

      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          if (!open) {
            onOpen();
            setHighlightedIndex(itemCount > 0 ? 0 : -1);
            return;
          }
          setHighlightedIndex((prev) => clampIndex(prev + 1, itemCount));
          return;
        }
        case "ArrowUp": {
          event.preventDefault();
          if (!open) {
            onOpen();
            setHighlightedIndex(itemCount > 0 ? itemCount - 1 : -1);
            return;
          }
          setHighlightedIndex((prev) => clampIndex(prev - 1, itemCount));
          return;
        }
        case "Home": {
          if (!open) return;
          event.preventDefault();
          setHighlightedIndex(itemCount > 0 ? 0 : -1);
          return;
        }
        case "End": {
          if (!open) return;
          event.preventDefault();
          setHighlightedIndex(itemCount > 0 ? itemCount - 1 : -1);
          return;
        }
        case "Enter": {
          if (!open) return;
          event.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < itemCount) {
            onSelect(highlightedIndex);
          }
          return;
        }
        case "Escape": {
          if (!open && !onEscape) return;
          event.preventDefault();
          event.stopPropagation();
          if (open) onClose();
          onEscape?.();
          return;
        }
        case "Tab": {
          if (open) onClose();
          return;
        }
        default:
          return;
      }
    },
    [disabled, open, itemCount, highlightedIndex, onOpen, onClose, onSelect, onEscape]
  );

  return { highlightedIndex, setHighlightedIndex, onKeyDown };
}
