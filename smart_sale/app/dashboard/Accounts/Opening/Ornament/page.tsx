"use client";

import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Input,
    VStack,
    Text,
    Grid,
    GridItem,
    HStack,
    Fieldset,
    Field,
    NativeSelect,
    Select,
    Portal,
    createListCollection
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";
import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";
import { FaEdit } from "react-icons/fa";

import { Toaster } from "@/components/ui/toaster";
import ScrollToTop from "@/component/scroll/ScrollToTop";
import { toastCreated, toastLoaded, toastUpdated } from "@/component/toast/toast";

import { useTheme } from "@/context/theme/themeContext";
import { fontVariables } from "@/context/theme/font";
import { ItemMast } from "@/types/item/item";
import { normalizeItem } from "@/utils/normalize/normalizeItem";
import { useItems } from "@/hooks/item/useItems";
import {
    useOrnamentData,
    useOrnamentDataById,
    useCreateOrnament,
    useUpdateOrnament,
} from "@/hooks/ornament/useOrnamentData";

import { OrnamentPayload ,OrnamentFormData } from "@/types/ornament/ornament";
import { formatToFixed } from "@/utils/format/numberFormat";
import { parseFixedNumber } from "@/utils/format/numberInput";
import { CustomTable } from "@/component/table/CustomTable";


