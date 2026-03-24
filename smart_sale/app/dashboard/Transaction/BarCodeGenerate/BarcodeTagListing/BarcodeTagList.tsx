"use client";

import React, { useState, useEffect, useRef } from "react";
import { HStack, Text, Box, Button } from "@chakra-ui/react";
import SearchBar from "@/component/search/SearchBar";
import { useTheme } from "@/context/theme/themeContext";
import { useSessionStorage } from "@/hooks/storage/useSessionStorage";

export interface TagItem {
    ITEMNAME: string;
    ENTRYNO: number;
}

export interface TagListProps {
    tagListItems: TagItem[];
    searchTerm: string;
    handleSearchChange: (term: string) => void;
    handleEditTagTransaction?: (entryNo: string) => void;
    handleDeselect?: () => void; // parent tells child to deselect
    deselectFlag?: boolean; // optional prop to trigger deselect
}

export const BarcodeTagListing: React.FC<TagListProps> = ({
    tagListItems,
    searchTerm,
    handleSearchChange,
    handleEditTagTransaction,
    handleDeselect,
    deselectFlag = false,
}) => {
    const { theme } = useTheme();

    const [selectedIndex, setSelectedIndex] = useSessionStorage<number>('selectedTagKey', -1); // no default selection
    const containerRef = useRef<HTMLDivElement>(null);

    console.log(selectedIndex,'selectedIndex')
    // Deselect if parent tells us to
    useEffect(() => {
        if (deselectFlag) {
            console.log('comes')
            setSelectedIndex(-1);
        }
    }, [deselectFlag]);


    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (tagListItems.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = selectedIndex < tagListItems.length - 1 ? selectedIndex + 1 : 0;
            setSelectedIndex(next);
            handleEditTagTransaction?.(String(tagListItems[next].ENTRYNO));
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            const next = selectedIndex > 0 ? selectedIndex - 1 : tagListItems.length - 1;
            setSelectedIndex(next);
            handleEditTagTransaction?.(String(tagListItems[next].ENTRYNO));
        }

        if (e.key === "Enter" && selectedIndex >= 0) {
            handleEditTagTransaction?.(String(tagListItems[selectedIndex].ENTRYNO));
        }
    };

    // Auto-scroll active item into view
    useEffect(() => {
        if (selectedIndex < 0) return;
        const container = containerRef.current;
        if (container) {
            const activeEl = container.querySelectorAll("div[data-index]")[selectedIndex] as HTMLDivElement;
            activeEl?.scrollIntoView({ block: "nearest" });
        }
    }, [selectedIndex]);

    return (
        <Box
            ref={containerRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            maxHeight="300px"
            overflowY="auto"
            outline="none"
            _focus={{ outline: "none" }}
            bg={theme.colors.formColor}
            p={2}
            rounded="xl"
        >
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} mb={2}>
                <SearchBar
                    placeholder="Search Item..."
                    searchTerm={searchTerm}
                    onChange={handleSearchChange}
                    size="xs"
                    maxWidth="100%"
                    rounded="sm"
                />
                {selectedIndex !== -1 && <Button
                    bg="red.600"
                    size="xs"
                    fontSize="xs"
                    onClick={handleDeselect} // parent handles deselect
                >
                    Clear
                </Button> }
               
            </Box>

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
                            setSelectedIndex(index);
                            handleEditTagTransaction?.(String(item.ENTRYNO)); // ✅ call directly here
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
    );
};