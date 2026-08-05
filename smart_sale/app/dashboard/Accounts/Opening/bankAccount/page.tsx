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
    Field,
    Flex,
    Textarea,
    Combobox,
    Portal,
    useFilter,
    useListCollection,
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";
import { AiOutlineSave } from "react-icons/ai";
import { IoIosExit } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { FaFileExcel, FaPrint } from "react-icons/fa";
import { FiFilter } from "react-icons/fi";
import { AdvancedSearch, AdvancedSearchHandle } from "@/component/search/AdvancedSearch";
import { Tooltip } from "@/components/ui/tooltip";
import type { FormField } from "@/types/form/form";

import { useTheme } from "@/context/theme/themeContext";
import ScrollToTop from "@/component/scroll/ScrollToTop";
import { Toaster } from "@/components/ui/toaster";
import { toastLoaded, toastCreated, toastUpdated, toastError } from "@/component/toast/toast";

import { CustomTable } from "@/component/table/CustomTable";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { usePrint } from "@/context/print/usePrintContext";
import { useRouter } from "next/navigation";

import { useAllBankAccounts, useCreateBankAccount, useUpdatebankAccount } from "@/hooks/apiHooks/bankAccount/useBankAccount";
import { BankAccount } from "@/types/bankAccount/BankAccount";
import { bankAccountType } from "@/data/bankAccount/bankAccountTypes";
import { SelectCombobox } from "@/components/ui/selectComboBox";
import SearchBar from "@/component/search/SearchBar";

import { BankAccountForm } from "@/config/master/BankAccountMaster";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { DynamicForm } from "@/component/form/DynamicForm";
import { useGlobalKey } from "@/components/key/useGlobalKey";
import { useSoftControlById } from "@/hooks/apiHooks/softControl/useSoftControl";

import type { PrintColumn } from "@/component/screens/PrintPreviewScreen";

const EMPTY_FORM: BankAccount = {
    ACCOUNTNO: "",
    ACCOUNTTYPE: "S",
    ACHOLDERNAME: "",
    ADDRESS: "",
    BANKAC: "",
    BANKNAME: "",
    BRANCHNAME: "",
    OPENINGBALANCE: "",
    REMARKS: "",
};

