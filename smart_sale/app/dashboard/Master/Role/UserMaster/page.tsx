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
import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";
import { LuUser } from "react-icons/lu";


export default function UserMaster() {
    const { theme } = useTheme();

    const [showPassword, setShowPassword] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setImagePreview(URL.createObjectURL(file));
    };

    // Dummy table data
    const dummyUsers = [
        { id: 1, name: "Admin", centre: "Head Office", active: "YES" },
        { id: 2, name: "Ravi", centre: "Showroom 1", active: "YES" },
        { id: 3, name: "Kumar", centre: "Factory", active: "NO" },
    ];

    // ACTIVE STATUS SELECT LIST
    const activeStatus = createListCollection({
        items: [
            { label: "YES", value: "Y" },
            { label: "NO", value: "N" }
        ]
    });
   
    return (
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
                            User Master
                        </Text>

                        <Fieldset.Root size="lg" width="100%">
                            <Fieldset.Content>
                                {/* USER NAME */}
                                <Box display="flex" gap={2} justifyContent="space-between">
                                <Box>
                                <Field.Root>
                                    <Field.Label>User Name</Field.Label>
                                            <InputGroup startElement={<LuUser />}> 
                                                    <Input placeholder="Enter user name" /> 
                                            </InputGroup>
                                  
                                </Field.Root>

                                {/* PASSWORD */}
                                <Field.Root>
                                    <Field.Label>Password</Field.Label>
                                    <PasswordInput placeholder="Enter your password" />
                                </Field.Root>

                                {/* CONFIRM PASSWORD */}
                                <Field.Root>
                                    <Field.Label>Confirm Password</Field.Label>
                                    <Input type="password" placeholder="Re-enter password" />
                                </Field.Root>
                                </Box>
                                    <Box textAlign="center" mt={4}>
                                        <Box
                                            w="120px"
                                            h="120px"
                                            border="1px solid #ddd"
                                            mx="auto"
                                            mb={3}
                                            borderRadius="md"
                                            overflow="hidden"
                                        >
                                            <Image
                                                src={imagePreview || "/favicon.ico"}
                                                width={120}
                                                height={120}
                                                alt="User"
                                                style={{ objectFit: "cover" }}
                                            />
                                        </Box>

                                        <Button size="sm" as="label" cursor="pointer">
                                            Select Image
                                            <input type="file" hidden accept="image/*" onChange={handleImageSelect} />
                                        </Button>
                                    </Box>
                                </Box>

                                {/* COST CENTRE */}
                                <Box css={{display:'flex' ,justifyContent:'space-between' ,gap:2 }}>
                                <Field.Root>
                                    <Field.Label>Cost Centre</Field.Label>

                                    <NativeSelect.Root>
                                        <NativeSelect.Field>
                                            <option value="H01">Head Office</option>
                                            <option value="S01">Showroom 1</option>
                                            <option value="S02">Showroom 2</option>
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
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
                                {/* IMAGE UPLOAD */}
                                

                                {/* ACTION BUTTONS */}
                                <HStack pt={2} justifyContent="center">
                                    <Button size="sm" loading={false} loadingText="Saving" spinnerPlacement="end" colorPalette="blue"><AiOutlineSave /> Save</Button>
                                    {/* <Button size="sm" colorPalette="yellow">Open</Button>
                                    <Button size="sm"  colorPalette="blue" >New</Button> */}
                                    <Button size="sm" colorPalette="blue" >Exit <IoIosExit /> </Button>
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
                            User List
                        </Text>

                        <Stack gap="10">
                            
                            <Table.ScrollArea maxW="xl" border="1px solid #eee" >
                                <Table.Root size="sm"stickyHeader> 
                                    <Table.Header  >
                                            
                                        <Table.Row css={{ background:'blue.800' , color:'white' }} color='white' >
                                            <Table.ColumnHeader color='white' >User</Table.ColumnHeader>
                                            <Table.ColumnHeader color='white'>Centre</Table.ColumnHeader>
                                            <Table.ColumnHeader color='white' textAlign="end">Active</Table.ColumnHeader>
                                            </Table.Row>
                                        </Table.Header>

                                        <Table.Body>
                                            {dummyUsers.map((item) => (
                                                <Table.Row key={item.id}>
                                                    <Table.Cell>{item.name}</Table.Cell>
                                                    <Table.Cell>{item.centre}</Table.Cell>
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
