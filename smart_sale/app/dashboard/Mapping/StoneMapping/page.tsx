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

import { Toaster } from "@/components/ui/toaster";
import { toastLoaded } from "@/component/toast/toast";
import scrollToTop from "@/component/scroll/ScrollToTop";
import SearchBar from "@/component/search/SearchBar";
import { DataTable, createDataTableColumns } from "@/component/table/DataTable";
import { DynamicForm } from "@/component/form/DynamicForm";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { useGlobalKey } from "@/components/key/useGlobalKey";
import TransactionLoader from "@/component/loader/Transactionloader";
import ShortcutDialog from "@/components/shortcut/ShortcutDialog";



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

import { useTransactionLoader } from "@/utils/loader/ResolveLoader";
import { formatToFixed } from "@/utils/format/numberFormat";
import { PrintColumn } from "@/component/screens/PrintPreviewScreen";

/* ---------------- INITIAL STATE ---------------- */

const initialFormState: StoneMappingMaster = {
    acType: "",
    accode: "",
    itemId: "",
    stnAmt: "",

};

/* ---------------- TABLE TYPE ---------------- */

export type StoneMappingTableRow = {
    sno: number;
    acType: string;
    acName: string;
    itemName: string;
    stnAmt: number;
};

const stoneMappingHelper = createDataTableColumns<StoneMappingTableRow>();

/* ---------------- COMPONENT ---------------- */

const HmcMappingForm = () => {
    const { isOpen, status, title: loaderTitle, description, openLoader, resolveLoader, closeLoader } = useTransactionLoader();

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
        data: stoneMappingData = [],
        refetch,
        isLoading: stoneMappingLoading,
    } = useStoneMappingData(filter, advancedFilters);

    console.log(stoneMappingData, 'stoneMappingData')

    // const {
    //     data: hmcDataById,
    //     refetch: hmcRefetchById,
    // } = useHmcDataById(editId);

    // const acType =
    //     form.acType?.trim().toUpperCase() || undefined;

    const { data: allCustomer } = useAllAccountHead( '',{ACTYPE :"CR"});
    const { data: allPurchaser } = useAllAccountHead('', { ACTYPE: "PR" });
    const { data: items } = useStoneItems({ STUDDED: "Y" });

    const createMutation = useStoneMappingCreate();

    const updateMutation = useModifyStoneMappingById();

    /* ---------------- MEMO LISTS ---------------- */

    const customerList = useMemo(() => {
        const accounts = Array.isArray(
            allCustomer?.data?.acheads
        )
            ? allCustomer.data.acheads
            : [];


        return accounts.map((acc: any) => ({
            label: acc.ACNAME,
            value: String(acc.ACCODE),
        }));
    }, [allCustomer]);

    const purchaserList = useMemo(() => {
        const accounts = Array.isArray(
            allPurchaser?.data?.acheads
        )
            ? allPurchaser.data.acheads
            : [];


        return accounts.map((acc: any) => ({
            label: acc.ACNAME,
            value: String(acc.ACCODE),
        }));
    }, [allPurchaser]);

    const itemTypeList = useMemo(() => {
        return (items ?? []).map((item: any) => ({
            label: item.itemName,
            value: String(item.itemId),
        }));
    }, [items]);

    const accountCollection = form.acType === "PR" ? purchaserList : customerList

    const getAccountsForPartyType = (partyType?: string) => {
        if (partyType === "CR") return customerList;
        if (partyType === "PR") return purchaserList;
        return [...customerList, ...purchaserList];
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
        { name: "STNAMT", label: "Stn Amount", type: "number", placeholder: "Search by stn amount", size: "xs" },
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
        StoneMappingFormConfig({
            collection: {
                customerType: AccountTypeList,
                customer: accountCollection,
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
        // acType: form.acType,

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

        // if (!form.acType)
        //     errs.acType =
        //         "Customer Type is required";

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
        console.log(payload, 'payload');


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
                            error?.response
                        );
                        // toastLoaded(
                        //     error?.response?.data?.message ||
                        //     "Failed to create stoneMappingData."
                        // );
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

                    resetForm();

                    refetch();
                    setTimeout(() => {
                        resolveLoader("success", "save", "", true);
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
                        resolveLoader("error", "save", "", true);
                    }, 500);
                },
            });
        }
    };

    /* ---------------- TABLE COLUMNS ---------------- */

    const columns = useMemo(() => {
        return [
            stoneMappingHelper.display({
                id: "sno",
                header: "S.No",
                cell: ({ row }) => row.index + 1,
            }),
            stoneMappingHelper.accessor("acName", {
                header: "Customer Name",
            }),
            stoneMappingHelper.accessor("acType", {
                header: "Account Type",
                cell: ({ getValue }) =>
                    getValue() === "PR" ? "Purchaser" : "Customer",
            }),
            stoneMappingHelper.accessor("itemName", {
                header: "Item Type",
            }),
            stoneMappingHelper.accessor("stnAmt", {
                header: "STN Amount",
                meta: { align: "end" },
                cell: ({ getValue }) => formatToFixed(getValue(), 2),
            }),

            // {
            //     key: "action",
            //     label: "Action",
            //     align: "center" as const,
            // },
        ];
    }, []);

    /* ---------------- EXPORT ---------------- */

    const handleExport = (
        option: string
    ) => {

        setData(Array.isArray(stoneMappingData) ? stoneMappingData : []);
        const columns: PrintColumn[] = [
            {
                key: "acName",
                label: "Account Name",
            },


            {
                key: "acType",
                label: "Account Type",
                renderCell: (value) => (

                    <Box
                        as="span"
                        display="inline-block"
                        px={3}
                        py={0.5}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight={600}
                        minW="90px"
                        textAlign="center"
                        bg={value === "PR" ? "orange.100" : "green.100"}
                        color={value === "PR" ? "orange.700" : "green.700"}
                    >
                        {value === "PR" ? "PURCHASER" : "CUSTOMER"}
                    </Box>
                ),
                // exportValue → clean text for Print / Excel
                printValue: (value) => (value === "PR" ? "PURCHASER" : "CUSTOMER")
            },


            {
                key: "itemName",
                label: "Item Name",
            },

            {
                key: "stnAmt",
                label: "STN Amount",
                align: "end" as const,
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
        "Alt+u",
        handleSubmit,
        "saveTransaction"
    );

    useGlobalKey(
        "Alt+r",
        resetForm,
        "ClearTransaction"
    );

    useGlobalKey("Alt+e",
        () => router.back(),
        "exitStone");

    useGlobalKey(
        "F1",
        () => advancedSearchRef.current?.toggle(),
        "stoneMappingAdvancedSearch"
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
            <Toaster />
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
                            onClick={() =>
                                router.back()
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
                                <Tooltip content="Refresh">
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        color={theme.colors.primaryText}
                                        _hover={{ color: "black" }}
                                        onClick={() => refetch()}
                                        aria-label="Refresh"
                                        loading={stoneMappingLoading}
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

                    <DataTable<StoneMappingTableRow>
                        columns={columns}
                        data={
                            (stoneMappingData as StoneMappingTableRow[]) || []
                        }
                        emptyText="No data available"
                        bodyBg={
                            theme.colors.bg
                        }
                        size="sm"
                        headerBg={theme.colors.primary}
                        headerColor="white"
                        rowIdKey="sno"
                        editingRowId={
                            highlightRowId
                        }
                        onRowClick={(row) => handleEdit(row)}
                        pagination={{ enabled: true, pageSize: 10, color: theme.colors.whiteColor }}
                    />

                </Box>

            </GridItem>

        </Grid>
    );
};

export default HmcMappingForm;