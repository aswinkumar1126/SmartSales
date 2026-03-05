// components/ui/CurrencyInput.tsx
import React from 'react';
import { Input, InputGroup, InputElement } from "@chakra-ui/react";
import { Box } from 'lucide-react';

interface CurrencyInputProps {
    value: string | number;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    size?: "2xs" | "xs" | "sm" | "md" | "lg";
    maxLength?: number;
    decimalScale?: number;
    onBlur?: () => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    autoFocus?: boolean;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(({
    value,
    onChange,
    disabled = false,
    placeholder = "0.00",
    size = "sm",
    maxLength,
    decimalScale = 2,
    onBlur,
    onKeyDown,
    autoFocus
}, ref) => {
    const formatCurrency = (val: string) => {
        if (!val) return '';
        const num = parseFloat(val.replace(/[^\d.-]/g, ''));
        if (isNaN(num)) return '';
        return num.toFixed(decimalScale);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const formatted = formatCurrency(rawValue);
        onChange(formatted);
    };

    return (
        <Box>
            <InputElement>₹</InputElement>
            <Input
                ref={ref}
                type="text"
                value={value}
                onChange={handleChange}
                disabled={disabled}
                placeholder={placeholder}
                size={size}
                maxLength={maxLength}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                autoFocus={autoFocus}
                pl="25px"
            />
        </Box>
    );
});

CurrencyInput.displayName = 'CurrencyInput';