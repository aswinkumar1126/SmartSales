"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Input,
    VStack,
    Text,
    Grid,
    GridItem,
    HStack,
    Stack,
    Fieldset,
    Field,
    NativeSelect,
    createListCollection,
    For,
    Flex
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";
import { AiOutlineSave } from "react-icons/ai";
import { FaEdit } from "react-icons/fa";
import { IoIosExit } from "react-icons/io";

import { fontVariables } from "@/context/theme/font";
import { useTheme } from "@/context/theme/themeContext";

import { useAllMetals, useMetalBySno } from "@/hooks/metal/useMetals";
import { useUpdateMetal } from "@/hooks/metal/useUpdateMetal";
import { useCreateMetal } from "@/hooks/metal/useCreateMetal";
import { Metal, MetalData } from "@/service/metalService";
import scrollToTop from "@/component/scroll/ScrollToTop";
import { toastError, toastLoaded } from '@/component/toast/toast'
import { Toaster } from "@/components/ui/toaster";

import { CustomTable } from "@/component/table/CustomTable";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { usePrint } from "@/context/print/usePrintContext";
import { useRouter } from "next/navigation";
import { FaPrint ,FaFileExcel } from "react-icons/fa";
import { usePureGoldData } from "@/hooks/pureGoldMast/usePureGoldMastData";
import { SelectCombobox } from "@/components/ui/selectComboBox";
import { safeValue } from "@/utils/comboBox/safeValue";


