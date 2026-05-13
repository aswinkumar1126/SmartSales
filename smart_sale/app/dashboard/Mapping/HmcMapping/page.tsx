"use client";

import React, { useState, useMemo, useEffect } from "react";

import {
    Box,
    Grid,
    GridItem,
    Button,
    Table,
    Heading,
    Text,
    Flex,
} from "@chakra-ui/react";

import { FiEdit } from "react-icons/fi";
import { FaPrint, FaFileExcel } from "react-icons/fa";
import { IoIosExit } from "react-icons/io";
import { AiOutlineSave } from "react-icons/ai";

import { useRouter } from "next/navigation";

import { useTheme } from "@/context/theme/themeContext";
import { usePrint } from "@/context/print/usePrintContext";

import { Toaster } from "@/components/ui/toaster";

import { toastLoaded } from "@/component/toast/toast";
import scrollToTop from "@/component/scroll/ScrollToTop";

import SearchBar from "@/component/search/SearchBar";
import { CustomTable } from "@/component/table/CustomTable";
import { DynamicForm } from "@/component/form/DynamicForm";

import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { useGlobalKey } from "@/components/key/useGlobalKey";

import { formatToFixed } from "@/utils/format/numberFormat";

import { AccountTypeList } from "@/data/ACCOUNTtYPE/AccountType";

import { useAllAccountHead } from "@/hooks/apiHooks/accountHead/useAccountHead";
import { useStoneItems } from "@/hooks/apiHooks/item/useItems";

import {
    useHmcCreate,
    useHmcData,
    useHmcDataById,
    useModifyHmcById,
} from "@/hooks/apiHooks/hmc/useHmc";

import { HmcMaster } from "@/types/hmc/hmc";

import { HmcMappingFormConfig } from "@/config/mapping/HmcMapping";

/* ---------------- INITIAL STATE ---------------- */

const initialFormState: HmcMaster = {
    customerType: "",
    customer: "",
    itemType: "",
    hmcAmount: "",
};

/* ---------------- TABLE TYPE ---------------- */

export type HmcTableRow = {
    sno: number;
    customerName: string;
    customerType: string;
    itemTypeName: string;
    hmcAmount: number;
};

/* ---------------- COMPONENT ---------------- */

