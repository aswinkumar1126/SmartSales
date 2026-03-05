// components/ui/SwitchInput.tsx
import React from 'react';
import { Switch, HStack, Text } from "@chakra-ui/react";

interface SwitchInputProps {
    value: any;
    onChange: (value: any) => void;
    disabled?: boolean;
    trueValue?: any;
    falseValue?: any;
    labels?: { on: string; off: string };
    size?: "xs" | "sm" | "md" | "lg";
    onBlur?: () => void;
}

export const SwitchInput = React.forwardRef<HTMLDivElement, SwitchInputProps>(({
    value,
    onChange,
    disabled = false,
    trueValue = true,
    falseValue = false,
    labels = { on: 'YES', off: 'NO' },
    size = "sm",
    onBlur
}, ref) => {
    const isChecked = value === trueValue;

    const handleChange = () => {
        onChange(isChecked ? falseValue : trueValue);
    };

    return (
        <HStack ref={ref} onBlur={onBlur} tabIndex={0}>
            <Switch.Root
                checked={isChecked}
                onCheckedChange={handleChange}
                disabled={disabled}
                size={size}
            >
                <Switch.HiddenInput />
                <Switch.Control />
                <Switch.Label>{isChecked ? labels.on : labels.off}</Switch.Label>
            </Switch.Root>
        </HStack>
    );
});

SwitchInput.displayName = 'SwitchInput';