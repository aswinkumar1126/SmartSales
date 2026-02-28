"use client";

import React from "react";
import { Input } from "@chakra-ui/react";
import { capitalizeText } from "@/utils/capitalize/capitalizeText";
import { useTheme } from "@/context/theme/themeContext";

type InputModeType =
    | "text"
    | "number"
    | "gst"
    | "mobile"
    | "aadhaar"
    | "pan"
    | "email"
    | "pincode";

type CapitalizedInputProps<T> = {
    value: string | undefined;
    field:any;
    onChange: (field: keyof T, value: any) => void;
    placeholder?: string;
    isCapitalized?: boolean;
    type?: "text" | "number" | "password";
    disabled?: boolean;
    max?: number;
    icon?: boolean;
    size?: "2xs" | "xs" | "sm" | "md" | "lg";

    /** 🔥 NEW */
    allowNegative?: boolean;
    confirmNegative?: boolean;
    onNegativeConfirm?: () => boolean | Promise<boolean>;
    autoFocus?: any;
    onKeyDown?: any;
    onEnter?: () => void; // ADD THIS
    inputRef?: any;
    onClassUse?: boolean;
    maxWidth?: string;
    allowDecimal?: boolean;
    allowSpecial?: boolean;
    decimalScale?: number;
    inputModeType?: InputModeType;
    rounded?: string;
    minWidth?: string;
    noBorder?:boolean;
};

export function CapitalizedInput<T>({
    value,
    field,
    onChange,
    placeholder,
    isCapitalized = true,
    type = "text",
    disabled = false,
    max,
    icon = false,
    size,
    autoFocus = false,
    allowNegative = false,
    confirmNegative = false,
    onNegativeConfirm,
    onKeyDown,
    onEnter, // ADD THIS
    inputRef,
    onClassUse = false,
    maxWidth,
    allowDecimal = true,
    allowSpecial = false,
    decimalScale = 3,
    inputModeType,
    rounded = "full",
    minWidth,
    noBorder
}: CapitalizedInputProps<T>) {
    const { theme } = useTheme();
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let inputValue = e.target.value;

        // For text, always allow typing
        if (type === "text" && isCapitalized) {
            onChange(field, capitalizeText(inputValue));
            return;
        }

        // For numbers, allow "-" temporarily if allowNegative
        if (type === "number") {
            if (!allowDecimal && inputValue.includes(".")) return;
            if (!allowNegative && inputValue.includes("-")) return;
            if (allowDecimal && inputValue.includes(".")) {
                const [_, decimals] = inputValue.split(".");
                if (decimals && decimals.length > decimalScale) return;
            }
            onChange(field, inputValue); // pass as string, parse later on save
            return;
        }

        // For modes like mobile, pan, gst etc, allow typing up to max length
        if (inputModeType === "mobile" || inputModeType === "aadhaar" || inputModeType === "pincode") {
            if (/^[0-9]*$/.test(inputValue)) {
                onChange(field, inputValue);
            }
            return;
        }

        if (inputModeType === "pan" || inputModeType === "gst") {
            onChange(field, inputValue.toUpperCase());
            return;
        }

        if (inputModeType === "email") {
            onChange(field, inputValue.toLowerCase());
            return;
        }

        // fallback
        onChange(field, inputValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const val = (e.target as HTMLInputElement).value;

        // Handle Enter key
        if (e.key === "Enter") {
            e.preventDefault();
            onEnter?.(); // Call the onEnter callback to focus next cell
        }

        // Number input validations
        if (type === "number") {
            if (!allowDecimal && e.key === ".") {
                e.preventDefault();
            }

            if (!allowNegative && e.key === "-") {
                e.preventDefault();
            }

            if (allowDecimal && e.key === "." && val.includes(".")) {
                e.preventDefault(); // only one dot
            }
        }

        onKeyDown?.(e);
    };

    return (
        // In CapitalizedInput component, update the ref handling:
        <Input
            type={type === "number" ? "number" : type}
            value={value ?? ""}
            pl={icon ? "2.5rem" : "0.2rem"}
            textTransform={isCapitalized ? "uppercase" : "none"}
            placeholder={placeholder}
            onChange={handleChange}
            disabled={disabled}
            max={type === "number" ? max : undefined}
            maxLength={type === "text" ? max : undefined}
            size={size}
            autoFocus={autoFocus}
            onKeyDown={handleKeyDown}
            ref={(el) => {
                if (inputRef) {
                    if (typeof inputRef === 'function') {
                        inputRef(el);
                    } else if (inputRef.current !== undefined) {
                        inputRef.current = el;
                    }
                }
            }}
            className={onClassUse ? "type-inputs" : ""}
            maxWidth={maxWidth}
            bg={noBorder ? '#ffffff':theme.colors.greyColor}
            fontSize='xs'
            rounded={rounded}
            minWidth={minWidth}
            border="1px solid transparent"
            _focus={{
                border: "1px solid #FFF",
                boxShadow: "none",
            }}
            _hover={{
                border: "1px solid #FFF",
            }}
            css={type === "number" ? {
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
                '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0,
                }
            } : undefined}
            _disabled={{
                opacity: 1,  // Keep full opacity
                cursor: 'not-allowed',  // Show disabled cursor
                bg: noBorder ? '#ffffff' : theme.colors.greyColor,  // Maintain background
                border: "1px solid transparent",  // Keep border consistent
                color:theme.colors.green,
                fontWeight:'bold'
            }}
        />

    );
}