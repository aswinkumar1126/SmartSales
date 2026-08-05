"use client";

import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState,
} from "react";
import { Button, Drawer, Portal, HStack, Box } from "@chakra-ui/react";

import { FormField } from "@/types/form/form";
import { DynamicForm } from "@/component/form/DynamicForm";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { useTheme } from "@/context/theme/themeContext";

export interface AdvancedSearchHandle {
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export interface AdvancedSearchProps {

    title?: string;
    fields: FormField[];
    onSearch: (filters: Record<string, any>) => void;
    onClear?: () => void;
    initialFilters?: Record<string, any>;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    size?: "xs" | "sm" | "md" | "lg" | "full";
}


export const AdvancedSearch = forwardRef<AdvancedSearchHandle, AdvancedSearchProps>(
    (
        {
            title = "Advanced Search",
            fields,
            onSearch,
            onClear,
            initialFilters = {},
            isOpen: controlledOpen,
            onOpenChange,
            size = "xs",
        },
        ref
    ) => {
        const { theme } = useTheme();
        const [internalOpen, setInternalOpen] = useState(false);
        const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

        const emptyFilters = useMemo(() => {
            const obj: Record<string, any> = {};
            fields.forEach((f) => {
                obj[f.name] = initialFilters[f.name] ?? "";
            });
            return obj;
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        const [filters, setFilters] = useState<Record<string, any>>(emptyFilters);

        const setOpen = (open: boolean) => {
            if (onOpenChange) onOpenChange(open);
            if (controlledOpen === undefined) setInternalOpen(open);
        };

        const handleClose = () => setOpen(false);

        const handleSubmit = () => {
            onSearch(filters);
            handleClose();
        };

        const fieldNames = useMemo(() => fields.map((f) => f.name), [fields]);
        const { register, focusFirst, focusNext } = useEnterNavigation(fieldNames, handleSubmit);

        const handleClear = () => {
            setFilters(emptyFilters);
            onClear?.();
            onSearch(emptyFilters);
        };

        const handleFieldChange = (name: string, value: any) => {
            setFilters((prev) => ({ ...prev, [name]: value }));
        };

        useImperativeHandle(ref, () => ({
            open: () => setOpen(true),
            close: () => setOpen(false),
            toggle: () => setOpen(!isOpen),
        }));

        useEffect(() => {
            if (!isOpen) return;
            const timer = setTimeout(() => focusFirst(), 100);
            return () => clearTimeout(timer);
        }, [isOpen, focusFirst]);

        return (
            <Drawer.Root open={isOpen} onOpenChange={(e) => setOpen(e.open)} size={size}>
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content>
                            <Drawer.Header bg={theme.colors.primary} color="white" p={4}>
                                <Drawer.Title fontSize={{base:'sm' ,md:"xl"}}>{title}</Drawer.Title>
                            </Drawer.Header>

                            <Drawer.Body>
                                <Box>
                                    <DynamicForm
                                        fields={fields}
                                        formData={filters}
                                        onChange={handleFieldChange}
                                        register={register}
                                        focusNext={focusNext}
                                        layout="vertical"
                                        minLabelWidth="90px"
                                        labelFontSize="xs"
                                    />
                                </Box>
                            </Drawer.Body>

                            <Drawer.Footer borderTop={"2px solid "} borderColor={theme.colors.primary} color="white">
                                <HStack gap={2} width="100%" justifyContent="flex-end">
                                    <Button type="button" bg={theme.colors.primary} size="xs" onClick={handleSubmit}>
                                        Search
                                    </Button>
                                    <Button type="button" variant="outline"  size="xs" onClick={handleClear}>
                                        Clear
                                    </Button>
                                    <Button type="button" variant="outline" size="xs" onClick={handleClose}>
                                        Cancel
                                    </Button>
                                </HStack>
                            </Drawer.Footer>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </Portal>
            </Drawer.Root>
        );
    }
);

AdvancedSearch.displayName = "AdvancedSearch";
