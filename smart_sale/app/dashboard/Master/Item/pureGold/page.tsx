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
} from "@chakra-ui/react";

import { FiEdit } from "react-icons/fi";
import { IoIosAdd, IoIosExit } from "react-icons/io";

import { useTheme } from "@/context/theme/themeContext";
import scrollToTop from "@/component/scroll/ScrollToTop";
import { Toaster } from "@/components/ui/toaster";
import { toastLoaded } from "@/component/toast/toast";

import { CustomTable } from "@/component/table/CustomTable";

import { pureGoldMastForm } from "@/types/pureGold/pureGold";
import { usePureGoldData } from "@/hooks/pureGoldMast/usePureGoldMastData";
import { useCreatePureGoldMast } from "@/hooks/pureGoldMast/usePureGoldMastCreate";
import { useUpdatePureGoldMast } from "@/hooks/pureGoldMast/usePureGoldMastUpdate";
import { AiOutlineSave } from "react-icons/ai";
/* ---------------- Initial Form State ---------------- */

const initialFormState: pureGoldMastForm = {
    pureGoldName: "",
    weight: "",
    actualTouch: "",
    actualPure: "",
};

/* ---------------- Table Row Type ---------------- */

export type TouchTableRow = {
    sno: number;
    pureGoldName: string;
    weight: number;
    actualTouch: number;
    actualPure: number;
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

    const { theme } = useTheme();
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
            weight: String(row.weight),
            actualPure: String(row.actualPure),
            actualTouch: String(row.actualTouch),
        });

        toastLoaded("Pure Gold Master");
    };

    /* ---------------- Validation ---------------- */

    const validateForm = (form: pureGoldMastForm): FormErrors => {
        const errors: FormErrors = {};

        if (!form.pureGoldName) errors.pureGoldName = "Pure Gold Name is required";
        if (!form.weight) errors.weight = "Weight is required";
        if (!form.actualPure) errors.actualPure = "Actual Pure is required";
        if (!form.actualTouch) errors.actualTouch = "Actual Touch is required";

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
            weight: Number(form.weight),
            actualTouch: Number(form.actualTouch),
            actualPure: Number(form.actualPure),
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
        { key: "weight", label: "Weight" },
        { key: "actualPure", label: "Actual Pure" },
        { key: "actualTouch", label: "Actual Touch", align: "center" as const },
        { key: "action", label: "Action", align: "center" as const },
    ];

    /* ---------------- Row Highlight Animation ---------------- */

    useEffect(() => {
        if (!highlightRowId) return;

        const timer = setTimeout(() => setHighlightRowId(null), 2500);
        return () => clearTimeout(timer);
    }, [highlightRowId]);

    /* ---------------- UI ---------------- */

    return (
        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={6}>
            <Toaster />

            {/* -------- Form Section -------- */}
            <GridItem>
                <Box p={5} borderRadius="lg" bg={theme.colors.formColor} boxShadow="sm">
                    <Heading size="md" textAlign="center" mb={4}>
                        Pure Gold Master
                    </Heading>

                    <Box display="grid" gap={4}>
                        <Field.Root invalid={!!errors.pureGoldName}>
                            <Field.Label>Pure Gold Name</Field.Label>
                            <Input
                                value={form.pureGoldName}
                                onChange={(e) =>
                                    handleChange("pureGoldName", e.target.value)
                                }
                            />
                            <Field.ErrorText>{errors.pureGoldName}</Field.ErrorText>
                        </Field.Root>

                        <Field.Root invalid={!!errors.weight}>
                            <Field.Label>Weight</Field.Label>
                            <Input
                                value={form.weight}
                                onChange={(e) => handleChange("weight", e.target.value)}
                            />
                            <Field.ErrorText>{errors.weight}</Field.ErrorText>
                        </Field.Root>

                        <Field.Root invalid={!!errors.actualTouch}>
                            <Field.Label>Actual Touch</Field.Label>
                            <Input
                                value={form.actualTouch}
                                onChange={(e) =>
                                    handleChange("actualTouch", e.target.value)
                                }
                            />
                            <Field.ErrorText>{errors.actualTouch}</Field.ErrorText>
                        </Field.Root>

                        <Field.Root invalid={!!errors.actualPure}>
                            <Field.Label>Actual Pure</Field.Label>
                            <Input
                                value={form.actualPure}
                                onChange={(e) =>
                                    handleChange("actualPure", e.target.value)
                                }
                            />
                            <Field.ErrorText>{errors.actualPure}</Field.ErrorText>
                        </Field.Root>

                        <HStack pt={2} justifyContent="center">
                            <Button
                                colorPalette="blue"
                                onClick={handleSubmit}
                                size="sm"
                                loading={
                                    createMutation.isPending || updateMutation.isPending
                                }
                            >
                                <AiOutlineSave />  {editId ? "Update" : "Save"}
                            </Button>

                            <Button size="sm" colorPalette='blue' onClick={resetForm}>
                                Clear <IoIosExit />
                            </Button>
                        </HStack>
                    </Box>
                </Box>
            </GridItem>

            {/* -------- Table Section -------- */}
            <GridItem minW={0}>
                <Box p={5} borderRadius="lg" bg={theme.colors.formColor} boxShadow="sm">
                    <Heading size="md" mb={4}>
                        Pure Gold Master List
                    </Heading>

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
                                <Table.Cell>{row.weight}</Table.Cell>
                                <Table.Cell>{row.actualPure}</Table.Cell>
                                <Table.Cell textAlign="center">
                                    {row.actualTouch}
                                </Table.Cell>
                                <Table.Cell align="center">
                                    <FiEdit
                                        cursor="pointer"
                                        onClick={() => handleEdit(row)}
                                    />
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
