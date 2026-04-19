"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { HStack, Text, Box, Button } from "@chakra-ui/react";
import SearchBar from "@/component/search/SearchBar";
import { useTheme } from "@/context/theme/themeContext";
import { useSessionStorage } from "@/hooks/apiHooks/storage/useSessionStorage";
import { SearchDrawer } from "./FilterDrawer";
import { getTagedEntryNoParams } from "@/types/tagging/Tag";
import { useStoneItems } from "@/hooks/apiHooks/item/useItems";
import { TagFilterParams } from "@/store/barcode/useBarcodeStore";

export interface TagItem {
    ITEMNAME: string;
    ENTRYNO: number;
}

export interface searchOptions {
    acCodeCollection?: { label: string; value: string }[];
}

export interface TagListProps {
    tagListItems: TagItem[];
    searchTerm: string;
    handleSearchChange: (term: string) => void;
    handleEditTagTransaction?: (entryNo: string) => void;
    handleDeselect?: () => void;
    deselectFlag?: boolean;
    onFilterChange: (field: string , value: any) => void;
    filterParams: getTagedEntryNoParams;
    collections?: searchOptions;
    isEditing?: boolean;
}

export const BarcodeTagListing: React.FC<TagListProps> = ({
    tagListItems,
    searchTerm,
    handleSearchChange,
    handleEditTagTransaction,
    handleDeselect,
    deselectFlag = false,
    filterParams,
    collections,
    onFilterChange, // Make sure this is received
    isEditing
}) => {

    console.log(filterParams, 'filterParams in list');

    const today = new Date().toISOString().split('T')[0]
    const { theme } = useTheme();
    const { data: items, isLoading, isError } = useStoneItems();
    console.log(items, 'items')

    const [selectedTransactionId, setSelectedTransactionId] = useSessionStorage<number | null>('selectedTagTransaction', null);
    const containerRef = useRef<HTMLDivElement>(null);

      // ✅ Derive index safely (for keyboard nav)
        const selectedIndex = useMemo(() => {
            return tagListItems.findIndex(
                (item) => item.ENTRYNO === selectedTransactionId
            );
        }, [tagListItems, selectedTransactionId]);

    // Deselect if parent tells us to
    useEffect(() => {
        if (deselectFlag) {
            setSelectedTransactionId(null);
        }
    }, [deselectFlag]);

    const itemOptions = useMemo(() => {
        if (!items) return [];

        return Array.isArray(items) ? items.map((item) => ({
            value: String(item.itemId),
            label: item.itemName
        })) : [];
    }, [items]);

    // ✅ Keyboard navigation
       const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
           if (tagListItems.length === 0) return;
   
           let nextIndex = selectedIndex;
   
           if (e.key === "ArrowDown") {
               e.preventDefault();
               nextIndex =
                   selectedIndex < tagListItems.length - 1
                       ? selectedIndex + 1
                       : 0;
           }
   
           if (e.key === "ArrowUp") {
               e.preventDefault();
               nextIndex =
                   selectedIndex > 0
                       ? selectedIndex - 1
                       : tagListItems.length - 1;
           }
   
           if (e.key === "Enter") {
               if (selectedIndex >= 0) {
                   handleEditTagTransaction?.(String(selectedTransactionId));
               }
               return;
           }
   
           // ✅ Update selection
           if (nextIndex !== selectedIndex && nextIndex >= 0) {
               const nextItem = tagListItems[nextIndex];
               setSelectedTransactionId(nextItem.ENTRYNO);
               handleEditTagTransaction?.(String(nextItem.ENTRYNO));
           }
       };
   

 // ✅ Auto-scroll active item
    useEffect(() => {
        if (!selectedTransactionId) return;

        const container = containerRef.current;
        if (!container) return;

        const activeEl = container.querySelector(
            `[data-id="${selectedTransactionId}"]`
        ) as HTMLDivElement;

        activeEl?.scrollIntoView({
            block: "nearest",
        });
    }, [selectedTransactionId]);

    // Handle search from drawer - maps drawer filter names to API parameter names
    const handleSearchApply = (filters: any) => {
        console.log("Applying filters from drawer:", filters);

        // Map drawer filter names to API param names
        const filterMapping: Record<string, string> = {
            fromDate: 'FROMDATE',
            toDate: 'TODATE',
            entryNo: 'ENTRYNO',
            lotNumber: 'LOTNO',
            tagNumber: 'TAGNO',
            weight: 'WEIGHT',
            itemId: 'ITEMID',
            accode: 'ACCODE'
        };

        // Update each filter in parent state
        Object.entries(filters).forEach(([drawerField, value]) => {
            const apiField = filterMapping[drawerField];
            if (apiField && onFilterChange) {
                onFilterChange(apiField, value);
            }
        });
    };

    // Handle clear all filters
    const handleClearAllFilters = () => {
        console.log("Clearing all filters");

        const emptyFilters = {
            FROMDATE: today,
            TODATE: today,
            ITEMID: '',
            ACCODE: '',
            ENTRYNO: '',
            WEIGHT: '',
            LOTNO: '',
            TAGNO: '',
            SEARCH: ''
        };

        // Clear all filters in parent state
        Object.entries(emptyFilters).forEach(([field, value]) => {
            if (onFilterChange) {
                onFilterChange(field, value);
            }
        });
    };

    return (
        <Box
            ref={containerRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
           
            outline="none"
            _focus={{ outline: "none" }}
            bg={theme.colors.formColor}
            p={2}
            rounded="xl"
        >
            <SearchDrawer
                onSearch={handleSearchApply}
                onClear={handleClearAllFilters}
                itemOptions={itemOptions}
                accodeOptions={collections?.acCodeCollection || []}
                initialFilters={{
                    fromDate: filterParams.FROMDATE || today || "",
                    toDate: filterParams.TODATE || today || "",
                    entryNo: filterParams.ENTRYNO || "",
                    // lotNumber: filterParams.PUENTRYNO || "",
                    tagNumber: filterParams.TAGNO || "",
                    weight: filterParams.WEIGHT || "",
                    itemId: filterParams.ITEMID || "",
                    accode: filterParams.ACCODE || "",
                }}
            />

            <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} my={2}>
                <SearchBar
                    placeholder="Search Item..."
                    searchTerm={searchTerm}
                    onChange={handleSearchChange}
                    size="xs"
                    maxWidth="100%"
                    rounded="sm"
                />
                {selectedIndex !== -1 && (
                    <Button
                        bg="red.600"
                        size="xs"
                        fontSize="xs"
                        onClick={handleDeselect}
                    >
                        Clear
                    </Button>
                )}
            </Box>
            <Box 
                maxHeight="90vh"
                overflowY="auto"
            >
                {tagListItems.length > 0 ? (
                    tagListItems.map((item, index) => (
                        <HStack
                            key={item.ENTRYNO}
                            data-index={index}
                            justify="space-between"
                            p={1.5}
                            bg={selectedIndex === index ? "cyan.100" : "gray.50"}
                            border="1px solid"
                            borderColor={selectedIndex === index ? "cyan.400" : "gray.200"}
                            _hover={{ bg: "cyan.50" }}
                            cursor="pointer"
                            onClick={() => {
                                setSelectedTransactionId(item.ENTRYNO);
                                handleEditTagTransaction?.(String(item.ENTRYNO));
                            }}

                        >
                            <Text fontWeight="semibold" color="gray.700" fontSize="xs">
                                {item.ENTRYNO}
                            </Text>
                            <Text fontWeight="semibold" color="gray.600" fontSize="xs">
                                {item.ITEMNAME}
                            </Text>
                        </HStack>
                    ))
                ) : (
                    <Text p={2}>No Entries Available</Text>
                )}
            </Box>
           
        </Box>
    );
};