"use client";

import React, { useEffect, useState, useMemo, use } from "react";
import {
    Box,
    Button,
    VStack,
    Text,
    Grid,
    GridItem,
    HStack,
    Fieldset,
    Flex,

} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";
import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { FiFilter } from "react-icons/fi";
import { AdvancedSearch, AdvancedSearchHandle } from "@/component/search/AdvancedSearch";
import { Tooltip } from "@/components/ui/tooltip";
import type { FormField } from "@/types/form/form";

import { Toaster } from "@/components/ui/toaster";
import ScrollToTop from "@/component/scroll/ScrollToTop";
import { toastCreated, toastLoaded, toastUpdated } from "@/component/toast/toast";

import { useTheme } from "@/context/theme/themeContext";
import { ItemMast } from "@/types/item/item";
import { normalizeItem } from "@/utils/normalize/normalizeItem";
import { useItems, useStoneItems } from "@/hooks/apiHooks/item/useItems";
import {
    useOrnamentData,
    useOrnamentDataById,
    useCreateOrnament,
    useUpdateOrnament,
} from "@/hooks/apiHooks/ornament/useOrnamentData";
import { usePrint } from "@/context/print/usePrintContext";
import { OrnamentPayload, OrnamentFormData } from "@/types/ornament/ornament";
import { formatToFixed } from "@/utils/format/numberFormat";
import { CustomTable } from "@/component/table/CustomTable";
import { toastError } from "@/component/toast/toast";
import { useRouter } from "next/navigation";
import { FaFileExcel, FaPrint } from "react-icons/fa";
import SearchBar from "@/component/search/SearchBar";

import { useAllMetals } from "@/hooks/apiHooks/metal/useMetals";

import { OrnamentOpeningFields } from "@/config/opening/ornamentOpening";
import { DynamicForm } from "@/component/form/DynamicForm";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { useGlobalKey } from "@/components/key/useGlobalKey";

import type { PrintColumn } from "@/component/screens/PrintPreviewScreen";

