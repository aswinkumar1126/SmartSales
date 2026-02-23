"use client";

import React, { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
    Combobox,
    Portal,
    NativeSelect,
    For,
    Box
} from "@chakra-ui/react";

import { formatDateForAPI } from "@/utils/format/formatDateForAPI";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";

/* ---------------- TYPES ---------------- */

type EditableType =
    | "text"
    | "number"
    | "numbers"
    | "password"
    | "date"
    | "select"
    | "combobox";

interface OptionItem {
    label: string;
    value: string | number;
}

interface EditableCellProps {
    value: any;
    type: EditableType;
    onSave: (value: any) => Promise<void>;
    className?: string;
    options?: OptionItem[];
    collection?: { items: OptionItem[] };
    getLabelByValue?: (collection: any, value: any) => string;
    onInputValueChange?: (input: string) => void;
    onClassUse?: boolean;
    inputRef?: (el: any) => void;
    onEnter?: () => void;
}

/* ---------------- COMBOBOX COMPONENT ---------------- */

const ComboBoxEditor = React.forwardRef<HTMLInputElement, {
    value: any;
    collection: any;
    getLabelByValue?: (collection: any, value: any) => string;
    onSave: (value: any) => Promise<void>;
    onFilter?: (input: string) => void;
    onEnter?: () => void;
}>(({ value, collection, getLabelByValue, onSave, onFilter, onEnter }, ref) => {
    const [inputValue, setInputValue] = useState(getLabelByValue?.(collection, value) ?? "");
    const [isSaving, setIsSaving] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedValue, setHighlightedValue] = useState<string | null>(null);
    const [filteredItems, setFilteredItems] = useState(collection?.items || []);

    useEffect(() => {
        setInputValue(getLabelByValue?.(collection, value) ?? "");
        setFilteredItems(collection?.items || []);
    }, [value, collection]);

    const handleValueChange = async (details: any) => {
        if (isSaving) return;
        const val = details.value[0] ?? "";
        setIsSaving(true);
        try {
            await onSave(val);
            setIsOpen(false);
            setTimeout(() => onEnter?.(), 50);
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !isSaving) {
            e.preventDefault();
            e.stopPropagation();

            if (isOpen && filteredItems.length > 0) {
                // Use highlighted item if user arrowed down, otherwise use first filtered item
                const targetValue = highlightedValue ?? filteredItems[0]?.value;
                const targetItem = filteredItems.find((item: any) =>
                    String(item.value) === String(targetValue)
                ) ?? filteredItems[0];

                if (targetItem) {
                    await handleValueChange({ value: [targetItem.value] });
                }
            } else {
                // Dropdown closed, just move to next
                onEnter?.();
            }
        }
    };

    return (
        <Box>
            <Combobox.Root
                collection={collection}
                openOnClick
                open={isOpen}
                onOpenChange={(e) => setIsOpen(e.open)}
                value={value ? [String(value)] : []}
                inputValue={inputValue}
                onValueChange={handleValueChange}
                onInputValueChange={(e) => {
                    const val = e.inputValue;
                    setInputValue(val);
                    onFilter?.(val);
                    // Filter items locally
                    const filtered = (collection?.items || []).filter((item: any) =>
                        item.label.toLowerCase().includes(val.toLowerCase())
                    );
                    setFilteredItems(filtered);
                    setIsOpen(val.length > 0);
                }}
                onHighlightChange={(e) => {
                    setHighlightedValue(e.highlightedValue);
                }}
                size="xs"
                w="90%"
            >
                <Combobox.Control>
                    <Combobox.Input
                        placeholder="Type to search"
                        ref={ref}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                    <Combobox.IndicatorGroup>
                        <Combobox.ClearTrigger />
                        <Combobox.Trigger />
                    </Combobox.IndicatorGroup>
                </Combobox.Control>

                <Portal>
                    <Combobox.Positioner>
                        <Combobox.Content>
                            <Combobox.Empty>No items found</Combobox.Empty>
                            {filteredItems.map((item: any) => (
                                <Combobox.Item key={item.value} item={item} fontSize="9px">
                                    {item.label}
                                    <Combobox.ItemIndicator />
                                </Combobox.Item>
                            ))}
                        </Combobox.Content>
                    </Combobox.Positioner>
                </Portal>
            </Combobox.Root>
        </Box>
    );
});

ComboBoxEditor.displayName = "ComboBoxEditor";

/* ---------------- MAIN COMPONENT ---------------- */

