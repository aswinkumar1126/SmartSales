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
    Table,
    NativeSelect,
    Flex
} from "@chakra-ui/react";
import { FiEdit } from "react-icons/fi";
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

import { CustomTable, TableColumn } from "@/component/table/CustomTable";
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
export default function ItemMasterPage() {

    

    /* ===================== STATE ===================== */
    const [editingId, setEditingId] = useState<number | null>(null);
    const topRef = React.useRef<HTMLDivElement>(null);
    const [highlightId, setHighlightId] = useState<number | null>(null);
    const [errors, setErrors] = useState<any>({});
    const [autoItemId, setAutoItemId] = useState<number | undefined>(undefined);

    const [isDisabelStudded, setIsDisableStudded] = useState<boolean>(false);

    const [isStnPrensetDisabled ,setIsStnPrensetDisabled] = useState<boolean>(false);

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
        stnPresent:"Y",

    } as ItemMast);

    const { theme } = useTheme();
    const { setData, setColumns, setShowSno, title } = usePrint();

    // ✅ FIX: Change filter from string to object
    const [filterParams, setFilterParams] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');

    /* ===================== HOOKS ===================== */

    // ✅ Pass filterParams object to useItems
    const { data: itemsData, isLoading, refetch: itemsRefetch } = useItems(filterParams);
    const { data: companyData } = useAllCompanies();
    const { data: metalData } = useAllMetals();
    const router = useRouter();

    const { mutate: createItem, isPending: creating } = useCreateItem();
    const { mutate: updateItem, isPending: updating } = useUpdateItem();

    /* ===================== NORMALIZE ===================== */

    const items: ItemMast[] = (itemsData?.items ?? []).map(normalizeItem);

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


    const formFields = ItemMasterFields({
        companyCollection: companies,
        metalCollection: metals,
        stockTypeCollection: stockTypeOptions,
        studdedStoneCollection: studdedStoneCollection,
        calTypeCollection: calTypeOptions,
        activeTypeCollection: yesNoOptions,
        isDisabelStudded: isDisabelStudded,
        isStnPrensetDisabled : isStnPrensetDisabled
    });


    /* ===================== AUTO ITEM ID ===================== */
    useEffect(() => {
        if (!editingId) {
            setForm((prev) => ({
                ...prev,
                itemId: itemsData?.nextId ?? '0',
                metalId: metals[0]?.value ?? "G",
                hsn: "",
                shortName: "",
                stockType: "T",
                calType: "W",
                active: "Y",
                studded: "N",
                studdedStone: "T",
                stnPresent:"Y",
                companyId: companies[0]?.value ?? "",
            }));
            setAutoItemId(itemsData?.nextId ?? '0');
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
            stnPresent:"Y",
            companyId: companies[0]?.value ?? "",
        }));
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
            updateItem(payload as ItemMast, {
                onSuccess: () => {
                    resetForm();
                    scrollToTop();
                    setHighlightId(editingId);
                    setTimeout(() => setHighlightId(null), 2500);
                },
            });
        } else {

            delete payload.itemId;

            createItem(payload as ItemMast, {
                onSuccess: (res: any) => {
                    itemsRefetch();
                    resetForm();
                    scrollToTop();
                    setHighlightId(res?.itemId ?? null);
                    setTimeout(() => setHighlightId(null), 2500);
                },
            });
        }
    };

    const tableColumns: TableColumn[] = [
        { key: "sno", label: "Sno" },
        { key: "itemId", label: "ItemId" },
        { key: "itemName", label: "Item Name" },
        { key: "metalId", label: "Metal" },
        { key: "active", label: "Active", align: "center" },
        { key: "action", label: "Action", align: "center" },
    ];

    const handleExport = (option: string) => {
        setData(items);
        setColumns([
            { key: "itemId", label: "ItemId" },
            { key: "itemName", label: "Item" },
            { key: "metalName", label: "Metal" },
            { key: "hsn", label: "HSN Code" },
            { key: "shortName", label: "Short Name" },
            { key: "stockType", label: "Stock Type" },
            { key: "calType", label: "Cal Type" },
            { key: "active", label: "Active" },
        ]);
        setShowSno(true)
        title?.("Item Master List")
        router.push(`/print?export=${option}`);
    }

    const fieldsName = formFields.map(f => f.name);

    const { register, focusFirst, focusNext } = useEnterNavigation(fieldsName, handleSave);

    useEffect(() => {
        focusFirst()
    }, [focusFirst]);


    /* ===================== UI ===================== */
    return (
        <Box ref={topRef}>
            <Toaster />
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
                        <Text fontSize="small" fontWeight="semibold" textAlign="center">
                            {editingId ? "EDIT ITEM" : "ITEM MASTER"}
                        </Text>

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
                                    <IoIosExit /> Clear
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
                            <Box display='flex' gap={1}>
                                <Box>
                                    {/* ✅ Updated SearchBar with correct handler */}
                                    <SearchBar
                                        searchTerm={searchTerm}
                                        onChange={handleSearchChange}
                                        placeholder="Search item master..."
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
                        </Box>

                        <CustomTable
                            columns={tableColumns}
                            data={items}
                            headerBg="blue.800"
                            headerColor="white"
                            bodyBg={theme.colors.primary}
                            borderColor="#eee"
                            emptyText="No items available"
                            size="sm"
                            rowIdKey="itemId"
                            highlightRowId={highlightId}
                            renderRow={(item, index) => (
                                <>
                                    <Table.Cell>{index + 1}</Table.Cell>
                                    <Table.Cell>{item.itemId}</Table.Cell>
                                    <Table.Cell>{item.itemName}</Table.Cell>
                                    <Table.Cell>{item.metalName}</Table.Cell>
                                    <Table.Cell textAlign="center">{item.active}</Table.Cell>
                                    <Table.Cell textAlign="center">
                                        <Box display="flex" justifyContent="center">
                                            <FiEdit
                                                onClick={() => {
                                                    handleEdit(item.itemId!, item)
                                                    setEditingId(item.itemId!);
                                                }}
                                                style={{ cursor: "pointer" }}
                                            />
                                        </Box>
                                    </Table.Cell>
                                </>
                            )}
                        />
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
}