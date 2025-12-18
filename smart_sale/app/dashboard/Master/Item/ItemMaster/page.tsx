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
    Stack,
    Fieldset,
    Field,
    NativeSelect,
    IconButton,
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";
import { FiEdit } from "react-icons/fi";
import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";

import { ItemMast } from "@/types/item/item";
import { normalizeItem } from "@/utils/normalize/normalizeItem";

import { useItems } from "@/hooks/item/useItems";
import { useItemById } from "@/hooks/item/useItemById";
import { useCreateItem } from "@/hooks/item/useCreateItem";
import { useUpdateItem } from "@/hooks/item/useUpdateItem";
import { Toaster ,toaster } from "@/components/ui/toaster";
import { fontVariables } from "@/context/theme/font";
import { useTheme } from "@/context/theme/themeContext";
import scrollToTop from "@/component/scroll/ScrollToTop";


export default function ItemMasterPage() {

    /* ===================== STATE ===================== */
    const [editingId, setEditingId] = useState<number | null>(null);
    const topRef = React.useRef<HTMLDivElement>(null);
    const [highlightId, setHighlightId] = useState<number | null>(null);


    const [form, setForm] = useState<ItemMast>({
        itemName: "",
        metalId: "G",
        metalRate: null,
        pieceRate: null,
        active: "Y",
    } as ItemMast);
    const {theme} =useTheme();

    /* ===================== HOOKS ===================== */
    const { data, isLoading } = useItems();
    const { data: itemById } = useItemById(editingId ?? undefined);
    const { mutate: createItem, isPending: creating } = useCreateItem();
    const { mutate: updateItem, isPending: updating } = useUpdateItem();

    /* ===================== NORMALIZE LIST ===================== */
    const items: ItemMast[] = (data ?? []).map(normalizeItem);

    console.log(data ,'items')

    /* ===================== LOAD ITEM FOR EDIT ===================== */
    useEffect(() => {
        if (!itemById) return;
        setForm(normalizeItem(itemById));
    }, [itemById]);

   scrollToTop();


    /* ===================== HANDLERS ===================== */
    const onChange =
        (key: keyof ItemMast) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                setForm((prev) => ({ ...prev, [key]: e.target.value }));
            };

    const resetForm = () => {
        setEditingId(null);
        setForm({
            itemName: "",
            metalId: "G",
            metalRate: null,
            pieceRate: null,
            active: "Y",
        } as ItemMast);
    };

    const handleSave = () => {
        if (!form.itemName?.trim()) return;

        const affectedId = editingId ?? form.itemId ?? null;

        if (editingId) {
            updateItem(form, {
                onSuccess: () => {
                    resetForm();

                    scrollToTop();


                    setHighlightId(affectedId);
                    setTimeout(() => setHighlightId(null), 2500);

                   
                },
            });
        } else {
            createItem(form, {
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
        { label: "Weight Based", value: "WT" },
        { label: "Piece Based", value: "PCS" },
        { label: "Rate Based", value: "RT" },
    ];

    const stockTypeOptions = [
        { label: "Tagged", value: "N" },
        { label: "Non Tagged", value: "NT" },
        
    ];

    const itemCounterOptions = [
        { label: "Counter 1", value: "C1" },
        { label: "Counter 2", value: "C2" },
    ];


    /* ===================== UI ===================== */
    return (
        <Box p={4} ref={topRef}> 
            <Toaster />
            <Grid
                templateColumns={{ base: "1fr", lg: "1fr 1.3fr" }}
                gap={4}
                className={fontVariables} fontFamily="var(--font-lustria)"
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
                        <Text fontSize="lg" fontWeight="600"  alignItems="center" justifyContent="center">
                            {editingId ? "Edit Item" : "Item Master"}
                        </Text>

                        <Fieldset.Root>
                            <Fieldset.Content gap={3}>
                                {/* 1. Company */}
                                <Field.Root>
                                    <Field.Label>Company</Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field
                                            value={form.companyId ?? "SMJ"}
                                            onChange={(e) => onChange("companyId")(e)}
                                            css={{
                                                backgroundColor: '#eee',
                                                color: "#111827",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "12px",
                                                height: "42px",
                                            }}
                                        >
                                            <option value="SMJ">SMJ</option>
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Field.Root>

                                {/* 2. Metal + 3. Category */}
                                <HStack gap={3}>
                                    <Field.Root flex={1}>
                                        <Field.Label>Metal</Field.Label>
                                        <NativeSelect.Root>
                                            <NativeSelect.Field
                                                value={form.metalId ?? "G"}
                                                onChange={(e) => onChange("metalId")(e)}
                                                css={{
                                                    backgroundColor: '#eee',
                                                    color: "#111827",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "12px",
                                                    height: "42px",
                                                }}
                                            >
                                                <option value="G">Gold</option>
                                                <option value="S">Silver</option>
                                            </NativeSelect.Field>
                                            <NativeSelect.Indicator />
                                        </NativeSelect.Root>
                                    </Field.Root>
{/* 
                                    <Field.Root flex={1}>
                                        <Field.Label>Category</Field.Label>
                                        <NativeSelect.Root>
                                            <NativeSelect.Field
                                                value={form.catCode ?? "C01"}
                                                onChange={(e) => onChange("catCode")(e)}
                                                css={{
                                                    backgroundColor: '#eee',
                                                    color: "#111827",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "12px",
                                                    height: "42px",
                                                }}
                                            >
                                                <option value="C01">Jewellery</option>
                                                <option value="C02">Other</option>
                                            </NativeSelect.Field>
                                            <NativeSelect.Indicator />
                                        </NativeSelect.Root>
                                    </Field.Root> */}
                                </HStack>

                                {/* 4. Item ID + HSN */}
                                <HStack gap={3}>
                                    <Field.Root flex={1}>
                                        <Field.Label>Item ID</Field.Label>
                                        <Input
                                            type="number"
                                            value={form.itemId ?? ""}
                                            onChange={onChange("itemId")}
                                            disabled={!!(editingId ?? "")}
                                        />
                                    </Field.Root>

                                    <Field.Root flex={1}>
                                        <Field.Label>HSN Code</Field.Label>
                                        <Input value={form.hsn ?? ""} onChange={onChange("hsn")} />
                                    </Field.Root>
                                </HStack>
                                <HStack gap={3}>
                                {/* 5. Item Name */}

                                <Field.Root>
                                    <Field.Label>Item Name</Field.Label>
                                    <Input
                                        value={form.itemName ?? ""}
                                        onChange={onChange("itemName")}
                                    />
                                </Field.Root>

                                {/* 6. Short Name */}
                                <Field.Root>
                                    <Field.Label>Short Name</Field.Label>
                                    <Input
                                        value={form.shortName ?? ""}
                                        onChange={onChange("shortName")}
                                    />
                                </Field.Root>
                                </HStack>
                                {/* 7. Stock Type + 9. Cal Type */}
                                <HStack gap={3}>
                                    <Field.Root flex={1}>
                                        <Field.Label>Stock Type</Field.Label>
                                        <NativeSelect.Root>
                                            <NativeSelect.Field
                                                value={form.stockType ?? "N"}
                                                onChange={(e) => onChange("stockType")(e)}
                                                css={{
                                                    backgroundColor: '#eee',
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
                                                value={form.calType ?? "WT"}
                                                onChange={(e) => onChange("calType")(e)}
                                                css={{
                                                    backgroundColor: '#eee',
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

                                {/* 8. Sub Item + 10. Style Code */}
                                {/* <HStack gap={3}>
                                    {["subItem", "styleCode"].map((k) => (
                                        <Field.Root key={k} flex={1}>
                                            <Field.Label>{k === "subItem" ? "Sub Item" : "Style Code"}</Field.Label>
                                            <NativeSelect.Root>
                                                <NativeSelect.Field
                                                    value={(form as any)[k] ?? "N"}
                                                    onChange={(e) => onChange(k as keyof ItemMast)(e)}
                                                    css={{
                                                        backgroundColor: '#eee',
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
                                    ))}
                                </HStack> */}

                                {/* 11. Gross Weight */}
                                <Field.Root>
                                    <Field.Label>Gross Weight</Field.Label>
                                    <Input
                                        type="number"
                                        value={form.grsWt ?? ""}
                                        onChange={onChange("grsWt")}
                                    />
                                </Field.Root>

                                {/* 12. Extra Wt + 13. Tag Wt + 14. Cover Wt */}
                                {/* <HStack gap={3}>
                                    {["ExtraWt", "TagWt", "CoverWt"].map((k) => (
                                        <Field.Root key={k} flex={1}>
                                            <Field.Label>{k.replace("Wt", " Wt")}</Field.Label>
                                            <NativeSelect.Root>
                                                <NativeSelect.Field
                                                    value={(form as any) [k] ?? "N"}
                                                    onChange={(e) => onChange(k as keyof ItemMast)(e)}
                                                    css={{
                                                        backgroundColor: '#eee',
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
                                    ))}
                                </HStack> */}

                                {/* 15. Value Added Type */}
                                {/* <Field.Root>
                                    <Field.Label>Value Added Type</Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field
                                            value={form.valueAddedType ?? "F"}
                                            onChange={(e) => onChange("valueAddedType")(e)}
                                            css={{
                                                backgroundColor: '#eee',
                                                color: "#111827",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "12px",
                                                height: "42px",
                                            }}
                                        >
                                            <option value="F">Fixed</option>
                                            <option value="P">Percentage</option>
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Field.Root> */}

                                {/* 16. Table Code */}
                                {/* <Field.Root>
                                    <Field.Label>Table Code</Field.Label>
                                    <Input
                                        value={form.tableCode ?? ""}
                                        onChange={onChange("tableCode")}
                                    />
                                </Field.Root> */}

                                {/* 17. Studded Stone */}
                                {/* <Field.Root>
                                    <Field.Label>Studded Stone</Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field
                                            value={form.studdedStone ?? "N"}
                                            onChange={(e) => onChange("studdedStone")(e)}
                                            css={{
                                                backgroundColor: '#eee',
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
                                </Field.Root> */}

                                {/* 18. ItemSize + Service + Touch */}
                                {/* <HStack gap={3}>
                                    {(["ItemSize", "Service", "TouchBased"] as const).map((k) => (
                                        <Field.Root key={k} flex={1}>
                                            <Field.Label>{k}</Field.Label>
                                            <NativeSelect.Root>
                                                <NativeSelect.Field
                                                    value={(form as any)[k] ?? "N"}
                                                    onChange={(e) => onChange(k as keyof ItemMast)(e)}
                                                    css={{
                                                        backgroundColor: '#eee',
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
                                    ))}
                                </HStack> */}
                                <HStack gap={2}>
                                {/* 19. Item Counter */}

                                <Field.Root>
                                    <Field.Label>Item Counter</Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field
                                            value={form.defaultCounter ?? "C1"}
                                            onChange={(e) => onChange("defaultCounter")(e)}
                                            css={{
                                                backgroundColor: '#eee',
                                                color: "#111827",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "12px",
                                                height: "42px",
                                            }}
                                        >
                                            {itemCounterOptions.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Field.Root>

                                {/* 20. Active */}
                                <Field.Root>
                                    <Field.Label>Active</Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field
                                            value={form.active ?? "Y"}
                                            onChange={(e) => onChange("active")(e)}
                                            css={{
                                                backgroundColor: '#eee',
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
                                {/* 21. Tag Type + Item Type */}
                                {/* <HStack gap={3}>
                                    {/* <Field.Root flex={1}>
                                        <Field.Label>Tag Type</Field.Label>
                                        <NativeSelect.Root>
                                            <NativeSelect.Field
                                                value={form.tagType ?? "N"}
                                                onChange={(e) => onChange("tagType")(e)}
                                                css={{
                                                    backgroundColor: '#eee',
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
                                    </Field.Root> */}

                                    {/* <Field.Root flex={1}>
                                        <Field.Label>Item Type</Field.Label>
                                        <Input
                                            value={form.itemType ?? ""}
                                            onChange={onChange("itemType")}
                                        />
                                    </Field.Root> */}
                               {/* / </HStack> */}

                                {/* ACTIONS */}
                                <HStack justify="center" pt={4}>
                                    <Button
                                        size="sm"
                                        colorPalette="blue"
                                        onClick={handleSave}
                                        loading={creating || updating}
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
                <GridItem>
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

                        <Table.ScrollArea maxH="70vh">
                            <Table.Root size="sm" stickyHeader>
                                <Table.Header>
                                    <Table.Row bg="blue.800">
                                        <Table.ColumnHeader color="white">Item</Table.ColumnHeader>
                                        <Table.ColumnHeader color="white">Metal</Table.ColumnHeader>
                                        <Table.ColumnHeader color="white">Rate</Table.ColumnHeader>
                                        <Table.ColumnHeader color="white">Active</Table.ColumnHeader>
                                        <Table.ColumnHeader color="white" textAlign="center">
                                            Action
                                        </Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>

                                <Table.Body>
                                    {items.map((item) => (
                                        <Table.Row key={item.itemId} className={highlightId === item.itemId ? "blink-row" : ""} bg={theme.colors.primary}
                                            border="1px solid #eee">
                                            <Table.Cell>{item.itemName}</Table.Cell>
                                            <Table.Cell>{item.metalId}</Table.Cell>
                                            <Table.Cell>{item.pieceRate}</Table.Cell>
                                            <Table.Cell>
                                                {item.active === "Y" ? "YES" : "NO"}
                                            </Table.Cell>
                                            <Table.Cell  justifyItems="center">
                                              
                                                    <FiEdit width={4} 
                                                        height={4}
                                                    style={{ cursor: "pointer" }}
                                                        aria-label="Edit"
                                                        onClick={() => {
                                                            setEditingId(item.itemId!);

                                                            // Scroll to top
                                                            scrollToTop();

                                                           
                                                        }}  />
                                        

                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        </Table.ScrollArea>
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
}
