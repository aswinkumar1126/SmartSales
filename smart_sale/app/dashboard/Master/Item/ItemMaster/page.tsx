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
} from "@chakra-ui/react";
import { FiEdit } from "react-icons/fi";
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

export default function ItemMasterPage() {
    /* ===================== STATE ===================== */
    const [editingId, setEditingId] = useState<number | null>(null);
    const topRef = React.useRef<HTMLDivElement>(null);
    const [highlightId, setHighlightId] = useState<number | null>(null);
    const [errors, setErrors] = useState<{ itemName?: string }>({});
    const [form, setForm] = useState<ItemMast>({
        itemId: 0,
        itemName: "",
        metalId: "",
        metalRate: null,
        pieceRate: null,
        active: "Y",
        companyId: "",
    } as ItemMast);

    const { theme } = useTheme();

    /* ===================== HOOKS ===================== */
    const { data: itemsData, isLoading } = useItems();
    const { data: companyData } = useAllCompanies();
    const { data: metalData } = useAllMetals();
    console.log(itemsData,'itemsData')
    const { data: itemById } = useItemById(editingId ?? undefined);
    console.log(itemById ,'itemById')
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
            }));
        }
    }, [items.length, metals, editingId]);

    /* ===================== LOAD ITEM FOR EDIT ===================== */
    useEffect(() => {
        if (!itemById) return;
        setForm(normalizeItem(itemById));
    }, [itemById]);

    /* ===================== HANDLERS ===================== */
    const onChange =
        (key: keyof ItemMast) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                setForm((prev) => ({ ...prev, [key]: e.target.value }));

                // clear field error softly
                if (key === "itemName" && errors.itemName) {
                    setErrors((prev) => ({ ...prev, itemName: undefined }));
                }
            };


    const resetForm = () => {
        setEditingId(null);
        setForm((prev) => ({
            ...prev,
            itemId: Number(items.length + 1),
            itemName: "",
            metalId: metals[0]?.metalId ?? "G",
            metalRate: null,
            pieceRate: null,
            active: "Y",
            companyId: "",
        }));
    };

   useEffect(()=>{
    if(!highlightId) {
        return;
    }
    const timer = setTimeout(() => {
        setHighlightId(null);
    }, 2500);
    return () => clearTimeout(timer);
   })
   
    const handleSave = () => {
        const newErrors: typeof errors = {};

        if (!form.itemName?.trim()) {
            newErrors.itemName = "Item Name is required";
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

            console.log(payload , 'creating item')

            createItem(payload, {
                onSuccess: (res: any) => {
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
        { label: "Weight Based", value: "W" },
        { label: "Metal Based", value: "M" },
        { label: "Rate Based", value: "R" },
    ];

    const stockTypeOptions = [
        { label: "Tagged", value: "T" },
        { label: "Non Tagged", value: "N" },
    ];

    const tableColumns: TableColumn[] = [
        { key: "itemName", label: "Item" },
        { key: "metalId", label: "Metal" },
        { key: "pieceRate", label: "Rate", align: "end" },
        { key: "active", label: "Active", align: "center" },
        { key: "action", label: "Action", align: "center" },
    ];

    /* ===================== UI ===================== */
    return (
        <Box p={4} ref={topRef}>
            <Toaster />
            <Grid
                templateColumns={{ base: "1fr", lg: "1fr 1.3fr" }}
                gap={4}
                className={fontVariables}
                fontFamily="var(--font-lustria)"
            >
                {/* ================= LEFT FORM ================= */}
                <GridItem>
                    <VStack
                        bg={theme.colors.formColor}
                        p={4}
                        borderRadius="xl"
                        boxShadow="0 0 20px rgba(212,212,212,0.2)"
                        border="1px solid #eee"
                    >
                        <Text fontSize="lg" fontWeight="600" alignItems="center" justifyContent="center">
                            {editingId ? "Edit Item" : "Item Master"}
                        </Text>

                        <Fieldset.Root>
                            <Fieldset.Content gap={3}>
                                <Field.Root>
                                    {/* Item ID (auto-generated) */}
                                    <HStack >
                                    <Field.Root flex={1}>
                                        <Field.Label>Item ID</Field.Label>
                                        <Input type="number" value={form.itemId} disabled  width='100px' />
                                    </Field.Root>
                                        <Field.Root flex={1} invalid={!!errors.itemName}>
                                            <Field.Label>Item Name</Field.Label>

                                            <Input
                                                value={form.itemName ?? ""}
                                                onChange={onChange("itemName")}
                                                borderColor={errors.itemName ? "red.300" : undefined}
                                                _focus={{
                                                    borderColor: errors.itemName ? "red.400" : "blue.400",
                                                    boxShadow: errors.itemName
                                                        ? "0 0 0 1px var(--chakra-colors-red-400)"
                                                        : undefined,
                                                }}
                                                minWidth={{sm:'150px',md:'250px'}}

                                            />

                                            {errors.itemName && (
                                                <Text fontSize="sm" color="red.500" mt={1}>
                                                    {errors.itemName}
                                                </Text>
                                            )}
                                        </Field.Root>
                                </HStack>
                                   
                                    {/* Company */}
                                    <Field.Label>Company</Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field
                                            value={form.companyId ?? ""}
                                            onChange={onChange("companyId")}
                                            css={{
                                                backgroundColor: "#eee",
                                                color: "#111827",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "12px",
                                                height: "42px",
                                            }}
                                        >
                                            <option value="" disabled>
                                                Select Company
                                            </option>

                                            {companies.map((c) => (
                                                <option key={c.companyid} value={c.companyid}>
                                                    {c.companyname}
                                                </option>
                                            ))}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Field.Root>

                                {/* Metal */}
                                <HStack gap={3}>
                                    <Field.Root flex={1}>
                                        <Field.Label>Metal</Field.Label>
                                        <NativeSelect.Root>
                                            <NativeSelect.Field
                                                value={form.metalId ?? ""}
                                                onChange={onChange("metalId")}
                                                css={{
                                                    backgroundColor: "#eee",
                                                    color: "#111827",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "12px",
                                                    height: "42px",
                                                }}
                                            >
                                                {metals.map((m:any) => (
                                                    <option key={m.metalId} value={m.metalId}>
                                                        {m.metalName}
                                                    </option>
                                                ))}
                                            </NativeSelect.Field>
                                            <NativeSelect.Indicator />
                                        </NativeSelect.Root>
                                    </Field.Root>
                                </HStack>

                                {/* HSN + Item Name + Short Name */}
                                <HStack gap={3}>
                                    <Field.Root flex={1}>
                                        <Field.Label>HSN Code</Field.Label>
                                        <Input value={form.hsn ?? ""} onChange={onChange("hsn")} />
                                    </Field.Root>
                                    
                                    <Field.Root flex={1}>
                                        <Field.Label>Short Name</Field.Label>
                                        <Input value={form.shortName ?? ""} onChange={onChange("shortName")} />
                                    </Field.Root>
                                </HStack>

                                {/* Stock Type + Cal Type */}
                                <HStack gap={3}>
                                    <Field.Root flex={1}>
                                        <Field.Label>Stock Type</Field.Label>
                                        <NativeSelect.Root>
                                            <NativeSelect.Field
                                                value={form.stockType ?? "N"}
                                                onChange={onChange("stockType")}
                                                css={{
                                                    backgroundColor: "#eee",
                                                    color: "#111827",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "12px",
                                                    height: "42px",
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
                                    </Field.Root>
                                    <Field.Root flex={1}>
                                        <Field.Label>Cal Type</Field.Label>
                                        <NativeSelect.Root>
                                            <NativeSelect.Field
                                                value={form.calType ?? "W"}
                                                onChange={onChange("calType")}
                                                css={{
                                                    backgroundColor: "#eee",
                                                    color: "#111827",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "12px",
                                                    height: "42px",
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
                                    </Field.Root>
                                </HStack>

                                {/* Active */}
                                <HStack gap={2}>
                                    <Field.Root>
                                        <Field.Label>Active</Field.Label>
                                        <NativeSelect.Root>
                                            <NativeSelect.Field
                                                value={form.active ?? "Y"}
                                                onChange={onChange("active")}
                                                css={{
                                                    backgroundColor: "#eee",
                                                    color: "#111827",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "12px",
                                                    height: "42px",
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
                                    </Field.Root>
                                </HStack>

                                {/* ACTIONS */}
                                <HStack justify="center" pt={4}>
                                    <Button
                                        size="sm"
                                        colorPalette="blue"
                                        onClick={handleSave}
                                        loading={creating || updating}
                                        disabled={!form.itemName?.trim()}
                                    >
                                        <AiOutlineSave /> Save
                                    </Button>

                                    <Button size="sm" onClick={resetForm} colorPalette="blue">
                                        <IoIosExit /> Clear
                                    </Button>
                                </HStack>
                            </Fieldset.Content>
                        </Fieldset.Root>
                    </VStack>
                </GridItem>

                {/* ================= RIGHT TABLE ================= */}
                <GridItem minW={0}>
                    <Box
                        bg={theme.colors.formColor}
                        p={4}
                        borderRadius="xl"
                        boxShadow="0 0 10px rgba(212,212,212,0.2)"
                        border="1px solid #eee"
                    >
                        <Text fontSize="lg" fontWeight="600" mb={2}>
                            Item List
                        </Text>
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
                            renderRow={(item) => (
                                <>
                                    <Table.Cell>{item.itemName}</Table.Cell>
                                    <Table.Cell>{metals.find((m:any) => m.metalId === item.metalId)?.metalName ?? item.metalId}</Table.Cell>
                                    <Table.Cell textAlign="end">{formatToFixed(item.pieceRate ,2)}</Table.Cell>
                                    <Table.Cell textAlign="center">{item.active === "Y" ? "YES" : "NO"}</Table.Cell>
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
