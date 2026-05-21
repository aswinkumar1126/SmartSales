"use client";

import React, { useState, useEffect, useRef } from "react";
import { Box, Text, Flex, Button } from "@chakra-ui/react";
import DatePicker from "react-datepicker";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { formatToFixed } from "@/utils/format/numberFormat";
import { SelectCombobox } from "@/components/ui/selectComboBox";

import { SalesHeaderForm } from "@/types/TransactionTypes/sales/SaleHeaderType";

interface TransactionHeaderFormProps {
    form: any;
    onFormChange: <K extends keyof SalesHeaderForm>(
        field: K,
        value: string
    ) => void;
    onCustomerSelect: (value: string, label: string) => void;
    customerCollection: any;
    getLabelByValue?: (collection: any, value: any) => string;
    theme: any;
    openingBalance: any;
    openingData: any;
    isEditing?: boolean;
    isClosingChanged?: boolean;
    isDraftRowChanged?: boolean
}

export default function TransactionHeaderForm({
    form,
    onFormChange,
    onCustomerSelect,
    customerCollection,
    getLabelByValue,
    theme,
    openingBalance,
    openingData,
    isEditing = false,
    isDraftRowChanged,
    isClosingChanged,
}: TransactionHeaderFormProps) {

    // Get the customer label for the current form.CUSTOMER value
    const getCustomerLabel = (value: any) => {
        if (!value) return "";
        if (getLabelByValue && customerCollection) {
            return getLabelByValue(customerCollection, value);
        }
        // Fallback: find in collection items
        const found = customerCollection?.items?.find(
            (item: any) => item.value === value?.toString()
        );
        return found?.label || value || "";
    };

    const parseISOToDate = (iso?: string) => {
        if (!iso) return null;
        const d = new Date(iso);
        return isNaN(d.getTime()) ? null : d;
    };

    const formatDateToISO = (date: Date | null) => {
        if (!date) return "";
        return date.toISOString().split("T")[0];
    };
    console.log(openingBalance, 'openingBalance')

    const openingCash = openingBalance.openCash ? formatToFixed(openingBalance.openCash, 2) : 0;
    const openingPure = openingBalance.openPure ? formatToFixed(openingBalance.openPure, 3) : 0;

    console.log(isEditing, isDraftRowChanged, isClosingChanged, 'isChanged ')


    const customerDisable = isEditing || isDraftRowChanged || isClosingChanged;;

    const customerRef = useRef<any>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (customerRef.current && !isEditing && !form.CUSTOMER && customerCollection) {
                customerRef.current.focus?.();
            }
        }, 200);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Box
            display={{ base: 'block', md: 'flex' }}
            flexDirection={{ base: "column", md: "row" }}
            justifyContent="space-between"
            alignItems="center"
            bg={theme.colors.formColor}
            p={1}

        >

            <Box
                display="flex"
                gap={1}
                flexDirection={{ base: "column", md: "row" }}
                fontWeight='semibold'
                w={{ base: '100%', md: 'fit-content' }}
            >
                {/* ENTRY NO */}
                <Box w={{ base: '100%', md: '70px' }} display={{ base: 'flex', md: 'block' }} alignItems={{ base: 'center' }}>
                    <Text fontSize="2xs" mb={1} minW={{ base: '100px' }}>ENTRY NO :</Text>
                    <CapitalizedInput
                        value={form.ENTRYNO}
                        field="ENTRYNO"
                        onChange={() => { }}
                        disabled
                        size="xs"
                        rounded="md"
                    />
                </Box>

                {/* BILL NO */}
                <Box w={{ base: '100%', md: '80px' }} display={{ base: 'flex', md: 'block' }} alignItems={{ base: 'center' }}>
                    <Text fontSize="2xs" mb={1} minW={{ base: '100px' }}>BILL NO :</Text>
                    <CapitalizedInput
                        value={form.BILLNO}
                        field="BILLNO"
                        onChange={() => { }}
                        disabled
                        size="xs"
                        rounded="md"
                    />
                </Box>

                {/* DATE */}
                <Box w={{ base: '100%', md: '90px' }} display={{ base: 'flex', md: 'block' }} alignItems='center'>
                    <Text fontSize="2xs" mb={1} minW={{ base: '100px' }}>DATE :</Text>
                    <DatePicker
                        selected={parseISOToDate(form.DATE)}
                        onChange={(date: Date | null) => {
                            if (!date) return;
                            onFormChange("DATE", formatDateToISO(date));
                        }}
                        maxDate={new Date()}
                        dateFormat="dd-MM-yyyy"
                        placeholderText="dd-mm-yyyy"
                        className="w-full px-2 py-1 text-xs border border-gray-400 rounded input-date"
                        disabled={isEditing}

                    />
                </Box>

                {/* RATE / GM */}
                <Box w={{ base: '100%', md: '80px' }} display={{ base: 'flex', md: 'block' }} alignItems='center'>
                    <Text fontSize="2xs" mb={1} minW={{ base: '100px' }}>RATE / GM :</Text>
                    <CapitalizedInput
                        value={form.RATEGM}
                        field="RATEGM"
                        onChange={(field, value) => onFormChange(field, value)}
                        type="number"
                        size="xs"
                        rounded="sm"
                    // disabled
                    />
                </Box>

                {/* CUSTOMER */}
                <Box w={{ base: '100%', md: '200px' }} display={{ base: 'flex', md: 'block' }} alignItems='center'>
                    <Text fontSize="2xs" mb={1} minW={{ base: '100px' }}>CUSTOMER :</Text>
                    <SelectCombobox
                        items={customerCollection}
                        value={form.CUSTOMER}
                        onChange={(val) => {
                            // Only call onCustomerSelect, it will handle both state updates
                            onCustomerSelect(val, getCustomerLabel(val));
                            // Remove onFormChange here to avoid double update
                        }}
                        placeholder="Select Customer"
                        rounded="md"
                        disable={customerDisable}
                        ref={customerRef}
                    />
                </Box>

            </Box>
            <Box display='flex' gap={1}  >
                {openingBalance && openingData && (

                    <>
                        <Box>
                            <Text fontSize="x-small" fontWeight='semibold' >
                                OPENING PURE :
                            </Text>
                            <Text
                                fontSize="sm"
                                bg={theme.colors.accient}
                                fontWeight='semibold'
                                p={1}
                                rounded="sm"
                                color={theme.colors.whiteColor}
                            >
                                {openingPure}
                            </Text>
                        </Box>


                        <Box>
                            <Text fontSize="x-small" fontWeight='semibold'>
                                OPENING CASH :
                            </Text>
                            <Text
                                fontSize="sm"
                                bg={theme.colors.accient}
                                p={1}
                                rounded="sm"
                                fontWeight='semibold'
                                color={theme.colors.whiteColor}
                            >
                                {openingCash}
                            </Text>
                        </Box>
                    </>

                )}
            </Box>

        </Box>
    );
}