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

function MetalMaster() {
    const { theme } = useTheme();

    // Form state
    const [form, setForm] = useState<Partial<Metal>>({
        metalId: "",
        metalName: "",
        ttype: "",
        displayOrder: 0,
        active: "Y",
    });

    const [isEdit, setIsEdit] = useState(false);

    const { data: metals = [], refetch } = useAllMetals();
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

    const handleSave = () => {
        if (isEdit && form.metalId) {
            updateMutation.mutate(
                { id: form.metalId, metal: form as Metal },
                { onSuccess: () => { resetForm(); refetch(); } }
            );
        } else {
            createMutation.mutate(form as Metal, { onSuccess: () => { resetForm(); refetch(); } });
        }
    };

    const handleEdit = (metal: Metal) => {
        setForm(metal);
        setIsEdit(true);
    };

    const resetForm = () => {
        setForm({ metalId: "", metalName: "", ttype: "H01", displayOrder: 0, active: "Y" });
        setIsEdit(false);
    };

    return (
        <Box className={fontVariables} fontFamily="var(--font-lustria)" bg="inherit" color={theme.colors.secondary}>
            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={2}>
                {/* LEFT – Form */}
                <GridItem display="flex" justifyContent="center">
                    <VStack w="full" maxW="500px" bg="white" p={4} borderRadius="xl" border="1px solid #eef" boxShadow="0 0 30px rgba(212,212,212,0.2)">
                        <Text fontSize="20px" color="blue.800" fontWeight="600">Metal Master</Text>

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
                                            value={form.ttype || "M"}
                                            onChange={(e) => handleChange("ttype", e.target.value)}
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
                <GridItem>
                    <Box bg="white" p={4} borderRadius="xl" border="1px solid #eef" boxShadow="0 0 30px rgba(212,212,212,0.2)">
                        <Text mb={2} fontWeight="bold" fontSize="lg" color="Navy">Metal List</Text>

                        <Stack gap="10">
                            <Table.ScrollArea maxW="xl" border="1px solid #eee">
                                <Table.Root size="sm" stickyHeader>
                                    <Table.Header>
                                        <Table.Row css={{ background: 'blue.800', color: 'white' }}>
                                            <Table.ColumnHeader color="white">MetalId</Table.ColumnHeader>
                                            <Table.ColumnHeader color="white">MetalName</Table.ColumnHeader>
                                            <Table.ColumnHeader color="white">MetalType</Table.ColumnHeader>
                                            <Table.ColumnHeader color="white">Order</Table.ColumnHeader>
                                            <Table.ColumnHeader color="white" textAlign="end">Active</Table.ColumnHeader>
                                            <Table.ColumnHeader color="white"  textAlign="center">Actions</Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>

                                    <Table.Body>
                                        {metals.map((metal) => (
                                            <Table.Row key={metal.metalId}>
                                                <Table.Cell>{metal.metalId}</Table.Cell>
                                                <Table.Cell>{metal.metalName}</Table.Cell>
                                                <Table.Cell>{metal.ttype}</Table.Cell>
                                                <Table.Cell>{metal.displayOrder}</Table.Cell>
                                                <Table.Cell textAlign="end">{metal.active}</Table.Cell>
                                                <Table.Cell justifyItems="center">
                                                    <FaEdit style={{ cursor: "pointer" }} onClick={() => handleEdit(metal)} />
                                                </Table.Cell>
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
