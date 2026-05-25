"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Grid, GridItem, Button, HStack ,Table ,Flex ,Text} from "@chakra-ui/react";

import { DynamicForm } from "@/component/form/DynamicForm";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { CustomTable } from "@/component/table/CustomTable";
import SearchBar from "@/component/search/SearchBar";
import { toaster } from "@/components/ui/toaster";

import { getExpenseFields } from "@/config/transaction/ExpensesConfig";

import { useAllBankAccounts } from "@/hooks/apiHooks/bankAccount/useBankAccount";
import { useAllExpenses } from "@/hooks/apiHooks/expenseMast/useExpenseMaster";
import {
    useExpenseCreate,
    useExpenseUpdate,
    useGetAllExpenses,
} from "@/hooks/apiHooks/expenseOpening/useExpenseOpening";

import { useTheme } from "@/context/theme/themeContext";
import { useAuth } from "@/hooks/apiHooks/auth/useAuth";

import { formatDateForShow } from "@/utils/format/formatDateForAPI";
import { Edit2Icon } from "lucide-react";

import { useGlobalKey } from "@/components/key/useGlobalKey";
import { PureGoldMastForm } from "@/config/opening/pureGoldOpening";
import ShortcutDialog from "@/components/shortcut/ShortcutDialog";
import { useTransactionLoader } from "@/utils/loader/ResolveLoader";
import TransactionLoader from "@/component/loader/Transactionloader";

/* ---------------- TYPES ---------------- */

type ExpenseForm = {
    date: string;
    expId: string;
    bankId: string;
    cashAmt: string;
    bankAmt: string;
    chequeNo: string;
    remarks: string;
    userName?:string;
};

type FormErrors = Partial<Record<keyof ExpenseForm, string>>;

/* ---------------- INITIAL FORM ---------------- */

const today = new Date().toISOString().split("T")[0];

const initialForm: ExpenseForm = {
 
    date: today,
    expId: "",
    bankId: "",
    cashAmt: "",
    bankAmt: "",
    chequeNo: "",
    remarks: "",
    userName: ""
};

