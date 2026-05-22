"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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

    const [selectedTransactionId, setSelectedTransactionId] = useSessionStorage< string >('SaleSelectedTranId', ""); // no default selection
    const containerRef = useRef<HTMLDivElement>(null);

    
    const selectedIndex = useMemo(()=>{

        return transactionIdsList.findIndex((item) => item.value === selectedTransactionId );
    },[selectedTransactionId, transactionIdsList]) ;

   

    // Deselect if parent tells us to
    useEffect(() => {
        if (deselectFlag) {
            console.log('comes')
            setSelectedTransactionId("");
        }
    }, [deselectFlag]);


    // Keyboard navigation
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
                 handleEditTransaction?.(String(selectedTransactionId));
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
 
    console.log(selectedIndex, 'selectedIndex');
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
                    size="2xs"
                    fontSize="2xs"
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
                maxH={'85vh'}
                outline="none"
                _focus={{ outline: "none" }}
                bg={'#F2E3FD'}
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
                            data-id={item.value}
                            justify="space-between"
                            p={1.5}
                            bg={selectedTransactionId === item.value ? "cyan.100" : "gray.50"}
                            border="1px solid"
                            borderColor={selectedTransactionId === item.value ? "cyan.400" : "gray.200"}
                            _hover={{ bg: "cyan.50" }}
                            cursor="pointer"
                            onClick={() => {
                                setSelectedTransactionId(item.value);
                                handleEditTransaction?.(item.value);
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