const HmcMappingForm = () => {

    const [form, setForm] =
        useState<HmcMaster>(initialFormState);

    const [editId, setEditId] =
        useState<number | null>(null);

    const [highlightRowId, setHighlightRowId] =
        useState<number | null>(null);

    const [errors, setErrors] =
        useState<
            Partial<Record<keyof HmcMaster, string>>
        >({});

    const [filter, setFilter] =
        useState<string>("");

    const { theme } = useTheme();

    const router = useRouter();

    const {
        setData,
        setColumns,
        setShowSno,
        title,
    } = usePrint();

    /* ---------------- DATA ---------------- */

    const {
        data: hmcData = [],
        refetch,
    } = useHmcData(filter);

    const {
        data: hmcDataById,
        refetch: hmcRefetchById,
    } = useHmcDataById(editId);

    const customerType =
        form.customerType?.trim().toUpperCase() || undefined;

    const { data: allAccounts } =
        useAllAccountHead(customerType);

    const { data: items } = useStoneItems();

    const createMutation = useHmcCreate();

    const updateMutation =
        useModifyHmcById();

    /* ---------------- MEMO LISTS ---------------- */

    const customerList = useMemo(() => {
        const accounts = Array.isArray(
            allAccounts?.data?.acheads
        )
            ? allAccounts.data.acheads
            : [];

        return accounts.map((acc: any) => ({
            label: acc.ACNAME,
            value: String(acc.ACCODE),
        }));
    }, [allAccounts]);

    const itemTypeList = useMemo(() => {
        return (items ?? []).map((item: any) => ({
            label: item.itemName,
            value: String(item.itemId),
        }));
    }, [items]);

    /* ---------------- FORM CONFIG ---------------- */

    const formConfig =
        HmcMappingFormConfig({
            collection: {
                customerType: AccountTypeList,
                customer: customerList,
                itemType: itemTypeList,
            },

            disabled: {
                isCustomerDisabled:
                    !form.customerType,
            },
        });

    /* ---------------- FORM CHANGE ---------------- */

    const handleChange = (
        key: keyof HmcMaster,
        value: string
    ) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    /* ---------------- EDIT ---------------- */

    const handleEdit = (row: any) => {
        setEditId(row.sno);

        scrollToTop();

        toastLoaded("HMC Mapping");
    };

    /* ---------------- RESET ---------------- */

    const resetForm = () => {
        setForm(initialFormState);

        setEditId(null);

        setErrors({});

        setTimeout(() => focusFirst(), 50);
    };

    /* ---------------- EDIT DATA ---------------- */

    useEffect(() => {

        if (!hmcDataById || editId === null)
            return;

        setForm({
            customerType:
                hmcDataById.customerType ?? "",

            customer:
                hmcDataById.customer ?? "",

            itemType:
                hmcDataById.itemType ?? "",

            hmcAmount: String(
                hmcDataById.hmcAmount ?? ""
            ),
        });

    }, [hmcDataById, editId]);

    useEffect(() => {
        if (editId !== null) {
            hmcRefetchById();
        }
    }, [editId, hmcRefetchById]);

    /* ---------------- PAYLOAD ---------------- */

    const payload = {
        customerType: form.customerType,

        customer: form.customer,

        itemType: Number(form.itemType),

        hmcAmount: Number(form.hmcAmount),
    };

    /* ---------------- VALIDATION ---------------- */

    const validateForm = (
        form: HmcMaster
    ) => {

        const errs:
            Partial<Record<
                keyof HmcMaster,
                string
            >> = {};

        if (!form.customerType)
            errs.customerType =
                "Customer Type is required";

        if (!form.customer)
            errs.customer =
                "Customer is required";

        if (!form.itemType)
            errs.itemType =
                "Item Type is required";

        if (!form.hmcAmount) {
            errs.hmcAmount =
                "HMC Amount is required";
        } else if (
            Number(form.hmcAmount) <= 0
        ) {
            errs.hmcAmount =
                "Amount must be greater than 0";
        }

        const isDuplicate = hmcData?.some(
            (item: any) =>
                form.customerType?.toLowerCase() ===
                    item.customerType?.toLowerCase() &&
                Number(form.customer) ===
                    Number(item.customer) &&
                Number(form.itemType) ===
                    Number(item.itemType) &&
                Number(item.sno) !==
                    Number(editId)
        );

        if (isDuplicate) {
            errs.itemType =
                "Duplicate entry already exists";
        }

        return errs;
    };

    /* ---------------- SUBMIT ---------------- */

    const handleSubmit = () => {

        const validationErrors =
            validateForm(form);

        if (
            Object.keys(validationErrors)
                .length > 0
        ) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});

        if (editId) {

            updateMutation.mutate(
                {
                    id: editId,
                    formData: payload,
                },
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

                    const createdId =
                        res?.data?.id;

                    setHighlightRowId(
                        createdId
                    );

                    resetForm();

                    refetch();
                },
            });
        }
    };

    /* ---------------- TABLE COLUMNS ---------------- */

    const columns = [
        { key: "sno", label: "S.No" },

        {
            key: "customerName",
            label: "Customer Name",
        },

        {
            key: "customerType",
            label: "Customer Type",
        },

        {
            key: "itemTypeName",
            label: "Item Type",
        },

        {
            key: "hmcAmount",
            label: "HMC Amount",
            align: "center" as const,
        },

        {
            key: "action",
            label: "Action",
            align: "center" as const,
        },
    ];

    /* ---------------- EXPORT ---------------- */

    const handleExport = (
        option: string
    ) => {

        setData(hmcData);

        setColumns([
            {
                key: "customerName",
                label: "Customer Name",
            },

            {
                key: "customerType",
                label: "Customer Type",
            },

            {
                key: "itemTypeName",
                label: "Item Type",
            },

            {
                key: "hmcAmount",
                label: "HMC Amount",
            },
        ]);

        setShowSno(true);

        title?.("HMC Mapping List");

        router.push(
            `/print?export=${option}`
        );
    };

    /* ---------------- SHORTCUTS ---------------- */

    useGlobalKey(
        "Alt+s",
        () => handleSubmit(),
        "saveTransaction"
    );

    useGlobalKey(
        "Alt+c",
        () => resetForm(),
        "ClearTransaction"
    );

    /* ---------------- HIGHLIGHT ---------------- */

    useEffect(() => {

        if (!highlightRowId) return;

        const timer = setTimeout(() => {
            setHighlightRowId(null);
        }, 2500);

        return () => clearTimeout(timer);

    }, [highlightRowId]);

    /* ---------------- ENTER NAVIGATION ---------------- */

    const formFieldName =
        formConfig.map(
            (field) => field.name
        );

    const {
        focusFirst,
        focusNext,
        register,
    } = useEnterNavigation(
        formFieldName,
        () => handleSubmit()
    );

    useEffect(() => {
        focusFirst();
    }, [focusFirst]);

    /* ---------------- UI ---------------- */

    return (
        <Grid
            templateColumns={{
                base: "1fr",
                lg: "1fr 2fr",
            }}
            gap={2}
        >
            <Toaster />

            {/* FORM */}

            <GridItem
                bg={theme.colors.formColor}
                p={2}
                rounded={"xl"}
            >

                <DynamicForm
                    formData={form}
                    onChange={handleChange}
                    register={register}
                    focusNext={focusNext}
                    fields={formConfig}
                    layout="vertical"
                    errors={errors}
                />

                <Box mt={2}>

                    <Flex
                        justify={"center"}
                        gap={2}
                    >

                        <Button
                            size="xs"
                            colorPalette={"blue"}
                            onClick={() =>
                                handleSubmit()
                            }
                        >
                            <AiOutlineSave />

                            {editId
                                ? "Update"
                                : "Save"}
                        </Button>

                        <Button
                            size="xs"
                            colorPalette={"blue"}
                            onClick={() =>
                                resetForm()
                            }
                        >
                            <IoIosExit />
                            Exit
                        </Button>

                    </Flex>

                </Box>

            </GridItem>

            {/* TABLE */}

            <GridItem minW={0}>

                <Box
                    p={5}
                    borderRadius="lg"
                    bg={theme.colors.formColor}
                    boxShadow="sm"
                >

                    <Heading
                        display="flex"
                        mb={2}
                        gap={3}
                        justifyContent="space-between"
                        alignItems="center"
                    >

                        <Text fontSize="small">
                            HMC MAPPING LIST
                        </Text>

                        <Box
                            display="flex"
                            gap={1}
                        >

                            <SearchBar
                                searchTerm={filter}
                                onChange={setFilter}
                                placeholder="Search HMC Mapping"
                                size="2xs"
                            />

                            <Flex>

                                <Button
                                    variant="ghost"
                                    size="xs"
                                    color={
                                        theme.colors.green
                                    }
                                    _hover={{
                                        color:
                                            "black",
                                    }}
                                    onClick={() =>
                                        handleExport(
                                            "excel"
                                        )
                                    }
                                >
                                    <FaFileExcel />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="xs"
                                    color={
                                        theme.colors
                                            .primaryText
                                    }
                                    _hover={{
                                        color:
                                            "black",
                                    }}
                                    onClick={() =>
                                        handleExport(
                                            "pdf"
                                        )
                                    }
                                >
                                    <FaPrint />
                                </Button>

                            </Flex>

                        </Box>

                    </Heading>

                    <CustomTable<HmcTableRow>
                        columns={columns}
                        data={
                            hmcData as HmcTableRow[]
                        }
                        renderRow={(
                            row: any,
                            i: number
                        ) => (
                            <>
                                <Table.Cell>
                                    {i + 1}
                                </Table.Cell>

                                <Table.Cell>
                                    {
                                        row.customerName
                                    }
                                </Table.Cell>

                                <Table.Cell>
                                    {
                                        AccountTypeList.find(
                                            (
                                                item
                                            ) =>
                                                item.value ===
                                                row.customerType
                                        )?.label ||
                                        row.customerType
                                    }
                                </Table.Cell>

                                <Table.Cell>
                                    {
                                        row.itemTypeName
                                    }
                                </Table.Cell>

                                <Table.Cell textAlign="right">
                                    {formatToFixed(
                                        row.hmcAmount,
                                        2
                                    )}
                                </Table.Cell>

                                <Table.Cell align="center">

                                    <Box
                                        display="flex"
                                        justifyContent="center"
                                        alignItems="center"
                                    >

                                        <FiEdit
                                            cursor="pointer"
                                            onClick={() =>
                                                handleEdit(
                                                    row
                                                )
                                            }
                                        />

                                    </Box>

                                </Table.Cell>
                            </>
                        )}
                        emptyText="No data available"
                        bodyBg={
                            theme.colors.primary
                        }
                        size="sm"
                        headerBg="blue.800"
                        headerColor="white"
                        rowIdKey="sno"
                        highlightRowId={
                            highlightRowId
                        }
                    />

                </Box>

            </GridItem>

        </Grid>
    );
};

export default HmcMappingForm;