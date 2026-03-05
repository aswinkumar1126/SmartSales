"use client";

import React, { forwardRef } from "react";
import { NativeSelect } from "@chakra-ui/react";
import { For } from "@chakra-ui/react";

export type SelectItem = {
    label: string;
    value: string;
};

type NativeSelectWrapperProps = {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    items: SelectItem[];
    placeholder?: string;
    size?: "xs" | "sm" | "md" | "lg";
    maxW?: string;
    fontSize?: string;
    disabled?: boolean;
    onEnter?: () => void; // <-- add this
    className?: string;
    css?: any;
    onBlur?:()=>void;
};

export const NativeSelectWrapper = forwardRef<HTMLSelectElement, NativeSelectWrapperProps>(({
    value,
    onChange,
    items,
    placeholder = "Select",
    size = "xs",
    maxW = "90px",
    fontSize = "10px",
    disabled = false,
    onEnter,
    className,
    css,
    onBlur
}, ref) => {

    const handleKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
        if (e.key === "Enter") {
            e.preventDefault(); // prevent opening dropdown
            e.stopPropagation();
            onEnter?.(); // call your navigation function
        }
    };

    return (
        <NativeSelect.Root size={size} maxW={maxW} fontSize={fontSize} disabled={disabled} onBlur={onBlur}>
            <NativeSelect.Field
                ref={ref}
                value={value}
                onChange={onChange}
                onKeyDown={handleKeyDown} // use custom handler
                className={className}
                css={{
                    backgroundColor: "#eee",
                    color: "#111827",
                    border: "1px solid #e5e7eb",
                    borderRadius: "20px",
                    height: "30px",
                    fontSize: fontSize,
                    ...css,
                }}
            >
                {/* Optional placeholder */}
                {/* <option value="">{placeholder}</option> */}
                <For each={items}>
                    {(item) => (
                        <option key={item.value} value={item.value}>
                            {item.label}
                        </option>
                    )}
                </For>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
        </NativeSelect.Root>
    );
});

NativeSelectWrapper.displayName = 'NativeSelectWrapper';