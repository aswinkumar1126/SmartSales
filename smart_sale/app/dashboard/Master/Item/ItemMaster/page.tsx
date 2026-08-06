"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box,
    Grid,
    GridItem,
    VStack,
    Text,
    Input,
    Button,
    HStack,
    Fieldset,
    Field,
    NativeSelect,
    Flex
} from "@chakra-ui/react";
import { FiEdit, FiFilter, FiRefreshCw } from "react-icons/fi";
import { FaFileExcel, FaPrint } from "react-icons/fa";
import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";

import { ItemMast } from "@/types/item/item";
import { normalizeItem } from "@/utils/normalize/normalizeItem";

import { useItems } from "@/hooks/apiHooks/item/useItems";
import { useCreateItem } from "@/hooks/apiHooks/item/useCreateItem";
import { useUpdateItem } from "@/hooks/apiHooks/item/useUpdateItem";
import { useAllCompanies } from "@/hooks/apiHooks/company/useCompany";
import { useAllMetals } from "@/hooks/apiHooks/metal/useMetals";

import { DataTable, createDataTableColumns } from "@/component/table/DataTable";
import { Toaster } from "@/components/ui/toaster";
import { useTheme } from "@/context/theme/themeContext";
import scrollToTop from "@/component/scroll/ScrollToTop";
import { formatToFixed } from "@/utils/format/numberFormat";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { usePrint } from "@/context/print/usePrintContext";
import { useRouter } from "next/navigation";

import SearchBar from "@/component/search/SearchBar";

import { DynamicForm } from "@/component/form/DynamicForm";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { ItemMasterFields } from "@/config/master/itemMaster";
import { useGlobalKey } from "@/components/key/useGlobalKey";
import ShortcutDialog from "@/components/shortcut/ShortcutDialog";
import { useTransactionLoader } from "@/utils/loader/ResolveLoader";
import TransactionLoader from "@/component/loader/Transactionloader";
import { useSoftControlById } from "@/hooks/apiHooks/softControl/useSoftControl";
import { AdvancedSearch, AdvancedSearchHandle } from "@/component/search/AdvancedSearch";
import { Tooltip } from "@/components/ui/tooltip";

import type { PrintColumn } from "@/component/screens/PrintPreviewScreen";
import type { FormField } from "@/types/form/form";

const itemHelper = createDataTableColumns<ItemMast>();

