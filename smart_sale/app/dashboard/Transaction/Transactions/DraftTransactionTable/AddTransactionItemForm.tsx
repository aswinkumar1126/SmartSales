// @/component/form/AddTransactionItemForm.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Box,
    Portal,
    Select,
    createListCollection,
    Button,
    Grid,
    GridItem,
    Flex,
    Text,
    HStack,
    Icon,
} from "@chakra-ui/react";
import { Combobox, useFilter, useListCollection } from "@chakra-ui/react";
import { useTheme } from "@/context/theme/themeContext";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import downLoadIcon from '@/asserts/icons/download.png';
import Image from "next/image";

/* ---------------- TYPES ---------------- */

export interface FormField {
    key: string;
    label: string;
    type: "text" | "number" | "select" | "combobox" | "capitalized" | "calculated";
    placeholder?: string;
    collection?: {
        items: { label: string; value: string }[];
    };
    getLabelByValue?: (collection: any, value: any) => string;
    isRequired?: boolean;
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
    allowNegative?: boolean;
    confirmNegative?: boolean;
    size?: "2xs" | "xs" | "sm" | "md" | "lg";
}

/* ---------------- SELECT ---------------- */

export function CustomSelect({
    value,
    onChange,
    collection,
    placeholder,
    isInvalid,
    size = "sm",
}: {
    value: string;
    onChange: (value: string) => void;
    collection?: { items: { label: string; value: string }[] };
    placeholder?: string;
    isInvalid?: boolean;
    size?: "xs" | "sm" | "md" | "lg";
}) {
    const selectCollection = createListCollection({
        items: collection?.items || [],
    });

    return (
        <Select.Root
            collection={selectCollection}
            size={size}
            value={value ? [value] : []}
            onValueChange={(e) => onChange(e.value[0] || "")}
        >
            <Select.HiddenSelect />
            <Select.Control>
                <Select.Trigger borderColor={isInvalid ? "red.400" : undefined}>
                    <Select.ValueText placeholder={placeholder} />
                </Select.Trigger>
                <Select.IndicatorGroup>
                    <Select.Indicator />
                </Select.IndicatorGroup>
            </Select.Control>

            <Portal>
                <Select.Positioner>
                    <Select.Content>
                        {selectCollection.items.map((item) => (
                            <Select.Item item={item} key={item.value}>
                                {item.label}
                                <Select.ItemIndicator />
                            </Select.Item>
                        ))}
                    </Select.Content>
                </Select.Positioner>
            </Portal>
        </Select.Root>
    );
}

/* ---------------- COMBOBOX ---------------- */

export function CustomCombobox({
    value,
    onChange,
    collection,
    placeholder,
    isInvalid,
    size = "sm",
}: {
    value: string;
    onChange: (value: string) => void;
    collection?: { items: { label: string; value: string }[] };
    placeholder?: string;
    isInvalid?: boolean;
    size?: "2xs" | "sm" | "md" | "lg" | "xs";
}) {
    const { contains } = useFilter({ sensitivity: "base" });

    const { collection: filteredCollection, filter } = useListCollection({
        initialItems: collection?.items || [],
        filter: contains,
    });

    return (
        <Combobox.Root
            collection={filteredCollection}
            value={value ? [value] : []}
            onValueChange={(e) => onChange(e.value[0] || "")}
            onInputValueChange={(e) => filter(e.inputValue)}
            size="xs"
            fontSize="2xs"
            width="100%"
        >
            <Combobox.Control>
                <Combobox.Input
                    placeholder={placeholder}
                    borderColor={isInvalid ? "red.400" : undefined}
                />
                <Combobox.IndicatorGroup>
                    <Combobox.ClearTrigger onClick={() => onChange("")} />
                    <Combobox.Trigger />
                </Combobox.IndicatorGroup>
            </Combobox.Control>

            <Portal>
                <Combobox.Positioner>
                    <Combobox.Content maxH="200px" overflowY="auto">
                        <Combobox.Empty fontSize="2xs">No items found</Combobox.Empty>
                        {filteredCollection.items.map((item) => (
                            <Combobox.Item item={item} key={item.value} fontSize="2xs">
                                {item.label}
                                <Combobox.ItemIndicator />
                            </Combobox.Item>
                        ))}
                    </Combobox.Content>
                </Combobox.Positioner>
            </Portal>
        </Combobox.Root>
    );
}

interface AddTransactionItemFormProps {
    fields: FormField[];
    onSubmit: (data: any) => Promise<void> | void;
    onCancel: () => void;
    compact?: boolean;
    handleClearForm?:any;
}

