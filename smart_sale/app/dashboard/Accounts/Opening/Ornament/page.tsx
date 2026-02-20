"use client";

import React, { useEffect, useState ,useMemo} from "react";
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
    createListCollection,
    Flex,

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
import { usePrint } from "@/context/print/usePrintContext";
import { OrnamentPayload ,OrnamentFormData } from "@/types/ornament/ornament";
import { formatToFixed } from "@/utils/format/numberFormat";
import { parseFixedNumber } from "@/utils/format/numberInput";
import { CustomTable } from "@/component/table/CustomTable";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { toastError } from "@/component/toast/toast";
import { useRouter } from "next/navigation";
import { FaFileExcel ,FaPrint } from "react-icons/fa";
import { SelectCombobox } from "@/components/ui/selectComboBox";
import SearchBar from "@/component/search/SearchBar";

function OrnamentMaster() {
    const { theme } = useTheme();
    const router = useRouter();
    type OrnamentErrors = Partial<Record<keyof typeof form, string>>;

    const [errors, setErrors] = React.useState<OrnamentErrors>({});

    /* -------------------- DATA -------------------- */
    const { data: itemsData } = useItems();
    const { setData ,setColumns ,setShowSno ,title } = usePrint();

    const [filter ,setFilter] = useState<string>('');

    const { data: ornamentList, isLoading } = useOrnamentData(filter);


    const ornaments = Array.isArray(ornamentList?.data)
        ? ornamentList.data
        : [];
    const items: ItemMast[] = useMemo(() => {
        return (itemsData?.items ?? []).map(normalizeItem);
    }, [itemsData?.items]);
    
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
    const [itemCollection ,setItemCollection] = useState<{label:string , value:string}[]>([])


    const [editId, setEditId] = useState<number | null>(null);

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

    useEffect(() => {
        if (!Array.isArray(items)) return;

        const collection = items.map((item: any) => ({
            label: item.itemName,
            value: String(item.itemId),
        }));

        setItemCollection(collection);
    }, [items]);

/* -------------------- EFFECTS: CALCULATE NET WT & PURE -------------------- */
useEffect(() => {
    // Calculate Net Wt automatically
    const grswt = parseFloat(form.grswt ?? "") || 0;
    const stnwt = parseFloat(form.stnwt ?? "") || 0;
    const netwt = grswt - stnwt;

    // Calculate Pure automatically based on Actual Touch
    const touch = parseFloat(form.touch ?? "") || 0;
    const purewt = (netwt * touch)/100;



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
        {key:'itemName' , label:'Item Name'},
        {key:'pcs' , label:'Pcs' ,align:'end' as const},
        {key:'grswt' , label:'Grs Wt' ,align:'end' as const},
        {key:'stnwt' , label:'Stone Wt' ,align:'end' as const},
        {key:'netwt' , label:'Net Wt' ,align:'end' as const},
        {key:'touch' , label:'Touch' ,align:'end' as const},
        {key:'pure' , label:'Pure' ,align:'end' as const},
        {key:'stoneCash' , label:'StoneCash' ,align:'end' as const},
        {key:'action' , label:'Actions' , align: 'center' as const},
    ]
    

    /*----------Print ---------- */
    const handleExport = (option:string)=>{
        setData(ornaments);
        setColumns([
            {key:'itemName' ,label:'Item Name' },
            {key:'pcs' ,label:'Pieces' ,align:'end' as const , allowTotal:true},
            { key: 'grswt', label: 'Gross Weight', align: 'end' as const,allowTotal:true },
            { key:'netwt' , label:'Net Weight' , align:'end' as const,allowTotal:true },
            { key: 'stnwt', label: 'Stone Weight', align: 'end' as const ,allowTotal:true},
        ])
        title?.("Ornament Opening List")
        router.push(`/print?export=${option}`);
    }




    /* -------------------- UI -------------------- */
    return (
        <Box
           fontWeight='semibold'
            bg={theme.colors.primary}
            color={theme.colors.secondary}
        >
            <Toaster />

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
                                <Grid  gap={2}>

                                    {/* ITEM NAME */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">ITEM NAME :</Box>
                                        <SelectCombobox 
                                             items={itemCollection}
                                             value={form.itemId}
                                             onChange={(value) => handleChange("itemId", value)}
                                             placeholder="select item"               

                                        />
                                    </Box>

                                    {/* PIECES */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">PIECES :</Box>
                                        <CapitalizedInput
                                            field="pcs"
                                            value={form.pcs}
                                            onChange={handleChange}
                                            type="number"
                                            size="2xs"
                                        />
                                    </Box>

                                    {/* GROSS WT */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">GROSS WT :</Box>
                                        <CapitalizedInput
                                            field="grswt"
                                            value={form.grswt}
                                            onChange={handleChange}
                                            type="number"
                                            size="2xs"
                                        />
                                    </Box>

                                    

                                    {/* STONE WT */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">STONE WT :</Box>
                                        <CapitalizedInput
                                            field="stnwt"
                                            value={form.stnwt}
                                            onChange={handleChange}
                                            type="number"
                                            size="2xs"
                                        />
                                    </Box>

                                    {/* NET WT */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">NET WT :</Box>
                                        <CapitalizedInput
                                            field="netwt"
                                            value={form.netwt}
                                            onChange={handleChange}
                                            type="number"
                                            size="2xs"
                                            disabled
                                        />
                                    </Box>

                                    {/* TOUCH */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">TOUCH :</Box>
                                        <CapitalizedInput
                                            field="touch"
                                            value={form.touch}
                                            onChange={handleChange}
                                            type="number"
                                            size="2xs"
                                        />
                                    </Box>
                                    {/* PURE */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">PURE :</Box>
                                        <CapitalizedInput
                                            field="pure"
                                            value={form.pure}
                                            onChange={handleChange}
                                            type="number"
                                            size="2xs"
                                            disabled
                                        />
                                    </Box>

                                    {/* STONE CASH */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">STONE CASH :</Box>
                                        <CapitalizedInput
                                            field="stoneCash"
                                            value={form.stoneCash}
                                            onChange={handleChange}
                                            type="number"
                                            size="2xs"
                                        />
                                    </Box>

                                    {/* OPEN CASH */}
                                    {/* <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">OPEN CASH :</Box>
                                        <CapitalizedInput
                                            field="openCash"
                                            value={form.openCash}
                                            onChange={handleChange}
                                            type="number"
                                            size="2xs"
                                        />
                                    </Box> */}


                                    {/* ACTUAL TOUCH */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">ACTUAL TOUCH :</Box>
                                        <CapitalizedInput
                                            field="actualtouch"
                                            value={form.actualtouch}
                                            onChange={handleChange}
                                            type="number"
                                            size="2xs"

                                        />
                                    </Box>

                                </Grid>

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
                                        <IoIosExit /> Clear
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
                                    <Table.Cell>{ornament.itemName}</Table.Cell>
                                                <Table.Cell textAlign='end'>{ornament.pcs}</Table.Cell>
                                                <Table.Cell textAlign='end'>{ornament.grswt}</Table.Cell>
                                                <Table.Cell textAlign='end'>{ornament.stnwt}</Table.Cell>
                                                <Table.Cell textAlign='end'>{ornament.netwt}</Table.Cell>
                                                <Table.Cell textAlign='end'>{ornament.touch}</Table.Cell>
                                                <Table.Cell textAlign='end'>{ornament.pure}</Table.Cell>
                                                <Table.Cell textAlign='end'>{ornament.stoneCash}</Table.Cell>
                                                <Table.Cell>
                                                <Box display='flex' justifyContent='center'>
                                                <FaEdit
                                                cursor="pointer"
                                                onClick={() => handleEdit(ornament)}
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

export default OrnamentMaster;
