"use client";

import React, { useState } from "react";
import {
    Button,
    Drawer,
    Portal,
    HStack,
    Box,
} from "@chakra-ui/react";
import { useTheme } from "@/context/theme/themeContext";
import { DynamicForm } from "@/component/form/DynamicForm";
import { SearchIcon } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { FormField } from '@/types/form/form';
import { useEnterNavigation } from "@/component/form/useEnterNavigation";

export interface SearchFilters {
    fromDate: string;
    toDate: string;
    weight: string;
    itemId: string;
    pureId: string;
    accode: string;
}

export interface salesSearchProps {
    onSearch: (filters: SearchFilters) => void; // Only called on Apply Filters
    onClear?: () => void;
    isOpen?: boolean;
    onClose?: () => void;
    itemOptions?: Array<{ value: string; label: string }>;
    accodeOptions?: Array<{ value: string; label: string }>;
    pureGoldOptions?: Array<{ value: string; label: string }>;
    initialFilters?: Partial<SearchFilters>;
}

export const SalesSearch: React.FC<salesSearchProps> = ({
    onSearch,
    onClear,
    isOpen: externalIsOpen,
    onClose,
    itemOptions = [],
    accodeOptions = [],
    pureGoldOptions = [],
    initialFilters = {},
}) => {

    const today = new Date().toISOString().split("T")[0];
    const { theme } = useTheme();
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [formData, setFormData] = useState<SearchFilters>({
        fromDate: initialFilters.fromDate || "",
        toDate: initialFilters.toDate || "",
        pureId: initialFilters.pureId || "",
        weight: initialFilters.weight || "",
        itemId: initialFilters.itemId || "",
        accode: initialFilters.accode || "",
    });

    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

    const searchFields: FormField[] = [
        {
            name: "fromDate",
            label: "FROM DATE",
            type: "date",
            maxWidth: "120px",
            colSpan: 1,
            size: 'xs',
            maxDate: formData.toDate ??today
        },
        {
            name: "toDate",
            label: "TO DATE",
            type: "date",
            maxWidth: "120px",
            size: 'xs',
            colSpan: 1,
            minDate:formData.fromDate,
            maxDate: today
        },
        {
            name: "pureId",
            label: "PURE  NAME",
            type: "combobox",
            placeholder: "Select Pure",
            items: pureGoldOptions,
            size: "sm",
            maxWidth: "100%",
            rounded: 'sm',
            colSpan: 2,
        },
        {
            name: "weight",
            label: "WEIGHT",
            type: "number",
            placeholder: "Weight",
            size: "sm",
            allowDecimal: true,
            decimalScale: 3,
            maxWidth: "100%",
            allowFocus: true,
            colSpan: 2,
        },
        {
            name: "itemId",
            label: "ITEM NAME",
            type: "combobox",
            placeholder: "Select Item",
            items: itemOptions,
            size: "sm",
            maxWidth: "100%",
            rounded: 'sm',
            colSpan: 2,
        },
        {
            name: "accode",
            label: "PURCHASER",
            type: "combobox",
            placeholder: "Select Account",
            items: accodeOptions,
            size: "sm",
            maxWidth: "100%",
            rounded: 'sm',
            colSpan: 2,
        },
    ];

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            setInternalIsOpen(false);
        }
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }
        // Only call onSearch when user clicks Apply Filters
        onSearch(formData);
        handleClose();
    };

    const handleClear = () => {
        const emptyFilters: SearchFilters = {
            fromDate: "",
            toDate: "",
            pureId: "",
            weight: "",
            itemId: "",
            accode: "",
        };
        setFormData(emptyFilters);
        onSearch(emptyFilters); // Pass empty filters to clear
        onClear?.();
        handleClose();
    };

    const handleFieldChange = (fieldName: string, value: any) => {
        // Only update local state, don't trigger parent search
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const searchFieldsNames = searchFields.map(f => f.name);
    const { register, focusFirst, focusNext } = useEnterNavigation(searchFieldsNames ,
        // () => handleSubmit()
    );

    return (
        <>
            {externalIsOpen === undefined && (
                <Tooltip content="Search Filters" showArrow>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInternalIsOpen(true)}
                    >
                        <SearchIcon size={16} /> Search
                    </Button>
                </Tooltip>
            )}

            <Drawer.Root open={isOpen} onOpenChange={handleClose} size={'sm'}>
                <Portal>
                    <Drawer.Backdrop pointerEvents="none" />
                    <Drawer.Positioner>
                        <Drawer.Content pointerEvents="auto">
                         
                                <Drawer.Header>
                                    <Drawer.Title>Search Filters</Drawer.Title>
                                </Drawer.Header>

                                <Drawer.Body>
                                    <Box>
                                        <DynamicForm
                                            fields={searchFields}
                                            formData={formData}
                                            onChange={handleFieldChange}
                                            register={register}
                                            focusNext={focusNext}
                                            layout="grid"
                                            minLabelWidth="60px"
                                            labelFontSize="2xs"
                                        />
                                    </Box>
                                </Drawer.Body>
                            
                            <Drawer.Footer>
                                <HStack gap={2} width="100%" justifyContent="flex-end">
                                    <Button variant="outline" onClick={handleClear} size="xs" type="button">
                                        Clear All
                                    </Button>
                                    <Button variant="outline" onClick={handleClose} size="xs" type="button">
                                        Cancel
                                    </Button>
                                    <Button type="submit" size="xs" colorScheme="blue" onClick={handleSubmit}>
                                        Apply Filters
                                    </Button>
                                </HStack>
                            </Drawer.Footer>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </Portal>
            </Drawer.Root>
        </>
    );
};