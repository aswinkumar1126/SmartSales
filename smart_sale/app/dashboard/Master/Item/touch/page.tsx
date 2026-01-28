"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Box,
    Field,
    Grid,
    GridItem,
    Button,
    Table,
    Heading,
    HStack,
    Text,
    Flex
} from "@chakra-ui/react";

import { useItems } from "@/hooks/item/useItems";
import useTouchMastCreate from "@/hooks/touch/useTouchMastCreate";
import { useModifyTouchMasterById } from "@/hooks/touch/useTouchMastModify";
import { useTouchMastData } from "@/hooks/touch/useTouchMastData";

import { TouchMaster } from "@/types/touch/touch";
import { CustomTable } from "@/component/table/CustomTable";
import { FiEdit } from "react-icons/fi";
import { IoIosExit, IoIosSave } from "react-icons/io";
import { useTheme } from "@/context/theme/themeContext";
import { toastLoaded } from "@/component/toast/toast";
import { Toaster } from "@/components/ui/toaster";
import scrollToTop from "@/component/scroll/ScrollToTop";
import { formatToFixed } from "@/utils/format/numberFormat";
import { FaPrint } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { usePrint } from "@/context/print/usePrintContext";
import { FaFileExcel } from "react-icons/fa";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { AccountTypeList } from "@/data/ACCOUNTtYPE/AccountType";
import { SelectCombobox } from "@/components/ui/selectComboBox";
import { useAllAccountHead } from "@/hooks/accountHead/useAccountHead";
import { CalTypeCollection } from "@/data/CalType/CalType";
import { useTouchMasterDataById } from "@/hooks/touch/useTouchMastById";
import { AiOutlineSave } from "react-icons/ai";
/* ---------------- Initial State ---------------- */

