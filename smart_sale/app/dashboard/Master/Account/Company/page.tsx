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
    useListCollection,
    useFilter,
    Combobox,
    Portal

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
import { useAllStates } from "@/hooks/state/useStates";
import ScrollToTop from "@/component/scroll/ScrollToTop";
import { CreateCompanyPayload, Company } from "@/service/CompanyService";
import { toastCreated, toastError, toastLoaded, toastUpdated, toastUploaded } from "@/component/toast/toast";
import { CustomTable } from "@/component/table/CustomTable";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { usePrint } from "@/context/print/usePrintContext";
import { useRouter } from "next/navigation";
import { FaPrint ,FaFileExcel } from "react-icons/fa";
import { SelectCombobox } from "@/components/ui/selectComboBox";



function CompanyMaster() {
    const { theme } = useTheme();
    /* -------------------- API HOOKS -------------------- */
    const { data, isLoading , refetch:companyRefetch } = useAllCompanies();
    const router = useRouter();
    const {setData ,setColumns ,setShowSno , title } =usePrint();
    const companies = data?.data ?? [];
    const [inputValue, setInputValue] = useState("")
    const {data:allStates ,isLoading:stateLoading ,isError:stateError} = useAllStates();


    const { mutate: createCompany, isPending } = useCreateCompany();
    const { mutate: updateCompany, isPending: isUpdating } = useUpdateCompany();

    const stateOptions = (allStates || []).map((s: any) => ({
        label: s.stateName,
        value: String(s.stateId), // ALWAYS string
    }))

   

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
        STATEID: "24",
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
            STATEID: String(company.STATEID)?? "",
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
            STATEID: "24",
        });
    };


    // const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const file = e.target.files?.[0];
    //     if (file) {
    //         setLogoFile(file);
    //         setImagePreview(URL.createObjectURL(file));
    //     }
    // };

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
        // if(!form.ADDRESS1?.trim()){
        //     toastError("Address is required");
        //     return;
        // }
        // if(!form.ADDRESS2?.trim()){
        //     toastError("Area is required");
        //     return;
        // }
        // if(!form.ADDRESS3?.trim()){
        //     toastError("City is required");
        //     return;
        // }
        // if (!form.STATEID) {
        //     toastError("State is required");
        //     return;
        // }
        // if(!form.AREACODE?.trim()){
        //     toastError("Pincode is required");
        //     return;
        // }
       
        // if(form.AREACODE){
        //     const pinRegex = /^[0-9]{6}$/;
        //     if (!pinRegex.test(form.AREACODE)) {
        //         toastError("Pincode must be exactly 6 digits");
        //         return;
        //     }
        // }
        // if(!form.PHONE?.trim()){
        //     toastError("Mobile Number is required");
        //     return;
        // }
        // if(!form.EMAIL?.trim()){
        //     toastError("Email is required");
        //     return;
        // }

       
        if (editId) {
            updateCompany({
                id: editId,
                payload: form,
                logo: logoFile,
            } ,{
                onSuccess : () =>{
                    companyRefetch();
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

        { key:'COMPANYID' , label:'Sno' },
        {key:'companyId' , label:'Company Id' },
        {key:'companyName' , label:'Company Name' },
        // {key:'state' , label:'State' },
        {key:'active', label:'Active'},
        {key:'actions', label:'Actions'},
    ];
 
    /* -------------------- Export -------------------- */
    const handleExport = (option: string) => {
        setData(companies);
        setColumns([
            { key: "COMPANYID", label: "Company Id" },
            { key: "COMPANYNAME", label: "Company Name" },
               {key:'ACTIVE', label:'Active'},
            // { key: "ADDRESS1", label: "Address" },
            // { key: "itemName", label: "Item Name" },
            // { key: "touch", label: "Touch", align: 'end' as const, allowTotal: true },
        ]);
        setShowSno(true);
        title?.("Company Master")
        router.push(`/print?export=${option}`);
    }
    /* -------------------- UI -------------------- */
    return (
        <Box
            fontWeight="semibold"
            bg={theme.colors.primary}
            color={theme.colors.secondary}
        
        >
            <Toaster />
            <Grid templateColumns={{ base: "1fr", lg: "1fr 1.5fr" }} gap={2}>
                {/* ---------------- FORM ---------------- */}
                <GridItem>
                    <VStack bg={theme.colors.formColor} p={4} borderRadius="xl" border="1px solid #eef">
                        <Text fontSize="small" fontWeight="600" >
                                COMPANY CREATION
                        </Text>

                        <Fieldset.Root size="sm" width="100%">
                            <Fieldset.Content>
                                <Grid gap={2}>

                                    {/* COMPANY ID */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="90px" fontSize="2xs">COMPANY ID :</Box>
                                        <CapitalizedInput
                                            field="COMPANYID"
                                            value={form.COMPANYID}
                                            disabled={!!editId}
                                            onChange={handleChange}
                                            max={3}
                                            size="2xs"
                                            maxWidth="90px"
                                            rounded="full"
                                        />
                                    </Box>

                                    {/* COMPANY NAME */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW='90px' fontSize="2xs">COMPANY NAME :</Box>
                                        <CapitalizedInput
                                            field="COMPANYNAME"
                                            value={form.COMPANYNAME}
                                            onChange={handleChange}
                                            isCapitalized
                                            size="2xs"
                                        />
                                    </Box>

                                    {/* ADDRESS */}
                                    {/* <Box display="flex" alignItems="center" gap={2} >
                                        <Box minW='90px' fontSize="2xs">ADDRESS :</Box>
                                        <CapitalizedInput
                                            field="ADDRESS1"
                                            value={form.ADDRESS1}
                                            onChange={handleChange}
                                            size="2xs"
                                            allowSpecial
                                        />
                                    </Box> */}

                                    {/* AREA */}
                                    {/* <Box display="flex" alignItems="center" gap={2} >
                                        <Box minW="90px" fontSize="2xs">AREA :</Box>
                                        <CapitalizedInput
                                            field="ADDRESS2"
                                            value={form.ADDRESS2}
                                            onChange={handleChange}
                                            size="2xs"
                                        />
                                    </Box> */}

                                    {/* CITY */}
                                    {/* <Box display="flex" alignItems="center" gap={2} >
                                        <Box minW="90px" fontSize="2xs">CITY :</Box>
                                        <CapitalizedInput
                                            field="ADDRESS3"
                                            value={form.ADDRESS3}
                                            onChange={handleChange}
                                            size="2xs"
                                        />
                                    </Box> */}

                                    {/* STATE */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="90px" fontSize="2xs">STATE :</Box>
                                        <SelectCombobox
                                            items={stateOptions}
                                            value={form.STATEID}
                                            onChange={(val) => handleChange("STATEID", val)}
                                            placeholder="Select State"
                                        />
                                    </Box>

                                    {/* PINCODE */}
                                    {/* <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="90px" fontSize="2xs">PINCODE :</Box>
                                        <CapitalizedInput
                                            field="AREACODE"
                                            value={form.AREACODE}
                                            onChange={handleChange}
                                            max={999999}
                                            type="number"
                                            size="2xs"
                                        />
                                    </Box> */}

                                    {/* MOBILE */}
                                    {/* <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="90px" fontSize="2xs">MOBILE :</Box>
                                        <CapitalizedInput
                                            field="PHONE"
                                            value={form.PHONE}
                                            onChange={handleChange}
                                            max={9999999999}
                                            type="number"
                                            size="2xs"
                                        />
                                    </Box> */}

                                    {/* EMAIL */}
                                    {/* <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="90px" fontSize="2xs">EMAIL :</Box>
                                        <CapitalizedInput
                                            field="EMAIL"           
                                            size="2xs"
                                            value={form.EMAIL}
                                            onChange={handleChange}
                                            inputModeType="email"
                                        />
                                    </Box> */}

                                    {/* GSTIN */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="90px" fontSize="2xs">GSTIN :</Box>
                                        <CapitalizedInput
                                            field="GSTNO"
                                            value={form.GSTNO}
                                            onChange={handleChange}
                                            size="2xs"
                                            type="text"
                                            inputModeType="gst"
                                           
                                        />
                                    </Box>

                                    {/* ACTIVE */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="90px" fontSize="2xs">ACTIVE :</Box>
                                        <NativeSelect.Root size="xs" maxW="90px" fontSize="2xs">
                                            <NativeSelect.Field
                                                value={form.ACTIVE || "Y"}
                                                onChange={(e) => handleChange("ACTIVE", e.target.value)}
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
                            </Fieldset.Content>
                        </Fieldset.Root>


                        <HStack>
                            <Button
                                size="xs"
                                colorPalette="blue"
                                loading={isPending}
                                onClick={handleSave}
                            >
                                <AiOutlineSave /> {editId ? "Update" : "Save"}
                            </Button>
                            <Button size="xs" colorPalette="blue" onClick={resetForm}>
                                <IoIosExit /> Exit
                            </Button>
                        </HStack>
                    </VStack>
                </GridItem>

                {/* ---------------- TABLE ---------------- */}
                <GridItem minW={0}>
                    <Box bg={theme.colors.formColor} p={2} borderRadius="xl" border="1px solid #eef">
                        <Box display='flex'  mb={2} gap={2} justifyContent='space-between' alignItems='center'>
                            <Text fontWeight="semibold" fontSize="small" >
                                COMPANY DETAILS 
                            </Text>

                            <Flex>
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
                            renderRow={(company , index) => (
                                <>
                                    <Table.Cell>{index+1}</Table.Cell>
                                    <Table.Cell>{company.COMPANYID}</Table.Cell>
                                    <Table.Cell>{company.COMPANYNAME}</Table.Cell>
                                    {/* <Table.Cell>{company.STATE}</Table.Cell> */}
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

export default CompanyMaster;
