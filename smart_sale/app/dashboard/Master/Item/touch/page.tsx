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
    Flex,
} from "@chakra-ui/react";

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
import { FaFileExcel } from "react-icons/fa";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { AccountTypeList } from "@/data/ACCOUNTtYPE/AccountType";
import { SelectCombobox } from "@/components/ui/selectComboBox";
import { useAllAccountHead } from "@/hooks/accountHead/useAccountHead";
import { CalTypeCollection } from "@/data/CalType/CalType";
import { useTouchMasterDataById } from "@/hooks/touch/useTouchMastById";
import { AiOutlineSave } from "react-icons/ai";
import { usePrint } from "@/context/print/usePrintContext";
import SearchBar from "@/component/search/SearchBar";

/* ---------------- Initial State ---------------- */

const initialFormState: TouchMaster = {
    actype: "",
    accode: "",
    itemId: "",
    touch: "",
    calmode: "",
};

export type TouchTableRow = {
    sno: number;
    acname: string;
    actype: string;
    itemName: string;
    touch: number;
};

/* ---------------- Component ---------------- */

const TouchMasterForm = () => {

    const [form, setForm] = useState<TouchMaster>(initialFormState);
    const [editId, setEditId] = useState<number | null>(null);
    const [highlightRowId, setHighlightRowId] = useState<number | null>(null);
    const [errors, setErrors] = useState<Partial<Record<keyof TouchMaster, string>>>({});
    const [filter,setFilter] = useState<string>('');

    const { theme } = useTheme();
    const router = useRouter();
    const { setData, setColumns, setShowSno, title } = usePrint();

    /* ---------------- Hooks ---------------- */
    
    const { data: touchData = [], refetch } = useTouchMastData(filter);
    const { data: touchDatabyId, refetch: touchDataRefetch } = useTouchMasterDataById(editId);

    const accountType = form.actype?.trim().toUpperCase() || undefined;

    const { data: allAccounts, refetch: accountRefetch } = useAllAccountHead(accountType);
    const { data: items } = useItems();

    const createMutation = useTouchMastCreate();
    const updateMutation = useModifyTouchMasterById();

    /* ---------------- Memoized Lists ---------------- */

    const allAccountsList = useMemo(() => {
        const accounts = Array.isArray(allAccounts?.data?.acheads) ? allAccounts.data.acheads : [];
        return accounts.map((acc: any) => ({
            label: acc.ACNAME,
            value: String(acc.ACCODE),
        }));
    }, [allAccounts]);

    const allItemsList = useMemo(() => {
        return (items?.items ?? []).map((item: any) => ({
            label: item.itemName,
            value: String(item.itemId),
        }));
    }, [items]);

    /* ---------------- Form Handlers ---------------- */

    const handleChange = (key: keyof TouchMaster, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleEdit = (row: any) => {
        setEditId(row.sno);
        scrollToTop();
        toastLoaded("Touch Master");
    };

    const resetForm = () => {
        setForm(initialFormState);
        setEditId(null);
        setErrors({});
    };

    /* ---------------- Sync Edit Data ---------------- */

    useEffect(() => {
        if (!touchDatabyId || editId === null) return;

        setForm((prev) => {
            const next = {
                accode: touchDatabyId.accode ?? "",
                actype: touchDatabyId.actype ?? "",
                itemId: touchDatabyId.itemId ?? "",
                touch: String(touchDatabyId.touch ?? ""),
                calmode: touchDatabyId.calmode ?? "",
            };

            // Prevent unnecessary update → helps avoid loops
            if (
                prev.accode === next.accode &&
                prev.actype === next.actype &&
                prev.itemId === next.itemId &&
                prev.touch === next.touch &&
                prev.calmode === next.calmode
            ) {
                return prev;
            }

            return next;
        });
    }, [touchDatabyId, editId]);

    useEffect(() => {
        if (editId !== null) {
            touchDataRefetch();
        }
    }, [editId, touchDataRefetch]);

    /* ---------------- Validation & Submit ---------------- */

    const payload = {
        actype: form.actype,
        accode: form.accode,
        itemId: Number(form.itemId),
        touch: Number(form.touch),
        calmode: form.calmode,
    };

    const validateForm = (form: TouchMaster): Partial<Record<keyof TouchMaster, string>> => {
        const errs: Partial<Record<keyof TouchMaster, string>> = {};

        if (!form.actype) errs.actype = "Company type is required";
        if (!form.accode) errs.accode = "Company is required";
        if (!form.itemId) errs.itemId = "Item is required";
        if (!form.calmode) errs.calmode = "Calculation Mode is required";

        if (!form.touch) {
            errs.touch = "Touch is required";
        } else if (Number(form.touch) <= 0) {
            errs.touch = "Touch must be greater than 0";
        }

        const isDuplicate = touchData?.some(
            (item: any) =>
                form.actype?.toLowerCase() === item.actype?.toLowerCase() &&
                Number(form.accode) === Number(item.accode) &&
                Number(form.itemId) === Number(item.itemId) &&
                Number(item.sno) !== Number(editId)
        );

        if (isDuplicate) {
            errs.itemId = "Duplicate entry already exists";
        }

        return errs;
    };

    const handleSubmit = () => {
        const validationErrors = validateForm(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});

        if (editId) {
            updateMutation.mutate(
                { id: editId, formData: payload },
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
                    const createdId = res?.data?.id;
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
        { key: "acname", label: "Company Name" },
        { key: "actype", label: "Company Type" },
        { key: "itemName", label: "Item Name" },
        { key: "touch", label: "Touch", align: "center" as const },
        { key: "action", label: "Action", align: "center" as const },
    ];

    const handleExport = (option: string) => {
        setData(touchData);
        setColumns([
            { key: "acname", label: "Company Name" },
            { key: "actype", label: "Company Type" },
            { key: "itemName", label: "Item Name" },
            { key: "touch", label: "Touch", align: "center" as const },
            { key: "active", label: "Active" },
        ]);
        setShowSno(true)
        title?.("Touch Master List")
        router.push(`/print?export=${option}`);
    }


    /* ------------ Highlight Timeout ---------------- */

    useEffect(() => {
        if (!highlightRowId) return;
        const timer = setTimeout(() => setHighlightRowId(null), 2500);
        return () => clearTimeout(timer);
    }, [highlightRowId]);

    /* ---------------- UI ---------------- */

    return (
        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={2}>
            <Toaster />

            {/* FORM */}
            <GridItem>
                <Box
                    p={2}
                    minW="full"
                    fontWeight="semibold"
                    borderRadius="lg"
                    bg={theme.colors.formColor}
                    boxShadow="sm"
                >
                    <Heading fontSize="small" textAlign="center" fontWeight='semibold'>
                        TOUCH MASTER
                    </Heading>

                    <Box>
                        <Grid
                            css={{
                                gridTemplateColumns: "repeat(1, 1fr)"
                            }}
                            gap={2}
                        >
                            {/* Company Type */}
                            <Box>
                                <Field.Root invalid={!!errors.actype}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">
                                            COMPANY TYPE :
                                        </Box>
                                        <SelectCombobox
                                            value={form.actype}
                                            onChange={(val) => handleChange("actype", val)}
                                            editId={editId ?? undefined}
                                            items={AccountTypeList}
                                            rounded="full"
                                            placeholder="select company type"

                                        />
                                    </Box>
                                    <Field.ErrorText>{errors.actype}</Field.ErrorText>
                                </Field.Root>
                            </Box>

                            {/* Company */}
                            <Box>
                                <Field.Root invalid={!!errors.accode}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">
                                            COMPANY NAME :
                                        </Box>
                                        <SelectCombobox
                                            value={form.accode ? String(form.accode) : ""}
                                            onChange={(val) => handleChange("accode", val)}
                                            items={allAccountsList}
                                            editId={editId ?? undefined}
                                            rounded="full"
                                            disable={!form.actype}
                                            placeholder={!form.actype ? "Select Company Type First" : `select ${form.actype}`}
                                        />
                                    </Box>
                                    <Field.ErrorText>{errors.accode}</Field.ErrorText>
                                </Field.Root>
                            </Box>

                            {/* Item */}
                            <Box>
                                <Field.Root invalid={!!errors.itemId}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">
                                            ITEM :
                                        </Box>
                                        <SelectCombobox
                                            value={form.itemId ? String(form.itemId) : ""}
                                            onChange={(val) => handleChange("itemId", val)}
                                            editId={editId ?? undefined}
                                            items={allItemsList}
                                            rounded="full"
                                            placeholder="select item"
                                        />
                                    </Box>
                                    <Field.ErrorText>{errors.itemId}</Field.ErrorText>
                                </Field.Root>
                            </Box>

                            {/* Touch */}
                            <Box>
                                <Field.Root invalid={!!errors.touch}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">
                                            TOUCH :
                                        </Box>
                                        <CapitalizedInput
                                            field="touch"
                                            type="number"
                                            value={form.touch}
                                            onChange={handleChange}
                                            size="2xs"
                                            max={999}
                                            decimalScale={2}
                                            maxWidth="120px"
                                            rounded="full"
                                        />
                                    </Box>
                                    <Field.ErrorText>{errors.touch}</Field.ErrorText>
                                </Field.Root>
                            </Box>

                            {/* Cal Mode */}
                            <Box>
                                <Field.Root invalid={!!errors.calmode}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">
                                            CAL MODE :
                                        </Box>
                                        <SelectCombobox
                                            value={form.calmode}
                                            onChange={(val) => handleChange("calmode", val)}
                                            editId={editId ?? undefined}
                                            items={CalTypeCollection}
                                            rounded="full"
                                            placeholder="select cal mode"
                                        
                                        />
                                    </Box>
                                    <Field.ErrorText>{errors.calmode}</Field.ErrorText>
                                </Field.Root>
                            </Box>
                        </Grid>

                        {/* Buttons */}
                        <HStack pt={4} justifyContent="center">
                            <Button
                                colorPalette="blue"
                                onClick={handleSubmit}
                                loading={createMutation.isPending || updateMutation.isPending}
                                size="xs"
                            >
                                <AiOutlineSave /> {editId ? "Update" : "Save"}
                            </Button>

                            <Button size="xs" colorPalette="blue" onClick={resetForm}>
                                Clear <IoIosExit />
                            </Button>
                        </HStack>
                    </Box>
                </Box>
            </GridItem>

            {/* TABLE */}
            <GridItem minW={0}>
                <Box p={5} borderRadius="lg" bg={theme.colors.formColor} boxShadow="sm">
                    <Heading
                        display="flex"
                       
                        mb={2}
                        gap={3}
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Text fontSize='small'>TOUCH MASTER LIST</Text>

                        <Box display='flex' gap={1}>


                            <Box >
                                <SearchBar
                                    searchTerm={filter}
                                    onChange={setFilter}
                                    placeholder="Search account masters"
                                    size="2xs"

                                />
                            </Box>
                            <Flex>
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
                        </Box>
                    </Heading>

                    <CustomTable<TouchTableRow>
                        columns={columns}
                        data={touchData as TouchTableRow[]}
                        renderRow={(row: any, i: number) => (
                            <>
                                <Table.Cell>{i + 1}</Table.Cell>
                                <Table.Cell>{row.acname}</Table.Cell>
                                <Table.Cell>
                                    {AccountTypeList.find((item) => item.value === row.actype)?.label || row.actype}
                                </Table.Cell>
                                <Table.Cell>{row.itemName}</Table.Cell>
                                <Table.Cell textAlign="right">{formatToFixed(row.touch, 2)}</Table.Cell>
                                <Table.Cell align="center">
                                    <Box display="flex" justifyContent="center" alignItems="center">
                                        <FiEdit cursor="pointer" onClick={() => handleEdit(row)} />
                                    </Box>
                                </Table.Cell>
                            </>
                        )}
                        emptyText="No data available"
                        bodyBg={theme.colors.primary}
                        size="sm"
                        headerBg="blue.800"
                        headerColor="white"
                        rowIdKey="sno"
                        highlightRowId={highlightRowId}
                    />
                </Box>
            </GridItem>
        </Grid>
    );
};

export default TouchMasterForm;