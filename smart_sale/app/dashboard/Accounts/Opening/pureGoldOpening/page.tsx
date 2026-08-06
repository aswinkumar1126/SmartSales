"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Box, Field, Input, Grid, GridItem, Button, Heading, HStack, Flex, Text
} from "@chakra-ui/react";
import { FaFileExcel, FaPrint } from "react-icons/fa";
import { FiEdit, FiFilter, FiRefreshCw } from "react-icons/fi";
import { IoIosAdd, IoIosExit } from "react-icons/io";
import { AdvancedSearch, AdvancedSearchHandle } from "@/component/search/AdvancedSearch";
import { Tooltip } from "@/components/ui/tooltip";
import type { FormField } from "@/types/form/form";

import { useTheme } from "@/context/theme/themeContext";
import scrollToTop from "@/component/scroll/ScrollToTop";
import { Toaster } from "@/components/ui/toaster";
import { toastLoaded } from "@/component/toast/toast";

import { DataTable, createDataTableColumns } from "@/component/table/DataTable";
import { usePrint } from "@/context/print/usePrintContext";
import { pureGoldMastForm, pureGoldMastOpenForm } from "@/types/pureGold/pureGold";

import { usePureGoldData, usePureGoldNames } from "@/hooks/apiHooks/pureGoldMast/usePureGoldMastData";
import { useCreatePureGoldMast } from "@/hooks/apiHooks/pureGoldMast/usePureGoldMastCreate";
import { useUpdatePureGoldMast } from "@/hooks/apiHooks/pureGoldMast/usePureGoldMastUpdate";
import { AiOutlineSave } from "react-icons/ai";
import { useRouter } from "next/navigation";
import { formatToFixed } from "@/utils/format/numberFormat";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { useAllMetals } from "@/hooks/apiHooks/metal/useMetals";
import { SelectCombobox } from "@/components/ui/selectComboBox";
import { safeValue } from "@/utils/comboBox/safeValue";
import SearchBar from "@/component/search/SearchBar";

import { useGlobalKey } from "@/components/key/useGlobalKey";
import { PureGoldMastForm } from "@/config/opening/pureGoldOpening";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { DynamicForm } from "@/component/form/DynamicForm";
import ShortcutDialog from "@/components/shortcut/ShortcutDialog";
import { useTransactionLoader } from "@/utils/loader/ResolveLoader";
import TransactionLoader from "@/component/loader/Transactionloader";

import type { PrintColumn } from "@/component/screens/PrintPreviewScreen";
/* ---------------- Initial Form State ---------------- */

const initialFormState: pureGoldMastOpenForm = {
    pureId: "",
    aWt: "",

    aTouch: "",
    aPureWt: "",

    // metalId:""
};

/* ---------------- Table Row Type ---------------- */

export type TouchTableRow = {
    sno: number;
    pureId?: string;
    pureGoldName: string;
    aWt: number;
    aTouch: number;
    aPureWt: number;
    // metalId ?: string

};

const pureGoldHelper = createDataTableColumns<TouchTableRow>();

/* ---------------- Component ---------------- */

