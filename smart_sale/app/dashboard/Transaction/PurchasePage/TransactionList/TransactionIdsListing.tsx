"use client";

import React, { useState, useEffect, useRef } from "react";
import { HStack, Text, Box, Button } from "@chakra-ui/react";
import SearchBar from "@/component/search/SearchBar";
import { useTheme } from "@/context/theme/themeContext";
import { useSessionStorage } from "@/hooks/apiHooks/storage/useSessionStorage";

export interface transactionIdsList {
    label: string;
    value: string;
}

export interface TransactionListingProps {
    transactionIdsList: transactionIdsList[];
    searchTerm: string;
    handleSearchChange: (term: string) => void;
    handleEditTransaction?: (value: string) => void;
    handleDeselect?: () => void; // parent tells child to deselect
    deselectFlag?: boolean; // optional prop to trigger deselect
}

export const TransactionListing: React.FC<TransactionListingProps> = ({
    transactionIdsList,
    searchTerm,
    handleSearchChange,
    handleEditTransaction,
    handleDeselect,
    deselectFlag =false,
}) => {
    const { theme } = useTheme();

    const [selectedIndex, setSelectedIndex] = useSessionStorage<number>('selectedTransactionId', -1); // no default selection
    const containerRef = useRef<HTMLDivElement>(null);

    console.log(selectedIndex, 'selectedIndex');
    console.log(selectedIndex,deselectFlag,'deselectFlag')
    // Deselect if parent tells us to
    useEffect(() => {
        if (deselectFlag) {
            console.log('comes')
            setSelectedIndex(-1);
        }
    }, [deselectFlag]);


    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (transactionIdsList.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = selectedIndex < transactionIdsList.length - 1 ? selectedIndex + 1 : 0;
            setSelectedIndex(next);
            handleEditTransaction?.(String(transactionIdsList[next].value));
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            const next = selectedIndex > 0 ? selectedIndex - 1 : transactionIdsList.length - 1;
            setSelectedIndex(next);
            handleEditTransaction?.(String(transactionIdsList[next].value));
        }

        if (e.key === "Enter" && selectedIndex >= 0) {
            handleEditTransaction?.(String(transactionIdsList[selectedIndex].value));
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
        <>
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} >
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
                </Button>}

            </Box>
            <Box
                ref={containerRef}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                minHeight="auto"
                overflowY="auto"
                outline="none"
                _focus={{ outline: "none" }}
                bg={theme.colors.formColor}
                p={2}
                css={{
                    "&::-webkit-scrollbar": {
                        width: "2px",
                        rounded: '2xl'// ✅ minimal width
                    },
                    "&::-webkit-scrollbar-track": {
                        background: "transparent",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        background: "rgba(0,0,0,0.2)", // ✅ subtle thumb
                        borderRadius: "8px",
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                        background: "rgba(0,0,0,0.3)",
                    },
                }}
            >


                {transactionIdsList.length > 0 ? (
                    transactionIdsList.map((item, index) => (
                        <HStack
                            key={item.value}
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
                                handleEditTransaction?.(String(item.value)); // ✅ call directly here
                            }}
                        >
                            <Text fontWeight="semibold" color="black" fontSize="2xs">
                                {item.value}
                            </Text>
                            {/* <Text fontWeight="semibold" color="gray.600" fontSize="xs">
                            {item.ITEMNAME}
                        </Text> */}
                        </HStack>
                    ))
                ) : (
                    <Text p={2} fontSize={'2xs'}>No Entries Available</Text>
                )}
            </Box>
        </>

    );
};