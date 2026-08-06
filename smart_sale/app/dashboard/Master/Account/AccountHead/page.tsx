"use client";

import React, { useState, useEffect, useCallback ,useMemo } from "react";
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
    Badge,
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
import { useSoftControlById } from "@/hooks/apiHooks/softControl/useSoftControl";
import { useAllAccountHead, useCreateAccountHead, useUpdateAccountHead, useAccountHeadById } from "@/hooks/apiHooks/accountHead/useAccountHead";
import { AccountHead } from "@/types/accountHead/AccountHead";
import SearchBar from "@/component/search/SearchBar";

import { getAccountHeadFields } from "@/config/master/AccountHeadMaster";

import { useEnterNavigation } from "@/component/form/useEnterNavigation";

import { DynamicForm } from "@/component/form/DynamicForm";
import { useGlobalKey } from "@/components/key/useGlobalKey";
import TransactionLoader from "@/component/loader/Transactionloader";
import { useTransactionLoader } from "@/utils/loader/ResolveLoader";
import ShortcutDialog from "@/components/shortcut/ShortcutDialog";
import { formatToFixed } from "@/utils/format/numberFormat";
import { AdvancedSearch, AdvancedSearchHandle } from "@/component/search/AdvancedSearch";
import { FiFilter, FiRefreshCw } from "react-icons/fi";

import type { PrintColumn } from "@/component/screens/PrintPreviewScreen";
import type { FormField } from "@/types/form/form";
import { Tooltip } from "@/components/ui/tooltip";
import { DataTable, createDataTableColumns } from "@/component/table/DataTable";


const accountHelper = createDataTableColumns<AccountHead>();

