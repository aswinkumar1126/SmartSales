"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { HStack, Text, Box, Button } from "@chakra-ui/react";
import SearchBar from "@/component/search/SearchBar";
import { useTheme } from "@/context/theme/themeContext";
import { useSessionStorage } from "@/utils/storage/useSessionStorage";

export interface transactionIdsList {
    label: string;
    value: string; // transactionId
}

export interface TransactionListingProps {
    transactionIdsList: transactionIdsList[];
    searchTerm: string;
    handleSearchChange: (term: string) => void;
    handleEditTransaction?: (value: string) => void;
    handleDeselect?: () => void;
    deselectFlag?: boolean;
}

export const TransactionListing: React.FC<TransactionListingProps> = ({
    transactionIdsList,
    searchTerm,
    handleSearchChange,
    handleEditTransaction,
    handleDeselect,
    deselectFlag = false,
}) => {
    const { theme } = useTheme();

    // ✅ Store transactionId instead of index
    const [selectedTransactionId, setSelectedTransactionId] =
        useSessionStorage<string>("selectedTransactionId", "");

    const containerRef = useRef<HTMLDivElement>(null);

    // ✅ Derive index safely (for keyboard nav)
    const selectedIndex = useMemo(() => {
        return transactionIdsList.findIndex(
            (item) => item.value === selectedTransactionId
        );
    }, [transactionIdsList, selectedTransactionId]);

    // ✅ Deselect from parent trigger
    useEffect(() => {
        if (deselectFlag) {
            setSelectedTransactionId("");
        }
    }, [deselectFlag]);

    // ✅ Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (transactionIdsList.length === 0) return;

        let nextIndex = selectedIndex;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            nextIndex =
                selectedIndex < transactionIdsList.length - 1
                    ? selectedIndex + 1
                    : 0;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            nextIndex =
                selectedIndex > 0
                    ? selectedIndex - 1
                    : transactionIdsList.length - 1;
        }

        if (e.key === "Enter") {
            if (selectedIndex >= 0) {
                handleEditTransaction?.(selectedTransactionId);
            }
            return;
        }

        // ✅ Update selection
        if (nextIndex !== selectedIndex && nextIndex >= 0) {
            const nextItem = transactionIdsList[nextIndex];
            setSelectedTransactionId(nextItem.value);
            handleEditTransaction?.(nextItem.value);
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

    // ✅ Handle click selection
    const handleItemClick = (id: string) => {
        setSelectedTransactionId(id);
        handleEditTransaction?.(id);
    };

    // ✅ Handle clear
    const handleClear = () => {
        setSelectedTransactionId("");
        handleDeselect?.();
    };
    console.log(selectedTransactionId, 'selectedTransactionId');

    return (
        <>
            {/* 🔍 Search + Clear */}
            <Box display="flex" alignItems="center" gap={1} >
                <SearchBar
                    placeholder="Search Item..."
                    searchTerm={searchTerm}
                    onChange={handleSearchChange}
                    size="xs"
                    maxWidth="100%"
                    rounded="sm"

                />

                {selectedTransactionId && Number(selectedTransactionId) !== -1 && (
                    <Button
                        bg="red.600"
                        size="2xs"
                        fontSize="2xs"
                        onClick={handleClear}
                    >
                        Clear
                    </Button>
                )}
            </Box>

            {/* 📋 List */}
            <Box
                ref={containerRef}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                overflowY="auto"
                maxH={'85vh'}
                outline="none"
                _focus={{ outline: "none" }}
                p={2}
                bg={'#E3C8F8'}
                css={{
                    "&::-webkit-scrollbar": { width: "2px" },
                    "&::-webkit-scrollbar-track": {
                        background: "transparent",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        background: "rgba(0,0,0,0.2)",
                        borderRadius: "8px",
                    },
                }}
            >
                {transactionIdsList.length > 0 ? (
                    transactionIdsList.map((item) => {
                        const isActive =
                            selectedTransactionId === item.value;

                        return (
                            <HStack
                                key={item.value}
                                data-id={item.value}
                                justify="space-between"
                                p={1.5}
                                bg={isActive ? "cyan.100" : "gray.50"}
                                border="1px solid"
                                borderColor={
                                    isActive ? "cyan.400" : "gray.200"
                                }
                                _hover={{ bg: "cyan.50" }}
                                cursor="pointer"
                                onClick={() =>
                                    handleItemClick(item.value)
                                }
                            >
                                <Text
                                    fontWeight="semibold"
                                    color="black"
                                    fontSize="2xs"
                                >
                                    {item.value}
                                </Text>
                            </HStack>
                        );
                    })
                ) : (
                    <Text p={2} fontSize="2xs">
                        No Entries Available
                    </Text>
                )}
            </Box>
        </>
    );
};