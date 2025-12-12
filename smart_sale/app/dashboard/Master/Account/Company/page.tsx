"use client";

import React, { useState } from "react";
import {
    Box,
    Button,
    Input,
    VStack,
    Text,
    Grid,
    GridItem,
    Flex,
    InputGroup,
    IconButton,
    HStack,
    Portal,
    createListCollection,
    For,
    Stack,
    Fieldset,
    Field,
    NativeSelect,
    Textarea
} from "@chakra-ui/react";
import { } from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";
import Image from "next/image";
import { useTheme } from "@/context/theme/themeContext";
import { fontVariables } from "@/context/theme/font";
import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";

  function MetalMaster(){


      const { theme } = useTheme();
    
        const [showPassword, setShowPassword] = useState(false);
        const [imagePreview, setImagePreview] = useState<string | null>(null);
    
        const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) setImagePreview(URL.createObjectURL(file));
        };
    
        // Dummy table data
        const dummyCompany = [
            { id: 1, companyId : "567", companyName: "Company1", GSTIN:'DFREF231DVF2', costName:"", active: "YES" },
            { id: 2, companyId : "509", companyName: "Company2", GSTIN:'GHREF412SDGF', costName:"", active: "YES" },
            { id: 3, companyId : "156", companyName: "Company3", GSTIN:'HYEF232SDVHG', costName:"", active: "YES" },
       
        ];
    
        // ACTIVE STATUS SELECT LIST
        const activeStatus = createListCollection({
            items: [
                { label: "YES", value: "Y" },
                { label: "NO", value: "N" }
            ]
        });


    return(
        <Box
            className={fontVariables}
            fontFamily="var(--font-lustria)"
            bg={theme.colors.primary}
            color={theme.colors.secondary}

        >
            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={2}>

                {/* LEFT SECTION – USER FORM */}

                <GridItem display="flex" justifyContent="center">
                    <VStack
                        w="full"
                        // maxW="500px"
                        bg="white"
                        p={4}
                        borderRadius="xl"
                        border="1px solid #eef"
                        boxShadow="0 0 30px rgba(212,212,212,0.2)"
                    >
                     
                        <Text
                            fontSize="20px"
                            color="blue.800"
                            // textShadow="0 0 10px gray"
                            fontWeight="600"
                            mb={2}
                        >
                           Company Creation
                        </Text>
                   
                      
                        <Fieldset.Root size="lg" width="100%">
                            <Fieldset.Content>
                                {/* USER NAME */}
                                <Grid templateColumns="repeat(2, 1fr)" gap="2">
                                    <GridItem colSpan={1}>
                                        <Field.Root>
                                            <Field.Label>Company Id</Field.Label>
                                            <Input type="number" width={{sm:'120px' ,md:'200px' ,lg:'260px'}} size="sm" placeholder="Enter Company Id" />
                                        </Field.Root>
                                    </GridItem>
                                    <GridItem colSpan={1}>
                                        <Field.Root>
                                            <Field.Label>Company Name</Field.Label>
                                            <Input placeholder="Enter Company Name" size="sm" />
                                        </Field.Root>
                                    </GridItem>
                                    <GridItem colSpan={1}>
                                <Field.Root>
                                    <Field.Label>Cost Name</Field.Label>
                                    <Input placeholder="Enter Cost Name" size="sm"/>
                                </Field.Root>
                                </GridItem>
                                    <GridItem colSpan={1}>
                                <Field.Root>
                                    <Field.Label>Address</Field.Label>
                                 
                                        <Textarea placeholder="Enter Address" />
                                    {/* <Field.HelperText>Max 500 characters.</Field.HelperText> */}
                                </Field.Root>

                                </GridItem>
                              
                                      
                                   <GridItem>
                                    <Field.Root>
                                        <Field.Label>State</Field.Label>

                                            <NativeSelect.Root size="sm">
                                            <NativeSelect.Field>
                                                <option value="H01">TamilNadu</option>
                                                {/* <option value="S01">Stone </option>
                                                <option value="S02">Alloy</option> */}
                                            </NativeSelect.Field>
                                            <NativeSelect.Indicator />
                                        </NativeSelect.Root>
                                    </Field.Root>
                                </GridItem>
                                 <GridItem>
                                <Field.Root>
                                    <Field.Label>Area Code</Field.Label>
                                    <Input size="sm" placeholder="Enter Area Code" />
                                </Field.Root>
                                    </GridItem>
                                <GridItem>
                                <Field.Root>
                                    <Field.Label>Mobile</Field.Label>
                                            <Input size="sm" placeholder="Enter Mobile Number" />
                                </Field.Root>
                                        </GridItem>
                               
                                <GridItem>
                                <Field.Root>
                                    <Field.Label>Email</Field.Label>
                                            <Input size="sm" placeholder="Enter Email Id" />
                                </Field.Root>
                                </GridItem>
                                <GridItem>                    
                                      <Field.Root>
                                        <Field.Label>GSTIN</Field.Label>
                                            <Input size="sm" placeholder="Enter Display Order" />
                                    </Field.Root>

                                    </GridItem> 
                                    <GridItem>    {/* ACTIVE STATUS — USING CHAKRA SELECT v3 */}
                                    <Field.Root >
                                        <Field.Label>Active</Field.Label>

                                            <NativeSelect.Root size="sm">
                                            <NativeSelect.Field>
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
                                    </Field.Root>
                                </GridItem>
                         
                                            
                                </Grid>                     
                            </Fieldset.Content>
                        </Fieldset.Root>
                    
                    
                            {/* ACTION BUTTONS */}
                            <HStack pt={2} justifyContent="center">
                               <Button size="sm" loading={false} loadingText="Saving" spinnerPlacement="end" colorPalette="blue" > <AiOutlineSave />Save</Button>
                                                                   {/* <Button size="sm" colorPalette="yellow">Open</Button>
                                                                   <Button size="sm"  colorPalette="blue" >New</Button> */}
                                                                   <Button size="sm" colorPalette="blue"  > Exit <IoIosExit /> </Button>
                            </HStack>
                    </VStack>
                </GridItem>

                {/* RIGHT SECTION – TABLE */}
                <GridItem>
                    <Box
                        bg="white"
                        p={4}
                        borderRadius="xl"
                        border="1px solid #eef"
                        boxShadow="0 0 30px rgba(212,212,212,0.2)"
                    >
                        <Text mb={2} fontWeight="bold" fontSize="lg" color="Navy">
                       Company Details
                        </Text>

                        <Stack gap="10">

                            <Table.ScrollArea maxW="xl" border="1px solid #eee" >
                                <Table.Root size="sm" stickyHeader>
                                    <Table.Header  >

                                        <Table.Row css={{ background: 'blue.800', color: 'white' }} color='white' >
                                            <Table.ColumnHeader color='white'>CompanyId</Table.ColumnHeader>
                                            <Table.ColumnHeader color='white' >CompanyName</Table.ColumnHeader>
                                           
                                            <Table.ColumnHeader color='white'>Cost Name</Table.ColumnHeader>
                                            <Table.ColumnHeader color='white'>GSTIN</Table.ColumnHeader>

                                            <Table.ColumnHeader color='white' textAlign="end">Active</Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>

                                    <Table.Body>
                                        {dummyCompany.map((item) => (
                                            <Table.Row key={item.id}>
                                                <Table.Cell>{item.companyId}</Table.Cell>
                                                <Table.Cell>{item.companyName}</Table.Cell>
                                                <Table.Cell>{item.costName}</Table.Cell>
                                                <Table.Cell>{item.GSTIN}</Table.Cell>
                                                <Table.Cell textAlign="end">{item.active}</Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table.Root>
                            </Table.ScrollArea>
                        </Stack>
                    </Box>
                </GridItem>

            </Grid>
        </Box>
    );
  }
  export default MetalMaster;
  
  
 