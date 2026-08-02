"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { Field, Combobox, Portal, useListCollection, useFilter } from "@chakra-ui/react";



/* ─── INLINE COMBOBOX ─── */
export function InlineCombobox({
    value,
    onChange,
    collection,
    placeholder,
    isInvalid,
    inputRef,
    onEnter,
    disabled,
}: {
    value: string;
    onChange: (v: string) => void;
    collection?: { items: { label: string; value: string }[] };
    placeholder?: string;
    isInvalid?: boolean;
    inputRef?: React.RefObject<HTMLInputElement>;
    onEnter?: () => void;
    disabled?: boolean;
}) {

    const { contains } = useFilter({ sensitivity: "base" });
    const [isOpen, setIsOpen] = useState(false);
    const [highlighted, setHighlighted] = useState<string | null>(null);

    const localRef = useRef<HTMLInputElement>(null);
    const ref = inputRef || localRef;

    const safeItems = useMemo(
        () => collection?.items ?? [],
        [collection?.items]
    );

    const { collection: filtered, set, filter } = useListCollection({
        initialItems: safeItems,
        filter: contains,
    });
    useEffect(() => {
        set(collection?.items ?? []);
    }, [collection?.items, set]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== "Enter") return;

        e.preventDefault();
        e.stopPropagation();

        let selectedValue = value;

        if (filtered.items.length > 0) {
            const val = highlighted ?? filtered.items[0].value;
            const item =
                filtered.items.find(i => i.value === val) ??
                filtered.items[0];

            selectedValue = item.value;
            onChange(selectedValue);
        }

        setIsOpen(false);

        // Move immediately to next field
        requestAnimationFrame(() => {
            onEnter?.();
        });
    };
    console.log(filtered.items,'filtered')
    return (
        <Combobox.Root
            collection={filtered}
            value={value ? [value] : []}
            open={isOpen}
            onOpenChange={e => setIsOpen(e.open)}
            onValueChange={e => {
                onChange(e.value[0] || "");
                setIsOpen(false);
            }}
            onInputValueChange={e => {
                filter(e.inputValue);
                setIsOpen(e.inputValue.length > 0);
            }}
            onHighlightChange={e => setHighlighted(e.highlightedValue)}
            size="xs"
            width="100%"
            openOnClick
            disabled={disabled}
        >
            <Combobox.Control>
                <Combobox.Input
                    ref={ref}
                    placeholder={placeholder}
                    borderColor={isInvalid ? "red.400" : "transparent"}
                    _focus={{ borderColor: isInvalid ? "red.400" : "blue.300" }}
                    fontSize="10px"
                    px={1}
                    py={0}
                    height="22px"
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                />
                <Combobox.IndicatorGroup>
                    <Combobox.ClearTrigger onClick={() => { onChange(""); setIsOpen(false); }} />
                    <Combobox.Trigger />
                </Combobox.IndicatorGroup>
            </Combobox.Control>
            <Portal>
                <Combobox.Positioner>
                    <Combobox.Content maxH="200px" overflowY="auto">
                        <Combobox.Empty fontSize="2xs">No items found</Combobox.Empty>
                        {filtered.items.map(item => (
                            <Combobox.Item item={item} key={item.value} fontSize="2xs">
                                {item.label}<Combobox.ItemIndicator />
                            </Combobox.Item>
                        ))}
                    </Combobox.Content>
                </Combobox.Positioner>
            </Portal>
        </Combobox.Root>
    );
}
