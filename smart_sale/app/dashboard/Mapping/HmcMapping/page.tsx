"use client";

import React, { useState, useMemo, useEffect } from "react";

import {
    Box,
    Grid,
    GridItem,
    Button,
    Heading,
    Text,
    Flex,
    Badge
} from "@chakra-ui/react";

import { FiEdit, FiFilter, FiRefreshCw } from "react-icons/fi";
import { FaPrint, FaFileExcel } from "react-icons/fa";
import { AdvancedSearch, AdvancedSearchHandle } from "@/component/search/AdvancedSearch";
import { Tooltip } from "@/components/ui/tooltip";
import type { FormField } from "@/types/form/form";
import { IoIosExit } from "react-icons/io";
import { AiOutlineSave } from "react-icons/ai";

import { useRouter } from "next/navigation";

import { useTheme } from "@/context/theme/themeContext";
import { usePrint } from "@/context/print/usePrintContext";

import { useAllAccountHead } from "@/hooks/apiHooks/accountHead/useAccountHead";
import { useStoneItems } from "@/hooks/apiHooks/item/useItems";

import { Toaster } from "@/components/ui/toaster";
import { toastLoaded } from "@/component/toast/toast";
import scrollToTop from "@/component/scroll/ScrollToTop";
import SearchBar from "@/component/search/SearchBar";
import { DataTable, createDataTableColumns } from "@/component/table/DataTable";
import { DynamicForm } from "@/component/form/DynamicForm";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { useGlobalKey } from "@/components/key/useGlobalKey";
import ShortcutDialog from "@/components/shortcut/ShortcutDialog";
import TransactionLoader from "@/component/loader/Transactionloader";

import { formatToFixed } from "@/utils/format/numberFormat";
import { useTransactionLoader } from "@/utils/loader/ResolveLoader";

import { AccountTypeList } from "@/data/ACCOUNTtYPE/AccountType";



import {
    useHmcCreate,
    useHmcData,
    useHmcDataById,
    useModifyHmcById,
} from "@/hooks/apiHooks/hmc/useHmc";

import { HmcMaster } from "@/types/hmc/hmc";

import { HmcMappingFormConfig } from "@/config/mapping/HmcMapping";
import { PrintColumn } from "@/component/screens/PrintPreviewScreen";

/* ---------------- INITIAL STATE ---------------- */

const initialFormState: HmcMaster = {
    acType: "",
    accode: "",
    itemId: "",
    hmcAmt: "",

};

/* ---------------- TABLE TYPE ---------------- */

export type HmcTableRow = {
    sno: number;
    acType: string;
    acName: string;
    itemName: string;
    hmcAmt: number;
};

const hmcHelper = createDataTableColumns<HmcTableRow>();

/* ---------------- COMPONENT ---------------- */

