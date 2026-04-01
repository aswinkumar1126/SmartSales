"use client";

import React, { useState, useEffect } from "react";
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
    entryNo: string;
    lotNumber: string;
    tagNumber: string;
    weight: string;
    itemId: string;
    accode: string;
}

export interface SearchDrawerProps {
    onSearch: (filters: SearchFilters) => void;
    onClear?: () => void;
    isOpen?: boolean;
    onClose?: () => void;
    itemOptions?: Array<{ value: string; label: string }>;
    accodeOptions?: Array<{ value: string; label: string }>;
    initialFilters?: Partial<SearchFilters>;
}

export const SearchDrawer: React.FC<SearchDrawerProps> = ({
    onSearch,
    onClear,
    isOpen: externalIsOpen,
    onClose,
    itemOptions = [],
    accodeOptions = [],
    initialFilters = {},
}) => {
    const { theme } = useTheme();
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [formData, setFormData] = useState<SearchFilters>({
        fromDate: initialFilters.fromDate || "",
        toDate: initialFilters.toDate || "",
        entryNo: initialFilters.entryNo || "",
        lotNumber: initialFilters.lotNumber || "",
        tagNumber: initialFilters.tagNumber || "",
        weight: initialFilters.weight || "",
        itemId: initialFilters.itemId || "",
        accode: initialFilters.accode || "",
    });

    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

    // Update formData when initialFilters changes from parent
    useEffect(() => {
        setFormData({
            fromDate: initialFilters.fromDate || "",
            toDate: initialFilters.toDate || "",
            entryNo: initialFilters.entryNo || "",
            lotNumber: initialFilters.lotNumber || "",
            tagNumber: initialFilters.tagNumber || "",
            weight: initialFilters.weight || "",
            itemId: initialFilters.itemId || "",
            accode: initialFilters.accode || "",
        });
    }, [initialFilters]);

    // Search form fields configuration
    const searchFields: FormField[] = [
        {
            name: "fromDate",
            label: "From Date",
            type: "date",
            placeholder: "From Date",
            dateFormat: "dd-MM-yyyy",
            maxWidth: "100%",
            colSpan: 2,
            size: 'xs'
          
        },
        {
            name: "toDate",
            label: "To Date",
            type: "date",
            placeholder: "To Date",
            dateFormat: "dd-MM-yyyy",
            maxWidth: "100%",
            size: 'xs',
            fontSize: 'xs',
            colSpan: 2,
        },
        {
            name: "entryNo",
            label: "Entry No",
            type: "number",
            placeholder: "Entry No",
            size: "sm",
            allowDecimal: false,
            maxWidth: "100%",
            colSpan: 1,
        },
        {
            name: "lotNumber",
            label: "Lot Number",
            type: "text",
            placeholder: "Lot Number",
            size: "sm",
            maxWidth: "100%",
            colSpan: 1,
        },
        {
            name: "tagNumber",
            label: "Tag Number",
            type: "text",
            placeholder: "Tag Number",
            size: "sm",
            maxWidth: "100%",
            colSpan: 2,
        },
        {
            name: "weight",
            label: "Weight",
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
            label: "Item",
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
            label: "Account Code",
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

    const handleSearch = () => {
        onSearch(formData);
        handleClose();
    };

    const handleClear = () => {
        const emptyFilters: SearchFilters = {
            fromDate: "",
            toDate: "",
            entryNo: "",
            lotNumber: "",
            tagNumber: "",
            weight: "",
            itemId: "",
            accode: "",
        };
        setFormData(emptyFilters);
        onSearch(emptyFilters); // This will clear filters in parent
        onClear?.(); // Call additional clear handler if provided
    };

    const handleFieldChange = (fieldName: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const searchFieldsNames = searchFields.map(f => f.name);

    const { register, focusFirst, focusNext } = useEnterNavigation(searchFieldsNames, () => {
        handleSearch();
        setTimeout(() => focusFirst(), 100);
    });

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

            <Drawer.Root open={isOpen} onOpenChange={handleClose}>
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content>
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
                                        layout="horizontal"
                                        minLabelWidth="80px"
                                        labelFontSize="xs"
                                    />
                                </Box>
                            </Drawer.Body>

                            <Drawer.Footer>
                                <HStack gap={2} width="100%" justifyContent="flex-end">
                                    <Button variant="outline" onClick={handleClear} size="xs">
                                        Clear All
                                    </Button>
                                    <Button variant="outline" onClick={handleClose} size="xs">
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSearch} size="xs" colorScheme="blue">
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