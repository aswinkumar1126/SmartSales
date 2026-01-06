"use client";

import React from "react";
import { Box, Text, Flex, Combobox, Portal } from "@chakra-ui/react";
import DatePicker from "react-datepicker";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";

interface TransactionHeaderFormProps {
    form: any;
    onFormChange: (field: string, value: any) => void;
    onCustomerSelect: (value: string, label: string) => void;
    customerCollection: any;
    customerFilter: (value: string) => void;
    getLabelByValue: (collection: any, value: any) => string;
    theme: any;
}

export default function TransactionHeaderForm({
    form,
    onFormChange,
    onCustomerSelect,
    customerCollection,
    customerFilter,
    getLabelByValue,
    theme,
}: TransactionHeaderFormProps) {



    const parseISOToDate = (iso?: string) => {
        if (!iso) return null;
        const d = new Date(iso);
        return isNaN(d.getTime()) ? null : d;
    };

    const formatDateToISO = (date: Date | null) => {
        if (!date) return "";
        return date.toISOString().split("T")[0];
    };

    return (
        <Flex gap={2} wrap="wrap" align="flex-end" bg={theme.colors.formColor} p={3} rounded="xl">
            {/* ENTRY NO */}
            <Box w="100px">
                <Text fontSize="xs" mb={1}>Entry No</Text>
                <CapitalizedInput
                    value={form.ENTRYNO}
                    field="ENTRYNO"
                    onChange={() => { }}
                    disabled
                    size="xs"
                />
            </Box>

            {/* BILL NO */}
            <Box w="70px">
                <Text fontSize="sm" mb={1}>Bill No</Text>
                <CapitalizedInput
                    value={form.BILLNO}
                    field="BILLNO"
                    onChange={() => { }}
                    disabled
                    size="xs"
                />
            </Box>

            {/* DATE */}
            <Box w="120px">
                <Text fontSize="sm" mb={1}>Date</Text>
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
                />
            </Box>

            {/* RATE / GM */}
            <Box w="100px">
                <Text fontSize="sm" mb={1}>Rate / GM</Text>
                <CapitalizedInput
                    value={form.RATEGM}
                    field="RATEGM"
                    onChange={(field, value) => onFormChange(field, value)}
                    type="number"
                    size="xs"
                />
            </Box>

            {/* CUSTOMER */}
            <Box w="200px">
                <Combobox.Root
                    collection={customerCollection}
                    openOnClick
                    value={form.CUSTOMER ? [form.CUSTOMER] : []}
                //   inputValue={customerInput}
                    onValueChange={(details) => {
                        const selectedValue = details.value[0] ?? "";
                        const selectedItem = customerCollection.items.find(
                            (item: any) => item.value === selectedValue
                        );
                        if (selectedItem) {
                            onCustomerSelect(selectedValue, selectedItem.label);
                        }
                    }}
                    onInputValueChange={(e) => customerFilter(e.inputValue)}
                    size="xs"
                >
                    <Combobox.Label>Customer</Combobox.Label>
                    <Combobox.Control>
                        <Combobox.Input placeholder="Type to search" />
                        <Combobox.IndicatorGroup>
                            <Combobox.ClearTrigger />
                            <Combobox.Trigger />
                        </Combobox.IndicatorGroup>
                    </Combobox.Control>
                    <Portal>
                        <Combobox.Positioner>
                            <Combobox.Content>
                                <Combobox.Empty>No customer found</Combobox.Empty>
                                {customerCollection.items.map((item: any) => (
                                    <Combobox.Item key={item.value} item={item}>
                                        {item.label}
                                        <Combobox.ItemIndicator />
                                    </Combobox.Item>
                                ))}
                            </Combobox.Content>
                        </Combobox.Positioner>
                    </Portal>
                </Combobox.Root>
            </Box>
        </Flex>
    );
}