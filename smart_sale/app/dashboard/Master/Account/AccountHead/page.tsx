"use client";

import React, { useState ,useEffect ,useMemo} from "react";
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
    Combobox,
    Portal,
    useFilter,
    useListCollection,
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
} from "@/hooks/company/useCompany";

import ScrollToTop from "@/component/scroll/ScrollToTop";
import { CreateCompanyPayload, Company } from "@/service/CompanyService";
import { toastCreated, toastError, toastLoaded, toastUpdated, toastUploaded } from "@/component/toast/toast";
import { CustomTable } from "@/component/table/CustomTable";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { usePrint } from "@/context/print/usePrintContext";
import { useRouter } from "next/navigation";
import { FaPrint ,FaFileExcel } from "react-icons/fa";
import { AccountTypeList } from "@/data/AccountType";
import { useAllStates } from "@/hooks/state/useStates";
import { useAllAccountHead ,useCreateAccountHead ,useUpdateAccountHead ,useAccountHeadById } from "@/hooks/accountHead/useAccountHead";
import { AccountHead } from "@/types/accountHead/AccountHead";

function AccountHeadMaster() {

    const { theme } = useTheme();

    /* -------------------- API HOOKS -------------------- */


    const { data, isLoading } = useAllCompanies();
    const router = useRouter();
    const {setData ,setColumns ,setShowSno} =usePrint();
    const companies = data?.data ?? [];
    const { contains } = useFilter({ sensitivity: "base" });
    const {data:allStates ,isLoading:stateLoading ,isError:stateError} = useAllStates();
    console.log(allStates ,'states')

    const {data:allAccountHead ,isLoading:accountHeadLoading ,isError:accountHeadError} = useAllAccountHead();



    const { mutate: createAccountHead, isPending } = useCreateAccountHead();
    const { mutate: updateAccountHead, isPending: isUpdating } = useUpdateAccountHead();


    /* -------------------- FORM STATE -------------------- */
    const [form, setForm] = useState<AccountHead>({

        ACNAME:"",
        ACTYPE:"",
        COMPANYID: "",
        ADDRESS1: "",
        ADDRESS2:"",
        AREA:"",
        CITY:"",
        STATEID: "",
        PINCODE: "",
        MOBILE:"",   
        EMAILID: "",
        GSTNO: "",
        ACTIVE: "Y",
       
    });
    const [highlightedId ,setHighlightedId] = useState<Number>()

    const [logoFile, setLogoFile] = useState<File>();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);




    /* -------------------- SELECT OPTIONS -------------------- */

    const accountList = Array.isArray(allAccountHead?.data)
        ? allAccountHead.data
        : [];
   
    const CompaniesList = useMemo(() => {
        return (
            companies.map((i: any) => ({
                label: i.COMPANYNAME,
                value: String(i.COMPANYID),
            })) ?? []
        );
    }, [companies]);


    const { collection: accountTypeCollection , filter:accountTypeFilter } = useListCollection({
        initialItems: AccountTypeList,
        filter: contains,
    })


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


    const { collection: companyListCollection, filter: companyFilter, set: setItems } = useListCollection({
        initialItems: CompaniesList,
        filter: contains,
        itemToValue: (item) => item.value,
        itemToString: (item) => item.label,
    })

    const { collection: allStatesList, filter: stateFilter, set: setStateList } = useListCollection({
        initialItems: allStates,
        filter: contains,
        itemToValue: (i:any) => i.stateId,
        itemToString: (i) => i.stateName,
    })



    useEffect(() => {
        if (!CompaniesList.length) return;

        setItems(CompaniesList);    // ✅ CORRECT
        companyFilter("");        // optional reset
    }, [CompaniesList, setItems, companyFilter]);
    useEffect(() => {
   
        if (!allStates?.length) return;

        setStateList(allStates);    // ✅ CORRECT
        stateFilter("");        // optional reset
    }, [CompaniesList, setItems, companyFilter]);


    const { data: accountHeadData } = useAccountHeadById(Number(editId) ?? '');


    const account = accountHeadData?.data;


    useEffect(() => {
        if (!account) return;
          
        setForm({

            ACNAME:account.ACNAME ?? "",
            ACTYPE:account.ACTYPE ?? "",
            COMPANYID: account.COMPANYID ?? "",
            ADDRESS1: account.ADDRESS1 ?? "",
            ADDRESS2: account.ADDRESS2?? "",
            AREA: account.AREA ?? "",
            CITY: account.CITY ?? "",
            MOBILE: account.MOBILE ?? "",
            EMAILID: account.EMAILID ?? "",
            PINCODE:account.PINCODE?? "",
            GSTNO: account.GSTNO ?? "",
            ACTIVE: account.ACTIVE ?? "Y",
            STATEID: account.STATEID ?? "" ,
        });
    }, [account]);

    const getLabelByValue = (collection: any, value: any) =>
        collection.items.find((item: any) => item.value === value)?.label ?? "";

    const getStateLabelByValue = (collection: any, value: any) =>
  collection.items.find((item: any) => item.stateId === value)?.stateName ?? "";

    useEffect(() => {
        if (!account) return;

        // ✅ AFTER render is fully committed
        setTimeout(() => {
            toastLoaded("Account Head");
            ScrollToTop();
        }, 0);


    }, [account]);

    useEffect(() => {
        if (!highlightedId) return;

        // ✅ AFTER render is fully committed
        const timer = setTimeout(() => {
            
            setHighlightedId(undefined);
        }, 3000);

        return () => clearTimeout(timer);

    }, [highlightedId]);





    /* -------------------- HANDLERS -------------------- */
    const handleChange = (field: keyof AccountHead, value: any) => {
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
            AREA: "",
            CITY: "",
            STATEID: "",
            PINCODE: "",
            MOBILE: "",
            EMAILID: "",
            GSTNO: "",
            ACTIVE: "Y",
           
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
        if (!form.ACNAME) {
            toastError("Name is required");
            return;
        }

        if (!form.ACTYPE?.trim()) {
            toastError("Account Type is required");
            return;
        }
        if (!form.COMPANYID?.trim()) {
            toastError("Account Type is required");
            return;
        }

        if(!form.ADDRESS1?.trim()){
            toastError("Address is required");
            return;
        }
        if(!form.AREA?.trim()){
            toastError("Area is required");
            return;
        }
        if(!form.CITY?.trim()){
            toastError("City is required");
            return;
        }
        if(!form.PINCODE?.trim()){
            toastError("Pincode is required");
            return;
        }
       
        if(form.PINCODE){
            const pinRegex = /^[0-9]{6}$/;
            if (!pinRegex.test(form.PINCODE)) {
                toastError("Pincode must be exactly 6 digits");
                return;
            }
        }
        if(!form.MOBILE?.trim()){
            toastError("Mobile Number is required");
            return;
        }
        if (form.PINCODE) {
            const mobileRegex = /^[0-9]{10}$/;
            if (!mobileRegex.test(form.MOBILE)) {
                toastError("mobile number must be exactly 10 digits");
                return;
            }
        }
        if(!form.EMAILID?.trim()){
            toastError("Email is required");
            return;
        }

       
        if (editId) {
            updateAccountHead({
                id: Number(editId),
                data: form,
            } ,{
                onSuccess : () =>{
                    resetForm;
                    setHighlightedId(Number(editId));
                }
            }) 
            ;
          
        } else {
            createAccountHead(form);
            
        }

        resetForm();
    };


    const handleEdit = (account:AccountHead) => {
        setEditId(account?.ACCODE ?? ""); // 🔥 trigger useCompanyById
    };

    const accountColumn = [
        {key:'ACNAME' , label:'Name' },
        { key: 'ACTYPE', label: 'Account Type' },
        {key:'COMPANYNAME' , label:'Company Name' },
        {key:'active', label:'Active'},
        {key:'actions', label:'Actions'},
    ];
 
    /* -------------------- Export -------------------- */
    const handleExport = (option: string) => {
        setData(companies);
        setColumns([
            { key: 'ACNAME', label: 'Name' },
            { key: 'COMPANYNAME', label: 'Company Name' },
            { key: 'active', label: 'Active' },
        ]);
        setShowSno(true);
        router.push(`/print?export=${option}`);
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
                           Account Head
                        </Text>

                        <Fieldset.Root size="sm" width="100%">
                            <Fieldset.Content>
                                <Grid templateColumns="repeat(2,1fr)" gap={2}>
                                    <Field.Root>
                                        <Field.Label>Name</Field.Label>
                                        <CapitalizedInput<AccountHead>
                                            field="ACNAME"
                                            value={form.ACNAME}
                                            onChange={handleChange}
                                         
                                        />
                                    </Field.Root>
                                    <Combobox.Root
                                        collection={accountTypeCollection}
                                        openOnClick
                                        value={form.ACTYPE ? [form.ACTYPE] : []}
                                        inputValue={getLabelByValue(accountTypeCollection, form.ACTYPE)}
                                        onValueChange={(details) => {
                                            const selectedValue = details.value[0] ?? ""

                                            setForm((prev) => ({
                                                ...prev,
                                                ACTYPE: selectedValue, // ✅ store VALUE directly
                                            }))
                                        }}
                                        onInputValueChange={(e) => accountTypeFilter(e.inputValue)}
                                    >
                                        <Combobox.Label>Account Type</Combobox.Label>
                                        <Combobox.Control>
                                            <Combobox.Input placeholder="Type to search" />
                                            <Combobox.IndicatorGroup>
                                                <Combobox.ClearTrigger />
                                                <Combobox.Trigger />
                                            </Combobox.IndicatorGroup>
                                        </Combobox.Control>
                                        <Portal>
                                            <Combobox.Positioner>
                                                <Combobox.Content>
                                                    <Combobox.Empty>No items found</Combobox.Empty>
                                                    {accountTypeCollection.items.map((item: any) => (
                                                        <Combobox.Item item={item} key={item.value}>
                                                            {item.label}
                                                            <Combobox.ItemIndicator />
                                                        </Combobox.Item>
                                                    ))}
                                                </Combobox.Content>
                                            </Combobox.Positioner>
                                        </Portal>
                                    </Combobox.Root>
                                    <Combobox.Root
                                        collection={companyListCollection}
                                        onInputValueChange={(e) => companyFilter(e.inputValue)}

                                        openOnClick
                                        value={form.COMPANYID ? [form.COMPANYID] : []}
                                        inputValue={getLabelByValue(companyListCollection, form.COMPANYID)}
                                        onValueChange={(details) => {
                                            const selectedValue = details.value[0] ?? ""

                                            setForm((prev) => ({
                                                ...prev,
                                                COMPANYID: selectedValue, // ✅ store VALUE directly
                                            }))
                                        }}
                                     

                                    >
                                        <Combobox.Label>Company</Combobox.Label>
                                        <Combobox.Control>
                                            <Combobox.Input placeholder="Type to search" />
                                            <Combobox.IndicatorGroup>
                                                <Combobox.ClearTrigger />
                                                <Combobox.Trigger />
                                            </Combobox.IndicatorGroup>
                                        </Combobox.Control>
                                        <Portal>
                                            <Combobox.Positioner>
                                                <Combobox.Content>
                                                    <Combobox.Empty>No items found</Combobox.Empty>
                                                    {companyListCollection.items.map((item: any) => (
                                                        <Combobox.Item item={item} key={item.value}>
                                                            {item.label}
                                                            <Combobox.ItemIndicator />
                                                        </Combobox.Item>
                                                    ))}
                                                </Combobox.Content>
                                            </Combobox.Positioner>
                                        </Portal>
                                    </Combobox.Root>

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

                                    <Field.Root gridColumn="span">
                                        <Field.Label>Area</Field.Label>
                                        <CapitalizedInput
                                            field="AREA"
                                            value={form.AREA}
                                            onChange={handleChange}
                                        />
                                    </Field.Root>

                                    <Field.Root gridColumn="span">
                                        <Field.Label>City</Field.Label>
                                        <CapitalizedInput
                                            field="CITY"
                                            value={form.CITY}
                                            onChange={handleChange}
                                        />
                                    </Field.Root>

                                    <Combobox.Root
                                        collection={allStatesList}
                                        onInputValueChange={(e) => stateFilter(e.inputValue)}
                                        openOnClick
                                        value={form.STATEID ? [form.STATEID] : []}
                                        inputValue={getStateLabelByValue(allStatesList, form.STATEID)}
                                        onValueChange={(details) => {
                                            const selectedValue = details.value[0] ?? ""

                                            setForm((prev) => ({
                                                ...prev,
                                                STATEID: selectedValue, // ✅ store VALUE directly
                                            }))
                                        }}

                                    >
                                        <Combobox.Label>State</Combobox.Label>
                                        <Combobox.Control>
                                            <Combobox.Input placeholder="Type to search" />
                                            <Combobox.IndicatorGroup>
                                                <Combobox.ClearTrigger />
                                                <Combobox.Trigger />
                                            </Combobox.IndicatorGroup>
                                        </Combobox.Control>
                                        <Portal>
                                            <Combobox.Positioner>
                                                <Combobox.Content>
                                                    <Combobox.Empty>No items found</Combobox.Empty>
                                                    {allStatesList.items.map((item:any) => (
                                                        <Combobox.Item item={item} key={item.stateId}>
                                                            {item.stateName}
                                                            <Combobox.ItemIndicator />
                                                        </Combobox.Item>
                                                    ))}
                                                </Combobox.Content>
                                            </Combobox.Positioner>
                                        </Portal>
                                    </Combobox.Root>
                                    
                                    <Field.Root>

                                        <Field.Label>PinCode</Field.Label>
                                        <CapitalizedInput
                                            field="PINCODE"
                                            value={form.PINCODE}
                                            onChange={handleChange}
                                            max={999999}
                                            type="number"
                                          
                                        />
                                    </Field.Root>
                                    <Field.Root>
                                        <Field.Label>Mobile</Field.Label>
                                        <CapitalizedInput
                                            field="MOBILE"
                                            value={form.MOBILE}
                                            onChange={handleChange}
                                            max={9999999999}
                                            type="number"
                                       
                                        />
                                    </Field.Root>
                                    <Field.Root>
                                        <Field.Label>Email</Field.Label>
                                        <Input
                                            value={form.EMAILID}
                                            onChange={(e) => handleChange("EMAILID", e.target.value)}
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
                                Account Head Details
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
                            columns={accountColumn}
                            data={accountList}
                            renderRow={(account) => (
                                <>
                                    <Table.Cell>{account.ACNAME}</Table.Cell>
                            
                                    <Table.Cell>{account.ACTYPE}</Table.Cell>
                                    <Table.Cell>{account.COMPANYNAME}</Table.Cell>
                                    <Table.Cell textAlign="center">{account.ACTIVE}</Table.Cell>
                                    <Table.Cell>
                                        <Box display="flex" justifyContent="center">
                                            <FaEdit onClick={() => handleEdit(account)} cursor="pointer" />
                                        </Box>
                                    </Table.Cell>
                                </>
                            )}
                            headerBg="blue.800"
                            headerColor="white"
                            borderColor="white"
                            bodyBg={theme.colors.primary}
                            highlightRowId={highlightedId ? Number(highlightedId) : null} 
                            rowIdKey="ACCODE"
                         
                            emptyText="No companies available"

                     />
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
}

export default AccountHeadMaster;
