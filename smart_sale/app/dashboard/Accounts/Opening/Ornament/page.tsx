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
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { toastError } from "@/component/toast/toast";



function OrnamentMaster() {
    const { theme } = useTheme();

    type OrnamentErrors = Partial<Record<keyof typeof form, string>>;

    const [errors, setErrors] = React.useState<OrnamentErrors>({});

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
        stnwt: "",
        openCash:"",
        stoneCash:"",
        actualtouch:"",
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
        console.log(o , 'ornament')

        setForm({
            itemId:o.itemId ? String(o.itemId) : "",
            pcs: o.pcs ? String(o.pcs) : "",
            grswt: o.grswt? String(o.grswt) : "",
            netwt: o.netwt ? String(o.netwt) : "",
            touch: o.touch ? String(o.touch) : "",
            pure: o.pure ? String(o.pure) : "",
            stnwt: o.stnwt ? String(o.stnwt) : "",
            openCash: o.openCash ?  String(o.openCash) : "",
            stoneCash: o.stoneCash ?  String(o.stoneCash) : "",
            actualtouch: o.actualtouch ? String(o.actualtouch) :"",
        });
    }, [editResponse]);

    const itemCollection = createListCollection({
        items: items.map((item: any) => ({
            label: item.itemName,       // what user sees
            value: String(item.itemId), // MUST be string
        })),
    });
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
        pure: Number(form.pure),
        stnwt: Number(form.stnwt),
        openCash: Number(form.openCash),
        stoneCash: Number(form.stoneCash),
        actualtouch: Number(form.actualtouch),
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
            stnwt: "",
            openCash: "",
            stoneCash: "",
            actualtouch:"",
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

    /* -------------------- VALIDATION -------------------- */
    const validateForm = () => {
        if (!form.itemId) return toastError("Item is required");
        if (!form.pcs || Number(form.pcs) <= 0) return toastError("Pieces must be greater than 0");
        if (!form.grswt || Number(form.grswt) <= 0) return toastError("Gross weight must be greater than 0");
        if (!form.netwt || Number(form.netwt) <= 0) return toastError("Net weight must be greater than 0");
        if (form.pure !== undefined && Number(form.pure) < 0) return toastError("Pure cannot be negative");
        if (form.touch !== undefined && Number(form.touch) < 0) return toastError("Touch cannot be negative");
        if (form.actualtouch !== undefined && Number(form.actualtouch) < 0) return toastError("Actual touch cannot be negative");
        if (form.stnwt !== undefined && Number(form.stnwt) < 0) return toastError("Stone weight cannot be negative");
        if (form.stoneCash !== undefined && Number(form.stoneCash) < 0) return toastError("Stone cash cannot be negative");
        if (form.openCash !== undefined && Number(form.openCash) < 0) return toastError("Open cash cannot be negative");

        return true; // all valid
    };
    /* -------------------- SAVE -------------------- */
    const handleSave = () => {

        if (!validateForm()) return; // ⛔ stop here
        const payload = toPayload(form);



        if (editId) {
            updateOrnament(
                { id: editId, ornamentData: payload },
                { onSuccess:()=> {
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
                                        <CapitalizedInput
                                            field="pcs"
                                            value={form.pcs}
                                            onChange={handleChange}
                                            type="number"
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Gross Wt</Field.Label>
                                        <CapitalizedInput
                                            field="grswt"
                                            type="number"
                                            value={form.grswt}
                                            onChange={handleChange}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Net Wt</Field.Label>
                                        <CapitalizedInput
                                            field="netwt"
                                            type="number"
                                            value={form.netwt}
                                            onChange={handleChange}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Stone Wt</Field.Label>
                                        <CapitalizedInput
                                                field="stnwt"
                                                value={form.stnwt}
                                            onChange={handleChange}
                                            type="number"
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Pure</Field.Label>
                                        <CapitalizedInput
                                            field="pure"
                                            value={form.pure}
                                            onChange={handleChange}
                                            type="number"
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Stone Cash</Field.Label>
                                        <CapitalizedInput
                                            field="stoneCash"
                                            type="number"
                                            value={form.stoneCash}
                                            onChange={handleChange}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Open Cash</Field.Label>
                                        <CapitalizedInput
                                            field="openCash"
                                            type="number"
                                            value={form.openCash}
                                            onChange={handleChange}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Touch</Field.Label>
                                        <CapitalizedInput
                                            field="touch"
                                            type="number"
                                            value={form.touch}
                                            onChange={handleChange}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Actual Touch</Field.Label>
                                        <CapitalizedInput
                                        field="actualtouch"
                                             type="number"       
                                            value={form.actualtouch}
                                            onChange={handleChange}
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
