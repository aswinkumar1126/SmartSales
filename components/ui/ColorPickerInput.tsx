// components/ui/ColorPickerInput.tsx
import React from 'react';
import { Box, Input, Popover, Portal } from "@chakra-ui/react";

interface ColorPickerInputProps {
    value: string;
    onChange: (color: string) => void;
    disabled?: boolean;
    placeholder?: string;
    onBlur?: () => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const ColorPickerInput = React.forwardRef<HTMLInputElement, ColorPickerInputProps>(({
    value,
    onChange,
    disabled = false,
    placeholder = "Pick a color",
    onBlur,
    onKeyDown
}, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <Box display="flex" alignItems="center" gap={2}>
            <Box
                w="30px"
                h="30px"
                bg={value || '#000000'}
                borderRadius="md"
                border="1px solid"
                borderColor="gray.300"
                cursor={disabled ? 'not-allowed' : 'pointer'}
                onClick={() => !disabled && setIsOpen(true)}
            />
            <Input
                ref={ref}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                size="sm"
                onBlur={onBlur}
                onKeyDown={onKeyDown}
            />
            {isOpen && !disabled && (
                <Portal>
                    <Box position="absolute" zIndex={9999}>
                        <input
                            type="color"
                            value={value}
                            onChange={(e) => {
                                onChange(e.target.value);
                                setIsOpen(false);
                            }}
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                width: '200px',
                                height: '200px'
                            }}
                        />
                    </Box>
                </Portal>
            )}
        </Box>
    );
});

ColorPickerInput.displayName = 'ColorPickerInput';