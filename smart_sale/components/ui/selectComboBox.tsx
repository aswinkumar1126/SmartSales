"use client";

import React, { useEffect } from "react";
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
};

export const SelectCombobox: React.FC<SelectComboboxProps> = ({
    label,
    value,
    onChange,
    editId,
    items,
    placeholder = "Select an option",
    rounded = "full",
    disable
}) => {
    const { contains } = useFilter({ sensitivity: "base" });

    const { collection, filter: applyFilter, set: setCollection } = useListCollection({
        initialItems: items,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.value,
        filter: contains,
    });

    useEffect(() => {
        setCollection(items || []);
        applyFilter("");
    }, [items, setCollection, applyFilter]);

    useEffect(() => {
        applyFilter("");
    }, [editId, applyFilter]);
    useEffect(() => {
        if (disable) {
            onChange("");
        }
    }, [disable]);
    const selectedItem = items?.find(
        (item) => String(item.value) === String(value)
    );
    useEffect(() => {
        if (!value) {
            applyFilter("");
        }
    }, [value, applyFilter]);

    const inputValue = selectedItem ? selectedItem.label.toUpperCase() : "";
    return (
        <Field.Root>
            {label && <Field.Label fontSize="2xs">{label}</Field.Label>}

            <Combobox.Root
                key={`${editId ?? "null"}-${value ?? ""}`} // 🔹 force remount on reset
                collection={collection}
                value={value ? [value] : []}
                inputValue ={inputValue}
                onValueChange={(e) => {
                    if (e.value.length === 0) {
                        onChange("");
                        return;
                    }
                    if(disable) return;
                    const val = e.value[0] || "";
                    onChange(val.toUpperCase()); // 🔥 force uppercase
                }}

                onInputValueChange={(e) => {
                    const upper = e.inputValue.toUpperCase(); // 🔥 force uppercase
                    applyFilter(upper);
                }}
                size="xs"
                openOnClick={!disable}
                
            >
                <Combobox.Control rounded='full' >
                    <Combobox.Input
                        placeholder={placeholder}
                        fontSize="2xs"
                        textTransform="uppercase" // 🔥 visual uppercase
                        rounded={rounded}
                        disabled={disable}
                    />
                    <Combobox.IndicatorGroup>
                        <Combobox.ClearTrigger />
                        <Combobox.Trigger />
                    </Combobox.IndicatorGroup>
                </Combobox.Control>
                {!disable &&
                    <Portal >
                        <Combobox.Positioner mt={-1.5} >
                            <Combobox.Content>
                                <Combobox.Empty fontSize="2xs">
                                    No items found
                                </Combobox.Empty>

                                {collection.items.map((item) => (
                                    <Combobox.Item
                                        key={item.value}
                                        item={item}
                                        fontSize="2xs"
                                        textTransform="uppercase" // 🔥 list also uppercase
                                    >
                                        {item.label.toUpperCase()}
                                        <Combobox.ItemIndicator />
                                    </Combobox.Item>
                                ))}
                            </Combobox.Content>
                        </Combobox.Positioner>
                    </Portal>
                 }
               
            </Combobox.Root>
        </Field.Root>
    );
};