export default function AddTransactionItemForm({
    fields,
    onSubmit,
    onCancel,
    compact = false,
    handleClearForm
}: AddTransactionItemFormProps) {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { theme } = useTheme();

    // Filter out NETWT and PUREWT from the form fields (they will be calculated)
    const visibleFields = fields.filter(
        (field) => field.key !== "NETWT" && field.key !== "PUREWT"
    );

    /* ---------------- INIT ---------------- */

    useEffect(() => {
        const init: Record<string, any> = {};
        fields.forEach((f) => {
            init[f.key] = "";
        });
        setFormData(init);
    }, [fields]);

    /* ---------------- CALCULATIONS ---------------- */

    // Calculate NETWT (Gross Weight - Less Weight)
    const calculateNetWeight = useCallback(() => {
        const grswt = parseFloat(formData.GRSWT) || 0;
        const lesswt = parseFloat(formData.LESSWT) || 0;
        return (grswt - lesswt).toFixed(3);
    }, [formData.GRSWT, formData.LESSWT]);

    // Calculate PUREWT (Net Weight * Purity / 100)
    const calculatePureWeight = useCallback(() => {
        const netwt = parseFloat(calculateNetWeight()) || 0;
        const purity = parseFloat(formData.PURITY) || 0;
        return ((netwt * purity) / 100).toFixed(3);
    }, [calculateNetWeight, formData.PURITY]);

    // Update calculated fields when relevant fields change
    useEffect(() => {
        if (formData.GRSWT || formData.LESSWT) {
            const netwt = calculateNetWeight();
            setFormData(prev => ({ ...prev, NETWT: netwt }));
        }
    }, [formData.GRSWT, formData.LESSWT, calculateNetWeight]);

    useEffect(() => {
        if (formData.GRSWT || formData.LESSWT || formData.PURITY) {
            const purewt = calculatePureWeight();
            setFormData(prev => ({ ...prev, PUREWT: purewt }));
        }
    }, [formData.GRSWT, formData.LESSWT, formData.PURITY, calculatePureWeight]);

    /* ---------------- CHANGE ---------------- */

    const handleChange = useCallback((key: string, value: any) => {
        const newFormData = { ...formData, [key]: value };

        // Recalculate when GRSWT, LESSWT, or PURITY changes
        if (key === "GRSWT" || key === "LESSWT") {
            const grswt = parseFloat(key === "GRSWT" ? value : formData.GRSWT) || 0;
            const lesswt = parseFloat(key === "LESSWT" ? value : formData.LESSWT) || 0;
            newFormData.NETWT = (grswt - lesswt).toFixed(3);

            // Also recalculate PUREWT if PURITY exists
            if (formData.PURITY) {
                const purity = parseFloat(formData.PURITY) || 0;
                newFormData.PUREWT = ((grswt - lesswt) * purity / 100).toFixed(3);
            }
        }

        if (key === "PURITY") {
            const purity = parseFloat(value) || 0;
            const netwt = parseFloat(formData.NETWT || calculateNetWeight()) || 0;
            newFormData.PUREWT = ((netwt * purity) / 100).toFixed(3);
        }

        setFormData(newFormData);
        setTouched((prev) => ({ ...prev, [key]: true }));
        setErrors((prev) => ({ ...prev, [key]: "" }));
    }, [formData, calculateNetWeight]);

    /* ---------------- VALIDATION ---------------- */

    const validateField = (field: FormField, value: any): string => {
        if (field.isRequired && (!value || value.toString().trim() === "")) {
            return `${field.label} is required`;
        }

        if (field.type === "number") {
            const num = Number(value);
            if (isNaN(num)) return `${field.label} must be a number`;
            if (!field.allowNegative && num < 0)
                return `${field.label} cannot be negative`;
            if (field.min !== undefined && num < field.min)
                return `${field.label} must be ≥ ${field.min}`;
            if (field.max !== undefined && num > field.max)
                return `${field.label} must be ≤ ${field.max}`;
        }

        return "";
    };

    const validateForm = () => {
        const nextErrors: Record<string, string> = {};
        let valid = true;

        visibleFields.forEach((f) => {
            const err = validateField(f, formData[f.key]);
            if (err) {
                nextErrors[f.key] = err;
                valid = false;
            }
        });

        setErrors(nextErrors);
        return valid;
    };

    /* ---------------- SUBMIT ---------------- */

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!validateForm()) {
            setIsSubmitting(false);
            return;
        }

        try {
            // Add calculated NETWT and PUREWT to the data before submitting
            const submitData = {
                ...formData,
                NETWT: calculateNetWeight(),
                PUREWT: calculatePureWeight(),
            };

            await onSubmit(submitData);
            const reset: Record<string, any> = {};
            fields.forEach((f) => (reset[f.key] = ""));
            setFormData(reset);
            setTouched({});
        } catch (err) {
            console.error(err);
        }

        setIsSubmitting(false);
    };

    /* ---------------- RENDER FIELD ---------------- */

    const renderField = (field: FormField) => {
        const size = "xs";
        const isInvalid = !!errors[field.key] && touched[field.key];

        switch (field.type) {
            case "capitalized":
                return (
                    <CapitalizedInput
                        field={field.key as string}
                        value={formData[field.key] || ""}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="text"
                        isCapitalized
                        size={size}
                    />
                );

            case "number":
                return (
                    <CapitalizedInput
                        field={field.key as string}
                        value={formData[field.key] || ""}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="number"
                        isCapitalized={false}
                        allowNegative={field.allowNegative}
                        confirmNegative={field.confirmNegative}
                        size={size}
                        onClassUse={true}
                    />
                );

            case "select":
                return (
                    <CustomSelect
                        value={formData[field.key] || ""}
                        onChange={(v) => handleChange(field.key, v)}
                        collection={field.collection}
                        placeholder={field.placeholder}
                        isInvalid={isInvalid}
                        size={size}
                    />
                );

            case "combobox":
                return (
                    <CustomCombobox
                        value={formData[field.key] || ""}
                        onChange={(v) => handleChange(field.key, v)}
                        collection={field.collection}
                        placeholder={field.placeholder}
                        isInvalid={isInvalid}
                        size={size}

                    />
                );

            default:
                return (
                    <CapitalizedInput
                        field={field.key as string}
                        value={formData[field.key] || ""}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="text"
                        isCapitalized={false}
                        size={size}
                        onClassUse={true}
                    />
                );
        }
    };

    /* ---------------- GRID ---------------- */

    const getGridColumns = () => {
        if (compact) {
            return {
                base: "repeat(13, 1fr)", // 12-column grid for flexibility
                sm: "repeat(13, 1fr)",
                md: "repeat(13, 1fr)",
            };
        }

        return {
            base: "repeat(1, 1fr)",
            md: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
            xl: "repeat(4, 1fr)",
        };
    };
    const getGridColumnSpan = (field: FormField): string => {
        // Define how many columns each field should span
        const spanMap: Record<string, string> = {
            "ITEMID": "span 2",
            "DESCRIPTION": "span 2", 
            "ITEMCODE": "span 1", 
            "PCS": "span 1", 
            "GRSWT": "span 1",
            "LESSWT": "span 1",
            "PURITY": "span 1",
            "RATE": "span 1", 
            "AMOUNT": "span 1", 
        };

        return spanMap[field.key] || "span 1"; // Default to 1 column
    };

    /* ---------------- UI ---------------- */

    return (
        <Box
            p={compact ? 3 : 4}
            borderWidth="1px"
            borderRadius="lg"
            bg={theme.colors.formColor}
            boxShadow="sm"
        >
            <form onSubmit={handleSubmit}>
                <Grid templateColumns={getGridColumns()} gap={compact ? 3 : 4}>
                    {fields.map((field) => (
                        <GridItem
                            key={field.key}
                            gridColumn={getGridColumnSpan(field)}
                        >
                            <Flex direction="column">
                                <Text fontSize="2xs" mb={1}>
                                    {field.label}
                                    {field.isRequired && (
                                        <Text as="span" color="red.500"> *</Text>
                                    )}
                                </Text>
                                {renderField(field)}
                                {errors[field.key] && (
                                    <Text fontSize="2xs" color="red.500" mt={1}>
                                        {errors[field.key]}
                                    </Text>
                                )}
                            </Flex>
                        </GridItem>
                    ))}
                </Grid>

               

                <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>

                    {/* Show calculated values */}

                        <Flex mt={1} p={1} bg="gray.50" borderRadius="md" gap={2}>
                            {formData.NETWT && (
                                <Text fontSize="2xs">
                                    <strong>NET WT :</strong> {formData.NETWT}
                                </Text>
                            )}
                            {formData.PUREWT && (
                                <Text fontSize="2xs">
                                    <strong>PURE WT :</strong> {formData.PUREWT}
                                </Text>
                            )}
                        </Flex>
             
                    <Box display='flex' gap={1}>
                        <Button
                            size="2xs"
                            type="submit"
                            loading={isSubmitting}
                            bg={theme.colors.formColor}
                            variant='ghost'
                            color={theme.colors.whiteColor}
                        >
                         <Image src={downLoadIcon} alt="download" width={30} />
                        </Button>
                      

                      
                    </Box>
                    
                </Box>
            </form>
        </Box>
    );
}