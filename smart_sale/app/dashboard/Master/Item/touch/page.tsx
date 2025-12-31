"use client";

import React, { useState, useMemo, useEffect  } from "react";
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
    HStack,
    Text,
    Flex
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
import { formatToFixed } from "@/utils/format/numberFormat";
import { FaPrint } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { usePrint } from "@/context/print/usePrintContext";
import { exportToStyledExcel } from "@/utils/export/exportToExcel";
import { FaFileExcel } from "react-icons/fa";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";


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
   
    console.log(touchData,'touchData')
    // const printData = useMemo(() => {
    //     return (touchData ?? []).map((row: any, index: number) => ({
    //         ...row,

    //         // Ensure serial number (optional override)
    //         sno: index + 1,

    //         // ✅ format touch properly
    //         touch: formatToFixed(row.touch, 2),

    //         // normalize naming (optional but recommended)
    //         companyName: row.companyname,
    //     }));
    // }, [touchData]);

    const { data: companiesData } = useAllCompanies();
    const { data: items } = useItems();
    const {theme } = useTheme();
    const {setData ,setColumns } = usePrint();

    const createMutation = useTouchMastCreate();
    const updateMutation = useModifyTouchMasterById();

    const router = useRouter();
    /* ---------------- Collections ---------------- */
    console.log(companiesData ,'companyData')
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
                    { value: "CUS", label: "CUSTOMER" },
                    { value: "SEL", label: "SELLER" },
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
        companyId :form.companyId,
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

    const handleExport = (option:string)=> {
        setData(touchData);
        setColumns([
            { key: "sno", label: "S.No" },
            { key: "COMPANYNAME", label: "Company Name" },
            { key: "companyType", label: "Company Type" },
            { key: "itemName", label: "Item Name" },
            { key: "touch", label: "Touch", align: 'end' as const, allowTotal: true },
        ]);
        router.push(`/print?export=${option}` );
    }
    // const handlePrint = () =>{
    //     setData(touchData);
    //     setColumns([
    //         { key: "sno", label: "S.No" },
    //         { key: "companyname", label: "Company" },
    //         { key: "companyType", label: "Company Type" },
    //         { key: "itemName", label: "Item Name" },
    //         { key: "touch", label: "Touch", align: 'end' as const, allowTotal: true },
    //     ]);
    //     router.push("/print");
    // }
    // const handleExcel = () => {
    //     setData(touchData);
    //     setColumns([
    //         { key: "sno", label: "S.No" },
    //         { key: "companyname", label: "Company" },
    //         { key: "companyType", label: "Company Type" },
    //         { key: "itemName", label: "Item Name" },
    //         { key: "touch", label: "Touch", align: "end", allowTotal: true, isNumeric: true },
    //     ]);

    //     router.push("/print?export=excel");
    // };

    /* ---------------- Table Columns ---------------- */

    const columns = [
        { key: "sno", label: "S.No" },
        { key: "COMPANYNAME", label: "Company Name" },
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

                            <CapitalizedInput
                                field="touch"
                                type="number"
                                value={form.touch}
                                onChange={handleChange}
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
                    <Heading  display='flex' size="md" mb={4} gap={3} justifyContent='space-between' alignItems='center'>
                        <Text>Touch Master List</Text>

                        <Flex gap={1}>
                            <Button
                                variant="ghost"
                                size="xs"
                                color= {theme.colors.green}
                                _hover={{ color: "black" }}
                                onClick={() => handleExport("excel")}
                                aria-label="Export Excel"
                            >
                                <FaFileExcel />
                            </Button>

                            <Button
                                variant="ghost"
                                size="xs"
                                color={theme.colors.primaryText}
                                _hover={{ color: "black" }}
                                onClick={() => handleExport("pdf")}
                                aria-label="Export PDF"
                            >
                                <FaPrint />
                            </Button>
                        </Flex>




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
                                <Table.Cell textAlign="right">{formatToFixed(row.touch , 2)}</Table.Cell>
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
