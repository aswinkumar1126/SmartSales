"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Field,
    Input,
    Grid,
    GridItem,
    Button,
    Table,
    Heading,
    HStack,
    Flex
} from "@chakra-ui/react";
import { FaFileExcel, FaPrint } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { IoIosAdd, IoIosExit } from "react-icons/io";

import { useTheme } from "@/context/theme/themeContext";
import scrollToTop from "@/component/scroll/ScrollToTop";
import { Toaster } from "@/components/ui/toaster";
import { toastLoaded } from "@/component/toast/toast";

import { CustomTable } from "@/component/table/CustomTable";
import { usePrint } from "@/context/print/usePrintContext";
import { pureGoldMastForm } from "@/types/pureGold/pureGold";
import { usePureGoldData } from "@/hooks/pureGoldMast/usePureGoldMastData";
import { useCreatePureGoldMast } from "@/hooks/pureGoldMast/usePureGoldMastCreate";
import { useUpdatePureGoldMast } from "@/hooks/pureGoldMast/usePureGoldMastUpdate";
import { AiOutlineSave } from "react-icons/ai";
import { useRouter } from "next/navigation";
import { formatToFixed } from "@/utils/format/numberFormat";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";

/* ---------------- Initial Form State ---------------- */

const initialFormState: pureGoldMastForm = {
    pureGoldName: "",
    // weight: "",
    // actualTouch: "",
    // actualPure: "",
};

/* ---------------- Table Row Type ---------------- */

export type TouchTableRow = {
    sno: number;
    pureGoldName: string;
    // weight: number;
    // actualTouch: number;
    // actualPure: number;
};

/* ---------------- Component ---------------- */

