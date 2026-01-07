"use client";

import React from "react";
import { Input } from "@chakra-ui/react";
import { capitalizeText } from "@/utils/capitalize/capitalizeText";

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
    size?: "xs" | "sm" | "md" | "lg";

    /** 🔥 NEW */
    allowNegative?: boolean;
    confirmNegative?: boolean;
    onNegativeConfirm?: () => boolean | Promise<boolean>;
    autoFocus?:any
    onKeyDown?:any;
    inputRef?:any;
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
    inputRef
}: CapitalizedInputProps<T>) {

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let inputValue = e.target.value;

        /* 🔒 TEXT VALIDATION */
        if (type === "text" && !/^[a-zA-Z0-9\s]*$/.test(inputValue)) {
            return;
        }

        /* 🔢 NUMBER VALIDATION */
        if (type === "number") {
            // Allow just "-" while typing
            if (inputValue === "-") {
                if (!allowNegative) return;
                onChange(field, inputValue);
                return;
            }

            const num = Number(inputValue);
            if (isNaN(num)) return;

            // ❌ Negative not allowed
            if (num < 0 && !allowNegative) return;

            // ⚠️ Confirm negative
            // if (num < 0 && confirmNegative) {
            //     let confirmed = true;

            //     if (onNegativeConfirm) {
            //         confirmed = await onNegativeConfirm();
            //     } else {
            //         confirmed = window.confirm(
            //             "You entered a negative value. Do you want to continue?"
            //         );
            //     }

            //     if (!confirmed) return;
            // }

            // 🔢 Max check
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
            onKeyDown={onKeyDown}
            
        />
    );
}
