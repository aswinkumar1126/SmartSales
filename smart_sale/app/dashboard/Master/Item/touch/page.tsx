"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Box,
    Field,
    Input,
    Select,
    createListCollection,
    Portal,
    Grid,
    GridItem,
    Button,
    Table,
    Heading,
    HStack
} from "@chakra-ui/react";

import { useAllCompanies } from "@/hooks/company/useCompany";
import { useItems } from "@/hooks/item/useItems";
import useTouchMastCreate from "@/hooks/touch/useTouchMastCreate";
import { useModifyTouchMasterById } from "@/hooks/touch/useTouchMastModify";
import { useTouchMastData } from "@/hooks/touch/useTouchMastData";

import { TouchMaster } from "@/types/touch/touch";
import { CustomTable } from "@/component/table/CustomTable";
import { FiEdit } from "react-icons/fi";
import { IoIosExit } from "react-icons/io";
import { useTheme } from "@/context/theme/themeContext";
import { toastLoaded } from "@/component/toast/toast";
import { Toaster } from "@/components/ui/toaster";
import scrollToTop from "@/component/scroll/ScrollToTop";
/* ---------------- Initial State ---------------- */

const initialFormState: TouchMaster = {
    companyType: "",
    companyId: "",
    itemId: "",
    touch: "",
};
export type TouchTableRow = {
    sno: number;
    COMPANYNAME: string;
    companyType: string;
    itemName: string;
    touch: number;
};
/* ---------------- Component ---------------- */