export default function ItemMasterPage() {

    const { data: showEditIcon } = useSoftControlById('EDIT_ICON');
    const showEditIcons = showEditIcon?.CTLTEXT === "Y";

    /* ===================== STATE ===================== */
    const [editingId, setEditingId] = useState<number | null>(null);
    const topRef = React.useRef<HTMLDivElement>(null);
    const [highlightId, setHighlightId] = useState<number | null>(null);
    const [errors, setErrors] = useState<any>({});
    const [autoItemId, setAutoItemId] = useState<number | undefined>(undefined);

    const [isDisabelStudded, setIsDisableStudded] = useState<boolean>(false);

    const [isStnPrensetDisabled, setIsStnPrensetDisabled] = useState<boolean>(false);

    const controller = new AbortController();

    const [form, setForm] = useState<ItemMast>({
        itemId: 0,
        itemName: "",
        metalId: "",
        hsn: "",
        shortName: "",
        stockType: "T",
        calType: "W",
        studded: "N",
        studdedStone: "",
        active: "Y",
        companyId: "",
        stnPresent: "Y",

    } as ItemMast);

    const { theme } = useTheme();
    const { setData, setColumns, setShowSno, title } = usePrint();

    const { isOpen, status, title: loaderTitle, description, openLoader, resolveLoader, closeLoader } = useTransactionLoader();

    // ✅ FIX: Change filter from string to object
    const [filterParams, setFilterParams] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
    const advancedSearchRef = React.useRef<AdvancedSearchHandle>(null);

    /* ===================== HOOKS ===================== */

    // ✅ Pass filterParams object to useItems
    const { data: itemsData, isLoading, refetch: itemsRefetch } = useItems(filterParams, advancedFilters);
    const { data: companyData } = useAllCompanies();
    const { data: metalData } = useAllMetals();
    const router = useRouter();

    const { mutate: createItem, isPending: creating } = useCreateItem();
    const { mutate: updateItem, isPending: updating } = useUpdateItem();

    /* ===================== NORMALIZE ===================== */

    const items: ItemMast[] = (itemsData?.items ?? []).map(normalizeItem);

    console.log(items, 'itemsforListing');

    const companies = useMemo(() => {
        const companyList = Array.isArray(companyData?.data) ? companyData.data : [];
        if (!companyList) return [];
        return companyList.map((comp) => ({
            label: comp.COMPANYNAME,
            value: comp.COMPANYID
        }))
    }, [companyData?.data]);

    const metals = useMemo(() => {
        if (!metalData) return [];
        return metalData.map((m) => ({
            label: m.metalName,
            value: m.metalId
        }))
    }, [metalData]);

    const yesNoOptions = [
        { label: "YES", value: "Y" },
        { label: "NO", value: "N" },
    ];

    const calTypeOptions = [
        { label: "WEIGHT BASED", value: "W" },
        { label: "METAL BASED", value: "M" },
        { label: "RATE BASED", value: "R" },
    ];

    const stockTypeOptions = [
        { label: "TAGGED", value: "T" },
        { label: "NON TAGGED", value: "N" },
    ];
    const studdedStoneCollection = [
        { label: "STONE", value: "T" },
        { label: "DIAMOND", value: "D" },
    ]

    /* ===================== ADVANCED SEARCH ===================== */
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
        {
            name: "ITEMID",
            label: "Item Id",
            type: "number",
            placeholder: "Search by item id",
            size: "xs",
        },
        {
            name: "ITEMNAME",
            label: "Item Name",
            type: "text",
            isCapitalized: true,
            placeholder: "Search by item name",
            size: "xs",
        },
        {
            name: "SHORTNAME",
            label: "Short Name",
            type: "text",
            isCapitalized: true,
            placeholder: "Search by short name",
            size: "xs",
        },
        {
            name: "HSN",
            label: "HSN",
            type: "text",
            placeholder: "Search by HSN",
            size: "xs",
        },
        {
            name: "METALID",
            label: "Metal",
            type: "select",
            items: [{ label: "ALL", value: "" }, ...metals],
            placeholder: "Select Metal",
            size: "xs",
            css: nativeSelectCss,
        },
        {
            name: "STOCKTYPE",
            label: "Stock Type",
            type: "select",
            items: [{ label: "ALL", value: "" }, ...stockTypeOptions],
            size: "xs",
            css: nativeSelectCss,
        },
        {
            name: "STNPRESENT",
            label: "Stone Present",
            type: "select",
            items: [{ label: "ALL", value: "" }, ...yesNoOptions],
            size: "xs",
            css: nativeSelectCss,
        },
        {
            name: "STUDDED",
            label: "Studded",
            type: "select",
            items: [{ label: "ALL", value: "" }, ...yesNoOptions],
            size: "xs",
            css: nativeSelectCss,
        },
        {
            name: "STUDDEDTYPE",
            label: "Studded Stone Type",
            type: "select",
            items: [{ label: "ALL", value: "" }, ...studdedStoneCollection],
            size: "xs",
            css: nativeSelectCss,
        },
        {
            name: "ACTIVE",
            label: "Active",
            type: "select",
            items: [{ label: "ALL", value: "" }, ...yesNoOptions],
            size: "xs",
            css: nativeSelectCss,
        },
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

    const formFields = ItemMasterFields({
        companyCollection: companies,
        metalCollection: metals,
        stockTypeCollection: stockTypeOptions,
        studdedStoneCollection: studdedStoneCollection,
        calTypeCollection: calTypeOptions,
        activeTypeCollection: yesNoOptions,
        isDisabelStudded: isDisabelStudded,
        isStnPrensetDisabled: isStnPrensetDisabled
    });


    /* ===================== AUTO ITEM ID ===================== */
    useEffect(() => {
        if (!editingId) {
            setForm((prev) => ({
                ...prev,
                itemId: Number(itemsData?.nextId) ?? '0',
                metalId: metals[0]?.value ?? "G",
                hsn: "",
                shortName: "",
                stockType: "T",
                calType: "W",
                active: "Y",
                studded: "N",
                studdedStone: "T",
                stnPresent: "Y",
                companyId: companies[0]?.value ?? "",
            }));
            setAutoItemId(Number(itemsData?.nextId) ?? '0');
        }
        return () => {
            controller.abort();
        }
    }, [items.length, metals, editingId, itemsData?.nextId, companies]);

    useEffect(() => {
        setIsDisableStudded(form.studded === 'N');
        setIsStnPrensetDisabled(form.studded === "Y");
    }, [form.studded]);



    /* ===================== LOAD ITEM FOR EDIT ===================== */

    const handleEdit = (id: number, row: any) => {
        setEditingId(id);
        setForm(normalizeItem(row));
        scrollToTop();
    }

    /* ===================== HANDLERS ===================== */

    const onChange = (field: keyof ItemMast, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const resetForm = () => {
        setEditingId(null);
        setForm((prev) => ({
            ...prev,
            itemId: autoItemId,
            itemName: "",
            metalId: metals[0]?.value ?? "G",
            hsn: "",
            shortName: "",
            stockType: "T",
            calType: "W",
            active: "Y",
            studded: "N",
            studdedStone: "T",
            stnPresent: "Y",
            companyId: companies[0]?.value ?? "",
        }));
        focusFirst();
    };


    useEffect(() => {
        if (form.studded !== 'Y') {
            setForm(prev => ({
                ...prev,
                studdedStone: null
            }))
        }
    }, [])

    // ✅ Handle search change
    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
        // Update filter params with search term (only if not empty)
        if (term && term.trim() !== '') {
            setFilterParams(term.trim());
        } else {
            setFilterParams(''); // Clear filter if search is empty
        }
    };

    useEffect(() => {
        if (!highlightId) {
            return;
        }
        const timer = setTimeout(() => {
            setHighlightId(null);
        }, 2500);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [highlightId]);

    useEffect(() => {
        if (form.studded === "Y") {
            setForm((prev) => ({
                ...prev,
                stnPresent: "N",
            }));
        }
    }, [form.studded]);

    const handleSave = () => {
        const newErrors: typeof errors = {};

        if (!form.itemName?.trim()) {
            newErrors.itemName = "Item Name is required";
        }
        if (!form.active) {
            newErrors.active = "Active is required"
        }

        if (form.itemName?.trim()) {
            const isDuplicate = items.some(item =>
                item.itemName?.trim().toUpperCase() === form.itemName?.trim().toUpperCase()
                && item.itemId !== editingId
            );

            if (isDuplicate) {
                newErrors.itemName = "Item Name must be unique";
            }
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) return;

        const payload: Partial<ItemMast> = {
            itemId: form.itemId,
            itemName: form.itemName,
            metalId: form.metalId,
            hsn: form.hsn,
            shortName: form.shortName,
            stockType: form.stockType,
            calType: form.calType,
            active: form.active,
            studded: form.studded,
            studdedStone: form.studded === "Y" ? form.studdedStone : null,
            companyId: form.companyId,
            stnPresent: form.studded === "Y" ? "N" : form.stnPresent
        };

        if (editingId) {
            openLoader("update", true)
            updateItem(payload as ItemMast, {
                onSuccess: () => {
                    resetForm();
                    scrollToTop();
                    setHighlightId(editingId);
                    setTimeout(() => setHighlightId(null), 2500);

                    resolveLoader("success", "update", "", true)
                },
            });
        } else {

            delete payload.itemId;
            openLoader("save", true)

            createItem(payload as ItemMast, {
                onSuccess: (res: any) => {
                    itemsRefetch();
                    resetForm();
                    scrollToTop();
                    setHighlightId(res?.itemId ?? null);
                    setTimeout(() => setHighlightId(null), 2500);
                    resolveLoader("success", "save", "", true)
                },
            });
        }
    };

    /* ===================== TABLE COLUMNS ===================== */
    const itemColumns = useMemo(() => {
        const cols = [
            itemHelper.display({
                id: "sno",
                header: "Sno",
                cell: ({ row }) => row.index + 1,
            }),
            itemHelper.accessor("itemId", { header: "ItemId" }),
            itemHelper.accessor("itemName", { header: "Item Name" }),
            itemHelper.accessor("metalName", { header: "Metal" }),
            itemHelper.accessor("hsn", { header: "Hsn" }),
            itemHelper.accessor("shortName", { header: "Short Name" }),
            itemHelper.accessor("stockType", {
                header: "Stock Type",
                cell: ({ getValue }) => (getValue() === "T" ? "TAGED" : "NON TAGED"),
            }),
            itemHelper.accessor("stnPresent", {
                header: "Stone Present",
                cell: ({ getValue }) => (getValue() === "Y" ? "Yes" : "No"),
            }),
            itemHelper.accessor("studded", {
                header: "Studded",
                cell: ({ getValue }) => (getValue() === "Y" ? "Yes" : "No"),
            }),
            itemHelper.accessor("studdedStone", {
                header: "Studded Stone Type",
                cell: ({ row }) =>
                    row.original.studded === "Y"
                        ? row.original.studdedStone === "D"
                            ? "Diamond"
                            : "Stone"
                        : "",
            }),
            itemHelper.accessor("active", {
                header: "Active",
                meta: { align: "center" },
            }),
        ];

        if (showEditIcons) {
            cols.push(
                itemHelper.display({
                    id: "actions",
                    header: "Action",
                    meta: { align: "center" },
                    cell: ({ row }) => (
                        <Box display="flex" justifyContent="center">
                            <FiEdit
                                onClick={() => {
                                    handleEdit(row.original.itemId!, row.original);
                                    setEditingId(row.original.itemId!);
                                }}
                                style={{ cursor: "pointer" }}
                            />
                        </Box>
                    ),
                })
            );
        }

        return cols;
    }, [showEditIcons]);

    const handleExport = (option: string) => {
        setData(items);
        const columns: PrintColumn[] = [
            { key: "itemId", label: "ItemId" },
            { key: "itemName", label: "Item" },
            { key: "metalName", label: "Metal" },
            { key: "hsn", label: "HSN Code" },
            { key: "shortName", label: "Short Name" },
            { key: "stockType", label: "Stock Type", renderCell: (value) => value === "T" ? "TAGGED" : "NON TAGGED", printValue: (value) => value === "T" ? "TAGGED" : "NON TAGGED" },
            { key: "calType", label: "Cal Type" },
            // { key: "active", label: "Active" },
        ]
        setColumns(columns);
        setShowSno(true)
        title?.("Item Master List")
        router.push(`/print?export=${option}`);
    }

    const fieldsName = formFields.map(f => f.name);

    const { register, focusFirst, focusNext } = useEnterNavigation(fieldsName, handleSave);

    useEffect(() => {
        focusFirst()
    }, [focusFirst]);

    useGlobalKey("Alt+s", () => handleSave(), "saveTransaction");
    useGlobalKey("Alt+r", () => resetForm(), "Reset");
    useGlobalKey("Alt+e", () => router.back(), "Exit");
    useGlobalKey("Alt+u", () => handleSave(), "update");
    useGlobalKey("F1", () => advancedSearchRef.current?.toggle(), "itemMasterAdvancedSearch");
   


    /* ===================== UI ===================== */
    return (
        <Box ref={topRef} color={theme.colors.primary}>
            <Toaster />
            <TransactionLoader
                isOpen={isOpen}
                status={status}
                title={loaderTitle}
                description={description}
                onClose={closeLoader}
            />
            <ShortcutDialog filter />
            <AdvancedSearch
                ref={advancedSearchRef}
                title="Advanced Filters"
                fields={advancedSearchFields}
                initialFilters={{ ACTIVE: "Y" }}
                onSearch={handleAdvancedSearch}
                size="xs"
            />
            <Grid
                templateColumns={{ base: "1fr", lg: "1fr 2fr" }}
                gap={2}
                fontWeight='semibold'
            >

                {/* ================= LEFT FORM ================= */}
                <GridItem>
                    <VStack
                        bg={theme.colors.formColor}
                        p={2}
                        borderRadius="xl"
                        boxShadow="0 0 20px rgba(212,212,212,0.2)"
                        border="1px solid #eee"
                    >
                        {/* <Text fontSize="small" fontWeight="semibold" textAlign="center">
                            {editingId ? "EDIT ITEM" : "ITEM MASTER"}
                        </Text> */}

                        <Fieldset.Root width="100%">
                            <DynamicForm
                                fields={formFields}
                                register={register}
                                onChange={onChange}
                                focusNext={focusNext}
                                formData={form}
                                minLabelWidth="120px"
                                layout="vertical"
                            />

                            {/* ================= ACTION BUTTONS ================= */}
                            <HStack justify="center">
                                <Button
                                    size="xs"
                                    colorPalette="blue"
                                    onClick={handleSave}
                                    loading={creating || updating}
                                    disabled={!form.itemName?.trim()}
                                >
                                    <AiOutlineSave />   {editingId ? 'Update' : 'Save'}
                                </Button>

                                <Button size="xs" onClick={resetForm} colorPalette="blue">
                                    <IoIosExit /> Reset
                                </Button>

                                <Button size="xs" onClick={() => router.back()}>
                                    Exit <IoIosExit />
                                </Button>
                            </HStack>
                        </Fieldset.Root>
                    </VStack>
                </GridItem>

                {/* ================= RIGHT TABLE ================= */}
                <GridItem minW={0}>
                    <Box
                        bg={theme.colors.formColor}
                        p={2}
                        borderRadius="xl"
                        boxShadow="0 0 10px rgba(212,212,212,0.2)"
                        border="1px solid #eee"
                    >
                        <Box display='flex' mb={2} justifyContent='space-between' alignItems='center'>
                            <Text fontSize='small' fontWeight='semibold'>
                                ITEM MASTER LIST
                            </Text>
                            <Flex alignItems={"Center"} gap={2}>
                                <SearchBar
                                    searchTerm={searchTerm}
                                    onChange={handleSearchChange}
                                    placeholder="Search item master..."
                                    size="2xs"
                                />
                                <Tooltip content="Refresh">
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        color={theme.colors.primaryText}
                                        _hover={{ color: "black" }}
                                        onClick={() => itemsRefetch()}
                                        aria-label="Refresh"
                                        loading={isLoading}
                                    >
                                        <FiRefreshCw />
                                    </Button>
                                </Tooltip>
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
                                <Tooltip content="Export Excel">
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
                                </Tooltip>
                                <Tooltip content="Export PDF">
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
                                </Tooltip>
                            </Flex>
                               
                          
                        </Box>

                        <DataTable<ItemMast>
                            columns={itemColumns}
                            data={items}
                            headerBg={theme.colors.primary}
                            headerColor="white"
                            bodyBg={theme.colors.bg}
                            borderColor="#eee"
                            emptyText="No items available"
                            size="sm"
                            rowIdKey="itemId"
                            editingRowId={editingId ?? highlightId}
                            onRowClick={(item) => {
                                handleEdit(item.itemId!, item)
                                setEditingId(item.itemId!);
                            }}
                            pagination={{ enabled: true, pageSize: 10, color: theme.colors.whiteColor  }}
                        />
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
}