function MetalMaster() {
    const { theme } = useTheme();
    const router = useRouter();

    // Form state
    const [form, setForm] = useState<Partial<Metal>>({
        metalId: "",
        metalName: "",
        metalType: "M",
        displayOrder: 1,
        active: "Y",
        weight:"",
        touch:"",
        pure:""
    });

    

    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [ highlightId ,setHighLightedId] =useState<String>();
    const [pureGoldCollection, setPureGoldCollection] = useState<any[]>([]);

    const { data: metals = [], refetch } = useAllMetals();
    const { data: pureGold } = usePureGoldData();

    console.log(pureGold,'pureGold');

   

    useEffect(() => {
            if (!pureGold?.length) return;
    
            const mapped = pureGold.map((p: any) => ({
                label: p.pureGoldName,
                value: String(p.sno),
            }));
    
            setPureGoldCollection(mapped);
    }, [pureGold]);

    useEffect(() => {
        if (!metals || metals.length === 0) return;

        setForm(prev => ({
            ...prev,
            displayOrder: metals.length + 1,
        }));
    }, [metals]);

    const { data: metalBySno, refetch: refetchMetalBySno } = useMetalBySno(editId);
 

    const { setData ,setColumns , setShowSno} = usePrint();

    const createMutation = useCreateMetal();
    const updateMutation = useUpdateMetal();

    const activeStatus = createListCollection({
        items: [
            { label: "YES", value: "Y" },
            { label: "NO", value: "N" },
        ],
    });
   

    const handleChange = (field: keyof Metal, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };
    
    useEffect(() => {
        if (!highlightId) return;

        const timer = setTimeout(() => {
            setHighLightedId(undefined);
        }, 3000);

        return () => clearTimeout(timer);
    }, [highlightId]);





    const handleSave = () => { 
        if (!form.metalId) {
            toastError("Metal ID is required");
            return;
        }

        if (!form.metalName?.trim()) {
            toastError("Metal name is required");
            return;
        }

        // 🔹 Check if metalId already exists when creating new
        if (!isEdit && metals.some(m => m.metalId === form.metalId)) {
            toastError(`Metal ID "${form.metalId}" already exists`);
            return; // prevent save
        }

        if (isEdit && form.metalId ) {
            
            updateMutation.mutate(
                { sno: Number(form.sno), metal: form as Metal },
                { onSuccess: () => { 
                    setHighLightedId(String(form.sno))
                    resetForm();
                   } }
            );
        } else {
            createMutation.mutate(form as Metal, { onSuccess: () => { 
                resetForm(); 
                setHighLightedId(String(form.metalId));
              } });
        }
    };

    const handleEdit = (metal:Metal) => {
       
        setIsEdit(true);
        setEditId( metal.sno || null );
        refetchMetalBySno();
     
    };

    useEffect(() => {
        if (metalBySno?.data && Object.keys(metalBySno?.data).length > 0) {
        
            setForm({
                ...metalBySno?.data,
                metalType: metalBySno?.data?.metalType || "", // 👈 normalize
            });
        }
    }, [metalBySno]);


    const resetForm = () => {
        setIsEdit(false);
        setForm({   
            metalId: "", 
            metalName: "", 
            metalType: "M", 
            displayOrder: Number(metals.length + 1), 
            active: "Y",
            weight:"",
            touch:"",
            pure:""
         });
        setEditId(null);
    };

    const metalColumns = [
        { key: "metalId", label: "Metal Id" },
        { key: "metalName", label: "Metal Name" },
        { key: "metalType", label: "Metal Type", align: "end" as const },
        { key: "displayOrder", label: "Order", align: "end" as const },
        { key: "active", label: "Active", align: "end" as const },
        { key: "actions", label: "Action", align: "center" as const },
    ];
    const handleExport = (option:string) => {
        setData(metals);
        setColumns([{key:'metalId',label:'Metal Id'},
            {key:'metalName',label:'Metal Name'},
            {key:'metalType',label:'Metal Type'},
            {key:'displayOrder',label:'Order'},
           ]);
        setShowSno(true);
        router.push(`/print?export=${option}`);

   
    };


    return (
        <Box
                   className={fontVariables}
                   bg={theme.colors.primary}
                   color={theme.colors.secondary}
                   fontWeight='semibold'
                   
                
               >
                   <Toaster />
                   <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={2}>
                {/* LEFT – Form */}
                <GridItem display="flex" justifyContent="center">
                    <VStack
                        w="full"
                        bg={theme.colors.formColor}
                        p={4}
                        borderRadius="xl"
                        border="1px solid #eef"
                        boxShadow="0 0 30px rgba(212,212,212,0.2)"
                    >
                        <Text fontSize="medium" fontWeight="600">METAL MASTER</Text>

                        <Fieldset.Root size="sm" width="100%">
                            <Fieldset.Content>
                                <Grid css={{ sm:{gridTemplateColumns: "repeat(1, 1fr)"}, md: {gridTemplateColumns: "repeat(2, 1fr)"}}} gap={3}>

                                    {/* METAL ID */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">METAL ID :</Box>
                                        <CapitalizedInput
                                            type="text"
                                            field="metalId"
                                            placeholder="Enter Id"
                                            value={form.metalId || ""}
                                            onChange={handleChange}
                                            disabled={isEdit}
                                            max={1}
                                            size="2xs"
                                            maxWidth="80px"
                                        />
                                    </Box>

                                    {/* METAL NAME */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">METAL NAME :</Box>
                                        <CapitalizedInput
                                            field="metalName"
                                            placeholder="Enter Metal Name"
                                            value={form.metalName || ""}
                                            onChange={handleChange}
                                            size="2xs"
                                        />
                                    </Box>

                                    {/* METAL TYPE */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">METAL TYPE :</Box>
                                        <SelectCombobox
                                            value={safeValue(form.metalType, pureGoldCollection) || ""}
                                            onChange={(val) => handleChange("metalType", val || "")}
                                            editId={Number(editId)}
                                            items={pureGoldCollection}
                                            placeholder="Select Type"
                                        />
                                    </Box>

                                    {/* DISPLAY ORDER */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">DISPLAY ORDER :</Box>
                                        <CapitalizedInput
                                            field="displayOrder"
                                            placeholder="Enter displayOrder"
                                            value={String(form.displayOrder || "")}
                                            onChange={handleChange}
                                            size="2xs"
                                            type="number"
                                       


                                        />
                                    </Box>

                                    {/* WEIGHT */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">WEIGHT :</Box>
                                        <CapitalizedInput
                                            field="weight"
                                            placeholder="Enter Weight"
                                            value={form.weight || ""}
                                            onChange={handleChange}
                                            size="2xs"
                                            type="number"
                                            max={999}

                                        />
                                    </Box>

                                    {/* TOUCH */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">TOUCH :</Box>
                                        <CapitalizedInput
                                            field="touch"
                                            placeholder="Enter Touch"
                                            value={form.touch || ""}
                                            onChange={handleChange}
                                            size="2xs"
                                            type="number"
                                            max={999}
                                            decimalScale={2}
                                        />
                                    </Box>

                                    {/* PURE */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">PURE :</Box>
                                        <CapitalizedInput
                                            field="pure"
                                            placeholder="Enter Pure"
                                            value={form.pure || ""}
                                            onChange={handleChange}
                                            size="2xs"
                                            type="number"
                                            max={999}
                                        />
                                    </Box>

                                    {/* ACTIVE */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="80px" fontSize="2xs">ACTIVE :</Box>
                                        <NativeSelect.Root size="xs" minW="50px" maxW="80px" fontSize="2xs" >
                                            <NativeSelect.Field
                                                value={form.active || "Y"}
                                                onChange={(e) => handleChange("active", e.target.value)}
                                                css={{
                                                    backgroundColor: "#eee",
                                                    color: "#111827",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "20px",
                                                    height: "30px",
                                                    fontSize: "10px",
                                                }}
                                            >
                                                <For each={activeStatus.items}>
                                                    {(item) => (
                                                        <option key={item.value} value={item.value}>
                                                            {item.label}
                                                        </option>
                                                    )}
                                                </For>
                                            </NativeSelect.Field>
                                            <NativeSelect.Indicator />
                                        </NativeSelect.Root>
                                    </Box>

                                </Grid>

                                {/* BUTTONS */}
                                <HStack pt={4} justifyContent="center">
                                    <Button size="xs" colorPalette="blue" onClick={handleSave}>
                                        <AiOutlineSave /> {isEdit ? "Update" : "Save"}
                                    </Button>
                                    <Button size="xs" colorPalette="blue" onClick={resetForm}>
                                        Exit <IoIosExit />
                                    </Button>
                                </HStack>

                            </Fieldset.Content>
                        </Fieldset.Root>

                    </VStack>
                </GridItem>


                {/* RIGHT – Table */}
                <GridItem minW={0}>
                    <Box
                                           p={4}
                                           borderRadius="xl"
                                           bg={theme.colors.formColor}
                                           border="1px solid #eef"
                                           boxShadow="0 0 30px rgba(212,212,212,0.2)"
                        
                                       >
                        <Box display='flex'  mb={4} gap={3} justifyContent='space-between' alignItems='center'>
                            <Text mb={2} fontWeight="bold" fontSize="lg">Metal List</Text>
                             <Flex gap={1}>
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
                       

                        <Stack gap="10">
                           <CustomTable
                                                columns={metalColumns}
                                                  data={metals}
                                                  size="sm"
                                                  headerBg='blue.800'
                                                  bodyBg = {theme.colors.primary}
                                                  headerColor='white'
                                                  rowIdKey="sno"
                                                  highlightRowId={highlightId ? Number(highlightId) : null}
                                                  emptyText="No parties available"
                                                  renderRow={(metal, i) => (
                                                      <>
                                                          <Table.Cell>{metal.sno}</Table.Cell>
                                                          <Table.Cell>{metal.metalName}</Table.Cell>
                                                          <Table.Cell textAlign="center">{metal.metalType}</Table.Cell>
                                                          <Table.Cell textAlign="center">{metal.displayOrder}</Table.Cell>
                                                          <Table.Cell textAlign="center">{metal.active}</Table.Cell>
                                                          <Table.Cell>
                                                              <Box display="flex" justifyContent="center">
                                                                  <FaEdit onClick={() => handleEdit(metal)} cursor="pointer" />
                                                              </Box>
                                                          </Table.Cell>
                                                      </>
                                                  )}
                          
                                              />
                        </Stack>
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
}

export default MetalMaster;