const EditableCell: React.FC<EditableCellProps> = ({
    value,
    type,
    onSave,
    className = "",
    options = [],
    collection,
    getLabelByValue,
    onInputValueChange,
    onClassUse,
    inputRef,
    onEnter,
}) => {
    // Start in edit mode if inputRef is provided (table inline editing)
    const [isEditing, setIsEditing] = useState(!!inputRef);
    const [isSaving, setIsSaving] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRefInternal = useRef<any>(null);

    const setRef = (el: any) => {
        if (inputRef) inputRef(el);
        inputRefInternal.current = el;
    };

    const parseDate = (val: any) => {
        if (!val) return null;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    };

    const [editValue, setEditValue] = useState<any>(
        type === "date" ? parseDate(value) : value ?? ""
    );

    // Keep editValue in sync when value prop changes
    useEffect(() => {
        setEditValue(type === "date" ? parseDate(value) : value ?? "");
    }, [value]);

    /* ---------------- SAVE ---------------- */

    const saveValue = async (val = editValue) => {
        if (isSaving) return;
        try {
            setIsSaving(true);
            let finalValue = val;

            if (type === "date" && val) {
                finalValue = formatDateForAPI(val);
            }

            if ((type === "number" || type === "numbers") && val !== "") {
                const num = parseFloat(val);
                if (isNaN(num)) return;
                finalValue = num;
            }

            await onSave(finalValue);
            // Only exit edit mode if not in table mode (no inputRef)
            if (!inputRef) setIsEditing(false);
        } finally {
            setIsSaving(false);
        }
    };

    /* ---------------- CLICK OUTSIDE ---------------- */

    useEffect(() => {
        if (!isEditing || inputRef) return; // Don't handle outside clicks in table mode

        const handleOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                saveValue();
            }
        };

        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, [isEditing, editValue]);

    /* ---------------- DISPLAY VALUE ---------------- */

    const displayValue = () => {
        if (value == null || value === "") return "-";
        if (type === "date") return new Date(value).toLocaleDateString("en-GB");
        if (type === "numbers") return new Intl.NumberFormat("en-IN").format(value);
        if (type === "select") return options.find(o => o.value === value)?.label ?? value;
        if (type === "combobox" && collection && getLabelByValue)
            return getLabelByValue(collection, value);
        return value;
    };

    /* ---------------- EDIT MODE ---------------- */

    if (isEditing) {
        if (type === "date") {
            return (
                <DatePicker
                    selected={editValue}
                    onChange={(d: any) => setEditValue(d)}
                    dateFormat="dd-MM-yyyy"
                    className="w-full px-2 py-1 border border-blue-500 rounded"
                    autoFocus
                />
            );
        }

        if (type === "select") {
            return (
                <div ref={wrapperRef}>
                    <NativeSelect.Root>
                        <NativeSelect.Field
                            value={editValue}
                            onChange={(e) => {
                                setEditValue(e.target.value);
                                saveValue(e.target.value);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    saveValue(editValue);
                                    onEnter?.();
                                }
                            }}
                            ref={setRef as any}
                            autoFocus
                        >
                            <For each={options}>
                                {(item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                )}
                            </For>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                </div>
            );
        }

        if (type === "combobox" && collection) {
            return (
                <ComboBoxEditor
                    ref={setRef}
                    value={value}
                    collection={collection}
                    getLabelByValue={getLabelByValue}
                    onSave={onSave}
                    onFilter={onInputValueChange}
                    onEnter={onEnter}
                />
            );
        }

        /* TEXT / NUMBER */
        return (
            <div
                ref={wrapperRef}
                onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        await saveValue();
                        onEnter?.();
                    }
                    if (e.key === "Escape") {
                        e.preventDefault();
                        if (!inputRef) setIsEditing(false);
                    }
                }}
            >
                <CapitalizedInput
                    field="value"
                    type={type === "text" ? "text" : "number"}
                    value={editValue}
                    isCapitalized={type === "text"}
                    onChange={(_, v) => setEditValue(v)}
                    allowNegative
                    confirmNegative
                    onClassUse={onClassUse}
                    inputRef={setRef}
                    autoFocus
                    onEnter={() => {
                        saveValue();
                        onEnter?.();
                    }}
                    rounded="sm"
                />
            </div>
        );
    }

    /* ---------------- VIEW MODE ---------------- */

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`cursor-pointer px-1 py-1 hover:bg-blue-50 rounded min-w-0 ${className}`}
        >
            {displayValue()}
        </div>
    );
};

export default EditableCell;