const HmcMappingForm = () => {
    const { isOpen, status, title: loaderTitle, description, openLoader, resolveLoader, closeLoader } = useTransactionLoader();

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

    const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
    const advancedSearchRef = React.useRef<AdvancedSearchHandle>(null);

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
        isLoading: hmcLoading,
        refetch,
    } = useHmcData(filter, advancedFilters);

    console.log(hmcData, 'hmcData')

    // const {
    //     data: hmcDataById,
    //     refetch: hmcRefetchById,
    // } = useHmcDataById(editId);

    const acType =
        form.acType?.trim().toUpperCase() || undefined;
        

    const { data: allAccounts } =
        useAllAccountHead('', { ACTYPE: acType });

    const { data: allAccountsForFilter } = useAllAccountHead();

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

    const allAccountsForFilterRaw = useMemo(() => {
        return Array.isArray(allAccountsForFilter?.data?.acheads) ? allAccountsForFilter.data.acheads : [];
    }, [allAccountsForFilter]);

    const getAccountsForPartyType = (partyType?: string) => {
        const accounts = partyType
            ? allAccountsForFilterRaw.filter((acc: any) => acc.ACTYPE === partyType)
            : allAccountsForFilterRaw;
        return accounts.map((acc: any) => ({
            label: acc.ACNAME,
            value: String(acc.ACCODE),
        }));
    };

    /* ---------------- ADVANCED SEARCH ---------------- */

    const nativeSelectCss = {
        backgroundColor: theme.colors.formColor,
        color: theme.colors.primary,
        border: `1.5px solid ${theme.colors.primary}`,
        borderRadius: "8px",
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        transition: "all 0.15s ease-in-out",
        _hover: { backgroundColor: theme.colors.accient },
        _focus: { outline: "none", boxShadow: `0 0 0 2px ${theme.colors.primary}` },
    };

    const advancedSearchFields: FormField[] = [
        { name: "ACTYPE", label: "Party Type", type: "select", items: [{ label: "ALL", value: "" }, ...AccountTypeList], size: "xs", css: nativeSelectCss },
        { name: "ACCODE", label: "Party Name", type: "combobox", items: (formData: Record<string, any>) => getAccountsForPartyType(formData.ACTYPE), placeholder: "Select Party", size: "xs" },
        { name: "ITEMID", label: "Item Name", type: "combobox", items: itemTypeList, placeholder: "Select Item", size: "xs" },
        { name: "HMCAMT", label: "HMC Amount", type: "number", placeholder: "Search by HMC amount", size: "xs" },
    ];

    const handleAdvancedSearch = (filters: Record<string, any>) => {
        const cleaned: Record<string, any> = {};
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== "" && value !== undefined && value !== null) {
                cleaned[key] = value;
            }
        });
        setAdvancedFilters(cleaned);
    };

    /* ---------------- FORM CONFIG ---------------- */

    const formConfig =
        HmcMappingFormConfig({
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

        setForm({
            acType: row.acType,
            accode: String(row.accode),
            itemId: String(row.itemId),
            hmcAmt: String(row.hmcAmt),
        })

        scrollToTop();

        toastLoaded("HMC Mapping");
        focusFirst();
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

        hmcAmt: Number(form.hmcAmt),
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

        if (!form.acType)
            errs.acType =
                "Customer Type is required";

        if (!form.accode)
            errs.accode =
                "Customer is required";

        if (!form.itemId)
            errs.itemId =
                "Item Name is required";

        if (!form.hmcAmt) {
            errs.hmcAmt =
                "HMC Amount is required";
        } else if (
            Number(form.hmcAmt) <= 0
        ) {
            errs.hmcAmt =
                "Amount must be greater than 0";
        }

        const isDuplicate = (
            Array.isArray(hmcData) ? hmcData : []
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
    console.log(payload, 'payload')

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
            openLoader('update', true);
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
                        setTimeout(() => {
                            resolveLoader("success", "update", "", true);
                        }, 500);
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
                        setTimeout(() => {
                            resolveLoader("error", "update", "", true);
                        }, 500);
                    },
                }
            );

        } else {
            openLoader('save', true);

            createMutation.mutate(payload, {
                onSuccess: (res: any) => {

                    const createdId =
                        res?.data?.id;

                    setHighlightRowId(
                        createdId
                    );
                    setTimeout(() => {
                        resolveLoader("success", "save", "", true);
                    }, 500);

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
                    setTimeout(() => {
                        resolveLoader("error", "save", "", true);
                    }, 500);
                },
            });
        }
    };

    /* ---------------- TABLE COLUMNS ---------------- */

    const hmcColumns = useMemo(() => {
        const cols = [
            hmcHelper.display({
                id: "sno",
                header: "S.No",
                cell: ({ row }) => row.index + 1,
            }),
            hmcHelper.accessor("acName", { header: "Customer Name" }),
            hmcHelper.accessor("acType", {
                header: "Customer Type",
                cell: ({ getValue }) =>
                    getValue() === "PR" ? "Purchaser" : "Customer",
            }),
            hmcHelper.accessor("itemName", { header: "Item Type" }),
            hmcHelper.accessor("hmcAmt", {
                header: "HMC Amount",
                meta: { align: "end" },
                cell: ({ getValue }) => formatToFixed(getValue(), 2),
            }),
            hmcHelper.display({
                id: "action",
                header: "Action",
                meta: { align: "center" },
                cell: ({ row }) => (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <FiEdit
                            cursor="pointer"
                            onClick={() => handleEdit(row.original)}
                        />
                    </Box>
                ),
            }),
        ];

        return cols;
    }, []);

    /* ---------------- EXPORT ---------------- */

    const handleExport = (
        option: string
    ) => {

        setData(Array.isArray(hmcData) ? hmcData : []);

        const columns: PrintColumn[] = [
            {
                key: "acName",
                label: "Customer Name",
            },

            {
                key: "acType",
                label: "Customer Type",
                renderCell: (value: any, row: any) => (
                    <Badge
                        colorScheme={
                            row.acType === "PR"
                                ? "green"
                                : "blue"
                        }
                    >
                        {row.acType === "PR" ? "Purchaser" : "Customer"}
                    </Badge>
                )
            },

            {
                key: "itemName",
                label: "Item Name",
            },

            {
                key: "hmcAmt",
                label: "HMC Amount",
                align: "end",
                renderCell: (value: any) => (
                    <Text fontWeight="bold">
                        {formatToFixed(
                            value,
                            2
                        )}
                    </Text>
                ),
                printValue: (value: any) => Number(value).toFixed(2)
            },
        ]
        setColumns(columns);

        setShowSno(true);

        title?.("HMC Mapping List");

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
        "Alt+e",
        () => router.back(),
        "exitHMC"
    );

    useGlobalKey(
        "alt+r",
        resetForm,
        "resetForm"
    );

    useGlobalKey(
        "F1",
        () => advancedSearchRef.current?.toggle(),
        "hmcMappingAdvancedSearch"
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
            color={theme.colors.primary}
        >
            <TransactionLoader
                isOpen={isOpen}
                status={status}
                title={loaderTitle}
                description={description}
                onClose={closeLoader}
            />
            <Toaster />
            <ShortcutDialog />
            <AdvancedSearch
                ref={advancedSearchRef}
                title="Advanced Filters"
                fields={advancedSearchFields}
                onSearch={handleAdvancedSearch}
                size="xs"
            />

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
                            Reset
                        </Button>
                        <Button
                            size="xs"
                            colorPalette={"blue"}
                            onClick={() => {
                                resetForm();
                                router.back();
                            }
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
                                <Tooltip content="Refresh">
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        color={theme.colors.primaryText}
                                        _hover={{ color: "black" }}
                                        onClick={() => refetch()}
                                        aria-label="Refresh"
                                        loading={hmcLoading}
                                    >
                                        <FiRefreshCw />
                                    </Button>
                                </Tooltip>
                            </Flex>

                            <Flex>
                                <Tooltip content="Advanced Filter">
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        color={theme.colors.primaryText}
                                        _hover={{ color: "black" }}
                                        onClick={() => advancedSearchRef.current?.open()}
                                        aria-label="Advanced Search"
                                        title="Advanced Search (F1)"
                                    >
                                        <FiFilter />
                                    </Button>
                                </Tooltip>
                            </Flex>

                            <Flex>

                                <Tooltip content="Export Excel">
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
                                </Tooltip>

                                <Tooltip content="Export PDF">
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
                                </Tooltip>

                            </Flex>

                        </Box>

                    </Heading>

                    <DataTable<HmcTableRow>
                        columns={hmcColumns}
                        data={hmcData as HmcTableRow[] || []}
                        emptyText="No data available"
                        bodyBg={theme.colors.bg}
                        headerBg={theme.colors.primary}
                        headerColor="white"
                        borderColor="white"
                        rowIdKey="sno"
                        editingRowId={editId ?? (highlightRowId != null ? String(highlightRowId) : null)}
                        onRowClick={(row) => handleEdit(row)}
                        pagination={{ enabled: true, pageSize: 10, color: theme.colors.whiteColor }}
                    />

                </Box>

            </GridItem>

        </Grid>
    );
};

export default HmcMappingForm;