const initialFormState: TouchMaster = {
    companyType: "",
    accode: "",
    itemId: "",
    touch: "",
    calculationMode:"",
};
export type TouchTableRow = {
    sno: number;
    acname: string;
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

    const [allAccountsList, setAllAccountsList] = useState<{ label: string; value: string }[]>([]);

    const [allItemsList, setAllItemsList] = useState<{ label: string; value: string }[]>([]);

    const filters = useMemo(() => ({
        accountType: form.companyType?.trim().toUpperCase()
    }), [form.companyType]);


    /* ---------------- Hooks ---------------- */

    const { data: touchData = [], refetch } = useTouchMastData();

   

    const { data: touchDatabyId, refetch:touchDataRefetch } = useTouchMasterDataById(editId);
    console.log(touchDatabyId, 'touchDatabyId')
    const { data: allAccounts ,refetch:accountRefetch } = useAllAccountHead(filters);


    const { data: items } = useItems();
    const { theme } = useTheme();
    const { setData, setColumns } = usePrint();

    const createMutation = useTouchMastCreate();
    const updateMutation = useModifyTouchMasterById();

    const router = useRouter();


    /* ---------------- Collections ---------------- */


    

    const accounts = Array.isArray(allAccounts?.data?.acheads) ? allAccounts?.data?.acheads : [];

    useEffect(() => {
        if (!accounts) return;

        const formattedAccounts = accounts.map((acc: any) => ({
            label: acc.ACNAME,
            value: String(acc.ACCODE),
        }));

        setAllAccountsList(formattedAccounts);
    }, [accounts]);

    useEffect(() => {
        if (!items?.items) return;

        const formattedItems = items.items.map((item: any) => ({
            label: item.itemName,
            value: String(item.itemId),
        }));

        setAllItemsList(formattedItems);

    }, [items])



    console.log(touchData, 'touchData')

    /* ---------------- Handlers ---------------- */

    const handleChange = (key: keyof TouchMaster, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleEdit = (row: any) => {
        setEditId(row.sno);
        scrollToTop();
        toastLoaded("Touch Master");
        setTimeout(() => touchDataRefetch(), 0); // 🔥 force reload
    };
    useEffect(() => {
        if (!touchDatabyId) return;

        setForm({
            accode: touchDatabyId.accode ?? "",
            companyType: touchDatabyId.companyType ?? "",
            itemId: touchDatabyId.itemId ?? "" ,
            touch: String(touchDatabyId.touch),
            calculationMode: touchDatabyId.calculationMode,
        });
    }, [touchDatabyId]);

  

    const resetForm = () => {
        setForm(initialFormState);
        setEditId(null);
        setErrors({});
    };
    useEffect(() => {
        if (!editId) {
            setForm(initialFormState);
        }
    }, [editId]);

    const payload = {
        companyType: form.companyType,
        accode: form.accode,
        itemId: Number(form.itemId),
        touch: Number(form.touch),
        calculationMode:form.calculationMode
    }
    const validateForm = (form: TouchMaster): FormErrors => {
        const errors: FormErrors = {};

        if (!form.accode) errors.accode = "Company is required";
        if (!form.companyType) errors.companyType = "Company type is required";
        if (!form.itemId) errors.itemId = "Item is required";
        if (!form.calculationMode) errors.calculationMode = "Calculation Mode is required";

        if (!form.touch) {
            errors.touch = "Touch is required";
        } else if (Number(form.touch) <= 0) {
            errors.touch = "Touch must be greater than 0";
        }

        const isDuplicate = touchData?.some(
            (item: any) =>
                form.companyType?.toLowerCase() === item.companyType?.toLowerCase() &&
                Number(form.accode) === Number(item.accode) &&
                Number(form.itemId) === Number(item.itemId) &&
                Number(item.sno) !== Number(editId) // 👈 key fix
                 // 👇 this line handles UPDATE case
        );

        if (isDuplicate) {
            errors.itemId = "Duplicate entry already exists";
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
                {
                    onSuccess: () => {
                        setHighlightRowId(editId);   // 👈 highlight updated row
                        resetForm();
                        refetch();
                    }
                }
            );
        } else {
            createMutation.mutate(payload, {
                onSuccess: (res: any) => {
                    const createdId = res?.data?.id; // adjust to your API response
                    setHighlightRowId(createdId);
                    resetForm();
                    refetch();
                },
            });
        }
    };

    const handleExport = (option: string) => {
        setData(touchData);
        setColumns([
            { key: "sno", label: "S.No" },
            { key: "acname", label: "Company Name" },
            { key: "companyType", label: "Company Type" },
            { key: "itemName", label: "Item Name" },
            { key: "touch", label: "Touch", align: 'end' as const, allowTotal: true },
        ]);
        router.push(`/print?export=${option}`);
    }

    /* ---------------- Table Columns ---------------- */

    const columns = [
        { key: "sno", label: "S.No" },
        { key: "acname", label: "Company Name" },
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
            templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
            gap={2}


        >
            <Toaster />
            {/* ---------------- FORM ---------------- */}
            <GridItem >
                <Box p={2} minW="full" fontWeight='semibold' borderRadius="lg" bg={theme.colors.formColor} boxShadow="sm" >
                    <Heading fontSize="medium" textAlign='center' mb={4}>
                        TOUCH MASTER
                    </Heading>

                    <Box>
                        <Grid css={{ sm: { gridTemplateColumns: "repeat(1, 1fr)" }, md: { gridTemplateColumns: "repeat(2, 1fr)" } }} gap={4}>

                            {/* Company Type */}
                            <Box>
                                <Field.Root invalid={!!errors.companyType}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">COMPANY TYPE :</Box>
                                        <SelectCombobox
                                            value={form.companyType}
                                            onChange={(val) => handleChange("companyType", val)}
                                            editId={Number(editId)}
                                            items={AccountTypeList}
                                            rounded="full"
                                        />
                                    </Box>
                                    <Field.ErrorText>{errors.companyType}</Field.ErrorText>
                                </Field.Root>
                            </Box>

                            {/* Company */}
                            <Box>
                                <Field.Root invalid={!!errors.accode}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">COMPANY NAME :</Box>
                                        <SelectCombobox
                                            value={String(form.accode)}
                                            onChange={(val) => handleChange("accode", val)}
                                            items={allAccountsList}
                                            editId={Number(editId)}
                                            rounded="full"
                                            disable={!form.companyType}
                                        />
                                    </Box>
                                    <Field.ErrorText>{errors.accode}</Field.ErrorText>
                                </Field.Root>
                            </Box>

                            {/* Item */}
                            <Box>
                                <Field.Root invalid={!!errors.itemId}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">ITEM :</Box>
                                        <SelectCombobox
                                            value={String(form.itemId)}
                                            onChange={(val) => handleChange("itemId", val)}
                                            editId={Number(editId)}
                                            items={allItemsList}
                                            rounded="full"
                                        />
                                    </Box>
                                    <Field.ErrorText>{errors.itemId}</Field.ErrorText>
                                </Field.Root>
                            </Box>

                            {/* Touch */}
                            <Box>
                                <Field.Root invalid={!!errors.touch}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">TOUCH :</Box>
                                        <CapitalizedInput
                                            field="touch"
                                            type="number"
                                            value={form.touch}
                                            onChange={handleChange}
                                            size="2xs"
                                            max={999}
                                            decimalScale={2}
                                            maxWidth="80px"
                                            rounded="full"

                                        />
                                    </Box>
                                    <Field.ErrorText>{errors.touch}</Field.ErrorText>
                                </Field.Root>
                            </Box>

                            <Box>
                                <Field.Root invalid={!!errors.itemId}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">CAL MODE :</Box>
                                        <SelectCombobox
                                            value={form.calculationMode}
                                            onChange={(val) => handleChange("calculationMode", val)}
                                            editId={Number(editId)}
                                            items={CalTypeCollection}
                                            rounded="full"

                                        />
                                    </Box>
                                    <Field.ErrorText>{errors.calculationMode}</Field.ErrorText>
                                </Field.Root>
                            </Box>


                        </Grid>

                        {/* Buttons */}
                        <HStack pt={4} justifyContent="center">
                            <Button
                                colorPalette="blue"
                                onClick={handleSubmit}
                                loading={
                                    createMutation.isPending ||
                                    updateMutation.isPending
                                }
                                size="xs"
                            >
                             <AiOutlineSave /> {editId ? "Update" : "Save"}
                            </Button>

                            <Button
                                size="xs"
                                colorPalette="blue"
                                onClick={resetForm}
                            >
                                Clear <IoIosExit />
                            </Button>
                        </HStack>
                    </Box>


                </Box>
            </GridItem>

            {/* ---------------- TABLE ---------------- */}
            <GridItem minW={0}>
                <Box p={5} borderRadius="lg" bg={theme.colors.formColor} boxShadow="sm">
                    <Heading display='flex' size="md" mb={4} gap={3} justifyContent='space-between' alignItems='center'>
                        <Text>Touch Master List</Text>

                        <Flex gap={1}>
                            <Button
                                variant="ghost"
                                size="xs"
                                color={theme.colors.green}
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
                                <Table.Cell>{row.acname}</Table.Cell>
                                <Table.Cell>{row.companyType}</Table.Cell>
                                <Table.Cell>{row.itemName}</Table.Cell>
                                <Table.Cell textAlign="right">{formatToFixed(row.touch, 2)}</Table.Cell>
                                <Table.Cell align="center">
                                    <Box display="flex" justifyContent="center" alignItems="center">
                                        <FiEdit
                                            cursor="pointer"
                                            onClick={() => {
                                                handleEdit(row)
                                            }}
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
