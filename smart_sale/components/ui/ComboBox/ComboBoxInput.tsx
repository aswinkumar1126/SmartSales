"use client";

import { forwardRef, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { Box, Flex, IconButton, Input, Spinner } from "@chakra-ui/react";
import { LuChevronDown, LuX } from "react-icons/lu";
import { ComboBoxChip } from "./ComboBoxChip";
import type { ComboBoxOption, ComboBoxSize } from "./types";

export interface ComboBoxInputProps<T> {
  id: string;
  listId: string;
  activeDescendantId?: string;
  open: boolean;

  inputValue: string;
  onInputValueChange: (value: string) => void;

  placeholder?: string;
  size?: ComboBoxSize;
  variant?: "outline" | "subtle" | "flushed";

  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
  searchable?: boolean;
  autoFocus?: boolean;

  loading?: boolean;
  clearable?: boolean;

  leftIcon?: ReactNode;
  rightIcon?: ReactNode;

  multiple?: boolean;
  chips?: ComboBoxOption<T>[];
  onRemoveChip?: (value: string | number) => void;

  name?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;

  onClick: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

const SIZE_MAP: Record<ComboBoxSize, "sm" | "md" | "lg"> = { sm: "sm", md: "md", lg: "lg" };

function ComboBoxInputInner<T>(
  {
    id,
    listId,
    activeDescendantId,
    open,
    inputValue,
    onInputValueChange,
    placeholder,
    size = "md",
    variant = "outline",
    disabled,
    readOnly,
    required,
    invalid,
    searchable = true,
    autoFocus,
    loading,
    clearable = true,
    leftIcon,
    rightIcon,
    multiple,
    chips = [],
    onRemoveChip,
    name,
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    onClick,
    onFocus,
    onBlur,
    onKeyDown,
    onClear,
  }: ComboBoxInputProps<T>,
  ref: React.ForwardedRef<HTMLInputElement>
) {
  const hasValue = multiple ? chips.length > 0 : inputValue.length > 0;
  const showClear = clearable && !disabled && !readOnly && hasValue;

  return (
    <Box
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-owns={listId}
      aria-controls={listId}
      aria-activedescendant={activeDescendantId}
      position="relative"
      w="full"
    >
      <Flex
        align="center"
        gap="1.5"
        wrap={multiple ? "wrap" : "nowrap"}
        w="full"
        px="2"
        py={multiple && chips.length > 0 ? "1.5" : undefined}
        borderWidth={variant === "flushed" ? "0" : "1px"}
        borderBottomWidth={variant === "flushed" ? "1px" : undefined}
        borderColor={invalid ? "border.error" : "border"}
        rounded={variant === "flushed" ? "none" : "md"}
        bg={disabled ? "bg.disabled" : variant === "subtle" ? "bg.muted" : "bg"}
        _focusWithin={disabled ? undefined : { borderColor: "colorPalette.solid", boxShadow: variant === "flushed" ? "0 1px 0 0 var(--chakra-colors-color-palette-solid)" : "0 0 0 1px var(--chakra-colors-color-palette-solid)" }}
        cursor={disabled ? "not-allowed" : readOnly ? "default" : "text"}
        opacity={disabled ? 0.6 : 1}
        onClick={() => !disabled && onClick()}
      >
        {leftIcon && (
          <Box color="fg.muted" display="flex" flexShrink={0}>
            {leftIcon}
          </Box>
        )}

        {multiple &&
          chips.map((chip) => (
            <ComboBoxChip
              key={chip.value}
              label={chip.label}
              disabled={disabled || readOnly}
              onRemove={() => onRemoveChip?.(chip.value)}
            />
          ))}

        <Input
          ref={ref}
          id={id}
          name={name}
          value={inputValue}
          onChange={(e) => onInputValueChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={hasValue && multiple ? "" : placeholder}
          disabled={disabled}
          readOnly={readOnly || !searchable}
          required={required}
          autoFocus={autoFocus}
          autoComplete="off"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-autocomplete={searchable ? "list" : "none"}
          size={SIZE_MAP[size]}
          border="none"
          outline="none"
          bg="transparent"
          px="0"
          h="32px"
          _focusVisible={{ boxShadow: "none" }}
          flex="1"
          minW="80px"
          cursor={readOnly || !searchable ? "pointer" : "text"}
        />

        {loading && <Spinner size="xs" flexShrink={0} />}

        {showClear && !loading && (
          <IconButton
            aria-label="Clear selection"
            size="2xs"
            variant="ghost"
            color="fg.muted"
            minW="auto"
            h="auto"
            p="0.5"
            flexShrink={0}
            onMouseDown={(e: MouseEvent<HTMLButtonElement>) => e.preventDefault()}
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              onClear();
            }}
            _hover={{ color: "fg" }}
          >
            <LuX size={14} />
          </IconButton>
        )}

        <Box color="fg.muted" display="flex" flexShrink={0} transform={open ? "rotate(180deg)" : undefined} transition="transform 0.15s">
          {rightIcon ?? <LuChevronDown size={14} />}
        </Box>
      </Flex>
    </Box>
  );
}

export const ComboBoxInput = forwardRef(ComboBoxInputInner) as <T>(
  props: ComboBoxInputProps<T> & { ref?: React.ForwardedRef<HTMLInputElement> }
) => ReturnType<typeof ComboBoxInputInner>;