const PureGoldMaster = () => {
    /* ---------------- State ---------------- */

    const [form, setForm] = useState<pureGoldMastForm>(initialFormState);
    const [editId, setEditId] = useState<number | null>(null);
    const [highlightRowId, setHighlightRowId] = useState<number | null>(null);

    type FormErrors = Partial<Record<keyof pureGoldMastForm, string>>;
    const [errors, setErrors] = useState<FormErrors>({});

    /* ---------------- Hooks ---------------- */
    const router = useRouter();
    const { theme } = useTheme();
     const {setData ,setColumns } = usePrint();
    const { data: pureGoldData = [], refetch } = usePureGoldData();

    const createMutation = useCreatePureGoldMast();
    const updateMutation = useUpdatePureGoldMast();

    /* ---------------- Helpers ---------------- */

    const handleChange = (key: keyof pureGoldMastForm, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const resetForm = () => {
        setForm(initialFormState);
        setEditId(null);
        setErrors({});
    };

    /* ---------------- Edit Handler ---------------- */

    const handleEdit = (row: TouchTableRow) => {
        setEditId(row.sno);
        scrollToTop();

        setForm({
            pureGoldName: row.pureGoldName,
            // weight: String(row.weight),
            // actualPure: String(row.actualPure),
            // actualTouch: String(row.actualTouch),
        });

        toastLoaded("Pure Gold Master");
    };

    /* ---------------- Validation ---------------- */

    const validateForm = (form: pureGoldMastForm): FormErrors => {
        const errors: FormErrors = {};

        if (!form.pureGoldName) errors.pureGoldName = "Pure Gold Name is required";
        // if (!form.weight) errors.weight = "Weight is required";
        // if (!form.actualPure) errors.actualPure = "Actual Pure is required";
        // if (!form.actualTouch) errors.actualTouch = "Actual Touch is required";

        return errors;
    };

    /* ---------------- Submit Handler ---------------- */

    const handleSubmit = () => {
        const validationErrors = validateForm(form);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const payload = {
            pureGoldName: form.pureGoldName,
            // weight: Number(form.weight),
            // actualTouch: Number(form.actualTouch),
            // actualPure: Number(form.actualPure),
        };

        if (editId) {
            updateMutation.mutate(
                { id: editId, data: payload },
                {
                    onSuccess: () => {
                        setHighlightRowId(editId);
                        resetForm();
                        refetch();
                    },
                }
            );
        } else {
            createMutation.mutate(payload, {
                onSuccess: (res: any) => {
                    setHighlightRowId(res?.data?.id);
                    resetForm();
                    refetch();
                },
            });
        }
    };

    /* ---------------- Table Columns ---------------- */

    const columns = [
        { key: "sno", label: "S.No" },
        { key: "pureGoldName", label: "Pure Gold Name" },
        // { key: "weight", label: "Weight" ,align : "end" as const },
        // { key: "actualPure", label: "Actual Pure", align: "end" as const },
        // { key: "actualTouch", label: "Actual Touch", align: "center" as const },
        { key: "action", label: "Action", align: "center" as const },
    ];

    /* ---------------- Row Highlight Animation ---------------- */

    useEffect(() => {
        if (!highlightRowId) return;

        const timer = setTimeout(() => setHighlightRowId(null), 2500);
        return () => clearTimeout(timer);
    }, [highlightRowId]);

    /* ---------------- Export ---------------- */
    const handleExport = (option: string) => {
        setData(pureGoldData);
        setColumns([
            { key: "sno", label: "S.No" },
            { key: "pureGoldName", label: "Pure Gold Name" },
            // { key: "weight", label: "Weight", align: 'end' as const, allowTotal: true },
            // { key: "actualTouch", label: "Actual Touch", align: 'end' as const, },
            // { key: "actualPure", label: "Actual Pure", align: 'end' as const, allowTotal: true },
        ]);
        router.push(`/print?export=${option}`);
    }


    /* ---------------- UI ---------------- */

    return (
        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={6} fontWeight='semibold'>
            <Toaster />

            {/* -------- Form Section -------- */}
            <GridItem>
                <Box p={5} borderRadius="lg" bg={theme.colors.formColor} boxShadow="sm">
                    <Heading size="sm" textAlign="center" mb={4}>
                        Pure Gold Master
                    </Heading>
                    <Box display="grid" gridTemplateColumns="repeat(1, 1fr)" gap={4}>
                        {/* PURE GOLD NAME */}
                        <Field.Root invalid={!!errors.pureGoldName}>
                            <HStack>
                                <Box minW="100px">
                                    <Field.Label fontSize="2xs">PURE GOLD NAME :</Field.Label>
                                </Box>
                                <Box flex={1}>
                                    <CapitalizedInput
                                        field="pureGoldName"
                                        value={form.pureGoldName}
                                        onChange={handleChange}
                                        placeholder="Enter pure gold name"
                                        size="2xs"
                                        
                                    />
                                    <Field.ErrorText>{errors.pureGoldName}</Field.ErrorText>
                                </Box>
                            </HStack>
                        </Field.Root>

                        {/* WEIGHT */}
                        {/* <Field.Root invalid={!!errors.weight}>
                            <HStack>
                                <Box minW="120px">
                                    <Field.Label fontSize="2xs">WEIGHT</Field.Label>
                                </Box>
                                <Box flex={1}>
                                    <CapitalizedInput
                                        field="weight"
                                        type="number"
                                        value={form.weight}
                                        onChange={handleChange}
                                        placeholder="Enter weight"
                                    />
                                    <Field.ErrorText>{errors.weight}</Field.ErrorText>
                                </Box>
                            </HStack>
                        </Field.Root> */}

                        {/* ACTUAL TOUCH */}
                        {/* <Field.Root invalid={!!errors.actualTouch}>
                            <HStack>
                                <Box minW="120px">
                                    <Field.Label fontSize="2xs">ACTUAL TOUCH</Field.Label>
                                </Box>
                                <Box flex={1}>
                                    <CapitalizedInput
                                        field="actualTouch"
                                        type="number"
                                        value={form.actualTouch}
                                        onChange={handleChange}
                                        placeholder="Enter actual touch"
                                    />
                                    <Field.ErrorText>{errors.actualTouch}</Field.ErrorText>
                                </Box>
                            </HStack>
                        </Field.Root> */}

                        {/* ACTUAL PURE */}
                        {/* <Field.Root invalid={!!errors.actualPure}>
                            <HStack>
                                <Box minW="120px">
                                    <Field.Label fontSize="2xs">ACTUAL PURE</Field.Label>
                                </Box>
                                <Box flex={1}>
                                    <CapitalizedInput
                                        field="actualPure"
                                        type="number"
                                        value={form.actualPure}
                                        onChange={handleChange}
                                        placeholder="Enter actual pure"
                                    />
                                    <Field.ErrorText>{errors.actualPure}</Field.ErrorText>
                                </Box>
                            </HStack>
                        </Field.Root> */}

                        {/* ================= ACTION BUTTONS ================= */}
                        <Box gridColumn="span 2">
                            <HStack pt={2} justifyContent="center" gap={2}>
                                <Button
                                    colorPalette="blue"
                                    onClick={handleSubmit}
                                    size="xs"
                                    loading={createMutation.isPending || updateMutation.isPending}
                                >
                                    <AiOutlineSave /> {editId ? "Update" : "Save"}
                                </Button>

                                <Button size="xs" colorPalette="blue" onClick={resetForm}>
                                    Clear <IoIosExit />
                                </Button>
                            </HStack>
                        </Box>
                    </Box>
                </Box>
            </GridItem>

            {/* -------- Table Section -------- */}
            <GridItem minW={0}>
                <Box  p={3} borderRadius="lg" bg={theme.colors.formColor} boxShadow="sm">
                    
                    <Box display="flex"  gap={2} alignItems="center" justifyContent="space-between">
        
                    <Heading size="md" mb={4}>
                        Pure Gold Master List
                    </Heading>
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
                    
                    </Box>
                    <CustomTable<TouchTableRow>
                        columns={columns}
                        data={pureGoldData as TouchTableRow[]}
                        rowIdKey="sno"
                        highlightRowId={highlightRowId}
                        emptyText="No data available"
                        bodyBg={theme.colors.primary}
                        headerBg="blue.800"
                        headerColor="white"
                        renderRow={(row, i) => (
                            <>
                                <Table.Cell>{i + 1}</Table.Cell>
                                <Table.Cell>{row.pureGoldName}</Table.Cell>
                                {/* <Table.Cell textAlign="end">{formatToFixed(row.weight ,2)} </Table.Cell>
                                <Table.Cell textAlign="end" >{formatToFixed(row.actualPure , 2) }</Table.Cell>
                                <Table.Cell textAlign="end">
                                    {formatToFixed(row.actualTouch,2)}
                                </Table.Cell> */}
                                <Table.Cell align="center">
                                    <Box display="flex" justifyContent="center">
                                        <FiEdit
                                            cursor="pointer"
                                            onClick={() => handleEdit(row)}
                                        />
                                    </Box>
                                  
                                </Table.Cell>
                            </>
                        )}
                    />
                </Box>
            </GridItem>
        </Grid>
    );
};

export default PureGoldMaster;
