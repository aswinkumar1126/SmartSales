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
    For
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";
import { AiOutlineSave } from "react-icons/ai";
import { FaEdit } from "react-icons/fa";
import { IoIosExit } from "react-icons/io";

import { fontVariables } from "@/context/theme/font";
import { useTheme } from "@/context/theme/themeContext";

import {  useAllMetals, } from "@/hooks/metal/useMetals";
import { useUpdateMetal } from "@/hooks/metal/useUpdateMetal";
import { useCreateMetal } from "@/hooks/metal/useCreateMetal";
import { Metal } from "@/service/metalService";
import scrollToTop from "@/component/scroll/ScrollToTop";
import { toastError, toastLoaded } from '@/component/toast/toast'
import { Toaster } from "@/components/ui/toaster";
import { useMetalById } from "@/hooks/metal/useMetals";
import { CustomTable } from "@/component/table/CustomTable";


function MetalMaster() {
    const { theme } = useTheme();

    // Form state
    const [form, setForm] = useState<Partial<Metal>>({
        metalId: "",
        metalName: "",
        ttype: "M",
        displayOrder: 0,
        active: "Y",
    });

    const [isEdit, setIsEdit] = useState(false);
    const [editId ,setEditId] = useState('');
    const [ highlightId ,setHighLightedId] =useState<Number>();



    const { data: metals = [], refetch } = useAllMetals();
console.log(metals,"metaldata")


    const { data: metalsByID} = useMetalById(editId) ;
 

    // const metalDataById:any ;

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
    
   useEffect(()=>{
    if(!highlightId) {
        return;
    }
    const timer = setTimeout(() => {
        setHighLightedId(undefined);
    }, 3000);
    return () => clearTimeout(timer);
   })

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
                { id: form.metalId, metal: form as Metal },
                { onSuccess: () => { 
                    setHighLightedId(Number(form.metalId))
                    resetForm();
                     refetch(); } }
            );
        } else {
            createMutation.mutate(form as Metal, { onSuccess: () => { 
                resetForm(); 
                setHighLightedId(Number(form.metalId));
                refetch(); } });
        }
    };

    const handleEdit = (metal: Metal) => {
        toastLoaded("Metal");
        setIsEdit(true);
        setEditId(metal.metalId);
     
    };
    useEffect(() => {
        if (metalsByID && Object.keys(metalsByID).length > 0) {
            setForm({
                ...metalsByID,
                ttype: metalsByID.ttype || "M", // 👈 normalize
            });
        }
    }, [metalsByID]);


    const resetForm = () => {
        setForm({ metalId: "", metalName: "", ttype: "M", displayOrder: 0, active: "Y" });
        setIsEdit(false);
    };

    const metalColumns = [
        { key: "metalId", label: "Metal Id" },
        { key: "metalName", label: "Metal Name" },
        { key: "ttype", label: "Metal Type", align: "end" as const },
        { key: "displayOrder", label: "Order", align: "end" as const },
        { key: "active", label: "Active", align: "end" as const },
        { key: "actions", label: "Action", align: "center" as const },
    ];


    return (
        <Box
                   className={fontVariables}
                   fontFamily="var(--font-lustria)"
                   bg={theme.colors.primary}
                   color={theme.colors.secondary}
                
               >
                   <Toaster />
                   <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={2}>
                {/* LEFT – Form */}
                <GridItem display="flex" justifyContent="center" >
                     <VStack
                                           w="full"
                                           maxW="500px"
                                           bg={theme.colors.formColor}
                                           p={4}
                                           borderRadius="xl"
                                           border="1px solid #eef"
                                           boxShadow="0 0 30px rgba(212,212,212,0.2)"
                                       >
                                          
                        <Text fontSize="20px"  fontWeight="600">Metal Master</Text>

                        <Fieldset.Root size="lg" width="100%">
                            <Fieldset.Content>
                                <Field.Root>
                                    <Field.Label>Metal Id</Field.Label>
                                    <Input
                                        type="text"
                                        placeholder="Enter Metal Id"
                                        value={form.metalId || ""}
                                        onChange={(e) => handleChange("metalId", e.target.value)}
                                        disabled={isEdit} // cannot edit ID
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Metal Name</Field.Label>
                                    <Input
                                        placeholder="Enter Metal Name"
                                        value={form.metalName || ""}
                                        onChange={(e) => handleChange("metalName", e.target.value)}
                                    />
                                </Field.Root>

                              

                                <Field.Root>
                                    <Field.Label>Metal Type</Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field
                                            value={form.ttype}
                                            onChange={(e) => handleChange("ttype", e.target.value)}
                                            css={{
                                                backgroundColor: "#eee",
                                                color: "#111827",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "12px",
                                                height: "42px",
                                            }}
                                        >
                                            <option value="M">Metal</option>
                                            <option value="S">Stone</option>
                                            <option value="A">Alloy</option>
                                        </NativeSelect.Field>

                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Display Order</Field.Label>
                                    <Input
                                       
                                        value={form.displayOrder || 0}
                                        onChange={(e) => handleChange("displayOrder", parseInt(e.target.value))}
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Active</Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field
                                            value={form.active || "Y"}
                                            onChange={(e) => handleChange("active", e.target.value)}
                                            css={{
                                                backgroundColor: '#eee',
                                                color: "#111827",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "12px",
                                                height: "42px",
                                            }}
                                        >
                                            <For each={activeStatus.items}>
                                                {(item) => (
                                                    <option key={item.value} value={item.value}>{item.label}</option>
                                                )}
                                            </For>
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Field.Root>

                                <HStack pt={2} justifyContent="center">
                                    <Button size="sm" colorPalette="blue" onClick={handleSave}>
                                        <AiOutlineSave /> {isEdit ? "Update" : "Save"}
                                    </Button>
                                    <Button size="sm" colorPalette="blue" onClick={resetForm}>
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
                        <Text mb={2} fontWeight="bold" fontSize="lg">Metal List</Text>

                        <Stack gap="10">
                           <CustomTable
                                                columns={metalColumns}
                                                  data={metals}
                                                  size="sm"
                                                  headerBg='blue.800'
                                                  bodyBg = {theme.colors.primary}
                                                  headerColor='white'
                                                  rowIdKey="metalId"
                                                  highlightRowId={highlightId ? Number(highlightId) : null}
                                                  emptyText="No parties available"
                                                  renderRow={(metal, i) => (
                                                      <>
                                                          <Table.Cell>{metal.metalId}</Table.Cell>
                                                          <Table.Cell>{metal.metalName}</Table.Cell>
                                                          <Table.Cell textAlign="center">{metal.ttype}</Table.Cell>
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
