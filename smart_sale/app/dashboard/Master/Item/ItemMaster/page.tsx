"use client";

import React, { useEffect, useState } from "react";
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
import { FaFileExcel ,FaPrint } from "react-icons/fa";
import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";

import { ItemMast } from "@/types/item/item";
import { normalizeItem } from "@/utils/normalize/normalizeItem";

import { useItems } from "@/hooks/item/useItems";
import { useItemById } from "@/hooks/item/useItemById";
import { useCreateItem } from "@/hooks/item/useCreateItem";
import { useUpdateItem } from "@/hooks/item/useUpdateItem";
import { useAllCompanies } from "@/hooks/company/useCompany";
import { useAllMetals } from "@/hooks/metal/useMetals";


import { CustomTable, TableColumn } from "@/component/table/CustomTable";
import { Toaster } from "@/components/ui/toaster";
import { fontVariables } from "@/context/theme/font";
import { useTheme } from "@/context/theme/themeContext";
import scrollToTop from "@/component/scroll/ScrollToTop";
import { toastLoaded } from "@/component/toast/toast";
import { formatToFixed } from "@/utils/format/numberFormat";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { usePrint } from "@/context/print/usePrintContext";
import { useRouter } from "next/navigation";

import SearchBar from "@/component/search/SearchBar";
import DeleteAction from "@/component/deleteAction/deleteAction";

