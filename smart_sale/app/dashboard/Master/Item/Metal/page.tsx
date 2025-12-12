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
} from "@chakra-ui/react";
import { } from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { PasswordInput } from "@/components/ui/password-input";
import Image from "next/image";
import { useTheme } from "@/context/theme/themeContext";
import { fontVariables } from "@/context/theme/font";
import {AiOutlineSave }from  "react-icons/ai";
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
        const dummyMetals = [
            { id: 1, metalName: "Silver", metalType: "Metal",order:1, active: "YES" },
            { id: 2, metalName: "Gold", metalType: "Metal", order: 2, active: "YES" },
            { id: 3, metalName: "Platinum", metalType: "Metal", order: 3, active: "NO" },
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
            bg="inherit"
            color={theme.colors.secondary}
           

        >
            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={2}>

                {/* LEFT SECTION – USER FORM */}

                <GridItem display="flex" justifyContent="center">
                    <VStack
                        w="full"
                        maxW="500px"
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
                        >
                            Metal Master
                        </Text>

                        <Fieldset.Root size="lg" width="100%">
                            <Fieldset.Content>
                                {/* USER NAME */}
                              
                                  
                                        <Field.Root>
                                            <Field.Label>Metal Name</Field.Label>
                                            <Input placeholder="Enter Metal Name" />
                                        </Field.Root>

                                  
                                        <Field.Root>
                                            <Field.Label>Metal Id</Field.Label>
                                            <Input type="number" placeholder="Enter Metal Id" />
                                        </Field.Root>

                              
                                      
                                   
                                    <Field.Root>
                                        <Field.Label>Metal Type</Field.Label>

                                        <NativeSelect.Root>
                                            <NativeSelect.Field>
                                                <option value="H01">Metal</option>
                                                <option value="S01">Stone </option>
                                                <option value="S02">Alloy</option>
                                            </NativeSelect.Field>
                                            <NativeSelect.Indicator />
                                        </NativeSelect.Root>
                                    </Field.Root>
                                 
                              

                                {/* COST CENTRE */}
                                <Box css={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                    <Field.Root>
                                        <Field.Label>Display Order</Field.Label>
                                        <Input type="number" placeholder="Enter Display Order" />
                                    </Field.Root>

                                    {/* ACTIVE STATUS — USING CHAKRA SELECT v3 */}
                                    <Field.Root>
                                        <Field.Label>Active</Field.Label>

                                        <NativeSelect.Root>
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
                                </Box>
                         


                                {/* ACTION BUTTONS */}
                                <HStack pt={2} justifyContent="center">
                                    <Button size="sm" loading={false} loadingText="Saving" spinnerPlacement="end" colorPalette="blue" > <AiOutlineSave />Save</Button>
                                    {/* <Button size="sm" colorPalette="yellow">Open</Button>
                                    <Button size="sm"  colorPalette="blue" >New</Button> */}
                                    <Button size="sm" colorPalette="blue"  > Exit <IoIosExit /> </Button>
                                </HStack>
                            </Fieldset.Content>
                        </Fieldset.Root>
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
                         Metal List
                        </Text>

                        <Stack gap="10">

                            <Table.ScrollArea maxW="xl" border="1px solid #eee" >
                                <Table.Root size="sm" stickyHeader>
                                    <Table.Header  >

                                        <Table.Row css={{ background: 'blue.800', color: 'white' }} color='white' >
                                            <Table.ColumnHeader color='white' >MetalName</Table.ColumnHeader>
                                            <Table.ColumnHeader color='white'>MetalType</Table.ColumnHeader>
                                            <Table.ColumnHeader color='white'>MetalOrder</Table.ColumnHeader>
                                            <Table.ColumnHeader color='white' textAlign="end">Active</Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>

                                    <Table.Body>
                                        {dummyMetals.map((item) => (
                                            <Table.Row key={item.id}>
                                                <Table.Cell>{item.metalName}</Table.Cell>
                                                <Table.Cell>{item.metalType}</Table.Cell>
                                                <Table.Cell>{item.order}</Table.Cell>
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
  
  
 