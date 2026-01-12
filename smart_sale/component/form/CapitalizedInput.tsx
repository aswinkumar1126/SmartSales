"use client";

import React from "react";
import { Input } from "@chakra-ui/react";
import { capitalizeText } from "@/utils/capitalize/capitalizeText";
import { useTheme } from "@/context/theme/themeContext";
type CapitalizedInputProps<T> = {
    value: string | undefined;
    field: keyof T;
    onChange: (field: keyof T, value: any) => void;
    placeholder?: string;
    isCapitalized?: boolean;
    type?: "text" | "number" | "password";
    disabled?: boolean;
    max?: number;
    icon?: boolean;
    size?:"2xs"| "xs" | "sm" | "md" | "lg";

    /** 🔥 NEW */
    allowNegative?: boolean;
    confirmNegative?: boolean;
    onNegativeConfirm?: () => boolean | Promise<boolean>;
    autoFocus?:any
    onKeyDown?:any;
    inputRef?:any;
    onClassUse?:boolean;
    maxWidth?:string;
    allowDecimal?: boolean;
    allowSpecial?: boolean; // NEW
    decimalScale?: number; // how many digits after decimal
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
    onKeyDown ,
    inputRef,
    onClassUse=false,
    maxWidth,
    allowDecimal = true,
    allowSpecial=false,
    decimalScale = 3,
}: CapitalizedInputProps<T>) {
    const { theme } = useTheme();

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let inputValue = e.target.value;

        /* 🔒 TEXT VALIDATION */
        if (type === "text") {
            let regex = /^[a-zA-Z0-9\s]*$/; // default

            if (allowDecimal) {
                regex = /^[a-zA-Z0-9\s.]*$/; // allow dot
            }

            if (allowSpecial) {
                regex = /^[^]*$/; // allow everything
            }

            if (!regex.test(inputValue)) return;
        }

        /* 🔢 NUMBER VALIDATION */
        if (type === "number") {
            if (inputValue === "-") {
                if (!allowNegative) return;
                onChange(field, inputValue);
                return;
            }

            if (!allowDecimal && inputValue.includes(".")) return;

            // ⛔ Limit decimal places
            if (allowDecimal && inputValue.includes(".")) {
                const [_, decimals] = inputValue.split(".");
                if (decimals && decimals.length > decimalScale) return;
            }

            const num = Number(inputValue);
            if (isNaN(num)) return;

            if (num < 0 && !allowNegative) return;
            if (max !== undefined && num > max) return;
        }


        /* 🔤 TEXT MAX LENGTH */
        if (type === "text" && max !== undefined && inputValue.length > max) {
            return;
        }

        onChange(
            field,
            isCapitalized && type === "text"
                ? capitalizeText(inputValue)
                : inputValue
        );
    };

    return (
        <Input
            type={type}
            value={value ?? ""}
            pl={icon ? "2.5rem" : "0.25rem"}
            textTransform={isCapitalized ? "uppercase" : "none"}
            placeholder={placeholder}
            onChange={handleChange}
            disabled={disabled}
            max={type === "number" ? max : undefined}
            maxLength={type === "text" ? max : undefined}
            size={size}
            autoFocus={autoFocus}
            onKeyDown={(e) => {
                const val = (e.target as HTMLInputElement).value;

                if (type === "number" && !allowDecimal && e.key === ".") {
                    e.preventDefault();
                }

                if (type === "number" && !allowNegative && e.key === "-") {
                    e.preventDefault();
                }

                if (allowDecimal && e.key === "." && val.includes(".")) {
                    e.preventDefault(); // only one dot
                }

                onKeyDown?.(e);
            }}

            className={onClassUse ? "type-inputs":""}
            maxWidth={maxWidth}
            bg={theme.colors.greyColor}
            fontSize='2xs'
            
        />
    );
}
