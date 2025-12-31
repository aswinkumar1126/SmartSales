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
}: CapitalizedInputProps<T>) {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let inputValue = e.target.value;

        // 🔒 Allow only alphanumeric + space
        if (type === "text" && !/^[a-zA-Z0-9\s]*$/.test(inputValue)) {
            return;
        }

        // 🔢 Number max
        if (type === "number" && max !== undefined) {
            const num = Number(inputValue);
            if (!isNaN(num) && num > max) return;
        }

        // 🔤 Text max length
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
            pl={icon ? "2.5rem" : "0.25rem"}   // ✅ correct spacing
            textTransform={isCapitalized ? "uppercase" : "none"}
            placeholder={placeholder}
            onChange={handleChange}
            disabled={disabled}
            max={type === "number" ? max : undefined}
            maxLength={type === "text" ? max : undefined}
        />
    );
}
