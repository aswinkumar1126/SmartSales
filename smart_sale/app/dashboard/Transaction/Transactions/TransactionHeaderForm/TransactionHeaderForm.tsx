"use client";

import React, { useState, useEffect } from "react";
import { Box, Text, Flex, Combobox, Portal } from "@chakra-ui/react";
import DatePicker from "react-datepicker";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { formatToFixed } from "@/utils/format/numberFormat";

interface TransactionHeaderFormProps {
    form: any;
    onFormChange: (field: string, value: any) => void;
    onCustomerSelect: (value: string, label: string) => void;
    customerCollection: any;
    customerFilter: (value: string) => void;
    getLabelByValue?: (collection: any, value: any) => string;
    theme: any;
    openingBalance:any;
    openingData:any;
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
    openingData
}: TransactionHeaderFormProps) {
    const [customerInput, setCustomerInput] = useState("");
    const [isInitialized, setIsInitialized] = useState(false);

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

    // Initialize customer input when form changes
    useEffect(() => {
        if (!isInitialized && customerCollection?.items?.length) {
            const label = getCustomerLabel(form.CUSTOMER);
            setCustomerInput(label);
            setIsInitialized(true);
        }
    }, [form.CUSTOMER, customerCollection, isInitialized]);

    // Update customer input when customer collection changes
    useEffect(() => {
        if (customerCollection?.items?.length && form.CUSTOMER) {
            const label = getCustomerLabel(form.CUSTOMER);
            if (label) {
                setCustomerInput(label);
            }
        }
    }, [customerCollection, form.CUSTOMER]);

    const parseISOToDate = (iso?: string) => {
        if (!iso) return null;
        const d = new Date(iso);
        return isNaN(d.getTime()) ? null : d;
    };

    const formatDateToISO = (date: Date | null) => {
        if (!date) return "";
        return date.toISOString().split("T")[0];
    };

    const handleComboboxValueChange = (details: any) => {
        const selectedValue = details.value[0] ?? "";
        const selectedItem = customerCollection?.items?.find(
            (item: any) => item.value === selectedValue
        );

        if (selectedItem) {
            // Update the input with the selected label
            setCustomerInput(selectedItem.label);
            onCustomerSelect(selectedValue, selectedItem.label);
        } else if (selectedValue === "") {
            // If cleared, reset both input and form
            setCustomerInput("");
            onCustomerSelect("", "");
        }
    };

    const handleComboboxInputChange = (e: any) => {
        const inputValue = e.inputValue;
        setCustomerInput(inputValue);
        customerFilter(inputValue);
    };

    const handleComboboxBlur = () => {
        // When blurring, if we have a CUSTOMER value but input doesn't match,
        // reset input to the proper label
        if (form.CUSTOMER && customerInput !== getCustomerLabel(form.CUSTOMER)) {
            const label = getCustomerLabel(form.CUSTOMER);
            setCustomerInput(label || "");
        }
    };

    return (
        <Flex justifyContent='space-between'  bg={theme.colors.formColor} p={3} rounded="xl" alignItems='center' >
            <Box gap={2} display='flex' flexDirection='row'  >
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
                <Text fontSize="xs" mb={1}>Bill No</Text>
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
                <Text fontSize="xs" mb={1}>Date</Text>
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
                <Text fontSize="xs" mb={1}>Rate / GM</Text>
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
                        inputValue={customerInput}
                        size="xs"

                        onValueChange={(details) => {
                            const selectedValue = details.value[0] ?? "";

                            if (!selectedValue) {
                                // CLEAR
                                setCustomerInput("");
                                onCustomerSelect("", "");
                                return;
                            }

                            const item = customerCollection.items.find(
                                (i: any) => i.value === selectedValue
                            );

                            if (item) {
                                setCustomerInput(item.label);
                                onCustomerSelect(item.value, item.label);
                            }
                        }}

                        onInputValueChange={(e) => {
                            setCustomerInput(e.inputValue);
                            customerFilter(e.inputValue);

                            // 🔑 THIS IS THE KEY FIX
                            if (form.CUSTOMER) {
                                onCustomerSelect("", "");
                            }
                        }}
                    >
                        <Combobox.Label fontSize='xs'>Customer</Combobox.Label>

                        <Combobox.Control marginTop={-1}>
                            <Combobox.Input placeholder="Type to search" />
                            <Combobox.IndicatorGroup>
                                <Combobox.ClearTrigger
                                    onClick={() => {
                                        setCustomerInput("");
                                        onCustomerSelect("", "");
                                    }}
                                />
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

             
            </Box>
          <Box alignItems='center' justifyContent='center'>
                {openingBalance && <Flex justifyContent="flex-end" align="center">

                    <Box
                        display="flex"
                        alignItems="center"
                        bg={theme.colors.formColor}
                        p={2}
                        gap={1}
                        rounded="sm"
                        justifyContent="space-between"
                    >
                        <Text fontSize="2xs" fontWeight="bold">
                            OPENING PURE :
                        </Text>
                        <Text
                            fontSize="2xs"
                            bg={theme.colors.accient}
                            fontWeight="semibold"
                            p={1}
                            rounded="sm"
                            color={theme.colors.whiteColor}
                        >
                            {formatToFixed(openingData?.BALANCE, 2)}
                        </Text>
                    </Box>
                    <Box

                        display="flex"
                        alignItems="center"
                        bg={theme.colors.formColor}
                        p={2}
                        gap={1}
                        rounded="sm"
                        justifyContent="space-between"
                    >
                        <Text fontSize="2xs" fontWeight="bold">
                            OPENING CASH :
                        </Text>
                        <Text
                            fontSize="2xs"
                            bg={theme.colors.accient}
                            fontWeight="semibold"
                            p={1}
                            rounded="sm"
                            color={theme.colors.whiteColor}
                        >
                            {formatToFixed(openingData?.BALANCE, 2)}
                        </Text>
                    </Box>
                </Flex>}
          </Box>

            

        </Flex>
    );
}