function ExpensesPage() {
    const { theme } = useTheme();
    const {user} =useAuth();
    const router = useRouter();
    console.log(user,'user');
    const {isOpen, status, title:loaderTitle, description, openLoader, resolveLoader, closeLoader} = useTransactionLoader();

    /* ---------------- STATE ---------------- */

    const [form, setForm] = useState<ExpenseForm>(initialForm);
    const [errors, setErrors] = useState<FormErrors>({});
    const [editId, setEditId] = useState<number | null>(null);
    const [highlightRowId, setHighlightRowId] = useState<number | null>(null);
    const [filter, setFilter] = useState("");

    /* ---------------- API ---------------- */

    const { data: bankAccounts } = useAllBankAccounts();
    const { data: expenses, refetch } = useGetAllExpenses();
    const { data: expenseMaster } = useAllExpenses();

    const createMutation = useExpenseCreate();
    const updateMutation = useExpenseUpdate();

    const expenseList = expenses?.data ?? [];
   
   console.log(expenseList ,'expenseList');

    /* ---------------- BANK OPTIONS ---------------- */

    const banks = useMemo(() => {
        if (!bankAccounts) return [];
        return (bankAccounts.data || []).map((b: any) => ({
            label: b.BANKNAME,
            value: String(b.ENTRYNO),
        }));
    }, [bankAccounts]);

    /* ---------------- EXPENSE TYPES ---------------- */

    const expenseTypes = useMemo(() => {
        if (!expenseMaster || expenseMaster.length === 0) return [];

        return expenseMaster.map((e: any) => ({
            label: e.expName,
            value: String(e.expId),
        }));
    }, [expenseMaster]);

    /* ---------------- FORM FIELDS ---------------- */

    const expenseFormFields = getExpenseFields({
        bank: banks,
        expense: expenseTypes,
    });


    useEffect(() => {
    if (!user) return;

    setForm((prev) => ({
        ...prev,
        userName: user.USERNAME
    }));
}, [user?.USERNAME]);

    /* ---------------- HANDLERS ---------------- */

    const handleChange = (field: string, value: any) => {
        setForm((prev) => {
            const updated = { ...prev, [field]: value };
            return updated;
        });
    };

    const resetForm = () => {
        setForm(initialForm);
        setEditId(null);
        setErrors({});
    };

    /* ---------------- EDIT ---------------- */

    const handleEdit = (row: any) => {
        setEditId(row.entryNo);

        setForm({
            date: row.date,
            expId: String(row.expId),
            bankId: String(row.bankId),
            cashAmt: String(row.cashAmt),
            bankAmt: String(row.bankAmt),
            chequeNo: row.chequeNo ?? "",
            remarks: row.remarks ?? "",
            userName : row.USERNAME ?? "",
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    /* ---------------- VALIDATION ---------------- */

    const validate = (): FormErrors => {
        const err: FormErrors = {};
   
        if (!form.date) err.date = "Date required";
        if (!form.expId) err.expId = "Expense required";

        if (!form.cashAmt && !form.bankAmt)
            err.cashAmt = "At least one amount required";
        if(form.cashAmt && !(Number(form.cashAmt) >0)){
            err.cashAmt = "cash amount required";
        }
        if (form.bankAmt && !(Number(form.bankAmt) > 0)) {
            err.bankAmt = "bank amount required";
        }
        if (form.bankAmt && !form.bankId)
            err.bankId = "Bank Account required while using bankAmt";

        return err;
    };
    /* ---------------- SUBMIT ---------------- */

    const handleSubmit = () => {
  
        const v = validate();
        console.log(v, "validation errors");
        if (Object.keys(v).length > 0) {
            setErrors(v);
            return;
        }

      

        const payload = {
            date: form.date,
            expId: Number(form.expId),
            bankId: form.bankId ? Number(form.bankId) : null,
            cashAmt: Number(form.cashAmt || 0),
            bankAmt: Number(form.bankAmt || 0),
            chequeNo: form.chequeNo,
            remarks: form.remarks,
        };

        if (editId) {
            openLoader("update",true);
            updateMutation.mutate(
                { entryNo: editId, ...payload },
                {
                    onSuccess: () => {
                        setHighlightRowId(editId);
                        resetForm();
                        refetch();
                        resolveLoader("success", "update", "", true);
                    },
                    onError: (error: any) => {
                        if(error){
                            const message = error.response.data.message ;

                            toaster.create({
                                title : 'Expense Updation Error' ,
                                description : message || 'Failed to update expense' ,
                                type:'error' ,
                                 
                            })
                        }
                        resolveLoader("error", "update", "", true);
                        console.log("Error updating expense:", error?.response?.data?.message);
                    }
                }
            );
        } else {
            openLoader("save", true);
            createMutation.mutate(payload, {
                onSuccess: (res: any) => {
                    setHighlightRowId(res?.data?.entryNo);
                    resetForm();
                    refetch();
                    resolveLoader("success", "save", "", true);
                },
                onError: (error: any) => {
                    console.log("Error creating expense:", error.message);

                    toaster.create({
                        title:'Expense Creation Error' ,
                        description : error?.response?.data?.message || 'Failed to create expense' ,
                        type:'error'
                    });
                    resolveLoader("error", "save", "", true)
                }
            });
        }
    };

    /* ---------------- ENTER NAVIGATION ---------------- */

    const formFields = expenseFormFields.map((f: any) => f.name);

    const { register, focusNext, focusFirst } = useEnterNavigation(
        formFields,
        handleSubmit
    );

    useEffect(() => {
        focusFirst();
    }, []);

    /* ---------------- HIGHLIGHT ---------------- */

    useEffect(() => {
        if (!highlightRowId) return;
        const t = setTimeout(() => setHighlightRowId(null), 2000);
        return () => clearTimeout(t);
    }, [highlightRowId]);

    /* ---------------- TABLE ---------------- */

    const columns = [
        { key: "sno", label: "S.NO" },
        { key: "date", label: "DATE" },
        { key: "expName", label: "EXPENSE" },
        { key: "cashAmt", label: "CASH" },
        { key: "bankAmt", label: "BANK" },
        {key:"userId" ,label:"MADE BY"},
        { key: "action", label: "ACTION" },
    ];
    useGlobalKey("Alt+s" , ()=>handleSubmit() , "saveTransaction");
    useGlobalKey("Alt+r", () => resetForm() ,"Reset");
    useGlobalKey("Alt+e", () => router.back(), "exit");
    useGlobalKey("Alt+u", () => handleSubmit(), "update");

    /* ---------------- UI ---------------- */

    return (
        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={2}>
            {/* FORM */}
            <GridItem>

                <TransactionLoader
                    isOpen={isOpen}
                    status={status}
                    title={loaderTitle}
                    description={description}
                    onClose={closeLoader}
                />
       
                <ShortcutDialog />

                <Box p={3} bg={theme.colors.formColor} borderRadius="lg">
                    <DynamicForm
                        fields={expenseFormFields}
                        formData={form}
                        onChange={handleChange}
                        focusNext={focusNext}
                        register={register}
                        errors={errors}
                        layout="vertical"
                    />

                    <HStack justify="center" mt={3}>
                        <Button
                            size="xs"
                            colorPalette="blue"
                            onClick={handleSubmit}
                            loading={
                                createMutation.isPending ||
                                updateMutation.isPending
                            }
                        >
                            {editId ? "Update" : "Save"}
                        </Button>

                        <Button size="xs" onClick={resetForm}>
                            Reset
                        </Button>
                        <Button size="xs" onClick={() => router.back()}>
                            Exit
                        </Button>
                    </HStack>
                </Box>
            </GridItem>

            {/* TABLE */}
            <GridItem>
                <Box p={2} bg={theme.colors.formColor} borderRadius="lg">
                    <Flex justifyContent={'space-between'} align={'center'} mb={2}>
                        <Text fontWeight={'semibold'}>
                            Expenses List 
                        </Text>
                        <Flex>
                            <SearchBar
                                searchTerm={filter}
                                onChange={setFilter}
                                placeholder="Search expense"
                                size="sm"
                                rounded="sm"
                                minWidth="200px"
                                maxWidth="250px"
                            />

                        </Flex>
                        
                    </Flex>
                    

                    <CustomTable
                        columns={columns}
                        data={expenseList}
                        rowIdKey="entryNo"
                        highlightRowId={highlightRowId}
                        emptyText="No data available"
                        headerBg={theme.colors.accient}
                        headerColor="white"
                        renderRow={(row, i) => (
                            <>
                                <Table.Cell >{i + 1}</Table.Cell>
                                <Table.Cell >{formatDateForShow(row.date)}</Table.Cell>
                                <Table.Cell >{row.expName}</Table.Cell>
                                <Table.Cell >{row.cashAmt}</Table.Cell>
                                <Table.Cell>{row.bankAmt}</Table.Cell>
                                <Table.Cell >{row.userName}</Table.Cell>
                                <Table.Cell textAlign={'center'}>
                                    <Button
                                        size="xs"
                                        onClick={() => handleEdit(row)}
                                        variant={'ghost'}
                                    >
                                        <Edit2Icon size={14} color="blue"/>
                                    </Button>
                                </Table.Cell>
                            </>
                        )}
                    />
                </Box>
            </GridItem>
        </Grid>
    );
}

export default ExpensesPage;