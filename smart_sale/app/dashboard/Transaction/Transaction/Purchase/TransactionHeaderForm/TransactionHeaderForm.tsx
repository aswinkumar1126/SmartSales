"use client";

import React, { useState, useEffect } from "react";
import { Box, Text, Flex } from "@chakra-ui/react";
import DatePicker from "react-datepicker";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { formatToFixed } from "@/utils/format/numberFormat";
import { HiFilter, HiX } from "react-icons/hi";
import { SelectCombobox } from "@/components/ui/selectComboBox";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";

interface TransactionHeaderFormProps {
    form: any;
    onFormChange: (field: string, value: any) => void;
    onCustomerSelect: (value: string, label: string) => void;
    customerCollection: any;
    customerFilter?: (value: string) => void;
    getLabelByValue?: (collection: any, value: any) => string;
    theme: any;
    openingBalance: any;
    openingData: any;
    showFilter: boolean;
    handleShowFilter: (checked: boolean) => void;
    isEditing?: boolean;
    entryNo?: string;
    billNo?: string;
}

export default function TransactionHeaderForm({
    form,
    onFormChange,
    onCustomerSelect,
    customerCollection,
    customerFilter,
    getLabelByValue,
    theme,
    openingBalance,
    openingData,
    showFilter,
    handleShowFilter,
    isEditing = false,
    entryNo,
    billNo
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

    const openingCash = openingData?.OPENING_CASH ? formatToFixed(openingData?.OPENING_CASH , 2) : 0;
    const openingPure = openingData?.OPENING_PURE ? formatToFixed(openingData?.OPENING_PURE, 2) : 0;

    return (
        <Box
            display={{ base: 'block', md: 'flex' }}
            flexDirection={{ base: "column", md: "row" }}
       
            justifyContent="space-between"
            alignItems="center"
            bg={theme.colors.formColor}
            p={2}
            rounded="xl"
        >
            
                <Box
                    display="flex"
                    gap={2}
                    flexDirection={{ base: "column", md: "row" }}
                    fontWeight='semibold'
                    w={{ base: '100%', md: 'fit-content' }}
                >
                    {/* ENTRY NO */}
                    <Box w={{ base: '100%', md: '60px' }} display={{ base: 'flex', md: 'block' }} alignItems={{ base: 'center' }}>
                        <Text fontSize="2xs" mb={1} minW={{ base: '100px' }}>ENTRY NO :</Text>
                        <CapitalizedInput
                            value={entryNo || form.ENTRYNO}
                            field="ENTRYNO"
                            onChange={() => { }}
                            disabled
                            size="xs"
                            rounded="md"
                        />
                    </Box>

                    {/* BILL NO */}
                    <Box w={{ base: '100%', md: '70px' }} display={{ base: 'flex', md: 'block' }} alignItems={{ base: 'center' }}>
                        <Text fontSize="2xs" mb={1} minW={{ base: '100px' }}>BILL NO :</Text>
                        <CapitalizedInput
                            value={billNo || form.BILLNO}
                            field="BILLNO"
                            onChange={() => { }}
                            disabled
                            size="xs"
                            rounded="md"
                        />
                    </Box>

                    {/* DATE */}
                    <Box w={{ base: '100%', md: '150px' }} display={{ base: 'flex', md: 'block' }} alignItems='center'>
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
                    <Box w={{ base: '100%', md: '150px' }} display={{ base: 'flex', md: 'block' }} alignItems='center'>
                        <Text fontSize="2xs" mb={1} minW={{ base: '100px' }}>RATE / GM :</Text>
                        <CapitalizedInput
                            value={form.RATEGM}
                            field="RATEGM"
                            onChange={(field, value) => onFormChange(field, value)}
                            type="number"
                            size="xs"
                            rounded="sm"
                        />
                    </Box>

                    {/* CUSTOMER */}
                    <Box w={{ base: '100%', md: '150px' }} display={{ base: 'flex', md: 'block' }} alignItems='center'>
                        <Text fontSize="2xs" mb={1} minW={{ base: '100px' }}>PURCHASER :</Text>
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
                        />
                    </Box>
                </Box>
       

                <Box display='flex' gap={2}  >
                {openingBalance && openingData && (
              
                      <>
                            <Box
                                bg={theme.colors.formColor}
                              
                                gap={1}
                                rounded="sm"

                            >
                                <Text fontSize="xs" fontWeight='semibold' >
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
                        
                     
                            <Box
                                alignItems="center"
                                bg={theme.colors.formColor}
                                gap={1}
                                rounded="sm"
                                justifyContent="space-between"
                            >
                                <Text fontSize="xs" fontWeight='semibold'>
                                    OPENING CASH :
                                </Text>
                                <Text
                                    fontSize="sm"
                                    bg={theme.colors.accient}
                                    p={1}
                                    rounded="sm"
                                    color={theme.colors.whiteColor}
                                >   
                                    {openingCash}
                                </Text>
                            </Box>
                    </>
                 
                )}
                </Box>
                <Box>
                    <FloatingActionButton
                        icon={showFilter ? <HiX size={20} /> : <HiFilter size={20} />}
                        ariaLabel="Toggle Filter"
                        onClick={() => handleShowFilter(!showFilter)}
                        position="top-right-high"
                        size="xs"
                        colorScheme={showFilter ? "red" : "blue"}
                        tooltip={showFilter ? "Hide Filter" : "Show Filter"}
                        zIndex={10}
                        className="animate__animated animate__fadeInUp"
                    />
                </Box>
          
        </Box>
    );
}