const TouchMasterForm = () => {
    const [form, setForm] = useState<TouchMaster>(initialFormState);
    const [editId, setEditId] = useState<number | null>(null);
    type FormErrors = Partial<Record<keyof TouchMaster, string>>;
    const [highlightRowId, setHighlightRowId] = useState<number | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});

    /* ---------------- Hooks ---------------- */

    const { data: touchData = [], refetch } = useTouchMastData();
    const { data: companiesData } = useAllCompanies();
    const { data: items } = useItems();
    const {theme } = useTheme();

    const createMutation = useTouchMastCreate();
    const updateMutation = useModifyTouchMasterById();

    /* ---------------- Collections ---------------- */

    const companiesCollection = useMemo(
        () =>
            createListCollection({
                items:
                    companiesData?.data?.map((c: any) => ({
                        value: c.COMPANYID,
                        label: c.COMPANYNAME,
                    })) ?? [],
            }),
        [companiesData]
    );

    const companyTypeCollection = useMemo(
        () =>
            createListCollection({
                items: [
                    { value: "CUS", label: "Customer" },
                    { value: "SEL", label: "Seller" },
                ],
            }),
        []
    );

    const itemsCollection = useMemo(
        () =>
            createListCollection({
                items:
                    items?.items?.map((i: any) => ({
                        value: i.itemId,
                        label: i.itemName,
                    })) ?? [],
            }),
        [items]
    );
    

    /* ---------------- Handlers ---------------- */

    const handleChange = (key: keyof TouchMaster, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleEdit = (row: any) => {
        setEditId(row.sno);
        scrollToTop();
        setForm({
            companyId: row.companyId,
            companyType: row.companyType,
            itemId: row.itemId,
            touch: String(row.touch),
        });
        toastLoaded("Touch Master");
    };

    const resetForm = () => {
        setForm(initialFormState);
        setEditId(null);
        setErrors({});
    };

    const payload = {
        companyType:form.companyType,
        companyId : Number(form.companyId),
        itemId: Number(form.itemId),
        touch: Number(form.touch),
    }
    const validateForm = (form: TouchMaster): FormErrors => {
        const errors: FormErrors = {};

        if (!form.companyId) errors.companyId = "Company is required";
        if (!form.companyType) errors.companyType = "Company type is required";
        if (!form.itemId) errors.itemId = "Item is required";
        if (!form.touch) {
            errors.touch = "Touch is required";
        } else if (Number(form.touch) <= 0) {
            errors.touch = "Touch must be greater than 0";
        }

        return errors;
    };


    const handleSubmit = () => {
        const validationErrors = validateForm(form);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({}); // clear errors

        if (editId) {
            updateMutation.mutate(
                { id: editId, formData: payload },
                { onSuccess: () => { 
                    setHighlightRowId(editId);   // 👈 highlight updated row
                    resetForm();
                    refetch(); } }
            );
        } else {
            createMutation.mutate(payload, {
                onSuccess: (res:any) => { 
                    const createdId = res?.data?.id; // adjust to your API response
                    setHighlightRowId(createdId);
                    resetForm(); 
                    refetch();
                 },
            });
        }
    };

    /* ---------------- Table Columns ---------------- */

    const columns = [
        { key: "sno", label: "S.No" },
        { key: "companyName", label: "Company" },
        { key: "companyType", label: "Company Type" },
        { key: "itemName", label: "Item Name" },
        { key: "touch", label: "Touch", align: 'center' as const },
        { key: "action", label: "Action", align: 'center' as const },
    ];

    /* ------------ Animation----------------------- */
    useEffect(() => {
        if (!highlightRowId) return;

        const timer = setTimeout(() => {
            setHighlightRowId(null);
        }, 2500); // 2.5s highlight

        return () => clearTimeout(timer);
    }, [highlightRowId]);

    /* ---------------- UI ---------------- */

    return (
        <Grid
            templateColumns={{ base: "1fr", lg: "1fr 2fr" }}
            gap={6}
            alignItems="start"
        >   
        <Toaster />
            {/* ---------------- FORM ---------------- */}
            <GridItem>
                <Box p={5} borderRadius="lg" bg={theme.colors.formColor} boxShadow="sm">
                    <Heading size="md" textAlign='center' mb={4}>
                        Touch Master
                    </Heading>

                    <Box display="grid" gap={4}>

                        {/* Company */}
                        <Field.Root invalid={!!errors.companyId}>
                            <Field.Label>Company</Field.Label>

                            <Select.Root
                                collection={companiesCollection}
                                value={[form.companyId]}
                                onValueChange={(e) => {
                                    handleChange("companyId", e.value[0]);
                                    setErrors((prev) => ({ ...prev, companyId: undefined }));
                                }}
                            >
                                <Select.HiddenSelect />
                                <Select.Control>
                                    <Select.Trigger>
                                        <Select.ValueText placeholder="Select Company" />
                                    </Select.Trigger>
                                    <Select.IndicatorGroup>
                                        <Select.Indicator />

                                    </Select.IndicatorGroup>
                                </Select.Control>
                                <Portal>
                                    <Select.Positioner>
                                        <Select.Content>
                                            {companiesCollection.items.map((item) => (
                                                <Select.Item key={item.value} item={item}>
                                                    <Select.ItemText>{item.label}</Select.ItemText>
                                                    <Select.ItemIndicator />
                                                </Select.Item>
                                            ))}
                                        </Select.Content>
                                    </Select.Positioner>
                                </Portal>
                            </Select.Root>

                            <Field.ErrorText>{errors.companyId}</Field.ErrorText>
                        </Field.Root>


                        {/* Company Type */}
                        <Field.Root invalid={!!errors.companyType}>
                            <Field.Label>Company Type</Field.Label>
                            <Select.Root
                                collection={companyTypeCollection}
                                value={[form.companyType]}
                                onValueChange={(e) =>
                                    handleChange("companyType", e.value[0])
                                }
                            >
                                <Select.HiddenSelect />
                              
                                <Select.Control>
                                    <Select.Trigger>
                                        <Select.ValueText placeholder="Select Type" />
                                    </Select.Trigger>
                                    <Select.IndicatorGroup>
                                        <Select.Indicator />
                                    
                                    </Select.IndicatorGroup>
                                </Select.Control>
                             
                                <Portal>
                                    <Select.Positioner>
                                        <Select.Content>
                                            {companyTypeCollection.items.map((item) => (
                                                <Select.Item key={item.value} item={item}>
                                                    <Select.ItemText>
                                                        {item.label}
                                                    </Select.ItemText>
                                                    <Select.ItemIndicator />
                                                </Select.Item>
                                            ))}
                                        </Select.Content>
                                    </Select.Positioner>
                                </Portal>
                            </Select.Root>
                            <Field.ErrorText>{errors.companyType}</Field.ErrorText>
                        </Field.Root>

                        {/* Item */}
                        <Field.Root invalid={!!errors.itemId}>
                            <Field.Label>Item</Field.Label>
                            <Select.Root
                                collection={itemsCollection}
                                value={[form.itemId]}
                                onValueChange={(e) =>
                                    handleChange("itemId", e.value[0])
                                }
                            >
                                <Select.HiddenSelect />
                                <Select.Control>
                                    <Select.Trigger>
                                        <Select.ValueText placeholder="Select Item" />
                                    </Select.Trigger>
                                    <Select.IndicatorGroup>
                                        <Select.Indicator />

                                    </Select.IndicatorGroup>
                                </Select.Control>
                                <Portal>
                                    <Select.Positioner>
                                        <Select.Content>
                                            {itemsCollection.items.map((item:any) => (
                                                <Select.Item key={item.value} item={item}>
                                                    <Select.ItemText>
                                                        {item.label}
                                                    </Select.ItemText>
                                                    <Select.ItemIndicator />
                                                </Select.Item>
                                            ))}
                                        </Select.Content>
                                    </Select.Positioner>
                                </Portal>
                            </Select.Root>
                            <Field.ErrorText>{errors.itemId}</Field.ErrorText>
                        </Field.Root>

                        {/* Touch */}
                        <Field.Root invalid={!!errors.touch}>
                            <Field.Label>Touch</Field.Label>

                            <Input
                                type="number"
                                value={form.touch}
                                onChange={(e) => {
                                    handleChange("touch", e.target.value);
                                    setErrors((prev) => ({ ...prev, touch: undefined }));
                                }}
                            />

                            <Field.ErrorText>{errors.touch}</Field.ErrorText>
                        </Field.Root>

                    <Box>

                </Box>
                       
                        <HStack pt={2} justifyContent="center">
                            <Button
                                colorPalette="blue"
                                onClick={handleSubmit}
                                loading={
                                    createMutation.isPending ||
                                    updateMutation.isPending
                                }
                            >
                                {editId ? "Update" : "Save"}
                            </Button>
                        
                              {/* <Button size="sm" colorPalette="yellow">Open</Button>
                                 <Button size="sm"  colorPalette="blue" >New</Button> */}
                             <Button size="sm" colorPalette="blue" onClick={resetForm} >Clear <IoIosExit /> </Button>
                     </HStack>
                        </Box>
                   
                </Box>
            </GridItem>

            {/* ---------------- TABLE ---------------- */}
            <GridItem minW={0}>
                <Box p={5} borderRadius="lg" bg={theme.colors.formColor}  boxShadow="sm">
                    <Heading size="md" mb={4}>
                        Touch Master List
                    </Heading>
                    <CustomTable<TouchTableRow>
                        columns={columns}
                        data={touchData as TouchTableRow[]}
                        renderRow={(row: any, i: number) => (
                            <>
                                <Table.Cell>{i + 1}</Table.Cell>
                                <Table.Cell>{row.COMPANYNAME}</Table.Cell>
                                <Table.Cell>{row.companyType}</Table.Cell>
                                <Table.Cell>{row.itemName}</Table.Cell>
                                <Table.Cell textAlign="right">{row.touch}</Table.Cell>
                                <Table.Cell align="center">
                                    <Box display="flex" justifyContent="center" alignItems="center">
                                        <FiEdit
                                            cursor="pointer"
                                            onClick={() =>{
                                                 handleEdit(row)
                                            } }
                                        />
                                    </Box>
                                  
                                </Table.Cell>
                            </>
                        )}
                        emptyText="No data available"
                        bodyBg={theme.colors.primary}
                        size="sm"
                        headerBg="blue.800"
                        headerColor="white"
                        rowIdKey='sno'
                        highlightRowId={highlightRowId}
                        
                    />
                </Box>
            </GridItem>
        </Grid>
    );
};

export default TouchMasterForm;
