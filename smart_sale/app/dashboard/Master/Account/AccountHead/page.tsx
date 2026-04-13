"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    VStack,
    Text,
    Grid,
    GridItem,
    HStack,
    Fieldset,
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
} from "@/hooks/apiHooks/company/useCompany";

import ScrollToTop from "@/component/scroll/ScrollToTop";
import { toastCreated, toastError, toastLoaded, toastUpdated, toastUploaded } from "@/component/toast/toast";
import { CustomTable } from "@/component/table/CustomTable";
import { usePrint } from "@/context/print/usePrintContext";
import { useRouter } from "next/navigation";
import { FaPrint, FaFileExcel } from "react-icons/fa";
import { AccountTypeList } from "@/data/ACCOUNTtYPE/AccountType";
import { useAllStates } from "@/hooks/apiHooks/state/useStates";
import { useAllAccountHead, useCreateAccountHead, useUpdateAccountHead, useAccountHeadById } from "@/hooks/apiHooks/accountHead/useAccountHead";
import { AccountHead } from "@/types/accountHead/AccountHead";
import SearchBar from "@/component/search/SearchBar";

import { getAccountHeadFields } from "@/config/master/AccountHeadMaster";

import { useEnterNavigation } from "@/component/form/useEnterNavigation";

import { DynamicForm } from "@/component/form/DynamicForm";


function AccountHeadMaster() {
    const { theme } = useTheme();


   

    /* -------------------- API HOOKS -------------------- */
    const { data, isLoading } = useAllCompanies();
    const router = useRouter();
    const { setData, setColumns, setShowSno, title } = usePrint();
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
        OPENING_CASH: "",
        OPENING_PURE: "",
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

    const activeStatus = [

        { label: "YES", value: "Y" },
        { label: "NO", value: "N" },

    ];

    const getAccountHeaderForm = getAccountHeadFields({
        accountTypeCollection: AccountTypeList,
        stateOptions: stateCollection,
        activeOptions: activeStatus,
    })
    console.log(getAccountHeaderForm, 'getAccountHeaderForm')

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
                OPENING_CASH: "",
                OPENING_PURE: "",
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
            OPENING_CASH: account.OPENING_CASH ?? "",
            OPENING_PURE: account.OPENING_PURE ?? "",
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
            OPENING_CASH: "",
            OPENING_PURE: "",
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
        { key: "OPENING_PURE", label: "Opening Pure" },
        { key: "OPENING_CASH", label: "Opening Cash" },

        // { key: "OPENING_WEIGHT", label: "Opening Weight" },
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
    const formfields = getAccountHeaderForm.map(f => f.name);

    const { register, focusFirst, focusNext } = useEnterNavigation(formfields, handleSave);

    /* -------------------- UI -------------------- */
    return (
        <Box
            fontWeight='500'
            bg={theme.colors.primary}
            color={theme.colors.secondary}

        >
            <Toaster />
            <Grid templateColumns={{ base: "1fr", sm: "1fr 2fr" }} gap={2}>
                {/* ---------------- FORM ---------------- */}
                <GridItem>
                    <VStack bg={theme.colors.formColor} p={2} borderRadius="xl" border="1px solid #eef">
                        <Text fontSize="small" fontWeight="600" >
                            ACCOUNT HEAD
                        </Text>

                        <Fieldset.Root size="sm" width="100%">
                            <Fieldset.Content>
                                <DynamicForm
                                    fields={getAccountHeaderForm}
                                    formData={form}
                                    onChange={handleChange}
                                    register={register}
                                    focusNext={focusNext}
                                    layout="vertical"

                                />
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
                        <Box display='flex' mb={2} justifyContent='space-between' alignItems='center'>
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
                            renderRow={(account, index) => (
                                <>

                                    <Table.Cell>{index + 1}</Table.Cell>
                                    <Table.Cell>{account.ACNAME}</Table.Cell>
                                    <Table.Cell>{account.ACTYPE}</Table.Cell>
                                    <Table.Cell>{account.STATE}</Table.Cell>
                                    <Table.Cell textAlign="center">{account.OPENING_PURE}</Table.Cell>
                                    <Table.Cell textAlign="center">{account.OPENING_CASH}</Table.Cell>

                                    {/* <Table.Cell textAlign="center">{account.OPENING_WEIGHT}</Table.Cell> */}
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
