"use client";

import React, { useState, useEffect } from "react";
import { Box, Text, VStack, HStack, Badge, Input, InputGroup } from "@chakra-ui/react";
import { formatToFixed } from "@/utils/format/numberFormat";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface RightSideDetailsPanelProps {
    selectedTransaction: string | null;
    onSelectTransaction: (id: string) => void;
    transactionList: any;
    draftTotals: any;
    headerForm: any;
    selectedTransactionType: any;
    theme: any;
    startDate?: string;
    endDate?: string;
    onStartDateChange: (val?: string) => void;
    onEndDateChange: (val?: string) => void;

}

export default function RightSideDetailsPanel({
    selectedTransaction,
    draftTotals,
    headerForm,
    selectedTransactionType,
    theme,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    transactionList,
    onSelectTransaction
}: RightSideDetailsPanelProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredTransactions, setFilteredTransactions] = useState<any>({
        issues: [],
        receipts: []
    });

    // Parse and format date functions
    const parseISOToDate = (iso?: string) => {
        if (!iso) return null;
        const d = new Date(iso);
        return isNaN(d.getTime()) ? null : d;
    };

    const formatDateToISO = (date: Date | null) => {
        if (!date) return "";
        return date.toISOString().split("T")[0];
    };

    // Filter transactions based on search term
    useEffect(() => {
        if (!transactionList?.data) {
            setFilteredTransactions({ issues: [], receipts: [] });
            return;
        }

        const filterById = (id: string) =>
            id.toLowerCase().includes(searchTerm.toLowerCase());

        const filteredIssues = transactionList.data.issues?.filter(filterById) || [];
        const filteredReceipts = transactionList.data.receipts?.filter(filterById) || [];

        setFilteredTransactions({
            issues: filteredIssues,
            receipts: filteredReceipts
        });
    }, [transactionList, searchTerm]);

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

            {/* Date Range Filter */}
            <Box display='flex' gap={2}>
                <Box flex={1}>
                    <Text fontSize="xs" mb={1}>Start Date</Text>
                    <DatePicker
                        selected={startDate ? parseISOToDate(startDate) : null}
                        onChange={(date) => {
                            if (!date) return;
                            onStartDateChange(formatDateToISO(date));
                        }}
                        maxDate={new Date()}
                        dateFormat="dd-MM-yyyy"
                        className="date-input"
                        placeholderText="dd-mm-yyyy"
                    />
                </Box>

                <Box flex={1}>
                    <Text fontSize="xs" mb={1}>End Date</Text>
                    <DatePicker
                        selected={endDate ? parseISOToDate(endDate) : null}
                        onChange={(date) => {
                            if (!date) return;
                            onEndDateChange(formatDateToISO(date));
                        }}
                        minDate={startDate ? parseISOToDate(startDate) : undefined}
                        maxDate={new Date()}
                        dateFormat="dd-MM-yyyy"
                        className="date-input"
                        placeholderText="dd-mm-yyyy"
                    />
                </Box>
            </Box>

         

            {/* Transactions List */}
            <Box mt={2}>
                <Text fontSize="xs" color="gray.600" mb={2}>
                    Transactions {searchTerm && `(${filteredTransactions.issues.length + filteredTransactions.receipts.length} found)`}
                </Text>

                <Box maxH="260px" overflowY="auto">
                    <VStack align="stretch" >
                        {filteredTransactions.issues?.map((id: string) => (
                            <Box
                                key={id}
                                p={2}
                                rounded="md"
                                cursor="pointer"
                                bg={selectedTransaction === id ? "blue.100" : "transparent"}
                                _hover={{ bg: "gray.100" }}
                                onClick={() => onSelectTransaction(id)}
                            >
                                <Text fontSize="xs">{id}</Text>
                            </Box>
                        ))}

                        {filteredTransactions.receipts?.map((id: string) => (
                            <Box
                                key={id}
                                p={2}
                                rounded="md"
                                cursor="pointer"
                                bg={selectedTransaction === id ? "green.100" : "transparent"}
                                _hover={{ bg: "gray.100" }}
                                onClick={() => onSelectTransaction(id)}
                            >
                                <Text fontSize="xs">{id}</Text>
                            </Box>
                        ))}

                        {searchTerm && filteredTransactions.issues.length === 0 && filteredTransactions.receipts.length === 0 && (
                            <Text fontSize="xs" color="gray.500" textAlign="center" py={4}>
                                No transactions found
                            </Text>
                        )}
                    </VStack>
                </Box>
            </Box>

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

        </VStack>
    );
}