"use client";

import React, { useState ,useEffect } from "react";
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
import { Toaster, toaster } from "@/components/ui/toaster";
import { useTheme } from "@/context/theme/themeContext";
import { fontVariables } from "@/context/theme/font";
import {
    useAllCompanies,
    useCompanyById,
    useCreateCompany,
    useUpdateCompany,   // ✅ add this
} from "@/hooks/company/useCompany";

import ScrollToTop from "@/component/scroll/ScrollToTop";
import { CreateCompanyPayload, Company } from "@/service/CompanyService";
import { toastCreated, toastError, toastLoaded, toastUpdated, toastUploaded } from "@/component/toast/toast";
import { CustomTable } from "@/component/table/CustomTable";

function CompanyMaster() {
    const { theme } = useTheme();

    /* -------------------- API HOOKS -------------------- */
    const { data, isLoading } = useAllCompanies();
    console.log(data,'data')

    const companies = data?.data ?? [];

    
    const { mutate: createCompany, isPending } = useCreateCompany();
    const { mutate: updateCompany, isPending: isUpdating } = useUpdateCompany();

    /* -------------------- FORM STATE -------------------- */
    const [form, setForm] = useState<CreateCompanyPayload>({
        companyid: "",
        companyname: "",
        costid: "",
        address1: "",
        areacode: "",
        phone: "",
        email: "",
        gstno: "",
        active: "Y",
        stateid: 1,
    });
    const [highlightedId ,setHighlightedId] = useState<Number>()

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

    const { data: companyById } = useCompanyById(editId ?? '');
    const company = companyById?.data;

    useEffect(() => {
        if (!company) return;
          
        setForm({
            companyid: company.companyid,
            companyname: company.companyname,
            costid: company.costid ?? "",
            address1: company.address1 ?? "",
            areacode: company.areacode ?? "",
            phone: company.phone ?? "",
            email: company.email ?? "",
            gstno: company.gstno ?? "",
            active: company.active ?? "Y",
            stateid: company.stateid ?? 1,
        });
    }, [company]);

    useEffect(() => {
        if (!company) return;

        // ✅ AFTER render is fully committed
        setTimeout(() => {
            toastLoaded("Company");
            ScrollToTop();
        }, 0);


    }, [company]);

    useEffect(() => {
        if (!highlightedId) return;

        // ✅ AFTER render is fully committed
        const timer = setTimeout(() => {
            
            setHighlightedId(undefined);
        }, 3000);

        return () => clearTimeout(timer);

    }, [highlightedId]);


    /* -------------------- HANDLERS -------------------- */
    const handleChange = (field: keyof CreateCompanyPayload, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };
    const resetForm = () => {
        setEditId(null);
        setLogoFile(undefined);
        setImagePreview(null);
        setForm({
            companyid: "",
            companyname: "",
            costid: "",
            address1: "",
            areacode: "",
            phone: "",
            email: "",
            gstno: "",
            active: "Y",
            stateid: 1,
        });
    };


    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = () => {
        if (!form.companyid) {
            toastError("Company ID is required");
            return;
        }

        if (!form.companyname?.trim()) {
            toastError("Company Name is required");
            return;
        }
        if(!form.costid?.trim()){
            toastError("Cost Id is required");
            return;
        } 

        if (editId) {
            updateCompany({
                id: editId,
                payload: form,
                logo: logoFile,
            } ,{
                onSuccess : () =>{
                    resetForm;
                    setHighlightedId(Number(editId));
                }
            }) 
            ;
          
        } else {
            createCompany({
                payload: form,
                logo: logoFile,
            });
            toastCreated("Company");
        }

        resetForm();
    };


    const handleEdit = (company: Company) => {
        setEditId(company.companyid); // 🔥 trigger useCompanyById
    };

    const CompanyColumn = [
        {key:'companyId' , label:'Company Id' },
        {key:'companyName' , label:'Company Name' },
        {key:'costId' , label:'Cost Id' },
        {key:'active', label:'Active'},
        {key:'actions', label:'Actions'},
    ];

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
                    <VStack bg={theme.colors.formColor} p={4} borderRadius="xl" border="1px solid #eef">
                        <Text fontSize="lg" fontWeight="600" >
                            Company Creation
                        </Text>

                        <Fieldset.Root size="sm" width="100%">
                            <Fieldset.Content>
                                <Grid templateColumns="repeat(2,1fr)" gap={2}>
                                    <Field.Root>
                                        <Field.Label>Company Id</Field.Label>
                                        <Input
                                            value={form.companyid}
                                            disabled={!!editId}   // ✅ lock during edit
                                            onChange={(e) => handleChange("companyid", e.target.value)}
                                         
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Company Name</Field.Label>
                                        <Input
                                            value={form.companyname}
                                            onChange={(e) => handleChange("companyname", e.target.value)}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Cost Id</Field.Label>
                                        <Input
                                            value={form.costid}
                                            onChange={(e) => handleChange("costid", e.target.value)}
                                        />
                                    </Field.Root>
                                    <Field.Root gridColumn="span 2">
                                        <Field.Label>Address</Field.Label>
                                        <Textarea
                                            value={form.address1}
                                            onChange={(e) => handleChange("address1", e.target.value)}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>State</Field.Label>
                                        <NativeSelect.Root>
                                            <NativeSelect.Field
                                                value={form.active}
                                                onChange={(e) => handleChange("active", e.target.value)}
                                            >
                                                <For each={stateItems.items}>
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
                                    
                                    <Field.Root>

                                        <Field.Label>Area Code</Field.Label>
                                        <Input
                                            value={form.areacode}
                                            onChange={(e) => handleChange("areacode", e.target.value)}
                                        />
                                    </Field.Root>
                                    <Field.Root>
                                        <Field.Label>Mobile</Field.Label>
                                        <Input
                                            value={form.phone}
                                            onChange={(e) => handleChange("phone", e.target.value)}
                                        />
                                    </Field.Root>
                                    <Field.Root>
                                        <Field.Label>Email</Field.Label>
                                        <Input
                                            value={form.email}
                                            onChange={(e) => handleChange("email", e.target.value)}
                                        />
                                    </Field.Root>
                                    <Field.Root>
                                        <Field.Label>GSTIN</Field.Label>
                                        <Input
                                            value={form.gstno}
                                            onChange={(e) => handleChange("gstno", e.target.value)}
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
                                                        <option key={item.value} value={item.value}>
                                                            {item.label}
                                                        </option>
                                                    )}
                                                </For>
                                            </NativeSelect.Field>
                                            <NativeSelect.Indicator />
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
                                <AiOutlineSave /> {editId ? "Update" : "Save"}
                            </Button>
                            <Button size="sm" colorPalette="blue" onClick={resetForm}>
                                <IoIosExit /> Exit
                            </Button>
                        </HStack>
                    </VStack>
                </GridItem>

                {/* ---------------- TABLE ---------------- */}
                <GridItem minW={0}>
                    <Box bg={theme.colors.formColor} p={4} borderRadius="xl" border="1px solid #eef">
                        <Text fontWeight="bold" mb={2}>
                            Company Details
                        </Text>

                     <CustomTable 
                            columns={CompanyColumn}
                            data={companies}
                            renderRow={(company) => (
                                <>
                                    <Table.Cell>{company.companyid}</Table.Cell>
                                    <Table.Cell>{company.companyname}</Table.Cell>
                                    <Table.Cell>{company.costid}</Table.Cell>
                                    <Table.Cell textAlign="center">{company.active}</Table.Cell>
                                    <Table.Cell>
                                        <Box display="flex" justifyContent="center">
                                            <FaEdit onClick={() => handleEdit(company)} cursor="pointer" />
                                        </Box>
                                    </Table.Cell>
                                </>
                            )}
                            headerBg="blue.800"
                            headerColor="white"
                            borderColor="white"
                            bodyBg={theme.colors.primary}
                            highlightRowId={highlightedId ? Number(highlightedId) : null} 
                            rowIdKey="companyid"
                         
                            emptyText="No companies available"

                     />
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
}

export default CompanyMaster;
