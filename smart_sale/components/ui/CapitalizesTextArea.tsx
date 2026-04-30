"use client";

import React, { useRef, useState } from "react";
import { Input, Textarea } from "@chakra-ui/react";
import { Dialog } from "@chakra-ui/react";
import { capitalizeText } from "@/utils/capitalize/capitalizeText";
import { useTheme } from "@/context/theme/themeContext";

type Mode = "inline" | "dialog";

type TextareaFieldProps<T> = {
    value?: string;
    field: keyof T;
    onChange: (field: keyof T, value: any) => void;
    placeholder?: string;
    isCapitalized?: boolean;
    onEnter?: () => void;
    max?: number;
    mode?: Mode;
    allowFocus?: boolean;
    rows?: number;
    fontSize?: '2xs' | 'xs' | 'sm' | 'md' | string;
    title?: string;
    inputRef?: React.Ref<HTMLTextAreaElement>; // 🔥 NEW: Add ref prop
    dialogInputRef ? :React.Ref<HTMLInputElement>
    disable? : boolean
};

export function TextareaField<T>({
    value = "",
    field,
    onChange,
    placeholder = "Enter description",
    isCapitalized = true,
    onEnter,
    max,
    mode = "dialog",
    allowFocus = true,
    rows = 5,
    fontSize = 'xs',
    title = "DESCRIPTION",
    inputRef, // 🔥 NEW: Destructure ref prop
    dialogInputRef,
    disable = false

}: TextareaFieldProps<T>) {
    const { theme } = useTheme();
    const [open, setOpen] = useState(false);
    const internalRef = useRef<HTMLTextAreaElement>(null); // 🔥 NEW: Internal ref for dialog mode
    const dialogTextareaRef = useRef<HTMLTextAreaElement>(null); // 🔥 NEW: Ref for dialog textarea

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        let val = e.target.value;

        if (max && val.length > max) return;

        onChange(field, isCapitalized ? capitalizeText(val) : val);
    };

    // 🔥 NEW: Combine refs helper function
    const combineRefs = (el: HTMLTextAreaElement | null) => {
        // Set internal ref
        (internalRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;

        // Set the passed ref
        if (inputRef) {
            if (typeof inputRef === 'function') {
                inputRef(el);
            } else if (inputRef && 'current' in inputRef) {
                (inputRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
            }
        }
    };

    /* ================= INLINE MODE ================= */
    if (mode === "inline") {
        return (
            <Textarea
                ref={combineRefs} // 🔥 NEW: Use combined ref
                value={value}
                rows={rows}
                resize="none"
                fontSize={fontSize}
                placeholder={placeholder}
                textTransform={isCapitalized ? "uppercase" : "none"}
                onChange={handleChange}
                autoFocus={allowFocus}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onEnter?.();
                    }
                }}
                border="1px solid #DDD"
                bg={theme.colors.whiteColor}
                _focus={{ border: "1px solid #999", boxShadow: "none" }}
                disabled={disable}
            />
        );
    }

    /* ================= DIALOG MODE ================= */
    return (
        <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)} placement={'top'}>
            
                <Dialog.Trigger asChild>
                        <Input
                            ref={(el) => {
                                if (dialogInputRef) {
                                    if (typeof dialogInputRef === 'function') {
                                        dialogInputRef(el);
                                    } else if (dialogInputRef.current !== undefined) {
                                        dialogInputRef.current = el;
                                    }
                                }
                            }}
                            value={value || ""}
                            placeholder={placeholder}
                            size="xs"
                            readOnly
                            cursor="pointer"
                            fontSize="xs"
                            textTransform={isCapitalized ? "uppercase" : "none"}
                            bg={theme.colors.whiteColor}
                            border="1px solid #DDD"
                            onClick={() => setOpen(true)}
                            onFocus={() => {
                                if (allowFocus) setOpen(true);
                            }}
                            onKeyDown={(e) => {
                                // 🔥 Open dialog on Enter or Space when focused
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setOpen(true);
                                }
                            }}
                            _hover={{ border: "1px solid #999" }}
                            _focus={{ boxShadow: "none", border: "1px solid #999" }}
                            disabled={disable}
                        />
            </Dialog.Trigger>

            <Dialog.Positioner p={0} gap={0}>
                <Dialog.Content minW={'300px'} maxW="400px" p={0}>
                    <Dialog.Header p={1} gap={0} bg={theme.colors.sideBar} alignItems={'center'}>
                        <Dialog.Title fontSize="sm" color={'white'}>
                            {title}
                        </Dialog.Title>
                    </Dialog.Header>

                    <Dialog.Body p={2} gap={0}>
                        <Textarea
                            
                            value={value}
                            autoFocus
                            rows={rows}
                            resize="none"
                            fontSize={fontSize}
                            placeholder={placeholder}
                            textTransform={isCapitalized ? "uppercase" : "none"}
                            onChange={handleChange}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    setOpen(false);
                                    onEnter?.();
                                }
                            }}
                            border="1px solid #DDD"
                            _focus={{
                                border: "1px solid #999",
                                boxShadow: "none",
                            }}
                            
                        />
                    </Dialog.Body>

                    <Dialog.CloseTrigger />
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
}