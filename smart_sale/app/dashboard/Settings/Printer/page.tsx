"use client";

import React, { useState, useEffect } from "react";
import { CustomTable } from "@/component/table/CustomTable";
import { DynamicForm } from "@/component/form/DynamicForm";
import { printerFields } from "@/config/settings/Printer";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { Box, Button, HStack, VStack, Text, Grid, GridItem, Table } from "@chakra-ui/react";
import { Toaster } from "@/components/ui/toaster";
import { useTheme } from "@/context/theme/themeContext";
import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { FaPrint, FaFileExcel } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { toastError, toastLoaded } from "@/component/toast/toast";
import { usePrint, useCreatePrint, useUpdatePrint } from "@/hooks/print/usePrint";
import { CreatePrinterSettingInterface } from "@/service/PrinterSettingService";

// Type definition based on your service
interface PrinterSettingType {
    printCode:number;
    IPId: string;
    IpAddress: string;
    exeName: string;
    printerName: string;  

}


function PrinterSetting() {
    const { theme } = useTheme();
    const router = useRouter();

    const initialFormData = {
      
        IpAddress: "",
        exeName: "",
        printerName: ""
    }

    /* -------------------- STATE -------------------- */
    const [formData, setFormData] = useState<CreatePrinterSettingInterface>(initialFormData);
    const [editId, setEditId] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [highlightedId, setHighlightedId] = useState<number>();
    const [isLoading, setIsLoading] = useState(false);

    /* -------------------- HOOKS -------------------- */
    const { data: printerData, isLoading: printerLoading, refetch: refetchPrinters } = usePrint();
    const { mutate: createPrinter, isPending: isCreating } = useCreatePrint();
    const { mutate: updatePrinter, isPending: isUpdating } = useUpdatePrint();

    // Use the API data instead of local state
    const printers = printerData?.data || printerData || [];

    /* -------------------- EFFECTS -------------------- */
    useEffect(() => {
        if (!highlightedId) return;
        const timer = setTimeout(() => setHighlightedId(undefined), 3000);
        return () => clearTimeout(timer);
    }, [highlightedId]);

    /* -------------------- HANDLERS -------------------- */
    const handleFormChange = (name: string, value: any) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const resetForm = () => {
        setEditId(null);
        setFormData(initialFormData);
        setErrors({});
        focusFirst();
    };

    const validateField = (field: string, value: any): string | undefined => {
        // Find field configuration
        const fieldConfig = printerFields.find(f => f.name === field);

        if (fieldConfig?.required) {
            if (!value || (typeof value === 'string' && !value.trim())) {
                return `${fieldConfig.label || field} is required`;
            }
        }

        return undefined;
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        printerFields.forEach(field => {
            if (field.required) {
                const error = validateField(field.name, (formData as Record<string, any>)[field.name]);
                if (error) newErrors[field.name] = error;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    console.log(formData,'formData')

    const handleSave = async () => {
        if (!validateForm()) {
            toastError("Please fix the errors in the form");
            return;
        }

        setIsLoading(true);

        try {
            if (editId) {
                // Update existing printer - ensure the payload includes the ID
                updatePrinter(
                    { id: editId, payload: formData },
                    {
                        onSuccess: () => {
                            toastLoaded("Printer updated successfully");
                            resetForm();
                            setHighlightedId(Number(editId));
                        },
                        onError: (error: any) => {
                            toastError(error?.message || "Failed to update printer");
                            console.error(error);
                        }
                    }
                );
            } else {
                // Create new printer
                createPrinter(formData, {
                    onSuccess: () => {
                        toastLoaded("Printer created successfully");
                        resetForm();
                    },
                    onError: (error: any) => {
                        toastError(error?.message || "Failed to create printer");
                        console.error(error);
                    }
                });
            }
        } catch (error) {
            toastError("Failed to save printer");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (printer: PrinterSettingType) => {
        setEditId(String(printer.printCode) || null);
        setFormData(printer);
        focusFirst();
    };

    const handleExport = (option: string) => {
        // You need to implement setData, setColumns, etc. or use a different approach
        // For now, let's create a temporary solution
        const exportData = printers;
        const exportColumns = printerFields.map(field => ({
            key: field.name,
            label: field.label || field.name,
        }));

        // Store in sessionStorage or state management
        sessionStorage.setItem('exportData', JSON.stringify(exportData));
        sessionStorage.setItem('exportColumns', JSON.stringify(exportColumns));
        sessionStorage.setItem('exportTitle', 'Printer Settings');

        router.push(`/print?export=${option}`);
    };

    /* -------------------- TABLE COLUMNS -------------------- */
    const printerColumns = [
        { key: 'index', label: 'S.No' },
        ...printerFields.map(field => ({
            key: field.name,
            label: field.label || field.name
        })),
        { key: 'actions', label: 'Actions' },
    ];

    /* -------------------- FORM NAVIGATION -------------------- */
    const fieldNames = printerFields.map(f => f.name);
    const { register, focusNext, focusFirst } = useEnterNavigation(fieldNames, () => {
        handleSave();
    });

    const isLoadingAction = isLoading || isCreating || isUpdating;

    /* -------------------- RENDER -------------------- */
    return (
        <Box fontWeight="semibold" bg={theme.colors.primary} color={theme.colors.secondary}>
            <Toaster />
            <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={2}>
                {/* FORM SECTION */}
                <GridItem>
                    <VStack bg={theme.colors.formColor} p={4} borderRadius="xl" border="1px solid #eef">
                        <Text fontSize="small" fontWeight="600">
                            {editId ? "EDIT PRINTER" : "PRINTER SETUP"}
                        </Text>

                        <DynamicForm
                            fields={printerFields}
                            formData={formData}
                            onChange={handleFormChange}
                            register={register}
                            focusNext={focusNext}
                            disabled={{}} // Add disabled fields if needed
                            errors={errors}
                            layout="vertical"
                            minLabelWidth="80px"
                        />

                        <HStack gap={2}>
                            <Button
                                size="xs"
                                colorPalette="blue"
                                loading={isLoadingAction}
                                onClick={handleSave}
                                disabled={isLoadingAction}
                            >
                                <AiOutlineSave /> {editId ? "Update" : "Save"}
                            </Button>
                            <Button size="xs" colorPalette="blue" onClick={resetForm} disabled={isLoadingAction}>
                                <IoIosExit /> Exit
                            </Button>
                        </HStack>
                    </VStack>
                </GridItem>

                {/* TABLE SECTION */}
                <GridItem minW={0}>
                    <Box bg={theme.colors.formColor} p={2} borderRadius="xl" border="1px solid #eef">
                        <Box display='flex' mb={2} gap={2} justifyContent='space-between' alignItems='center'>
                            <Text fontWeight="semibold" fontSize="small">PRINTER LIST</Text>
                            <HStack gap={1}>
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    color={theme.colors.green}
                                    onClick={() => handleExport("excel")}
                                    disabled={printers.length === 0}
                                >
                                    <FaFileExcel />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    color={theme.colors.primaryText}
                                    onClick={() => handleExport("pdf")}
                                    disabled={printers.length === 0}
                                >
                                    <FaPrint />
                                </Button>
                            </HStack>
                        </Box>

                        {printerLoading ? (
                            <Text textAlign="center" py={4}>Loading printers...</Text>
                        ) : (
                            <CustomTable
                                columns={printerColumns}
                                data={printers}
                                renderRow={(printer, index) => (
                                    <>
                                        <Table.Cell>{index + 1}</Table.Cell>
                                        {printerFields.map(field => (
                                            <Table.Cell key={field.name}>
                                                {(printer as Record<string, any>)[field.name] || "-"}
                                            </Table.Cell>
                                        ))}
                                        <Table.Cell>
                                            <Box display="flex" justifyContent="center">
                                                <FaEdit
                                                    onClick={() => handleEdit(printer as unknown as PrinterSettingType)}
                                                    cursor="pointer"
                                                    title="Edit Printer"
                                                />
                                            </Box>
                                        </Table.Cell>
                                    </>
                                )}
                                headerBg="blue.800"
                                headerColor="white"
                                borderColor="white"
                                bodyBg={theme.colors.primary}
                                highlightRowId={highlightedId ? Number(highlightedId) : null}
                                rowIdKey="id"
                                emptyText="No printers available"
                            />
                        )}
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
}

export default PrinterSetting;