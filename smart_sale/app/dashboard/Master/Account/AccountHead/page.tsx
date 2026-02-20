"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { toastCreated, toastError, toastLoaded, toastUpdated, toastUploaded } from "@/component/toast/toast";
import { CustomTable } from "@/component/table/CustomTable";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { usePrint } from "@/context/print/usePrintContext";
import { useRouter } from "next/navigation";
import { FaPrint, FaFileExcel } from "react-icons/fa";
import { AccountTypeList } from "@/data/ACCOUNTtYPE/AccountType";
import { useAllStates } from "@/hooks/state/useStates";
import { useAllAccountHead, useCreateAccountHead, useUpdateAccountHead, useAccountHeadById } from "@/hooks/accountHead/useAccountHead";
import { AccountHead } from "@/types/accountHead/AccountHead";
import { SelectCombobox } from "@/components/ui/selectComboBox";
import SearchBar from "@/component/search/SearchBar";


function AccountHeadMaster() {
    const { theme } = useTheme();



    /* -------------------- API HOOKS -------------------- */
    const { data, isLoading } = useAllCompanies();
    const router = useRouter();
    const { setData, setColumns, setShowSno ,title} = usePrint();
    const companies = data?.data ?? [];

    const [search, setSearch] = useState<string>('');


    const {
        data: allStates,
        isLoading: stateLoading,
        isError: stateError,
    } = useAllStates();

    const {
        data: allAccountHead,
        isLoading: accountHeadLoading,
        isError: accountHeadError,
        refetch,

    } = useAllAccountHead(search);



    const { mutate: createAccountHead, isPending } = useCreateAccountHead();
    const { mutate: updateAccountHead, isPending: isUpdating } = useUpdateAccountHead();

    const controller = new AbortController();
    const [accountId, setAccountId] = useState<string | undefined>("");

    /* -------------------- FORM STATE -------------------- */
    const [form, setForm] = useState<AccountHead>({
        ACCODE: "",
        ACNAME: "",
        ACTYPE: "",
        // ADDRESS1: "",
        // ADDRESS2: "",
        // AREA: "",
        // CITY: "",
        STATEID: "24",
        // PINCODE: "",
        // MOBILE: "",
        // EMAILID: "",
        // GSTNO: "",
        // PAN: "",
        // WEBSITE: "",
        // AADHARNO: "",
        // OPENING_CASH: "",
        // OPENING_PURE: "",
        // OPENING_WEIGHT: "",
        ACTIVE: "Y",
    });

    /* -------------------- UI STATE -------------------- */
    const [highlightedId, setHighlightedId] = useState<number | undefined>();
    const [editId, setEditId] = useState<string | null>(null);

    /* -------------------- FILE STATE -------------------- */
    const [logoFile, setLogoFile] = useState<File | undefined>();
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    /* -------------------- SELECT COLLECTIONS -------------------- */
    const [stateCollection, setStateCollection] = useState<any[]>([]);
    const [companyCollection, setCompanyCollection] = useState<any[]>([]);

    /* -------------------- SAFE DATA -------------------- */
    const accountList = Array.isArray(allAccountHead?.data?.acheads)
        ? allAccountHead.data.acheads
        : [];


    const safeValue = (
        value: string | undefined,
        collection: { label: string; value: string }[]
    ): string | undefined => {
        return collection.some(item => item.value === value) ? value : "";
    };

    const activeStatus = createListCollection({
        items: [
            { label: "YES", value: "Y" },
            { label: "NO", value: "N" },
        ],
    });

    /* -------------------- EFFECTS -------------------- */

    // Auto code generate
    useEffect(() => {
        setAccountId(allAccountHead?.data?.nextAccode)
        if (!editId) {
            setForm((prev) => ({
                ...prev,
                ACCODE: String(accountId ?? ""),
                ACNAME: "",
                ACTYPE: "",
                // ADDRESS1: "",
                // ADDRESS2: "",
                // AREA: "",
                // CITY: "",
                STATEID: "24",
                // PINCODE: "",
                // MOBILE: "",
                // EMAILID: "",
                // GSTNO: "",
                // ACTIVE: "Y",
                // OPENING_CASH: "",
                // OPENING_PURE: "",
                // OPENING_WEIGHT: "",
                // PAN: "",
                // WEBSITE: "",
                // AADHARNO: "",
                ACTIVE: "Y",
            }));
        }

        return () => {
            controller.abort();
        };
    }, [editId, allAccountHead, accountId]);

    // Company dropdown
    useEffect(() => {
        if (!companies?.length) return;

        const mapped = companies.map((c: any) => ({
            label: c.COMPANYNAME,
            value: String(c.COMPANYID),
        }));

        setCompanyCollection(mapped);
    }, [companies]);

    // State dropdown
    useEffect(() => {
        if (!allStates?.length) return;

        const mapped = allStates.map((s: any) => ({
            label: s.stateName,
            value: String(s.stateId),
        }));

        setStateCollection(mapped);
    }, [allStates]);

    const { data: accountHeadData } = useAccountHeadById(Number(editId) ?? 0);
    const account = accountHeadData?.data;

    // Edit load
    useEffect(() => {
        if (!account) return;

        setForm({
            ACCODE: String(account.ACCODE) ?? "",
            ACNAME: account.ACNAME ?? "",
            ACTYPE: account.ACTYPE ?? "",
            // ADDRESS1: account.ADDRESS1 ?? "",
            // ADDRESS2: account.ADDRESS2 ?? "",
            // AREA: account.AREA ?? "",
            // CITY: account.CITY ?? "",
            // MOBILE: account.MOBILE ?? "",
            // EMAILID: account.EMAILID ?? "",
            // PINCODE: account.PINCODE ?? "",
            // GSTNO: account.GSTNO ?? "",
            ACTIVE: account.ACTIVE ?? "Y",
            STATEID: String(account.STATEID) ?? "",
            // OPENING_CASH: account.OPENING_CASH ?? "",
            // OPENING_PURE: account.OPENING_PURE ?? "",
            // OPENING_WEIGHT: account.OPENING_WEIGHT ?? "",
            // PAN: account.PAN ?? "",
            // WEBSITE: account.WEBSITE ?? "",
            // AADHARNO: account.AADHARNO ?? "",
        });
    }, [account]);

    // Scroll + toast after edit load
    useEffect(() => {
        if (!account) return;

        setTimeout(() => {
            toastLoaded("Account Head");
            ScrollToTop();
        }, 0);
    }, [account]);

    // Highlight reset
    useEffect(() => {
        if (!highlightedId) return;

        const timer = setTimeout(() => {
            setHighlightedId(undefined);
        }, 3000);

        return () => clearTimeout(timer);
    }, [highlightedId]);

    /* -------------------- HANDLERS -------------------- */

    const handleChange = (field: keyof AccountHead, value: any) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const resetForm = () => {
        setEditId(null);
        setLogoFile(undefined);
        setImagePreview(null);

        setForm({
            ACCODE: String(accountId ?? ""),
            ACNAME: "",
            ACTYPE: "",
            // ADDRESS1: "",
            // ADDRESS2: "",
            // AREA: "",
            // CITY: "",
            STATEID: "24",
            // PINCODE: "",
            // MOBILE: "",
            // EMAILID: "",
            // GSTNO: "",
            // PAN: "",
            // WEBSITE: "",
            // AADHARNO: "",
            // OPENING_CASH: "",
            // OPENING_PURE: "",
            // OPENING_WEIGHT: "",
            ACTIVE: "Y",
        });
    };

    /* -------------------- SAVE -------------------- */
    const handleSave = () => {
        if (!form.ACNAME?.trim()) {
            toastError("Name is required");
            return;
        }


        if (!form.ACTYPE?.trim()) {
            toastError("Account Type is required");
            return;
        }

        // if (!form.ADDRESS1?.trim()) {
        //     toastError("Address is required");
        //     return;
        // }

        // if (!form.AREA?.trim()) {
        //     toastError("Area is required");
        //     return;
        // }

        // if (!form.CITY?.trim()) {
        //     toastError("City is required");
        //     return;
        // }

        // if (!form.PINCODE?.trim()) {
        //     toastError("Pincode is required");
        //     return;
        // }

        // if (form.PINCODE) {
        //     const pinRegex = /^[0-9]{6}$/;
        //     if (!pinRegex.test(form.PINCODE)) {
        //         toastError("Pincode must be exactly 6 digits");
        //         return;
        //     }
        // }

        // if (!form.MOBILE?.trim()) {
        //     toastError("Mobile Number is required");
        //     return;
        // }

        // if (form.MOBILE) {
        //     const mobileRegex = /^[0-9]{10}$/;
        //     if (!mobileRegex.test(form.MOBILE)) {
        //         toastError("Mobile number must be exactly 10 digits");
        //         return;
        //     }
        // }

        // if (!form.EMAILID?.trim()) {
        //     toastError("Email is required");
        //     return;
        // }
        // if (form.GSTNO) {
        //     const regexp = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

        //     if (!regexp.test(form.GSTNO)) {
        //         toastError("Invalid GST Number");
        //         return;
        //     }
        // }

        // if (form.AADHARNO?.trim()) {
        //     const aadharRegex = /^[0-9]{12}$/;
        //     if (!aadharRegex.test(form.AADHARNO.trim())) {
        //         toastError("Aadhar must be exactly 12 digits");
        //         return;
        //     }
        // }

        // if (form.PAN?.trim()) {
        //     const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        //     if (!panRegex.test(form.PAN.trim().toUpperCase())) {
        //         toastError("PAN must be in format: ABCDE1234F");
        //         return;
        //     }
        // }
       
  
        if (editId) {
            updateAccountHead(
                {
                    id: Number(editId),
                    data: form,
                },
                {
                    onSuccess: () => {              
                        refetch();
                        setHighlightedId(Number(editId));
                        resetForm();
                    },
                }
            );
        } else {

            const isDuplicate = accountList.some(
                (acc) => acc.ACNAME?.toLowerCase() === form.ACNAME?.toLowerCase()
            );

            if (isDuplicate) {
                toastError("Account name already exists");
                return;
            }

            createAccountHead(form, {
                onSuccess: () => {
                    refetch();
                    resetForm();
                },
            });
        }
    };

    /* -------------------- EDIT -------------------- */
    const handleEdit = (account: AccountHead) => {
        setEditId(String(account?.ACCODE));
    };

    /* -------------------- TABLE COLUMNS -------------------- */
    const accountColumn = [

        { key: "ACCODE", label: "Sno" },
        { key: "ACNAME", label: "Name" },
        { key: "ACTYPE", label: "Account Type" },
        { key: "STATE", label: "State" },
        { key: "ACTIVE", label: "Active" },
        { key: "actions", label: "Actions" },
    ];

    /* -------------------- EXPORT -------------------- */
    const handleExport = (option: string) => {
        setData(accountList);
        setColumns([
            { key: "ACNAME", label: "Name" },
            { key: "ACTYPE", label: "Account Type" },
            { key: "ACTIVE", label: "Active" },
        ]);
        setShowSno(true);
        title?.("Account Master")
        router.push(`/print?export=${option}`);
    };


    /* -------------------- UI -------------------- */
    return (
        <Box
            fontWeight='500'
            bg={theme.colors.primary}
            color={theme.colors.secondary}

        >
            <Toaster />
            <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={2}>
                {/* ---------------- FORM ---------------- */}
                <GridItem>
                    <VStack bg={theme.colors.formColor} p={2} borderRadius="xl" border="1px solid #eef">
                        <Text fontSize="small" fontWeight="600" >
                            ACCOUNT HEAD
                        </Text>

                        <Fieldset.Root size="sm" width="100%">
                            <Fieldset.Content>
                                <Grid css={{ gridTemplateColumns: "repeat(1, 1fr)"  }} gap={3}>

                                    {/* ENTRY ID */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">ACCOUNT ID :</Box>
                                        <CapitalizedInput
                                            field="ACCODE"
                                            value={form.ACCODE}
                                            onChange={handleChange}
                                            size="2xs"
                                            maxWidth="100px"
                                            disabled
                                        />
                                    </Box>

                                    {/* CUSTOMER NAME */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">CUSTOMER NAME :</Box>
                                        <CapitalizedInput
                                            field="ACNAME"
                                            value={form.ACNAME}
                                            onChange={handleChange}
                                            size="2xs"
                                        />
                                    </Box>

                                    {/* CUSTOMER TYPE */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">CUSTOMER TYPE :</Box>
                                        <SelectCombobox
                                            // label="ACTYPE"
                                            value={safeValue(form.ACTYPE, AccountTypeList)}
                                            onChange={(val) => handleChange("ACTYPE", val)}
                                            editId={Number(editId)}
                                            items={AccountTypeList}
                                            placeholder="Select Type"
                                        />
                                    </Box>

                                    {/* ADDRESS (span 2) */}
                                    {/* <Box display="flex" alignItems="center" gap={2} >
                                        <Box minW="100px" fontSize="2xs">ADDRESS :</Box>
                                        <CapitalizedInput
                                            field="ADDRESS1"
                                            value={form.ADDRESS1}
                                            onChange={handleChange}
                                            size="2xs"
                                            allowSpecial
                                        />
                                    </Box> */}

                                    {/* AREA */}
                                    {/* <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">AREA :</Box>
                                        <CapitalizedInput
                                            field="AREA"
                                            value={form.AREA}
                                            onChange={handleChange}
                                            size="2xs"
                                        />
                                    </Box> */}

                                    {/* CITY */}
                                    {/* <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">CITY :</Box>
                                        <CapitalizedInput
                                            field="CITY"
                                            value={form.CITY}
                                            onChange={handleChange}
                                            size="2xs"
                                        />
                                    </Box> */}

                                    {/* STATE */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">STATE :</Box>
                                        <SelectCombobox
                                            // label="STATEID"
                                            value={safeValue(form.STATEID, stateCollection)}
                                            onChange={(val) => handleChange("STATEID", val)}
                                            editId={Number(editId)}
                                            items={stateCollection}
                                            placeholder="Select State"
                                        />
                                    </Box>

                                    {/* PINCODE */}
                                    {/* <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">PINCODE :</Box>
                                        <CapitalizedInput
                                            field="PINCODE"
                                            value={form.PINCODE}
                                            onChange={handleChange}
                                            size="2xs"
                                            type="number"
                                            inputModeType="pincode"
                                        />
                                    </Box> */}

                                    {/* MOBILE */}
                                    {/* <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">MOBILE :</Box>
                                        <CapitalizedInput
                                            field="MOBILE"
                                            value={form.MOBILE}
                                            onChange={handleChange}
                                            size="2xs"
                                            type="number"
                                            inputModeType="mobile"
                                            allowDecimal={false}
                                        />
                                    </Box> */}

                                    {/* EMAIL */}
                                    {/* <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">EMAIL :</Box>
                                        <CapitalizedInput
                                            field="EMAILID"
                                            size="2xs"
                                            value={form.EMAILID}
                                            onChange={handleChange}
                                            inputModeType="email"
                                        />
                                    </Box> */}

                                    {/* GSTIN */}
                                    {/* <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">GSTIN :</Box>
                                        <CapitalizedInput
                                            field="GSTNO"
                                            value={form.GSTNO}
                                            onChange={handleChange}
                                            size="2xs"
                                            inputModeType="gst"
                                        />
                                    </Box> */}

                                    {/* OPENING WEIGHT */}
                                    {/* <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">OPENING WEIGHT :</Box>
                                        <CapitalizedInput
                                            field="OPENING_WEIGHT"
                                            value={form.OPENING_WEIGHT}
                                            onChange={handleChange}
                                            size="2xs"
                                            type="number"
                                            max={999}
                                            allowDecimal
                                        />
                                    </Box> */}

                                    {/* OPENING PURE */}
                                    {/* <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">OPENING PURE :</Box>
                                        <CapitalizedInput
                                            field="OPENING_PURE"
                                            value={form.OPENING_PURE}
                                            onChange={handleChange}
                                            size="2xs"
                                            type="number"
                                            max={999}
                                            allowDecimal
                                        />
                                    </Box> */}

                                    {/* OPENING CASH */}
                                    {/* <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">OPENING CASH :</Box>
                                        <CapitalizedInput
                                            field="OPENING_CASH"
                                            value={form.OPENING_CASH}
                                            onChange={handleChange}
                                            size="2xs"
                                            type="number"
                                            allowDecimal={true}
                                            decimalScale={2}

                                        />
                                    </Box> */}

                                    {/* AADHAR NO*/}
                                    {/* <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">AADHAR NO :</Box>
                                        <CapitalizedInput
                                            field="AADHARNO"
                                            value={form.AADHARNO}
                                            onChange={handleChange}
                                            size="2xs"
                                            type="number"
                                            inputModeType="aadhaar"
                                            allowDecimal={false}   // 🚫 no dot
                                        />
                                    </Box> */}

                                    {/* PAN NO */}
                                    {/* <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">PAN NO :</Box>
                                        <CapitalizedInput
                                            field="PAN"
                                            value={form.PAN}
                                            onChange={handleChange}
                                            size="2xs"
                                            max={10}
                                            allowDecimal={false}
                                            inputModeType="pan"
                                        />
                                    </Box> */}

                                    {/* WEBSITE*/}
                                    {/* <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">WEBSITE :</Box>
                                        <CapitalizedInput
                                            field="WEBSITE"
                                            value={form.WEBSITE}
                                            onChange={handleChange}
                                            size="2xs"
                                            allowDecimal={true}
                                        />
                                    </Box> */}

                                    {/* ACTIVE */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="100px" fontSize="2xs">ACTIVE :</Box>
                                        <NativeSelect.Root size="xs" maxW="80px" fontSize='2xs' >
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
                                                <For each={activeStatus.items} >
                                                    {(item) => (
                                                        <option key={item.value} value={item.value} className="text-xs ">
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
                        <Box display='flex' mb={2}  justifyContent='space-between' alignItems='center'>
                            <Text fontWeight="semibold" fontSize="small">
                                ACCOUNT HEAD LIST
                            </Text>
                            <Box display='flex' gap={1}>
                                <Box >
                                    <SearchBar 
                                        searchTerm={search}
                                        onChange={setSearch}
                                        placeholder="Search account masters" 
                                        size="2xs"

                                    />
                                </Box>
                                <Flex>
                                    <Button
                                        variant="ghost"
                                        size="2xs"
                                        color={theme.colors.green}
                                        _hover={{ color: "black" }}
                                        onClick={() => handleExport("excel")}
                                        aria-label="Export Excel"
                                    >
                                        <FaFileExcel />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="2xs"
                                        color={theme.colors.primaryText}
                                        _hover={{ color: "black" }}
                                        onClick={() => handleExport("pdf")}
                                        aria-label="Export PDF"
                                    >
                                        <FaPrint />
                                    </Button>
                                </Flex>
                            </Box>

                           
                        </Box>


                        <CustomTable
                            columns={accountColumn}
                            data={accountList}
                            renderRow={(account ,index) => (
                                <>  

                                    <Table.Cell>{index+1}</Table.Cell>
                                    <Table.Cell>{account.ACNAME}</Table.Cell>
                                    <Table.Cell>{account.ACTYPE}</Table.Cell>
                                    <Table.Cell>{account.STATE}</Table.Cell>
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