function OrnamentMaster() {
    const { theme } = useTheme();

    /* -------------------- DATA -------------------- */
    const { data: itemsData } = useItems();

    const { data: ornamentList, isLoading } = useOrnamentData();

    const ornaments = Array.isArray(ornamentList?.data)
        ? ornamentList.data
        : [];
    const items: ItemMast[] = (itemsData?.items ?? []).map(normalizeItem);
    console.log(items, 'items')
    /* -------------------- FORM STATE -------------------- */
    const [form, setForm] = useState<OrnamentFormData>({
        itemId:  "",   // ✅ NOT null
        pcs: "",
        grswt: "",
        netwt: "",
        touch: "",
        pure: "",
        openCash:"",
        stoneCash:"",
    });
    const [higlightedId, setHiglightedId] =useState<Number>();


    const [editId, setEditId] = useState<number | null>(null);
    console.log(editId ,'editId')
    /* -------------------- EDIT FETCH -------------------- */
    const { data: editResponse } = useOrnamentDataById(editId!);

    /* -------------------- MUTATIONS -------------------- */
    const { mutate: createOrnament, isPending } = useCreateOrnament();
    const { mutate: updateOrnament, isPending: isUpdating } = useUpdateOrnament();


    /* -------------------- EFFECT: LOAD EDIT DATA -------------------- */
    useEffect(() => {
        if (!editResponse?.data) return;

        const o = editResponse.data;

        setForm({
            itemId: String(o.itemId) || "",
            pcs: String(o.pcs) || "",
            grswt: String(o.grswt) || "",
            netwt: String(o.netwt) || "",
            touch: String(o.touch) || "",
            pure: String(o.pure) || "",
            openCash: String(o.openCash) || "",
            stoneCash: String(o.stoneCash) || "",
        });
    }, [editResponse]);

    const itemCollection = createListCollection({
        items: items.map((item: any) => ({
            label: item.itemName,       // what user sees
            value: String(item.itemId), // MUST be string
        })),
    });
    /* -------------------- HELPERS -------------------- */
    const handleChange =
        (field: keyof OrnamentFormData) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                setForm(prev => ({
                    ...prev,
                    [field]: e.target.value,
                }));
            };


    const toPayload = (form: OrnamentFormData): OrnamentPayload => ({
        itemId: Number(form.itemId),
        pcs: Number(form.pcs),
        grswt: Number(form.grswt),
        netwt: Number(form.netwt),
        touch: Number(form.touch),
        pure: Number(form.pure),
        openCash: Number(form.openCash),
        stoneCash: Number(form.stoneCash),
    });

    const resetForm = () => {
        setEditId(null);
        setForm({
            itemId: "",
            pcs: "",
            grswt:"",
            netwt: "",
            touch: "",
            pure: "",
            openCash: "",
            stoneCash: "",
        });
    };

    useEffect(() => {
   if(!higlightedId) {
    return;
   }
    const timer = setTimeout(() => {
        setHiglightedId(undefined);
    }, 3000); // Highlight for 3 seconds
    return () => clearTimeout(timer);

    }, [higlightedId]);
    
    /* -------------------- SAVE -------------------- */
    const handleSave = () => {
        const payload = toPayload(form);

        if (editId) {
            updateOrnament(
                { id: editId, ornamentData: payload },
                { onSuccess:()=> {
                    resetForm;
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
       

        setEditId(ornament.sno); // ✅ IMPORTANT: SNO
        ScrollToTop();
        toastLoaded("Ornament");
    };

    /*----------Table Columns ---------- */

    const OrnamentTableColumn =[
        {key:'sno' , label:'S.NO'},
        {key:'itemId' , label:'Item Id'},
        {key:'itemName' , label:'Item Name'},
        {key:'pcs' , label:'Pcs'},
        {key:'action' , label:'Actions'},
    ]





    /* -------------------- UI -------------------- */
    return (
        <Box
            className={fontVariables}
            fontFamily="var(--font-lustria)"
            bg={theme.colors.primary}
            color={theme.colors.secondary}
        >
            <Toaster />

            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={4}>
                {/* ---------------- FORM ---------------- */}
                <GridItem>
                    <VStack
                        bg={theme.colors.formColor}
                        p={4}
                        borderRadius="xl"
                        border="1px solid #eef"
                    >
                        <Text fontSize="lg" fontWeight="600">
                            Ornament Opening
                        </Text>

                        <Fieldset.Root size="sm" width="100%">
                            <Fieldset.Content>
                                <Grid templateColumns="repeat(2,1fr)" gap={3}>
                                    <Field.Root>
                                        <Field.Label>Item Name</Field.Label>

                                        <Select.Root
                                            collection={itemCollection}
                                            size="sm"
                                            value={form.itemId ? [form.itemId] : []}
                                            onValueChange={(details) =>
                                                setForm(prev => ({
                                                    ...prev,
                                                    itemId: details.value[0] || ""
                                                }))
                                            }
                                        >
                                            <Select.HiddenSelect />

                                            <Select.Control>
                                                <Select.Trigger>
                                                    <Select.ValueText placeholder="Select Item" />
                                                </Select.Trigger>
                                                <Select.IndicatorGroup>
                                                    <Select.Indicator />
                                                </Select.IndicatorGroup>
                                            </Select.Control>

                                            <Portal>
                                                <Select.Positioner>
                                                    <Select.Content>
                                                        {itemCollection.items.map((item:any) => (
                                                            <Select.Item key={item.value} item={item}>
                                                                {item.label}
                                                                <Select.ItemIndicator />
                                                            </Select.Item>
                                                        ))}
                                                    </Select.Content>
                                                </Select.Positioner>
                                            </Portal>
                                        </Select.Root>
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Pieces</Field.Label>
                                        <Input
                                            value={form.pcs}
                            
                                            onChange={handleChange("pcs")}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Gross Wt</Field.Label>
                                        <Input
                                         
                                            value={form.grswt}
                                            onChange={handleChange("grswt")}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Net Wt</Field.Label>
                                        <Input
                                         
                                            value={form.netwt}
                                            onChange={handleChange("netwt")}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Touch</Field.Label>
                                        <Input
                                     
                                            value={form.touch}
                                            onChange={handleChange("touch")}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Pure</Field.Label>
                                        <Input
                                           
                                            value={form.pure}
                                            onChange={handleChange("pure")}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Stone Cash</Field.Label>
                                        <Input
                                        
                                            value={form.stoneCash}
                                            onChange={handleChange("stoneCash")}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Open Cash</Field.Label>
                                        <Input
                                          
                                            value={form.openCash}
                                            onChange={handleChange("openCash")}
                                        />
                                    </Field.Root>
                                </Grid>
                            </Fieldset.Content>
                        </Fieldset.Root>

                        <HStack pt={3}>
                            <Button
                                size="sm"
                                colorPalette="blue"
                                loading={isPending || isUpdating}
                                onClick={handleSave}
                            >
                                <AiOutlineSave /> {editId ? "Update" : "Save"}
                            </Button>
                            <Button size="sm"  colorPalette="blue" onClick={resetForm}>
                                <IoIosExit /> Clear
                            </Button>
                        </HStack>
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
                        <Text fontWeight="bold" mb={2}>
                            Ornament Details
                        </Text>

                        {/* <Table.ScrollArea>
                            <Table.Root size="sm">
                                <Table.Header>
                                    <Table.Row bg="blue.800">
                                        <Table.ColumnHeader color="white">
                                            S.No
                                        </Table.ColumnHeader>
                                        <Table.ColumnHeader color="white">
                                            Item Id
                                        </Table.ColumnHeader>
                                        <Table.ColumnHeader color="white">
                                            Item Name
                                        </Table.ColumnHeader>
                                        <Table.ColumnHeader color="white">
                                            Pcs
                                        </Table.ColumnHeader>
                                        <Table.ColumnHeader color="white">
                                            Action
                                        </Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>

                                <Table.Body>
                                    {isLoading ? (
                                        <Table.Row>
                                            <Table.Cell colSpan={5}>
                                                Loading...
                                            </Table.Cell>
                                        </Table.Row>
                                    ) : (
                                        ornaments.map((item: any, index: number) => (
                                            <Table.Row key={item.sno}>
                                                <Table.Cell>{index + 1}</Table.Cell>
                                                <Table.Cell>{item.itemId}</Table.Cell>
                                                <Table.Cell>{item.itemName}</Table.Cell>
                                                <Table.Cell>{item.pcs}</Table.Cell>
                                                <Table.Cell>
                                                    <FaEdit
                                                        cursor="pointer"
                                                        onClick={() => handleEdit(item)}
                                                    />
                                                </Table.Cell>
                                            </Table.Row>
                                        ))
                                    )}
                                </Table.Body>
                            </Table.Root>
                        </Table.ScrollArea> */}
                        <CustomTable 
                            columns={OrnamentTableColumn}
                            data={ornaments}
                            size="sm"
                            headerBg='blue.800'
                            bodyBg={theme.colors.primary}
                            headerColor='white'
                            emptyText="No Ornaments available"
                            rowIdKey='sno'
                            highlightRowId={higlightedId ? Number(higlightedId) : null}
                            renderRow={(ornament: any, index: number)=>(
                                <>
                                 <Table.Cell>{index + 1}</Table.Cell>
                                    <Table.Cell>{ornament.itemId}</Table.Cell>
                                    <Table.Cell>{ornament.itemName}</Table.Cell>
                                                <Table.Cell>{ornament.pcs}</Table.Cell>
                                                <Table.Cell>
                                                    <FaEdit
                                                        cursor="pointer"
                                                        onClick={() => handleEdit(ornament)}
                                                    />
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

export default OrnamentMaster;
