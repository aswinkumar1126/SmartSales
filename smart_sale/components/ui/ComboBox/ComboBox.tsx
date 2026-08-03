"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Box, Field, Popover, Portal, Text } from "@chakra-ui/react";
import { ComboBoxInput } from "./ComboBoxInput";
import { ComboBoxList } from "./ComboBoxList";
import { useComboBox } from "./hooks/useComboBox";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import { optionDomId } from "./utils";
import type { ComboBoxOption, ComboBoxProps } from "./types";

function ComboBoxInner<T>(props: ComboBoxProps<T>, ref: React.ForwardedRef<HTMLInputElement>) {
  const {
    placeholder = "Select an option",
    searchPlaceholder,
    emptyMessage = "No results found",
    errorMessage,
    helperText,

    disabled = false,
    readOnly = false,
    required = false,
    invalid = false,
    searchable = true,
    clearable = true,
    autoFocus = false,
    autoSelectFirst = false,
    closeOnSelect = true,
    clearOnEscape = false,

    remoteSearch = false,
    minSearchLength = 0,

    maxHeight = "280px",
    width = "100%",
    size = "md",
    variant = "outline",
    colorPalette = "blue",

    leftIcon,
    rightIcon,

    renderItem,
    renderSelected,

    multiple = false,

    virtualized = false,
    infiniteScroll = false,
    onLoadMore,

    allowCreate = false,
    createOption,

    name,
    id,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
  } = props;

  const generatedId = useId();
  const baseId = id ?? generatedId;
  const listId = `${baseId}-listbox`;

  const inputRef = useRef<HTMLInputElement | null>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const combo = useComboBox(props);
  const { options, query, setQuery, open, setOpen, isLoading, error, hasMore, isLoadingMore, selectedValues, selectedOptions, selectOption, removeValue, clear, loadMore } = combo;

  const trimmedQuery = query.trim();
  const hasExactMatch = options.some((o) => o.label.trim().toLowerCase() === trimmedQuery.toLowerCase());
  const showCreateRow = allowCreate && trimmedQuery.length > 0 && !hasExactMatch && options.length === 0;

  const handleSelect = useCallback(
    (option: ComboBoxOption<T>) => {
      selectOption(option);
      if (!multiple && closeOnSelect) setOpen(false);
    },
    [selectOption, multiple, closeOnSelect, setOpen]
  );

  const handleSelectByIndex = useCallback(
    (index: number) => {
      const option = options[index];
      if (option) handleSelect(option);
    },
    [options, handleSelect]
  );

  const handleCreate = useCallback(() => {
    if (!trimmedQuery) return;
    createOption?.(trimmedQuery);
    setQuery("");
    if (!multiple) setOpen(false);
  }, [trimmedQuery, createOption, setQuery, multiple, setOpen]);

  const handleOpen = useCallback(() => {
    if (disabled || readOnly) return;
    setOpen(true);
  }, [disabled, readOnly, setOpen]);

  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  const { highlightedIndex, setHighlightedIndex, onKeyDown: navKeyDown } = useKeyboardNavigation({
    itemCount: options.length,
    open,
    onOpen: handleOpen,
    onClose: handleClose,
    onSelect: handleSelectByIndex,
    onEscape: clearOnEscape ? clear : undefined,
    disabled: disabled || readOnly,
  });

  // Auto-highlight the first row once results settle, when requested.
  useEffect(() => {
    if (autoSelectFirst && open && options.length > 0 && highlightedIndex === -1) {
      setHighlightedIndex(0);
    }
  }, [autoSelectFirst, open, options.length, highlightedIndex, setHighlightedIndex]);

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && open && options.length === 0 && showCreateRow) {
        e.preventDefault();
        handleCreate();
        return;
      }
      navKeyDown(e);
    },
    [open, options.length, showCreateRow, handleCreate, navKeyDown]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      if (readOnly) return;
      setQuery(value);
      if (!open) setOpen(true);
    },
    [readOnly, setQuery, setOpen]
  );

  const handleInputClick = useCallback(() => {
    if (disabled || readOnly) return;
    if (!searchable) {
      setOpen(!open);
      return;
    }
    if (!open) setOpen(true);
  }, [disabled, readOnly, searchable, open, setOpen]);

  const handleFocus = useCallback(() => {
    if (disabled || readOnly) return;
    props.onFocus?.();
    if (options.length > 0 || remoteSearch) setOpen(true);
  }, [disabled, readOnly, options.length, remoteSearch, setOpen, props]);

  const handleBlur = useCallback(() => {
    props.onBlur?.();
  }, [props]);

  const singleSelectedLabel = !multiple && selectedOptions[0] ? selectedOptions[0].label : "";
  const inputValue = multiple ? query : open ? query : query || singleSelectedLabel;

  const activeDescendantId = useMemo(() => {
    if (highlightedIndex < 0) return undefined;
    const option = options[highlightedIndex];
    return option ? optionDomId(listId, option.value) : undefined;
  }, [highlightedIndex, options, listId]);

  const displaySelectedNode =
    !multiple && renderSelected && selectedOptions[0] && !open ? renderSelected(selectedOptions[0].item) : null;

  const effectivePlaceholder = open && searchable ? searchPlaceholder ?? placeholder : placeholder;

  return (
    <Field.Root invalid={invalid} disabled={disabled} required={required} colorPalette={colorPalette} w={width}>
      <Popover.Root
        open={open}
        onOpenChange={(details) => setOpen(details.open)}
        autoFocus={false}
        initialFocusEl={() => inputRef.current}
        closeOnEscape={false}
        closeOnInteractOutside
        modal={false}
        positioning={{ placement: "bottom-start", sameWidth: true, flip: true, gutter: 4 }}
      >
        <Popover.Anchor>
          <Box position="relative">
            {displaySelectedNode ? (
              <Box
                role="button"
                tabIndex={disabled ? -1 : 0}
                onClick={handleInputClick}
                borderWidth="1px"
                borderColor={invalid ? "border.error" : "border"}
                rounded="md"
                px="3"
                py="2"
                cursor={disabled ? "not-allowed" : "pointer"}
                opacity={disabled ? 0.6 : 1}
              >
                {displaySelectedNode}
              </Box>
            ) : (
              <ComboBoxInput<T>
                ref={inputRef}
                id={baseId}
                listId={listId}
                activeDescendantId={activeDescendantId}
                open={open}
                inputValue={inputValue}
                onInputValueChange={handleInputChange}
                placeholder={multiple && selectedOptions.length > 0 ? undefined : effectivePlaceholder}
                size={size}
                variant={variant}
                disabled={disabled}
                readOnly={readOnly}
                required={required}
                invalid={invalid}
                searchable={searchable}
                autoFocus={autoFocus}
                loading={isLoading}
                clearable={clearable}
                leftIcon={leftIcon}
                rightIcon={rightIcon}
                multiple={multiple}
                chips={multiple ? selectedOptions : undefined}
                onRemoveChip={removeValue}
                name={name}
                ariaLabel={ariaLabel}
                ariaLabelledBy={ariaLabelledBy}
                ariaDescribedBy={ariaDescribedBy}
                onClick={handleInputClick}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onClear={clear}
                
              />
            )}
          </Box>
        </Popover.Anchor>

        <Portal>
          <Popover.Positioner zIndex={1500}>
            <Popover.Content
              w="var(--reference-width)"
              p="0"
              rounded="md"
              borderWidth="1px"
              shadow="lg"
              overflow="hidden"
            >
              <ComboBoxList<T>
                listId={listId}
                options={showCreateRow ? [] : options}
                selectedValues={selectedValues}
                highlightedIndex={highlightedIndex}
                onHighlight={setHighlightedIndex}
                onSelect={handleSelect}
                multiple={multiple}
                renderItem={renderItem}
                isLoading={isLoading}
                error={error ?? (errorMessage && !isLoading ? errorMessage : null)}
                emptyMessage={emptyMessage}
                maxHeight={maxHeight}
                virtualized={virtualized}
                infiniteScroll={infiniteScroll || hasMore}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                onLoadMore={onLoadMore ?? loadMore}
                allowCreate={showCreateRow}
                createLabel={trimmedQuery}
                onCreate={handleCreate}
              />
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>

      {helperText && !invalid && <Field.HelperText>{helperText}</Field.HelperText>}
      {invalid && errorMessage && <Field.ErrorText>{errorMessage}</Field.ErrorText>}
    </Field.Root>
  );
}

export const ComboBox = forwardRef(ComboBoxInner) as <T>(
  props: ComboBoxProps<T> & { ref?: React.ForwardedRef<HTMLInputElement> }
) => ReturnType<typeof ComboBoxInner>;
