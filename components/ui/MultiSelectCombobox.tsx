"use client";

import React, { useEffect, useState, forwardRef } from "react";
import {
    Field,
    Combobox,
    Portal,
    Checkbox,
    Tag,
    Wrap,
    useListCollection,
    useFilter,
} from "@chakra-ui/react";

export type MultiSelectItem = {
    label: string;
    value: string;
};

type MultiSelectComboboxProps = {
    label?: string;
    value: string[];
    onChange: (value: string[]) => void;
    editId?: number | null;
    items: MultiSelectItem[];
    placeholder?: string;
    rounded?: string;
    disable?: boolean;
    onEnter?: () => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    ref?: React.Ref<HTMLInputElement>;
    onBlur?: () => void;
    maxWidth?: string;
    fontSize?: string;
    size?: "xs" | "sm" | "md" | "lg";
};

export const MultiSelectCombobox = forwardRef<
    HTMLInputElement,
    MultiSelectComboboxProps
>(
    (
        {
            label,
            value,
            onChange,
            editId,
            items,
            placeholder = "Select options",
            rounded = "full",
            disable,
            onEnter,
            onKeyDown,
            onBlur,
            maxWidth,
            size = "xs",
            fontSize = "2xs",
        },
        ref
    ) => {
        const { contains } = useFilter({ sensitivity: "base" });

        const [typedInput, setTypedInput] = useState("");
        const [isOpen, setIsOpen] = useState(false);

        const {
            collection,
            filter: applyFilter,
            set: setCollection,
        } = useListCollection({
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

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                e.stopPropagation();

                setIsOpen(false);

                setTimeout(() => {
                    onEnter?.();
                }, 50);

                return;
            }

            onKeyDown?.(e);
        };

        const handleValueChange = (e: any) => {
            if (disable) return;

            onChange(e.value);
        };

        return (
            <Field.Root maxW={maxWidth}>
                {label && (
                    <Field.Label fontSize={fontSize}>
                        {label}
                    </Field.Label>
                )}

                <Combobox.Root
                    multiple
                    key={`${editId ?? "null"}-${value.join(",")}`}
                    collection={collection}
                    value={value}
                    inputValue={typedInput}
                    open={isOpen}
                    onOpenChange={(e) => setIsOpen(e.open)}
                    onValueChange={handleValueChange}
                    onBlur={onBlur}
                    size={size}
                    openOnClick={!disable}
                    disabled={disable}
                    onInputValueChange={(e) => {
                        const upper = e.inputValue.toUpperCase();

                        setTypedInput(upper);
                        applyFilter(upper);

                        if (upper.length > 0) {
                            setIsOpen(true);
                        } else {
                            setIsOpen(true);
                        }
                    }}
                >
                    <Combobox.Control rounded={rounded}>
                        <Wrap
                            gap="1"
                            px="2"
                            py="1"
                            align="center"
                            flex="1"
                            minH="32px"
                        >
                        

                            <Combobox.Input
                                ref={ref}
                                placeholder={
                                    value.length === 0
                                        ? placeholder
                                        : ""
                                }
                                fontSize={fontSize}
                                textTransform="uppercase"
                                flex="1"
                                onKeyDown={handleKeyDown}
                                onFocus={() => {
                                    setIsOpen(true);
                                }}
                           
                            />
                        </Wrap>

                        <Combobox.IndicatorGroup>
                            <Combobox.ClearTrigger
                                onClick={() => {
                                    onChange([]);
                                    setTypedInput("");
                                    applyFilter("");
                                }}
                            />

                            <Combobox.Trigger />
                        </Combobox.IndicatorGroup>
                    </Combobox.Control>

                    {!disable && (
                        <Portal>
                            <Combobox.Positioner
                                mt={-1.5}
                                zIndex={1}
                            >
                                <Combobox.Content
                                    overflowY="auto"
                                    maxHeight="150px"
                                    border="1px solid #AAA"
                                >
                                    <Combobox.Empty
                                        fontSize={fontSize}
                                    >
                                        No items found
                                    </Combobox.Empty>

                                    {collection.items.map((item) => (
                                        <Combobox.Item
                                            key={item.value}
                                            item={item}
                                            fontSize={fontSize}
                                            textTransform="uppercase"
                                            display="flex"
                                            alignItems="center"
                                            gap="2"
                                        >
                                            <Checkbox.Root
                                                checked={value.includes(
                                                    item.value
                                                )}
                                                pointerEvents="none"
                                                size={'xs'}
                                            >
                                                <Checkbox.HiddenInput />
                                                <Checkbox.Control />
                                            </Checkbox.Root>

                                            {String(
                                                item.label
                                            ).toUpperCase()}
                                        </Combobox.Item>
                                    ))}
                                </Combobox.Content>
                            </Combobox.Positioner>
                        </Portal>
                    )}
                </Combobox.Root>
            </Field.Root>
        );
    }
);

MultiSelectCombobox.displayName = "MultiSelectCombobox";