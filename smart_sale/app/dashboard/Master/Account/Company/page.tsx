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
    HStack,
    Stack,
    Fieldset,
    Field,
    NativeSelect,
    Textarea,
    createListCollection,
    For,
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";
import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";
import { FaEdit } from "react-icons/fa";

import { useTheme } from "@/context/theme/themeContext";
import { fontVariables } from "@/context/theme/font";
import {
    useAllCompanies,
    useCreateCompany,
    useUpdateCompany,   // ✅ add this
} from "@/hooks/company/useCompany";


import { CreateCompanyPayload, Company } from "@/service/CompanyService";

function CompanyMaster() {
    const { theme } = useTheme();

    /* -------------------- API HOOKS -------------------- */
    const { data, isLoading } = useAllCompanies();
    const companies = data?.data ?? [];


    const { mutate: createCompany, isPending } = useCreateCompany();
    const { mutate: updateCompany, isPending: isUpdating } = useUpdateCompany();

    /* -------------------- FORM STATE -------------------- */
    const [form, setForm] = useState<CreateCompanyPayload>({
        COMPANYID: "",
        COMPANYNAME: "",
        COSTID: "",
        ADDRESS1: "",
        AREACODE: "",
        PHONE: "",
        EMAIL: "",
        GSTNO: "",
        ACTIVE: "Y",
        STATEID: 1,
    });

    const [logoFile, setLogoFile] = useState<File>();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);

    /* -------------------- SELECT OPTIONS -------------------- */
    const activeStatus = createListCollection({
        items: [
            { label: "YES", value: "Y" },
            { label: "NO", value: "N" },
        ],
    });

    const stateItems = createListCollection({
        items: [
            { label: "TAMILNADU" ,value :'TAMILNADU'},
          
        ],
    });


    /* -------------------- HANDLERS -------------------- */
    const handleChange = (field: keyof CreateCompanyPayload, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = () => {
        if (editId) {
            // 🔄 UPDATE (PUT)
            updateCompany({
                id: editId,
                payload: form,
                logo: logoFile,
            });
        } else {
            // ➕ CREATE (POST)
            createCompany({
                payload: form,
                logo: logoFile,
            });
        }

        // reset form after save
        setEditId(null);
        setLogoFile(undefined);
        setImagePreview(null);
        setForm({
            COMPANYID: "",
            COMPANYNAME: "",
            COSTID: "",
            ADDRESS1: "",
            AREACODE: "",
            PHONE: "",
            EMAIL: "",
            GSTNO: "",
            ACTIVE: "Y",
            STATEID: 1,
        });
    };

    const handleEdit = (company: Company) => {
        setEditId(company.COMPANYID);
        setForm({
            COMPANYID: company.COMPANYID,
            COMPANYNAME: company.COMPANYNAME,
            COSTID: company.COSTID ?? "",
            ADDRESS1: company.ADDRESS1 ?? "",
            AREACODE: company.AREACODE ?? "",
            PHONE: company.PHONE ?? "",
            EMAIL: company.EMAIL ?? "",
            GSTNO: company.GSTNO ?? "",
            ACTIVE: company.ACTIVE,
            STATEID: company.STATEID ?? 1,
        });
    };

    /* -------------------- UI -------------------- */
    return (
        <Box
            className={fontVariables}
            fontFamily="var(--font-lustria)"
            bg={theme.colors.primary}
            color={theme.colors.secondary}
        >
            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={4}>
                {/* ---------------- FORM ---------------- */}
                <GridItem>
                    <VStack bg="white" p={4} borderRadius="xl" border="1px solid #eef">
                        <Text fontSize="lg" fontWeight="600" color="blue.800">
                            Company Creation
                        </Text>

                        <Fieldset.Root size="sm" width="100%">
                            <Fieldset.Content>
                                <Grid templateColumns="repeat(2,1fr)" gap={2}>
                                    <Field.Root>
                                        <Field.Label>Company Id</Field.Label>
                                        <Input
                                            value={form.COMPANYID}
                                            disabled={!!editId}   // ✅ lock during edit
                                            onChange={(e) => handleChange("COMPANYID", e.target.value)}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Company Name</Field.Label>
                                        <Input
                                            value={form.COMPANYNAME}
                                            onChange={(e) => handleChange("COMPANYNAME", e.target.value)}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Cost Id</Field.Label>
                                        <Input
                                            value={form.COSTID}
                                            onChange={(e) => handleChange("COSTID", e.target.value)}
                                        />
                                    </Field.Root>
                                    <Field.Root gridColumn="span 2">
                                        <Field.Label>Address</Field.Label>
                                        <Textarea
                                            value={form.ADDRESS1}
                                            onChange={(e) => handleChange("ADDRESS1", e.target.value)}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>State</Field.Label>
                                        <NativeSelect.Root>
                                            <NativeSelect.Field
                                                value={form.ACTIVE}
                                                onChange={(e) => handleChange("ACTIVE", e.target.value)}
                                            >
                                                <For each={stateItems.items}>
                                                    {(item) => (
                                                        <option key={item.value} value={item.value}>
                                                            {item.label}
                                                        </option>
                                                    )}
                                                </For>
                                            </NativeSelect.Field>
                                        </NativeSelect.Root>
                                    </Field.Root>
                                    
                                    <Field.Root>

                                        <Field.Label>Area Code</Field.Label>
                                        <Input
                                            value={form.AREACODE}
                                            onChange={(e) => handleChange("AREACODE", e.target.value)}
                                        />
                                    </Field.Root>
                                    <Field.Root>
                                        <Field.Label>Mobile</Field.Label>
                                        <Input
                                            value={form.PHONE}
                                            onChange={(e) => handleChange("PHONE", e.target.value)}
                                        />
                                    </Field.Root>
                                    <Field.Root>
                                        <Field.Label>Email</Field.Label>
                                        <Input
                                            value={form.EMAIL}
                                            onChange={(e) => handleChange("EMAIL", e.target.value)}
                                        />
                                    </Field.Root>
                                    <Field.Root>
                                        <Field.Label>GSTIN</Field.Label>
                                        <Input
                                            value={form.GSTNO}
                                            onChange={(e) => handleChange("GSTNO", e.target.value)}
                                        />
                                    </Field.Root>

                                    

                                    <Field.Root>
                                        <Field.Label>Active</Field.Label>
                                        <NativeSelect.Root>
                                            <NativeSelect.Field
                                                value={form.ACTIVE}
                                                onChange={(e) => handleChange("ACTIVE", e.target.value)}
                                            >
                                                <For each={activeStatus.items}>
                                                    {(item) => (
                                                        <option key={item.value} value={item.value}>
                                                            {item.label}
                                                        </option>
                                                    )}
                                                </For>
                                            </NativeSelect.Field>
                                        </NativeSelect.Root>
                                    </Field.Root>
                                </Grid>
                            </Fieldset.Content>
                        </Fieldset.Root>

                        <HStack pt={3}>
                            <Button
                                size="sm"
                                colorPalette="blue"
                                loading={isPending}
                                onClick={handleSave}
                            >
                                <AiOutlineSave /> Save
                            </Button>
                            <Button size="sm" colorPalette="blue">
                                <IoIosExit /> Exit
                            </Button>
                        </HStack>
                    </VStack>
                </GridItem>

                {/* ---------------- TABLE ---------------- */}
                <GridItem>
                    <Box bg="white" p={4} borderRadius="xl" border="1px solid #eef">
                        <Text fontWeight="bold" mb={2}>
                            Company Details
                        </Text>

                        <Table.ScrollArea>
                            <Table.Root size="sm">
                                <Table.Header>
                                    <Table.Row bg="blue.800">
                                        <Table.ColumnHeader color="white">ID</Table.ColumnHeader>
                                        <Table.ColumnHeader color="white">Name</Table.ColumnHeader>
                                        <Table.ColumnHeader color="white">GST</Table.ColumnHeader>
                                        <Table.ColumnHeader color="white">Active</Table.ColumnHeader>
                                        <Table.ColumnHeader color="white"  >
                                            Action
                                        </Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>

                                <Table.Body>
                                    {isLoading ? (
                                        <Table.Row>
                                            <Table.Cell colSpan={5}>Loading...</Table.Cell>
                                        </Table.Row>
                                    ) : (
                                        companies.map((item) => (
                                            <Table.Row key={item.COMPANYID}>
                                                <Table.Cell>{item.COMPANYID}</Table.Cell>
                                                <Table.Cell>{item.COMPANYNAME}</Table.Cell>
                                                <Table.Cell>{item.GSTNO}</Table.Cell>
                                                <Table.Cell>{item.ACTIVE}</Table.Cell>
                                                <Table.Cell  justifyContent="center">
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
                        </Table.ScrollArea>
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
}

export default CompanyMaster;
