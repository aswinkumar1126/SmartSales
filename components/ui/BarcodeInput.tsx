// components/ui/BarcodeInput.tsx
import React from 'react';
import { Input } from "@chakra-ui/react";

interface BarcodeInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    size?: "2xs" | "xs" | "sm" | "md" | "lg";
    maxLength?: number;
    onBlur?: () => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    autoFocus?: boolean;
}

export const BarcodeInput = React.forwardRef<HTMLInputElement, BarcodeInputProps>(({
    value,
    onChange,
    disabled = false,
    placeholder = "Scan barcode...",
    size = "sm",
    maxLength = 50,
    onBlur,
    onKeyDown,
    autoFocus
}, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow alphanumeric and common barcode characters
        const sanitized = e.target.value.replace(/[^A-Za-z0-9\-]/g, '');
        onChange(sanitized.toUpperCase());
    };

    return (
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
        />
    );
});

BarcodeInput.displayName = 'BarcodeInput';