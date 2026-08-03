"use client";

import { memo, type MouseEvent } from "react";
import { HStack, IconButton, Text } from "@chakra-ui/react";
import { LuX } from "react-icons/lu";

export interface ComboBoxChipProps {
  label: string;
  onRemove: () => void;
  disabled?: boolean;
}

/** A single removable tag shown in the input for multi-select mode. */
function ComboBoxChipBase({ label, onRemove, disabled }: ComboBoxChipProps) {
  return (
    <HStack
      gap="1"
      bg="colorPalette.subtle"
      color="colorPalette.fg"
      rounded="sm"
      px="1"
      py="0.25"
      fontSize="2xs"
      fontWeight="medium"
      maxW="100%"
    >
      <Text truncate maxW="160px">
        {label}
      </Text>
      {!disabled && (
        <IconButton
          aria-label={`Remove ${label}`}
          size="2xs"
          variant="ghost"
          minW="auto"
          h="auto"
          p="0.5"
          onMouseDown={(e: MouseEvent<HTMLButtonElement>) => e.preventDefault()}
          onClick={(e: MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            onRemove();
          }}
          _hover={{ opacity: 0.7 }}
        >
          <LuX size={12} />
        </IconButton>
      )}
    </HStack>
  );
}

export const ComboBoxChip = memo(ComboBoxChipBase) as typeof ComboBoxChipBase;
