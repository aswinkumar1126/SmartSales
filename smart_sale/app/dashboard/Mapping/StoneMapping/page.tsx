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
    useStoneMappingCreate,
    useStoneMappingData,
    useStoneMappingDataById,
    useModifyStoneMappingById,
    useStoneMappingByFilter,
} from "@/hooks/apiHooks/stoneMapping/useStoneMapping";

import { StoneMappingMaster } from "@/types/stoneMapping/StoneMappingTypes";

import { StoneMappingFormConfig } from "@/config/mapping/StoneMapping";

/* ---------------- INITIAL STATE ---------------- */

const initialFormState: StoneMappingMaster = {
    acType: "",
    accode: "",
    itemId: "",
    stnAmt: "",
  
};

/* ---------------- TABLE TYPE ---------------- */

export type HmcTableRow = {
    sno: number;
    acType: string;
    acName: string;
    itemName: string;
    hmcAmt: number;
};

/* ---------------- COMPONENT ---------------- */

const HmcMappingForm = () => {

    const [form, setForm] =
        useState<StoneMappingMaster>(initialFormState);

    const [editId, setEditId] =
        useState<number | null>(null);

    const [highlightRowId, setHighlightRowId] =
        useState<number | null>(null);

    const [errors, setErrors] =
        useState<
            Partial<Record<keyof StoneMappingMaster, string>>
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
        data: stoneMappingData = [],
        refetch,
    } = useStoneMappingData(filter);

    console.log(stoneMappingData,'stoneMappingData')

    // const {
    //     data: hmcDataById,
    //     refetch: hmcRefetchById,
    // } = useHmcDataById(editId);

    const acType =
        form.acType?.trim().toUpperCase() || undefined;

    const { data: allAccounts } =
        useAllAccountHead(acType);

    const { data: items } = useStoneItems({ STUDDED :"Y"});

    const createMutation = useStoneMappingCreate();

    const updateMutation = useModifyStoneMappingById();

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
        StoneMappingFormConfig({
            collection: {
                customerType: AccountTypeList,
                customer: customerList,
                itemType: itemTypeList,
            },

            disabled: {
                isCustomerDisabled: !form.acType,
            },
        });

    /* ---------------- FORM CHANGE ---------------- */

    const handleChange = (
        key: keyof StoneMappingMaster,
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

        setForm({
            acType: row.acType,
            accode: String(row.accode),
            itemId: String(row.itemId),
            stnAmt: String(row.stnAmt),
        })

        scrollToTop();

        toastLoaded("Stone Mapping");
    };

    /* ---------------- RESET ---------------- */

    const resetForm = () => {
      
        setForm(initialFormState);

        setEditId(null);

        setErrors({});

        setTimeout(() => focusFirst(), 50);
    };



    /* ---------------- PAYLOAD ---------------- */

    const payload = {
        acType: form.acType,

        accode: Number(form.accode),

        itemId: Number(form.itemId),

        stnAmt: Number(form.stnAmt),
    };

    /* ---------------- VALIDATION ---------------- */

    const validateForm = (
        form: StoneMappingMaster
    ) => {

        const errs:
            Partial<Record<
                keyof StoneMappingMaster,
                string
            >> = {};

        if (!form.acType)
            errs.acType =
                "Customer Type is required";

        if (!form.accode)
            errs.accode =
                "Customer is required";

        if (!form.itemId)
            errs.itemId =
                "Item Name is required";

        if (!form.stnAmt) {
            errs.stnAmt =
                "Stone Amount is required";
        } else if (
            Number(form.stnAmt) <= 0
        ) {
            errs.stnAmt =
                "Amount must be greater than 0";
        }

        const isDuplicate = (
            Array.isArray(stoneMappingData) ? stoneMappingData : []
        ).some((item: any) =>
            // form.acType?.toLowerCase() ===
            //     item.acType?.toLowerCase() &&
            Number(form.accode) ===
                Number(item.accode) &&
            Number(form.itemId) ===
                Number(item.itemId) &&
            Number(item.sno) !==
                Number(editId)
        );

        if (isDuplicate) {
            errs.itemId =
                "Duplicate entry already exists";
        }

        return errs;
    };
    console.log(payload,'payload')

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
        console.log(payload,'payload');
      

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
                    onError: (error: any) => {
                        console.log(
                            "create error",
                            error
                        );
                        toastLoaded(
                            error?.response?.data?.message ||
                            "Failed to create stoneMappingData."
                        );
                        resetForm();
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
                onError: (error: any) => {
                    console.log(
                        "create error",
                        error
                    );
                    toastLoaded(
                        error?.response?.data?.message ||
                            "Failed to create HMC."
                    );
                    resetForm();
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
            key: "acType",
            label: "Customer Type",
        },

        {
            key: "itemTypeName",
            label: "Item Type",
        },

        {
            key: "stnAmount",
            label: "STN Amount",
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

        setData(Array.isArray(stoneMappingData) ? stoneMappingData : []);

        setColumns([
            {
                key: "acName",
                label: "Customer Name",
            },

            {
                key: "acType",
                label: "Customer Type",
            },

            {
                key: "itemName",
                label: "Item Name",
            },

            {
                key: "stnAmt",
                label: "STN Amount",
            },
        ]);

        setShowSno(true);

        title?.("STONE Mapping List");

        router.push(
            `/print?export=${option}`
        );
    };

    /* ---------------- SHORTCUTS ---------------- */

    useGlobalKey(
        "Alt+s",
        handleSubmit,
        "saveTransaction"
    );

    useGlobalKey(
        "Alt+c",
        resetForm,
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
        handleSubmit
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
                            onClick={handleSubmit}
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
                            STONE MAPPING LIST
                        </Text>

                        <Box
                            display="flex"
                            gap={1}
                        >

                            <SearchBar
                                searchTerm={filter}
                                onChange={setFilter}
                                placeholder="Search STONE Mapping"
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
                            stoneMappingData as HmcTableRow[] || []
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
                                        row.acName
                                    }
                                </Table.Cell>

                                <Table.Cell>
                                    {row.acType === "PR" ? "Purchaser" : "Customer"}
                                </Table.Cell>

                                <Table.Cell>
                                    {
                                        row.itemName
                                    }
                                </Table.Cell>

                                <Table.Cell textAlign="right">
                                    {formatToFixed(
                                        row.stnAmt,
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