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
    Flex,

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
    useUpdateCompany,  
} from "@/hooks/company/useCompany";

import ScrollToTop from "@/component/scroll/ScrollToTop";
import { CreateCompanyPayload, Company } from "@/service/CompanyService";
import { toastCreated, toastError, toastLoaded, toastUpdated, toastUploaded } from "@/component/toast/toast";
import { CustomTable } from "@/component/table/CustomTable";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { usePrint } from "@/context/print/usePrintContext";
import { useRouter } from "next/navigation";
import { FaPrint ,FaFileExcel } from "react-icons/fa";



function AccountMaster() {
    const { theme } = useTheme();

    /* -------------------- API HOOKS -------------------- */
    const { data, isLoading } = useAllCompanies();
    const router = useRouter();
    const {setData ,setColumns ,setShowSno , title } =usePrint();
    const companies = data?.data ?? [];


    const { mutate: createCompany, isPending } = useCreateCompany();
    const { mutate: updateCompany, isPending: isUpdating } = useUpdateCompany();

    /* -------------------- FORM STATE -------------------- */
    const [form, setForm] = useState<CreateCompanyPayload>({
        COMPANYID: "",
        COMPANYNAME: "",
        // costid: "",
        ADDRESS1: "",
        ADDRESS2:"",
        ADDRESS3:"",
        AREACODE: "",
        PHONE: "",
        EMAIL: "",
        GSTNO: "",
        ACTIVE: "Y",
        STATEID:"",
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
            COMPANYID: company.COMPANYID,
            COMPANYNAME: company.COMPANYNAME,
            // costid: company.COSTID ?? "",
            ADDRESS1: company.ADDRESS1 ?? "",
            ADDRESS2: company.ADDRESS2?? "",
            ADDRESS3: company.ADDRESS3 ?? "",
            AREACODE: company.AREACODE ?? "",
            PHONE: company.PHONE ?? "",
            EMAIL: company.EMAIL ?? "",
            GSTNO: company.GSTNO ?? "",
            ACTIVE: company.ACTIVE ?? "Y",
            STATEID: company.STATEID ?? "",
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
            COMPANYID: "",
            COMPANYNAME: "",
            // costid: "",
            ADDRESS1: "",
            ADDRESS2: "",
            ADDRESS3: "",
            AREACODE: "",
            PHONE: "",
            EMAIL: "",
            GSTNO: "",
            ACTIVE: "Y",
            STATEID: "",
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
        if (!form.COMPANYID) {
            toastError("Company ID is required");
            return;
        }

        if (form.COMPANYID.length > 4) {
            toastError("Company ID must be at most 3 characters long");
            return;
        }

        if (!form.COMPANYNAME?.trim()) {
            toastError("Company Name is required");
            return;
        }
        if(!form.ADDRESS1?.trim()){
            toastError("Address is required");
            return;
        }
        if(!form.ADDRESS2?.trim()){
            toastError("Area is required");
            return;
        }
        if(!form.ADDRESS3?.trim()){
            toastError("City is required");
            return;
        }
        if(!form.AREACODE?.trim()){
            toastError("Pincode is required");
            return;
        }
       
        if(form.AREACODE){
            const pinRegex = /^[0-9]{6}$/;
            if (!pinRegex.test(form.AREACODE)) {
                toastError("Pincode must be exactly 6 digits");
                return;
            }
        }
        if(!form.PHONE?.trim()){
            toastError("Mobile Number is required");
            return;
        }
        if(!form.EMAIL?.trim()){
            toastError("Email is required");
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
            
        }

        resetForm();
    };


    const handleEdit = (company: Company) => {
        setEditId(company.COMPANYID); // 🔥 trigger useCompanyById
    };

    const CompanyColumn = [
        {key:'companyId' , label:'Company Id' },
        {key:'companyName' , label:'Company Name' },
        // {key:'costId' , label:'Cost Id' },
        {key:'active', label:'Active'},
        {key:'actions', label:'Actions'},
    ];
 
    /* -------------------- Export -------------------- */
    const handleExport = (option: string) => {
        setData(companies);
        setColumns([
            { key: "COMPANYID", label: "Company Id" },
            { key: "COMPANYNAME", label: "Company Name" },
            { key: "ADDRESS1", label: "Address" },
            // { key: "itemName", label: "Item Name" },
            // { key: "touch", label: "Touch", align: 'end' as const, allowTotal: true },
        ]);
        title?.("Bank Account Master")
        setShowSno(true);
        router.push(`/print?export=${option}&title=${title}`);
    }
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
                                <Grid css={{ sm: { gridTemplateColumns: "repeat(1, 1fr)" }, md: { gridTemplateColumns: "repeat(2, 1fr)" }}} gap={2}>
                                    <Field.Root>
                                        <Field.Label>Company Id</Field.Label>
                                        <CapitalizedInput<CreateCompanyPayload>
                                            field="COMPANYID"
                                            value={form.COMPANYID}
                                            disabled={!!editId}   // ✅ lock during edit
                                            onChange={handleChange}
                                            max={3}
                                         
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Company Name</Field.Label>
                                        <CapitalizedInput<CreateCompanyPayload>
                                            field="COMPANYNAME"
                                            value={form.COMPANYNAME}
                                            onChange={handleChange}
                                            isCapitalized
                                        />
                                    </Field.Root>

                                    {/* <Field.Root>
                                        <Field.Label>Cost Id</Field.Label>
                                        <Input
                                            value={form.costid}
                                            onChange={(e) => handleChange("costid", e.target.value)}
                                        />
                                    </Field.Root> */}



                                    <Field.Root gridColumn="span 2">
                                        <Field.Label>Address</Field.Label>
                                        <CapitalizedInput
                                            field="ADDRESS1"
                                            value={form.ADDRESS1}
                                            onChange={handleChange}
                                        />
                                    </Field.Root>

                                    <Field.Root gridColumn="span 2">
                                        <Field.Label>Area</Field.Label>
                                        <CapitalizedInput
                                            field="ADDRESS2"
                                            value={form.ADDRESS2}
                                            onChange={handleChange}
                                        />
                                    </Field.Root>

                                    <Field.Root gridColumn="span 2">
                                        <Field.Label>City</Field.Label>
                                        <CapitalizedInput
                                            field="ADDRESS3"
                                            value={form.ADDRESS3}
                                            onChange={handleChange}
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
                                            <NativeSelect.Indicator />
                                        </NativeSelect.Root>
                                    </Field.Root>
                                    
                                    <Field.Root>

                                        <Field.Label>PinCode</Field.Label>
                                        <CapitalizedInput
                                            field="AREACODE"
                                            value={form.AREACODE}
                                            onChange={handleChange}
                                            max={999999}
                                            type="number"
                                          
                                        />
                                    </Field.Root>
                                    <Field.Root>
                                        <Field.Label>Mobile</Field.Label>
                                        <CapitalizedInput
                                            field="PHONE"
                                            value={form.PHONE}
                                            onChange={handleChange}
                                            max={9999999999}
                                            type="number"
                                       
                                        />
                                    </Field.Root>
                                    <Field.Root>
                                        <Field.Label>Email</Field.Label>
                                        <Input
                                            value={form.EMAIL}
                                            onChange={(e) => handleChange("EMAIL", e.target.value)}
                                            type="email"
                                        />
                                    </Field.Root>
                                    <Field.Root>
                                        <Field.Label>GSTIN</Field.Label>
                                        <CapitalizedInput
                                            field="GSTNO"
                                            value={form.GSTNO}
                                            onChange={handleChange}
                                            
                                        />
                                    </Field.Root>

                                    

                                    <Field.Root>
                                        <Field.Label>Active</Field.Label>
                                        <NativeSelect.Root>
                                            <NativeSelect.Field
                                                value={form.ACTIVE || "Y"}
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
                        <Box display='flex'  mb={4} gap={3} justifyContent='space-between' alignItems='center'>
                            <Text fontWeight="bold" mb={2}>
                                Company Details
                            </Text>

                            <Flex gap={1}>
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    color={theme.colors.green}
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
                       

                     <CustomTable 
                            columns={CompanyColumn}
                            data={companies}
                            renderRow={(company) => (
                                <>
                                    <Table.Cell>{company.COMPANYID}</Table.Cell>
                                    <Table.Cell>{company.COMPANYNAME}</Table.Cell>
                                    {/* <Table.Cell>{company.COSTID}</Table.Cell> */}
                                    <Table.Cell textAlign="center">{company.ACTIVE}</Table.Cell>
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
                            rowIdKey="COMPANYID"
                         
                            emptyText="No companies available"

                     />
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
}

export default AccountMaster;