const PureGoldOpening = () => {

    const { isOpen, status, title: loaderTitle, description, openLoader, resolveLoader, closeLoader } = useTransactionLoader();
    /* ---------------- State ---------------- */

    const [form, setForm] = useState<pureGoldMastOpenForm>(initialFormState);
    const [editId, setEditId] = useState<number | null>(null);
    const [highlightRowId, setHighlightRowId] = useState<number | null>(null);

    type FormErrors = Partial<Record<keyof pureGoldMastOpenForm, string>>;
    const [errors, setErrors] = useState<FormErrors>({});
    const [metalData, setMetalData] = useState<{ label: string, value: string }[]>([]);
    const [pureGoldName, setPureGoldName] = useState<{ label: string, value: string }[]>([]);

    const [filter, setFilter] = useState<string>('');
    const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
    const advancedSearchRef = React.useRef<AdvancedSearchHandle>(null);
    /* ---------------- Hooks ---------------- */
    const router = useRouter();
    const { theme } = useTheme();
    const { setData, setColumns, title } = usePrint();

    const { data: pureGoldData = [], refetch, isLoading: pureGoldOpeningLoading } = usePureGoldData(filter, advancedFilters);
    const { data: metalsData } = useAllMetals();

    const { data: allPureGoldNames = [] } = usePureGoldNames();


    const createMutation = useCreatePureGoldMast();
    const updateMutation = useUpdatePureGoldMast();


    const PureGoldOpeningFields = PureGoldMastForm(pureGoldName);

    /* --------------- ComboBox Data ------------- */
    // useEffect(() => {
    //     if (!Array.isArray(metalsData)) return;
    //     if (!metalsData.length) return;

    //     const fetchedData = metalsData.map((m: any) => ({
    //         label: m.metalName,
    //         value: m.metalId,
    //     }));

    //     setMetalData(fetchedData);
    // }, [metalsData]);


    useEffect(() => {
        if (!Array.isArray(allPureGoldNames)) return;
        if (!allPureGoldNames.length) return;

        const fetchedData = allPureGoldNames.map((p: any) => ({
            label: p.pureGoldName,
            value: String(p.pureId),
        }));

        setPureGoldName(fetchedData);
    }, [allPureGoldNames]);

    /* ---------------- ADVANCED SEARCH ---------------- */

    const advancedSearchFields: FormField[] = [
        { name: "pureId", label: "Pure Gold Name", type: "combobox", items: pureGoldName, placeholder: "Select Pure Gold Name", size: "xs" },
        { name: "aWt", label: "Weight", type: "number", placeholder: "Search by weight", size: "xs" },
        { name: "aTouch", label: "Actual Touch", type: "number", placeholder: "Search by actual touch", size: "xs" },
        { name: "aPureWt", label: "Actual Pure", type: "number", placeholder: "Search by actual pure", size: "xs" },
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

    /* ---------------- Helpers ---------------- */
    useEffect(() => {
        const weight = Number(form.aWt);
        const touch = Number(form.aTouch);

        if (!isNaN(weight) && !isNaN(touch)) {
            const pure = (weight * touch) / 100;
            setForm((prev) => ({
                ...prev,
                aPureWt: pure ? pure.toFixed(3) : "",
            }));
        }
    }, [form.aWt, form.aTouch]);


    const handleChange = (key: keyof pureGoldMastOpenForm, value: string) => {
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
            pureId: String(row.pureId),
            aWt: String(row.aWt),
            aPureWt: String(row.aPureWt),
            aTouch: String(row.aTouch),
            // metalId: row.metalId ?? ''
        });

        toastLoaded("Pure Gold Master");
    };

    /* ---------------- Validation ---------------- */

    const validateForm = (form: pureGoldMastOpenForm): FormErrors => {
        const errors: FormErrors = {};

        if (!form.pureId) errors.pureId = "Pure Gold Name is required";
        if (!form.aWt) errors.aWt = "Weight is required";
        if (!form.aPureWt) errors.aPureWt = "Actual Pure is required";
        if (!form.aTouch) errors.aTouch = "Actual Touch is required";
        // if (!form.metalId) errors.metalId = "Metal Name is required";


        return errors;
    };

    /* ---------------- Submit Handler ---------------- */

    const isDuplicatePureForMetal = (
        pureId: any,
        // metalId: any,
        excludeSno?: number | null
    ) => {
        return pureGoldData.some((p: any) => {

            const samePure =
                Number(p.pureId) === Number(pureId);

            const notSameRow =
                excludeSno ? Number(p.sno) !== Number(excludeSno) : true;

            return samePure && notSameRow;
        });
    };

    const handleSubmit = () => {
        const validationErrors = validateForm(form);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const payload = {
            pureId: Number(form.pureId),
            aWt: Number(form.aWt),
            aTouch: Number(form.aTouch),
            aPureWt: Number(form.aPureWt),
            // metalId: String(form.metalId),
        };

        // 🔒 duplicate check (common for create & edit)
        if (form.pureId) {
            const exists = isDuplicatePureForMetal(
                form.pureId,
                // form.metalId,
                editId
            );

            if (exists) {
                setErrors((prev: any) => ({
                    ...prev,
                    pureId: 'This TOUCH already exists for the selected metal',
                }));
                return;
            }
        }

        if (editId) {
            openLoader('update', true)
            updateMutation.mutate(
                { id: editId, data: payload },
                {
                    onSuccess: () => {
                        setHighlightRowId(editId);
                        resetForm();
                        refetch();
                        resolveLoader("success", "update", "", true)
                    },
                    onError: () => {
                        resolveLoader("error", "update", "", true)
                    }
                }
            );
        } else {
            openLoader('save', true)
            createMutation.mutate(payload, {
                onSuccess: (res: any) => {
                    setHighlightRowId(res?.data?.id);
                    resetForm();
                    refetch();
                    resolveLoader("success", "save", "", true)
                },
                onError: () => {
                    resolveLoader("error", "save", "", true)
                }
            });
        }
    };


    /* ---------------- Table Columns ---------------- */

    const columns = useMemo(
        () => [
            pureGoldHelper.display({
                id: "sno",
                header: "S.No",
                cell: ({ row }) => row.index + 1,
            }),
            pureGoldHelper.accessor("pureGoldName", { header: "Pure Gold Name" }),
            pureGoldHelper.accessor("aWt", {
                header: "Weight",
                meta: { align: "end" },
                cell: ({ getValue }) => formatToFixed(getValue(), 2),
            }),
            pureGoldHelper.accessor("aTouch", {
                header: "Actual Touch",
                meta: { align: "end" },
                cell: ({ getValue }) => formatToFixed(getValue(), 2),
            }),
            pureGoldHelper.accessor("aPureWt", {
                header: "Actual Pure",
                meta: { align: "end" },
                cell: ({ getValue }) => formatToFixed(getValue(), 2),
            }),
            // { key: "action", label: "Action", align: "center" as const },
        ],
        []
    );

    /* ---------------- Row Highlight Animation ---------------- */

    useEffect(() => {
        if (!highlightRowId) return;

        const timer = setTimeout(() => setHighlightRowId(null), 2500);
        return () => clearTimeout(timer);
    }, [highlightRowId]);

    /* ---------------- Export ---------------- */
    const handleExport = (option: string) => {
        setData(pureGoldData);
        title?.("Pure Gold Opening List")
        setColumns([
            { key: "sno", label: "S.No" },
            { key: "pureGoldName", label: "Pure Gold Name" },
            { key: "weight", label: "Weight", align: 'end' as const, allowTotal: true },
            { key: "actualTouch", label: "Actual Touch", align: 'end' as const, },
            { key: "actualPure", label: "Actual Pure", align: 'end' as const, allowTotal: true },
        ]);
        router.push(`/print?export=${option}`);
    }

    const pureGoldFieldsName = PureGoldOpeningFields.map(f => f.name);

    const { register, focusFirst, focusNext } = useEnterNavigation(pureGoldFieldsName, handleSubmit)

    useEffect(() => {
        focusFirst()
    }, [focusFirst]);

    useGlobalKey("Alt+s", () => handleSubmit(), "saveTransaction");
    useGlobalKey("Alt+r", () => resetForm(), "Reset");
    useGlobalKey("Alt+e", () => router.back(), "exit");
    useGlobalKey("Alt+u", () => handleSubmit(), "update");
    useGlobalKey("F1", () => advancedSearchRef.current?.toggle(), "pureGoldOpeningAdvancedSearch");
    /* ---------------- UI ---------------- */

    return (
        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} color={theme.colors.primary} fontWeight='semibold' gap={2}>

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
            {/* -------- Form Section -------- */}
            <GridItem>
                <Box p={2} borderRadius="lg" bg={theme.colors.formColor} boxShadow="sm">
                    <Heading
                        display="flex"
                        mx="auto"
                        alignItems="center"
                        justifyContent="center"
                        mb={2}
                    >
                        <Text fontSize="small" fontWeight='semibold'  >
                            PURE GOLD OPENING

                        </Text>
                    </Heading>

                    <DynamicForm
                        fields={PureGoldOpeningFields}
                        formData={form}
                        register={register}
                        onChange={handleChange}
                        minLabelWidth="100px"
                        layout="vertical"
                        focusNext={focusNext}
                        errors={errors}
                    />

                    {/* ================= ACTION BUTTONS ================= */}
                    <Box mt={2}>
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
                                Reset <IoIosExit />
                            </Button>
                            <Button size="xs" colorPalette="blue" onClick={() => router.back()}>
                                Exit <IoIosExit />
                            </Button>
                        </HStack>
                    </Box>
                </Box>
            </GridItem>

            {/* -------- Table Section -------- */}
            <GridItem minW={0}>
                <Box p={3} borderRadius="lg" bg={theme.colors.formColor} boxShadow="sm">

                    <Box display="flex" gap={2} alignItems="center" justifyContent="space-between">

                        <Heading fontSize="small" fontWeight='semibold' >
                            PURE GOLD OPENING LIST
                        </Heading>
                        <Box display='flex' gap={1}>
                            <Box >
                                <SearchBar
                                    searchTerm={filter}
                                    onChange={setFilter}
                                    placeholder="Search pureGold Opening"
                                    size="2xs"

                                />
                            </Box>
                            <Flex>
                                <Tooltip content="Refresh">
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        color={theme.colors.primaryText}
                                        _hover={{ color: "black" }}
                                        onClick={() => refetch()}
                                        aria-label="Refresh"
                                        loading={pureGoldOpeningLoading}
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

                    </Box>
                    <DataTable<TouchTableRow>
                        columns={columns}
                        data={pureGoldData as TouchTableRow[]}
                        rowIdKey="sno"
                        editingRowId={editId ?? highlightRowId}
                        onRowClick={(row) => handleEdit(row)}
                        emptyText="No data available"
                        bodyBg={theme.colors.bg}
                        headerBg={theme.colors.primary}
                        headerColor="white"
                        borderColor="white"
                        pagination={{ enabled: true, pageSize: 10, color: theme.colors.whiteColor }}
                    />
                </Box>
            </GridItem>
        </Grid>
    );
};

export default PureGoldOpening;