function AccountHeadMaster() {
    const { theme } = useTheme();
    const router = useRouter();
    const { isOpen, status, title: loaderTitle, description, openLoader, resolveLoader, closeLoader } = useTransactionLoader();


    /* -------------------- API HOOKS -------------------- */
    const { data, isLoading } = useAllCompanies();

    const { data:showEditIcon } = useSoftControlById('EDIT_ICON');


    const showEditIcons = showEditIcon?.CTLTEXT === "Y" ;
    console.log(showEditIcons ,'showEditicons') 
    

    const { setData, setColumns, setShowSno, title } = usePrint();
    const companies = data?.data ?? [];

    const [search, setSearch] = useState<string>('');
    const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
    const advancedSearchRef = React.useRef<AdvancedSearchHandle>(null);


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

    } = useAllAccountHead(search, advancedFilters);



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

    console.log(accountList, 'accountList');


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

    /* -------------------- ADVANCED SEARCH -------------------- */
    const nativeSelectCss = {
        backgroundColor: theme.colors.formColor,
        color: theme.colors.primary,
        border: `1.5px solid ${theme.colors.primary}`,
        borderRadius: "8px",
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        transition: "all 0.15s ease-in-out",
        _hover: { backgroundColor: theme.colors.accient },
        _focus: { outline: "none", boxShadow: `0 0 0 2px ${theme.colors.primary}` },
    };

    const advancedSearchFields: FormField[] = [
        {
            name: "ACNAME",
            label: "Name",
            type: "text",
            isCapitalized: true,
            placeholder: "Search by name",
            size: "xs",
        },
        {
            name: "STATEID",
            label: "State",
            type: "combobox",
            items: stateCollection,
            placeholder: "Select State",
            size: "xs",
            defaultValue :"22",
            rounded : "sm"
        },
        {
            name: "ACTYPE",
            label: "Customer Type",
            type: "select",
            items: [{"label" : "ALL" , "value" : ""},...AccountTypeList],
            placeholder: "Select Type",
            size: "xs",
            css: nativeSelectCss,
        },
        {
            name: "ACTIVE",
            label: "Active",
            type: "select",
            items: [{ "label": "ALL", "value": "" }, ...activeStatus],
            size: "xs",
            css: nativeSelectCss,
        },
    ];

    const handleAdvancedSearch = (filters: Record<string, any>) => {
        const cleaned: Record<string, any> = {};
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== "" && value !== undefined && value !== null) {
                cleaned[key] = value;
            }
        });
        setAdvancedFilters(cleaned);
    };

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

        console.log(editId, form.ACCODE, 'editId')

        const isDuplicate = accountList.some(
            (acc) =>
                acc.ACNAME?.toLowerCase() === form.ACNAME?.toLowerCase() &&
                Number(acc.ACCODE) !== Number(editId) // 🔥 exclude current editing row
        );

        if (isDuplicate) {
            toastError("Account name already exists");
            return;
        }


        if (editId) {
            openLoader('update', true);
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
                        setTimeout(() => {
                            resolveLoader("success", "update", "", true);
                        }, 500);
                    },
                    onError: () => {
                        setTimeout(() => {
                            resolveLoader("error", "update", "", true);
                        }, 500);
                    }
                }
            );
        } else {
            openLoader('save', true);

            createAccountHead(form, {
                onSuccess: () => {
                    refetch();
                    resetForm();
                    setTimeout(() => {
                        resolveLoader("success", "save", "", true);
                    }, 500);
                },
                onError: (error: any) => {
                    console.log("Error creating account head:", error);
                    if (error) {
                        const message = error.response.data.message;

                        toastError(message ?? "Failed to create account head");
                    }
                    setTimeout(() => {
                        resolveLoader("error", "save", "", true);
                    }, 500);

                }
            });
        }
    };

    useGlobalKey("Alt+s", () => handleSave(), "saveTransaction");
    useGlobalKey("Alt+r", () => resetForm(), "ClearTransaction");
    useGlobalKey("Alt+u", () => handleSave(), "UpdateTransaction");
    useGlobalKey("Alt+e", () => router.back(), "exitachead");
    useGlobalKey("F1", () => advancedSearchRef.current?.toggle(), "accountHeadAdvancedSearch");


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
        ...(showEditIcons ? [{ key: "actions", label: "Actions" }] : []),
    ];

      const partiesColumn = useMemo(() => {
            const cols = [
                accountHelper.display({
                    id: "sno",
                    header: "Sno",
                    cell: ({ row }) => row.index + 1,
                }),
                accountHelper.accessor("ACCODE", { header: "Party Id" }),
                accountHelper.accessor("ACNAME", { header: "Party Name" }),
                accountHelper.accessor("ACTYPE", { header: "Party Type" }),
                accountHelper.accessor("STATE", { header: "STATE" }),
                accountHelper.accessor("OPENING_PURE", { header: "OP Pure" }),
                accountHelper.accessor("OPENING_CASH", { header: "OP Cash" }),
                accountHelper.accessor("ACTIVE", {
                    header: "Active",
                    meta: { align: "center" },
                }),
            ];
    
            if (showEditIcons) {
                cols.push(
                    accountHelper.display({
                        id: "actions",
                        header: "Actions",
                        meta: { align: "center" },
                        cell: ({ row }) => (
                            <Box display="flex" justifyContent="center">
                                <FaEdit onClick={() => handleEdit(row.original)} cursor="pointer" />
                            </Box>
                        ),
                    })
                );
            }
    
            return cols;
        }, [showEditIcons]);
    /* -------------------- EXPORT -------------------- */
    const handleExport = (option: string) => {
        setData(accountList);

        const columns: PrintColumn[] = [
            {
                key: "ACNAME",
                label: "Name",
                // no render needed — raw string is fine
            },
            {
                key: "ACTYPE",
                label: "Account Type",
                align: "center",
                // render → shows the badge in the on-screen preview
                renderCell: (value) => (
                    <Box
                        as="span"
                        display="inline-block"
                        px={3}
                        py={0.5}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight={600}
                        minW="90px"
                        textAlign="center"
                        bg={value === "PR" ? "orange.100" : "green.100"}
                        color={value === "PR" ? "orange.700" : "green.700"}
                    >
                        {value === "PR" ? "PURCHASER" : "CUSTOMER"}
                    </Box>
                ),
                // exportValue → clean text for Print / Excel
                printValue: (value) => (value === "PR" ? "PURCHASER" : "CUSTOMER"),
            },
            {
                key: "STATE",
                label: "State",
            },
            {
                key: "OPENING_PURE",
                label: "Opening Pure",
                isNumeric: true,
                align: "end",
                allowTotal: true,
                renderCell: (value) => <Box fontWeight="bold">{formatToFixed(value, 3)}</Box>
            },
            {
                key: "OPENING_CASH",
                label: "Opening Cash",
                isNumeric: true,
                align: "end",
                allowTotal: true,
                renderCell: (value) => <Box fontWeight="bold">{formatToFixed(value, 2)}</Box>
            },
            // {
            //     key: "ACTIVE",
            //     label: "Active",
            //     align: "center",
            //     renderCell: (value) => (
            //         <Badge
            //             colorScheme={value ? "green" : "red"}
            //             variant="subtle"
            //             borderRadius="full"
            //             px={2}
            //         >
            //             {value ? "Active" : "Inactive"}
            //         </Badge>
            //     ),
            //     printValue: (value) => (value ? "Active" : "Inactive"),
            // },
        ];

        setColumns(columns);
        setShowSno(true);
        title?.("Account Master");
        router.push(`/print?export=${option}`);
    };
    const formfields = getAccountHeaderForm.map(f => f.name);

    const { register, focusFirst, focusNext } = useEnterNavigation(formfields, handleSave);

    useEffect(() => {
        focusFirst();
    }, [focusFirst]);




    const renderAccountRow = useCallback(
        (account: any, index: number) => {
            console.log(account, 'accountinrender')
            return (
                <>
                    <Table.Cell>{index + 1}</Table.Cell>
                    <Table.Cell>{account.ACNAME}</Table.Cell>
                    <Table.Cell textAlign="center">
                        <Box
                            bg={account.ACTYPE === "PR" ? "orange.200" : "green.100"}
                            color={account.ACTYPE === "PR" ? "orange.700" : "green.700"}
                            px={3}
                            py={1}
                            borderRadius="full"
                            fontSize="xs"
                            fontWeight="600"
                            display="inline-block"
                            minW="90px"
                            textAlign="center"
                        >
                            {account.ACTYPE === "PR" ? "PURCHASER" : "CUSTOMER"}
                        </Box>
                    </Table.Cell>
                    <Table.Cell>{account.STATE}</Table.Cell>
                    <Table.Cell textAlign="end">{formatToFixed(account.OPENING_PURE, 3)}</Table.Cell>
                    <Table.Cell textAlign="end">{formatToFixed(account.OPENING_CASH, 2)}</Table.Cell>
                    <Table.Cell textAlign="center">
                        <Badge
                            colorPalette={account.ACTIVE === "Y" ? "green" : "red"}
                            variant="subtle"
                            borderRadius="full"
                            px={2}
                        >
                            {account.ACTIVE === "Y" ? "Active" : "Inactive"}
                        </Badge>
                    </Table.Cell>
                    {showEditIcons && 
                        <Table.Cell>
                            <Box display="flex" justifyContent="center">
                                <FaEdit
                                    onClick={() => handleEdit(account)}
                                    cursor="pointer"
                                />
                            </Box>
                        </Table.Cell>
                    }
                  
                </>
            );
        },
        [handleEdit]
    );

    /* -------------------- UI -------------------- */
    return (
        <Box
            fontWeight='500'
            bg={theme.colors.bg}
            color={theme.colors.primary}

        >
            <TransactionLoader
                isOpen={isOpen}
                status={status}
                title={loaderTitle}
                description={description}
                onClose={closeLoader}
            />
            <Toaster />
            <ShortcutDialog filter />

            <AdvancedSearch
                ref={advancedSearchRef}
                title="Advanced Filters"
                fields={advancedSearchFields}
                initialFilters={{ ACTIVE: "Y" }}
                onSearch={handleAdvancedSearch}
                size="xs"
            />
            <Grid templateColumns={{ base: "1fr", sm: "1fr 2fr" }} gap={2}>
                {/* ---------------- FORM ---------------- */}
                <GridItem>
                    <VStack bg={theme.colors.formColor} p={2} borderRadius="xl" border="1px solid #eef">

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
                                <IoIosExit /> Reset
                            </Button>
                            <Button size="xs" colorPalette="blue" onClick={() => router.back()}>
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
                                
                            <Flex gap={2} alignItems={"center"}>
                                <Box >
                                    <SearchBar
                                        searchTerm={search}
                                        onChange={setSearch}
                                        placeholder="Search account masters"
                                        size="2xs"
                                    />
                                </Box>
                                <Tooltip content="Refresh">
                                    <Button
                                        variant="ghost"
                                        size="2xs"
                                        color={theme.colors.primaryText}
                                        _hover={{ color: "black" }}
                                        onClick={() => refetch()}
                                        aria-label="Refresh"
                                        loading={accountHeadLoading}
                                    >
                                        <FiRefreshCw />
                                    </Button>
                                </Tooltip>
                                <Tooltip content="Advanced Filter">
                                    <Button
                                        variant="ghost"
                                        size="2xs"
                                        color={theme.colors.primaryText}
                                        _hover={{ color: "black" }}
                                        onClick={() => advancedSearchRef.current?.open()}
                                        aria-label="Advanced Search"
                                        title="Advanced Search (F1)"
                                    >
                                        <FiFilter />
                                    </Button>
                                </Tooltip>
                                <Tooltip content="Export Excel">
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
                                </Tooltip>
                                <Tooltip content="Export PDF">
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
                                </Tooltip>
                            </Flex>
                            


                        </Box>


                        <DataTable
                            columns={partiesColumn}
                            data={accountList}
                            headerBg={theme.colors.primary}
                            headerColor="white"
                            bodyBg={theme.colors.greyColor}
                            borderColor={theme.colors.primary}
                            editingRowId={editId ?? (highlightedId != null ? String(highlightedId) : null)}
                            pagination={{enabled : true , showTotalCount : true , }}
                            editingRowBg={theme.colors.accient}
                            onRowClick={(account) => handleEdit(account)}
                            rowIdKey="ACCODE"
                            
                        
                        />
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
}

export default AccountHeadMaster;