export default function ItemMasterPage() {

    /* ===================== STATE ===================== */
    const [editingId, setEditingId] = useState<number | null>(null);
    const topRef = React.useRef<HTMLDivElement>(null);
    const [highlightId, setHighlightId] = useState<number | null>(null);
    const [errors, setErrors] = useState<{ itemName?: string }>({});
    const [autoItemId, setAutoItemId] = useState<number | undefined>(undefined);

    const controller = new AbortController();         //Controller to unmound the events in the useEffect


    const [form, setForm] = useState<ItemMast>({
        itemId: 0,
        itemName: "",
        metalId: "",
        hsn:"",
        shortName:"",
        stockType:"T",
        calType:"W",
        studded:"N",
        active: "Y",
        companyId: "",
    } as ItemMast);

    const { theme } = useTheme();
    const{ setData ,setColumns ,setShowSno ,title } = usePrint();

    const [filter, setFilter] = useState<string>(''); // object, not string

    /* ===================== HOOKS ===================== */

    const { data: itemsData, isLoading ,refetch:itemsRefetch } = useItems(filter);
    const { data: companyData } = useAllCompanies();
    const { data: metalData } = useAllMetals();
    const router = useRouter();

    const { data: itemById } = useItemById(editingId ?? undefined);

  
    const { mutate: createItem, isPending: creating } = useCreateItem();
    const { mutate: updateItem, isPending: updating } = useUpdateItem();

    /* ===================== NORMALIZE ===================== */

    
    const items: ItemMast[] = (itemsData?.items ?? []).map(normalizeItem);
    const companies = Array.isArray(companyData?.data) ? companyData.data : [];
    const metals = Array.isArray(metalData) ? metalData : [];

    /* ===================== AUTO ITEM ID ===================== */
    useEffect(() => {

        if (!editingId) {
            setForm((prev) => ({
                ...prev,
                itemId: itemsData?.nextId ?? '0',
                metalId: metals[0]?.metalId ?? "G", // default first metal
                hsn:"",
                shortName:"",
                stockType:"T",
                calType:"W",
                active: "Y",
                studded:"N",
                companyId:companies[0]?.COMPANYID ?? "",
                
            }));
            setAutoItemId(itemsData?.nextId ?? '0');
        }
        return () => {
            controller.abort();
        }
    }, [items.length, metals, editingId]);

    /* ===================== LOAD ITEM FOR EDIT ===================== */
    useEffect(() => {
        const controller = new AbortController();
        if (!itemById) return;
        setForm(normalizeItem(itemById));
        return () => {
            controller.abort();
        };
    }, [itemById,editingId]);

    /* ===================== HANDLERS ===================== */

    const onChange = (field: keyof ItemMast, value: any)=>{
        setForm((prev)=>({...prev ,[field]:value}))    
    }

    const resetForm = () => {
        setEditingId(null);
        setForm((prev) => ({
            ...prev,
            itemId: autoItemId,
            itemName: "",
            metalId: metals[0]?.metalId ?? "G",
            hsn:"",
            shortName:"",
            stockType:"T",
            calType:"W",
            active: "Y",
            studded:"N",
            companyId: companies[0]?.COMPANYID ?? "", 

        }));
    };

   useEffect(()=>{
    if(!highlightId) {
        return;
    }
    const timer = setTimeout(() => {
        setHighlightId(null);
    }, 2500);
    return () => {
        clearTimeout(timer);
        controller.abort();
    };
   })
   
    const handleSave = () => {
        const newErrors: typeof errors = {};

        if (!form.itemName?.trim()) {
            newErrors.itemName = "Item Name is required";
        }

        if (form.itemName?.trim()) {

            const isDuplicate = items.some(item =>
                item.itemName?.trim().toUpperCase() === form.itemName?.trim().toUpperCase()
                && item.itemId !== editingId   // 👈 ignore same record while editing
            );

            if (isDuplicate) {
                newErrors.itemName = "Item Name must be unique";
            }
        }

        setErrors(newErrors);

        // ⛔ Stop save if errors exist
        if (Object.keys(newErrors).length > 0) return;

        if (editingId) {
            updateItem(form, {
                onSuccess: () => {
                    resetForm();
                    scrollToTop();
                    setHighlightId(editingId);
                    setTimeout(() => setHighlightId(null), 2500);
                },
            });
        } else {
            const payload = { ...form };
            delete payload.itemId;

            createItem(payload, {
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

    const tableColumns: TableColumn[] = [

        { key: "sno", label: "Sno" },
        { key: "itemId", label: "ItemId" },
        { key: "itemName", label: "Item Name" },
        { key: "metalId", label: "Metal" },
        // { key: "pieceRate", label: "Rate", align: "end" },
        { key: "active", label: "Active", align: "center" },
        { key: "action", label: "Action", align: "center" },
    ];

    const handleExport =  (option:string) =>{
        setData(items);
        setColumns([
            { key: "itemId", label: "ItemId" },
            { key: "itemName", label: "Item" },
            { key: "metalName", label: "Metal" },
            { key: "hsn", label: "HSN Code"},
            { key: "shortName", label: "Short Name"},
            { key: "stockType", label: "Stock Type" },
            { key: "calType", label: "Cal Type"},
            { key: "active", label: "Active" },
        ]);
        setShowSno(true)
        title?.("Item Master List")
        router.push(`/print?export=${option}`);
    }


    /* ===================== UI ===================== */
    return (
        <Box  ref={topRef}>
            <Toaster />
            <Grid
                templateColumns={{ base: "1fr", lg: "1fr 1.8fr" }}
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
                            <Grid css={{ gridTemplateColumns: "repeat(1, 1fr)"}} gap={2}>


                                {/* ================= SECOND ROW ================= */}
                                <Field.Root>
                                    <HStack>
                                        <Box minW="80px">
                                            <Field.Label fontSize="2xs">COMPANY :</Field.Label>
                                        </Box>
                                        <Box flex={1}>
                                            <NativeSelect.Root>
                                                <NativeSelect.Field
                                                    fontSize="2xs"
                                                    value={form.companyId ?? ""}
                                                    onChange={(e) => onChange("companyId", e.target.value)}
                                                    css={{
                                                        backgroundColor: "#eee",
                                                        color: "#111827",
                                                        border: "1px solid #e5e7eb",
                                                        borderRadius: "20px",
                                                        height: "30px",
                                                        fontSize: "10px",
                                                        minW: "150px"
                                                    }}
                                                >

                                                    {companies.map((c) => (
                                                        <option key={c.COMPANYID} value={c.COMPANYID}>
                                                            {c.COMPANYNAME}
                                                        </option>
                                                    ))}
                                                </NativeSelect.Field>
                                                <NativeSelect.Indicator />
                                            </NativeSelect.Root>
                                        </Box>
                                    </HStack>
                                </Field.Root>

                                <Field.Root>
                                    <HStack>
                                        <Box minW="80px">
                                            <Field.Label fontSize="2xs">METAL :</Field.Label>
                                        </Box>
                                        <Box flex={1}>
                                            <NativeSelect.Root>
                                                <NativeSelect.Field
                                                    fontSize="2xs"
                                                    value={form.metalId ?? ""}
                                                    onChange={(e) => onChange("metalId", e.target.value)}
                                                    css={{
                                                        backgroundColor: "#eee",
                                                        color: "#111827",
                                                        border: "1px solid #e5e7eb",
                                                        borderRadius: "20px",
                                                        height: "30px",
                                                        fontSize: "10px",
                                                        minW: "150px"
                                                    }}
                                                >
                                                    {metals.map((m: any) => (
                                                        <option key={m.sno} value={m.metalId}>
                                                            {m.metalName}
                                                        </option>
                                                    ))}
                                                </NativeSelect.Field>
                                                <NativeSelect.Indicator />
                                            </NativeSelect.Root>
                                        </Box>
                                    </HStack>
                                </Field.Root>
                                {/* ================= FIRST ROW ================= */}
                                <Field.Root>
                                    <HStack>
                                        <Box minW="80px">
                                            <Field.Label fontSize="2xs">ITEM ID :</Field.Label>
                                        </Box>
                                        <Box flex={1}>
                                            <Input
                                                size="xs"
                                                type="number"
                                                value={form.itemId}
                                                disabled
                                                width="80px"
                                                fontSize="2xs"
                                            />
                                        </Box>
                                    </HStack>
                                </Field.Root>

                                <Field.Root invalid={!!errors.itemName}>
                                    <HStack>
                                        <Box minW="80px">
                                            <Field.Label fontSize="2xs">ITEM NAME :</Field.Label>
                                        </Box>
                                        <Box flex={1}>
                                            <CapitalizedInput
                                                size="xs"
                                                field="itemName"
                                                value={form.itemName ?? ""}
                                                onChange={onChange}
                                                placeholder="Enter Item Name"
                                                minWidth="250px"
                                            />
                                            {errors.itemName && (
                                                <Text fontSize="2xs" color="red.500" mt={1}>
                                                    {errors.itemName}
                                                </Text>
                                            )}
                                        </Box>
                                    </HStack>
                                </Field.Root>

                              

                                {/* ================= THIRD ROW ================= */}
                                <Field.Root>
                                    <HStack>
                                        <Box minW="80px">
                                            <Field.Label fontSize="2xs">HSN CODE :</Field.Label>
                                        </Box>
                                        <Box flex={1}>
                                            <CapitalizedInput
                                                size="xs"
                                                field="hsn"
                                                value={form.hsn ?? ""}
                                                onChange={onChange}
                                                minWidth="250px"
                                            />
                                        </Box>
                                    </HStack>
                                </Field.Root>

                                <Field.Root>
                                    <HStack>
                                        <Box minW="80px">
                                            <Field.Label fontSize="2xs">SHORT NAME :</Field.Label>
                                        </Box>
                                        <Box flex={1}>
                                            <CapitalizedInput
                                                size="xs"
                                                field="shortName"
                                                value={form.shortName ?? ""}
                                                onChange={onChange}
                                                minWidth="250px"
                                                placeholder="Enter Short Name"
                                            />
                                        </Box>
                                    </HStack>
                                </Field.Root>

                                {/* ================= FOURTH ROW ================= */}
                                <Field.Root>
                                    <HStack>
                                        <Box minW="80px">
                                            <Field.Label fontSize="2xs">STOCK TYPE :</Field.Label>
                                        </Box>
                                        <Box flex={1}>
                                            <NativeSelect.Root>
                                                <NativeSelect.Field
                                                    fontSize="2xs"
                                                    value={form.stockType ?? "N"}
                                                    onChange={(e) => onChange("stockType", e.target.value)}
                                                    css={{
                                                        backgroundColor: "#eee",
                                                        color: "#111827",
                                                        border: "1px solid #e5e7eb",
                                                        borderRadius: "20px",
                                                        height: "30px",
                                                        fontSize: "10px",
                                                        minW: "150px"
                                                    }}
                                                >
                                                    {stockTypeOptions.map((o) => (
                                                        <option key={o.value} value={o.value}>
                                                            {o.label}
                                                        </option>
                                                    ))}
                                                </NativeSelect.Field>
                                                <NativeSelect.Indicator />
                                            </NativeSelect.Root>
                                        </Box>
                                    </HStack>
                                </Field.Root>

                                <Field.Root>
                                    <HStack>
                                        <Box minW="80px">
                                            <Field.Label fontSize="2xs">CAL TYPE :</Field.Label>
                                        </Box>
                                        <Box flex={1}>
                                            <NativeSelect.Root>
                                                <NativeSelect.Field
                                                    fontSize="2xs"
                                                    value={form.calType ?? "W"}
                                                    onChange={(e) => onChange("calType", e.target.value)}
                                                    css={{
                                                        backgroundColor: "#eee",
                                                        color: "#111827",
                                                        border: "1px solid #e5e7eb",
                                                        borderRadius: "20px",
                                                        height: "30px",
                                                        fontSize: "10px",
                                                        minW: "150px"
                                                    }}
                                                >
                                                    {calTypeOptions.map((o) => (
                                                        <option key={o.value} value={o.value}>
                                                            {o.label}
                                                        </option>
                                                    ))}
                                                </NativeSelect.Field>
                                                <NativeSelect.Indicator />
                                            </NativeSelect.Root>
                                        </Box>
                                    </HStack>
                                </Field.Root>
                                {/* ================= FIFTH ROW ================= */}
                                <Field.Root>
                                    <HStack>
                                        <Box minW="80px">
                                            <Field.Label fontSize="2xs">STUDDED :</Field.Label>
                                        </Box>
                                        <Box flex={1}>
                                            <NativeSelect.Root>
                                                <NativeSelect.Field
                                                    fontSize="2xs"
                                                    value={form.studded ?? "N"}
                                                    onChange={(e) => onChange("studded", e.target.value)}
                                                    css={{
                                                        backgroundColor: "#eee",
                                                        color: "#111827",
                                                        border: "1px solid #e5e7eb",
                                                        borderRadius: "20px",
                                                        height: "30px",
                                                        fontSize: "10px",
                                                        minW: "150px"
                                                    }}
                                                >
                                                    {yesNoOptions.map((o) => (
                                                        <option key={o.value} value={o.value}>
                                                            {o.label}
                                                        </option>
                                                    ))}
                                                </NativeSelect.Field>
                                                <NativeSelect.Indicator />
                                            </NativeSelect.Root>
                                        </Box>
                                    </HStack>
                                </Field.Root>

                                {/* ================= FIFTH ROW ================= */}
                                <Field.Root>
                                    <HStack>
                                        <Box minW="80px">
                                            <Field.Label fontSize="2xs">ACTIVE :</Field.Label>
                                        </Box>
                                        <Box flex={1}>
                                            <NativeSelect.Root>
                                                <NativeSelect.Field
                                                    fontSize="2xs"
                                                    value={form.active ?? "Y"}
                                                    onChange={(e) => onChange("active", e.target.value)}
                                                    css={{
                                                        backgroundColor: "#eee",
                                                        color: "#111827",
                                                        border: "1px solid #e5e7eb",
                                                        borderRadius: "20px",
                                                        height: "30px",
                                                        fontSize: "10px", 
                                                        minW: "150px"
                                                    }}
                                                >
                                                    {yesNoOptions.map((o) => (
                                                        <option key={o.value} value={o.value}>
                                                            {o.label}
                                                        </option>
                                                    ))}
                                                </NativeSelect.Field>
                                                <NativeSelect.Indicator />
                                            </NativeSelect.Root>
                                        </Box>
                                    </HStack>
                                </Field.Root>
                            </Grid>


                            {/* ================= ACTION BUTTONS ================= */}
                            <HStack justify="center">
                                <Button
                                    size="xs"
                                    colorPalette="blue"
                                    onClick={handleSave}
                                    loading={creating || updating}
                                    disabled={!form.itemName?.trim()}
                                >
                                    <AiOutlineSave /> Save
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
                        <Box display='flex' mb={2}  justifyContent='space-between' alignItems='center'>
                            <Text fontSize='small' fontWeight='semibold'>
                                ITEM MASTER LIST
                            </Text>
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
                                                            color= {theme.colors.green}
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
                            renderRow={(item , index) => (
                                <>
                                    <Table.Cell>{index+1}</Table.Cell>
                                    <Table.Cell>{item.itemId}</Table.Cell>
                                    <Table.Cell>{item.itemName}</Table.Cell>
                                    <Table.Cell>{item.metalName}</Table.Cell>
                                    {/* <Table.Cell textAlign="end">{formatToFixed(item.pieceRate ,2)}</Table.Cell> */}
                                    <Table.Cell textAlign="center">{item.active}</Table.Cell>
                                    <Table.Cell textAlign="center">
                                        <Box display="flex" justifyContent="center">
                                            <FiEdit
                                                onClick={() => {
                                                    setEditingId(item.itemId!);
                                                    scrollToTop();
                                                    toastLoaded("Item")
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
