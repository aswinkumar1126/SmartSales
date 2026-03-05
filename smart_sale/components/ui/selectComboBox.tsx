"use client";

import React, { useEffect, useState, forwardRef } from "react";
import { Field, Combobox, Portal, useListCollection, useFilter } from "@chakra-ui/react";

export type SelectItem = {
    label: string;
    value: string;
};

type SelectComboboxProps = {
    label?: string;
    value: string | undefined;
    onChange: (value: string) => void;
    editId?: number | null;
    items: SelectItem[];
    placeholder?: string;
    rounded?: string;
    disable?: boolean;
    onEnter?: () => void;
    onKeyDown?: (e: React.KeyboardEvent) => void; // Add this prop
    ref?: React.Ref<HTMLInputElement>;
    onBlur?:()=>void
};

export const SelectCombobox = forwardRef<HTMLInputElement, SelectComboboxProps>(({
    label,
    value,
    onChange,
    editId,
    items,
    placeholder = "Select an option",
    rounded = "full",
    disable,
    onEnter,
    onKeyDown, // Receive the onKeyDown from EnterWrapperon
    onBlur

}, ref) => {
    const { contains } = useFilter({ sensitivity: "base" });
    const [typedInput, setTypedInput] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedValue, setHighlightedValue] = useState<string | null>(null);
    const { collection, filter: applyFilter, set: setCollection } = useListCollection({
        initialItems: items,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.value,
        filter: contains,
    });

    // Update collection when items change
    useEffect(() => {
        setCollection(items || []);
        applyFilter("");
    }, [items, setCollection, applyFilter]);

    // Reset filter when editId changes
    useEffect(() => {
        applyFilter("");
    }, [editId, applyFilter]);

    // Clear value when disabled
    useEffect(() => {
        if (disable) {
            onChange("");
        }
    }, [disable]);

    // Reset filter when value becomes empty
    useEffect(() => {
        if (!value) {
            applyFilter("");
        }
    }, [value, applyFilter]);

    // Update typed input when value or items change
    useEffect(() => {
        if (value && items?.length > 0) {
            const selectedItem = items.find(
                (item) => String(item.value) === String(value)
            );
            setTypedInput(selectedItem ? selectedItem.label.toUpperCase() : "");
        } else {
            setTypedInput("");
        }
    }, [value, items]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();

            // select current value
            let selectedItem = collection.items.find(
                (item) => item.value === highlightedValue
            );
            if (!selectedItem && typedInput) {
                selectedItem = collection.items.find(
                    (item) => item.label.toUpperCase() === typedInput.toUpperCase()
                );
            }
            if (!selectedItem && collection.items.length > 0) {
                selectedItem = collection.items[0]; // fallback
            }

            if (selectedItem) {
                onChange(selectedItem.value);
                setTypedInput(selectedItem.label.toUpperCase());
            }

            setIsOpen(false);
            setHighlightedValue(null);

            // ✅ Move to next field
            setTimeout(() => onEnter?.(), 50);
            return;
        }

        // Forward all other keys
        onKeyDown?.(e);
    };

    const handleValueChange = (e: any) => {
        if (e.value.length === 0) {
            onChange("");
            setTypedInput("");
            setIsOpen(false);
            return;
        }
        if (disable) return;
        const val = e.value[0] || "";
        onChange(val);
        const selectedItem = items?.find(item => item.value === val);
        setTypedInput(selectedItem?.label.toUpperCase() || "");
        setIsOpen(false);

        // Move to next field when value changes via click
        setTimeout(() => {
            if (onEnter) onEnter();
        }, 50);
    };

    return (
        <Field.Root>
            {label && <Field.Label fontSize="2xs">{label}</Field.Label>}

            <Combobox.Root
                key={`${editId ?? "null"}-${value ?? ""}`}
                collection={collection}
                value={value ? [value] : []}
                inputValue={typedInput}
                open={isOpen}
                onOpenChange={(e) => setIsOpen(e.open)}
                onValueChange={handleValueChange}
                onInputValueChange={(e) => {
                    const upper = e.inputValue.toUpperCase();
                    setTypedInput(upper);
                    applyFilter(upper);
                    // Open dropdown when typing
                    if (upper.length > 0) {
                        setIsOpen(true);
                    } else {
                        setIsOpen(false);
                    }
                }}
                onBlur={onBlur}
                size="xs"
                onHighlightChange={(e) => {
                    setHighlightedValue(e.highlightedValue);
                }}
                openOnClick={!disable}
            >
                <Combobox.Control rounded='full'>
                    <Combobox.Input
                        ref={ref}
                        placeholder={placeholder}
                        fontSize="2xs"
                        textTransform="uppercase"
                        rounded={rounded}
                        disabled={disable}
                        onKeyDown={handleKeyDown} // Use our combined handler
                        onFocus={() => {
                            if (typedInput.length > 0) {
                                setIsOpen(true);
                            }
                        }}
                    />
                    <Combobox.IndicatorGroup>
                        <Combobox.ClearTrigger onClick={() => {
                            onChange("");
                            setTypedInput("");
                        }} />
                        <Combobox.Trigger />
                    </Combobox.IndicatorGroup>
                </Combobox.Control>
                {!disable && (
                    <Portal>
                        <Combobox.Positioner mt={-1.5}>
                            <Combobox.Content>
                                <Combobox.Empty fontSize="2xs">
                                    No items found
                                </Combobox.Empty>
                                {collection.items.map((item) => (
                                    <Combobox.Item
                                        key={item.value}
                                        item={item}
                                        fontSize="2xs"
                                        textTransform="uppercase"
                                    >
                                        {item.label.toUpperCase()}
                                        <Combobox.ItemIndicator />
                                    </Combobox.Item>
                                ))}
                            </Combobox.Content>
                        </Combobox.Positioner>
                    </Portal>
                )}
            </Combobox.Root>
        </Field.Root>
    );
});

SelectCombobox.displayName = 'SelectCombobox';