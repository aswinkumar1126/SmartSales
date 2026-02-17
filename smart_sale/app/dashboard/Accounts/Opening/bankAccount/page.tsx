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

import { useTheme } from "@/context/theme/themeContext";
import ScrollToTop from "@/component/scroll/ScrollToTop";
import { Toaster } from "@/components/ui/toaster";
import { toastLoaded, toastCreated, toastUpdated, toastError } from "@/component/toast/toast";

import { CustomTable } from "@/component/table/CustomTable";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { usePrint } from "@/context/print/usePrintContext";
import { useRouter } from "next/navigation";

import { useAllBankAccounts, useCreateBankAccount, useUpdatebankAccount } from "@/hooks/bankAccount/useBankAccount";
import { BankAccount } from "@/types/bankAccount/BankAccount";
import { bankAccountType } from "@/data/bankAccount/bankAccountTypes";
import { SelectCombobox } from "@/components/ui/selectComboBox";
import SearchBar from "@/component/search/SearchBar";

const EMPTY_FORM: BankAccount = {
    ACCOUNTNO: "",
    ACCOUNTTYPE: "",
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
    const { setData, setColumns, setShowSno ,title } = usePrint();
    const [filter, setFilter] = useState<string>('');

    const [form, setForm] = useState<BankAccount>(EMPTY_FORM);
    const [editId, setEditId] = useState<number | null>(null);
    const [highlightedId, setHighlightedId] = useState<number | null>(null);

    const { data: allBankAccountsData, refetch } = useAllBankAccounts(filter);
    const createMutation = useCreateBankAccount();
    const updateMutation = useUpdatebankAccount();

    const bankAccountList = Array.isArray(allBankAccountsData?.data) ? allBankAccountsData.data : [];

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
        { key: "actions", label: "Actions", align: "center" as const},
    ];

    return (
        <Box bg={theme.colors.primary}>
            <Toaster />

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

                        <Fieldset.Root width="100%" fontSize="small" fontWeight='semibold'>
                            <Fieldset.Content>
                                <Grid gap={2}>

                                    {/* BANK A/C */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="110px" fontSize="2xs">BANK A/C * :</Box>
                                        <CapitalizedInput
                                            field="BANKAC"
                                            value={form.BANKAC}
                                            onChange={handleChange}
                                            size="2xs"
                                        />
                                    </Box>

                                    {/* ACCOUNT NUMBER */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="110px" fontSize="2xs">ACCOUNT NUMBER * :</Box>
                                        <CapitalizedInput
                                            field="ACCOUNTNO"
                                            value={form.ACCOUNTNO}
                                            onChange={handleChange}
                                            size="2xs"
                                            type="number"
                                            max={99999999999999999999}

                                        />
                                    </Box>

                                    {/* ACCOUNT HOLDER NAME */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="110px" fontSize="2xs">ACCOUNT HOLDER NAME * :</Box>
                                        <CapitalizedInput
                                            field="ACHOLDERNAME"
                                            value={form.ACHOLDERNAME}
                                            onChange={handleChange}
                                            size="2xs"
                                        />
                                    </Box>

                                    {/* ACCOUNT TYPE */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="110px" fontSize="2xs">ACCOUNT TYPE * :</Box>
                                        <SelectCombobox
                                            value={form.ACCOUNTTYPE}
                                            onChange={(val) => handleChange("ACCOUNTTYPE", val)}
                                            editId={editId}
                                            items={bankAccountType}
                                            placeholder="Select Type"
                                        />
                                    </Box>

                                    {/* BANK NAME */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="110px" fontSize="2xs">BANK NAME * :</Box>
                                        <CapitalizedInput
                                            field="BANKNAME"
                                            value={form.BANKNAME}
                                            onChange={handleChange}
                                            size="2xs"
                                        />
                                    </Box>

                                    {/* BRANCH NAME */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="110px" fontSize="2xs">BRANCH NAME * :</Box>
                                        <CapitalizedInput
                                            field="BRANCHNAME"
                                            value={form.BRANCHNAME}
                                            onChange={handleChange}
                                            size="2xs"
                                        />
                                    </Box>

                                    {/* ADDRESS - span 2 */}
                                    <Box display="flex" alignItems="center" gap={2} >
                                        <Box minW="110px" fontSize="2xs">ADDRESS :</Box>
                                        <Textarea
                                            value={form.ADDRESS}
                                            onChange={(e) => handleChange("ADDRESS", e.target.value.toUpperCase())}
                                            fontSize="2xs"
                                            textTransform="uppercase" // optional: visual only
                                        />
                                    </Box>

                                    {/* OPENING BALANCE */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="110px" fontSize="2xs">OPENING BALANCE :</Box>
                                        <CapitalizedInput
                                            field="OPENINGBALANCE"
                                            value={form.OPENINGBALANCE}
                                            onChange={handleChange}
                                            size="2xs"
                                            type="number"
                                        />
                                    </Box>

                                    {/* REMARKS */}
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box minW="110px" fontSize="2xs">REMARKS :</Box>
                                        <CapitalizedInput
                                            field="REMARKS"
                                            value={form.REMARKS}
                                            onChange={handleChange}
                                            size="2xs"
                                        />
                                    </Box>

                                </Grid>
                            </Fieldset.Content>
                        </Fieldset.Root>



                        <HStack pt={2} >
                            <Button
                                size="xs"
                                colorPalette="blue"
                                loading={createMutation.isPending || updateMutation.isPending}
                                onClick={handleSave}
                            >
                                <AiOutlineSave /> {isEditing ? "Update" : "Save"}
                            </Button>

                            <Button size="xs" colorPalette="blue" onClick={() => {setEditId(null)
                                setForm(EMPTY_FORM);
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
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    color={theme.colors.green}
                                    _hover={{ color: "black" }}
                                    onClick={() => handleExport("excel")}
                                >
                                    <FaFileExcel />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    color={theme.colors.primaryText}
                                    _hover={{ color: "black" }}
                                    onClick={() => handleExport("pdf")}
                                >
                                    <FaPrint />
                                </Button>
                            </HStack>
                            </Box>
                        </Flex>

                        <CustomTable
                            columns={tableColumns}
                            data={bankAccountList}
                            rowIdKey="ENTRYNO"
                            highlightRowId={highlightedId}
                            emptyText="No bank accounts found..."
                            bodyBg={theme.colors.primary}
                            headerBg="blue.800"
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