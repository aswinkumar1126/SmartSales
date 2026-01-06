"use client";

import React from "react";
import { Box, Text, VStack, HStack, Badge } from "@chakra-ui/react";
import { formatToFixed } from "@/utils/format/numberFormat";

interface RightSideDetailsPanelProps {
    selectedTransaction: string | null;
    draftTotals: any;
    headerForm: any;
    selectedTransactionType: any;
    theme: any;
}

export default function RightSideDetailsPanel({
    selectedTransaction,
    draftTotals,
    headerForm,
    selectedTransactionType,
    theme,
}: RightSideDetailsPanelProps) {
    return (
        <VStack
            align="stretch"
            bg={theme.colors.formColor}
            p={4}
            rounded="xl"
          
        >
            <Text fontWeight="bold" fontSize="md">
                Transaction Details
            </Text>

            {/* Customer Info */}
            <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>
                    Customer
                </Text>
                <Text fontSize="sm" fontWeight="semibold">
                    {headerForm.CUSTOMER_NAME || "Not selected"}
                </Text>
                <Text fontSize="xs" color="gray.500">
                    Code: {headerForm.CUSTOMER || "-"}
                </Text>
            </Box>

            {/* Transaction Type */}
            {selectedTransactionType && (
                <Box>
                    <Text fontSize="xs" color="gray.600" mb={1}>
                        Transaction Type
                    </Text>
                    <Badge
                        colorScheme={
                            selectedTransactionType.value === "ISSUE" ? "blue" :
                                selectedTransactionType.value === "RECEIPT" ? "green" :
                                    selectedTransactionType.value === "SALES" ? "purple" : "gray"
                        }
                    >
                        {selectedTransactionType.label}
                    </Badge>
                </Box>
            )}

            {/* Draft Summary */}
            <Box>
                <Text fontSize="xs" color="gray.600" mb={2}>
                    Draft Summary
                </Text>
                <VStack align="stretch">
                    <HStack justify="space-between">
                        <Text fontSize="xs">Total PCS:</Text>
                        <Text fontSize="xs" fontWeight="bold">
                            {formatToFixed(draftTotals.PCS, 0)}
                        </Text>
                    </HStack>
                    <HStack justify="space-between">
                        <Text fontSize="xs">Gross Wt:</Text>
                        <Text fontSize="xs" fontWeight="bold">
                            {formatToFixed(draftTotals.GRSWT, 3)}
                        </Text>
                    </HStack>
                    <HStack justify="space-between">
                        <Text fontSize="xs">Less Wt:</Text>
                        <Text fontSize="xs" fontWeight="bold">
                            {formatToFixed(draftTotals.LESSWT, 3)}
                        </Text>
                    </HStack>
                    <HStack justify="space-between">
                        <Text fontSize="xs">Net Wt:</Text>
                        <Text fontSize="xs" fontWeight="bold">
                            {formatToFixed(draftTotals.NETWT, 3)}
                        </Text>
                    </HStack>
                    <HStack justify="space-between">
                        <Text fontSize="xs">Pure Wt:</Text>
                        <Text fontSize="xs" fontWeight="bold">
                            {formatToFixed(draftTotals.PUREWT, 3)}
                        </Text>
                    </HStack>
                </VStack>
            </Box>

            {/* Rate Info */}
            <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>
                    Current Rate
                </Text>
                <Text fontSize="sm" fontWeight="bold">
                    ₹{headerForm.RATEGM || "0.00"} / gm
                </Text>
            </Box>

            {/* Date Info */}
            <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>
                    Transaction Date
                </Text>
                <Text fontSize="sm">
                    {headerForm.DATE || "Not set"}
                </Text>
            </Box>

            {/* Selected Transaction Details */}
            {selectedTransaction && (
                <Box>
                    <Text fontSize="xs" color="gray.600" mb={1}>
                        Selected Transaction
                    </Text>
                    <Text fontSize="xs">
                        ID: {selectedTransaction}
                    </Text>
                    {/* Add more details here as needed */}
                </Box>
            )}

            {/* Remarks Section */}
            <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>
                    Remarks
                </Text>
                <Box
                    p={2}
                    bg="gray.50"
                    rounded="md"
                    minH="60px"
                    fontSize="xs"
                >
                    Add any remarks or notes here...
                </Box>
            </Box>
        </VStack>
    );
}