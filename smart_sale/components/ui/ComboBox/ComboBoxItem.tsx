"use client";

import { memo, type CSSProperties, type ReactNode } from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";
import type { ComboBoxOption } from "./types";

export interface ComboBoxItemProps<T> {
  id: string;
  option: ComboBoxOption<T>;
  selected: boolean;
  highlighted: boolean;
  multiple?: boolean;
  style?: CSSProperties;
  renderItem?: (item: T, selected: boolean, highlighted: boolean) => ReactNode;
  onSelect: () => void;
  onHighlight: () => void;
}

function ComboBoxItemBase<T>({
  id,
  option,
  selected,
  highlighted,
  multiple,
  style,
  renderItem,
  onSelect,
  onHighlight,
}: ComboBoxItemProps<T>) {
  return (
    <Box
      id={id}
      role="option"
      aria-selected={selected}
      aria-disabled={option.disabled || undefined}
      data-highlighted={highlighted || undefined}
      style={style}
      px="3"
      py="2"
      fontSize="xs"
      cursor={option.disabled ? "not-allowed" : "pointer"}
      opacity={option.disabled ? 0.5 : 1}
      bg={highlighted ? "colorPalette.subtle" : "transparent"}
      color={highlighted ? "colorPalette.fg" : "fg"}
      _hover={option.disabled ? undefined : { bg: "colorPalette.subtle" }}
      onMouseDown={(e) => e.preventDefault()} // keep focus on the input
      onMouseEnter={() => !option.disabled && onHighlight()}
      onClick={() => !option.disabled && onSelect()}
    >
      {renderItem ? (
        renderItem(option.item, selected, highlighted)
      ) : (
        <HStack justify="space-between" gap="2">
          <Text truncate>{option.label}</Text>
          {selected && (
            <Box color="colorPalette.solid" flexShrink={0}>
              <LuCheck size={14} aria-hidden />
            </Box>
          )}
        </HStack>
      )}
    </Box>
  );
}

export const ComboBoxItem = memo(ComboBoxItemBase) as typeof ComboBoxItemBase;