function BankAccountMaster() {
    const { contains } = useFilter({ sensitivity: "base" });
    const { theme } = useTheme();
    const router = useRouter();
    const { setData, setColumns, setShowSno, title } = usePrint();
    const [filter, setFilter] = useState<string>('');
    const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
    const advancedSearchRef = React.useRef<AdvancedSearchHandle>(null);

    const { data: showEditIcon } = useSoftControlById('EDIT_ICON');
    const showEditIcons = showEditIcon?.CTLTEXT === "Y";

    const [form, setForm] = useState<BankAccount>(EMPTY_FORM);
    const [editId, setEditId] = useState<number | null>(null);
    const [highlightedId, setHighlightedId] = useState<number | null>(null);

    const { data: allBankAccountsData, refetch } = useAllBankAccounts(filter, advancedFilters);
    const createMutation = useCreateBankAccount();
    const updateMutation = useUpdatebankAccount();

    const bankAccountList = Array.isArray(allBankAccountsData?.data) ? allBankAccountsData.data : [];

    const getFormFields = BankAccountForm(bankAccountType);

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
        { name: "ACCOUNTNO", label: "Account Number", type: "text", placeholder: "Search by account number", size: "xs" },
        { name: "ACCOUNTTYPE", label: "Account Type", type: "select", items: [{ label: "ALL", value: "" }, ...bankAccountType], size: "xs", css: nativeSelectCss },
        { name: "ACHOLDERNAME", label: "Account Holder Name", type: "text", placeholder: "Search by holder name", size: "xs" },
        { name: "ADDRESS", label: "Address", type: "text", placeholder: "Search by address", size: "xs" },
        { name: "BANKAC", label: "Bank A/C", type: "text", placeholder: "Search by bank a/c", size: "xs" },
        { name: "BANKNAME", label: "Bank Name", type: "text", placeholder: "Search by bank name", size: "xs" },
        { name: "BRANCHNAME", label: "Branch Name", type: "text", placeholder: "Search by branch name", size: "xs" },
        { name: "OPENINGBALANCE", label: "Opening Balance", type: "number", placeholder: "Search by opening balance", size: "xs" },
        { name: "REMARKS", label: "Remarks", type: "text", placeholder: "Search by remarks", size: "xs" },
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


    const isEditing = !!editId;

    // Clear form when editId becomes null
    useEffect(() => {
        if (!editId) {
            setForm(EMPTY_FORM);
        }
    }, [editId]);


    // Auto-clear highlight after 3 seconds
    useEffect(() => {
        if (!highlightedId) return;
        const timer = setTimeout(() => setHighlightedId(null), 3000);
        return () => clearTimeout(timer);
    }, [highlightedId]);

    const handleChange = (field: keyof BankAccount, value: string | number) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const findAccountById = (id: number) => {
        return bankAccountList.find((acc) => Number(acc.ENTRYNO) === id);
    };

    const handleEdit = (account: any) => {
        const id = Number(account.ENTRYNO);
        setEditId(id);

        const selected = findAccountById(id);
        if (selected) {
            setForm({
                ACCOUNTNO: selected.ACCOUNTNO || "",
                ACCOUNTTYPE: selected.ACCOUNTTYPE || "",
                ACHOLDERNAME: selected.ACHOLDERNAME || "",
                ADDRESS: selected.ADDRESS || "",
                BANKAC: selected.BANKAC || "",
                BANKNAME: selected.BANKNAME || "",
                BRANCHNAME: selected.BRANCHNAME || "",
                OPENINGBALANCE: selected.OPENINGBALANCE || "",
                REMARKS: selected.REMARKS || "",
            });
            ScrollToTop();
            toastLoaded("Bank Account");
        }
    };

    const handleSave = () => {
        // Basic required field validation
        if (!form.BANKAC?.trim()) return toastError("Bank Account is required");
        if (!form.ACCOUNTNO?.trim()) return toastError("Account Number is required");
        if (!form.ACHOLDERNAME?.trim()) return toastError("Account Holder Name is required");
        if (!form.ACCOUNTTYPE?.trim()) return toastError("Account Type is required");
        if (!form.BANKNAME?.trim()) return toastError("Bank Name is required");
        if (!form.BRANCHNAME?.trim()) return toastError("Branch Name is required");

        if (editId) {
            updateMutation.mutate(
                { ENTRYNO: editId, payload: form },
                {
                    onSuccess: () => {
                        toastUpdated("Bank Account");
                        setHighlightedId(editId);
                        setEditId(null); // reset form after success
                        refetch();
                        setForm(EMPTY_FORM);
                    },
                    onError: () => toastError("Failed to update bank account"),
                }
            );
        } else {
            createMutation.mutate(form, {
                onSuccess: (res: any) => {
                    toastCreated("Bank Account");
                    if (res?.data?.ENTRYNO) setHighlightedId(res.data.ENTRYNO);
                    setEditId(null); // reset form
                    refetch();
                    setForm(EMPTY_FORM);
                },
                onError: () => toastError("Failed to create bank account"),
            });
        }
    };

    const handleExport = (option: string) => {
        setData(bankAccountList);
        setColumns([
            { key: "BANKAC", label: "Bank Account" },
            { key: "ACCOUNTNO", label: "Account No" },
            { key: "ACHOLDERNAME", label: "A/C Holder Name" },
            { key: "ACCOUNTTYPE", label: "Account Type" },
            { key: "BANKNAME", label: "Bank Name" },
            { key: "BRANCHNAME", label: "Branch Name" },
            { key: "ADDRESS", label: "Address" },
            { key: "OPENINGBALANCE", label: "Opening Balance" },
            { key: "REMARKS", label: "Remarks" },
        ]);
        title?.("Bank Account Master List")
        setShowSno(true);
        router.push(`/print?export=${option}`);
    };

    const tableColumns = [
        { key: "ENTRYNO", label: "Entry No" },
        { key: "BANKAC", label: "Bank Account" },
        { key: "ACCOUNTNO", label: "Account No" },
        { key: "ACHOLDERNAME", label: "A/C Holder Name" },
        { key: "ACCOUNTTYPE", label: "Account Type" },
        { key: "BANKNAME", label: "Bank Name" },
        { key: "BRANCHNAME", label: "Branch Name" },
        ...(showEditIcons ? [{ key: "actions", label: "Actions", align: "center" as const }] : []),
    ];

    const fieldName = getFormFields.map(f => f.name);
    const { register, focusFirst, focusNext } = useEnterNavigation(fieldName, handleSave);



    useEffect(() => {
        focusFirst()
    }, []);


    useGlobalKey("Alt+s", () => handleSave());
    useGlobalKey("Alt+r", () => setForm(EMPTY_FORM));
    useGlobalKey("alt+e", () => router.back());
    useGlobalKey("F1", () => advancedSearchRef.current?.toggle(), "bankAccountAdvancedSearch");

    return (
        <Box bg={theme.colors.bg} color={theme.colors.primary}>
            <Toaster />
            <AdvancedSearch
                ref={advancedSearchRef}
                title="Advanced Filters"
                fields={advancedSearchFields}
                onSearch={handleAdvancedSearch}
                size="xs"
            />

            <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={2}>
                {/* FORM */}
                <GridItem>
                    <VStack
                        bg={theme.colors.formColor}
                        p={2}
                        borderRadius="xl"
                        border="1px solid #eef"

                    >
                        <Text fontSize="small" fontWeight='semibold' >
                            BANK ACCOUNT MASTER
                        </Text>

                        <DynamicForm
                            fields={getFormFields}
                            formData={form}
                            onChange={handleChange}
                            focusNext={focusNext}
                            register={register}
                            minLabelWidth="120px"
                            layout="vertical"

                        />



                        <HStack pt={2} >
                            <Button
                                size="xs"
                                colorPalette="blue"
                                loading={createMutation.isPending || updateMutation.isPending}
                                onClick={handleSave}
                            >
                                <AiOutlineSave /> {isEditing ? "Update" : "Save"}
                            </Button>

                            <Button size="xs" colorPalette="blue" onClick={() => {
                                setEditId(null)
                                setForm(EMPTY_FORM);
                                focusFirst();
                            }}>
                                <IoIosExit /> Reset
                            </Button>
                            <Button size="xs" colorPalette="blue" onClick={() => {
                                setEditId(null)
                                setForm(EMPTY_FORM);
                                router.back();
                            }}>
                                <IoIosExit /> Exit
                            </Button>
                        </HStack>
                    </VStack>
                </GridItem>

                {/* TABLE */}
                <GridItem minW={0}>
                    <Box bg={theme.colors.formColor} p={5} borderRadius="xl" border="1px solid #eef">
                        <Flex mb={2} justify="space-between" align="center" wrap="wrap" gap={3}>
                            <Text fontSize="small" fontWeight='semibold' >
                                BANK ACCOUNT LIST
                            </Text>
                            <Box display='flex' gap={1}>
                                <Box >
                                    <SearchBar
                                        searchTerm={filter}
                                        onChange={setFilter}
                                        placeholder="Search pureGold Opening"
                                        size="2xs"

                                    />
                                </Box>
                                <HStack>
                                    <Tooltip content="Advanced Filter">
                                        <Button
                                            variant="ghost"
                                            size="xs"
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
                                            size="xs"
                                            color={theme.colors.green}
                                            _hover={{ color: "black" }}
                                            onClick={() => handleExport("excel")}
                                        >
                                            <FaFileExcel />
                                        </Button>
                                    </Tooltip>
                                    <Tooltip content="Export PDF">
                                        <Button
                                            variant="ghost"
                                            size="xs"
                                            color={theme.colors.primaryText}
                                            _hover={{ color: "black" }}
                                            onClick={() => handleExport("pdf")}
                                        >
                                            <FaPrint />
                                        </Button>
                                    </Tooltip>
                                </HStack>
                            </Box>
                        </Flex>

                        <CustomTable
                            columns={tableColumns}
                            data={bankAccountList}
                            rowIdKey="ENTRYNO"
                            highlightRowId={highlightedId}
                            emptyText="No bank accounts found..."
                            bodyBg={theme.colors.bg}
                            headerBg={theme.colors.primary}
                            headerColor="white"
                            renderRow={(account) => (
                                <>
                                    <Table.Cell>{account.ENTRYNO}</Table.Cell>
                                    <Table.Cell>{account.BANKAC}</Table.Cell>
                                    <Table.Cell>{account.ACCOUNTNO}</Table.Cell>
                                    <Table.Cell>{account.ACHOLDERNAME}</Table.Cell>
                                    <Table.Cell>{account.ACCOUNTTYPE}</Table.Cell>
                                    <Table.Cell>{account.BANKNAME}</Table.Cell>
                                    <Table.Cell>{account.BRANCHNAME}</Table.Cell>
                                    {showEditIcons &&
                                        <Table.Cell>
                                            <Box display="flex" justifyContent="center">
                                                <FaEdit
                                                    cursor="pointer"
                                                    onClick={() => handleEdit(account)}
                                                    style={{
                                                        color: editId === Number(account.ENTRYNO) ? theme.colors.green : theme.colors.blue,
                                                    }}
                                                    title={editId === Number(account.ENTRYNO) ? "Currently editing" : "Edit"}
                                                />
                                            </Box>
                                        </Table.Cell>
                                    }
                                </>
                            )}
                        />
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
}

export default BankAccountMaster;