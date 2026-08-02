import { HStack, RadioGroup } from "@chakra-ui/react";
import React from 'react';

interface RadioOption {
    value: string;
    label: string;
}

interface RadioProps {
    collection: RadioOption[];
    value: string;
    onChange: (value: string) => void;
    isDisabled?: boolean;
    defaultValue?: string;
    size?: "xs" | "sm" | "md" | "lg";
    onKeyDown?: (e: React.KeyboardEvent) => void;
    onBlur?: () => void;
}

const RadioButton = React.forwardRef<HTMLDivElement, RadioProps>(({
    collection,
    value,
    onChange,
    isDisabled = false,
    defaultValue,
    size,
    onKeyDown,
    onBlur
}, ref) => {
    return (
        <div ref={ref} onKeyDown={onKeyDown} tabIndex={0} onBlur={onBlur} >
            <RadioGroup.Root
                value={value}
                onValueChange={(e) => e.value && onChange(e.value)}
                disabled={isDisabled}
                defaultValue={defaultValue}
                size={size}
            >
                <HStack gap="6" flexWrap="wrap">
                    {collection.map((item) => (
                        <RadioGroup.Item key={item.value} value={item.value}>
                            <RadioGroup.ItemHiddenInput />
                            <RadioGroup.ItemIndicator />
                            <RadioGroup.ItemText fontSize="x-small">{item.label}</RadioGroup.ItemText>
                        </RadioGroup.Item>
                    ))}
                </HStack>
            </RadioGroup.Root>
        </div>
    );
});

RadioButton.displayName = 'RadioButton';

export default RadioButton;