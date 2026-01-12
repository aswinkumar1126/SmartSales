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
    items: SelectItem[]; // API data can be empty initially
    placeholder?: string;
};

export const SelectCombobox: React.FC<SelectComboboxProps> = ({
    label,
    value,
    onChange,
    editId,
    items,
    placeholder = "Select an option",
}) => {
    const { contains } = useFilter({ sensitivity: "base" });

    // Internal collection
    const { collection, filter: applyFilter, set: setCollection } = useListCollection({
        initialItems: items,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.value,
        filter: contains,
    });

    // Update collection whenever `items` changes (API response)
    useEffect(() => {
        setCollection(items || []);
        applyFilter(""); // reset filter on data update
    }, [items, setCollection, applyFilter]);

    // Reset filter when switching editId
    useEffect(() => {
        applyFilter("");
    }, [editId, applyFilter]);

    return (
        <Field.Root>
            <Field.Label>{label}</Field.Label>

            <Combobox.Root
                key={editId} // remount when switching records
                collection={collection}
                value={value ? [value] : []}
                onValueChange={(e) => onChange(e.value[0] || "")}
                onInputValueChange={(e) => applyFilter(e.inputValue)}
                size='xs'
            >
                <Combobox.Control>
                    <Combobox.Input placeholder={placeholder} fontSize='2xs' />
                    <Combobox.IndicatorGroup>
                        <Combobox.ClearTrigger />
                        <Combobox.Trigger />
                    </Combobox.IndicatorGroup>
                </Combobox.Control>

                <Portal>
                    <Combobox.Positioner>
                        <Combobox.Content>
                            <Combobox.Empty fontSize='2xs'>No items found</Combobox.Empty>

                            {collection.items.map((item) => (
                                <Combobox.Item key={item.value} item={item} fontSize='2xs'>
                                    {item.label}
                                    <Combobox.ItemIndicator />
                                </Combobox.Item>
                            ))}
                        </Combobox.Content>
                    </Combobox.Positioner>
                </Portal>
            </Combobox.Root>
        </Field.Root>
    );
};
