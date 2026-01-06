"use client";

import React, { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
    Combobox,
    Portal,
    Field,
    NativeSelect,
    For,
    useFilter,
    useListCollection,
    Box
} from "@chakra-ui/react";

import { formatDateForAPI } from "@/utils/format/formatDateForAPI";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { Toaster ,toaster } from "@/components/ui/toaster";
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

    /* select */
    options?: OptionItem[];

    /* combobox */
    collection?: {
        items: OptionItem[];
    };
    getLabelByValue?: (collection: any, value: any) => string;
    onInputValueChange?: (input: string) => void;

}

/* ---------------- COMBOBOX COMPONENT ---------------- */

const ComboBoxEditor: React.FC<{
    value: any;
    collection: any;
    getLabelByValue?: (collection: any, value: any) => string;
    onSave: (value: any) => Promise<void>;
    onFilter?: (input: string) => void;   // 🔥 pass filter function
}> = ({
    value,
    collection,
    getLabelByValue,
    onSave,
    onFilter,
}) => {

    const [inputValue, setInputValue] = useState(getLabelByValue?.(collection, value) ?? "");

    useEffect(() => {
        setInputValue(getLabelByValue?.(collection, value) ?? "");
    }, [value, collection]);
        const [isSaving, setIsSaving] = useState(false);

        const handleValueChange = async (details: any) => {
            if (isSaving) return;

            const val = details.value[0] ?? "";
            setIsSaving(true);
            try {
                await onSave(val);
            } finally {
                setIsSaving(false);
            }
        };


        return (
            <Box w="100%">
                <Combobox.Root
                    collection={collection}
                    openOnClick
                    value={value ? [String(value)] : []}
                    inputValue={inputValue}              // ✅ controlled input
                    onValueChange={handleValueChange}
                    onInputValueChange={(e) => {
                        setInputValue(e.inputValue);  // update the input while typing
                        onFilter?.(e.inputValue);     // apply the filter to collection
                    }}
                    size="xs"
                >
                    <Combobox.Control>
                        <Combobox.Input placeholder="Type to search" />
                        <Combobox.IndicatorGroup>
                            <Combobox.ClearTrigger />
                            <Combobox.Trigger />
                        </Combobox.IndicatorGroup>
                    </Combobox.Control>

                    <Portal>
                        <Combobox.Positioner>
                            <Combobox.Content>
                                <Combobox.Empty>No items found</Combobox.Empty>

                                {collection.items.map((item: any) => (
                                    <Combobox.Item key={item.value} item={item}>
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
    };

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
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const parseDate = (val: any) => {
        if (!val) return null;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    };

    const [editValue, setEditValue] = useState<any>(
        type === "date" ? parseDate(value) : value ?? ""
    );

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
            setIsEditing(false);
        } finally {
            setIsSaving(false);
        }
    };

    /* ---------------- CLICK OUTSIDE ---------------- */

    useEffect(() => {
        if (!isEditing) return;

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

        if (type === "numbers")
            return new Intl.NumberFormat("en-IN").format(value);

        if (type === "select")
            return options.find(o => o.value === value)?.label ?? value;

        if (type === "combobox" && collection && getLabelByValue)
            return getLabelByValue(collection, value);

        return value;
    };

    /* ---------------- EDIT MODE ---------------- */

    if (isEditing) {
        /* DATE */
        if (type === "date") {
            return (
                <DatePicker
                    selected={editValue}
                    onChange={(d:any) => setEditValue(d)}
                    dateFormat="dd-MM-yyyy"
                    className="w-full px-2 py-1 border border-blue-500 rounded"
                />
            );
        }

        /* SELECT */
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

        /* COMBOBOX - USING PROPER CHAKRA UI PATTERN */
        if (type === "combobox" && collection) {
            return (
            
                    <ComboBoxEditor
                        value={value}
                        collection={collection}
                        getLabelByValue={getLabelByValue}
                        onSave={onSave}
                        onFilter={onInputValueChange}  // <-- should be the filter function from useListCollection
                      
                    />
      
                
            );
        }

        /* TEXT / NUMBER */
        return (
            <div
                ref={wrapperRef}
                onKeyDown={(e) => {
                    if (e.key === "Enter") saveValue();
                    if (e.key === "Escape") setIsEditing(false);
                }}
            >
                <CapitalizedInput<any>
                    field="value"
                    type={type === "text" ? "text" : "number"}
                    value={editValue}
                    isCapitalized={type === "text"}
                    onChange={(_, v) => setEditValue(v)}
                    allowNegative
                    confirmNegative
                   
                />
            </div>
        );
    }

    /* ---------------- VIEW MODE ---------------- */

    return (
        <div
            onClick={() => {setIsEditing(true);
                toaster.create({
                    title: "Editing Mode",
                    description: "Make your changes. Item selection is required before saving.",
                    type: "info",
                    duration: 4000,
                });
            }}
            className={`cursor-pointer px-1 py-1 hover:bg-blue-50 rounded  min-w-0 ${className}`}
        >
            {displayValue()}
        </div>
    );
};

export default EditableCell;