function OrnamentMaster() {
    /* -------------------- FORM STATE -------------------- */
    const [form, setForm] = useState<OrnamentFormData>({



        itemId: "",   // ✅ NOT null
        pcs: "",
        grswt: "",
        netwt: "",
        touch: "",
        purewt: "",
        stnwt: "",
        openCash: "",
        stnAmt: "",

    });
    const [higlightedId, setHiglightedId] = useState<Number>();
    const [itemCollection, setItemCollection] = useState<{ label: string, value: string }[]>([]);

    console.log(itemCollection, 'itemCollection')


    const [editId, setEditId] = useState<number | null>(null);


    const { theme } = useTheme();
    const router = useRouter();
    type OrnamentErrors = Partial<Record<keyof typeof form, string>>;

    const [errors, setErrors] = React.useState<OrnamentErrors>({});


    const ornamentFields = OrnamentOpeningFields(itemCollection);

    /* -------------------- DATA -------------------- */
    const { data: itemsData } = useStoneItems();
    console.log(itemsData, 'itemsData');
    const { setData, setColumns, setShowSno, title } = usePrint();

    //
    const { data: metalData } = useAllMetals();



    console.log(metalData, 'metalData')
    const [filter, setFilter] = useState<string>('');
    const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
    const advancedSearchRef = React.useRef<AdvancedSearchHandle>(null);

    const { data: ornamentList, isLoading } = useOrnamentData(filter, undefined, undefined, undefined, advancedFilters);

    console.log(ornamentList, 'ornamentList');


    const ornaments = Array.isArray(ornamentList?.data)
        ? ornamentList.data
        : [];

    const items: ItemMast[] = useMemo(() => {
        return (itemsData ?? []).map(normalizeItem);
    }, [itemsData]);

    console.log(items, 'itemsData')



    /* -------------------- EDIT FETCH -------------------- */
    const { data: editResponse } = useOrnamentDataById(editId!);

    console.log(editResponse, 'editResponse')

    /* -------------------- MUTATIONS -------------------- */
    const { mutate: createOrnament, isPending } = useCreateOrnament();
    const { mutate: updateOrnament, isPending: isUpdating } = useUpdateOrnament();




    /* -------------------- EFFECT: LOAD EDIT DATA -------------------- */
    useEffect(() => {
        if (!editResponse?.data) return;

        const o = editResponse.data;


        setForm({

            itemId: o.itemId ? String(o.itemId) : "",
            pcs: o.pcs ? String(o.pcs) : "",
            grswt: o.grswt ? String(o.grswt) : "",
            netwt: o.netwt ? String(o.netwt) : "",
            touch: o.touch ? String(o.touch) : "",
            purewt: o.purewt ? String(o.pure) : "",
            stnwt: o.stnwt ? String(o.stnwt) : "",
            openCash: o.openCash ? String(o.openCash) : "",
            stnAmt: o.stnAmt ? String(o.stnAmt) : "",
        });
    }, [editResponse]);

    useEffect(() => {
        if (!Array.isArray(items)) return;

        const collection = items.map((item: any) => ({
            label: item.itemName,
            value: String(item.itemId),
        }));

        setItemCollection(collection);
    }, [items]);

    /* -------------------- ADVANCED SEARCH -------------------- */

    const advancedSearchFields: FormField[] = [
        { name: "ITEMID", label: "Item Name", type: "combobox", items: itemCollection, placeholder: "Select Item", size: "xs" },
        { name: "PCS", label: "Pieces", type: "number", placeholder: "Search by pieces", size: "xs" },
        { name: "GRSWT", label: "Gross Weight", type: "number", placeholder: "Search by gross weight", size: "xs" },
        { name: "STNWT", label: "Stone Weight", type: "number", placeholder: "Search by stone weight", size: "xs" },
        { name: "NETWT", label: "Net Weight", type: "number", placeholder: "Search by net weight", size: "xs" },
        { name: "TOUCH", label: "Touch", type: "number", placeholder: "Search by touch", size: "xs" },
        { name: "PUREWT", label: "Pure Weight", type: "number", placeholder: "Search by pure weight", size: "xs" },
        { name: "OPENCASH", label: "Open Cash", type: "number", placeholder: "Search by open cash", size: "xs" },
        { name: "STNAMT", label: "Stone Amount", type: "number", placeholder: "Search by stone amount", size: "xs" },
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

    /* -------------------- EFFECTS: CALCULATE NET WT & PURE -------------------- */
    useEffect(() => {
        // Calculate Net Wt automatically
        const grswt = parseFloat(form.grswt ?? "") || 0;
        const stnwt = parseFloat(form.stnwt ?? "") || 0;
        const netwt = grswt - stnwt;

        // Calculate Pure automatically based on Actual Touch
        const touch = parseFloat(form.touch ?? "") || 0;
        const purewt = (netwt * touch) / 100;



        setForm((prev) => ({
            ...prev,
            netwt: netwt.toFixed(3),  // keep 3 decimals
            purewt: purewt.toFixed(3),
            actualtouch: String(touch),
        }));
    }, [form.grswt, form.stnwt, form.touch]);


    /* -------------------- HELPERS -------------------- */
    const handleChange = (field: keyof OrnamentFormData, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const toPayload = (form: OrnamentFormData): OrnamentPayload => ({

        itemId: Number(form.itemId),
        pcs: Number(form.pcs),
        grswt: Number(form.grswt),
        netwt: Number(form.netwt),
        touch: Number(form.touch),
        purewt: Number(form.purewt),
        stnwt: Number(form.stnwt),
        openCash: Number(form.openCash),
        stnAmt: Number(form.stnAmt),
        // actualtouch: Number(form.actualtouch),
    });

    const resetForm = () => {
        setEditId(null);
        setForm({

            itemId: "",
            pcs: "",
            grswt: "",
            netwt: "",
            touch: "",
            purewt: "",
            stnwt: "",
            openCash: "",
            stnAmt: "",
        });
    };

    useEffect(() => {
        if (!higlightedId) {
            return;
        }
        const timer = setTimeout(() => {
            setHiglightedId(undefined);
        }, 3000); // Highlight for 3 seconds
        return () => clearTimeout(timer);

    }, [higlightedId]);

    /* -------------------- VALIDATION -------------------- */
    const validateForm = (): boolean => {
        // Define validation rules
        const rules: {
            field: keyof typeof form;
            condition: () => boolean;
            message: string
        }[] = [
                { field: "itemId", condition: () => !!form.itemId, message: "Item is required" },
                { field: "pcs", condition: () => !!form.pcs && Number(form.pcs) > 0, message: "Pieces must be greater than 0" },
                { field: "grswt", condition: () => !!form.grswt && Number(form.grswt) > 0, message: "Gross weight must be greater than 0" },
                { field: "netwt", condition: () => !!form.netwt && Number(form.netwt) > 0, message: "Net weight must be greater than 0" },
                { field: "purewt", condition: () => form.purewt === undefined || Number(form.purewt) >= 0, message: "Pure weight cannot be negative" },
                { field: "touch", condition: () => form.touch === undefined || Number(form.touch) >= 0, message: "Touch cannot be negative" },

                { field: "stnwt", condition: () => form.stnwt === undefined || Number(form.stnwt) >= 0, message: "Stone weight cannot be negative" },
                { field: "stnAmt", condition: () => form.stnAmt === undefined || Number(form.stnAmt) >= 0, message: "Stone cash cannot be negative" },

            ];

        // Run through rules
        for (const rule of rules) {
            if (!rule.condition()) {
                toastError(rule.message);
                return false;
            }
        }

        return true;
    };
    /* -------------------- SAVE -------------------- */
    const handleSave = () => {

        if (!validateForm()) return; // ⛔ stop here
        const payload = toPayload(form);



        if (editId) {
            updateOrnament(
                { id: editId, ornamentData: payload },
                {
                    onSuccess: () => {
                        resetForm();
                        setHiglightedId(Number(editId));
                    }

                }
            );
        } else {
            createOrnament(payload, { onSuccess: resetForm });
        }
    };


    /* -------------------- EDIT -------------------- */
    const handleEdit = (ornament: any) => {
        console.log(ornament, 'ornament')

        setEditId(ornament.ornamentId); // ✅ IMPORTANT: SNO
        ScrollToTop();
        toastLoaded("Ornament");
    };

    /*----------Table Columns ---------- */

    const OrnamentTableColumn = [
        { key: 'sno', label: 'S.NO' },
        { key: 'itemName', label: 'Item Name' },
        { key: 'pcs', label: 'Pcs', align: 'end' as const },
        { key: 'grswt', label: 'Grs Wt', align: 'end' as const },
        { key: 'stnwt', label: 'Stone Wt', align: 'end' as const },
        { key: 'netwt', label: 'Net Wt', align: 'end' as const },
        { key: 'touch', label: 'Touch', align: 'end' as const },
        { key: 'pure', label: 'Pure', align: 'end' as const },
        { key: 'stoneCash', label: 'StoneCash', align: 'end' as const },
        // { key: 'action', label: 'Actions', align: 'center' as const },
    ]



    /*----------Print ---------- */
    const handleExport = (option: string) => {
        setData(ornaments);
        const columns :PrintColumn[]= 
            [
                { key: 'ITEMNAME', label: 'Item Name' },
                { key: 'PCS', label: 'Pieces', align: 'end' as const, allowTotal: true },
                { key: 'GRSWT', label: 'Gross Weight', align: 'end' as const, allowTotal: true ,renderCell :(value)=>formatToFixed(value,3) , printValue:(value)=>formatToFixed(value, 3)},
                { key: 'STNWT', label: 'Stone Weight', align: 'end' as const, allowTotal: true, renderCell: (value) => formatToFixed(value, 3), printValue: (value) => formatToFixed(value, 3) },
                { key: 'NETWT', label: 'Net Weight', align: 'end' as const, allowTotal: true, renderCell: (value) => formatToFixed(value, 3), printValue: (value) => formatToFixed(value, 3) },
                { key: 'TOUCH', label: 'touch', align: 'end' as const, allowTotal: true, renderCell: (value) => formatToFixed(value, 2), printValue: (value) => formatToFixed(value, 2) },
                { key: 'PURE', label: 'Pure Weight', align: 'end' as const, allowTotal: true, renderCell: (value) => formatToFixed(value, 3), printValue: (value) => formatToFixed(value, 3) },
              
            ]
        setColumns(columns);
        title?.("Ornament Opening List")
        router.push(`/print?export=${option}`);
    }

    const getFormNames = ornamentFields.map(f => f.name);

    const { register, focusFirst, focusNext } = useEnterNavigation(getFormNames, handleSave);

    useEffect(() => {
        focusFirst();
    }, [])

    useGlobalKey("F1", () => advancedSearchRef.current?.toggle(), "ornamentOpeningAdvancedSearch");

    /* -------------------- UI -------------------- */
    return (
        <Box
            fontWeight='semibold'
            bg={theme.colors.bg}
            color={theme.colors.primary}
        >
            <Toaster />
            <AdvancedSearch
                ref={advancedSearchRef}
                title="Advanced Filters"
                fields={advancedSearchFields}
                onSearch={handleAdvancedSearch}
                size="xs"
            />

            <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={4}>
                {/* ---------------- FORM ---------------- */}
                <GridItem>
                    <VStack
                        bg={theme.colors.formColor}
                        p={4}
                        borderRadius="xl"
                        border="1px solid #eef"
                    >
                        <Text fontSize="small" fontWeight="semibold" mb={2}>
                            ORNAMENT OPENING
                        </Text>

                        <Fieldset.Root size="sm" width="100%">
                            <Fieldset.Content>
                                <DynamicForm
                                    fields={ornamentFields}
                                    formData={form}
                                    onChange={handleChange}
                                    register={register}
                                    minLabelWidth="100px"
                                    focusNext={focusNext}
                                    layout="vertical"
                                />


                                {/* ACTION BUTTONS */}

                                <HStack pt={3} alignItems='center' justifyContent='center'>
                                    <Button
                                        size="xs"
                                        colorPalette="blue"
                                        loading={isPending || isUpdating}
                                        onClick={handleSave}
                                    >
                                        <AiOutlineSave /> {editId ? "Update" : "Save"}
                                    </Button>
                                    <Button size="xs" colorPalette="blue" onClick={resetForm}>
                                        <IoIosExit /> Reset
                                    </Button>
                                    <Button size="xs" colorPalette="blue" onClick={() => router.back()}>
                                        <IoIosExit /> Exit
                                    </Button>
                                </HStack>
                            </Fieldset.Content>
                        </Fieldset.Root>



                    </VStack>
                </GridItem>

                {/* ---------------- TABLE ---------------- */}
                <GridItem minW={0}>
                    <Box
                        bg={theme.colors.formColor}
                        p={4}
                        borderRadius="xl"
                        border="1px solid #eef"
                    >
                        <Box display='flex' mb={4} gap={3} justifyContent='space-between' alignItems='center'>
                            <Text fontSize="small" fontWeight="semibold" >
                                ORMNAMENT DETAILS
                            </Text>
                            <Box display='flex' gap={1}>
                                <Box >
                                    <SearchBar
                                        searchTerm={filter}
                                        onChange={setFilter}
                                        placeholder="Search ornament masters"
                                        size="2xs"

                                    />
                                </Box>
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
                        <CustomTable
                            columns={OrnamentTableColumn}
                            data={ornaments}
                            size="sm"
                            headerBg={theme.colors.primary}
                            bodyBg={theme.colors.bg}
                            headerColor='white'
                            emptyText="No Ornaments available"
                            rowIdKey='sno'
                            highlightRowId={higlightedId ? Number(higlightedId) : null}
                            renderRow={(ornament: any, index: number) => (
                                <>
                                    <Table.Cell>{index + 1}</Table.Cell>
                                    <Table.Cell>{ornament.ITEMNAME}</Table.Cell>
                                    <Table.Cell textAlign='end'>{ornament.PCS}</Table.Cell>
                                    <Table.Cell textAlign='end'>{formatToFixed(ornament.GRSWT, 3)}</Table.Cell>
                                    <Table.Cell textAlign='end'>{formatToFixed(ornament.STNWT, 3)}</Table.Cell>
                                    <Table.Cell textAlign='end'>{formatToFixed(ornament.NETWT, 3)}</Table.Cell>
                                    <Table.Cell textAlign='end'>{formatToFixed(ornament.TOUCH, 2)}</Table.Cell>
                                    <Table.Cell textAlign='end'>{formatToFixed(ornament.PUREWT, 3)}</Table.Cell>
                                    <Table.Cell textAlign='end'>{formatToFixed(ornament.STNAMT, 2)}</Table.Cell>
                                    {/* <Table.Cell>
                                        <Box display='flex' justifyContent='center'>
                                            <FaEdit
                                                cursor="pointer"
                                                onClick={() => handleEdit(ornament)}
                                            />
                                        </Box>

                                    </Table.Cell> */}
                                </>
                            )}

                        />
                    </Box>

                </GridItem>
            </Grid>
        </Box>
    );
}

export default OrnamentMaster;
